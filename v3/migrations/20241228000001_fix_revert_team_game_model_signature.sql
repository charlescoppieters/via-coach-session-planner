-- ========================================
-- Migration: Fix revert_team_game_model function signature
-- ========================================
-- The previous migration created the function with 3 parameters,
-- but it should only take 2 (p_team_id, p_club_id) and get the
-- coach_id from auth.uid() internally for security.
-- ========================================

-- Drop the incorrectly created function
DROP FUNCTION IF EXISTS revert_team_game_model(UUID, UUID, UUID);

-- Create with correct signature (2 parameters)
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

GRANT EXECUTE ON FUNCTION revert_team_game_model TO authenticated;
