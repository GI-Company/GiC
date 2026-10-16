const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{test}=require('node:test'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function harness({token='hf_test_private',allowed=true,configured=true}={}) {
  const cache=new Map(), h={calls:[],quota:0,fetch:async()=>{throw Error('Unexpected fetch');}};
  h.load=name=>{
    if(name==='@/lib/workbench-access')return {consumeWorkbenchQuota:async()=>{h.quota++;return {allowed,configured};}};
    if(!name.startsWith('@/')&&!name.startsWith('lib/')&&!name.startsWith('app/'))return require(name);
    const file=path.join(root,name.replace(/^@\//,'')+'.ts');if(cache.has(file))return cache.get(file);
    const exports={};cache.set(file,exports);
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
      {exports,require:h.load,process:{env:{HF_TOKEN:token}},URL,AbortSignal,AbortController,TextEncoder,TextDecoder,ReadableStream,Response,setTimeout,clearTimeout,fetch:(...args)=>{h.calls.push(args);return h.fetch(...args);}}, {filename:file});return exports;
  };return h;
}
const {NextRequest}=require('next/server');
const payload={message:'Hello',checkpoint:'facts500'};
function req(body=payload,origin='https://gic.test'){return new NextRequest('https://gic.test/api/intent/mini',{method:'POST',headers:{origin,'content-type':'application/json','x-forwarded-for':'192.0.2.1'},body:JSON.stringify(body)});}
function stream(parts){const enc=new TextEncoder();return new ReadableStream({start(c){for(const p of parts)c.enqueue(typeof p==='string'?enc.encode(p):p);c.close();}});}
function upstream(h,parts){h.fetch=async(_url,init)=>init.method==='POST'?Response.json({event_id:'abc123'}):new Response(stream(parts),{headers:{'content-type':'text/event-stream'}});}
test('both checkpoints send private HF auth on POST and GET and stream cumulative Unicode text',async()=>{
  for(const checkpoint of ['facts500','sft1000']){
    const h=harness();upstream(h,['event: heartbeat\ndata: null\n\n','event: generating\ndata: ["Hi"]\n\n','event: complete\ndata: ["Hi 🧪"]\n\n']);
    const r=await h.load('app/api/intent/mini/route').POST(req({...payload,checkpoint}));assert.equal(r.status,200);
    const output=await r.text(),events=output.trim().split('\n').map(JSON.parse);
    assert.equal(events.at(-1).text,'Hi 🧪');assert.equal(events.at(-1).done,true);assert.equal(h.calls.length,2);
    for(const [url,init] of h.calls){assert.equal(init.headers.Authorization,'Bearer hf_test_private');assert.ok(!url.includes('hf_test_private'));}
    const submitted=JSON.parse(h.calls[0][1].body);assert.deepEqual(submitted.data,['Hello',9,80,96,checkpoint]);assert.ok(!h.calls[0][1].body.includes('hf_test_private'));assert.ok(!output.includes('hf_test_private'));
  }
});
test('SSE handles arbitrary byte splits, CRLF and UTF-8 boundaries',async()=>{
  const bytes=new TextEncoder().encode('event: generating\r\ndata: ["🧪"]\r\n\r\nevent: complete\ndata: ["done"]\n\n');
  const parts=Array.from(bytes,b=>new Uint8Array([b]));const events=[];
  for await(const event of harness().load('lib/intent-hf-stream').gradioEvents(stream(parts)))events.push(event);
  assert.equal(events.length,2);assert.equal(JSON.parse(events[0].data)[0],'🧪');assert.equal(events[1].event,'complete');
});
test('missing tokens, cross-origin requests and invalid inputs never consume shared HF quota',async()=>{
  const missing=harness({token:''});assert.equal((await missing.load('app/api/intent/mini/route').POST(req())).status,503);assert.equal(missing.quota,0);
  const h=harness(),route=h.load('app/api/intent/mini/route');assert.equal((await route.POST(req(payload,'https://evil.test'))).status,403);
  for(const change of [{checkpoint:'unknown'},{temperature:11},{topK:1.2},{maxTokens:129},{message:'x'.repeat(8001)}])assert.equal((await route.POST(req({...payload,...change}))).status,400);
  assert.equal(h.quota,0);assert.equal(h.calls.length,0);
});
test('persistent quota denies exhausted callers and unconfigured deployments before inference',async()=>{
  for(const [config,status] of [[{allowed:false},429],[{configured:false},503]]){const h=harness(config);assert.equal((await h.load('app/api/intent/mini/route').POST(req())).status,status);assert.equal(h.calls.length,0);}
});
test('origin validation supports incoming custom hostnames without allowing other origins',async()=>{
  const h=harness({token:''}),route=h.load('app/api/intent/mini/route');
  const request=new NextRequest('http://localhost:3012/api/intent/mini',{method:'POST',headers:{host:'127.0.0.1:3012',origin:'http://127.0.0.1:3012','content-type':'application/json'},body:JSON.stringify(payload)});
  assert.equal((await route.POST(request)).status,503);
});
test('upstream quota and authentication errors are safe and never echo credentials',async()=>{
  for(const status of [401,403,429]){const h=harness();h.fetch=async()=>new Response('hf_test_private',{status});const r=await h.load('app/api/intent/mini/route').POST(req());assert.equal(r.status,status===429?429:502);const body=await r.text();assert.match(body,status===429?/quota/:/authentication/);assert.ok(!body.includes('hf_test_private'));}
  const h=harness();upstream(h,['event: error\ndata: "ZeroGPU quota exceeded hf_test_private"\n\n']);const text=await (await h.load('app/api/intent/mini/route').POST(req())).text();assert.match(text,/quota/);assert.ok(!text.includes('hf_test_private'));
});
test('truncated or malformed upstream streams surface errors instead of successful completion',async()=>{
  for(const parts of [['event: generating\ndata: ["partial"]\n\n'],['event: complete\ndata: invalid\n\n']]){const h=harness();upstream(h,parts);const text=await (await h.load('app/api/intent/mini/route').POST(req())).text();assert.match(text,/"error"/);assert.ok(!text.includes('"done":true'));}
});
test('disconnect aborts the upstream fetch',async()=>{
  const h=harness();let signal;h.fetch=async(_url,init)=>{signal=init.signal;return init.method==='POST'?Response.json({event_id:'abc'}):new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('event: heartbeat\ndata: null\n\n'));},cancel(){}}));};
  const r=await h.load('app/api/intent/mini/route').POST(req());await r.body.cancel();assert.equal(signal.aborted,true);
});
