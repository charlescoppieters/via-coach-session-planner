-- Migration: Add player_count, duration, age_group, and skill_level to sessions table
-- Run this in your Supabase SQL Editor

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS player_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration INTEGER NOT NULL DEFAULT 60,
ADD COLUMN IF NOT EXISTS age_group TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS skill_level TEXT NOT NULL DEFAULT '';

-- Update existing sessions with team data
UPDATE sessions s
SET
  player_count = t.player_count,
  duration = t.session_duration,
  age_group = t.age_group,
  skill_level = t.skill_level
FROM teams t
WHERE s.team_id = t.id;

-- Now remove the default values (require them on new inserts)
ALTER TABLE sessions
ALTER COLUMN player_count DROP DEFAULT,
ALTER COLUMN duration DROP DEFAULT,
ALTER COLUMN age_group DROP DEFAULT,
ALTER COLUMN skill_level DROP DEFAULT;

COMMENT ON COLUMN sessions.player_count IS 'Number of players in this session (defaults from team but can be customized)';
COMMENT ON COLUMN sessions.duration IS 'Session duration in minutes (defaults from team but can be customized)';
COMMENT ON COLUMN sessions.age_group IS 'Age group from team (e.g., U13, U15)';
COMMENT ON COLUMN sessions.skill_level IS 'Skill level from team (e.g., Beginner, Intermediate)';
