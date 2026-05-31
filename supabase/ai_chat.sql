create table if not exists public.ai_chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_chat_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('assistant', 'user')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_chat_conversations_user_updated_idx
on public.ai_chat_conversations (user_id, updated_at desc);

create index if not exists ai_chat_messages_conversation_created_idx
on public.ai_chat_messages (conversation_id, created_at asc);

alter table public.ai_chat_conversations enable row level security;
alter table public.ai_chat_messages enable row level security;

drop policy if exists "Users can read own chat conversations" on public.ai_chat_conversations;
drop policy if exists "Users can insert own chat conversations" on public.ai_chat_conversations;
drop policy if exists "Users can update own chat conversations" on public.ai_chat_conversations;
drop policy if exists "Users can delete own chat conversations" on public.ai_chat_conversations;

create policy "Users can read own chat conversations"
on public.ai_chat_conversations
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own chat conversations"
on public.ai_chat_conversations
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own chat conversations"
on public.ai_chat_conversations
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own chat conversations"
on public.ai_chat_conversations
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own chat messages" on public.ai_chat_messages;
drop policy if exists "Users can insert own chat messages" on public.ai_chat_messages;
drop policy if exists "Users can delete own chat messages" on public.ai_chat_messages;

create policy "Users can read own chat messages"
on public.ai_chat_messages
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own chat messages"
on public.ai_chat_messages
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.ai_chat_conversations
    where ai_chat_conversations.id = conversation_id
      and ai_chat_conversations.user_id = auth.uid()
  )
);

create policy "Users can delete own chat messages"
on public.ai_chat_messages
for delete
to authenticated
using (auth.uid() = user_id);
