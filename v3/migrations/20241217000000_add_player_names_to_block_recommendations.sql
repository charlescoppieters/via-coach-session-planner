-- ============================================================
-- Migration: Add Player Details to Block Recommendations IDP Breakdown
--
-- Updates get_team_block_recommendations() to include player details
-- with urgency labels in the idp_breakdown for each attribute.
-- ============================================================

-- Drop and recreate the function
DROP FUNCTION IF EXISTS get_team_block_recommendations(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER);

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
    -- Get all team sessions for calculating days/sessions since trained
    team_sessions AS (
        SELECT
            s.id,
            s.session_date,
            ROW_NUMBER() OVER (ORDER BY s.session_date DESC) AS session_rank
        FROM sessions s
        WHERE s.team_id = p_team_id
            AND (p_start_date IS NULL OR s.session_date >= p_start_date)
            AND (p_end_date IS NULL OR s.session_date <= p_end_date)
    ),
    -- Get per-player IDP data with last trained date
    player_idp_details AS (
        SELECT
            pi.attribute_key,
            pi.player_id,
            p.name AS player_name,
            MAX(s.session_date) AS last_trained_date
        FROM player_idps pi
        JOIN players p ON p.id = pi.player_id
        LEFT JOIN player_training_events pte ON pte.player_id = pi.player_id
            AND pte.attribute_key = pi.attribute_key
        LEFT JOIN sessions s ON s.id = pte.session_id
            AND s.team_id = p_team_id
            AND (p_start_date IS NULL OR s.session_date >= p_start_date)
            AND (p_end_date IS NULL OR s.session_date <= p_end_date)
        WHERE p.team_id = p_team_id
            AND pi.ended_at IS NULL
        GROUP BY pi.attribute_key, pi.player_id, p.name
    ),
    -- Calculate urgency label per player per IDP
    player_idp_urgency AS (
        SELECT
            pid.attribute_key,
            pid.player_id,
            pid.player_name,
            pid.last_trained_date,
            CASE
                WHEN pid.last_trained_date IS NULL THEN 'Underdeveloped'
                WHEN EXTRACT(DAY FROM NOW() - pid.last_trained_date) >= 14 THEN 'Underdeveloped'
                WHEN EXTRACT(DAY FROM NOW() - pid.last_trained_date) >= 7 THEN 'Due for Training'
                ELSE 'On Track'
            END AS urgency_label
        FROM player_idp_details pid
    ),
    -- Aggregate player details per attribute
    player_details_agg AS (
        SELECT
            piu.attribute_key,
            jsonb_agg(
                jsonb_build_object(
                    'name', piu.player_name,
                    'urgency_label', piu.urgency_label
                ) ORDER BY
                    CASE piu.urgency_label
                        WHEN 'Underdeveloped' THEN 1
                        WHEN 'Due for Training' THEN 2
                        ELSE 3
                    END,
                    piu.player_name
            ) AS players
        FROM player_idp_urgency piu
        GROUP BY piu.attribute_key
    ),
    -- Get scored IDPs using the existing function (for priority scoring)
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
    -- Get IDP breakdown per block WITH PLAYER DETAILS
    block_idp_breakdown AS (
        SELECT
            ba.block_id,
            jsonb_agg(
                jsonb_build_object(
                    'attribute_key', si.attribute_key,
                    'attribute_name', si.attribute_name,
                    'idp_score', si.priority_score,
                    'relevance', ba.relevance,
                    'players', COALESCE(pda.players, '[]'::jsonb)
                ) ORDER BY si.priority_score DESC
            ) AS idp_breakdown
        FROM block_attrs ba
        JOIN scored_idps si ON si.attribute_key = ba.attribute_key
        LEFT JOIN player_details_agg pda ON pda.attribute_key = ba.attribute_key
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_team_block_recommendations TO authenticated;
