-- ========================================
-- Migration: Rename playing_methodology to game_model
-- ========================================
-- This migration renames the playing_methodology table to game_model
-- to better reflect the terminology used in the UI.
-- ========================================

-- ========================================
-- STEP 1: Rename the table
-- ========================================
ALTER TABLE playing_methodology RENAME TO game_model;

-- ========================================
-- STEP 2: Rename indexes
-- ========================================
ALTER INDEX idx_playing_methodology_club_id RENAME TO idx_game_model_club_id;
ALTER INDEX idx_playing_methodology_team_id RENAME TO idx_game_model_team_id;
ALTER INDEX idx_playing_methodology_club_level RENAME TO idx_game_model_club_level;
ALTER INDEX idx_playing_methodology_zones RENAME TO idx_game_model_zones;

-- ========================================
-- STEP 3: Rename trigger
-- ========================================
ALTER TRIGGER update_playing_methodology_updated_at ON game_model RENAME TO update_game_model_updated_at;

-- ========================================
-- STEP 4: Update table and column comments
-- ========================================
COMMENT ON TABLE game_model IS 'Game model zones. Club-level (team_id NULL) or team-specific.';
COMMENT ON COLUMN game_model.team_id IS 'NULL for club-level game model, set for team-specific.';
COMMENT ON COLUMN game_model.created_by_coach_id IS 'Coach who created this game model. Used for edit permissions.';
COMMENT ON COLUMN game_model.zones IS 'JSON object with zone_count and zones array for in/out possession states.';

-- ========================================
-- STEP 5: Drop and recreate RLS policies with new names
-- ========================================

-- Drop old policies
DROP POLICY IF EXISTS "playing_methodology_select" ON game_model;
DROP POLICY IF EXISTS "playing_methodology_insert" ON game_model;
DROP POLICY IF EXISTS "playing_methodology_update" ON game_model;
DROP POLICY IF EXISTS "playing_methodology_delete" ON game_model;

-- Recreate policies with new names
-- Club members can view their club's game model
CREATE POLICY "game_model_select" ON game_model
    FOR SELECT USING (
        club_id IN (
            SELECT club_id FROM club_memberships
            WHERE coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- Club-level: admin only. Team-level: assigned coaches or admin
CREATE POLICY "game_model_insert" ON game_model
    FOR INSERT WITH CHECK (
        created_by_coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        AND (
            -- Club-level rule: must be admin
            (team_id IS NULL AND EXISTS (
                SELECT 1 FROM club_memberships
                WHERE club_id = game_model.club_id
                AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                AND role = 'admin'
            ))
            OR
            -- Team-level rule: must be admin or assigned to team
            (team_id IS NOT NULL AND (
                EXISTS (
                    SELECT 1 FROM club_memberships
                    WHERE club_id = game_model.club_id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                    AND role = 'admin'
                )
                OR
                EXISTS (
                    SELECT 1 FROM team_coaches
                    WHERE team_id = game_model.team_id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                )
            ))
        )
    );

-- Club-level: admin. Team-level: creator, assigned coach, or admin
CREATE POLICY "game_model_update" ON game_model
    FOR UPDATE USING (
        -- Club-level: admin only
        (team_id IS NULL AND EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = game_model.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        ))
        OR
        -- Team-level: creator, assigned coach, or admin
        (team_id IS NOT NULL AND (
            created_by_coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            OR
            EXISTS (
                SELECT 1 FROM club_memberships
                WHERE club_id = game_model.club_id
                AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                AND role = 'admin'
            )
        ))
    );

-- Club-level: admin. Team-level: creator, assigned coach, or admin
CREATE POLICY "game_model_delete" ON game_model
    FOR DELETE USING (
        (team_id IS NULL AND EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = game_model.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        ))
        OR
        (team_id IS NOT NULL AND (
            created_by_coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            OR
            EXISTS (
                SELECT 1 FROM club_memberships
                WHERE club_id = game_model.club_id
                AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                AND role = 'admin'
            )
        ))
    );

-- ========================================
-- STEP 6: Update stored functions
-- ========================================

-- Drop old function and create with new name
DROP FUNCTION IF EXISTS copy_club_methodology_to_team(UUID, UUID, UUID);
CREATE OR REPLACE FUNCTION copy_club_methodology_to_team(
    p_club_id UUID,
    p_team_id UUID,
    p_coach_id UUID
) RETURNS void AS $$
BEGIN
    -- Copy club game model to team
    INSERT INTO game_model (
        club_id,
        team_id,
        created_by_coach_id,
        title,
        description,
        zones,
        display_order,
        is_active
    )
    SELECT
        club_id,
        p_team_id,
        p_coach_id,
        title,
        description,
        zones,
        display_order,
        is_active
    FROM game_model
    WHERE club_id = p_club_id AND team_id IS NULL;

    -- Copy club positional profiles to team
    INSERT INTO positional_profiles (
        club_id,
        team_id,
        position_key,
        custom_position_name,
        attributes,
        is_active,
        display_order
    )
    SELECT
        club_id,
        p_team_id,
        position_key,
        custom_position_name,
        attributes,
        is_active,
        display_order
    FROM positional_profiles
    WHERE club_id = p_club_id AND team_id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old function and create with new name
DROP FUNCTION IF EXISTS revert_team_playing_methodology(UUID, UUID);
CREATE OR REPLACE FUNCTION revert_team_game_model(
    p_team_id UUID,
    p_club_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    club_zones JSONB;
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

    -- Get current club zones
    SELECT zones INTO club_zones
    FROM game_model
    WHERE club_id = p_club_id
    AND team_id IS NULL
    AND zones IS NOT NULL
    LIMIT 1;

    -- Update team's zones with club zones (or NULL if club has no zones)
    UPDATE game_model
    SET zones = club_zones, updated_at = NOW()
    WHERE club_id = p_club_id
    AND team_id = p_team_id;

    -- If no team record exists, create one
    IF NOT FOUND AND club_zones IS NOT NULL THEN
        INSERT INTO game_model (
            club_id, team_id, created_by_coach_id, title, description, zones, display_order, is_active
        )
        VALUES (
            p_club_id, p_team_id, caller_coach_id, 'Game Model', 'Team game model', club_zones, 0, true
        );
    END IF;

    RETURN json_build_object('success', true);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION copy_club_methodology_to_team TO authenticated;
GRANT EXECUTE ON FUNCTION revert_team_game_model TO authenticated;
