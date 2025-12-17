-- ========================================
-- VIA SESSION PLANNER - Analysis & Feedback System Migration
-- Phase 1: Player IDPs, Block Attributes, Training Events, Feedback
-- ========================================
-- This migration implements the analysis and feedback system as described in v3/analysis.md
-- Key changes:
-- 1. Remove deprecated target_1/2/3 columns from players table
-- 2. Create player_idps table for proper IDP tracking with history
-- 3. Create session_block_attributes table for tagging blocks with attributes
-- 4. Create player_training_events table for tracking training opportunities
-- 5. Create session_feedback and related tables for post-session feedback
-- 6. Create feedback_insights table for LLM-extracted insights
-- 7. Create views for analytics
-- 8. Create RPC functions for training event generation and IDP management

-- ========================================
-- STEP 1: Remove deprecated columns from players table
-- ========================================
-- These columns are replaced by the player_idps table
ALTER TABLE players DROP COLUMN IF EXISTS target_1;
ALTER TABLE players DROP COLUMN IF EXISTS target_2;
ALTER TABLE players DROP COLUMN IF EXISTS target_3;

-- ========================================
-- STEP 2: Create session_block_attributes table
-- ========================================
-- Links session blocks to the attributes they train
CREATE TABLE IF NOT EXISTS session_block_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_id UUID NOT NULL REFERENCES session_blocks(id) ON DELETE CASCADE,
    attribute_key TEXT NOT NULL,  -- references system_defaults key (category='attributes')
    relevance FLOAT DEFAULT 1.0 CHECK (relevance >= 0 AND relevance <= 1),
    source TEXT DEFAULT 'llm' CHECK (source IN ('llm', 'coach', 'system')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(block_id, attribute_key)
);

COMMENT ON TABLE session_block_attributes IS 'Links session blocks to the attributes they train with relevance scores';
COMMENT ON COLUMN session_block_attributes.attribute_key IS 'References system_defaults key where category=attributes';
COMMENT ON COLUMN session_block_attributes.relevance IS 'How relevant this attribute is to the block (0.0-1.0)';
COMMENT ON COLUMN session_block_attributes.source IS 'Origin: llm (auto-suggested), coach (manual), system (default)';

CREATE INDEX IF NOT EXISTS idx_sba_block_id ON session_block_attributes(block_id);
CREATE INDEX IF NOT EXISTS idx_sba_attribute ON session_block_attributes(attribute_key);

-- ========================================
-- STEP 3: Create player_idps table
-- ========================================
-- Individual Development Plans with historical tracking
CREATE TABLE IF NOT EXISTS player_idps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    attribute_key TEXT NOT NULL,  -- references system_defaults key (category='attributes')
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 3),  -- 1 = primary, 2 = secondary, 3 = tertiary
    notes TEXT,  -- coach notes about why this IDP was chosen
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ended_at TIMESTAMPTZ,  -- NULL means currently active
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE player_idps IS 'Individual Development Plans per player with historical tracking';
COMMENT ON COLUMN player_idps.attribute_key IS 'The attribute being developed, references system_defaults';
COMMENT ON COLUMN player_idps.priority IS '1 = primary focus, 2 = secondary, 3 = tertiary';
COMMENT ON COLUMN player_idps.ended_at IS 'NULL means IDP is currently active';

CREATE INDEX IF NOT EXISTS idx_player_idps_player ON player_idps(player_id);
CREATE INDEX IF NOT EXISTS idx_player_idps_active ON player_idps(player_id) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_player_idps_attribute ON player_idps(attribute_key);
CREATE INDEX IF NOT EXISTS idx_player_idps_dates ON player_idps(player_id, started_at, ended_at);

-- ========================================
-- STEP 4: Create player_training_events table
-- ========================================
-- Records each training opportunity for a player on an attribute
CREATE TABLE IF NOT EXISTS player_training_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    attribute_key TEXT NOT NULL,
    weight FLOAT DEFAULT 1.0,  -- relevance score from session_block_attributes
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(player_id, session_id, attribute_key)  -- prevent duplicate events
);

COMMENT ON TABLE player_training_events IS 'Records training opportunities per player per session per attribute';
COMMENT ON COLUMN player_training_events.weight IS 'Relevance score (0.0-1.0) from session block attributes';

