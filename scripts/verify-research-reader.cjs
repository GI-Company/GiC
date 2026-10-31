const test = require('node:test');
const assert = require('node:assert/strict');
const { generateKeyPairSync, createHash } = require('node:crypto');
const { importSPKI, jwtVerify } = require('jose');
const load = require('./load-typescript.cjs');

const { createResearchReader } = load('lib/virtual-lab-research-reader.ts');
const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
const privateKey = pair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const publicKey = pair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
const config = { enabled: true, serviceOrigin: 'https://research.invalid', issuer: 'https://globalintentcompany.space',
  audience: 'virtuallab-research-service', keyId: 'qualification', privateKey };
const body = Buffer.from('{"format":"virtuallab-service-ms-report-v1","epistemic_state":"UNKNOWN"}\n');
const digest = createHash('sha256').update(body).digest('hex');
const prefix = '/api/virtual-lab/research/';
const report = 'instances/instance-a/projects/project-a/experiments/experiment-a/observations/observation-a/report';
function request(route = report, options = {}) {
  return new Request('https://globalintentcompany.space' + prefix + route, {
    headers: { Authorization: 'Bearer synthetic-website-session', ...options.headers }, ...options,
  });
}
function fixture(overrides = {}, settings = {}) {
  const calls = [];
  const dependencies = {
    authenticate: async () => ({ id: 'synthetic-user-a' }), accountAccess: async () => true,
    fetch: async (url, init) => { calls.push({ url: String(url), init }); return new Response(body, {
      headers: { 'Content-Type': 'application/json', 'X-Content-SHA256': digest, 'Set-Cookie': 'never-forward-this' },
    }); }, ...overrides,
  };
  return { calls, read: createResearchReader({ ...config, ...settings }, dependencies) };
}

test('server-issued identity token and exact report bytes cross the boundary', async () => {
  const { read, calls } = fixture();
  const response = await read(request(report, { headers: { Authorization: 'Bearer synthetic-website-session',
    'X-VirtualLab-Surface': 'chatgpt', 'X-User-Id': 'attacker' } }));
  assert.equal(response.status, 200);
  assert.equal(await response.text(), body.toString());
  assert.equal(response.headers.get('x-content-sha256'), digest);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal(calls[0].url, 'https://research.invalid/v1/' + report);
  const token = calls[0].init.headers.Authorization.slice(7);
  const key = await importSPKI(publicKey, 'RS256');
  const { payload, protectedHeader } = await jwtVerify(token, key, { issuer: config.issuer, audience: config.audience, algorithms: ['RS256'] });
  assert.equal(payload.sub, 'synthetic-user-a');
  assert.equal(payload.exp - payload.iat, 60);
  assert.ok(payload.jti);
  assert.equal(protectedHeader.kid, config.keyId);
  assert.equal(payload.subscription, undefined);
  assert.equal(calls[0].init.headers['X-VirtualLab-Surface'], 'web');
  assert.equal(calls[0].init.redirect, 'error');
  assert.ok(!token.includes('synthetic-website-session'));
});
test('disabled gate makes no identity or network calls', async () => {
  const { read, calls } = fixture({ authenticate: () => { throw Error('must not run'); } }, { enabled: false });
  assert.equal((await read(request())).status, 503); assert.equal(calls.length, 0);
});
for (const route of ['jobs/123', 'instances/a/projects/b/import', report + '/extra', report + '?subscription=laboratory',
  report + '?token=bad', 'projects?limit=10', report.replace('project-a', '..')]) {
  test('rejects non-allowlisted request: ' + route, async () => {
    const { read, calls } = fixture();
    assert.ok([400,404].includes((await read(request(route))).status)); assert.equal(calls.length, 0);
  });
}
for (const [name, changes, expected] of [
  ['invalid account', { authenticate: async () => null }, 401],
  ['no entitlement', { accountAccess: async () => false }, 403],
  ['unavailable entitlement', { accountAccess: async () => null }, 503],
]) test(name + ' cannot contact the service', async () => {
  const { read, calls } = fixture(changes);
  assert.equal((await read(request())).status, expected); assert.equal(calls.length, 0);
});
test('client flags do not bypass server access checks', async () => {
  const { read, calls } = fixture({ accountAccess: async () => false });
  assert.equal((await read(request(report, { headers: { Authorization: 'Bearer synthetic-session',
    'X-Subscription': 'laboratory', 'X-User-Id': 'synthetic-user-a' } }))).status, 403);
  assert.equal(calls.length, 0);
});
test('mutations and cross-origin requests are rejected', async () => {
  const { read, calls } = fixture();
  assert.equal((await read(request(report, { method: 'POST', body: '{}' }))).status, 405);
  assert.equal((await read(request(report, { headers: { Origin: 'https://attacker.invalid' } }))).status, 403);
  assert.equal(calls.length, 0);
});
test('account access is re-evaluated for every call', async () => {
  let allowed = true;
  const { read, calls } = fixture({ accountAccess: async () => allowed });
  assert.equal((await read(request())).status, 200); allowed = false;
  assert.equal((await read(request())).status, 403); assert.equal(calls.length, 1);
});
test('service project revocation stays denied', async () => {
  const { read } = fixture({ fetch: async () => new Response('private diagnostics', { status: 404 }) });
  const response = await read(request());
  assert.equal(response.status, 404); assert.ok(!(await response.text()).includes('private diagnostics'));
});
for (const origin of ['http://research.invalid', 'https://user:pass@research.invalid', 'https://research.invalid/private',
  'https://research.invalid/?token=bad']) test('rejects unsafe service configuration: ' + origin, async () => {
  const { read, calls } = fixture({}, { serviceOrigin: origin });
  assert.equal((await read(request())).status, 503); assert.equal(calls.length, 0);
});
test('changed bytes cannot retain an accepted checksum', async () => {
  const { read } = fixture({ fetch: async () => new Response('altered', { headers: {
    'Content-Type': 'application/json', 'X-Content-SHA256': digest,
  } }) });
  assert.equal((await read(request())).status, 502);
});
test('oversized upstream response is never forwarded', async () => {
  const { read } = fixture({ fetch: async () => new Response('x'.repeat(1024 * 1024 + 1), {
    headers: { 'Content-Type': 'application/json', 'X-Content-SHA256': digest },
  }) });
  assert.equal((await read(request())).status, 503);
});
test('project discovery and bounded change polling use the same token boundary', async () => {
  const { read, calls } = fixture();
  assert.equal((await read(request('projects'))).status, 200);
  assert.equal((await read(request('instances/a/projects/b/changes?sequence=123&limit=2'))).status, 200);
  assert.equal(calls[1].url, 'https://research.invalid/v1/instances/a/projects/b/changes?sequence=123&limit=2');
  assert.equal((await read(request('instances/a/projects/b/changes?limit=101'))).status, 400);
  assert.equal((await read(request('instances/a/projects/b/changes?limit=1&limit=2'))).status, 400);
});

