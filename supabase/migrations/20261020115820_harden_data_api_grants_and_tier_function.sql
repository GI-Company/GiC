-- GIC website | Supabase Data API grant cutover (2026-10-30).
-- Follow this pattern for EVERY new table: create table, enable RLS, define policies,
-- and explicitly GRANT only the API roles and operations required by that table.
-- These default-privilege statements affect future objects, not existing table grants.

alter default privileges for role postgres in schema public
  revoke all privileges on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select, update on sequences from anon, authenticated, service_role;

-- Reassert grants for the complete schema to support database recreation / reset.
-- service_role must only be used in trusted server-side code, never browser code.
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- End-user data: RLS policies further limit each authenticated user to their own rows.
grant select, insert, update, delete
  on public.loosemouth_conversations, public.loosemouth_messages,
     public.loosemouth_user_preferences, public.loosemouth_artifacts
  to authenticated;

-- Billing information is read-only to its owner. All mutations use service_role.
grant select
  on public.loosemouth_billing_entitlements,
     public.loosemouth_support_contributions
  to authenticated;

-- The RLS on billing_entitlements already allows authenticated users to read
-- their own entitlements, so elevated SECURITY DEFINER privilege is unnecessary.
-- Unknown required_tier values must never be interpreted as eligible.
create or replace function public.has_loosemouth_tier(required_tier text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $function$
  select exists (
    select 1 from public.loosemouth_billing_entitlements as e
    where e.user_id = auth.uid()
      and e.subscription_status in ('active', 'trialing')
      and case required_tier
        when 'paid' then e.tier in ('paid', 'enhanced')
        when 'enhanced' then e.tier = 'enhanced'
        else false
      end
  );
$function$;

-- Old projects had per-role EXECUTE grants even after REVOKE ... FROM PUBLIC.
revoke execute on function public.has_loosemouth_tier(text) from public, anon;
grant execute on function public.has_loosemouth_tier(text) to authenticated, service_role;

-- Keep server-only tables without anon/authenticated grants or RLS policies:
-- inference_rate_limits, gic_contact_inquiries, loosemouth_response_feedback,
-- loosemouth_stripe_events, loosemouth_usage_events, research_agent_requests.
-- Note: Supabase manages its own supabase_admin role defaults; do not edit them
-- manually from the postgres role. This migration targets app-created objects.
