-- =============================================
-- Phase 6: Team-Level Methodology Migration
-- =============================================
-- This migration adds support for:
-- 1. Team training rule toggles (enable/disable club rules per team)
-- 2. RPC functions for copying club methodology to teams
-- 3. RPC functions for reverting team methodology to club

-- ----------------------------------------
-- 1. team_training_rule_toggles Table
-- ----------------------------------------
-- Allows teams to toggle club training rules on/off

CREATE TABLE IF NOT EXISTS team_training_rule_toggles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    training_rule_id UUID NOT NULL REFERENCES training_methodology(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(team_id, training_rule_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_training_rule_toggles_team ON team_training_rule_toggles(team_id);
CREATE INDEX IF NOT EXISTS idx_training_rule_toggles_rule ON team_training_rule_toggles(training_rule_id);

-- Trigger for updated_at
CREATE TRIGGER update_team_training_rule_toggles_updated_at
    BEFORE UPDATE ON team_training_rule_toggles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------
-- RLS Policies for team_training_rule_toggles
-- ----------------------------------------

ALTER TABLE team_training_rule_toggles ENABLE ROW LEVEL SECURITY;

-- SELECT: Club members can view toggles for teams in their club
CREATE POLICY "training_rule_toggles_select" ON team_training_rule_toggles
    FOR SELECT USING (
        team_id IN (
            SELECT t.id FROM teams t
            JOIN club_memberships cm ON cm.club_id = t.club_id
            WHERE cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- INSERT: Admins or assigned coaches can create toggles
CREATE POLICY "training_rule_toggles_insert" ON team_training_rule_toggles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM teams t
            WHERE t.id = team_training_rule_toggles.team_id
            AND (
                -- Admin of the club
                EXISTS (
                    SELECT 1 FROM club_memberships cm
                    WHERE cm.club_id = t.club_id
                    AND cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                    AND cm.role = 'admin'
                )
                OR
                -- Assigned coach
                EXISTS (
                    SELECT 1 FROM team_coaches tc
                    WHERE tc.team_id = t.id
                    AND tc.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                )
            )
        )
    );

-- UPDATE: Admins or assigned coaches can update toggles
CREATE POLICY "training_rule_toggles_update" ON team_training_rule_toggles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM teams t
            WHERE t.id = team_training_rule_toggles.team_id
            AND (
                EXISTS (
                    SELECT 1 FROM club_memberships cm
                    WHERE cm.club_id = t.club_id
                    AND cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                    AND cm.role = 'admin'
                )
                OR
                EXISTS (
                    SELECT 1 FROM team_coaches tc
                    WHERE tc.team_id = t.id
                    AND tc.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                )
            )
        )
    );

-- DELETE: Admins or assigned coaches can delete toggles
CREATE POLICY "training_rule_toggles_delete" ON team_training_rule_toggles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM teams t
            WHERE t.id = team_training_rule_toggles.team_id
            AND (
                EXISTS (
                    SELECT 1 FROM club_memberships cm
                    WHERE cm.club_id = t.club_id
                    AND cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                    AND cm.role = 'admin'
                )
                OR
                EXISTS (
                    SELECT 1 FROM team_coaches tc
                    WHERE tc.team_id = t.id
                    AND tc.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                )
            )
        )
    );

-- ----------------------------------------
-- 2. RPC Function: Copy Club Methodology to Team
-- ----------------------------------------
-- Called when a new team is created to copy club's methodology

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
BEGIN
    -- 1. Copy Playing Methodology (zones)
    -- Get club's zones from the first record that has zones
    SELECT zones INTO club_zones
    FROM playing_methodology
    WHERE club_id = p_club_id
    AND team_id IS NULL
    AND zones IS NOT NULL
    LIMIT 1;

    -- Create team playing methodology record with copied zones
    IF club_zones IS NOT NULL THEN
        INSERT INTO playing_methodology (
            club_id, team_id, created_by_coach_id, title, description, zones, display_order, is_active
        )
        VALUES (
            p_club_id, p_team_id, p_coach_id, 'Playing Methodology', 'Team playing methodology', club_zones, 0, true
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

    -- 3. Training Methodology: No copy needed
    -- Teams reference club rules via toggles (default: enabled)
    -- Toggle records are created lazily when a coach disables a rule

    RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION copy_club_methodology_to_team TO authenticated;

-- ----------------------------------------
-- 3. RPC Function: Revert Team Playing Methodology
-- ----------------------------------------
-- Replaces team's zones with current club zones

CREATE OR REPLACE FUNCTION revert_team_playing_methodology(
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
    FROM playing_methodology
    WHERE club_id = p_club_id
    AND team_id IS NULL
    AND zones IS NOT NULL
    LIMIT 1;

    -- Update team's zones with club zones (or NULL if club has no zones)
    UPDATE playing_methodology
    SET zones = club_zones, updated_at = NOW()
    WHERE club_id = p_club_id
    AND team_id = p_team_id;

    -- If no team record exists, create one
    IF NOT FOUND AND club_zones IS NOT NULL THEN
        INSERT INTO playing_methodology (
            club_id, team_id, created_by_coach_id, title, description, zones, display_order, is_active
        )
        VALUES (
            p_club_id, p_team_id, caller_coach_id, 'Playing Methodology', 'Team playing methodology', club_zones, 0, true
        );
    END IF;

    RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION revert_team_playing_methodology TO authenticated;

-- ----------------------------------------
-- 4. RPC Function: Revert Team Positional Profiles
-- ----------------------------------------
-- Deletes team profiles and copies current club profiles

CREATE OR REPLACE FUNCTION revert_team_positional_profiles(
    p_team_id UUID,
    p_club_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
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

    -- Delete existing team profiles
    DELETE FROM positional_profiles
    WHERE club_id = p_club_id
    AND team_id = p_team_id;

    -- Copy current club profiles to team
    INSERT INTO positional_profiles (
        club_id, team_id, position_key, custom_position_name, attributes, is_active, display_order
    )
    SELECT
        club_id, p_team_id, position_key, custom_position_name, attributes, is_active, display_order
    FROM positional_profiles
    WHERE club_id = p_club_id
    AND team_id IS NULL;

    RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION revert_team_positional_profiles TO authenticated;
