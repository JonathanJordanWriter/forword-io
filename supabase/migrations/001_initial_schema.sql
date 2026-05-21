-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table if not exists public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  full_name       text,
  stripe_customer_id text,
  tier            text not null default 'starter' check (tier in ('starter', 'author', 'pro')),
  tier_expires_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- BOOKS
-- ============================================================
create table if not exists public.books (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  title            text,
  book_type        text check (book_type in ('fiction','nonfiction','poetry','childrens','ya','graphic_novel','anthology')),
  genre            text,
  subgenre         text,
  publishing_path  text check (publishing_path in ('self','traditional','hybrid')),
  book_stage       text check (book_stage in (
    'idea','still_writing','finished_manuscript','beta_reading',
    'revision','editing','cover_design','published'
  )),
  launch_date      date,
  comp_titles      jsonb,
  primary_goal     text check (primary_goal in (
    'build_readership','sell_copies','attract_agent','relaunch','audiobook'
  )),
  ideal_reader     jsonb,
  platforms        jsonb,
  time_per_week    text check (time_per_week in ('1_2hrs','3_5hrs','6_10hrs')),
  monthly_budget   text check (monthly_budget in ('0_50','50_200','200_plus')),
  experience_level text check (experience_level in ('first_time','mid_career','established')),
  existing_audience text check (existing_audience in ('under_500','500_2k','2k_10k','10k_plus')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- PLANS
-- ============================================================
create table if not exists public.plans (
  id             uuid primary key default gen_random_uuid(),
  book_id        uuid not null references public.books(id) on delete cascade,
  user_id        uuid not null references public.users(id) on delete cascade,
  cycle_number   integer not null default 1,
  plan_type      text check (plan_type in ('foundation','audience_build','launch_countdown','relaunch','evergreen')),
  generated_at   timestamptz not null default now(),
  total_tasks    integer,
  completion_pct integer not null default 0,
  current_phase  integer not null default 1,
  status         text not null default 'active' check (status in ('active','completed','archived')),
  raw_ai_output  jsonb
);

-- ============================================================
-- TASKS
-- ============================================================
create table if not exists public.tasks (
  id             uuid primary key default gen_random_uuid(),
  plan_id        uuid not null references public.plans(id) on delete cascade,
  user_id        uuid not null references public.users(id) on delete cascade,
  phase          integer,
  week_number    integer,
  day_number     integer,
  title          text,
  description    text,
  category       text check (category in ('social','pr','email','publishing','foundation','planning')),
  platform_tag   text,
  estimated_mins integer,
  is_completed   boolean not null default false,
  completed_at   timestamptz,
  is_locked      boolean not null default false,
  notes          text,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- POST PROMPTS
-- ============================================================
create table if not exists public.post_prompts (
  id              uuid primary key default gen_random_uuid(),
  category        text,
  book_type       text check (book_type in ('fiction','nonfiction','both')),
  platform        text,
  prompt_text     text,
  why_it_works    text,
  do_tip          text,
  dont_tip        text,
  is_promotional  boolean not null default false,
  stage_relevance text[],
  tier_required   text not null default 'starter' check (tier_required in ('starter','author','pro'))
);

-- ============================================================
-- USER PROMPTS (weekly usage tracking)
-- ============================================================
create table if not exists public.user_prompts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  book_id    uuid not null references public.books(id) on delete cascade,
  prompt_id  uuid not null references public.post_prompts(id),
  week_start date,
  action     text check (action in ('served','saved','skipped','done')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- WEEKLY CHECK-INS
-- ============================================================
create table if not exists public.weekly_checkins (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  plan_id          uuid not null references public.plans(id) on delete cascade,
  week_number      integer,
  energy_rating    integer check (energy_rating between 1 and 5),
  tasks_completed  integer,
  tasks_skipped    integer,
  load_adjustment  text check (load_adjustment in ('reduced','normal','increased')),
  created_at       timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.users enable row level security;
alter table public.books enable row level security;
alter table public.plans enable row level security;
alter table public.tasks enable row level security;
alter table public.user_prompts enable row level security;
alter table public.weekly_checkins enable row level security;

-- Users can only read/update their own profile
create policy "users: own row" on public.users
  for all using (auth.uid() = id);

-- Books, plans, tasks, prompts, checkins — own data only
create policy "books: own" on public.books
  for all using (auth.uid() = user_id);

create policy "plans: own" on public.plans
  for all using (auth.uid() = user_id);

create policy "tasks: own" on public.tasks
  for all using (auth.uid() = user_id);

create policy "user_prompts: own" on public.user_prompts
  for all using (auth.uid() = user_id);

create policy "weekly_checkins: own" on public.weekly_checkins
  for all using (auth.uid() = user_id);

-- Post prompts are public read
alter table public.post_prompts enable row level security;
create policy "post_prompts: public read" on public.post_prompts
  for select using (true);
