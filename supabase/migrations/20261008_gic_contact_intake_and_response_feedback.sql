-- Public inquiry intake and explicit LooseMouth response feedback.
-- These tables intentionally have no anon/authenticated policies. Only the
-- server-side service-role endpoint may insert/read their contents.
create table if not exists public.gic_contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  sender_name text not null default '' check (char_length(sender_name) <= 100),
  sender_email text not null check (char_length(sender_email) between 3 and 254),
  subject text not null default '' check (char_length(subject) <= 200),
  message text not null check (char_length(message) between 5 and 5000),
  delivery_status text not null default 'pending' check (delivery_status in ('pending','sent')),
  resend_message_id text,
  delivery_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.gic_contact_inquiries enable row level security;
revoke all on public.gic_contact_inquiries from anon, authenticated;
grant select, insert, update on public.gic_contact_inquiries to service_role;
create index if not exists gic_contact_inquiries_delivery_idx on public.gic_contact_inquiries(delivery_status, created_at desc);

create table if not exists public.loosemouth_response_feedback (
  id uuid primary key default gen_random_uuid(),
  feedback_key uuid not null unique,
  user_id uuid references auth.users(id) on delete set null,
  actor_hash text not null check (actor_hash ~ '^[a-f0-9]{64}$'),
  response_hash text not null check (response_hash ~ '^[a-f0-9]{64}$'),
  conversation_id uuid,
  model text not null check (model in ('fast','medium','enhanced')),
  rating text not null check (rating in ('positive','negative')),
  reason text check (reason is null or reason in ('incorrect','incomplete','irrelevant','formatting','unsafe','other')),
  comment text not null default '' check (char_length(comment) <= 600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.loosemouth_response_feedback enable row level security;
revoke all on public.loosemouth_response_feedback from anon, authenticated;
grant select, insert, update on public.loosemouth_response_feedback to service_role;
create index if not exists loosemouth_response_feedback_created_idx on public.loosemouth_response_feedback(created_at desc);
create index if not exists loosemouth_response_feedback_rating_idx on public.loosemouth_response_feedback(rating, created_at desc);