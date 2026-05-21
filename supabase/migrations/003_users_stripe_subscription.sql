-- Migration 003: add stripe_subscription_id to users table
-- Run this in Supabase SQL Editor

alter table public.users
  add column if not exists stripe_subscription_id text;
