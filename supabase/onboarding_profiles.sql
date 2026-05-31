create table if not exists public.onboarding_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  goals text[] not null default '{}',
  triggers text[] not null default '{}',
  sleep_habit text,
  completed_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.onboarding_profiles enable row level security;

drop policy if exists "Users can read own onboarding profile" on public.onboarding_profiles;
drop policy if exists "Users can insert own onboarding profile" on public.onboarding_profiles;
drop policy if exists "Users can update own onboarding profile" on public.onboarding_profiles;
drop policy if exists "Users can delete own onboarding profile" on public.onboarding_profiles;

create policy "Users can read own onboarding profile"
on public.onboarding_profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own onboarding profile"
on public.onboarding_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own onboarding profile"
on public.onboarding_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own onboarding profile"
on public.onboarding_profiles
for delete
to authenticated
using (auth.uid() = user_id);
