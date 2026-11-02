/** Server-only read boundary; no scientific implementation or SQLite access. */
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { importPKCS8, SignJWT } from 'jose';

export type ResearchReaderConfig = {
  enabled: boolean;
  serviceOrigin: string;
  issuer: string;
  audience: string;
  keyId: string;
  privateKey: string;
};
export type ResearchReaderDependencies = {
  authenticate(request: Request): Promise<{ id?: string } | null>;
  accountAccess(userId: string): Promise<boolean | null>;
  fetch: typeof fetch;
  /** Only the explicit synthetic qualification harness may use loopback HTTP. */
  allowLoopbackHTTP?: boolean;
};

const PREFIX = '/api/virtual-lab/research/';
const MAX_BYTES = 1024 * 1024;
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const fail = (error: string, status: number) => Response.json({ error }, { status, headers });

function queryFields(parts: string[]): string[] | null {
  const id = (s: string) => /^[A-Za-z0-9_-]{1,100}$/.test(s);
  if (parts.length === 1 && parts[0] === 'projects') return [];
  if (parts[0] !== 'instances' || !id(parts[1] || '') || parts[2] !== 'projects' || !id(parts[3] || '')) return null;
  if (parts.length === 5 && parts[4] === 'changes') return ['sequence', 'limit'];
  if (parts[4] !== 'experiments') return null;
  if (parts.length === 5) return ['offset', 'limit'];
  if (!id(parts[5] || '')) return null;
  if (parts.length === 6) return [];
  if (parts[6] === 'campaigns') {
    if (parts.length === 7) return ['offset', 'limit'];
    if (!id(parts[7] || '')) return null;
    if (parts.length === 8) return [];
    return parts.length === 9 && parts[8] === 'results' ? [] : null;
  }
  if (parts[6] !== 'observations') return null;
  if (parts.length === 7) return ['offset', 'limit'];
  if (parts.length !== 9 || !id(parts[7] || '') || !['report', 'spectrum'].includes(parts[8])) return null;
  return parts[8] === 'spectrum' ? ['offset', 'limit'] : [];
}

async function boundedBytes(response: Response): Promise<Uint8Array> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Missing upstream response');
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BYTES) throw new Error('Upstream response limit');
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  return Buffer.concat(chunks, length);
}

export function createResearchReader(config: ResearchReaderConfig, dependencies: ResearchReaderDependencies) {
  return async (request: Request): Promise<Response> => {
    if (!config.enabled) return fail('RESEARCH_READER_DISABLED', 503);
    if (request.method !== 'GET') return fail('READ_ONLY_REQUEST_REQUIRED', 405);
    const url = new URL(request.url);
    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin) return fail('ORIGIN_REJECTED', 403);
    if (!url.pathname.startsWith(PREFIX) || url.pathname.length > 2048 || url.search.length > 2048) return fail('NOT_FOUND', 404);
    const parts = url.pathname.slice(PREFIX.length).split('/');
    const allowed = queryFields(parts);
    if (!allowed) return fail('NOT_FOUND', 404);
    for (const [key, value] of url.searchParams) {
      const maximum = parts.at(-1) === 'spectrum' ? 500 : 100;
      if (!allowed.includes(key) || url.searchParams.getAll(key).length !== 1 || !/^[0-9]{1,16}$/.test(value) ||
          (key === 'limit' && (Number(value) < 1 || Number(value) > maximum))) return fail('INVALID_QUERY', 400);
    }
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ') || authorization.length > 8192) return fail('UNAUTHENTICATED', 401);
    if (request.body !== null) return fail('READ_ONLY_REQUEST_REQUIRED', 400);
    try {
      const me = await dependencies.authenticate(request);
      if (!me?.id || !/^[A-Za-z0-9_-]{1,200}$/.test(me.id)) return fail('UNAUTHENTICATED', 401);
      const access = await dependencies.accountAccess(me.id);
      if (access === null) return fail('ACCESS_UNAVAILABLE', 503);
      if (!access) return fail('ACCOUNT_ACCESS_REQUIRED', 403);
      const service = new URL(config.serviceOrigin);
      const loopback = service.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(service.hostname);
      if ((service.protocol !== 'https:' && !(dependencies.allowLoopbackHTTP && loopback)) ||
          service.username || service.password || service.pathname !== '/' || service.search || service.hash ||
          !config.issuer.startsWith('https://') || !config.audience || !/^[A-Za-z0-9_-]{1,80}$/.test(config.keyId)) {
        return fail('RESEARCH_SERVICE_UNAVAILABLE', 503);
      }
      const key = await importPKCS8(config.privateKey, 'RS256');
      const token = await new SignJWT({})
        .setProtectedHeader({ alg: 'RS256', kid: config.keyId, typ: 'JWT' })
        .setIssuer(config.issuer).setAudience(config.audience).setSubject(me.id)
        .setIssuedAt().setExpirationTime('60s').setJti(randomUUID()).sign(key);
      const target = new URL('/v1/' + parts.join('/'), service);
      target.search = url.search;
      const upstream = await dependencies.fetch(target, {
        method: 'GET', cache: 'no-store', redirect: 'error',
        headers: { Authorization: 'Bearer ' + token, 'X-VirtualLab-Surface': 'web', Accept: 'application/json' },
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(10_000)]),
      });
      if (upstream.status === 404 || upstream.status === 403) return fail('NOT_FOUND', 404);
      if (!upstream.ok) return fail('RESEARCH_SERVICE_UNAVAILABLE', 503);
      if (!upstream.headers.get('content-type')?.startsWith('application/json')) return fail('INVALID_SERVICE_RESPONSE', 502);
      const body = await boundedBytes(upstream);
      const expected = upstream.headers.get('x-content-sha256') || '';
      const actual = createHash('sha256').update(body).digest();
      if (!/^[a-f0-9]{64}$/.test(expected) || !timingSafeEqual(actual, Buffer.from(expected, 'hex'))) return fail('REPORT_INTEGRITY', 502);
      // Preserve exact upstream bytes so web, MCP and paired clients can compare.
      return new Response(Buffer.from(body), { headers: { ...headers, 'Content-Type': 'application/json', 'X-Content-SHA256': expected } });
    } catch {
      // No provider exceptions, tokens, PEMs or internal hosts in responses/logs.
      return fail('RESEARCH_SERVICE_UNAVAILABLE', 503);
    }
  };
}
