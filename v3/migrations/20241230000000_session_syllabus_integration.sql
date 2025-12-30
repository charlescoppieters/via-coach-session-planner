-- ========================================
-- Migration: Session-Syllabus Integration
-- ========================================
-- This migration adds syllabus tracking fields to sessions table:
-- - syllabus_week_index: Which week of the syllabus (0-indexed)
-- - syllabus_day_of_week: Which day of week (0=Mon, 6=Sun)
-- - theme_block_id: Reference to the ZoneBlock.id from Game Model
-- - theme_snapshot: Denormalized theme data for historical reference
-- ========================================

-- ========================================
-- STEP 1: Add syllabus columns to sessions
-- ========================================

-- Week index (0-indexed) - which week in the syllabus cycle
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS syllabus_week_index INTEGER DEFAULT NULL;
COMMENT ON COLUMN sessions.syllabus_week_index IS '0-indexed week number from the training syllabus. NULL if session was created manually.';

-- Day of week (0=Monday, 6=Sunday)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS syllabus_day_of_week INTEGER DEFAULT NULL;
COMMENT ON COLUMN sessions.syllabus_day_of_week IS 'Day of week from syllabus (0=Mon, 6=Sun). NULL if session was created manually.';

-- Block ID reference
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS theme_block_id TEXT DEFAULT NULL;
COMMENT ON COLUMN sessions.theme_block_id IS 'Reference to ZoneBlock.id from Game Model. NULL if manual or no theme.';

-- Theme snapshot for historical reference
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS theme_snapshot JSONB DEFAULT NULL;
COMMENT ON COLUMN sessions.theme_snapshot IS 'Denormalized theme data: {zoneName, blockType, blockName}. Preserved even if syllabus changes.';

-- ========================================
-- STEP 2: Add check constraint for day of week
-- ========================================
ALTER TABLE sessions ADD CONSTRAINT chk_syllabus_day_of_week
    CHECK (syllabus_day_of_week IS NULL OR (syllabus_day_of_week >= 0 AND syllabus_day_of_week <= 6));

-- ========================================
-- STEP 3: Add index for finding latest syllabus session
-- ========================================
CREATE INDEX IF NOT EXISTS idx_sessions_syllabus_latest
    ON sessions (team_id, session_date DESC)
    WHERE syllabus_week_index IS NOT NULL;

-- ========================================
-- STEP 4: Create function to get latest syllabus session for a team
-- ========================================
CREATE OR REPLACE FUNCTION get_latest_syllabus_session(p_team_id UUID)
RETURNS TABLE (
    id UUID,
    session_date TIMESTAMP WITH TIME ZONE,
    syllabus_week_index INTEGER,
    syllabus_day_of_week INTEGER,
    theme_block_id TEXT,
    theme_snapshot JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.session_date,
        s.syllabus_week_index,
        s.syllabus_day_of_week,
        s.theme_block_id,
        s.theme_snapshot
    FROM sessions s
    WHERE s.team_id = p_team_id
    AND s.syllabus_week_index IS NOT NULL
    ORDER BY s.session_date DESC
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_latest_syllabus_session TO authenticated;

-- ========================================
-- Update table comment
-- ========================================
COMMENT ON TABLE sessions IS 'Training sessions. Can be linked to training syllabus (syllabus_week_index NOT NULL) or created manually (syllabus_week_index NULL).';
