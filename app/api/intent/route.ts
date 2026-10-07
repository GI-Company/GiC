import { createHash } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase-public';
import { buildCalculatorAgentMessage, calculatorRoutingMetadata, routeMathIntent } from '@/lib/intent-math-router';

export const runtime = 'nodejs';

const jsonHeaders = { 'Cache-Control': 'no-store' };
const GROQ_BASE = 'https://api.groq.com/openai/v1';
const GROQ_MODELS = {
  fast: ['openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-120b'],
  medium: ['qwen/qwen3.8-27b', 'openai/gpt-oss-20b', 'openai/gpt-oss-120b'],
  enhanced: ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'],
} as const;
type LooseMouthMode = keyof typeof GROQ_MODELS;

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

function anonymousActor(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  return createHash('sha256').update(`${forwarded}|${ua}`).digest('hex');
}

function modeFrom(value: unknown): LooseMouthMode {
  return value === 'fast' || value === 'medium' || value === 'enhanced' ? value : 'fast';
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

async function activeGroqModels(apiKey: string) {
  try {
    const response = await fetch(`${GROQ_BASE}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return new Set<string>();
    const data = await response.json() as { data?: Array<{ id?: string }> };
    return new Set((data.data || []).map((entry) => entry.id).filter((id): id is string => Boolean(id)));
  } catch {
    return new Set<string>();
  }
}

export async function GET(request: NextRequest) {
  const user = await authenticatedUser(request);
  const groqKey = process.env.GROQ_API;
  if (!groqKey) return error('LooseMouth hosted inference is not configured yet.', 503);
  const active = await activeGroqModels(groqKey);
  const availableModes = (Object.keys(GROQ_MODELS) as LooseMouthMode[]).filter((mode) =>
    GROQ_MODELS[mode].some((model) => active.has(model))
  );
  if (!availableModes.length) return error('LooseMouth hosted inference is temporarily unavailable.', 502);
  return NextResponse.json({
    models: availableModes,
    authenticated: Boolean(user),
    anonymousLimit: 5,
    multimodal: active.has('qwen/qwen3.8-27b'),
    provider: 'groq',
    disclosure: 'Hosted inference is currently provided through Groq while Global Intent Company develops private AI infrastructure.',
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

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > 4000) return error('Message must contain 1–4000 characters.', 400);

  const user = await authenticatedUser(request);
  const authenticated = Boolean(user);
  const actor = authenticated
    ? `user:${createHash('sha256').update(user!.id).digest('hex')}`
    : `anon:${anonymousActor(request)}`;
  const quotaLimit = authenticated ? 20 : 5;
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

  const groqKey = process.env.GROQ_API;
  if (!groqKey) return error('LooseMouth hosted inference is not configured yet.', 503);

  const mode = modeFrom(body.model ?? body.mode);
  const imageUrl = body.image_url == null ? null : validImageUrl(body.image_url);
  if (body.image_url != null && !imageUrl) return error('Image must be a supported HTTPS URL or JPEG/PNG/WebP data URL.', 400);

  const mathRoute = routeMathIntent(message);
  const routedMessage = mathRoute.intent === 'math' ? buildCalculatorAgentMessage(message, mathRoute) : message;
  const active = await activeGroqModels(groqKey);
  let candidates = GROQ_MODELS[mode].filter((model) => active.has(model));
  if (imageUrl) candidates = candidates.filter((model) => model === 'qwen/qwen3.8-27b');
  if (!candidates.length && imageUrl && active.has('qwen/qwen3.8-27b')) candidates = ['qwen/qwen3.8-27b'];
  if (!candidates.length) return error('No compatible LooseMouth model is available right now.', 503);

  const system = [
    'You are LooseMouth, the public AI interface for Global Intent Company.',
    'Be useful, direct, accurate, and concise unless the user asks for depth.',
    'Do not claim that you are a model developed by Global Intent Company.',
    'Hosted inference is currently supplied through Groq while Global Intent Company researches and develops private AI models and infrastructure.',
    'If asked about the company, distinguish current hosted inference from Global Intent Company research clearly.',
  ].join(' ');

  const maxTokens = mode === 'enhanced' ? 1200 : mode === 'medium' ? 900 : 600;
  let lastStatus = 502;
  let lastMessage = 'Hosted inference is temporarily unavailable.';

  for (const model of candidates) {
    try {
      const userContent: unknown = imageUrl
        ? [{ type: 'text', text: routedMessage }, { type: 'image_url', image_url: { url: imageUrl } }]
        : routedMessage;
      const payload: Record<string, unknown> = {
        model,
        messages: [{ role: 'system', content: system }, { role: 'user', content: userContent }],
        max_completion_tokens: maxTokens,
        temperature: mode === 'fast' ? 0.6 : 0.7,
      };
      if (model === 'openai/gpt-oss-20b' || model === 'openai/gpt-oss-120b') {
        payload.reasoning_effort = mode === 'enhanced' ? 'high' : mode === 'medium' ? 'medium' : 'low';
      } else if (model === 'qwen/qwen3.8-27b') {
        payload.reasoning_effort = mode === 'enhanced' ? 'high' : mode === 'medium' ? 'medium' : 'none';
      }

      const upstream = await fetch(`${GROQ_BASE}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
        signal: AbortSignal.timeout(90_000),
      });

      const data = await upstream.json() as {
        choices?: Array<{ message?: { content?: string } }>;
        error?: { message?: string };
      };
      if (!upstream.ok) {
        lastStatus = upstream.status;
        lastMessage = data.error?.message || 'Hosted inference request failed.';
        if (upstream.status === 429 || upstream.status >= 500) continue;
        return error(lastMessage, upstream.status);
      }

      const answer = data.choices?.[0]?.message?.content?.trim();
      if (!answer) continue;

      const response = NextResponse.json({
        session_id: typeof body.session_id === 'string' ? body.session_id : randomUUID(),
        answer,
        sources: [],
        warning: null,
        mode,
        model,
        provider: 'groq',
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
