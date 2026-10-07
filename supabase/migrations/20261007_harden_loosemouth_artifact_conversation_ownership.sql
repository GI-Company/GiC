drop policy if exists "Users insert own LooseMouth artifacts" on public.loosemouth_artifacts;
drop policy if exists "Users update own LooseMouth artifacts" on public.loosemouth_artifacts;

create policy "Users insert own LooseMouth artifacts"
on public.loosemouth_artifacts
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and (
    conversation_id is null
    or exists (
      select 1
      from public.loosemouth_conversations c
      where c.id = conversation_id
        and c.user_id = (select auth.uid())
    )
  )
);

create policy "Users update own LooseMouth artifacts"
on public.loosemouth_artifacts
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (
    conversation_id is null
    or exists (
      select 1
      from public.loosemouth_conversations c
      where c.id = conversation_id
        and c.user_id = (select auth.uid())
    )
  )
);
