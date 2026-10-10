const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(relative) {
 if(cache.has(relative)) return cache.get(relative).exports;
 const file = path.join(root, relative);
 const source = fs.readFileSync(file, 'utf8');
 const js = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{}};cache.set(relative,mod);
 const context={module:mod,exports:mod.exports,require:(name)=>name.startsWith('./')?load(path.join(path.dirname(relative),name+'.ts')):require(name)};
 vm.runInNewContext(js,context,{filename:file});
 return mod.exports;
}
const {routeIntent}=load('lib/intent-r-orchestrator.ts');
test('routes ordinary research to INTENT-R',()=>assert.equal(routeIntent('Explain recurrent attention','paid').agent,'intent_r'));
test('routes images and spectra to BitVision',()=>assert.equal(routeIntent('Analyze a mass spectrum','paid').agent,'bitvision'));
test('routes infrastructure to PLM',()=>assert.equal(routeIntent('Review server firewall rules','enhanced').agent,'plm'));
test('explicit selection wins',()=>assert.equal(routeIntent('Analyze a diagram','paid','plm').agent,'plm'));
test('free users cannot route',()=>assert.equal(routeIntent('Review infrastructure','free'),null));
test('rejects invalid explicit agent',()=>assert.equal(routeIntent('Hi','paid','__proto__'),null));
test('flags potentially consequential actions',()=>assert.equal(routeIntent('Deploy my server','paid').requiresConfirmation,true));
test('does not flag ordinary questions',()=>assert.equal(routeIntent('What is attention?','paid').requiresConfirmation,false));
test('rejects oversized input',()=>assert.equal(routeIntent('x'.repeat(4001),'paid'),null));
