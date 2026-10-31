-- Separate VirtualLab entitlements from existing LooseMouth subscriptions.
-- Apply only after staging validation; do not modify existing general GIC subscriptions.
create table if not exists public.virtual_lab_billing_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  tier text not null default 'inactive' check (tier in ('inactive','researcher','laboratory')),
  subscription_status text,
  current_period_end timestamptz,
  trial_started_at timestamptz,
  trial_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.virtual_lab_billing_entitlements enable row level security;
revoke all on public.virtual_lab_billing_entitlements from anon, authenticated;
grant select on public.virtual_lab_billing_entitlements to authenticated;
drop policy if exists "VirtualLab customers see own subscriptions" on public.virtual_lab_billing_entitlements;
create policy "VirtualLab customers see own subscriptions"
on public.virtual_lab_billing_entitlements for select to authenticated
using ((select auth.uid()) = user_id);

create table if not exists public.virtual_lab_stripe_events (
  stripe_event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);
alter table public.virtual_lab_stripe_events enable row level security;
revoke all on public.virtual_lab_stripe_events from anon,authenticated;

create table if not exists public.virtual_lab_beta_feedback (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  release_version text not null check (length(release_version) between 1 and 80),
  category text not null check (category in ('bug','installation','usability','feature')),
  details text not null check (char_length(details) between 15 and 3000),
  created_at timestamptz not null default now()
);
create index if not exists virtual_lab_beta_feedback_user_created on public.virtual_lab_beta_feedback(user_id,created_at desc);
alter table public.virtual_lab_beta_feedback enable row level security;
revoke all on public.virtual_lab_beta_feedback from anon,authenticated;
grant insert,select on public.virtual_lab_beta_feedback to authenticated;
drop policy if exists "VirtualLab users submit own feedback" on public.virtual_lab_beta_feedback;
create policy "VirtualLab users submit own feedback" on public.virtual_lab_beta_feedback
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "VirtualLab users read own feedback" on public.virtual_lab_beta_feedback;
create policy "VirtualLab users read own feedback" on public.virtual_lab_beta_feedback
for select to authenticated using ((select auth.uid()) = user_id);
