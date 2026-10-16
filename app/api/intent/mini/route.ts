import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { consumeWorkbenchQuota } from '@/lib/workbench-access';
import { gradioEvents, inferenceError, inferenceInput } from '@/lib/intent-hf-stream';

export const runtime = 'nodejs';
export const maxDuration = 300;
const endpoint = 'https://hdhhhgfc-intent-rlse-v2.hf.space/gradio_api/call/generate';
const headers = { 'Cache-Control': 'no-store' };
const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers });

export async function POST(req: NextRequest) {
  // Next may normalize the internal URL to localhost; use the incoming Host.
  const origin = `${req.nextUrl.protocol}//${req.headers.get('host') || req.nextUrl.host}`;
  if (req.headers.get('origin') !== origin) return fail('Cross-origin request rejected.', 403);
  if (!req.headers.get('content-type')?.startsWith('application/json')) return fail('Expected JSON.', 415);
  const token = process.env.HF_TOKEN?.trim();
  if (!token) return fail('Authenticated inference is not configured. Set HF_TOKEN on the server and redeploy.', 503);
  let data: unknown[];
  try {
    const text = await req.text();
    if (text.length > 12000) return fail('Request is too large.', 413);
    data = inferenceInput(JSON.parse(text));
  } catch (cause) {
    return fail(cause instanceof SyntaxError ? 'Invalid JSON.' : cause instanceof Error ? cause.message : 'Invalid request.', 400);
  }
  // Keep the public research studio public, but protect the shared HF account quota.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const actor = createHash('sha256').update(ip).digest('hex');
  const quota = await consumeWorkbenchQuota(`intent-hf:${actor}`);
  if (!quota.configured) return fail('Inference access is being configured. Try again shortly.', 503);
  if (!quota.allowed) return fail('Research studio limit reached (8 requests per hour). Try again after the hourly reset.', 429);

  const controller = new AbortController();
  const abort = () => controller.abort();
  req.signal.addEventListener('abort', abort, { once: true });
  if (req.signal.aborted) abort();
  const timeout = setTimeout(abort, 240_000);
  const cleanup = () => { clearTimeout(timeout); req.signal.removeEventListener('abort', abort); };
  const auth = { Authorization: `Bearer ${token}` };
  try {
    const queued = await fetch(endpoint, {
      method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' },
      // Let /call own its session ID so the result stream can find the job.
      body: JSON.stringify({ data }),
      cache: 'no-store', redirect: 'error', signal: controller.signal,
    });
    if (!queued.ok) {
      cleanup();
      return fail(inferenceError('', queued.status), queued.status === 429 ? 429 : 502);
    }
    const job = await queued.json() as { event_id?: unknown };
    if (typeof job.event_id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(job.event_id)) throw new Error('Invalid inference job.');
    const upstream = await fetch(`${endpoint}/${job.event_id}`, {
      headers: auth, cache: 'no-store', redirect: 'error', signal: controller.signal,
    });
    if (!upstream.ok || !upstream.body) {
      cleanup();
      return fail(inferenceError('', upstream.status), upstream.status === 429 ? 429 : 502);
    }
    const body = upstream.body;
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(out) {
        const send = (value: object) => {
          if (controller.signal.aborted) return;
          try { out.enqueue(encoder.encode(`${JSON.stringify(value)}\n`)); }
          catch { controller.abort(); }
        };
        try {
          send({ status: 'queued' });
          let complete = false;
          for await (const event of gradioEvents(body)) {
            if (event.event === 'heartbeat') { send({ status: 'queued' }); continue; }
            if (event.event === 'error') { send({ error: inferenceError(event.data) }); complete = true; break; }
            if (event.event !== 'generating' && event.event !== 'complete') continue;
            const result: unknown = JSON.parse(event.data);
            if (!Array.isArray(result) || typeof result[0] !== 'string' || result[0].length > 32000) throw new Error('Invalid inference output.');
            send({ text: result[0], done: event.event === 'complete' });
            if (event.event === 'complete') { complete = true; break; }
          }
          if (!complete) throw new Error('Inference stream ended early.');
        } catch {
          if (!req.signal.aborted && !controller.signal.aborted) send({ error: inferenceError('') });
          else if (!req.signal.aborted) { try { out.enqueue(encoder.encode(`${JSON.stringify({ error: 'Inference timed out. Please try again.' })}\n`)); } catch { /* Reader disconnected. */ } }
        } finally {
          controller.abort(); cleanup();
          try { out.close(); } catch { /* Reader disconnected. */ }
        }
      },
      cancel() { controller.abort(); cleanup(); },
    });
    return new Response(stream, { headers: { ...headers, 'Content-Type': 'application/x-ndjson', 'X-Accel-Buffering': 'no' } });
  } catch {
    controller.abort(); cleanup();
    return fail('Could not connect to Hugging Face inference. Please try again shortly.', 502);
  }
}