test('production route verifies GIC identity and preserves qualifying legacy access', async () => {
  const env = { VLAB_RESEARCH_READER_ENABLED: 'true', VLAB_RESEARCH_SERVICE_ORIGIN: config.serviceOrigin,
    VLAB_RESEARCH_ISSUER: config.issuer, VLAB_RESEARCH_AUDIENCE: config.audience,
    VLAB_RESEARCH_KEY_ID: config.keyId, VLAB_RESEARCH_SIGNING_KEY: privateKey,
    NEXT_PUBLIC_SUPABASE_URL: 'https://identity.invalid', SUPABASE_SECRET_KEY: 'synthetic-service-role',
  };
  let tier = 'paid', upstreamCalls = 0;
  const fetch = async (target, init) => {
    const url = new URL(String(target));
    if (url.pathname === '/auth/v1/user') {
      assert.equal(init.headers.Authorization, 'Bearer synthetic-website-session');
      return Response.json({ id: 'synthetic-user-a', user_metadata: { user_id: 'attacker', subscription: 'laboratory' } });
    }
    if (url.pathname.endsWith('/loosemouth_billing_entitlements')) {
      assert.equal(url.searchParams.get('user_id'), 'eq.synthetic-user-a');
      return Response.json([{ tier, subscription_status: 'active' }]);
    }
    if (url.pathname.endsWith('/virtual_lab_billing_entitlements')) return Response.json([]);
    assert.equal(url.origin, config.serviceOrigin);
    const key = await importSPKI(publicKey, 'RS256');
    const verified = await jwtVerify(init.headers.Authorization.slice(7), key, { audience: config.audience, issuer: config.issuer });
    assert.equal(verified.payload.sub, 'synthetic-user-a'); upstreamCalls++;
    return new Response(body, { headers: { 'Content-Type': 'application/json', 'X-Content-SHA256': digest } });
  };
  const { GET } = load('app/api/virtual-lab/research/[...path]/route.ts', env, fetch);
  assert.equal((await GET(request())).status, 200);
  tier = 'free';
  assert.equal((await GET(request())).status, 403);
  assert.equal(upstreamCalls, 1);
});

test('VirtualLab entitlement requires a recognized tier and active/trial status', () => {
  const { isActiveVirtualLab } = load('lib/virtual-lab-billing.ts');
  for (const tier of ['researcher','laboratory']) {
    for (const subscription_status of ['active','trialing']) assert.equal(isActiveVirtualLab({ tier, subscription_status }), true);
    for (const subscription_status of ['canceled','past_due','incomplete','unpaid']) assert.equal(isActiveVirtualLab({ tier, subscription_status }), false);
  }
  for (const tier of ['free','paid','enhanced','administrator',undefined]) assert.equal(isActiveVirtualLab({ tier, subscription_status: 'active' }), false);
  assert.equal(isActiveVirtualLab(null), false);
});
