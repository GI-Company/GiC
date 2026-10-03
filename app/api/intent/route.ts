import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase-public';
import { buildCalculatorAgentMessage, calculatorRoutingMetadata, routeMathIntent } from '@/lib/intent-math-router';

export const runtime = 'nodejs';

const jsonHeaders = { 'Cache-Control': 'no-store' };

async function consumeQuota(actorKey: string) {
  const baseUrl = SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !secret) return { allowed: false, remaining: 0, resetAt: null as string | null, configured: false };

  try {
    const response = await fetch(new URL('/rest/v1/rpc/consume_inference_quota', baseUrl), {
      method: 'POST',
      headers: {
        apikey: secret,
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_actor_key: actorKey, p_limit: 20, p_window_seconds: 3600 }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return { allowed: false, remaining: 0, resetAt: null as string | null, configured: true };
    const data: unknown = await response.json();
    const row = Array.isArray(data) ? data[0] : null;
    if (!row || typeof row !== 'object') return { allowed: false, remaining: 0, resetAt: null as string | null, configured: true };
    const result = row as Record<string, unknown>;
    return {
      allowed: result.allowed === true,
      remaining: Number(result.remaining ?? 0),
      resetAt: typeof result.reset_at === 'string' ? result.reset_at : null,
      configured: true,
    };
  } catch {
    return { allowed: false, remaining: 0, resetAt: null as string | null, configured: true };
  }
}

function backend(url: string | undefined, key: string | undefined) {
  if (!url || !key) return null;
  try {
    const baseUrl = new URL(url);
    if (baseUrl.protocol !== 'https:' || baseUrl.username || baseUrl.password) return null;
    return { baseUrl, apiKey: key };
  } catch {
    return null;
  }
}

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: jsonHeaders });
}

