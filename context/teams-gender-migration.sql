-- Teams Gender Migration
-- Add gender field to teams table to support player gender defaults

ALTER TABLE teams ADD COLUMN gender TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS age INTEGER;