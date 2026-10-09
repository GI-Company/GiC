import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase-public';

export type CheckoutPlan = 'paid' | 'enhanced';
export const AUTH_STORAGE_KEY = 'gic-loosemouth-session';
export function checkoutPlan(value: string | null | undefined): CheckoutPlan | null {
  return value === 'paid' || value === 'enhanced' ? value : null;
}
export function signupForPlan(plan: CheckoutPlan) {
  return `/intent?signup=1&plan=${plan}`;
}
export function pricingForPlan(plan: CheckoutPlan) {
  return `/pricing?plan=${plan}#plans`;
}

// Refresh before checkout so an expired browser session does not strand an upgrade.
export async function checkoutAccessToken(): Promise<string | null> {
  let session: { access_token?: string; refresh_token?: string; expires_at?: number; expires_in?: number };
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    session = JSON.parse(raw);
  } catch { return null; }
  if (!session?.access_token) return null;
  if (session.expires_at && session.expires_at > Date.now() / 1000 + 60) return session.access_token;
  if (!session.refresh_token) return session.expires_at ? null : session.access_token;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!response.ok) {
    if (response.status === 400 || response.status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    throw new Error('Your session could not be refreshed. Please try again.');
  }
  const next = await response.json();
  if (!next.access_token || !next.refresh_token) throw new Error('Your session could not be refreshed.');
  next.expires_at = next.expires_at || Math.floor(Date.now() / 1000) + (next.expires_in || 3600);
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
  return next.access_token;
}
