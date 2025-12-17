-- ============================================================
-- Migration: Player Analytics Functions
--
-- Adds individual player analytics functions:
-- 1. calculate_player_idp_priority_score() - Individual player scoring
-- 2. get_player_idp_priorities() - IDPs with priority scores
-- 3. get_player_feedback_insights() - Feedback with quotes
-- 4. get_player_block_recommendations() - Blocks for player's IDPs
-- 5. get_player_training_balance() - Four Corners breakdown
--
-- Scoring Formula (Individual Player):
--   Player_IDP_Score = (0.55 * Urgency) + (0.25 * TrainingFrequency) + (0.20 * Sentiment)
-- ============================================================

-- ============================================================
-- FUNCTION: Calculate Player IDP Priority Score
-- For individual players, we replace PlayerReach with TrainingFrequency
-- since we're looking at a single player, not team-wide adoption.
--
-- Factors:
--   - Urgency (55%): Days since trained, exponential growth after 7 days
--   - TrainingFrequency (25%): Inverse of training sessions (fewer = higher priority)
--   - SentimentSignal (20%): Feedback sentiment (negative = higher priority)
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_player_idp_priority_score(
    p_days_since_trained INTEGER,
    p_training_sessions INTEGER,
    p_expected_sessions INTEGER DEFAULT 10,
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
    v_training_frequency NUMERIC;
    v_sentiment_signal NUMERIC;
    v_total_mentions INTEGER;
BEGIN
    -- ========================================
    -- Urgency Score (0-100)
    -- Same exponential curve as team analytics
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
        v_urgency := LEAST(100, (1 - EXP(-0.1 * (p_days_since_trained - 7))) * 100);
    END IF;

    -- ========================================
    -- Training Frequency Score (0-100)
    -- Inverse relationship: fewer sessions = higher priority
    -- 0 sessions = 100, expected sessions = 0
    -- ========================================
    IF p_expected_sessions = 0 OR p_expected_sessions IS NULL THEN
        v_training_frequency := 50; -- Default to neutral if no expectation
    ELSE
        -- Inverse: score decreases as sessions increase
        -- At 0 sessions: 100, at expected: 0, capped at 0-100
        v_training_frequency := GREATEST(0, LEAST(100,
            (1 - (COALESCE(p_training_sessions, 0)::NUMERIC / p_expected_sessions::NUMERIC)) * 100
        ));
    END IF;

    -- ========================================
    -- Sentiment Signal (0-100)
    -- Same as team analytics
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
        v_sentiment_signal := 50 +
            ((COALESCE(p_negative_mentions, 0) - COALESCE(p_positive_mentions, 0))::NUMERIC
             / v_total_mentions::NUMERIC) * 50;
        v_sentiment_signal := GREATEST(0, LEAST(100, v_sentiment_signal));
    END IF;

    -- ========================================
    -- Weighted combination (Individual Player)
    -- Urgency: 55%, TrainingFrequency: 25%, Sentiment: 20%
    -- ========================================
    RETURN ROUND(
        (0.55 * v_urgency) +
        (0.25 * v_training_frequency) +
        (0.20 * v_sentiment_signal),
        2
    );
END;
$$;

-- ============================================================
-- FUNCTION: Get Player IDP Priorities
-- Returns all IDPs for a player with priority scores and metadata
-- ============================================================
CREATE OR REPLACE FUNCTION get_player_idp_priorities(
    p_player_id UUID
)
RETURNS TABLE (
    idp_id UUID,
    attribute_key TEXT,
    attribute_name TEXT,
    priority INTEGER,
    priority_score NUMERIC,
    days_since_trained INTEGER,
    last_trained_date TIMESTAMPTZ,
    training_sessions BIGINT,
    total_training_weight NUMERIC,
    negative_mentions BIGINT,
    positive_mentions BIGINT,
    neutral_mentions BIGINT,
    gap_status TEXT,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    idp_notes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH
    -- Get base IDP progress data from the existing view
    idp_data AS (
        SELECT
            pip.idp_id,
            pip.attribute_key,
            pip.priority,
            pip.training_sessions,
            pip.total_training_weight,
            pip.positive_mentions,
            pip.negative_mentions,
            pip.neutral_mentions,
            pip.started_at,
            pip.ended_at,
            pip.idp_notes
        FROM player_idp_progress pip
        WHERE pip.player_id = p_player_id
    ),
    -- Get last trained date for each IDP
    last_training AS (
        SELECT
            pi.id AS idp_id,
            MAX(s.session_date) AS last_trained_date
        FROM player_idps pi
        LEFT JOIN player_training_events pte
            ON pte.player_id = pi.player_id
            AND pte.attribute_key = pi.attribute_key
            AND pte.created_at >= pi.started_at
            AND (pi.ended_at IS NULL OR pte.created_at <= pi.ended_at)
        LEFT JOIN sessions s ON s.id = pte.session_id
        WHERE pi.player_id = p_player_id
        GROUP BY pi.id
    )
    SELECT
        id.idp_id,
        id.attribute_key,
        COALESCE(sd.value->>'name', id.attribute_key) AS attribute_name,
        id.priority,
        -- Calculate priority score
        calculate_player_idp_priority_score(
            COALESCE(EXTRACT(DAY FROM NOW() - lt.last_trained_date)::INTEGER, 999),
            id.training_sessions::INTEGER,
            10, -- Expected sessions baseline
            id.negative_mentions::INTEGER,
            id.positive_mentions::INTEGER,
            id.neutral_mentions::INTEGER
        ) AS priority_score,
        COALESCE(EXTRACT(DAY FROM NOW() - lt.last_trained_date)::INTEGER, 999) AS days_since_trained,
        lt.last_trained_date,
        id.training_sessions,
        id.total_training_weight::NUMERIC AS total_training_weight,
        id.negative_mentions,
        id.positive_mentions,
        id.neutral_mentions,
        -- Gap status based on days
        CASE
            WHEN lt.last_trained_date IS NULL THEN 'urgent'
            WHEN EXTRACT(DAY FROM NOW() - lt.last_trained_date) >= 14 THEN 'urgent'
            WHEN EXTRACT(DAY FROM NOW() - lt.last_trained_date) >= 7 THEN 'due'
            ELSE 'on_track'
        END AS gap_status,
        id.started_at,
        id.ended_at,
        id.idp_notes
    FROM idp_data id
    LEFT JOIN last_training lt ON lt.idp_id = id.idp_id
    LEFT JOIN system_defaults sd ON sd.key = id.attribute_key
        AND sd.category LIKE 'attributes_%'
    -- Active IDPs first, then by priority score
    ORDER BY
        (id.ended_at IS NULL) DESC,
        calculate_player_idp_priority_score(
            COALESCE(EXTRACT(DAY FROM NOW() - lt.last_trained_date)::INTEGER, 999),
            id.training_sessions::INTEGER,
            10,
            id.negative_mentions::INTEGER,
            id.positive_mentions::INTEGER,
            id.neutral_mentions::INTEGER
        ) DESC;
END;
$$;

-- ============================================================
-- FUNCTION: Get Player Feedback Insights
-- Returns feedback insights with extracted quotes for a player
-- ============================================================
CREATE OR REPLACE FUNCTION get_player_feedback_insights(
    p_player_id UUID,
    p_attribute_key TEXT DEFAULT NULL,
    p_sentiment TEXT DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    insight_id UUID,
    session_feedback_id UUID,
    session_id UUID,
    session_title TEXT,
    session_date TIMESTAMPTZ,
    attribute_key TEXT,
    attribute_name TEXT,
    sentiment TEXT,
    confidence FLOAT,
    extracted_text TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        fi.id AS insight_id,
        fi.session_feedback_id,
        s.id AS session_id,
        s.title AS session_title,
        s.session_date,
        fi.attribute_key,
        COALESCE(sd.value->>'name', fi.attribute_key) AS attribute_name,
        fi.sentiment,
        fi.confidence,
        fi.extracted_text,
        fi.created_at
    FROM feedback_insights fi
    JOIN session_feedback sf ON sf.id = fi.session_feedback_id
    JOIN sessions s ON s.id = sf.session_id
    LEFT JOIN system_defaults sd ON sd.key = fi.attribute_key
        AND sd.category LIKE 'attributes_%'
    WHERE fi.player_id = p_player_id
        AND (p_attribute_key IS NULL OR fi.attribute_key = p_attribute_key)
        AND (p_sentiment IS NULL OR fi.sentiment = p_sentiment)
        AND (p_start_date IS NULL OR s.session_date >= p_start_date)
        AND (p_end_date IS NULL OR s.session_date <= p_end_date)
    ORDER BY s.session_date DESC, fi.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- ============================================================
-- FUNCTION: Get Player Feedback Insights Count
-- Returns total count for pagination
-- ============================================================
CREATE OR REPLACE FUNCTION get_player_feedback_insights_count(
    p_player_id UUID,
    p_attribute_key TEXT DEFAULT NULL,
    p_sentiment TEXT DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO v_count
    FROM feedback_insights fi
    JOIN session_feedback sf ON sf.id = fi.session_feedback_id
    JOIN sessions s ON s.id = sf.session_id
    WHERE fi.player_id = p_player_id
        AND (p_attribute_key IS NULL OR fi.attribute_key = p_attribute_key)
        AND (p_sentiment IS NULL OR fi.sentiment = p_sentiment)
        AND (p_start_date IS NULL OR s.session_date >= p_start_date)
        AND (p_end_date IS NULL OR s.session_date <= p_end_date);

    RETURN v_count;
END;
$$;

-- ============================================================
-- FUNCTION: Get Player Block Recommendations
-- Returns training blocks sorted by impact on player's active IDPs
-- ============================================================
CREATE OR REPLACE FUNCTION get_player_block_recommendations(
    p_player_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    block_id UUID,
    block_title TEXT,
    priority_score NUMERIC,
    idp_impact_count BIGINT,
    first_order_attributes JSONB,
    second_order_attributes JSONB,
    idp_breakdown JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH
    -- Get the player's club_id for block access
    player_club AS (
        SELECT club_id FROM players WHERE id = p_player_id
    ),
    -- Get scored IDPs for this player
    scored_idps AS (
        SELECT * FROM get_player_idp_priorities(p_player_id)
        WHERE ended_at IS NULL -- Only active IDPs
    ),
    -- Get all blocks accessible to this player
    accessible_blocks AS (
        SELECT DISTINCT sb.id, sb.title
        FROM session_blocks sb
        WHERE sb.club_id = (SELECT club_id FROM player_club)
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
    -- Calculate block scores based on player's IDP matches
    block_scores AS (
        SELECT
            ab.id AS block_id,
            ab.title AS block_title,
            COALESCE(SUM(si.priority_score::NUMERIC * ba.relevance::NUMERIC), 0::NUMERIC) AS priority_score,
            COUNT(DISTINCT si.attribute_key)::BIGINT AS idp_impact_count
        FROM accessible_blocks ab
        LEFT JOIN block_attrs ba ON ba.block_id = ab.id
        LEFT JOIN scored_idps si ON si.attribute_key = ba.attribute_key
        GROUP BY ab.id, ab.title
        HAVING SUM(si.priority_score::NUMERIC * ba.relevance::NUMERIC) > 0
    ),
    -- Get IDP breakdown per block
    block_idp_breakdown AS (
        SELECT
            ba.block_id,
            jsonb_agg(
                jsonb_build_object(
                    'attribute_key', si.attribute_key,
                    'attribute_name', si.attribute_name,
                    'idp_score', ROUND(si.priority_score::NUMERIC, 2),
                    'relevance', ba.relevance::NUMERIC
                ) ORDER BY si.priority_score DESC
            ) AS idp_breakdown
        FROM block_attrs ba
        JOIN scored_idps si ON si.attribute_key = ba.attribute_key
        GROUP BY ba.block_id
    ),
    -- Group first-order attributes
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
    -- Group second-order attributes
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
    )
    SELECT
        bs.block_id,
        bs.block_title,
        ROUND(bs.priority_score, 2) AS priority_score,
        bs.idp_impact_count,
        COALESCE(fo.attributes, '[]'::jsonb) AS first_order_attributes,
        COALESCE(so.attributes, '[]'::jsonb) AS second_order_attributes,
        COALESCE(bib.idp_breakdown, '[]'::jsonb) AS idp_breakdown
    FROM block_scores bs
    LEFT JOIN first_order fo ON fo.block_id = bs.block_id
    LEFT JOIN second_order so ON so.block_id = bs.block_id
    LEFT JOIN block_idp_breakdown bib ON bib.block_id = bs.block_id
    ORDER BY bs.priority_score DESC
    LIMIT p_limit;
END;
$$;

-- ============================================================
-- FUNCTION: Get Player Training Balance (Four Corners)
-- Returns training distribution across attribute categories
-- ============================================================
CREATE OR REPLACE FUNCTION get_player_training_balance(
    p_player_id UUID
)
RETURNS TABLE (
    category TEXT,
    category_display_name TEXT,
    total_opportunities NUMERIC,
    percentage NUMERIC,
    attribute_count BIGINT,
    attributes JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH
    -- Get all training events for this player
    player_training AS (
        SELECT
            pte.attribute_key,
            SUM(pte.weight) AS total_weight
        FROM player_training_events pte
        WHERE pte.player_id = p_player_id
        GROUP BY pte.attribute_key
    ),
    -- Map attributes to categories
    attribute_categories AS (
        SELECT
            sd.category,
            sd.key AS attribute_key,
            sd.value->>'name' AS attribute_name,
            COALESCE(pt.total_weight, 0) AS training_weight
        FROM system_defaults sd
        LEFT JOIN player_training pt ON pt.attribute_key = sd.key
        WHERE sd.category IN (
            'attributes_in_possession',
            'attributes_out_of_possession',
            'attributes_physical',
            'attributes_psychological'
        )
    ),
    -- Aggregate by category
    category_totals AS (
        SELECT
            ac.category,
            SUM(ac.training_weight) AS total_opportunities,
            COUNT(DISTINCT ac.attribute_key) FILTER (WHERE ac.training_weight > 0) AS attribute_count,
            jsonb_agg(
                jsonb_build_object(
                    'key', ac.attribute_key,
                    'name', ac.attribute_name,
                    'opportunities', ac.training_weight
                ) ORDER BY ac.training_weight DESC
            ) FILTER (WHERE ac.training_weight > 0) AS attributes
        FROM attribute_categories ac
        GROUP BY ac.category
    ),
    -- Calculate grand total for percentages
    grand_total AS (
        SELECT SUM(ct_inner.total_opportunities) AS grand_total FROM category_totals ct_inner
    )
    SELECT
        ct.category,
        CASE ct.category
            WHEN 'attributes_in_possession' THEN 'In Possession'
            WHEN 'attributes_out_of_possession' THEN 'Out of Possession'
            WHEN 'attributes_physical' THEN 'Physical'
            WHEN 'attributes_psychological' THEN 'Psychological'
            ELSE ct.category
        END AS category_display_name,
        ct.total_opportunities::NUMERIC AS total_opportunities,
        CASE
            WHEN gt.grand_total > 0 THEN ROUND((ct.total_opportunities::NUMERIC / gt.grand_total::NUMERIC) * 100, 1)
            ELSE 0::NUMERIC
        END AS percentage,
        ct.attribute_count,
        COALESCE(ct.attributes, '[]'::jsonb) AS attributes
    FROM category_totals ct
    CROSS JOIN grand_total gt
    ORDER BY ct.total_opportunities DESC;
END;
$$;

-- ============================================================
-- Grant execute permissions
-- ============================================================
GRANT EXECUTE ON FUNCTION calculate_player_idp_priority_score TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_idp_priorities TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_feedback_insights TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_feedback_insights_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_block_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_training_balance TO authenticated;
