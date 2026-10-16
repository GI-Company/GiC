const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../lib/research-agent-registry.ts'),'utf8');
const registry={};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:registry});
test('only paid members can select research agents',()=>{
 for(const id of ['intent_r','bitvision','plm']){
  assert.equal(registry.getResearchAgent(id,'guest'),null);
  assert.equal(registry.getResearchAgent(id,'free'),null);
  assert.equal(registry.getResearchAgent(id,'paid').id,id);
  assert.equal(registry.getResearchAgent(id,'enhanced').id,id);
 }
});
test('reject unknown and prototype-inherited agent names',()=>{
 for(const id of ['__proto__','constructor','toString','unknown',null,{},[]])
  assert.equal(registry.getResearchAgent(id,'enhanced'),null);
});
test('research agents identify their external inference providers',()=>{
 for(const id of ['intent_r','bitvision','plm']){
  const a=registry.getResearchAgent(id,'paid');
  assert.match(a.instructions,/external/i);
  assert.equal(a.provider,'gemini');
 }
});
