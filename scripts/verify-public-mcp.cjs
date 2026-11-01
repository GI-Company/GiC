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
  assert.deepEqual(Array.from(listed, t => t.name), ['describe_free_virtual_lab', 'run_public_reference', 'verify_public_reference', 'verify_public_report']);
  for (const tool of listed) {
    for (const key of ['readOnlyHint','destructiveHint','openWorldHint']) assert.equal(typeof tool.annotations[key], 'boolean');
    assert.equal(tool.inputSchema.additionalProperties, false);
    if (tool.name !== 'describe_free_virtual_lab') assert.equal(tool.annotations.readOnlyHint, false);
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
  assert.equal(valid.reportVerified, false); assert.match(valid.verified, /CANONICAL PRESET/);
  const wrong = JSON.parse((await call('tools/call', { name: 'verify_public_reference', arguments: { preset, sha256: '0'.repeat(64) } })).data.result.content[0].text);
  assert.equal(wrong.matches, false);
});
async function tool(name, args) {
  const { response, data } = await call('tools/call', { name, arguments: args });
  assert.equal(response.status, 200);
  assert.equal(data.error, undefined, JSON.stringify(data.error));
  return JSON.parse(data.result.content[0].text);
}
const presets = ['stimulus', 'mrna_decay', 'protein_decay'];
for (const preset of presets) test('complete report detects altered numbers, text, metadata and self-rehashed content: ' + preset, async () => {
  const artifact = await tool('run_public_reference', { preset });
  const check = artifact => tool('verify_public_report', { preset, artifact });
  const valid = await check(artifact);
  assert.equal(valid.matches, true); assert.equal(valid.reportVerified, true); assert.equal(valid.signed, false);
  const { canonicalJson } = load('lib/virtual-lab-demo.ts');
  for (const mutate of [
    a => { a.results[1].finalProtein = 999999; },
    a => { a.report = a.report.replace('SIMULATED', 'MEASURED'); },
    a => { a.protocol.duration = 25; },
    a => { a.scientificValidation = 'VALIDATED'; },
    a => { a.mode = 'MEASURED'; },
  ]) {
    const changed = structuredClone(artifact); mutate(changed);
    const result = await check(changed);
    assert.equal(result.matches, false); assert.equal(result.digestMatches, false); assert.equal(result.canonicalMatches, false);
    const { reportSha256, ...content } = changed;
    changed.reportSha256 = require('node:crypto').createHash('sha256').update(canonicalJson(content)).digest('hex');
    const rehashed = await check(changed);
    assert.equal(rehashed.digestMatches, true); assert.equal(rehashed.canonicalMatches, false); assert.equal(rehashed.matches, false);
  }
  const reordered = Object.fromEntries(Object.entries(artifact).reverse());
  assert.equal((await check(reordered)).matches, true);
  assert.equal((await check({ ...artifact, reportSha256: '0'.repeat(64) })).matches, false);
  // All actual complete artifacts fit the fixed 4 KiB byte budget when returned as tool input.
  assert.ok(Buffer.byteLength(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'verify_public_report', arguments: { preset, artifact } } })) < 4096);
});
test('canonical digests remain stable, accept uppercase, reject all cross-preset substitutions and preserve the shared baseline', async () => {
  const expected = {
    stimulus: '986d65484f7902365a01a51368f3bf413dfa0c197b266a5d2404c3802c7d1cc0',
    mrna_decay: '1b6dd24db3b63f46372f0de03827e7c4fdf9741210e729e6cc54e37108946b52',
    protein_decay: '3b081286b29237d978e876517f8a4a3305bb65a5fb3d78f77935d0247c9c2ba6',
  };
  const outputs = {};
  for (const preset of presets) {
    outputs[preset] = await tool('run_public_reference', { preset });
    assert.equal(outputs[preset].sha256, expected[preset]);
    assert.equal((await tool('verify_public_reference', { preset, sha256: expected[preset].toUpperCase() })).matches, true);
    for (const other of presets.filter(p => p !== preset)) {
      assert.equal((await tool('verify_public_reference', { preset, sha256: expected[other] })).matches, false);
      assert.equal((await tool('verify_public_report', { preset, artifact: await tool('run_public_reference', { preset: other }) })).matches, false);
    }
  }
  const baseline = outputs.stimulus.results.find(r => r.value === 1);
  for (const [preset, value] of [['mrna_decay', 0.5], ['protein_decay', 0.1]]) {
    const result = outputs[preset].results.find(r => r.value === value);
    assert.equal(result.finalMrna, baseline.finalMrna); assert.equal(result.finalProtein, baseline.finalProtein);
  }
});
test('raw server independently rejects adversarial tool arguments without relying on ChatGPT validation', async () => {
  for (const args of [{}, { preset: '../../../private/lab' }, { preset: 'stimulus; touch /tmp/should-not-run' },
    { preset: 'stimulus', project_id: 'private' }, { preset: ['stimulus'] }, null]) {
    assert.equal((await call('tools/call', { name: 'run_public_reference', arguments: args })).data.error.code, -32602);
  }
  for (const sha256 of ['', 'not-a-digest', 'g'.repeat(64), 'a'.repeat(63), 123, null]) {
    assert.equal((await call('tools/call', { name: 'verify_public_reference', arguments: { preset: 'stimulus', sha256 } })).data.error.code, -32602);
  }
  const artifact = await tool('run_public_reference', { preset: 'stimulus' });
  for (const invalid of [null, [], {}, { ...artifact, project_id: 'private' }, { ...artifact, results: [] }, { ...artifact, report: { nested: [] } }]) {
    assert.equal((await call('tools/call', { name: 'verify_public_report', arguments: { preset: 'stimulus', artifact: invalid } })).data.error.code, -32602);
  }
});
test('bounded reader stops on bytes, even without a truthful length header, and cancels unread content', async () => {
  const { readPublicMcpBody } = load('lib/virtual-lab-mcp-body.ts');
  async function stream(chunks, headers = {}) {
    let reads = 0, cancelled = false;
    const body = new ReadableStream({
      pull(controller) { reads++; const chunk = chunks.shift(); if (chunk) controller.enqueue(chunk); else controller.close(); },
      cancel() { cancelled = true; },
    }, { highWaterMark: 0 });
    const req = new Request('https://www.globalintentcompany.space/api/virtual-lab/mcp', { method: 'POST', body, duplex: 'half', headers });
    const result = await readPublicMcpBody(req);
    return { result, reads, cancelled };
  }
  for (const headers of [{}, { 'Content-Length': '1' }]) {
    const checked = await stream([new Uint8Array(2048), new Uint8Array(2049), new Uint8Array(100000)], headers);
    assert.equal(checked.result.status, 413); assert.equal(checked.reads, 2); assert.equal(checked.cancelled, true);
  }
  // 2,049 two-byte characters passed the previous character-count check.
  const multibyte = await stream([new TextEncoder().encode('é'.repeat(2049))]);
  assert.equal(multibyte.result.status, 413);
  const declared = await stream([new Uint8Array(100000)], { 'Content-Length': '100000' });
  assert.equal(declared.result.status, 413); assert.equal(declared.reads, 0); assert.equal(declared.cancelled, true);
  assert.equal((await stream([new Uint8Array([0xff])])).result.status, 400);
  assert.equal((await stream([new Uint8Array(2)], { 'Content-Length': '3' })).result.status, 400);
  assert.equal((await stream([], { 'Content-Length': 'invalid' })).result.status, 400);
  assert.equal((await stream([], { 'Content-Encoding': 'gzip' })).result.status, 415);
  const encoded = new TextEncoder().encode('"µM"');
  const split = await stream([encoded.slice(0, 2), encoded.slice(2)]);
  assert.equal(split.result.text, '"µM"');
  assert.equal((await stream([new Uint8Array(4096)])).result.ok, true);
});
test('route rejects streaming oversized UTF-8, compressed and misleading media types before dispatch', async () => {
  for (const [body, headers, expected] of [
    ['é'.repeat(2049), {}, 413], ['{}', { 'Content-Encoding': 'gzip' }, 415],
    ['{}', { 'Content-Type': 'application/json-malformed' }, 415],
  ]) assert.equal((await active.POST(request(body, headers))).status, expected);
});
test('stalled or failed streams and aborted requests terminate without a tool call', async () => {
  const { readPublicMcpBody } = load('lib/virtual-lab-mcp-body.ts');
  let cancelled = false;
  const stream = new ReadableStream({ cancel() { cancelled = true; } }, { highWaterMark: 0 });
  const req = new Request('https://example.invalid', { method: 'POST', body: stream, duplex: 'half' });
  assert.equal((await readPublicMcpBody(req, 10)).status, 408); assert.equal(cancelled, true);
  const abort = new AbortController();
  const pending = new Request('https://example.invalid', { method: 'POST', body: new ReadableStream(), duplex: 'half', signal: abort.signal });
  const reading = readPublicMcpBody(pending); abort.abort();
  assert.equal((await reading).status, 400);
  const failed = new Request('https://example.invalid', { method: 'POST', body: new ReadableStream({ start(c) { c.error(Error('broken')); } }), duplex: 'half' });
  assert.equal((await readPublicMcpBody(failed)).status, 400);
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
