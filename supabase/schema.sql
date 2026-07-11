-- Run once in the Supabase SQL editor.
create table if not exists public.trufit_sync (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.trufit_sync enable row level security;

create policy "read own encrypted TruFit data"
on public.trufit_sync for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "insert own encrypted TruFit data"
on public.trufit_sync for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "update own encrypted TruFit data"
on public.trufit_sync for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update on public.trufit_sync to authenticated;
