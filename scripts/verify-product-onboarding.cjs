const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{test}=require('node:test'),{spawnSync}=require('node:child_process'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function load(name,cache=new Map()) {
  if(!name.startsWith('@/')&&!name.startsWith('lib/'))return require(name);
  const file=path.join(root,name.replace(/^@\//,'')+'.ts');if(cache.has(file))return cache.get(file);
  const exports={};cache.set(file,exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>load(n,cache),URLSearchParams,Date},{filename:file});return exports;
}
function storage(){const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};}
test('prompt handoff is model-scoped, consumed once and expires without putting text in URLs',()=>{
  const p=load('lib/product-onboarding'),s=storage();p.saveEntryPrompt(s,'facts500','  draft <script> $HOME  ',1000);
  assert.equal(p.takeEntryPrompt(s,'standard',1001),'');assert.equal(p.takeEntryPrompt(s,'facts500',1001),'draft <script> $HOME');assert.equal(p.takeEntryPrompt(s,'facts500',1002),'');
  p.saveEntryPrompt(s,'standard','expired',1000);assert.equal(p.takeEntryPrompt(s,'standard',601001),'');
  p.saveEntryPrompt(s,'standard','future',1000);assert.equal(p.takeEntryPrompt(s,'standard',999),'');
  assert.throws(()=>p.saveEntryPrompt(s,'standard','x'.repeat(8001)));assert.throws(()=>p.saveEntryPrompt(s,'standard','  '));
});
test('malformed or blocked storage cannot crash prompt restoration',()=>{
  const p=load('lib/product-onboarding'),s=storage();s.setItem(p.ENTRY_PROMPT_KEY,'{bad');assert.equal(p.takeEntryPrompt(s,'standard'),'');
  assert.equal(p.takeEntryPrompt({getItem(){throw Error('blocked')}},'facts500'),'');
});
test('copied cURL and Python preserve hostile shell text and Unicode as prompt data',()=>{
  const p=load('lib/product-onboarding'),payload=p.miniRequest('sft1000',"quotes ' \" $(touch /private/tmp/never-create-gic) `id` $HOME\n🧪 café",0.25,80,8),examples=p.inferenceExamples(payload);
  const checked=spawnSync('python3',['-c',`import sys,json,shlex,ast\nx=json.loads(sys.stdin.read())\nargs=shlex.split(x['curl'])\npayload=json.loads(args[args.index('--data-raw')+1])\nassert payload==x['payload']\nmodule=ast.parse(x['python'])\nassignment=next(n for n in module.body if isinstance(n,ast.Assign))\nparsed=json.loads(ast.literal_eval(assignment.value.args[0]))\nassert parsed==x['payload']\nprint('examples valid')`],{input:JSON.stringify({...examples,payload}),encoding:'utf8'});
  assert.equal(checked.status,0,checked.stderr);assert.match(checked.stdout,/examples valid/);assert.ok(!examples.curl.includes('Authorization'));assert.ok(!examples.python.includes('HF_TOKEN'));
  const data=load('lib/intent-hf-stream').inferenceInput(payload);assert.equal(data[4],'sft1000');
});
test('RHO and optical links round-trip only bounded numeric settings',()=>{
  const share=load('lib/lab-sharing');
  for(const input of [{tool:'rho',settings:{synthesis:1.2,defect:.82,chaperone:0,clearance:.24,duration:48,accessToken:'never-share'}},{tool:'optics',settings:{exposure:25,laser:65,gain:1,secret:'never-share'}}]){
    const hash=share.labSettingsHash(input);assert.ok(!hash.includes('never-share'));const result=share.parseLabSettings(hash);assert.equal(result.tool,input.tool);assert.equal(Object.keys(result.settings).length,input.tool==='rho'?5:3);assert.equal(share.labSettingsHash(result),hash);
  }
});
test('shared settings reject malformed, unknown, duplicate, nonfinite and out-of-range inputs',()=>{
  const share=load('lib/lab-sharing');
  for(const hash of ['#lab=v2&tool=optics&exposure=25&laser=65&gain=1','#lab=v1&tool=optics&exposure=25&laser=65&gain=999','#lab=v1&tool=optics&exposure=NaN&laser=65&gain=1','#lab=v1&tool=optics&exposure=25&laser=65&gain=1&gain=2','#lab=v1&tool=optics&exposure=25&laser=65&gain=1&approved=true','#lab=v1&tool=rho&duration=48','#lab=v1&tool=__proto__','x'.repeat(513)])assert.equal(share.parseLabSettings(hash),null,hash);
});
test('settings survive same-tab authentication without saving credentials or approval',()=>{
  const share=load('lib/lab-sharing'),s=storage(),hash=share.labSettingsHash({tool:'optics',settings:{exposure:25,laser:65,gain:2}});
  share.rememberLabSettings(s,hash,1000);assert.equal(share.takeLabSettings(s,'',1001).settings.gain,2);assert.equal(share.takeLabSettings(s,'',1002),null);
  share.rememberLabSettings(s,hash,1000);assert.equal(share.takeLabSettings(s,'',601001),null);
  assert.equal(share.takeLabSettings({getItem(){throw Error('blocked')}},hash).settings.gain,2);
});
