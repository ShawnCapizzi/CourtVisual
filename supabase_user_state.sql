-- Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- A single row per user holds their app state (team, favorites, prefs) as JSON.
-- RLS locks each row to its owner. Later, the full normalized schema can replace this.
create table if not exists public.user_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_state enable row level security;
drop policy if exists "own state" on public.user_state;
create policy "own state" on public.user_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
