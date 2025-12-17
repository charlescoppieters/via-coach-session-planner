-- ============================================================
-- Migration: Team Analytics Views and Functions
--
-- Creates views and functions to power the Team Analytics Dashboard:
-- 1. team_training_summary - Aggregate stats per team
-- 2. team_attribute_breakdown - Training opportunities by attribute category
-- 3. get_team_training_trend() - Weekly trend data
-- 4. get_team_session_block_usage() - Most used blocks
-- 5. get_team_player_comparison() - Player comparison data
--
-- All views/functions support date range filtering
-- ============================================================

-- ============================================================
-- VIEW: Team Training Summary
-- Aggregate training stats per team (used for overview cards)
-- Note: This is a base view; date filtering is done in application layer
-- ============================================================
CREATE OR REPLACE VIEW team_training_summary AS
SELECT
    t.id AS team_id,
    t.club_id,
    -- Session metrics (only count sessions with feedback = completed)
    COUNT(DISTINCT sf.session_id) AS sessions_completed,
    COALESCE(SUM(s.duration), 0) AS total_training_minutes,
    -- Player metrics
    COUNT(DISTINCT p.id) AS total_players,
    COUNT(DISTINCT pte.player_id) AS players_with_training,
    -- IDP metrics
    COUNT(DISTINCT pi.id) FILTER (WHERE pi.ended_at IS NULL) AS active_idps,
    COUNT(DISTINCT pi.attribute_key) FILTER (WHERE pi.ended_at IS NULL) AS unique_idp_attributes,
    -- Training event metrics
    COUNT(DISTINCT pte.attribute_key) AS attributes_trained,
    COALESCE(SUM(pte.weight), 0) AS total_training_opportunities
FROM teams t
LEFT JOIN players p ON p.team_id = t.id
LEFT JOIN sessions s ON s.team_id = t.id
LEFT JOIN session_feedback sf ON sf.session_id = s.id
LEFT JOIN player_training_events pte ON pte.session_id = s.id
LEFT JOIN player_idps pi ON pi.player_id = p.id
GROUP BY t.id, t.club_id;

