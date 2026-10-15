import { createHash } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { runWorkspaceAgent } from '@/lib/workspace-agent';
import { GEMINI_CHAT_URL, geminiModelForMode, getGeminiKey, groundedGeminiAnswer, type HostedMode } from '@/lib/gemini-provider';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase-public';
import { buildCalculatorAgentMessage, calculatorRoutingMetadata, routeMathIntent } from '@/lib/intent-math-router';

export const runtime = 'nodejs';

const jsonHeaders = { 'Cache-Control': 'no-store' };
type LooseMouthMode = HostedMode;

async function consumeQuota(actorKey: string, limit: number, windowSeconds: number) {
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !secret) return { allowed: false, remaining: 0, resetAt: null as string | null, configured: false };
  try {
    const response = await fetch(new URL('/rest/v1/rpc/consume_inference_quota', SUPABASE_URL), {
      method: 'POST',
      headers: { apikey: secret, Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_actor_key: actorKey, p_limit: limit, p_window_seconds: windowSeconds }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return { allowed: false, remaining: 0, resetAt: null as string | null, configured: true };
    const data: unknown = await response.json();
    const row = Array.isArray(data) ? data[0] : null;
    if (!row || typeof row !== 'object') return { allowed: false, remaining: 0, resetAt: null as string | null, configured: true };
    const result = row as Record<string, unknown>;
    return { allowed: result.allowed === true, remaining: Number(result.remaining ?? 0), resetAt: typeof result.reset_at === 'string' ? result.reset_at : null, configured: true };
  } catch {
    return { allowed: false, remaining: 0, resetAt: null as string | null, configured: true };
  }
}

function error(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status, headers: jsonHeaders });
}

async function authenticatedUser(request: NextRequest): Promise<{ id: string; email?: string } | null> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: authorization },
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

async function billingTier(userId: string): Promise<'free' | 'paid' | 'enhanced'> {
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return 'free';
  try {
    const url = new URL('/rest/v1/loosemouth_billing_entitlements', SUPABASE_URL);
    url.searchParams.set('select', 'tier,subscription_status');
    url.searchParams.set('user_id', `eq.${userId}`);
    url.searchParams.set('limit', '1');
    const response = await fetch(url, { headers: { apikey: secret, Authorization: `Bearer ${secret}` }, cache: 'no-store', signal: AbortSignal.timeout(5_000) });
    if (!response.ok) return 'free';
    const rows = await response.json() as Array<{ tier?: string; subscription_status?: string | null }>;
    const row = rows[0];
    if (!row || !['active', 'trialing'].includes(row.subscription_status || '')) return 'free';
    return row.tier === 'enhanced' ? 'enhanced' : row.tier === 'paid' ? 'paid' : 'free';
  } catch { return 'free'; }
}

function anonymousActor(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  return createHash('sha256').update(`${forwarded}|${ua}`).digest('hex');
}

function modeFrom(value: unknown): LooseMouthMode {
  return value === 'fast' || value === 'medium' || value === 'enhanced' ? value : 'fast';
}

