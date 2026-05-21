-- Migration 002: add multi-genre, ranked goals, and launch timeframe columns
-- Run this in Supabase SQL Editor after migration 001

-- Multiple genres as a jsonb array (replaces single `genre` text for new books)
alter table public.books
  add column if not exists genres jsonb;

-- Ranked goals as a jsonb array (e.g. ["build_readership", "sell_copies"])
-- primary_goal is kept for backward compatibility and set to goals_ranked[0]
alter table public.books
  add column if not exists goals_ranked jsonb;

-- Launch timeframe range (replaces exact launch_date for new books)
-- Values: 'within_12mo' | '12_18mo' | '1_2yr' | '2yr_plus'
alter table public.books
  add column if not exists launch_timeframe text;

-- Add 'undecided' as a valid publishing_path value
-- (Postgres check constraint must be dropped and recreated)
alter table public.books
  drop constraint if exists books_publishing_path_check;

alter table public.books
  add constraint books_publishing_path_check
  check (publishing_path in ('self', 'traditional', 'hybrid', 'undecided'));
