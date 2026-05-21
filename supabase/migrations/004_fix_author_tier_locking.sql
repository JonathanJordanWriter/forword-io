-- Fix: Author-tier users should only have 1 book's tasks fully unlocked.
-- This migration locks day-31+ tasks on any plan beyond the FIRST book
-- created by each Author-tier user.
--
-- "First book" = oldest books.created_at for that user.
-- Run this once in Supabase SQL Editor to correct existing data.

WITH author_users AS (
  SELECT id FROM public.users WHERE tier = 'author'
),
first_book_per_user AS (
  -- The oldest book per Author user is their "original" book whose plan stays unlocked
  SELECT DISTINCT ON (b.user_id)
    b.id  AS book_id,
    b.user_id
  FROM public.books b
  JOIN author_users au ON b.user_id = au.id
  ORDER BY b.user_id, b.created_at ASC
)
UPDATE public.tasks t
SET is_locked = true
FROM public.plans p
JOIN author_users au ON p.user_id = au.id
WHERE t.plan_id = p.id
  AND p.status   = 'active'
  AND p.book_id NOT IN (SELECT book_id FROM first_book_per_user)
  AND t.day_number > 30
  AND t.is_completed = false;