function normalizeSources(items: Array<{ title?: string; url?: string; content?: string; published_date?: string }>, deep: boolean) {
  const seen = new Set<string>();
  const terms = new Set<string>();
  const limit = deep ? 12 : 6;
  return items
    .filter((item) => {
      if (typeof item.url !== 'string' || !item.url.startsWith('http')) return false;
      try {
        const url = new URL(item.url);
        url.hash = '';
        ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid'].forEach((key) => url.searchParams.delete(key));
        const key = url.toString().replace(/\/$/, '');
        if (seen.has(key)) return false;
        seen.add(key);
        item.url = key;
        return true;
      } catch { return false; }
    })
    .map((item) => {
      const host = new URL(item.url!).hostname.replace(/^www\./, '');
      const title = item.title || host;
      const content = (item.content || '').replace(/\s+/g, ' ').trim();
      const fingerprint = (title + ' ' + content.slice(0, 240)).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (terms.has(fingerprint)) return null;
      terms.add(fingerprint);
      return { title, snippet: content.slice(0, deep ? 1200 : 600), date: item.published_date || '', url: item.url!, host };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .slice(0, limit)
    .map(({ host: _host, ...item }) => item);
}

function validImageUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 4_000_000) return null;
  if (/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(value)) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? value : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const user = await authenticatedUser(request);
  if (!getGeminiKey()) return error('LooseMouth hosted inference is not configured yet.', 503);
  return NextResponse.json({
    models: ['fast', 'medium', 'enhanced'] as LooseMouthMode[],
    authenticated: Boolean(user),
    anonymousLimit: 5,
    multimodal: true,
    provider: 'gemini',
    disclosure: 'Hosted inference is supplied by Google Gemini. Global Intent Company independently develops its INTENT foundation models and private AI infrastructure.',
  }, { headers: jsonHeaders });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) return error('Cross-origin requests are not allowed.', 403);

  const contentType = request.headers.get('content-type')?.toLowerCase() || '';
  if (!contentType.startsWith('application/json')) return error('Expected JSON.', 415);
  if (Number(request.headers.get('content-length') || 0) > 4_200_000) return error('Request is too large.', 413);

  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    if (Buffer.byteLength(text, 'utf8') > 4_200_000) return error('Request is too large.', 413);
    const raw = JSON.parse(text);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return error('Invalid request body.', 400);
    body = raw as Record<string, unknown>;
  } catch {
    return error('Invalid JSON body.', 400);
  }

  const requestStartedAt = Date.now();
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > 4000) return error('Message must contain 1–4000 characters.', 400);

  const user = await authenticatedUser(request);
  const authenticated = Boolean(user);
  const actor = authenticated
    ? `user:${createHash('sha256').update(user!.id).digest('hex')}`
    : `anon:${anonymousActor(request)}`;
  const tier = user ? await billingTier(user.id) : 'free';
  const quotaLimit = !authenticated ? 5 : tier === 'enhanced' ? 300 : tier === 'paid' ? 100 : 10;
  const quotaWindow = authenticated ? 3600 : 2_592_000;
  const quota = await consumeQuota(actor, quotaLimit, quotaWindow);
  if (!quota.configured) return error('Inference access is being configured. Please try again shortly.', 503);
  if (!quota.allowed) {
    const response = error(
      authenticated
        ? 'Usage limit reached. Please try again after the current hourly window resets.'
        : 'You have used your 5 guest messages. Create a free account to keep chatting with LooseMouth.',
      429,
      { auth_required: !authenticated },
    );
    response.headers.set('X-RateLimit-Limit', String(quotaLimit));
    response.headers.set('X-RateLimit-Remaining', '0');
    if (quota.resetAt) response.headers.set('X-RateLimit-Reset', quota.resetAt);
    return response;
  }

  const geminiKey = getGeminiKey();
  if (!geminiKey) return error('LooseMouth hosted inference is not configured yet.', 503);

  if (body.workspace_agent === true) {
    if (tier === 'free') return error('Workspace agent actions require Paid or Enhanced access.', 403);
    if (body.search === true || body.image_url) return error('Turn off web search and remove image attachments for workspace agent mode.', 400);
    try {
      const agent = await runWorkspaceAgent({ key: geminiKey, model: geminiModelForMode(tier === 'enhanced' ? 'enhanced' : 'medium'), goal: message, context: body.conversation_context, tier });
      const response = NextResponse.json({ session_id: typeof body.session_id === 'string' ? body.session_id : randomUUID(), answer: agent.answer, workspace_action: agent.action, activity: agent.activity, sources: [], warning: null, mode: 'fast', provider: 'gemini' }, { headers: jsonHeaders });
      response.headers.set('X-RateLimit-Limit', String(quotaLimit));
      response.headers.set('X-RateLimit-Remaining', String(quota.remaining));
      if (quota.resetAt) response.headers.set('X-RateLimit-Reset', quota.resetAt);
      return response;
    } catch { return error('Workspace agent unavailable. Your workspace is unchanged.', 502); }
  }

  const requestedMode = modeFrom(body.model ?? body.mode);
  const mode: LooseMouthMode = tier === 'enhanced' ? requestedMode : requestedMode === 'enhanced' ? 'medium' : requestedMode;
  const searchEnabled = body.search === true || body.search === 'true';
  const searchDepth = body.search_depth === 'deep' ? 'deep' : 'quick';
  const dataCollectionEnabled = tier === 'free' || body.data_collection_enabled !== false;
  const imageUrl = body.image_url == null ? null : validImageUrl(body.image_url);
  if (body.image_url != null && !imageUrl) return error('Image must be a supported HTTPS URL or JPEG/PNG/WebP data URL.', 400);

  const mathRoute = routeMathIntent(message);
  const routedMessage = mathRoute.intent === 'math' ? buildCalculatorAgentMessage(message, mathRoute) : message;
  if (searchEnabled && imageUrl) return error('Web research and image analysis cannot be combined in the same request yet.', 400);
  const candidates = [geminiModelForMode(mode)];

  const system = [
    'You are LooseMouth, the public AI interface for Global Intent Company.',
    'Be useful, direct, accurate, and concise unless the user asks for depth.',
    'Use readable Markdown: short paragraphs, descriptive headings for longer answers, lists, and fenced code blocks with language labels. Use compact GFM tables when comparisons benefit from columns. Do not wrap the entire answer in a code fence.',
    'Do not claim that you are a model developed by Global Intent Company.',
    'Hosted inference is currently supplied through Google Gemini while Global Intent Company researches and develops private AI models and infrastructure.',
    'If asked about the company, distinguish current hosted inference from Global Intent Company research clearly.',
    'When web research is enabled, ground factual claims in the browser-search results. Do not invent citations or source URLs.',
  ].join(' ');

  const maxTokens = searchEnabled && searchDepth === 'deep' ? 3200 : mode === 'enhanced' ? 3200 : mode === 'medium' ? 2000 : 1200;
  let lastStatus = 502;
  let lastMessage = 'Hosted inference is temporarily unavailable.';

  for (const model of candidates) {
    try {
      const researchInstruction = searchEnabled && searchDepth === 'deep'
        ? `Deep research request. Research the user's question before answering. Search broadly enough to identify multiple relevant sources and competing or complementary evidence. Prefer primary, official, and high-quality sources. Deduplicate overlapping results. Read the available search-result content closely, prioritize passages that directly answer the query, distinguish facts from inference, note material disagreement or missing evidence, and synthesize a self-contained answer grounded in the sources. User question: ${routedMessage}`
        : searchEnabled
          ? `Quick web search request. Find current, relevant evidence and answer concisely from the returned sources. User question: ${routedMessage}`
          : routedMessage;
      const userContent: unknown = imageUrl
        ? [{ type: 'text', text: routedMessage }, { type: 'image_url', image_url: { url: imageUrl } }]
        : researchInstruction;
      let answer = '';
      let rawSearchResults: Array<{ title?: string; url?: string; content?: string; published_date?: string }> = [];
      if (searchEnabled) {
        const grounded = await groundedGeminiAnswer({
          key: geminiKey, model, system, prompt: researchInstruction,
          maxOutputTokens: maxTokens, signal: AbortSignal.timeout(90_000),
        });
        answer = grounded.answer;
        rawSearchResults = grounded.sources;
      } else {
        const payload: Record<string, unknown> = {
          model,
          messages: [{ role: 'system', content: system }, { role: 'user', content: userContent }],
          max_completion_tokens: maxTokens,
          temperature: mode === 'fast' ? 0.5 : 0.65,
          reasoning_effort: mode === 'fast' ? 'low' : mode === 'medium' ? 'medium' : 'high',
        };
        const upstream = await fetch(GEMINI_CHAT_URL, {
          method: 'POST',
          headers: { Authorization: `Bearer ${geminiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          cache: 'no-store',
          signal: AbortSignal.timeout(90_000),
        });
        if (!upstream.ok) {
          lastStatus = upstream.status;
          lastMessage = upstream.status === 429 ? 'Gemini rate limit reached. Please try again later.' : 'Gemini inference is unavailable.';
          continue;
        }
        const data = await upstream.json() as {
          choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>;
        };
        const value = data.choices?.[0]?.message?.content;
        answer = typeof value === 'string'
          ? value.trim()
          : Array.isArray(value) ? value.map((part) => part.text || '').join('').trim() : '';
      }
      if (!answer) continue;
      const sources = normalizeSources(rawSearchResults, searchDepth === 'deep');

      const responseSessionId = typeof body.session_id === 'string' ? body.session_id : randomUUID();
      if (authenticated && dataCollectionEnabled) {
        const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (secret) {
          try {
            await fetch(new URL('/rest/v1/loosemouth_usage_events', SUPABASE_URL), {
              method: 'POST',
              headers: { apikey: secret, Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
              body: JSON.stringify({
                user_id: user!.id,
                session_id: /^[0-9a-f-]{36}$/i.test(responseSessionId) ? responseSessionId : null,
                mode,
                provider: 'gemini',
                provider_model: model,
                search_enabled: searchEnabled,
                search_depth: searchEnabled ? searchDepth : null,
                input_chars: message.length,
                output_chars: answer.length,
                latency_ms: Date.now() - requestStartedAt,
              }),
              cache: 'no-store',
              signal: AbortSignal.timeout(5_000),
            });
          } catch {
            // Telemetry must never block inference.
          }
        }
      }

      const response = NextResponse.json({
        session_id: responseSessionId,
        answer,
        sources,
        warning: null,
        mode,
        model,
        provider: 'gemini',
        account_tier: tier,
        research: searchEnabled ? {
          depth: searchDepth,
          fetched_pages: sources.length,
          sources_considered: rawSearchResults.length,
          elapsed_ms: Date.now() - requestStartedAt,
        } : undefined,
        routing: calculatorRoutingMetadata(mathRoute),
      }, { headers: jsonHeaders });
      response.headers.set('X-LooseMouth-Mode', mode);
      response.headers.set('X-LooseMouth-Model', model);
      response.headers.set('X-Intent-Route', mathRoute.intent === 'math' ? 'calculator' : 'model');
      response.headers.set('X-RateLimit-Limit', String(quotaLimit));
      response.headers.set('X-RateLimit-Remaining', String(quota.remaining));
      if (quota.resetAt) response.headers.set('X-RateLimit-Reset', quota.resetAt);
      return response;
    } catch {
      lastStatus = 502;
      lastMessage = 'Hosted inference is temporarily unavailable.';
    }
  }

  return error(lastMessage, lastStatus === 429 ? 503 : lastStatus);
}