CREATE INDEX IF NOT EXISTS idx_pte_player_attribute ON player_training_events(player_id, attribute_key);
CREATE INDEX IF NOT EXISTS idx_pte_player_date ON player_training_events(player_id, created_at);
CREATE INDEX IF NOT EXISTS idx_pte_session ON player_training_events(session_id);

-- ========================================
-- STEP 5: Create session_feedback table
-- ========================================
-- Raw post-session feedback from coaches (one per session)
CREATE TABLE IF NOT EXISTS session_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES coaches(id),
    team_feedback TEXT,
    audio_url TEXT,  -- stored in 'session-feedback-audio' bucket (future)
    transcript TEXT,  -- transcribed from audio via Whisper (future)
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    processed_at TIMESTAMPTZ,  -- when LLM analysis completed
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(session_id)  -- one feedback record per session
);

COMMENT ON TABLE session_feedback IS 'Post-session feedback from coaches. One record per session.';
COMMENT ON COLUMN session_feedback.team_feedback IS 'General feedback about the session';
COMMENT ON COLUMN session_feedback.processed_at IS 'When LLM analysis was completed (NULL if not processed)';

CREATE INDEX IF NOT EXISTS idx_session_feedback_session ON session_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_coach ON session_feedback(coach_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_unprocessed ON session_feedback(id) WHERE processed_at IS NULL;

-- ========================================
-- STEP 6: Create player_feedback_notes table
-- ========================================
-- Player-specific notes within a session feedback
CREATE TABLE IF NOT EXISTS player_feedback_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_feedback_id UUID NOT NULL REFERENCES session_feedback(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(session_feedback_id, player_id)  -- one note per player per feedback
);

COMMENT ON TABLE player_feedback_notes IS 'Player-specific notes within session feedback';

CREATE INDEX IF NOT EXISTS idx_pfn_feedback ON player_feedback_notes(session_feedback_id);
CREATE INDEX IF NOT EXISTS idx_pfn_player ON player_feedback_notes(player_id);

-- ========================================
-- STEP 7: Create feedback_insights table
-- ========================================
-- LLM-extracted structured insights from feedback
CREATE TABLE IF NOT EXISTS feedback_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_feedback_id UUID NOT NULL REFERENCES session_feedback(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,  -- NULL = team-level insight
    attribute_key TEXT,  -- NULL if insight doesn't relate to specific attribute
    sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
    extracted_text TEXT,  -- the relevant quote from feedback
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE feedback_insights IS 'LLM-extracted insights from session feedback';
COMMENT ON COLUMN feedback_insights.player_id IS 'NULL for team-level insights';
COMMENT ON COLUMN feedback_insights.attribute_key IS 'NULL if insight is not attribute-specific';

CREATE INDEX IF NOT EXISTS idx_fi_feedback ON feedback_insights(session_feedback_id);
CREATE INDEX IF NOT EXISTS idx_fi_player ON feedback_insights(player_id) WHERE player_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fi_player_attribute ON feedback_insights(player_id, attribute_key) WHERE player_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fi_attribute ON feedback_insights(attribute_key) WHERE attribute_key IS NOT NULL;

-- ========================================
-- STEP 8: Apply updated_at triggers to new tables
-- ========================================
CREATE TRIGGER update_session_block_attributes_updated_at
    BEFORE UPDATE ON session_block_attributes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_idps_updated_at
    BEFORE UPDATE ON player_idps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_feedback_updated_at
    BEFORE UPDATE ON session_feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- STEP 9: Enable RLS on new tables
-- ========================================
ALTER TABLE session_block_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_idps ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_training_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_feedback_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_insights ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 10: RLS Policies for session_block_attributes
-- ========================================
-- Follows same pattern as session_blocks (relaxed read access)

CREATE POLICY "sba_select" ON session_block_attributes
    FOR SELECT USING (
        block_id IN (
            SELECT id FROM session_blocks
            WHERE is_public = TRUE
            OR creator_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            OR club_id IN (
                SELECT club_id FROM club_memberships
                WHERE coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            )
        )
    );

CREATE POLICY "sba_insert" ON session_block_attributes
    FOR INSERT WITH CHECK (
        block_id IN (
            SELECT id FROM session_blocks
            WHERE creator_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "sba_update" ON session_block_attributes
    FOR UPDATE USING (
        block_id IN (
            SELECT id FROM session_blocks
            WHERE creator_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "sba_delete" ON session_block_attributes
    FOR DELETE USING (
        block_id IN (
            SELECT id FROM session_blocks
            WHERE creator_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- ========================================
-- STEP 11: RLS Policies for player_idps
-- ========================================
-- All club members (admins and coaches) can view all player IDPs in their club
-- All club members can modify IDPs for players in their club

CREATE POLICY "player_idps_select" ON player_idps
    FOR SELECT USING (
        player_id IN (
            SELECT p.id FROM players p
            JOIN club_memberships cm ON cm.club_id = p.club_id
            WHERE cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "player_idps_insert" ON player_idps
    FOR INSERT WITH CHECK (
        player_id IN (
            SELECT p.id FROM players p
            JOIN club_memberships cm ON cm.club_id = p.club_id
            WHERE cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "player_idps_update" ON player_idps
    FOR UPDATE USING (
        player_id IN (
            SELECT p.id FROM players p
            JOIN club_memberships cm ON cm.club_id = p.club_id
            WHERE cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "player_idps_delete" ON player_idps
    FOR DELETE USING (
        player_id IN (
            SELECT p.id FROM players p
            JOIN club_memberships cm ON cm.club_id = p.club_id
            WHERE cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND cm.role = 'admin'  -- Only admins can delete IDPs
        )
    );

-- ========================================
-- STEP 12: RLS Policies for player_training_events
-- ========================================
-- All club members can view training events for players in their club
-- Insert is done via SECURITY DEFINER function

CREATE POLICY "pte_select" ON player_training_events
    FOR SELECT USING (
        player_id IN (
            SELECT p.id FROM players p
            JOIN club_memberships cm ON cm.club_id = p.club_id
            WHERE cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- No direct insert policy - handled by SECURITY DEFINER function

-- ========================================
-- STEP 13: RLS Policies for session_feedback
-- ========================================
-- All club members can view and create feedback for sessions in their club

CREATE POLICY "session_feedback_select" ON session_feedback
    FOR SELECT USING (
        session_id IN (
            SELECT s.id FROM sessions s
            JOIN club_memberships cm ON cm.club_id = s.club_id
            WHERE cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "session_feedback_insert" ON session_feedback
    FOR INSERT WITH CHECK (
        coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        AND session_id IN (
            SELECT s.id FROM sessions s
            JOIN club_memberships cm ON cm.club_id = s.club_id
            WHERE cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "session_feedback_update" ON session_feedback
    FOR UPDATE USING (
        -- Creator can update their own feedback
        coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        OR
        -- Admins can update any feedback in their club
        session_id IN (
            SELECT s.id FROM sessions s
            JOIN club_memberships cm ON cm.club_id = s.club_id
            WHERE cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND cm.role = 'admin'
        )
    );

CREATE POLICY "session_feedback_delete" ON session_feedback
    FOR DELETE USING (
        -- Only admins can delete feedback
        session_id IN (
            SELECT s.id FROM sessions s
            JOIN club_memberships cm ON cm.club_id = s.club_id
            WHERE cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND cm.role = 'admin'
        )
    );

-- ========================================
-- STEP 14: RLS Policies for player_feedback_notes
-- ========================================
-- All club members can view player notes for sessions in their club

CREATE POLICY "pfn_select" ON player_feedback_notes
    FOR SELECT USING (
        session_feedback_id IN (
            SELECT sf.id FROM session_feedback sf
            JOIN sessions s ON s.id = sf.session_id
            JOIN club_memberships cm ON cm.club_id = s.club_id
            WHERE cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "pfn_insert" ON player_feedback_notes
    FOR INSERT WITH CHECK (
        session_feedback_id IN (
            SELECT sf.id FROM session_feedback sf
            WHERE sf.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "pfn_update" ON player_feedback_notes
    FOR UPDATE USING (
        session_feedback_id IN (
            SELECT sf.id FROM session_feedback sf
            WHERE sf.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "pfn_delete" ON player_feedback_notes
    FOR DELETE USING (
        session_feedback_id IN (
            SELECT sf.id FROM session_feedback sf
            WHERE sf.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- ========================================
-- STEP 15: RLS Policies for feedback_insights
-- ========================================
-- All club members can view insights for sessions in their club
-- Insert/update/delete via SECURITY DEFINER function for LLM processing

CREATE POLICY "fi_select" ON feedback_insights
    FOR SELECT USING (
        session_feedback_id IN (
            SELECT sf.id FROM session_feedback sf
            JOIN sessions s ON s.id = sf.session_id
            JOIN club_memberships cm ON cm.club_id = s.club_id
            WHERE cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- No direct insert/update/delete - handled by SECURITY DEFINER functions

-- ========================================
-- STEP 16: RPC Functions
-- ========================================

-- Function: Generate training events for a completed session
-- Called when feedback is submitted (session completion trigger)
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
    -- ONLY for attributes that match the player's active IDPs
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
    ON CONFLICT (player_id, session_id, attribute_key) DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- Function: Update player IDPs (end current, start new)
CREATE OR REPLACE FUNCTION update_player_idps(
    p_player_id UUID,
    p_new_idps JSONB  -- Array of {attribute_key, priority, notes}
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verify the caller has access to this player (is a club member)
    IF NOT EXISTS (
        SELECT 1 FROM players p
        JOIN club_memberships cm ON cm.club_id = p.club_id
        JOIN coaches c ON c.id = cm.coach_id
        WHERE p.id = p_player_id
        AND c.auth_user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied: not a member of this club';
    END IF;

    -- Validate at least 1 IDP is provided
    IF jsonb_array_length(p_new_idps) < 1 THEN
        RAISE EXCEPTION 'At least 1 IDP is required';
    END IF;

    -- End all current active IDPs
    UPDATE player_idps
    SET ended_at = NOW(), updated_at = NOW()
    WHERE player_id = p_player_id AND ended_at IS NULL;

    -- Insert new IDPs
    INSERT INTO player_idps (player_id, attribute_key, priority, notes, started_at)
    SELECT
        p_player_id,
        (idp->>'attribute_key')::TEXT,
        COALESCE((idp->>'priority')::INTEGER, 1),
        (idp->>'notes')::TEXT,
        NOW()
    FROM jsonb_array_elements(p_new_idps) AS idp;
END;
$$;

-- Function: Get accidental IDP records (duration < 24 hours)
CREATE OR REPLACE FUNCTION get_accidental_idps(p_player_id UUID)
RETURNS TABLE (
    idp_id UUID,
    attribute_key TEXT,
    duration_hours FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verify the caller has access to this player
    IF NOT EXISTS (
        SELECT 1 FROM players p
        JOIN club_memberships cm ON cm.club_id = p.club_id
        JOIN coaches c ON c.id = cm.coach_id
        WHERE p.id = p_player_id
        AND c.auth_user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied: not a member of this club';
    END IF;

    RETURN QUERY
    SELECT
        pi.id,
        pi.attribute_key,
        EXTRACT(EPOCH FROM (COALESCE(pi.ended_at, NOW()) - pi.started_at)) / 3600
    FROM player_idps pi
    WHERE pi.player_id = p_player_id
        AND pi.ended_at IS NOT NULL
        AND EXTRACT(EPOCH FROM (pi.ended_at - pi.started_at)) < 86400;
END;
$$;

-- Function: Insert feedback insights (for LLM processing)
CREATE OR REPLACE FUNCTION insert_feedback_insights(
    p_session_feedback_id UUID,
    p_insights JSONB  -- Array of {player_id, attribute_key, sentiment, confidence, extracted_text}
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Verify the feedback exists and caller has access
    IF NOT EXISTS (
        SELECT 1 FROM session_feedback sf
        JOIN sessions s ON s.id = sf.session_id
        JOIN club_memberships cm ON cm.club_id = s.club_id
        JOIN coaches c ON c.id = cm.coach_id
        WHERE sf.id = p_session_feedback_id
        AND c.auth_user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied: feedback not found or not accessible';
    END IF;

    -- Insert insights
    INSERT INTO feedback_insights (session_feedback_id, player_id, attribute_key, sentiment, confidence, extracted_text)
    SELECT
        p_session_feedback_id,
        (insight->>'player_id')::UUID,
        (insight->>'attribute_key')::TEXT,
        (insight->>'sentiment')::TEXT,
        (insight->>'confidence')::FLOAT,
        (insight->>'extracted_text')::TEXT
    FROM jsonb_array_elements(p_insights) AS insight;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- Mark feedback as processed
    UPDATE session_feedback
    SET processed_at = NOW()
    WHERE id = p_session_feedback_id;

    RETURN v_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_training_events TO authenticated;
GRANT EXECUTE ON FUNCTION update_player_idps TO authenticated;
GRANT EXECUTE ON FUNCTION get_accidental_idps TO authenticated;
GRANT EXECUTE ON FUNCTION insert_feedback_insights TO authenticated;

-- ========================================
-- STEP 17: Create Views for Analytics
-- ========================================

-- View: Player IDP Progress
-- Aggregates training and feedback data per player per IDP
CREATE OR REPLACE VIEW player_idp_progress AS
SELECT
    pi.id AS idp_id,
    pi.player_id,
    pi.attribute_key,
    pi.priority,
    pi.notes AS idp_notes,
    pi.started_at,
    pi.ended_at,
    -- Training metrics
    COUNT(DISTINCT pte.session_id) AS training_sessions,
    COALESCE(SUM(pte.weight), 0) AS total_training_weight,
    -- Feedback metrics
    COUNT(DISTINCT fi.id) FILTER (WHERE fi.sentiment = 'positive') AS positive_mentions,
    COUNT(DISTINCT fi.id) FILTER (WHERE fi.sentiment = 'negative') AS negative_mentions,
    COUNT(DISTINCT fi.id) FILTER (WHERE fi.sentiment = 'neutral') AS neutral_mentions
FROM player_idps pi
LEFT JOIN player_training_events pte
    ON pte.player_id = pi.player_id
    AND pte.attribute_key = pi.attribute_key
    AND pte.created_at >= pi.started_at
    AND (pi.ended_at IS NULL OR pte.created_at <= pi.ended_at)
LEFT JOIN feedback_insights fi
    ON fi.player_id = pi.player_id
    AND fi.attribute_key = pi.attribute_key
    AND fi.created_at >= pi.started_at
    AND (pi.ended_at IS NULL OR fi.created_at <= pi.ended_at)
GROUP BY pi.id, pi.player_id, pi.attribute_key, pi.priority, pi.notes, pi.started_at, pi.ended_at;

-- View: Team IDP Gaps
-- Identifies undertrained IDPs across a team for recommendations
CREATE OR REPLACE VIEW team_idp_gaps AS
SELECT
    p.team_id,
    pi.attribute_key,
    COUNT(DISTINCT pi.player_id) AS players_with_idp,
    AVG(COALESCE(progress.training_sessions, 0)) AS avg_training_sessions,
    ARRAY_AGG(DISTINCT p.id) AS player_ids,
    ARRAY_AGG(DISTINCT p.name) AS player_names
FROM player_idps pi
JOIN players p ON p.id = pi.player_id
LEFT JOIN player_idp_progress progress ON progress.idp_id = pi.id
WHERE pi.ended_at IS NULL
GROUP BY p.team_id, pi.attribute_key;

-- View: Player Attendance Summary
CREATE OR REPLACE VIEW player_attendance_summary AS
SELECT
    sa.player_id,
    p.team_id,
    p.club_id,
    COUNT(*) FILTER (WHERE sa.status = 'present') AS sessions_attended,
    COUNT(*) FILTER (WHERE sa.status = 'absent') AS sessions_missed,
    COUNT(*) AS total_sessions,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE sa.status = 'present') / NULLIF(COUNT(*), 0),
        1
    ) AS attendance_percentage
FROM session_attendance sa
JOIN players p ON p.id = sa.player_id
GROUP BY sa.player_id, p.team_id, p.club_id;

-- ========================================
-- STEP 18: Storage Bucket for Audio Feedback (Future)
-- ========================================
-- Uncomment when voice input feature is implemented
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--     'session-feedback-audio',
--     'session-feedback-audio',
--     false,
--     52428800,
--     ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg']
-- )
-- ON CONFLICT (id) DO NOTHING;
