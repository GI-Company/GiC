import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { SUPABASE_URL } from '@/lib/supabase-public';

export const runtime = 'nodejs';
const ACTIVE_STATUSES = new Set(['active', 'trialing']);

function serviceKey() {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Supabase secret missing');
  return key;
}

function verify(raw: string, header: string, secret: string) {
  const fields = header.split(',').map((part) => part.trim().split('=', 2));
  const timestamp = fields.find(([key]) => key === 't')?.[1];
  const signatures = fields.filter(([key]) => key === 'v1').map(([, value]) => value).filter(Boolean);
  if (!timestamp || signatures.length === 0) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const expected = Buffer.from(
    createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex'),
    'hex',
  );

  return signatures.some((signature) => {
    try {
      const candidate = Buffer.from(signature, 'hex');
      return candidate.length === expected.length && timingSafeEqual(expected, candidate);
    } catch {
      return false;
    }
  });
}

async function eventSeen(eventId: string) {
  const key = serviceKey();
  const url = new URL('/rest/v1/loosemouth_stripe_events', SUPABASE_URL);
  url.searchParams.set('select', 'stripe_event_id');
  url.searchParams.set('stripe_event_id', `eq.${eventId}`);
  url.searchParams.set('limit', '1');
  const response = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Webhook event lookup failed');
  return ((await response.json()) as unknown[]).length > 0;
}

async function markProcessed(eventId: string, eventType: string) {
  const key = serviceKey();
  const response = await fetch(new URL('/rest/v1/loosemouth_stripe_events', SUPABASE_URL), {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify({ stripe_event_id: eventId, event_type: eventType }),
  });
  if (!response.ok) throw new Error('Webhook event record failed');
}

async function upsert(row: Record<string, unknown>) {
  const key = serviceKey();
  const response = await fetch(
    new URL('/rest/v1/loosemouth_billing_entitlements?on_conflict=user_id', SUPABASE_URL),
    {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(row),
    },
  );
  if (!response.ok) throw new Error('Entitlement update failed');
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook not configured.' }, { status: 503 });

  const raw = await req.text();
  const signature = req.headers.get('stripe-signature') || '';
  if (!verify(raw, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  const event = JSON.parse(raw) as { id: string; type: string; data: { object: any } };
  if (!event.id) return NextResponse.json({ error: 'Missing event id.' }, { status: 400 });
  if (await eventSeen(event.id)) return NextResponse.json({ received: true, duplicate: true });

  const object = event.data.object;
  if (event.type === 'checkout.session.completed' && object.mode === 'subscription') {
    const userId = object.client_reference_id || object.metadata?.user_id;
    const tier = object.metadata?.tier;
    if (userId && (tier === 'paid' || tier === 'enhanced')) {
      await upsert({
        user_id: userId,
        stripe_customer_id: typeof object.customer === 'string' ? object.customer : null,
        stripe_subscription_id: typeof object.subscription === 'string' ? object.subscription : null,
        tier,
        subscription_status: 'active',
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      });
    }
  } else if (event.type.startsWith('customer.subscription.')) {
    const userId = object.metadata?.user_id;
    const tier = object.metadata?.tier;
    if (userId) {
      const active = ACTIVE_STATUSES.has(object.status);
      await upsert({
        user_id: userId,
        stripe_customer_id: typeof object.customer === 'string' ? object.customer : null,
        stripe_subscription_id: object.id,
        tier: active && (tier === 'paid' || tier === 'enhanced') ? tier : 'free',
        subscription_status: object.status,
        trial_started_at:
          object.status === 'trialing'
            ? object.trial_start
              ? new Date(object.trial_start * 1000).toISOString()
              : new Date().toISOString()
            : undefined,
        trial_end: object.trial_end ? new Date(object.trial_end * 1000).toISOString() : null,
        current_period_end: object.current_period_end
          ? new Date(object.current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: Boolean(object.cancel_at_period_end),
        updated_at: new Date().toISOString(),
      });
    }
  }

  await markProcessed(event.id, event.type);
  return NextResponse.json({ received: true });
}
