// Run with: node --test scripts/verify-conversion.cjs
// Exercise real TypeScript modules with fake browser/storage/network boundaries.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function harness() {
  const storage = new Map();
  const events = [];
  const handlers = new Map();
  const cache = new Map();
  const h = { storage, events, fetch: async () => { throw Error('Unexpected network call'); } };
  h.window = {
    location: { pathname: '/intent', origin: 'https://globalintentcompany.space' },
    posthog: { capture: (name, properties) => events.push({ name, properties }) },
    addEventListener: (name, fn) => { if (!handlers.has(name)) handlers.set(name, new Set()); handlers.get(name).add(fn); },
    dispatchEvent: (event) => { for (const fn of handlers.get(event.type) || []) fn(event); },
  };
  h.load = (name) => {
    const file = path.join(root, name.replace(/^@\//, '') + '.ts');
    if (cache.has(file)) return cache.get(file);
    const exports = {}; cache.set(file, exports);
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(source, {
      exports, require: h.load, window: h.window, process: { env: {} }, URL, Date, Event,
      localStorage: { getItem: k => storage.get(k) || null, setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) },
      fetch: (...args) => h.fetch(...args),
    }, { filename: file });
    return exports;
  };
  return h;
}

test('paid and enhanced choices survive signup and return to the same pricing card', () => {
  const h=harness(), c=h.load('lib/checkout-intent');
  for (const plan of ['paid','enhanced']) {
    const signup=new URL(c.signupForPlan(plan),'https://example.com');
    assert.equal(signup.searchParams.get('plan'),plan);
    assert.equal(signup.searchParams.get('signup'),'1');
    assert.equal(new URL(c.pricingForPlan(c.checkoutPlan(signup.searchParams.get('plan'))),'https://example.com').searchParams.get('plan'),plan);
  }
  assert.equal(c.checkoutPlan('https://attacker.example'),null);
  assert.equal(c.checkoutPlan('free'),null);
});

test('guest goes through authentication without starting a checkout', async () => {
  const h=harness(); assert.equal(await h.load('lib/checkout-intent').checkoutAccessToken(),null);
});

test('a valid stored token is reused without another refresh', async () => {
  const h=harness(); h.storage.set('gic-loosemouth-session',JSON.stringify({access_token:'valid-test-token',expires_at:Date.now()/1000+3600}));
  assert.equal(await h.load('lib/checkout-intent').checkoutAccessToken(),'valid-test-token');
});

test('expired session refreshes before checkout and persists the rotated token', async () => {
  const h=harness(); h.storage.set('gic-loosemouth-session',JSON.stringify({access_token:'expired-test-token',refresh_token:'refresh-fixture',expires_at:1}));
  h.fetch=async (url,options) => {
    assert.ok(url.endsWith('/auth/v1/token?grant_type=refresh_token'));
    assert.equal(JSON.parse(options.body).refresh_token,'refresh-fixture');
    return {ok:true,json:async()=>({access_token:'new-test-token',refresh_token:'rotated-fixture',expires_in:3600})};
  };
  assert.equal(await h.load('lib/checkout-intent').checkoutAccessToken(),'new-test-token');
  const stored=JSON.parse(h.storage.get('gic-loosemouth-session'));assert.equal(stored.access_token,'new-test-token');assert.ok(stored.expires_at>Date.now()/1000);
});

test('rejected refresh returns to authentication; temporary failure preserves the session', async () => {
  const h=harness(); const saved=JSON.stringify({access_token:'test',refresh_token:'fixture',expires_at:1});
  h.storage.set('gic-loosemouth-session',saved);h.fetch=async()=>({ok:false,status:401});
  assert.equal(await h.load('lib/checkout-intent').checkoutAccessToken(),null);assert.ok(!h.storage.has('gic-loosemouth-session'));
  h.storage.set('gic-loosemouth-session',saved);h.fetch=async()=>({ok:false,status:503});
  await assert.rejects(()=>h.load('lib/checkout-intent').checkoutAccessToken(),/try again/);
  assert.equal(h.storage.get('gic-loosemouth-session'),saved);
});

test('conversion events wait for privacy resolution and never bypass paid opt-out', () => {
  const h=harness(),privacy=h.load('lib/workspace-privacy'),tracking=h.load('lib/conversion-events');
  tracking.trackConversion('gic_answer_received',{access:'guest'});assert.equal(h.events.length,0);
  privacy.setWorkspaceAnalytics(false);assert.equal(h.events.length,0);
  tracking.trackConversion('gic_checkout_started',{plan:'paid'});assert.equal(h.events.length,0);
  privacy.setWorkspaceAnalytics(true);assert.equal(h.events.length,0,'opted-out queue must not replay');
  tracking.trackConversion('gic_auth_success',{method:'email',email:'PRIVATE_FIXTURE',password:'PRIVATE_FIXTURE',prompt:'PRIVATE_FIXTURE'});
  assert.equal(h.events.length,1);assert.equal(JSON.stringify(h.events).includes('PRIVATE_FIXTURE'),false);
  assert.equal(h.events[0].properties.method,'email');
  privacy.setWorkspaceAnalytics(null);assert.equal(privacy.analyticsAllowed(),false);
});

test('analytics outages cannot block a successful signup or checkout', () => {
  const h=harness();h.load('lib/workspace-privacy').setWorkspaceAnalytics(true);h.window.posthog.capture=()=>{throw Error('SDK failure')};
  assert.doesNotThrow(()=>h.load('lib/conversion-events').trackConversion('gic_checkout_started',{plan:'enhanced'}));
});