-- ============================================================
-- FUNCTION: Get Team Training Summary with Date Range
-- Returns aggregate stats filtered by date range
-- Uses CTEs to avoid Cartesian product issues with multiple JOINs
-- ============================================================
DROP FUNCTION IF EXISTS get_team_training_summary(UUID, TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION get_team_training_summary(
    p_team_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    team_id UUID,
    sessions_completed BIGINT,
    total_training_minutes BIGINT,
    total_players BIGINT,
    active_idps BIGINT,
    unique_idp_attributes BIGINT,
    attributes_trained BIGINT,
    idp_coverage_rate NUMERIC,
    avg_attendance_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH
    -- Session stats (calculated independently)
    session_stats AS (
        SELECT
            COUNT(DISTINCT s.id) AS session_count,
            COALESCE(SUM(s.duration), 0) AS total_minutes
        FROM sessions s
        WHERE s.team_id = p_team_id
            AND (p_start_date IS NULL OR s.session_date >= p_start_date)
            AND (p_end_date IS NULL OR s.session_date <= p_end_date)
    ),
    -- Player count
    player_stats AS (
        SELECT COUNT(*) AS player_count
        FROM players p
        WHERE p.team_id = p_team_id
    ),
    -- Active IDP stats
    idp_stats AS (
        SELECT
            COUNT(*) AS idp_count,
            COUNT(DISTINCT pi.attribute_key) AS unique_attrs
        FROM player_idps pi
        JOIN players p ON p.id = pi.player_id
        WHERE p.team_id = p_team_id
            AND pi.ended_at IS NULL
    ),
    -- Unique IDP attribute keys for this team (active only)
    active_idp_attrs AS (
        SELECT DISTINCT pi.attribute_key
        FROM player_idps pi
        JOIN players p ON p.id = pi.player_id
        WHERE p.team_id = p_team_id
            AND pi.ended_at IS NULL
    ),
    -- Attributes trained in the period
    training_stats AS (
        SELECT
            COUNT(DISTINCT pte.attribute_key) AS attrs_trained
        FROM player_training_events pte
        JOIN sessions s ON s.id = pte.session_id
        WHERE s.team_id = p_team_id
            AND (p_start_date IS NULL OR s.session_date >= p_start_date)
            AND (p_end_date IS NULL OR s.session_date <= p_end_date)
    ),
    -- IDP attributes that were trained in the period
    idp_attrs_trained AS (
        SELECT COUNT(DISTINCT pte.attribute_key) AS idp_attrs_covered
        FROM player_training_events pte
        JOIN sessions s ON s.id = pte.session_id
        WHERE s.team_id = p_team_id
            AND (p_start_date IS NULL OR s.session_date >= p_start_date)
            AND (p_end_date IS NULL OR s.session_date <= p_end_date)
            AND pte.attribute_key IN (SELECT attribute_key FROM active_idp_attrs)
    ),
    -- Attendance stats
    attendance_stats AS (
        SELECT
            CASE
                WHEN COUNT(*) = 0 THEN 0
                ELSE (COUNT(*) FILTER (WHERE sa.status = 'present')::NUMERIC / COUNT(*)::NUMERIC) * 100
            END AS avg_attendance
        FROM session_attendance sa
        JOIN sessions s ON s.id = sa.session_id
        WHERE s.team_id = p_team_id
            AND (p_start_date IS NULL OR s.session_date >= p_start_date)
            AND (p_end_date IS NULL OR s.session_date <= p_end_date)
    )
    SELECT
        p_team_id AS team_id,
        ss.session_count::BIGINT AS sessions_completed,
        ss.total_minutes::BIGINT AS total_training_minutes,
        ps.player_count::BIGINT AS total_players,
        ids.idp_count::BIGINT AS active_idps,
        ids.unique_attrs::BIGINT AS unique_idp_attributes,
        ts.attrs_trained::BIGINT AS attributes_trained,
        CASE
            WHEN ids.unique_attrs = 0 THEN 0
            ELSE ROUND((iat.idp_attrs_covered::NUMERIC / ids.unique_attrs::NUMERIC) * 100, 1)
        END AS idp_coverage_rate,
        ROUND(att.avg_attendance, 1) AS avg_attendance_percentage
    FROM session_stats ss
    CROSS JOIN player_stats ps
    CROSS JOIN idp_stats ids
    CROSS JOIN training_stats ts
    CROSS JOIN idp_attrs_trained iat
    CROSS JOIN attendance_stats att;
END;
$$;

-- ============================================================
-- FUNCTION: Get Team Attribute Breakdown by Category
-- Returns training opportunities grouped by attribute category
-- Categories: attributes_in_possession, attributes_out_of_possession,
--             attributes_physical, attributes_psychological
-- ============================================================
CREATE OR REPLACE FUNCTION get_team_attribute_breakdown(
    p_team_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    category TEXT,
    category_display_name TEXT,
    total_opportunities NUMERIC,
    attribute_count BIGINT,
    attributes JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH training_data AS (
        SELECT
            pte.attribute_key,
            SUM(pte.weight) AS total_weight
        FROM player_training_events pte
        JOIN sessions s ON s.id = pte.session_id
        JOIN players p ON p.id = pte.player_id
        WHERE p.team_id = p_team_id
            AND (p_start_date IS NULL OR s.session_date >= p_start_date)
            AND (p_end_date IS NULL OR s.session_date <= p_end_date)
        GROUP BY pte.attribute_key
    ),
    categorized AS (
        SELECT
            sd.category,
            CASE sd.category
                WHEN 'attributes_in_possession' THEN 'In Possession'
                WHEN 'attributes_out_of_possession' THEN 'Out of Possession'
                WHEN 'attributes_physical' THEN 'Physical'
                WHEN 'attributes_psychological' THEN 'Psychological'
                ELSE sd.category
            END AS category_display_name,
            td.attribute_key,
            sd.value->>'name' AS attribute_name,
            COALESCE(td.total_weight, 0) AS opportunities
        FROM system_defaults sd
        LEFT JOIN training_data td ON td.attribute_key = sd.key
        WHERE sd.category IN (
            'attributes_in_possession',
            'attributes_out_of_possession',
            'attributes_physical',
            'attributes_psychological'
        )
        AND sd.is_active = true
    )
    SELECT
        c.category,
        c.category_display_name,
        COALESCE(SUM(c.opportunities), 0)::NUMERIC AS total_opportunities,
        COUNT(DISTINCT c.attribute_key) FILTER (WHERE c.opportunities > 0)::BIGINT AS attribute_count,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'key', c.attribute_key,
                    'name', c.attribute_name,
                    'opportunities', c.opportunities
                ) ORDER BY c.opportunities DESC
            ) FILTER (WHERE c.opportunities > 0),
            '[]'::jsonb
        ) AS attributes
    FROM categorized c
    GROUP BY c.category, c.category_display_name
    ORDER BY
        CASE c.category
            WHEN 'attributes_in_possession' THEN 1
            WHEN 'attributes_out_of_possession' THEN 2
            WHEN 'attributes_physical' THEN 3
            WHEN 'attributes_psychological' THEN 4
            ELSE 5
        END;
