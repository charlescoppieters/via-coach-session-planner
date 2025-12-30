-- ========================================
-- BLOCK PLAYER EXCLUSIONS
-- ========================================
-- Tracks players who are excluded from specific blocks within a session.
-- If a player has a row here, they don't get IDP outcomes for that block.
-- Absence of a row means the player is included (default behavior).
--
-- This enables scenarios like:
-- - Simultaneous practices where half the team does one drill, half does another
-- - Players sitting out specific blocks due to fatigue/rotation
-- - Goalkeepers not participating in outfield-specific drills

CREATE TABLE IF NOT EXISTS block_player_exclusions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    assignment_id UUID NOT NULL REFERENCES session_block_assignments(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(assignment_id, player_id)
);

COMMENT ON TABLE block_player_exclusions IS 'Players excluded from specific training blocks. Excluded players do not get IDP outcomes for that block.';
COMMENT ON COLUMN block_player_exclusions.assignment_id IS 'References the specific block assignment in a session';
COMMENT ON COLUMN block_player_exclusions.player_id IS 'The player excluded from this block';

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_block_player_exclusions_assignment ON block_player_exclusions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_block_player_exclusions_player ON block_player_exclusions(player_id);

-- Enable RLS
ALTER TABLE block_player_exclusions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Club members can manage block player exclusions
CREATE POLICY "bpe_select" ON block_player_exclusions
    FOR SELECT USING (
        assignment_id IN (
            SELECT sba.id FROM session_block_assignments sba
            JOIN sessions s ON s.id = sba.session_id
            JOIN club_memberships cm ON cm.club_id = s.club_id
            WHERE cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "bpe_insert" ON block_player_exclusions
    FOR INSERT WITH CHECK (
        assignment_id IN (
            SELECT sba.id FROM session_block_assignments sba
            JOIN sessions s ON s.id = sba.session_id
            JOIN club_memberships cm ON cm.club_id = s.club_id
            WHERE cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "bpe_delete" ON block_player_exclusions
    FOR DELETE USING (
        assignment_id IN (
            SELECT sba.id FROM session_block_assignments sba
            JOIN sessions s ON s.id = sba.session_id
            JOIN club_memberships cm ON cm.club_id = s.club_id
            WHERE cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- ========================================
-- UPDATE generate_training_events FUNCTION
-- ========================================
-- Add filtering to exclude players who have block exclusion records

CREATE OR REPLACE FUNCTION generate_training_events(p_session_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Verify the caller has access to this session (is a club member)
    IF NOT EXISTS (
        SELECT 1 FROM sessions s
        JOIN club_memberships cm ON cm.club_id = s.club_id
        JOIN coaches c ON c.id = cm.coach_id
        WHERE s.id = p_session_id
        AND c.auth_user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied: not a member of this club';
    END IF;

    -- Insert training events for each player-attribute combination
    -- ONLY for:
    -- 1. Attributes that match the player's active IDPs
    -- 2. Players who attended the session (status = 'present')
    -- 3. Players NOT excluded from the specific block
    INSERT INTO player_training_events (player_id, session_id, attribute_key, weight)
    SELECT DISTINCT
        sa.player_id,
        p_session_id,
        sba.attribute_key,
        sba.relevance
    FROM session_attendance sa
    JOIN session_block_assignments sba_assign ON sba_assign.session_id = p_session_id
    JOIN session_block_attributes sba ON sba.block_id = sba_assign.block_id
    JOIN player_idps pi ON pi.player_id = sa.player_id
        AND pi.attribute_key = sba.attribute_key
        AND pi.ended_at IS NULL
    WHERE sa.session_id = p_session_id
        AND sa.status = 'present'
        -- Exclude players who are excluded from this specific block
        AND NOT EXISTS (
            SELECT 1 FROM block_player_exclusions bpe
            WHERE bpe.assignment_id = sba_assign.id
            AND bpe.player_id = sa.player_id
        )
    ON CONFLICT (player_id, session_id, attribute_key) DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_training_events TO authenticated;
