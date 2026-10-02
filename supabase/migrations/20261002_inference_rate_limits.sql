-- Durable server-side quota state for public INTENT inference.
create table if not exists public.inference_rate_limits (
  actor_key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.inference_rate_limits enable row level security;
revoke all on public.inference_rate_limits from anon, authenticated;

create or replace function public.consume_inference_quota(
  p_actor_key text,
  p_limit integer default 20,
  p_window_seconds integer default 3600
)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_row public.inference_rate_limits%rowtype;
begin
  if p_actor_key is null or length(p_actor_key) < 8 or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'invalid quota arguments';
  end if;

  insert into public.inference_rate_limits(actor_key, window_started_at, request_count, updated_at)
  values (p_actor_key, v_now, 1, v_now)
  on conflict (actor_key) do update
  set window_started_at = case
        when public.inference_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then v_now else public.inference_rate_limits.window_started_at end,
      request_count = case
        when public.inference_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then 1 else public.inference_rate_limits.request_count + 1 end,
      updated_at = v_now
  returning * into v_row;

  allowed := v_row.request_count <= p_limit;
  remaining := greatest(p_limit - v_row.request_count, 0);
  reset_at := v_row.window_started_at + make_interval(secs => p_window_seconds);
  return next;
end;
$$;

revoke all on function public.consume_inference_quota(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_inference_quota(text, integer, integer) to service_role;

create index if not exists inference_rate_limits_updated_at_idx on public.inference_rate_limits(updated_at);

-- Supabase helper is administrative only when present. Keep this migration
-- portable to fresh projects where rls_auto_enable() has not been installed.
do $
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public;
    grant execute on function public.rls_auto_enable() to service_role;
  end if;
end
$;
