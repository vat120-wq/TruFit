-- Run in the Supabase SQL editor. Safe to run more than once.
create table if not exists public.trufit_sync (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.trufit_sync enable row level security;

drop policy if exists "read own encrypted TruFit data" on public.trufit_sync;
drop policy if exists "insert own encrypted TruFit data" on public.trufit_sync;
drop policy if exists "update own encrypted TruFit data" on public.trufit_sync;

create policy "read own encrypted TruFit data" on public.trufit_sync
for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own encrypted TruFit data" on public.trufit_sync
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own encrypted TruFit data" on public.trufit_sync
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update on public.trufit_sync to authenticated;

create table if not exists public.trufit_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  meal text not null default 'Dinner',
  servings numeric not null default 1 check (servings > 0),
  calories numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  ingredients jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists trufit_recipes_user_name_idx
on public.trufit_recipes (user_id, lower(name));

alter table public.trufit_recipes enable row level security;
drop policy if exists "read own recipes" on public.trufit_recipes;
drop policy if exists "insert own recipes" on public.trufit_recipes;
drop policy if exists "update own recipes" on public.trufit_recipes;
drop policy if exists "delete own recipes" on public.trufit_recipes;
create policy "read own recipes" on public.trufit_recipes for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own recipes" on public.trufit_recipes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own recipes" on public.trufit_recipes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own recipes" on public.trufit_recipes for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.trufit_recipes to authenticated;

create table if not exists public.trufit_ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  unit text not null default '1 serving',
  calories numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists trufit_ingredients_user_name_idx
on public.trufit_ingredients (user_id, lower(name));

alter table public.trufit_ingredients enable row level security;
drop policy if exists "read own ingredients" on public.trufit_ingredients;
drop policy if exists "insert own ingredients" on public.trufit_ingredients;
drop policy if exists "update own ingredients" on public.trufit_ingredients;
drop policy if exists "delete own ingredients" on public.trufit_ingredients;
create policy "read own ingredients" on public.trufit_ingredients for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own ingredients" on public.trufit_ingredients for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own ingredients" on public.trufit_ingredients for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own ingredients" on public.trufit_ingredients for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.trufit_ingredients to authenticated;
