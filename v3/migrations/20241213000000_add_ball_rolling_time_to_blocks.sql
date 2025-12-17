-- ========================================
-- Migration: Add ball_rolling column to session_blocks
-- ========================================
-- This migration adds a ball_rolling column to track the percentage
-- of the block duration where the ball is actively in play.
--
-- This is distinct from duration which is the total block time including
-- setup, explanations, rest periods, etc.

-- Add the ball_rolling column (nullable, percentage 0-100)
ALTER TABLE session_blocks
ADD COLUMN IF NOT EXISTS ball_rolling INTEGER;

-- Add check constraint to ensure valid percentage values (0-100)
ALTER TABLE session_blocks
ADD CONSTRAINT check_ball_rolling_percentage
CHECK (ball_rolling IS NULL OR (ball_rolling >= 0 AND ball_rolling <= 100));

-- Comment on the new column
COMMENT ON COLUMN session_blocks.ball_rolling IS 'Percentage of block duration where ball is in play (0-100). Distinct from total duration which includes setup/rest.';
