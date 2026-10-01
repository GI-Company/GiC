import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const jsonHeaders = { 'Cache-Control': 'no-store' };

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: jsonHeaders });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return error('Cross-origin requests are not allowed.', 403);
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return error('Expected application/json.', 415);
  }
  if (Number(request.headers.get('content-length') || 0) > 4096) {
    return error('Request is too large.', 413);
  }

  const endpoint = process.env.INTENT_API_URL;
  const apiKey = process.env.INTENT_API_KEY;
  if (!endpoint || !apiKey) {
    return error('INTENT is not connected yet.', 503);
  }
  let baseUrl: URL;
  try {
    baseUrl = new URL(endpoint);
    if (baseUrl.protocol !== 'https:' || baseUrl.username || baseUrl.password) {
      throw new Error('Invalid endpoint');
    }
  } catch {
    return error('INTENT API URL must be an HTTPS URL.', 503);
  }

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
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > 2000) {
    return error('Message must contain 1–2000 characters.', 400);
  }
  const sessionId = body.session_id;
  if (sessionId != null && (typeof sessionId !== 'string' || !/^[0-9a-f-]{36}$/.test(sessionId))) {
    return error('Invalid session ID.', 400);
  }
  const search = body.search === true;
  const maxTokens = typeof body.max_tokens === 'number' ? body.max_tokens : 100;
  if (!Number.isInteger(maxTokens) || maxTokens < 16 || maxTokens > 160) {
    return error('max_tokens must be 16–160.', 400);
  }

  // Vercel replaces x-forwarded-for with its trusted client address.
  const clientIp = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';
  const client = createHash('sha256').update(clientIp).digest('hex');
  const url = new URL('/v1/chat', baseUrl);
  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-Intent-Client': client,
      },
      body: JSON.stringify({ message, session_id: sessionId ?? null, search, max_tokens: maxTokens }),
      cache: 'no-store',
      signal: AbortSignal.timeout(90_000),
    });
    const data: unknown = await upstream.json();
    if (!upstream.ok) {
      const detail = data && typeof data === 'object' && 'detail' in data ? String(data.detail) : 'INTENT request failed.';
      return error(detail, upstream.status);
    }
    return NextResponse.json(data, { headers: jsonHeaders });
  } catch {
    return error('INTENT is temporarily unavailable.', 502);
  }
}
