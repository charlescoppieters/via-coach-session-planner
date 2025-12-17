-- ============================================================
-- Migration: Recommendation Scoring System
--
-- Adds weighted scoring for IDP prioritization and block recommendations:
-- 1. calculate_idp_priority_score() - Helper function for scoring
-- 2. Updates to get_team_idp_gaps() - Adds priority_score column
-- 3. get_team_block_recommendations() - Blocks sorted by IDP impact
--
-- Scoring Formula:
--   IDP_Score = (0.45 * Urgency) + (0.35 * PlayerReach) + (0.20 * SentimentSignal)
--   Block_Score = Sum of (IDP_Score * Relevance) for matching attributes
-- ============================================================

-- ============================================================
-- FUNCTION: Calculate IDP Priority Score
-- Pure function that calculates a 0-100 priority score based on:
--   - Urgency (45%): Days since trained, exponential growth after 7 days
--   - PlayerReach (35%): % of team with this IDP
--   - SentimentSignal (20%): Feedback sentiment (negative = higher priority)
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_idp_priority_score(
    p_days_since_trained INTEGER,
    p_players_with_idp INTEGER,
    p_total_players INTEGER,
    p_negative_mentions INTEGER DEFAULT 0,
    p_positive_mentions INTEGER DEFAULT 0,
    p_neutral_mentions INTEGER DEFAULT 0
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_urgency NUMERIC;
    v_player_reach NUMERIC;
    v_sentiment_signal NUMERIC;
    v_total_mentions INTEGER;
BEGIN
    -- ========================================
    -- Urgency Score (0-100)
    -- Days < 7: No urgency (recently trained)
    -- Days >= 7: Exponential growth, caps at ~100 around 30 days
    -- NULL/999: Never trained = max urgency
    -- ========================================
    IF p_days_since_trained IS NULL OR p_days_since_trained >= 999 THEN
        v_urgency := 100; -- Never trained = max urgency
    ELSIF p_days_since_trained < 7 THEN
        v_urgency := 0; -- Recently trained = no urgency
    ELSE
        -- Exponential curve: urgency grows faster as days increase
        -- Formula: (1 - e^(-0.1 * (days - 7))) * 100
        -- At 14 days: ~50, at 21 days: ~75, at 30 days: ~90
        v_urgency := LEAST(100, (1 - EXP(-0.1 * (p_days_since_trained - 7))) * 100);
    END IF;

    -- ========================================
    -- Player Reach Score (0-100)
    -- What percentage of the team has this IDP active
    -- ========================================
    IF p_total_players = 0 OR p_total_players IS NULL THEN
        v_player_reach := 0;
    ELSE
        v_player_reach := (p_players_with_idp::NUMERIC / p_total_players::NUMERIC) * 100;
    END IF;

    -- ========================================
    -- Sentiment Signal (0-100)
    -- Negative feedback = higher priority (needs work)
    -- Positive feedback = lower priority (progressing well)
    -- No feedback = neutral (50)
    -- ========================================
    v_total_mentions := COALESCE(p_negative_mentions, 0) +
                        COALESCE(p_positive_mentions, 0) +
                        COALESCE(p_neutral_mentions, 0);

    IF v_total_mentions = 0 THEN
        v_sentiment_signal := 50; -- No feedback = neutral
    ELSE
        -- Range: 0 (all positive) to 100 (all negative)
        -- Formula: 50 + ((negative - positive) / total) * 50
        v_sentiment_signal := 50 +
            ((COALESCE(p_negative_mentions, 0) - COALESCE(p_positive_mentions, 0))::NUMERIC
             / v_total_mentions::NUMERIC) * 50;
        v_sentiment_signal := GREATEST(0, LEAST(100, v_sentiment_signal));
    END IF;

    -- ========================================
    -- Weighted combination
    -- ========================================
    RETURN ROUND(
        (0.45 * v_urgency) +
        (0.35 * v_player_reach) +
        (0.20 * v_sentiment_signal),
        2
    );
END;
$$;

-- ============================================================
-- UPDATE: Get Team IDP Gaps (add priority_score)
-- Drops and recreates the function with new return column
-- ============================================================
DROP FUNCTION IF EXISTS get_team_idp_gaps(UUID, TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION get_team_idp_gaps(
    p_team_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    attribute_key TEXT,
    attribute_name TEXT,
    players_with_idp BIGINT,
    players_trained BIGINT,
    last_trained_date TIMESTAMPTZ,
    days_since_trained INTEGER,
    sessions_since_trained INTEGER,
    total_sessions INTEGER,
    player_ids UUID[],
    player_names TEXT[],
    gap_status TEXT,
    training_sessions JSONB,
    priority_score NUMERIC  -- NEW: Weighted priority score 0-100
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH team_sessions AS (
        -- Get all team sessions in the date range, ordered by date
        SELECT
            s.id,
            s.session_date,
            ROW_NUMBER() OVER (ORDER BY s.session_date DESC) AS session_rank
        FROM sessions s
        WHERE s.team_id = p_team_id
            AND (p_start_date IS NULL OR s.session_date >= p_start_date)
            AND (p_end_date IS NULL OR s.session_date <= p_end_date)
    ),
    total_session_count AS (
        SELECT COUNT(*)::INTEGER AS total FROM team_sessions
    ),
    -- Get total players for reach calculation
    total_players AS (
        SELECT COUNT(*)::INTEGER AS total FROM players WHERE team_id = p_team_id
    ),
    -- Get all active IDPs for the team
    team_idps AS (
        SELECT
            pi.attribute_key,
            pi.player_id,
            p.name AS player_name
        FROM player_idps pi
        JOIN players p ON p.id = pi.player_id
        WHERE p.team_id = p_team_id
            AND pi.ended_at IS NULL
    ),
    -- Find the most recent training for each IDP attribute
    last_training AS (
        SELECT
            pte.attribute_key,
            MAX(s.session_date) AS last_trained_date,
            COUNT(DISTINCT pte.player_id) AS players_trained
        FROM player_training_events pte
        JOIN sessions s ON s.id = pte.session_id
        JOIN team_idps ti ON ti.attribute_key = pte.attribute_key
            AND ti.player_id = pte.player_id
        WHERE s.team_id = p_team_id
            AND (p_start_date IS NULL OR s.session_date >= p_start_date)
            AND (p_end_date IS NULL OR s.session_date <= p_end_date)
        GROUP BY pte.attribute_key
    ),
    -- Count sessions since last training for each attribute
    sessions_since AS (
        SELECT
            lt.attribute_key,
            lt.last_trained_date,
            lt.players_trained,
            COUNT(ts.id)::INTEGER AS sessions_since_trained
        FROM last_training lt
        CROSS JOIN team_sessions ts
        WHERE ts.session_date > lt.last_trained_date
        GROUP BY lt.attribute_key, lt.last_trained_date, lt.players_trained
    ),
    -- Aggregate IDP data
    idp_summary AS (
        SELECT
            ti.attribute_key,
            COUNT(DISTINCT ti.player_id)::BIGINT AS players_with_idp,
            ARRAY_AGG(DISTINCT ti.player_id) AS player_ids,
            ARRAY_AGG(DISTINCT ti.player_name) AS player_names
        FROM team_idps ti
        GROUP BY ti.attribute_key
    ),
    -- Get all sessions that trained each IDP attribute (for expanded view)
    attribute_sessions AS (
        SELECT
            pte.attribute_key,
            jsonb_agg(
                DISTINCT jsonb_build_object(
                    'session_id', s.id,
                    'session_name', s.title,
                    'session_date', s.session_date
                )
            ) AS training_sessions
        FROM player_training_events pte
        JOIN sessions s ON s.id = pte.session_id
        JOIN team_idps ti ON ti.attribute_key = pte.attribute_key
            AND ti.player_id = pte.player_id
        WHERE s.team_id = p_team_id
            AND (p_start_date IS NULL OR s.session_date >= p_start_date)
            AND (p_end_date IS NULL OR s.session_date <= p_end_date)
        GROUP BY pte.attribute_key
    ),
    -- Aggregate feedback sentiment per attribute
    feedback_sentiment AS (
        SELECT
            fi.attribute_key,
            COUNT(*) FILTER (WHERE fi.sentiment = 'negative')::INTEGER AS negative_count,
            COUNT(*) FILTER (WHERE fi.sentiment = 'positive')::INTEGER AS positive_count,
            COUNT(*) FILTER (WHERE fi.sentiment = 'neutral')::INTEGER AS neutral_count
        FROM feedback_insights fi
        JOIN session_feedback sf ON sf.id = fi.session_feedback_id
        JOIN sessions s ON s.id = sf.session_id
        WHERE s.team_id = p_team_id
            AND fi.attribute_key IS NOT NULL
            AND (p_start_date IS NULL OR s.session_date >= p_start_date)
            AND (p_end_date IS NULL OR s.session_date <= p_end_date)
        GROUP BY fi.attribute_key
    )
    SELECT
        ids.attribute_key,
        COALESCE(sd.value->>'name', ids.attribute_key) AS attribute_name,
        ids.players_with_idp,
        COALESCE(lt.players_trained, 0)::BIGINT AS players_trained,
        lt.last_trained_date,
        COALESCE(EXTRACT(DAY FROM NOW() - lt.last_trained_date)::INTEGER, 999) AS days_since_trained,
        COALESCE(ss.sessions_since_trained, tsc.total) AS sessions_since_trained,
        tsc.total AS total_sessions,
        ids.player_ids,
        ids.player_names,
        CASE
            -- Urgent: Not trained in 3+ sessions or never trained
            WHEN lt.last_trained_date IS NULL THEN 'urgent'
            WHEN COALESCE(ss.sessions_since_trained, tsc.total) >= 3 THEN 'urgent'
            -- Due: Not trained in 2 sessions
            WHEN COALESCE(ss.sessions_since_trained, 0) >= 2 THEN 'due'
            -- On Track: Trained within last 1-2 sessions
            ELSE 'on_track'
        END AS gap_status,
        COALESCE(ats.training_sessions, '[]'::jsonb) AS training_sessions,
        -- Calculate priority score using helper function
        calculate_idp_priority_score(
            COALESCE(EXTRACT(DAY FROM NOW() - lt.last_trained_date)::INTEGER, 999),
            ids.players_with_idp::INTEGER,
            tp.total,
            COALESCE(fs.negative_count, 0),
            COALESCE(fs.positive_count, 0),
            COALESCE(fs.neutral_count, 0)
        ) AS priority_score
    FROM idp_summary ids
    LEFT JOIN system_defaults sd ON sd.key = ids.attribute_key
        AND sd.category LIKE 'attributes_%'
    LEFT JOIN last_training lt ON lt.attribute_key = ids.attribute_key
    LEFT JOIN sessions_since ss ON ss.attribute_key = ids.attribute_key
    LEFT JOIN attribute_sessions ats ON ats.attribute_key = ids.attribute_key
    LEFT JOIN feedback_sentiment fs ON fs.attribute_key = ids.attribute_key
    CROSS JOIN total_session_count tsc
    CROSS JOIN total_players tp
    -- Sort by priority score (highest first)
    ORDER BY
        calculate_idp_priority_score(
            COALESCE(EXTRACT(DAY FROM NOW() - lt.last_trained_date)::INTEGER, 999),
            ids.players_with_idp::INTEGER,
            tp.total,
            COALESCE(fs.negative_count, 0),
            COALESCE(fs.positive_count, 0),
            COALESCE(fs.neutral_count, 0)
        ) DESC NULLS LAST;
END;
$$;

-- ============================================================
-- FUNCTION: Get Team Block Recommendations
-- Returns training blocks sorted by their impact on high-priority IDPs
-- Block_Score = Sum of (IDP_Score * Relevance) for matching attributes
-- ============================================================
CREATE OR REPLACE FUNCTION get_team_block_recommendations(
    p_team_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    block_id UUID,
    block_title TEXT,
    priority_score NUMERIC,
    idp_impact_count BIGINT,
    first_order_attributes JSONB,
    second_order_attributes JSONB,
    impacted_players JSONB,
    idp_breakdown JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH
    -- Get scored IDPs using the existing function
    scored_idps AS (
        SELECT * FROM get_team_idp_gaps(p_team_id, p_start_date, p_end_date)
    ),
    -- Get team's club_id for block access
    team_club AS (
        SELECT club_id FROM teams WHERE id = p_team_id
    ),
    -- Get all blocks accessible to this team (team's club blocks + public blocks)
    accessible_blocks AS (
        SELECT DISTINCT sb.id, sb.title
        FROM session_blocks sb
        WHERE sb.club_id = (SELECT club_id FROM team_club)
           OR sb.is_public = true
    ),
    -- Get attributes for each block
    block_attrs AS (
        SELECT
            sba.block_id,
            sba.attribute_key,
            sba.relevance,
            COALESCE(sd.value->>'name', sba.attribute_key) AS attribute_name
        FROM session_block_attributes sba
        JOIN accessible_blocks ab ON ab.id = sba.block_id
        LEFT JOIN system_defaults sd ON sd.key = sba.attribute_key
            AND sd.category LIKE 'attributes_%'
    ),
    -- Calculate block scores based on IDP matches
    block_scores AS (
        SELECT
            ab.id AS block_id,
            ab.title AS block_title,
            COALESCE(SUM(si.priority_score * ba.relevance::NUMERIC), 0::NUMERIC) AS priority_score,
            COUNT(DISTINCT si.attribute_key)::BIGINT AS idp_impact_count
        FROM accessible_blocks ab
        LEFT JOIN block_attrs ba ON ba.block_id = ab.id
        LEFT JOIN scored_idps si ON si.attribute_key = ba.attribute_key
        GROUP BY ab.id, ab.title
        HAVING SUM(si.priority_score * ba.relevance) > 0  -- Only include blocks that match IDPs
    ),
    -- Get IDP breakdown per block (for UI display)
    block_idp_breakdown AS (
        SELECT
            ba.block_id,
            jsonb_agg(
                jsonb_build_object(
                    'attribute_key', si.attribute_key,
                    'attribute_name', si.attribute_name,
                    'idp_score', si.priority_score,
                    'relevance', ba.relevance,
                    'players_count', si.players_with_idp
                ) ORDER BY si.priority_score DESC
            ) AS idp_breakdown
        FROM block_attrs ba
        JOIN scored_idps si ON si.attribute_key = ba.attribute_key
        GROUP BY ba.block_id
    ),
    -- Group first-order attributes (relevance >= 1.0)
    first_order AS (
        SELECT
            ba.block_id,
            jsonb_agg(
                jsonb_build_object(
                    'key', ba.attribute_key,
                    'name', ba.attribute_name
                ) ORDER BY ba.attribute_name
            ) AS attributes
        FROM block_attrs ba
        WHERE ba.relevance >= 1.0
        GROUP BY ba.block_id
    ),
    -- Group second-order attributes (relevance < 1.0)
    second_order AS (
        SELECT
            ba.block_id,
            jsonb_agg(
                jsonb_build_object(
                    'key', ba.attribute_key,
                    'name', ba.attribute_name
                ) ORDER BY ba.attribute_name
            ) AS attributes
        FROM block_attrs ba
        WHERE ba.relevance < 1.0
        GROUP BY ba.block_id
    ),
    -- Get impacted players per block (players whose IDPs match block attributes)
    block_players AS (
        SELECT
            ba.block_id,
            jsonb_agg(
                DISTINCT jsonb_build_object(
                    'player_id', p.id,
                    'player_name', p.name,
                    'position', p.position
                )
            ) AS players
        FROM block_attrs ba
        JOIN player_idps pi ON pi.attribute_key = ba.attribute_key AND pi.ended_at IS NULL
        JOIN players p ON p.id = pi.player_id AND p.team_id = p_team_id
        GROUP BY ba.block_id
    )
    SELECT
        bs.block_id,
        bs.block_title,
        ROUND(bs.priority_score, 2) AS priority_score,
        bs.idp_impact_count,
        COALESCE(fo.attributes, '[]'::jsonb) AS first_order_attributes,
        COALESCE(so.attributes, '[]'::jsonb) AS second_order_attributes,
        COALESCE(bp.players, '[]'::jsonb) AS impacted_players,
        COALESCE(bib.idp_breakdown, '[]'::jsonb) AS idp_breakdown
    FROM block_scores bs
    LEFT JOIN first_order fo ON fo.block_id = bs.block_id
    LEFT JOIN second_order so ON so.block_id = bs.block_id
    LEFT JOIN block_players bp ON bp.block_id = bs.block_id
    LEFT JOIN block_idp_breakdown bib ON bib.block_id = bs.block_id
    ORDER BY bs.priority_score DESC
    LIMIT p_limit;
END;
$$;

-- ============================================================
-- Grant execute permissions
-- ============================================================
GRANT EXECUTE ON FUNCTION calculate_idp_priority_score TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_idp_gaps TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_block_recommendations TO authenticated;
