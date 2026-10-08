create table if not exists public.loosemouth_stripe_events (
  stripe_event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);
alter table public.loosemouth_stripe_events enable row level security;
revoke all on public.loosemouth_stripe_events from anon, authenticated;

alter table public.loosemouth_billing_entitlements
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_end timestamptz;

create or replace function public.has_loosemouth_tier(required_tier text)
returns boolean language sql stable security definer set search_path=public
as $$
  select exists (
    select 1 from public.loosemouth_billing_entitlements e
    where e.user_id=auth.uid()
      and e.subscription_status in ('active','trialing')
      and case required_tier
        when 'paid' then e.tier in ('paid','enhanced')
        when 'enhanced' then e.tier='enhanced'
        else true end
  );
$$;
revoke all on function public.has_loosemouth_tier(text) from public;
grant execute on function public.has_loosemouth_tier(text) to authenticated;