END;
$$;

-- ============================================================
-- FUNCTION: Get Team IDP Gaps with Recency-Based Analysis
-- Returns IDP gap analysis with days/sessions since last trained
-- Includes training_sessions array for expanded view
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
    training_sessions JSONB
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
        COALESCE(ats.training_sessions, '[]'::jsonb) AS training_sessions
    FROM idp_summary ids
    LEFT JOIN system_defaults sd ON sd.key = ids.attribute_key
        AND sd.category LIKE 'attributes_%'
    LEFT JOIN last_training lt ON lt.attribute_key = ids.attribute_key
    LEFT JOIN sessions_since ss ON ss.attribute_key = ids.attribute_key
    LEFT JOIN attribute_sessions ats ON ats.attribute_key = ids.attribute_key
    CROSS JOIN total_session_count tsc
    ORDER BY
        CASE
            WHEN lt.last_trained_date IS NULL THEN 0
            ELSE 1
        END,
        COALESCE(ss.sessions_since_trained, tsc.total) DESC,
        ids.attribute_key;
END;
$$;

-- ============================================================
-- FUNCTION: Get Team Training Trend
-- Returns weekly training data for trend charts
-- ============================================================
CREATE OR REPLACE FUNCTION get_team_training_trend(
    p_team_id UUID,
    p_weeks INTEGER DEFAULT 12
)
RETURNS TABLE (
    week_start DATE,
    week_label TEXT,
    sessions_count BIGINT,
    total_opportunities NUMERIC,
    avg_attendance NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH weeks AS (
        SELECT
            date_trunc('week', d)::DATE AS week_start
        FROM generate_series(
            NOW() - (p_weeks || ' weeks')::INTERVAL,
            NOW(),
            '1 week'::INTERVAL
        ) AS d
    ),
    weekly_sessions AS (
        SELECT
            date_trunc('week', s.session_date)::DATE AS week_start,
            COUNT(DISTINCT sf.session_id) AS sessions_count,
            COALESCE(SUM(pte.weight), 0) AS total_opportunities
        FROM sessions s
        JOIN session_feedback sf ON sf.session_id = s.id
        LEFT JOIN player_training_events pte ON pte.session_id = s.id
        WHERE s.team_id = p_team_id
            AND s.session_date >= NOW() - (p_weeks || ' weeks')::INTERVAL
        GROUP BY date_trunc('week', s.session_date)::DATE
    ),
    weekly_attendance AS (
        SELECT
            date_trunc('week', s.session_date)::DATE AS week_start,
            ROUND(
                (100.0 * COUNT(*) FILTER (WHERE sa.status = 'present') /
                NULLIF(COUNT(*), 0))::NUMERIC,
                1
            ) AS avg_attendance
        FROM sessions s
        JOIN session_attendance sa ON sa.session_id = s.id
        WHERE s.team_id = p_team_id
            AND s.session_date >= NOW() - (p_weeks || ' weeks')::INTERVAL
        GROUP BY date_trunc('week', s.session_date)::DATE
    )
    SELECT
        w.week_start,
        TO_CHAR(w.week_start, 'Mon DD') AS week_label,
        COALESCE(ws.sessions_count, 0)::BIGINT AS sessions_count,
        COALESCE(ws.total_opportunities, 0)::NUMERIC AS total_opportunities,
        COALESCE(wa.avg_attendance, 0)::NUMERIC AS avg_attendance
    FROM weeks w
    LEFT JOIN weekly_sessions ws ON ws.week_start = w.week_start
    LEFT JOIN weekly_attendance wa ON wa.week_start = w.week_start
    ORDER BY w.week_start ASC;
END;
$$;

-- ============================================================
-- FUNCTION: Get Team Session Block Usage
-- Returns most frequently used blocks with their training impact
-- Includes active IDP impact and first/second order attributes
-- ============================================================
DROP FUNCTION IF EXISTS get_team_session_block_usage(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER);

CREATE OR REPLACE FUNCTION get_team_session_block_usage(
    p_team_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    block_id UUID,
    block_title TEXT,
    usage_count BIGINT,
    active_idp_impact BIGINT,
    first_order_attributes JSONB,
    second_order_attributes JSONB,
    impacted_players JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH -- Get active IDPs for this team
    team_idps AS (
        SELECT DISTINCT pi.attribute_key, pi.player_id
        FROM player_idps pi
        JOIN players p ON p.id = pi.player_id
        WHERE p.team_id = p_team_id
            AND pi.ended_at IS NULL
    ),
    -- Get block usage data
    block_usage AS (
        SELECT
            sb.id AS block_id,
            sb.title AS block_title,
            COUNT(DISTINCT sba.session_id)::BIGINT AS usage_count
        FROM session_blocks sb
        JOIN session_block_assignments sba ON sba.block_id = sb.id
        JOIN sessions s ON s.id = sba.session_id
        WHERE s.team_id = p_team_id
            AND (p_start_date IS NULL OR s.session_date >= p_start_date)
            AND (p_end_date IS NULL OR s.session_date <= p_end_date)
        GROUP BY sb.id, sb.title
    ),
    -- Get attributes for each block with their names
    block_attrs AS (
        SELECT
            sba.block_id,
            sba.attribute_key,
            sba.relevance,
            COALESCE(sd.value->>'name', sba.attribute_key) AS attribute_name
        FROM session_block_attributes sba
        LEFT JOIN system_defaults sd ON sd.key = sba.attribute_key
            AND sd.category LIKE 'attributes_%'
    ),
    -- Calculate IDP impact per block (count of unique players whose IDPs match block attributes)
    block_idp_impact AS (
        SELECT
            ba.block_id,
            COUNT(DISTINCT ti.player_id)::BIGINT AS idp_impact
        FROM block_attrs ba
        JOIN team_idps ti ON ti.attribute_key = ba.attribute_key
        GROUP BY ba.block_id
    ),
    -- Get impacted players per block (players whose IDPs match block attributes)
    block_impacted_players AS (
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
        JOIN team_idps ti ON ti.attribute_key = ba.attribute_key
        JOIN players p ON p.id = ti.player_id
        GROUP BY ba.block_id
    ),
    -- Group first-order attributes (relevance = 1.0)
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
    -- Group second-order attributes (relevance < 1.0, typically 0.5)
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
        bu.block_id,
        bu.block_title,
        bu.usage_count,
        COALESCE(bii.idp_impact, 0)::BIGINT AS active_idp_impact,
        COALESCE(fo.attributes, '[]'::jsonb) AS first_order_attributes,
        COALESCE(so.attributes, '[]'::jsonb) AS second_order_attributes,
        COALESCE(bip.players, '[]'::jsonb) AS impacted_players
    FROM block_usage bu
    LEFT JOIN block_idp_impact bii ON bii.block_id = bu.block_id
    LEFT JOIN first_order fo ON fo.block_id = bu.block_id
    LEFT JOIN second_order so ON so.block_id = bu.block_id
    LEFT JOIN block_impacted_players bip ON bip.block_id = bu.block_id
    ORDER BY bu.usage_count DESC
    LIMIT p_limit;
END;
$$;

-- ============================================================
-- FUNCTION: Get Team Player Matrix
-- Returns player development data for the matrix table
-- Shows most, middle, and least trained IDPs per player
-- ============================================================
DROP FUNCTION IF EXISTS get_team_player_matrix(UUID, TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION get_team_player_matrix(
    p_team_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    player_id UUID,
    player_name TEXT,
    "position" TEXT,
    sessions_attended BIGINT,
    total_sessions BIGINT,
    attendance_percentage NUMERIC,
    active_idp_count BIGINT,
    most_trained_idp TEXT,
    most_trained_sessions BIGINT,
    mid_trained_idp TEXT,
    mid_trained_sessions BIGINT,
    least_trained_idp TEXT,
    least_trained_sessions BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH player_attendance AS (
        SELECT
            sa.player_id,
            COUNT(*) FILTER (WHERE sa.status = 'present') AS sessions_attended,
            COUNT(*) AS total_sessions,
            ROUND(
                (100.0 * COUNT(*) FILTER (WHERE sa.status = 'present') / NULLIF(COUNT(*), 0))::NUMERIC,
                1
            ) AS attendance_percentage
        FROM session_attendance sa
        JOIN sessions s ON s.id = sa.session_id
        WHERE s.team_id = p_team_id
            AND (p_start_date IS NULL OR s.session_date >= p_start_date)
            AND (p_end_date IS NULL OR s.session_date <= p_end_date)
        GROUP BY sa.player_id
    ),
    -- Get active IDPs for each player
    active_idps AS (
        SELECT
            pi.player_id,
            pi.attribute_key,
            COALESCE(sd.value->>'name', pi.attribute_key) AS attribute_name
        FROM player_idps pi
        LEFT JOIN system_defaults sd ON sd.key = pi.attribute_key
            AND sd.category LIKE 'attributes_%'
        WHERE pi.ended_at IS NULL
    ),
    -- Count IDPs per player
    idp_counts AS (
        SELECT
            ai.player_id,
            COUNT(*) AS active_idp_count
        FROM active_idps ai
        GROUP BY ai.player_id
    ),
    -- Count training sessions per IDP per player (distinct sessions, not weight)
    idp_training AS (
        SELECT
            ai.player_id AS player_id,
            ai.attribute_key AS attribute_key,
            ai.attribute_name AS attribute_name,
            COUNT(DISTINCT pte.session_id) AS sessions_trained
        FROM active_idps ai
        LEFT JOIN player_training_events pte ON pte.player_id = ai.player_id
            AND pte.attribute_key = ai.attribute_key
        LEFT JOIN sessions s ON s.id = pte.session_id
            AND s.team_id = p_team_id
            AND (p_start_date IS NULL OR s.session_date >= p_start_date)
            AND (p_end_date IS NULL OR s.session_date <= p_end_date)
        GROUP BY ai.player_id, ai.attribute_key, ai.attribute_name
    ),
    -- Rank IDPs by training sessions
    ranked_idps AS (
        SELECT
            it.player_id AS player_id,
            it.attribute_name AS attribute_name,
            it.sessions_trained AS sessions_trained,
            ROW_NUMBER() OVER (PARTITION BY it.player_id ORDER BY it.sessions_trained DESC, it.attribute_name) AS rank_desc,
            COUNT(*) OVER (PARTITION BY it.player_id) AS total_idps
        FROM idp_training it
    ),
    -- Get most trained (rank 1)
    most_trained AS (
        SELECT ri.player_id, ri.attribute_name, ri.sessions_trained
        FROM ranked_idps ri WHERE ri.rank_desc = 1
    ),
    -- Get least trained (last rank)
    least_trained AS (
        SELECT ri.player_id, ri.attribute_name, ri.sessions_trained
        FROM ranked_idps ri WHERE ri.rank_desc = ri.total_idps
    ),
    -- Get middle trained (middle rank, or second if only 2-3 IDPs)
    mid_trained AS (
        SELECT ri.player_id, ri.attribute_name, ri.sessions_trained
        FROM ranked_idps ri
        WHERE ri.rank_desc = CASE
            WHEN ri.total_idps <= 2 THEN 2
            WHEN ri.total_idps = 3 THEN 2
            ELSE (ri.total_idps + 1) / 2
        END
    )
    SELECT
        p.id AS player_id,
        p.name AS player_name,
        p.position,
        COALESCE(pa.sessions_attended, 0)::BIGINT AS sessions_attended,
        COALESCE(pa.total_sessions, 0)::BIGINT AS total_sessions,
        COALESCE(pa.attendance_percentage, 0)::NUMERIC AS attendance_percentage,
        COALESCE(ic.active_idp_count, 0)::BIGINT AS active_idp_count,
        mt.attribute_name AS most_trained_idp,
        COALESCE(mt.sessions_trained, 0)::BIGINT AS most_trained_sessions,
        mid.attribute_name AS mid_trained_idp,
        COALESCE(mid.sessions_trained, 0)::BIGINT AS mid_trained_sessions,
        lt.attribute_name AS least_trained_idp,
        COALESCE(lt.sessions_trained, 0)::BIGINT AS least_trained_sessions
    FROM players p
    LEFT JOIN player_attendance pa ON pa.player_id = p.id
    LEFT JOIN idp_counts ic ON ic.player_id = p.id
    LEFT JOIN most_trained mt ON mt.player_id = p.id
    LEFT JOIN mid_trained mid ON mid.player_id = p.id
    LEFT JOIN least_trained lt ON lt.player_id = p.id
    WHERE p.team_id = p_team_id
    ORDER BY COALESCE(pa.attendance_percentage, 0) DESC, p.name ASC;
END;
$$;

-- ============================================================
-- FUNCTION: Get Player Comparison Data
-- Returns detailed data for comparing multiple players
-- ============================================================
CREATE OR REPLACE FUNCTION get_player_comparison(
    p_player_ids UUID[],
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    player_id UUID,
    player_name TEXT,
    "position" TEXT,
    sessions_attended BIGINT,
    total_sessions BIGINT,
    attendance_percentage NUMERIC,
    total_opportunities NUMERIC,
    idps JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH player_attendance AS (
        SELECT
            sa.player_id,
            COUNT(*) FILTER (WHERE sa.status = 'present') AS sessions_attended,
            COUNT(*) AS total_sessions,
            ROUND(
                (100.0 * COUNT(*) FILTER (WHERE sa.status = 'present') / NULLIF(COUNT(*), 0))::NUMERIC,
                1
            ) AS attendance_percentage
        FROM session_attendance sa
        JOIN sessions s ON s.id = sa.session_id
        WHERE sa.player_id = ANY(p_player_ids)
            AND (p_start_date IS NULL OR s.session_date >= p_start_date)
            AND (p_end_date IS NULL OR s.session_date <= p_end_date)
        GROUP BY sa.player_id
    ),
    player_opportunities AS (
        SELECT
            pte.player_id,
            SUM(pte.weight) AS total_opportunities
        FROM player_training_events pte
        JOIN sessions s ON s.id = pte.session_id
        WHERE pte.player_id = ANY(p_player_ids)
            AND (p_start_date IS NULL OR s.session_date >= p_start_date)
            AND (p_end_date IS NULL OR s.session_date <= p_end_date)
        GROUP BY pte.player_id
    ),
    idp_opportunities AS (
        SELECT
            pi.player_id,
            pi.attribute_key,
            pi.priority,
            sd.value->>'name' AS attribute_name,
            COALESCE(SUM(pte.weight), 0) AS opportunities
        FROM player_idps pi
        LEFT JOIN system_defaults sd ON sd.key = pi.attribute_key
            AND sd.category LIKE 'attributes_%'
        LEFT JOIN player_training_events pte ON pte.player_id = pi.player_id
            AND pte.attribute_key = pi.attribute_key
        LEFT JOIN sessions s ON s.id = pte.session_id
            AND (p_start_date IS NULL OR s.session_date >= p_start_date)
            AND (p_end_date IS NULL OR s.session_date <= p_end_date)
        WHERE pi.player_id = ANY(p_player_ids)
            AND pi.ended_at IS NULL
        GROUP BY pi.player_id, pi.attribute_key, pi.priority, sd.value->>'name'
    ),
    player_idps_agg AS (
        SELECT
            io.player_id,
            jsonb_agg(
                jsonb_build_object(
                    'key', io.attribute_key,
                    'name', io.attribute_name,
                    'priority', io.priority,
                    'opportunities', io.opportunities
                ) ORDER BY io.priority ASC
            ) AS idps
        FROM idp_opportunities io
        GROUP BY io.player_id
    )
    SELECT
        p.id AS player_id,
        p.name AS player_name,
        p.position,
        COALESCE(pa.sessions_attended, 0)::BIGINT AS sessions_attended,
        COALESCE(pa.total_sessions, 0)::BIGINT AS total_sessions,
        COALESCE(pa.attendance_percentage, 0)::NUMERIC AS attendance_percentage,
        COALESCE(po.total_opportunities, 0)::NUMERIC AS total_opportunities,
        COALESCE(pia.idps, '[]'::jsonb) AS idps
    FROM players p
    LEFT JOIN player_attendance pa ON pa.player_id = p.id
    LEFT JOIN player_opportunities po ON po.player_id = p.id
    LEFT JOIN player_idps_agg pia ON pia.player_id = p.id
    WHERE p.id = ANY(p_player_ids)
    ORDER BY p.name ASC;
END;
$$;

-- ============================================================
-- Grant execute permissions
-- ============================================================
GRANT EXECUTE ON FUNCTION get_team_training_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_attribute_breakdown TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_idp_gaps TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_training_trend TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_session_block_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_player_matrix TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_comparison TO authenticated;
