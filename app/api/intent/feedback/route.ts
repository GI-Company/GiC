import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase-public';

export const runtime = 'nodejs';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HASH = /^[0-9a-f]{64}$/i;
const REASONS = new Set(['incorrect', 'incomplete', 'irrelevant', 'formatting', 'unsafe', 'other']);
const MODELS = new Set(['fast', 'medium', 'enhanced']);

type Payload = {
  feedback_key?: unknown;
  response_hash?: unknown;
  conversation_id?: unknown;
  model?: unknown;
  rating?: unknown;
  reason?: unknown;
  comment?: unknown;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (origin && origin !== req.nextUrl.origin) return jsonError('Origin not permitted.', 403);
  if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return jsonError('Expected a JSON request.', 415);
  }
  if (Number(req.headers.get('content-length') || 0) > 2048) {
    return jsonError('Feedback is too large.', 413);
  }

  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return jsonError('Feedback collection is temporarily unavailable.', 503);

  let body: Payload;
  try {
    const raw = await req.text();
    if (Buffer.byteLength(raw, 'utf8') > 2048) return jsonError('Feedback is too large.', 413);
    body = JSON.parse(raw) as Payload;
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid feedback');
  } catch {
    return jsonError('Invalid feedback request.', 400);
  }

  const feedbackKey = body.feedback_key;
  const responseHash = body.response_hash;
  const model = body.model;
  const rating = body.rating;
  const reason = rating === 'negative' ? body.reason : null;
  const comment = rating === 'negative' && typeof body.comment === 'string' ? body.comment.trim() : '';

  if (typeof feedbackKey !== 'string' || !UUID.test(feedbackKey)
    || typeof responseHash !== 'string' || !HASH.test(responseHash)
    || typeof model !== 'string' || !MODELS.has(model)
    || (rating !== 'positive' && rating !== 'negative')
    || (rating === 'negative' && (typeof reason !== 'string' || !REASONS.has(reason)))
    || comment.length > 600) {
    return jsonError('Invalid feedback values.', 400);
  }

  const auth = req.headers.get('authorization');
  let userId: string | null = null;
  if (auth) {
    if (!auth.startsWith('Bearer ')) return jsonError('Invalid session.', 401);
    const response = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: auth },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);
    if (!response?.ok) return jsonError('Session expired. Sign in again.', 401);
    const user = await response.json() as { id?: string };
    if (!user.id || !UUID.test(user.id)) return jsonError('Invalid session.', 401);
    userId = user.id;
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const actorHash = createHash('sha256').update([userId || 'guest', ip, userAgent].join('|')).digest('hex');

  try {
    // Use the shared atomic quota function, but in a separate namespace from inference.
    const quota = await fetch(new URL('/rest/v1/rpc/consume_inference_quota', SUPABASE_URL), {
      method: 'POST',
      headers: { apikey: secret, Authorization: 'Bearer ' + secret, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_actor_key: 'feedback:' + actorHash, p_limit: 50, p_window_seconds: 86400 }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!quota.ok) return jsonError('Feedback collection is temporarily unavailable.', 503);
    const result: unknown = await quota.json();
    const record = Array.isArray(result) ? result[0] as { allowed?: boolean } | undefined : undefined;
    if (!record?.allowed) return jsonError('Feedback limit reached. Please try again tomorrow.', 429);

    const conversationId = typeof body.conversation_id === 'string' && UUID.test(body.conversation_id) && userId
      ? body.conversation_id : null;
    const endpoint = new URL('/rest/v1/loosemouth_response_feedback', SUPABASE_URL);
    endpoint.searchParams.set('on_conflict', 'feedback_key');
    const saved = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: secret,
        Authorization: 'Bearer ' + secret,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        feedback_key: feedbackKey,
        actor_hash: actorHash,
        user_id: userId,
        response_hash: responseHash.toLowerCase(),
        conversation_id: conversationId,
        model,
        rating,
        reason,
        comment,
        updated_at: new Date().toISOString(),
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!saved.ok) {
      console.error('[LooseMouth feedback] Database write failed:', saved.status);
      return jsonError('Feedback could not be saved. Please retry.', 502);
    }
    return NextResponse.json({ recorded: true, rating }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return jsonError('Feedback is temporarily unavailable. Please retry.', 503);
  }
}
