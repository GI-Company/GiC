import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_MESSAGE_CHARS = 2000;
const REQUEST_TIMEOUT_MS = 45000;

function clientIp(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}

function config() {
  const base = process.env.INTENT_API_URL?.trim().replace(/\/$/, '');
  const key = process.env.INTENT_API_KEY?.trim();
  return base && key ? { base, key } : null;
}

async function callIntent(path: string, init: RequestInit = {}) {
  const cfg = config();
  if (!cfg) {
    return NextResponse.json(
      { error: 'INTENT research preview is not connected yet.', ready: false },
      { status: 503 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${cfg.base}${path}`, {
      ...init,
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${cfg.key}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers || {}),
      },
    });

    const text = await response.text();
    let data: unknown = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: text || 'Invalid response from INTENT runtime.' };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'INTENT runtime timed out.'
        : 'INTENT runtime is unavailable.';
    return NextResponse.json({ error: message, ready: false }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(req: NextRequest) {
  const rate = checkRateLimit(`intent-health:${clientIp(req)}`, 30, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many status checks.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } }
    );
  }

  return callIntent('/healthz');
}

export async function POST(req: NextRequest) {
  const rate = checkRateLimit(`intent-chat:${clientIp(req)}`, 8, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before trying INTENT again.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }

  const input = body as { message?: unknown; session_id?: unknown };
  const message = typeof input.message === 'string' ? input.message.trim() : '';
  const sessionId = typeof input.session_id === 'string' ? input.session_id.trim() : '';

  if (!message) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json(
      { error: `Message exceeds the ${MAX_MESSAGE_CHARS}-character preview limit.` },
      { status: 400 }
    );
  }
  if (sessionId.length > 128) {
    return NextResponse.json({ error: 'Invalid session identifier.' }, { status: 400 });
  }

  return callIntent('/v1/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      ...(sessionId ? { session_id: sessionId } : {}),
    }),
  });
}

export async function DELETE(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')?.trim() || '';
  if (!sessionId || sessionId.length > 128) {
    return NextResponse.json({ error: 'Valid session_id is required.' }, { status: 400 });
  }

  return callIntent(`/v1/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  });
}
