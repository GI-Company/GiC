const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { NextRequest } = require('next/server');
const modulePath = 'app/api/virtual-lab/mcp/route.ts';
const active = load(modulePath, { VLAB_PUBLIC_MCP_ENABLED: 'true' });
function request(body, headers = {}) {
  return new NextRequest('https://globalintentcompany.space/api/virtual-lab/mcp', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}
async function call(method, params = {}, id = 1) {
  const response = await active.POST(request({ jsonrpc: '2.0', id, method, params }));
  return { response, data: await response.json() };
}
test('public service stays disabled without its separate flag', async () => {
  assert.equal((await load(modulePath).POST(request({ jsonrpc: '2.0', id: 1, method: 'initialize' }))).status, 503);
});
test('initialization advertises only fixed-reference tools', async () => {
  const { response, data } = await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'qualification', version: '1' } });
  assert.equal(response.status, 200); assert.equal(data.result.protocolVersion, '2025-11-25');
  assert.equal(data.result.serverInfo.name, 'global-intent-virtuallab-free');
  const listed = (await call('tools/list')).data.result.tools;
  assert.deepEqual(Array.from(listed, t => t.name), ['describe_free_virtual_lab', 'run_public_reference', 'verify_public_reference']);
  for (const tool of listed) {
    for (const key of ['readOnlyHint','destructiveHint','openWorldHint']) assert.equal(typeof tool.annotations[key], 'boolean');
    assert.equal(tool.inputSchema.additionalProperties, false);
  }
});
test('notifications do not execute a tool and JSON SSE GET is explicitly unsupported', async () => {
  const notification = await active.POST(request({ jsonrpc: '2.0', method: 'tools/call', params: { name: 'run_public_reference', arguments: { preset: 'stimulus' } } }));
  assert.equal(notification.status, 202); assert.equal(await notification.text(), '');
  assert.equal((await active.GET()).status, 405);
});
for (const preset of ['stimulus','mrna_decay','protein_decay']) test('reproduces and verifies fixed preset: ' + preset, async () => {
  const run = (await call('tools/call', { name: 'run_public_reference', arguments: { preset } })).data;
  const payload = JSON.parse(run.result.content[0].text);
  assert.equal(payload.mode, 'SIMULATED'); assert.equal(payload.scientificValidation, 'NOT ESTABLISHED');
  assert.equal(payload.results.length, 3); assert.match(payload.sha256, /^[a-f0-9]{64}$/);
  const again = JSON.parse((await call('tools/call', { name: 'run_public_reference', arguments: { preset } })).data.result.content[0].text);
  assert.equal(again.sha256, payload.sha256);
  const valid = JSON.parse((await call('tools/call', { name: 'verify_public_reference', arguments: { preset, sha256: payload.sha256 } })).data.result.content[0].text);
  assert.equal(valid.matches, true);
  const wrong = JSON.parse((await call('tools/call', { name: 'verify_public_reference', arguments: { preset, sha256: '0'.repeat(64) } })).data.result.content[0].text);
  assert.equal(wrong.matches, false);
});
test('rejects invalid JSON, versions, content types, Accept and browser origins', async () => {
  for (const [body, headers, status] of [
    ['{invalid', {}, 400], [{ jsonrpc: '2.0', id: 1, method: 'ping' }, { 'MCP-Protocol-Version': '2000-01-01' }, 400],
    [{}, { 'Content-Type': 'text/plain' }, 415], [{}, { Accept: 'application/json' }, 406],
    [{}, { Origin: 'https://attacker.invalid' }, 403], ['x'.repeat(4097), {}, 413],
  ]) assert.equal((await active.POST(request(body, headers))).status, status);
});
for (const name of ['get_private_project','train_intent','start_instrument','purchase_subscription']) test('private/commerce operation is not a public tool: ' + name, async () => {
  const { data } = await call('tools/call', { name, arguments: {} }); assert.equal(data.error.code, -32601);
});
test('rejects arbitrary model input, prototype keys and extra grant-like fields', async () => {
  for (const args of [{ preset: '__proto__' }, { preset: 'stimulus', code: 'arbitrary' },
    { preset: 'stimulus', project_id: 'private' }, { preset: 'stimulus', subscription: 'laboratory' }]) {
    const { data } = await call('tools/call', { name: 'run_public_reference', arguments: args }); assert.equal(data.error.code, -32602);
  }
});
