-- =============================================
-- FitMentor AI — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

-- Workout Plans Table
create table if not exists workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  workouts jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint workout_plans_user_id_key unique (user_id)
);

-- Diet Plans Table
create table if not exists diet_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  meals jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint diet_plans_user_id_key unique (user_id)
);

-- Enable Row Level Security
alter table workout_plans enable row level security;
alter table diet_plans enable row level security;

-- RLS Policies: users can only access their own data
create policy "Users can manage their own workout plans"
  on workout_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own diet plans"
  on diet_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger workout_plans_updated_at
  before update on workout_plans
  for each row execute function update_updated_at();

create trigger diet_plans_updated_at
  before update on diet_plans
  for each row execute function update_updated_at();
