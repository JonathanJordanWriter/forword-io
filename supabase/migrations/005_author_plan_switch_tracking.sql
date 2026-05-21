-- Track when an Author-tier user last transferred their subscription to a new project.
-- Used to enforce the once-per-calendar-month switch limit.
alter table public.users
  add column if not exists author_plan_switched_at timestamptz;
