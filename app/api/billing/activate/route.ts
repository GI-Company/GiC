import { NextRequest, NextResponse } from 'next/server';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase-public';

export const runtime = 'nodejs';
const PRICE_IDS = {
  paid: 'price_1UO1qp0ULZCgUuKWA1vgyIOj',
  enhanced: 'price_1UO1qr0ULZCgUuKWTJpXtg6S',
} as const;

type CheckoutSession = {
  id: string;
  mode: string;
  status: string;
  client_reference_id?: string | null;
  customer?: string | null;
  subscription?: string | null;
  metadata?: { user_id?: string; tier?: string };
};
type StripeSubscription = {
  id: string;
  customer?: string | null;
  status: string;
  trial_start?: number | null;
  trial_end?: number | null;
  cancel_at_period_end?: boolean;
  metadata?: { user_id?: string; tier?: string };
  items?: { data?: Array<{ price?: { id?: string }; current_period_end?: number | null }> };
};

async function stripeGet<T>(resource: string, key: string): Promise<T> {
  const response = await fetch('https://api.stripe.com/v1/' + resource, {
    headers: { Authorization: 'Bearer ' + key },
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('Stripe could not confirm the subscription.');
  return response.json() as Promise<T>;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Sign in to activate your subscription.' }, { status: 401 });
  }
  const userResponse = await fetch(SUPABASE_URL + '/auth/v1/user', {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: auth },
    cache: 'no-store',
  });
  if (!userResponse.ok) {
    return NextResponse.json({ error: 'Your session expired. Please sign in again.' }, { status: 401 });
  }
  const user = await userResponse.json() as { id: string };
  const body = await req.json().catch(() => null) as { session_id?: unknown } | null;
  const sessionId = body?.session_id;
  if (typeof sessionId !== 'string' || !/^cs_(live|test)_[A-Za-z0-9]{12,}$/.test(sessionId)) {
    return NextResponse.json({ error: 'Invalid checkout session.' }, { status: 400 });
  }
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!stripeKey || !supabaseKey) {
    return NextResponse.json({ error: 'Subscription activation is not configured.' }, { status: 503 });
  }

  try {
    const session = await stripeGet<CheckoutSession>('checkout/sessions/' + sessionId, stripeKey);
    if (session.status !== 'complete' || session.mode !== 'subscription'
      || session.client_reference_id !== user.id || session.metadata?.user_id !== user.id
      || typeof session.subscription !== 'string' || typeof session.customer !== 'string') {
      return NextResponse.json({ error: 'Checkout has not completed for this account.' }, { status: 409 });
    }
    const subscription = await stripeGet<StripeSubscription>('subscriptions/' + session.subscription, stripeKey);
    const itemPrices = (subscription.items?.data || []).map((item) => item.price?.id);
    const tier = itemPrices.includes(PRICE_IDS.enhanced) ? 'enhanced'
      : itemPrices.includes(PRICE_IDS.paid) ? 'paid' : null;
    if (!tier || subscription.metadata?.user_id !== user.id || subscription.metadata?.tier !== tier
      || session.metadata?.tier !== tier || subscription.customer !== session.customer
      || !['active', 'trialing'].includes(subscription.status)) {
      return NextResponse.json({ error: 'Subscription could not be verified for this account.' }, { status: 409 });
    }
    const periodEnd = subscription.items?.data?.[0]?.current_period_end;
    const entitlement = {
      user_id: user.id,
      stripe_customer_id: session.customer,
      stripe_subscription_id: subscription.id,
      tier,
      subscription_status: subscription.status,
      trial_started_at: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      updated_at: new Date().toISOString(),
    };
    const endpoint = new URL('/rest/v1/loosemouth_billing_entitlements', SUPABASE_URL);
    endpoint.searchParams.set('on_conflict', 'user_id');
    const save = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: 'Bearer ' + supabaseKey,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(entitlement),
      cache: 'no-store',
    });
    if (!save.ok) throw new Error('Subscription confirmed, but workspace access could not be saved.');
    return NextResponse.json({ tier, status: subscription.status, trial_end: entitlement.trial_end }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Subscription activation is temporarily unavailable.',
    }, { status: 502 });
  }
}
