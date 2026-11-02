const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const load = require('./load-typescript.cjs');
const { studioTierFromEntitlement, studioAvailability, studioModules, cockpitSections } =
  load('lib/virtual-lab-studio.ts');

test('legacy GIC entitlements retain Researcher workbench but never become Laboratory', () => {
  for (const tier of ['researcher','paid','enhanced']) {
    assert.equal(studioTierFromEntitlement(tier), 'researcher', tier);
  }
  assert.equal(studioTierFromEntitlement('laboratory'), 'laboratory');
  for (const tier of [undefined, null, 'free', 'admin', 'LABORATORY', {tier:'laboratory'}]) {
    assert.equal(studioTierFromEntitlement(tier), 'free');
  }
});

test('Free can run reference science without elevated privileges', () => {
  assert.equal(studioAvailability('free','overview',false), 'open');
  assert.equal(studioAvailability('free','free',false), 'open');
  assert.equal(studioAvailability('free','desktop',false), 'open');
  for (const module of studioModules.filter(m => !['overview','free','desktop'].includes(m.id))) {
    assert.equal(studioAvailability('free',module.id,true), 'upgrade', module.id);
  }
});

test('Researcher scientific tools are available; Laboratory planner requires a real Laboratory tier', () => {
  for (const section of cockpitSections) {
    assert.equal(studioAvailability('researcher',section,false), 'open', section);
    assert.equal(studioAvailability('laboratory',section,false), 'open', section);
  }
  assert.equal(studioAvailability('researcher','laboratory',true), 'upgrade');
  assert.equal(studioAvailability('laboratory','laboratory',false), 'open');
});

test('Private project viewer is gated by the independently configured reader', () => {
  for (const tier of ['researcher','laboratory']) {
    assert.equal(studioAvailability(tier,'projects',false), 'service-off');
    assert.equal(studioAvailability(tier,'projects',true), 'open');
  }
});

test('catalog has unique entries and tiered supported tools', () => {
  const ids=studioModules.map(item=>item.id);
  assert.equal(new Set(ids).size,ids.length);
  assert.ok(ids.includes('simulation') && ids.includes('mass') && ids.includes('notebook'));
  assert.ok(ids.includes('projects') && ids.includes('laboratory'));
});

test('the actual /virtual-lab/demo page uses the unified studio entry and server feature flag', () => {
  const root=path.join(__dirname,'..');
  const page=fs.readFileSync(path.join(root,'app/virtual-lab/demo/page.tsx'),'utf8');
  const access=fs.readFileSync(path.join(root,'components/virtual-lab/VirtualLabAccess.tsx'),'utf8');
  const studio=fs.readFileSync(path.join(root,'components/virtual-lab/VirtualLabStudio.tsx'),'utf8');
  assert.match(page, /<VirtualLabAccess privateReaderEnabled=/);
  assert.match(page, /VLAB_RESEARCH_READER_ENABLED/);
  assert.match(access, /studioTierFromEntitlement\(data\.tier\)/);
  assert.match(access, /<VirtualLabStudio /);
  assert.match(studio, /<ScientificCockpit /);
  assert.match(studio, /<VirtualLabFreeWorkbench/);
  assert.match(studio, /<ResearchWorkspace/);
  assert.match(studio, /<LaboratoryPilotPlanner/);
  assert.match(studio, /setWorkspaceAnalytics\(false\)/);
});
