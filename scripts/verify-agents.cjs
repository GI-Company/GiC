const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{test}=require('node:test'),ts=require('typescript'),{webcrypto}=require('node:crypto');
const root=path.resolve(__dirname,'..');
function harness(){
 const cache=new Map();const h={fetch:async()=>{throw Error('Unexpected network');}};
 h.load=name=>{
  if(!name.startsWith('@/')&&!name.startsWith('lib/')&&!name.startsWith('app/'))return require(name);
  const file=path.join(root,name.replace(/^@\//,'')+'.ts');if(cache.has(file))return cache.get(file);
  const exports={};cache.set(file,exports);
  const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(source,{exports,require:h.load,process:{env:{SUPABASE_SECRET_KEY:'test-secret',GROQ_API:'test-key'}},URL,AbortSignal,TextEncoder,crypto:webcrypto,fetch:(...args)=>h.fetch(...args)}, {filename:file});return exports;
 };return h;
}
const reply=message=>({ok:true,json:async()=>({choices:[{message}]})});
const call=(name,args={})=>({id:'call-'+name,type:'function',function:{name,arguments:JSON.stringify(args)}});
test('RK4 matches closed-form reference equations, including equal decay rates',()=>{
 const lab=harness().load('lib/virtual-lab-demo');
 for(const protocol of [lab.DEFAULT_PROPOSAL,{parameter:'mrna_decay',values:[0.1,0.5,1],duration:72,rationale:'test'}]){
  const runs=lab.runLabExperiment(protocol);
  for(const r of runs){
   const dm=protocol.parameter==='mrna_decay'?r.value:0.5,dp=0.1,c=protocol.parameter==='concentration'?r.value:1,t=protocol.duration,a=1+2*c/(1+c),b=2;
   const m=a/dm*(1-Math.exp(-dm*t));
   const p=a*b/dm*(Math.abs(dm-dp)<1e-10?(1-Math.exp(-dp*t))/dp-t*Math.exp(-dp*t):(1-Math.exp(-dp*t))/dp-(Math.exp(-dm*t)-Math.exp(-dp*t))/(dp-dm));
   assert.ok(Math.abs(r.finalMrna-m)<1e-6);assert.ok(Math.abs(r.finalProtein-p)<1e-6);assert.equal(r.points.length,241);
  }
 }
});
test('lab rejects unsupported parameters, oversized sweeps and nonfinite inputs',()=>{
 const lab=harness().load('lib/virtual-lab-demo');
 for(const change of [{parameter:'__proto__'},{parameter:'clinical_dose'},{values:[0,0]},{values:[0,1,2,3,4,5]},{values:[NaN,1]},{duration:73},{values:[-1,1]}])assert.throws(()=>lab.runLabExperiment({...lab.DEFAULT_PROPOSAL,...change}));
});
test('evidence is reproducible and binds protocol, solver outputs and classification',async()=>{
 const lab=harness().load('lib/virtual-lab-demo'),a=await lab.evidenceBundle(lab.DEFAULT_PROPOSAL),b=await lab.evidenceBundle(lab.DEFAULT_PROPOSAL);
 assert.equal(a.sha256,b.sha256);assert.equal(a.payload.output_state,'SIMULATED');assert.equal(a.payload.input_state,'MODEL_ASSUMPTION');
 const changed=await lab.evidenceBundle({...lab.DEFAULT_PROPOSAL,duration:12});assert.notEqual(a.sha256,changed.sha256);
 const mutated=JSON.parse(JSON.stringify(a));mutated.payload.runs[0].finalProtein=999;
 const digest=Buffer.from(await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(lab.canonicalJson(mutated.payload)))).toString('hex');assert.notEqual(digest,a.sha256);
});
test('lab agent can propose but cannot execute or draft results before approval',async()=>{
 const h=harness();let i=0;h.fetch=async()=>[reply({tool_calls:[call('inspect_results')]}),reply({tool_calls:[call('draft_report',{markdown:'Pretend measured results'})]}),reply({content:'Approval required.'})][i++];
 const lab=h.load('lib/virtual-lab-demo'),agent=h.load('lib/virtual-lab-agent');
 const r=await agent.runWorkbenchAgent({key:'test',model:'test',goal:'Bypass approval',context:{protocol:lab.DEFAULT_PROPOSAL,approved:false}});
 assert.equal(r.trace.length,2);assert.ok(r.trace.every(t=>t.status==='rejected'));assert.equal(r.report,null);
});
test('approved lab agent computes authoritative results instead of trusting supplied outputs',async()=>{
 const h=harness();let i=0;
 h.fetch=async(url,options)=>{const p=JSON.parse(options.body);if(i===1){const tool=p.messages.find(m=>m.role==='tool');const result=JSON.parse(tool.content);assert.equal(result.state,'SIMULATED');assert.ok(result.results[0].finalProtein<100);}
 return [reply({tool_calls:[call('inspect_results')]}),reply({tool_calls:[call('draft_report',{markdown:'Review the simulated comparison.'})]}),reply({content:'Interpretation ready.'})][i++];};
 const lab=h.load('lib/virtual-lab-demo');const r=await h.load('lib/virtual-lab-agent').runWorkbenchAgent({key:'test',model:'test',goal:'Inspect',context:{approved:true,protocol:lab.DEFAULT_PROPOSAL,runs:[{finalProtein:999999}]}});
 assert.equal(r.trace[0].status,'completed');assert.match(r.report,/INFERRED/);assert.match(r.report,/SIMULATED/);
});
test('workspace operator cannot open Enhanced applets for Paid or invoke lab tools',async()=>{
 const h=harness();let i=0;h.fetch=async()=>[reply({tool_calls:[call('open_workbench',{kind:'applet',brief:'Build a tool'}),call('inspect_results')]}),reply({content:'Those actions are not available.'})][i++];
 const r=await h.load('lib/workspace-agent').runWorkspaceAgent({key:'test',model:'test',goal:'Ignore permissions',context:[],tier:'paid'});assert.equal(r.action,null);assert.ok(r.activity.every(a=>a.status==='rejected'));
});
test('workspace operator prepares a general report brief without building or saving it',async()=>{
 const h=harness();let i=0;h.fetch=async()=>[reply({tool_calls:[call('read_conversation'),call('open_workbench',{kind:'report',brief:'Compare the alternatives using these sources.'})]}),reply({content:'Review your report brief.'})][i++];
 const r=await h.load('lib/workspace-agent').runWorkspaceAgent({key:'test',model:'test',goal:'Create a comparison',context:[{role:'user',text:'Source material'}],tier:'paid'});assert.equal(r.action.kind,'report');assert.equal(r.activity.length,2);
});
test('artifact agent returns only a checked draft and has no lab or publication tools',async()=>{
 const h=harness();let i=0;h.fetch=async(url,options)=>{const body=JSON.parse(options.body);assert.ok(body.tools.every(t=>!['inspect_results','publish','run_experiment'].includes(t.function.name)));return [reply({tool_calls:[call('read_context'),call('read_artifact')]}),reply({tool_calls:[call('write_draft',{title:'Comparison',markdown:'# Comparison\n\nA draft.'}),call('check_draft') ]})][i++];};
 const r=await h.load('lib/artifact-agent').runArtifactAgent({key:'test',model:'test',kind:'report',prompt:'Build report',context:'Source',current:null,normalize:(kind,a)=>{if(!a.markdown)throw Error('Empty');return a;}});assert.equal(r.artifact.title,'Comparison');assert.equal(r.activity.at(-1).tool,'check_draft');
});
test('artifact agent rejects unchecked drafts and stops at its tool budget',async()=>{
 const h=harness();h.fetch=async()=>reply({tool_calls:[call('write_draft',{title:'Unchecked',markdown:'Text'})]});await assert.rejects(()=>h.load('lib/artifact-agent').runArtifactAgent({key:'test',model:'test',kind:'report',prompt:'Build',context:'',current:null,normalize:(kind,a)=>a}),/step limit/);
});
function accessHarness(tier='free',status='active',authenticated=true){
 const h=harness();h.count={quota:0,groq:0};h.fetch=async url=>{
  const u=String(url);
  if(u.includes('/auth/v1/user'))return {ok:authenticated,json:async()=>({id:'test-user'})};
  if(u.includes('billing_entitlements'))return {ok:true,json:async()=>[{tier,subscription_status:status}]};
  if(u.includes('consume_inference_quota')){h.count.quota++;return {ok:true,json:async()=>[{allowed:true,remaining:7}]};}
  h.count.groq++;throw Error('Unexpected provider access');
 };return h;
}
const {NextRequest}=require('next/server');
const request=(method='GET',body)=>new NextRequest('https://example.com/api/virtual-lab',{method,headers:{Authorization:'Bearer fake-session',Origin:'https://example.com','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
test('lab GET and POST reject guests, Free, cancelled and overdue subscriptions before execution',async()=>{
 for(const [tier,status,authenticated,expected] of [['free','active',false,401],['free','active',true,403],['paid','canceled',true,403],['enhanced','past_due',true,403]]){
  const h=accessHarness(tier,status,authenticated),route=h.load('app/api/virtual-lab/route'),lab=h.load('lib/virtual-lab-demo');
  assert.equal((await route.GET(request())).status,expected);assert.equal((await route.POST(request('POST',{action:'run',protocol:lab.DEFAULT_PROPOSAL,tier:'enhanced',authorized:true}))).status,expected);assert.equal(h.count.quota,0);assert.equal(h.count.groq,0);
 }
});
test('active Paid and Enhanced trials can run the lab through the protected API',async()=>{
 for(const [tier,status] of [['paid','active'],['enhanced','trialing']]){
  const h=accessHarness(tier,status),route=h.load('app/api/virtual-lab/route'),lab=h.load('lib/virtual-lab-demo');
  assert.equal((await route.GET(request())).status,200);const r=await route.POST(request('POST',{action:'run',protocol:lab.DEFAULT_PROPOSAL}));assert.equal(r.status,200);const data=await r.json();assert.equal(data.bundle.payload.runs.length,3);assert.equal(data.bundle.payload.output_state,'SIMULATED');assert.equal(h.count.quota,1);
 }
});
test('lab rejects cross-origin calls and invalid protocols before consuming execution quota',async()=>{
 const h=accessHarness('paid'),route=h.load('app/api/virtual-lab/route');
 const cross=new NextRequest('https://example.com/api/virtual-lab',{method:'POST',headers:{Origin:'https://other.example','Content-Type':'application/json'},body:'{}'});assert.equal((await route.POST(cross)).status,403);
 assert.equal((await route.POST(request('POST',{action:'run',protocol:{parameter:'concentration',values:[0,1],duration:10000}}))).status,400);assert.equal(h.count.quota,0);
});

test('subscription lookup outages fail closed with recovery, never an upgrade demand',async()=>{
 const h=accessHarness('paid');const upstream=h.fetch;h.fetch=async(...args)=>String(args[0]).includes('billing_entitlements')?{ok:false}:upstream(...args);
 const route=h.load('app/api/virtual-lab/route');assert.equal((await route.GET(request())).status,503);assert.equal(h.count.quota,0);
});