async function authenticatedUser(request: NextRequest): Promise<{ id: string; email?: string } | null> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: authorization,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return null;
    const user = await response.json() as { id?: string; email?: string; email_confirmed_at?: string | null };
    if (!user.id || !user.email_confirmed_at) return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const user = await authenticatedUser(request);
  if (!user) return error('Sign in with a confirmed account to use LooseMouth.', 401);
  const gateway = backend(process.env.INTENT_API_URL, process.env.INTENT_API_KEY);
  const native = backend(process.env.NATIVE_INTENT_API_URL, process.env.NATIVE_INTENT_API_KEY);
  if (!gateway && !native) return error('INTENT is not connected yet.', 503);

  const check = async (target: NonNullable<typeof gateway>) => {
    try {
      const response = await fetch(new URL('/v1/models', target.baseUrl), {
        headers: { Authorization: `Bearer ${target.apiKey}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      });
      return response.ok ? await response.json() as unknown : null;
    } catch {
      return null;
    }
  };
  const [gatewayData, nativeData] = await Promise.all([
    gateway ? check(gateway) : Promise.resolve(null),
    native ? check(native) : Promise.resolve(null),
  ]);
  if (!gatewayData && !nativeData) return error('Model availability is temporarily unknown.', 502);
  const gatewayEntries = gatewayData && typeof gatewayData === 'object' && 'models' in gatewayData && Array.isArray(gatewayData.models) ? gatewayData.models : [];
  const models = [];
  if (native ? nativeData : gatewayEntries.some((entry: unknown) => entry && typeof entry === 'object' && 'id' in entry && entry.id === 'native')) models.push('native');
  const enhanced = [...gatewayEntries, ...(gateway?.baseUrl.origin === native?.baseUrl.origin && nativeData && typeof nativeData === 'object' && 'models' in nativeData && Array.isArray(nativeData.models) ? nativeData.models : [])].find((entry: unknown) => entry && typeof entry === 'object' && 'id' in entry && entry.id === 'intentR-402');
  if (enhanced) models.push('intentR-402');
  const enhancedSearch = enhanced && typeof enhanced === 'object' && 'web_search' in enhanced && enhanced.web_search === true;
  const enhancedMaxTokens = enhanced && typeof enhanced === 'object' && 'max_output_tokens' in enhanced && enhanced.max_output_tokens === 512 ? 512 : 160;
  return NextResponse.json({
    models,
    enhancedSearch,
    enhancedMaxTokens,
    researchProfiles: {
      quick: { maxQueries: 2, maxPages: 3, maxHops: 1, maxSources: 6 },
      deep: { maxQueries: 4, maxPages: 6, maxHops: 2, maxSources: 12 },
    },
  }, { headers: jsonHeaders });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return error('Cross-origin requests are not allowed.', 403);
  }
  const user = await authenticatedUser(request);
  if (!user) return error('Sign in with a confirmed account to use LooseMouth.', 401);
  const contentType = request.headers.get('content-type')?.toLowerCase() || '';
  if (!contentType.startsWith('application/json')) return error('Expected JSON.', 415);
  if (Number(request.headers.get('content-length') || 0) > 4096) return error('Request is too large.', 413);

  let raw: unknown;
  try {
    const text = await request.text();
    if (Buffer.byteLength(text, 'utf8') > 4096) return error('Request is too large.', 413);
    raw = JSON.parse(text);
  } catch {
    return error('Invalid JSON body.', 400);
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return error('Invalid request body.', 400);
  }
  const body = raw as Record<string, unknown>;
  const model = body.model === 'native' ? 'native' : body.model === 'intentR-402' ? 'intentR-402' : null;
  if (!model) return error('Choose a valid model.', 400);
  const target = model === 'native'
    ? backend(process.env.NATIVE_INTENT_API_URL, process.env.NATIVE_INTENT_API_KEY)
      ?? backend(process.env.INTENT_API_URL, process.env.INTENT_API_KEY)
    : backend(process.env.INTENT_API_URL, process.env.NATIVE_INTENT_API_URL === process.env.INTENT_API_URL ? process.env.NATIVE_INTENT_API_KEY : process.env.INTENT_API_KEY);
  if (!target) return error('Selected model is not connected yet.', 503);
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > 2000) {
    return error('Message must contain 1–2000 characters.', 400);
  }
  const mathRoute = routeMathIntent(message);
  const routedMessage = mathRoute.intent === 'math'
    ? buildCalculatorAgentMessage(message, mathRoute)
    : message;
  const sessionId = body.session_id;
  if (sessionId != null && (typeof sessionId !== 'string' || !/^[0-9a-f-]{36}$/.test(sessionId))) {
    return error('Invalid session ID.', 400);
  }
  const search = body.search === true || body.search === 'true';
  const effectiveSearch = mathRoute.intent === 'chat' ? search : false;
  const searchDepth = body.search_depth === 'deep' ? 'deep' : 'quick';
  const research = effectiveSearch
    ? searchDepth === 'deep'
      ? {
          enabled: true,
          depth: 'deep',
          max_queries: 4,
          results_per_query: 5,
          max_pages: 6,
          max_chunks_per_page: 3,
          max_hops: 2,
          max_sources: 12,
          fetch_timeout_ms: 8_000,
        }
      : {
          enabled: true,
          depth: 'quick',
          max_queries: 2,
          results_per_query: 4,
          max_pages: 3,
          max_chunks_per_page: 2,
          max_hops: 1,
          max_sources: 6,
          fetch_timeout_ms: 6_000,
        }
    : {
        enabled: false,
        depth: 'quick',
        max_queries: 0,
        results_per_query: 0,
        max_pages: 0,
        max_chunks_per_page: 0,
        max_hops: 0,
        max_sources: 0,
        fetch_timeout_ms: 0,
      };
  const maxTokens = body.max_tokens == null ? 100 : Number(body.max_tokens);
  const maximum = model === 'intentR-402' ? 512 : 160;
  if (!Number.isInteger(maxTokens) || maxTokens < 16 || maxTokens > maximum) {
    return error(`max_tokens must be 16–${maximum} for this model.`, 400);
  }

  const client = createHash('sha256').update(user.id).digest('hex');
  const quota = await consumeQuota(`user:${client}`);
  if (!quota.configured) return error('Inference access is being configured. Please try again shortly.', 503);
  if (!quota.allowed) {
    const response = error('Usage limit reached. Please try again after the current hourly window resets.', 429);
    response.headers.set('X-RateLimit-Limit', '20');
    response.headers.set('X-RateLimit-Remaining', '0');
    if (quota.resetAt) response.headers.set('X-RateLimit-Reset', quota.resetAt);
    return response;
  }
  const url = new URL('/v1/chat', target.baseUrl);
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${target.apiKey}`,
      'X-Intent-Client': client,
      'Content-Type': 'application/json',
    };
    const outbound = JSON.stringify({
      message: routedMessage,
      model,
      session_id: sessionId ?? null,
      search: effectiveSearch,
      research,
      max_tokens: maxTokens,
    });
    const upstream = await fetch(url, {
      method: 'POST',
      headers,
      body: outbound,
      cache: 'no-store',
      signal: AbortSignal.timeout(90_000),
    });
    const data: unknown = await upstream.json();
    if (!upstream.ok) {
      const detail = data && typeof data === 'object' && 'detail' in data ? String(data.detail) : 'INTENT request failed.';
      return error(detail, upstream.status);
    }
    const responseData = data && typeof data === 'object' && !Array.isArray(data)
      ? { ...data as Record<string, unknown>, routing: calculatorRoutingMetadata(mathRoute) }
      : data;
    const response = NextResponse.json(responseData, { headers: jsonHeaders });
    response.headers.set('X-Intent-Route', mathRoute.intent === 'math' ? 'calculator' : 'model');
    if (mathRoute.intent === 'math') response.headers.set('X-Intent-Calculator', mathRoute.status);
    response.headers.set('X-RateLimit-Limit', '20');
    response.headers.set('X-RateLimit-Remaining', String(quota.remaining));
    if (quota.resetAt) response.headers.set('X-RateLimit-Reset', quota.resetAt);
    return response;
  } catch {
    return error('INTENT is temporarily unavailable.', 502);
  }
}
