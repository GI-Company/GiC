alter table public.loosemouth_conversations
  drop constraint if exists loosemouth_conversations_model_check;

alter table public.loosemouth_conversations
  alter column model set default 'fast';

alter table public.loosemouth_conversations
  add constraint loosemouth_conversations_model_check
  check (
    model = any (
      array[
        'fast'::text,
        'medium'::text,
        'enhanced'::text,
        'native'::text,
        'gemma4'::text,
        'intentR-402'::text
      ]
    )
  );

alter table public.loosemouth_user_preferences
  alter column preferred_model set default 'fast';
