-- Paid users can write reports; Enhanced users can write reports and applets.
-- Reads/deletes remain available after downgrade so users keep access to their own work.
drop policy if exists "Users insert own LooseMouth artifacts" on public.loosemouth_artifacts;
create policy "Entitled users insert own LooseMouth artifacts"
on public.loosemouth_artifacts for insert to authenticated
with check (
  auth.uid() = user_id
  and (
    (kind = 'report' and public.has_loosemouth_tier('paid'))
    or (kind = 'applet' and public.has_loosemouth_tier('enhanced'))
  )
);

drop policy if exists "Users update own LooseMouth artifacts" on public.loosemouth_artifacts;
create policy "Entitled users update own LooseMouth artifacts"
on public.loosemouth_artifacts for update to authenticated
using (
  auth.uid() = user_id
  and (
    (kind = 'report' and public.has_loosemouth_tier('paid'))
    or (kind = 'applet' and public.has_loosemouth_tier('enhanced'))
  )
)
with check (
  auth.uid() = user_id
  and (
    (kind = 'report' and public.has_loosemouth_tier('paid'))
    or (kind = 'applet' and public.has_loosemouth_tier('enhanced'))
  )
);
