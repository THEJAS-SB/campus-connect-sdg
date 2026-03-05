-- ============================================================
-- INNOVEX – Initial Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists vector;

-- ────────────────────────────────────────────────────────────
-- 1. profiles (RS ID system – every user)
-- ────────────────────────────────────────────────────────────
create table if not exists profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  rs_id             text unique not null,
  full_name         text,
  email             text not null,
  role              text not null check (role in ('student', 'mentor', 'investor', 'admin')),
  avatar_state      text default 'idle',
  innovation_score  integer default 0,
  streak_days       integer default 0,
  skills            text[],
  sdg_interests     text[],
  bio               text,
  embedding         vector(384),
  linkedin_url      text,
  created_at        timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- 2. startups
-- ────────────────────────────────────────────────────────────
create table if not exists startups (
  id             uuid primary key default uuid_generate_v4(),
  student_id     uuid references profiles(id) on delete cascade,
  name           text not null,
  description    text,
  stage          text default 'idea' check (stage in ('idea', 'mvp', 'revenue', 'funded', 'scaling')),
  domain         text,
  sdg_tags       text[],
  funding_raised numeric default 0,
  embedding      vector(384),
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- 3. investor_pipeline (junction: investor ↔ startup + stage)
-- ────────────────────────────────────────────────────────────
create table if not exists investor_pipeline (
  id              uuid primary key default uuid_generate_v4(),
  investor_id     uuid references profiles(id) on delete cascade,
  startup_id      uuid references startups(id) on delete cascade,
  pipeline_stage  text default 'bookmarked' check (pipeline_stage in ('bookmarked', 'in_talks', 'due_diligence', 'invested')),
  notes           text,
  created_at      timestamptz default now(),
  unique(investor_id, startup_id)
);

-- ────────────────────────────────────────────────────────────
-- 4. mentorship_connections
-- ────────────────────────────────────────────────────────────
create table if not exists mentorship_connections (
  id                  uuid primary key default uuid_generate_v4(),
  mentor_id           uuid references profiles(id) on delete cascade,
  student_id          uuid references profiles(id) on delete cascade,
  status              text default 'pending' check (status in ('pending', 'active', 'completed')),
  compatibility_score numeric,
  reasoning           text,
  created_at          timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- 5. meetings
-- ────────────────────────────────────────────────────────────
create table if not exists meetings (
  id           uuid primary key default uuid_generate_v4(),
  mentor_id    uuid references profiles(id) on delete cascade,
  student_id   uuid references profiles(id) on delete cascade,
  scheduled_at timestamptz,
  notes        text,
  meet_link    text,
  created_at   timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- 6. daily_missions
-- ────────────────────────────────────────────────────────────
create table if not exists daily_missions (
  id          uuid primary key default uuid_generate_v4(),
  student_id  uuid references profiles(id) on delete cascade,
  title       text not null,
  description text,
  xp_reward   integer default 50,
  completed   boolean default false,
  date        date default current_date,
  created_at  timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- 7. kpi_cache (single-row, refreshed hourly by cron)
-- ────────────────────────────────────────────────────────────
create table if not exists kpi_cache (
  id               integer primary key default 1,
  total_users      integer default 0,
  total_startups   integer default 0,
  total_funding    numeric default 0,
  cumulative_score bigint default 0,
  updated_at       timestamptz default now()
);

insert into kpi_cache (id) values (1) on conflict (id) do nothing;

-- ────────────────────────────────────────────────────────────
-- 8. ai_reports (weekly growth predictions)
-- ────────────────────────────────────────────────────────────
create table if not exists ai_reports (
  id          uuid primary key default uuid_generate_v4(),
  report_type text not null,      -- 'weekly_growth' | 'ecosystem_health'
  content     text not null,
  created_at  timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- Helper RPC: domain distribution for a mentor
-- ────────────────────────────────────────────────────────────
create or replace function get_mentor_domain_stats(p_mentor_id uuid)
returns table(domain text, count bigint) as $$
  select s.domain, count(*) as count
  from mentorship_connections mc
  join startups s on s.student_id = mc.student_id
  where mc.mentor_id = p_mentor_id
    and mc.status = 'active'
    and s.domain is not null
  group by s.domain
  order by count desc;
$$ language sql stable;

-- ────────────────────────────────────────────────────────────
-- Helper RPC: startup stage distribution (for admin donut)
-- ────────────────────────────────────────────────────────────
create or replace function get_stage_distribution()
returns table(stage text, count bigint) as $$
  select stage, count(*) from startups group by stage order by count desc;
$$ language sql stable;

-- ────────────────────────────────────────────────────────────
-- Row Level Security
-- ────────────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table startups enable row level security;
alter table investor_pipeline enable row level security;
alter table mentorship_connections enable row level security;
alter table meetings enable row level security;
alter table daily_missions enable row level security;
alter table kpi_cache enable row level security;
alter table ai_reports enable row level security;

-- profiles: users can read all, update only their own row
create policy "profiles_read_all"    on profiles for select using (true);
create policy "profiles_update_own"  on profiles for update using (auth.uid() = id);
create policy "profiles_insert_own"  on profiles for insert with check (auth.uid() = id);

-- startups: everyone can read; only the owner student can insert/update
create policy "startups_read_all"    on startups for select using (true);
create policy "startups_insert_own"  on startups for insert with check (auth.uid() = student_id);
create policy "startups_update_own"  on startups for update using (auth.uid() = student_id);

-- investor_pipeline: only the investor can manage their own rows
create policy "pipeline_own"         on investor_pipeline for all using (auth.uid() = investor_id);

-- mentorship_connections: mentor or student can see their connections
create policy "connections_own"      on mentorship_connections for select
  using (auth.uid() = mentor_id or auth.uid() = student_id);
create policy "connections_insert"   on mentorship_connections for insert with check (auth.uid() = mentor_id);
create policy "connections_update"   on mentorship_connections for update using (auth.uid() = mentor_id);

-- meetings: mentor or student can see their meetings
create policy "meetings_own"         on meetings for select
  using (auth.uid() = mentor_id or auth.uid() = student_id);
create policy "meetings_insert"      on meetings for insert with check (auth.uid() = mentor_id);

-- daily_missions: student sees only their own
create policy "missions_own"         on daily_missions for all using (auth.uid() = student_id);

-- kpi_cache: readable by all authenticated users
create policy "kpi_read"             on kpi_cache for select using (auth.role() = 'authenticated');

-- ai_reports: readable by all authenticated users
create policy "reports_read"         on ai_reports for select using (auth.role() = 'authenticated');
