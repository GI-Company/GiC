import { NextResponse } from 'next/server';
import { SUPABASE_URL } from '@/lib/supabase-public';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const jsonHeaders = {
  'Cache-Control': 'no-store, max-age=0',
};

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: jsonHeaders });
}

export async function GET() {
  const supabaseSecret =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !supabaseSecret) {
    return json(
      {
        ok: false,
        error: 'Supabase server credentials are not configured.',
      },
      503,
    );
  }

  // This must reach Postgres, not merely prove that the Next.js deployment is
  // alive. A tiny service-role read is enough to generate real database/API
  // activity without changing user data.
  const probeUrl = new URL('/rest/v1/loosemouth_conversations', SUPABASE_URL);
  probeUrl.searchParams.set('select', 'id');
  probeUrl.searchParams.set('limit', '1');

  try {
    const response = await fetch(probeUrl, {
      method: 'GET',
      headers: {
        apikey: supabaseSecret,
        Authorization: `Bearer ${supabaseSecret}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });

    // Consume the response so the database request fully completes, but never
    // expose returned rows to the cron caller.
    await response.text();

    if (!response.ok) {
      return json(
        {
          ok: false,
          service: 'supabase',
          status: response.status,
          error: 'Supabase database probe failed.',
        },
        502,
      );
    }

    return json({
      ok: true,
      service: 'supabase',
      database: 'reachable',
      checked_at: new Date().toISOString(),
    });
  } catch {
    return json(
      {
        ok: false,
        service: 'supabase',
        error: 'Supabase database probe timed out or was unreachable.',
      },
      502,
    );
  }
}
