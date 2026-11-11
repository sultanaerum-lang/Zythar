-- Run this in the Supabase SQL editor to enable optional account-based chat/reminder sync.
create table if not exists public.zythar_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  conversation jsonb not null default '[]'::jsonb,
  reminders jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.zythar_user_data enable row level security;
revoke all on public.zythar_user_data from anon;
grant select, insert, update, delete on public.zythar_user_data to authenticated;
drop policy if exists "Users can read their own Zythar data" on public.zythar_user_data;
create policy "Users can read their own Zythar data" on public.zythar_user_data for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert their own Zythar data" on public.zythar_user_data;
create policy "Users can insert their own Zythar data" on public.zythar_user_data for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update their own Zythar data" on public.zythar_user_data;
create policy "Users can update their own Zythar data" on public.zythar_user_data for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete their own Zythar data" on public.zythar_user_data;
create policy "Users can delete their own Zythar data" on public.zythar_user_data for delete to authenticated using ((select auth.uid()) = user_id);
