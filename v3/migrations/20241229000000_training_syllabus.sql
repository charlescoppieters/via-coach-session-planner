-- ========================================
-- Migration: Training Syllabus Overhaul
-- ========================================
-- This migration:
-- 1. Adds a `syllabus` JSONB column to training_methodology
-- 2. Drops the team_training_rule_toggles table (no longer needed)
-- 3. Updates copy_club_methodology_to_team to copy syllabus
-- 4. Creates revert_team_training_syllabus function
-- ========================================

-- ========================================
-- STEP 1: Add syllabus column to training_methodology
-- ========================================
ALTER TABLE training_methodology ADD COLUMN IF NOT EXISTS syllabus JSONB DEFAULT NULL;

COMMENT ON COLUMN training_methodology.syllabus IS 'JSONB containing weekly training calendar with themes from Game Model zones.';

-- ========================================
-- STEP 2: Drop team_training_rule_toggles table
-- ========================================
-- Drop RLS policies first
DROP POLICY IF EXISTS "training_rule_toggles_select" ON team_training_rule_toggles;
DROP POLICY IF EXISTS "training_rule_toggles_insert" ON team_training_rule_toggles;
DROP POLICY IF EXISTS "training_rule_toggles_update" ON team_training_rule_toggles;
DROP POLICY IF EXISTS "training_rule_toggles_delete" ON team_training_rule_toggles;

-- Drop indexes
DROP INDEX IF EXISTS idx_training_rule_toggles_team;
DROP INDEX IF EXISTS idx_training_rule_toggles_rule;

-- Drop trigger
DROP TRIGGER IF EXISTS update_team_training_rule_toggles_updated_at ON team_training_rule_toggles;

-- Drop table
DROP TABLE IF EXISTS team_training_rule_toggles;

-- ========================================
-- STEP 3: Update copy_club_methodology_to_team
-- ========================================
-- Drop existing function first (return type may have changed)
DROP FUNCTION IF EXISTS copy_club_methodology_to_team(UUID, UUID, UUID);

CREATE OR REPLACE FUNCTION copy_club_methodology_to_team(
    p_team_id UUID,
    p_club_id UUID,
    p_coach_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    club_zones JSONB;
    club_syllabus JSONB;
BEGIN
    -- 1. Copy Game Model (zones)
    SELECT zones INTO club_zones
    FROM game_model
    WHERE club_id = p_club_id
    AND team_id IS NULL
    AND zones IS NOT NULL
    LIMIT 1;

    IF club_zones IS NOT NULL THEN
        INSERT INTO game_model (
            club_id, team_id, created_by_coach_id, title, description, zones, display_order, is_active
        )
        VALUES (
            p_club_id, p_team_id, p_coach_id, 'Game Model', 'Team game model', club_zones, 0, true
        )
        ON CONFLICT DO NOTHING;
    END IF;

    -- 2. Copy Positional Profiles
    INSERT INTO positional_profiles (
        club_id, team_id, position_key, custom_position_name, attributes, is_active, display_order
    )
    SELECT
        club_id, p_team_id, position_key, custom_position_name, attributes, is_active, display_order
    FROM positional_profiles
    WHERE club_id = p_club_id
    AND team_id IS NULL
    ON CONFLICT DO NOTHING;

    -- 3. Copy Training Syllabus (NEW)
    SELECT syllabus INTO club_syllabus
    FROM training_methodology
    WHERE club_id = p_club_id
    AND team_id IS NULL
    AND syllabus IS NOT NULL
    LIMIT 1;

    IF club_syllabus IS NOT NULL THEN
        INSERT INTO training_methodology (
            club_id, team_id, created_by_coach_id, title, syllabus, display_order, is_active
        )
        VALUES (
            p_club_id, p_team_id, p_coach_id, 'Training Syllabus', club_syllabus, 0, true
        )
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN json_build_object('success', true);
END;
$$;

-- ========================================
-- STEP 4: Create revert_team_training_syllabus function
-- ========================================
CREATE OR REPLACE FUNCTION revert_team_training_syllabus(
    p_team_id UUID,
    p_club_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    club_syllabus JSONB;
    caller_coach_id UUID;
BEGIN
    -- Verify caller is admin or assigned coach
    SELECT id INTO caller_coach_id
    FROM coaches
    WHERE auth_user_id = auth.uid();

    IF caller_coach_id IS NULL THEN
        RAISE EXCEPTION 'Coach profile not found';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM club_memberships cm
        JOIN teams t ON t.club_id = cm.club_id
        WHERE t.id = p_team_id
        AND cm.coach_id = caller_coach_id
        AND (cm.role = 'admin' OR EXISTS (
            SELECT 1 FROM team_coaches tc
            WHERE tc.team_id = p_team_id
            AND tc.coach_id = caller_coach_id
        ))
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Get current club syllabus
    SELECT syllabus INTO club_syllabus
    FROM training_methodology
    WHERE club_id = p_club_id
    AND team_id IS NULL
    AND syllabus IS NOT NULL
    LIMIT 1;

    -- Update team's syllabus with club syllabus
    UPDATE training_methodology
    SET syllabus = club_syllabus, updated_at = NOW()
    WHERE club_id = p_club_id
    AND team_id = p_team_id;

    -- If no team record exists, create one
    IF NOT FOUND AND club_syllabus IS NOT NULL THEN
        INSERT INTO training_methodology (
            club_id, team_id, created_by_coach_id, title, syllabus, display_order, is_active
        )
        VALUES (
            p_club_id, p_team_id, caller_coach_id, 'Training Syllabus', club_syllabus, 0, true
        );
    END IF;

    RETURN json_build_object('success', true);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION revert_team_training_syllabus TO authenticated;

-- ========================================
-- Update table comment
-- ========================================
COMMENT ON TABLE training_methodology IS 'Training syllabus. Club-level (team_id NULL) or team-specific. Uses syllabus JSONB column for weekly calendar data.';
