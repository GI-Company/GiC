create table if not exists public.loosemouth_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.loosemouth_conversations(id) on delete set null,
  kind text not null check (kind in ('report','applet')),
  title text not null check (char_length(title) between 1 and 160),
  prompt text not null default '',
  content jsonb not null default '{}'::jsonb,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists loosemouth_artifacts_user_updated_idx on public.loosemouth_artifacts(user_id, updated_at desc);
alter table public.loosemouth_artifacts enable row level security;
create policy "Users read own LooseMouth artifacts" on public.loosemouth_artifacts for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own LooseMouth artifacts" on public.loosemouth_artifacts for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own LooseMouth artifacts" on public.loosemouth_artifacts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own LooseMouth artifacts" on public.loosemouth_artifacts for delete to authenticated using (auth.uid() = user_id);