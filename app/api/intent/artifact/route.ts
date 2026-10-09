import { NextRequest, NextResponse } from 'next/server';
import { user, entitlement, consumeWorkbenchQuota, WORKBENCH_LIMIT } from '@/lib/workbench-access';
import { runArtifactAgent } from '@/lib/artifact-agent';

export const runtime = 'nodejs';

const WORKBENCH_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'] as const;
type ConversationTurn = {
  role?: unknown;
  text?: unknown;
  sources?: unknown;
};

function conversationContext(value: unknown) {
  if (!Array.isArray(value)) return '';

  const turns = value
    .slice(-16)
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const turn = entry as ConversationTurn;
      const role = turn.role === 'assistant' ? 'Assistant' : turn.role === 'user' ? 'User' : null;
      const text = typeof turn.text === 'string' ? turn.text.trim().slice(0, 4_000) : '';
      if (!role || !text) return null;

      const sources = Array.isArray(turn.sources)
        ? turn.sources
            .slice(0, 8)
            .map((source) => {
              if (!source || typeof source !== 'object') return null;
              const row = source as { title?: unknown; url?: unknown };
              const title = typeof row.title === 'string' ? row.title.slice(0, 240) : '';
              const url = typeof row.url === 'string' && /^https?:\/\//i.test(row.url) ? row.url.slice(0, 2_000) : '';
              return title || url ? `- ${title || url}${url ? ` — ${url}` : ''}` : null;
            })
            .filter(Boolean)
        : [];

      return `${role}: ${text}${sources.length ? `\nSources:\n${sources.join('\n')}` : ''}`;
    })
    .filter(Boolean);

  if (!turns.length) return '';
  return `\n\nActive conversation context:\n---\n${turns.join('\n\n')}\n---\nUse this only as source material for the requested artifact.`;
}

function normalizeArtifact(kind: 'report' | 'applet', artifact: Record<string, unknown>) {
  const title = typeof artifact.title === 'string' && artifact.title.trim()
    ? artifact.title.trim().slice(0, 160)
    : kind === 'report' ? 'LooseMouth Report' : 'LooseMouth Applet';

  if (kind === 'report') {
    const markdown = typeof artifact.markdown === 'string' ? artifact.markdown.trim() : '';
    if (!markdown) throw new Error('Report content was empty.');
    return { title, markdown: markdown.slice(0, 120_000) };
  }

  const rawFiles = Array.isArray(artifact.files) ? artifact.files : [];
  if (!rawFiles.some(file => file && typeof file === 'object' && file.path === 'index.html' && typeof file.content === 'string' && file.content.trim())) throw new Error('Applet HTML must contain nonempty content.');
  const allowed = new Set(['index.html', 'style.css', 'app.js']);
  const files = rawFiles
    .filter((file): file is { path?: unknown; content?: unknown } => Boolean(file && typeof file === 'object'))
    .map((file) => ({
      path: typeof file.path === 'string' ? file.path : '',
      content: typeof file.content === 'string' ? file.content : '',
    }))
    .filter((file) => allowed.has(file.path))
    .map((file) => ({ ...file, content: file.content.slice(0, 80_000) }));

  const map = new Map(files.map((file) => [file.path, file.content]));
  if (!map.has('index.html')) map.set('index.html', '<main id="app"></main>');
  if (!map.has('style.css')) map.set('style.css', '');
  if (!map.has('app.js')) map.set('app.js', '');

  return {
    title,
    files: ['index.html', 'style.css', 'app.js'].map((path) => ({ path, content: map.get(path) || '' })),
  };
}

export async function POST(req: NextRequest) {
  if (req.headers.get('origin') && req.headers.get('origin') !== req.nextUrl.origin) {
    return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  }

  const me = await user(req);
  if (!me?.id) {
    return NextResponse.json({ error: 'Sign in to use the LooseMouth Workbench.' }, { status: 401 });
  }

  const tier=await entitlement(me.id);
  if (!tier) return NextResponse.json({ error: 'Subscription access could not be verified. Try again shortly.' }, { status: 503 });
  if(tier==='free') return NextResponse.json({error:'LooseMouth Workbench requires a Paid or Enhanced account.',upgrade_required:true},{status:403});
  const quota = await consumeWorkbenchQuota(me.id);
  if (!quota.configured) {
    return NextResponse.json({ error: 'Workbench access is being configured. Please try again shortly.' }, { status: 503 });
  }
  if (!quota.allowed) {
    const response = NextResponse.json(
      { error: 'Workbench generation limit reached. Please try again after the current hourly window resets.' },
      { status: 429 },
    );
    response.headers.set('X-RateLimit-Limit', String(WORKBENCH_LIMIT));
    response.headers.set('X-RateLimit-Remaining', '0');
    if (quota.resetAt) response.headers.set('X-RateLimit-Reset', quota.resetAt);
    return response;
  }

  let body: {
    kind?: unknown;
    prompt?: unknown;
    current?: unknown;
    conversation_context?: unknown;
  };

  try {
    const text = await req.text();
    if (text.length > 500000) return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
    body = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid body.');
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const kind: 'report' | 'applet' = body.kind === 'applet' ? 'applet' : 'report';
  if(kind==='applet'&&tier!=='enhanced') return NextResponse.json({error:'Runnable applets require Enhanced Workspace.',upgrade_required:true},{status:403});
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, 12_000) : '';
  if (!prompt) {
    return NextResponse.json({ error: 'Describe what you want LooseMouth to build.' }, { status: 400 });
  }

  const key = process.env.GROQ_API;
  if (!key) {
    return NextResponse.json({ error: 'Workbench generation is not configured.' }, { status: 503 });
  }

  try {
    const result = await runArtifactAgent({ key, model: WORKBENCH_MODELS[0], kind, prompt, context: conversationContext(body.conversation_context), current: body.current, normalize: normalizeArtifact });
    const response = NextResponse.json({ kind, ...result, model: WORKBENCH_MODELS[0] });
    response.headers.set('X-RateLimit-Limit', String(WORKBENCH_LIMIT));
    response.headers.set('X-RateLimit-Remaining', String(quota.remaining));
    if (quota.resetAt) response.headers.set('X-RateLimit-Reset', quota.resetAt);
    return response;
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : 'Workbench agent unavailable.' }, { status: 502 });
  }
}
