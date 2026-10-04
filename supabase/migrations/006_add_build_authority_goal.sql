-- Add 'build_authority' to the primary_goal check constraint.
-- The UI and TypeScript type already include this value but the constraint was never updated,
-- causing an insert failure for any user who selects "Build authority" as their top goal.

ALTER TABLE books
  DROP CONSTRAINT IF EXISTS books_primary_goal_check;

ALTER TABLE books
  ADD CONSTRAINT books_primary_goal_check
  CHECK (primary_goal IN (
    'build_readership',
    'sell_copies',
    'attract_agent',
    'relaunch',
    'audiobook',
    'build_authority'
  ));
