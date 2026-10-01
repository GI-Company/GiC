import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const jsonHeaders = { 'Cache-Control': 'no-store' };

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: jsonHeaders });
}

export async function GET() {
  const endpoint = process.env.INTENT_API_URL;
  const apiKey = process.env.INTENT_API_KEY;
  if (!endpoint || !apiKey) return error('INTENT is not connected yet.', 503);
  let baseUrl: URL;
  try {
    baseUrl = new URL(endpoint);
    if (baseUrl.protocol !== 'https:' || baseUrl.username || baseUrl.password) throw new Error('Invalid endpoint');
  } catch {
    return error('INTENT API URL must be an HTTPS URL.', 503);
  }
  try {
    const response = await fetch(new URL('/v1/models', baseUrl), {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return error('Model availability is temporarily unknown.', 502);
    const data: unknown = await response.json();
    const models = data && typeof data === 'object' && 'models' in data && Array.isArray(data.models)
      ? data.models.map((entry: unknown) => entry && typeof entry === 'object' && 'id' in entry ? String(entry.id) : '')
      : ['native'];
    return NextResponse.json({ models: models.filter((id: string) => id === 'native' || id === 'gemma4') }, { headers: jsonHeaders });
  } catch {
    return error('Model availability is temporarily unknown.', 502);
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return error('Cross-origin requests are not allowed.', 403);
  }
  const contentType = request.headers.get('content-type')?.toLowerCase() || '';
  const isJson = contentType.startsWith('application/json');
  const isForm = contentType.startsWith('multipart/form-data');
  if (!isJson && !isForm) return error('Expected JSON or image upload.', 415);
  if (Number(request.headers.get('content-length') || 0) > (isForm ? 4_500_000 : 4096)) {
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
  let image: File | null = null;
  try {
    if (isForm) {
      const form = await request.formData();
      image = form.get('image') instanceof File ? form.get('image') as File : null;
      raw = Object.fromEntries(form.entries());
    } else {
      const text = await request.text();
      if (Buffer.byteLength(text, 'utf8') > 4096) return error('Request is too large.', 413);
      raw = JSON.parse(text);
    }
  } catch {
    return error('Invalid JSON body.', 400);
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return error('Invalid request body.', 400);
  }
  const body = raw as Record<string, unknown>;
  const model = body.model === 'native' ? 'native' : body.model === 'gemma4' ? 'gemma4' : null;
  if (!model) return error('Choose a valid model.', 400);
  if (isForm && model !== 'gemma4') return error('Image input requires LooseMouth Enhanced.', 400);
  if (isForm && (!image || !['image/jpeg', 'image/png', 'image/webp'].includes(image.type) || image.size > 4_000_000)) {
    return error('Choose a JPEG, PNG, or WebP image under 4 MB.', 400);
  }
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > 2000) {
    return error('Message must contain 1–2000 characters.', 400);
  }
  const sessionId = body.session_id;
  if (sessionId != null && (typeof sessionId !== 'string' || !/^[0-9a-f-]{36}$/.test(sessionId))) {
    return error('Invalid session ID.', 400);
  }
  const search = body.search === true || body.search === 'true';
  const maxTokens = body.max_tokens == null ? 100 : Number(body.max_tokens);
  if (!Number.isInteger(maxTokens) || maxTokens < 16 || maxTokens > 160) {
    return error('max_tokens must be 16–160.', 400);
  }

  // Vercel replaces x-forwarded-for with its trusted client address.
  const clientIp = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';
  const client = createHash('sha256').update(clientIp).digest('hex');
  const url = new URL(isForm ? '/v1/chat/image' : '/v1/chat', baseUrl);
  try {
    let outbound: BodyInit;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'X-Intent-Client': client,
    };
    if (isForm && image) {
      const form = new FormData();
      form.set('image', image);
      form.set('message', message);
      if (sessionId) form.set('session_id', String(sessionId));
      form.set('search', String(search));
      form.set('max_tokens', String(maxTokens));
      outbound = form;
    } else {
      headers['Content-Type'] = 'application/json';
      outbound = JSON.stringify({ message, model, session_id: sessionId ?? null, search, max_tokens: maxTokens });
    }
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
    return NextResponse.json(data, { headers: jsonHeaders });
  } catch {
    return error('INTENT is temporarily unavailable.', 502);
  }
}
