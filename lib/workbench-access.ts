import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase-public';

export const WORKBENCH_LIMIT = 8;
const WORKBENCH_WINDOW_SECONDS = 3600;

export async function consumeWorkbenchQuota(userId: string) {
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return { allowed: false, remaining: 0, resetAt: null as string | null, configured: false };

  const actorKey = `artifact:${createHash('sha256').update(userId).digest('hex')}`;
  try {
    const response = await fetch(new URL('/rest/v1/rpc/consume_inference_quota', SUPABASE_URL), {
      method: 'POST',
      headers: {
        apikey: secret,
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_actor_key: actorKey,
        p_limit: WORKBENCH_LIMIT,
        p_window_seconds: WORKBENCH_WINDOW_SECONDS,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) return { allowed: false, remaining: 0, resetAt: null as string | null, configured: true };
    const data: unknown = await response.json();
    const row = Array.isArray(data) ? data[0] : null;
    if (!row || typeof row !== 'object') {
      return { allowed: false, remaining: 0, resetAt: null as string | null, configured: true };
    }

    const value = row as Record<string, unknown>;
    return {
      allowed: value.allowed === true,
      remaining: Number(value.remaining ?? 0),
      resetAt: typeof value.reset_at === 'string' ? value.reset_at : null,
      configured: true,
    };
  } catch {
    return { allowed: false, remaining: 0, resetAt: null as string | null, configured: true };
  }
}

export async function user(req: NextRequest) {
  const authorization = req.headers.get('authorization');
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
    return await response.json() as { id?: string };
  } catch {
    return null;
  }
}

export async function entitlement(userId:string){const secret=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;if(!secret)return null;try{const url=new URL('/rest/v1/loosemouth_billing_entitlements',SUPABASE_URL);url.searchParams.set('select','tier,subscription_status');url.searchParams.set('user_id',`eq.${userId}`);url.searchParams.set('limit','1');const r=await fetch(url,{headers:{apikey:secret,Authorization:`Bearer ${secret}`},cache:'no-store',signal:AbortSignal.timeout(5000)});if(!r.ok)return null;const rows=await r.json() as Array<{tier?:string;subscription_status?:string}>;const row=rows[0];if(!row||!['active','trialing'].includes(row.subscription_status||''))return 'free' as const;return row.tier==='enhanced'?'enhanced' as const:row.tier==='paid'?'paid' as const:'free' as const;}catch{return null;}}
