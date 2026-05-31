create table if not exists public.mood_entries (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  timestamp timestamptz not null,
  who5_pct integer not null,
  phq9 integer,
  gad7 integer,
  high_items text[] not null default '{}',
  time_period text not null,
  created_at timestamptz not null default now(),
  unique (user_id, timestamp)
);

alter table public.mood_entries enable row level security;

drop policy if exists "Users can read own mood entries" on public.mood_entries;
drop policy if exists "Users can insert own mood entries" on public.mood_entries;
drop policy if exists "Users can update own mood entries" on public.mood_entries;
drop policy if exists "Users can delete own mood entries" on public.mood_entries;

create policy "Users can read own mood entries"
on public.mood_entries
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own mood entries"
on public.mood_entries
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own mood entries"
on public.mood_entries
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own mood entries"
on public.mood_entries
for delete
to authenticated
using (auth.uid() = user_id);
