const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{test}=require('node:test'),ts=require('typescript'),{webcrypto}=require('node:crypto');
const root=path.resolve(__dirname,'..');
function harness(){
 const cache=new Map();const h={fetch:async()=>{throw Error('Unexpected network');}};
 h.load=name=>{
  if(!name.startsWith('@/')&&!name.startsWith('lib/')&&!name.startsWith('app/'))return require(name);
  const file=path.join(root,name.replace(/^@\//,'')+'.ts');if(cache.has(file))return cache.get(file);
  const exports={};cache.set(file,exports);
  const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(source,{exports,require:h.load,process:{env:{SUPABASE_SECRET_KEY:'test-secret',GEMINI_API_KEY:'test-key'}},URL,AbortSignal,TextEncoder,crypto:webcrypto,fetch:(...args)=>h.fetch(...args)}, {filename:file});return exports;
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
 const h=harness();h.count={quota:0,provider:0};h.fetch=async url=>{
  const u=String(url);
  if(u.includes('/auth/v1/user'))return {ok:authenticated,json:async()=>({id:'test-user'})};
  if(u.includes('billing_entitlements'))return {ok:true,json:async()=>[{tier,subscription_status:status}]};
  if(u.includes('consume_inference_quota')){h.count.quota++;return {ok:true,json:async()=>[{allowed:true,remaining:7}]};}
  h.count.provider++;throw Error('Unexpected provider access');
 };return h;
}
const {NextRequest}=require('next/server');
const request=(method='GET',body)=>new NextRequest('https://example.com/api/virtual-lab',{method,headers:{Authorization:'Bearer fake-session',Origin:'https://example.com','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
test('lab GET and POST reject guests, Free, cancelled and overdue subscriptions before execution',async()=>{
 for(const [tier,status,authenticated,expected] of [['free','active',false,401],['free','active',true,403],['paid','canceled',true,403],['enhanced','past_due',true,403]]){
  const h=accessHarness(tier,status,authenticated),route=h.load('app/api/virtual-lab/route'),lab=h.load('lib/virtual-lab-demo');
  assert.equal((await route.GET(request())).status,expected);assert.equal((await route.POST(request('POST',{action:'run',protocol:lab.DEFAULT_PROPOSAL,tier:'enhanced',authorized:true}))).status,expected);assert.equal(h.count.quota,0);assert.equal(h.count.provider,0);
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

test('editing a lab protocol invalidates only its approval, not the prior results',()=>{
 const lab=harness().load('lib/virtual-lab-demo'),approved=lab.DEFAULT_PROPOSAL;
 const prior=lab.runLabExperiment(approved);
 assert.equal(lab.isApprovedProtocol({...approved},approved),true);
 for(const change of [{duration:48},{values:[0,2,10]},{parameter:'protein_decay',values:[0.05,0.1,0.5]},{rationale:'Different experiment rationale'}])assert.equal(lab.isApprovedProtocol({...approved,...change},approved),false);
 assert.equal(lab.isApprovedProtocol(approved,null),false);assert.equal(lab.isApprovedProtocol({duration:999},approved),false);
 assert.equal(prior.length,3);assert.equal(prior[0].points.at(-1).time,24);
});

test('RHO RK4 trajectories match closed forms for the three linear protein pools',()=>{
 const rho=harness().load('lib/virtual-lab-rhodopsin');
 for(const preset of Object.values(rho.RHO_PRESETS)){
  const r=rho.runRhodopsin(preset.protocol),p=r.protocol,d=p.defect*(1-.72*p.chaperone),fold=.45*(1-d),misfold=.38*d,kn=fold+misfold+.1*p.clearance,steady=p.synthesis/kn;
  for(const point of r.points){
   const t=point.time,n=steady+(1-steady)*Math.exp(-kn*t);
   const pool=(rate,input,initial)=>initial*Math.exp(-rate*t)+input*steady*(1-Math.exp(-rate*t))/rate+input*(1-steady)*(Math.exp(-kn*t)-Math.exp(-rate*t))/(rate-kn);
   assert.ok(Math.abs(point.nascent-n)<1e-7);
   assert.ok(Math.abs(point.aggregate-pool(p.clearance,misfold,.1))<1e-7);
   assert.ok(Math.abs(point.mature-pool(.08,fold,.2))<1e-7);
   assert.ok(point.stress>=0&&Number.isFinite(point.stress));
  }
  assert.equal(r.points.length,241);assert.ok(r.matureFraction>=0&&r.matureFraction<=1);
 }
});
test('RHO rejects unsupported rates and binds assumptions into reproducible evidence',async()=>{
 const rho=harness().load('lib/virtual-lab-rhodopsin'),p=rho.RHO_PRESETS.p23h.protocol;
 for(const change of [{synthesis:NaN},{defect:1},{chaperone:-1},{clearance:0},{duration:100},{duration:null}])assert.throws(()=>rho.runRhodopsin({...p,...change}));
 const a=await rho.rhoEvidence(p),b=await rho.rhoEvidence(p),c=await rho.rhoEvidence({...p,chaperone:.5});
 assert.equal(a.sha256,b.sha256);assert.notEqual(a.sha256,c.sha256);assert.equal(a.payload.output_state,'SIMULATED');
 assert.ok(rho.runRhodopsin(rho.RHO_PRESETS.rescue.protocol).matureFraction>rho.runRhodopsin(p).matureFraction);
});
test('synthetic optics are deterministic, bounded, and respond to illumination',()=>{
 const optics=harness().load('lib/virtual-lab-optics'),settings={exposure:25,laser:65,gain:1};
 const a=optics.simulateOpticalFrame(settings,1),b=optics.simulateOpticalFrame(settings,1),dark=optics.simulateOpticalFrame({...settings,laser:0},2),saturated=optics.simulateOpticalFrame({exposure:100,laser:100,gain:8},3);
 assert.equal(JSON.stringify(a),JSON.stringify(b));assert.equal(a.pixels.length,64*48);assert.equal(a.epistemic_state,'SIMULATED');assert.ok(a.pixels.every(v=>Number.isInteger(v)&&v>=0&&v<=255));
 assert.ok(dark.pixels.every(v=>v===4));assert.ok(a.statistics.mean>dark.statistics.mean);assert.ok(saturated.statistics.saturated>0);
 for(const settings of [{exposure:0,laser:10,gain:1},{exposure:2,laser:101,gain:1},{exposure:2,laser:10,gain:Infinity}])assert.throws(()=>optics.simulateOpticalFrame(settings,1));
});
test('ledger checks actual artifact bytes, genesis, missing artifacts and chain ordering',async()=>{
 const ledger=harness().load('lib/virtual-lab-ledger'),entries=[{state:'SIMULATED',value:1},{state:'UNKNOWN',value:2}];
 const pristine=await ledger.createEvidenceLedger(entries);assert.equal((await ledger.verifyEvidenceLedger(pristine)).valid,true);
 assert.equal(pristine.root,(await ledger.createEvidenceLedger(entries)).root);
 const change=fn=>{const b=JSON.parse(JSON.stringify(pristine));fn(b);return b;};
 assert.equal((await ledger.verifyEvidenceLedger(change(b=>b.artifacts[0].content+=' '))).code,'HASH_MISMATCH');
 assert.equal((await ledger.verifyEvidenceLedger(change(b=>b.events[0].previousHash='changed'))).code,'CHAIN_MISMATCH');
 assert.equal((await ledger.verifyEvidenceLedger(change(b=>b.artifacts.pop()))).code,'MISSING_ARTIFACT');
 assert.equal((await ledger.verifyEvidenceLedger(change(b=>b.events.reverse()))).code,'CHAIN_MISMATCH');
 assert.equal((await ledger.verifyEvidenceLedger(change(b=>b.root='wrong'))).valid,false);
 for(const input of [null,[],{}, {format:'gic-evidence-ledger-v1',artifacts:[null],events:[]}])assert.equal((await ledger.verifyEvidenceLedger(input)).valid,false);
});
test('RHO API retains subscription gates, input validation, quotas and simulated evidence',async()=>{
 for(const [tier,authenticated,expected] of [['free',false,401],['free',true,403],['paid',true,200]]){
  const h=accessHarness(tier,'active',authenticated),rho=h.load('lib/virtual-lab-rhodopsin'),route=h.load('app/api/virtual-lab/route');
  const response=await route.POST(request('POST',{action:'rho_run',protocol:rho.RHO_PRESETS.p23h.protocol}));
  assert.equal(response.status,expected);assert.equal(h.count.quota,expected===200?1:0);assert.equal(h.count.provider,0);
  if(response.ok)assert.equal((await response.json()).bundle.payload.output_state,'SIMULATED');
 }
 const h=accessHarness('paid'),route=h.load('app/api/virtual-lab/route'),rho=h.load('lib/virtual-lab-rhodopsin');
 assert.equal((await route.POST(request('POST',{action:'rho_run',protocol:{...rho.RHO_PRESETS.p23h.protocol,clearance:Infinity}}))).status,400);assert.equal(h.count.quota,0);
 const upstream=h.fetch;h.fetch=async(...args)=>String(args[0]).includes('consume_inference_quota')?{ok:true,json:async()=>[{allowed:false,remaining:0}]}:upstream(...args);
 assert.equal((await route.POST(request('POST',{action:'rho_run',protocol:rho.RHO_PRESETS.p23h.protocol}))).status,429);
});
