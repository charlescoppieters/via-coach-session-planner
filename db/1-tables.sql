


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_idp_priority_score"("p_days_since_trained" integer, "p_players_with_idp" integer, "p_total_players" integer, "p_negative_mentions" integer DEFAULT 0, "p_positive_mentions" integer DEFAULT 0, "p_neutral_mentions" integer DEFAULT 0) RETURNS numeric
    LANGUAGE "plpgsql" IMMUTABLE
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


ALTER FUNCTION "public"."calculate_idp_priority_score"("p_days_since_trained" integer, "p_players_with_idp" integer, "p_total_players" integer, "p_negative_mentions" integer, "p_positive_mentions" integer, "p_neutral_mentions" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_player_idp_priority_score"("p_days_since_trained" integer, "p_training_sessions" integer, "p_expected_sessions" integer DEFAULT 10, "p_negative_mentions" integer DEFAULT 0, "p_positive_mentions" integer DEFAULT 0, "p_neutral_mentions" integer DEFAULT 0) RETURNS numeric
    LANGUAGE "plpgsql" IMMUTABLE
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


ALTER FUNCTION "public"."calculate_player_idp_priority_score"("p_days_since_trained" integer, "p_training_sessions" integer, "p_expected_sessions" integer, "p_negative_mentions" integer, "p_positive_mentions" integer, "p_neutral_mentions" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_email_has_club"("check_email" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    result JSON;
BEGIN
    -- Check if a coach with this email exists and has a club membership
    SELECT json_build_object(
        'has_club', TRUE,
        'coach_id', co.id
    ) INTO result
    FROM coaches co
    JOIN club_memberships cm ON cm.coach_id = co.id
    WHERE LOWER(co.email) = LOWER(check_email)
    LIMIT 1;

    -- If no result, return has_club = false
    IF result IS NULL THEN
        RETURN json_build_object('has_club', FALSE);
    END IF;

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."check_email_has_club"("check_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."copy_club_methodology_to_team"("p_team_id" "uuid", "p_club_id" "uuid", "p_coach_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."copy_club_methodology_to_team"("p_team_id" "uuid", "p_club_id" "uuid", "p_coach_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_club_with_membership"("club_name" "text", "club_logo_url" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  DECLARE
      new_club_id UUID;
      coach_id_var UUID;
      result JSON;
  BEGIN
      IF auth.uid() IS NULL THEN
          RAISE EXCEPTION 'Not authenticated';
      END IF;

      SELECT id INTO coach_id_var
      FROM coaches
      WHERE auth_user_id = auth.uid();

      IF coach_id_var IS NULL THEN
          RAISE EXCEPTION 'Coach profile not found';
      END IF;

      IF club_name IS NULL OR TRIM(club_name) = '' THEN
          RAISE EXCEPTION 'Club name is required';
      END IF;

      INSERT INTO clubs (name, logo_url)
      VALUES (TRIM(club_name), club_logo_url)
      RETURNING id INTO new_club_id;

      INSERT INTO club_memberships (club_id, coach_id, role)
      VALUES (new_club_id, coach_id_var, 'admin');

      SELECT json_build_object(
          'club', json_build_object(
              'id', c.id,
              'name', c.name,
              'logo_url', c.logo_url,
              'created_at', c.created_at,
              'updated_at', c.updated_at
          ),
          'membership', json_build_object(
              'id', m.id,
              'club_id', m.club_id,
              'coach_id', m.coach_id,
              'role', m.role,
              'joined_at', m.joined_at
          )
      ) INTO result
      FROM clubs c
      JOIN club_memberships m ON m.club_id = c.id
      WHERE c.id = new_club_id;

      RETURN result;
  END;
  $$;


ALTER FUNCTION "public"."create_club_with_membership"("club_name" "text", "club_logo_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_training_events"("p_session_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."generate_training_events"("p_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_club_coaches"("target_club_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    coach_id_var UUID;
    result JSON;
BEGIN
    -- Get current coach ID
    SELECT id INTO coach_id_var
    FROM coaches
    WHERE auth_user_id = auth.uid();

    IF coach_id_var IS NULL THEN
        RAISE EXCEPTION 'Coach profile not found';
    END IF;

    -- Verify caller is a member of this club
    IF NOT EXISTS (
        SELECT 1 FROM club_memberships
        WHERE club_id = target_club_id
        AND coach_id = coach_id_var
    ) THEN
        RAISE EXCEPTION 'You are not a member of this club';
    END IF;

    -- Get all coaches in the club with their details
    -- Order by role (admin first) then by join date
    SELECT json_agg(
        json_build_object(
            'id', cm.id,
            'club_id', cm.club_id,
            'coach_id', cm.coach_id,
            'role', cm.role,
            'joined_at', cm.joined_at,
            'coach', json_build_object(
                'id', c.id,
                'name', c.name,
                'email', c.email,
                'profile_picture', c.profile_picture,
                'position', c.position
            )
        )
        ORDER BY (cm.role = 'admin') DESC, cm.joined_at ASC
    ) INTO result
    FROM club_memberships cm
    JOIN coaches c ON c.id = cm.coach_id
    WHERE cm.club_id = target_club_id;

    -- Return empty array if no results
    IF result IS NULL THEN
        result := '[]'::json;
    END IF;

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_club_coaches"("target_club_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_invite_with_club"("invite_token" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    result JSON;
BEGIN
    -- Validate input
    IF invite_token IS NULL OR TRIM(invite_token) = '' THEN
        RETURN NULL;
    END IF;

    -- Look up invite with club data
    -- Only return if invite exists and hasn't been used
    SELECT json_build_object(
        'invite', json_build_object(
            'id', i.id,
            'email', i.email,
            'token', i.token,
            'used_at', i.used_at,
            'created_at', i.created_at
        ),
        'club', json_build_object(
            'id', c.id,
            'name', c.name,
            'logo_url', c.logo_url
        )
    ) INTO result
    FROM club_invites i
    JOIN clubs c ON c.id = i.club_id
    WHERE i.token = invite_token
    AND i.used_at IS NULL;

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_invite_with_club"("invite_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_latest_syllabus_session"("p_team_id" "uuid") RETURNS TABLE("id" "uuid", "session_date" timestamp with time zone, "syllabus_week_index" integer, "syllabus_day_of_week" integer, "theme_block_id" "text", "theme_snapshot" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.session_date,
        s.syllabus_week_index,
        s.syllabus_day_of_week,
        s.theme_block_id,
        s.theme_snapshot
    FROM sessions s
    WHERE s.team_id = p_team_id
    AND s.syllabus_week_index IS NOT NULL
    ORDER BY s.session_date DESC
    LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_latest_syllabus_session"("p_team_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_player_block_recommendations"("p_player_id" "uuid", "p_limit" integer DEFAULT 10) RETURNS TABLE("block_id" "uuid", "block_title" "text", "priority_score" numeric, "idp_impact_count" bigint, "first_order_attributes" "jsonb", "second_order_attributes" "jsonb", "idp_breakdown" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_player_block_recommendations"("p_player_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_player_comparison"("p_player_ids" "uuid"[], "p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE("player_id" "uuid", "player_name" "text", "position" "text", "sessions_attended" bigint, "total_sessions" bigint, "attendance_percentage" numeric, "total_opportunities" numeric, "idps" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_player_comparison"("p_player_ids" "uuid"[], "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_player_feedback_insights"("p_player_id" "uuid", "p_attribute_key" "text" DEFAULT NULL::"text", "p_sentiment" "text" DEFAULT NULL::"text", "p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("insight_id" "uuid", "session_feedback_id" "uuid", "session_id" "uuid", "session_title" "text", "session_date" timestamp with time zone, "attribute_key" "text", "attribute_name" "text", "sentiment" "text", "confidence" double precision, "extracted_text" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_player_feedback_insights"("p_player_id" "uuid", "p_attribute_key" "text", "p_sentiment" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_player_feedback_insights_count"("p_player_id" "uuid", "p_attribute_key" "text" DEFAULT NULL::"text", "p_sentiment" "text" DEFAULT NULL::"text", "p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_player_feedback_insights_count"("p_player_id" "uuid", "p_attribute_key" "text", "p_sentiment" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_player_idp_priorities"("p_player_id" "uuid") RETURNS TABLE("idp_id" "uuid", "attribute_key" "text", "attribute_name" "text", "priority" integer, "priority_score" numeric, "days_since_trained" integer, "last_trained_date" timestamp with time zone, "training_sessions" bigint, "total_training_weight" numeric, "negative_mentions" bigint, "positive_mentions" bigint, "neutral_mentions" bigint, "gap_status" "text", "started_at" timestamp with time zone, "ended_at" timestamp with time zone, "idp_notes" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_player_idp_priorities"("p_player_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_player_training_balance"("p_player_id" "uuid") RETURNS TABLE("category" "text", "category_display_name" "text", "total_opportunities" numeric, "percentage" numeric, "attribute_count" bigint, "attributes" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_player_training_balance"("p_player_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_team_attribute_breakdown"("p_team_id" "uuid", "p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE("category" "text", "category_display_name" "text", "total_opportunities" numeric, "attribute_count" bigint, "attributes" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_team_attribute_breakdown"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_team_block_recommendations"("p_team_id" "uuid", "p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_limit" integer DEFAULT 10) RETURNS TABLE("block_id" "uuid", "block_title" "text", "priority_score" numeric, "idp_impact_count" bigint, "first_order_attributes" "jsonb", "second_order_attributes" "jsonb", "impacted_players" "jsonb", "idp_breakdown" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_team_block_recommendations"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_team_idp_gaps"("p_team_id" "uuid", "p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE("attribute_key" "text", "attribute_name" "text", "players_with_idp" bigint, "players_trained" bigint, "last_trained_date" timestamp with time zone, "days_since_trained" integer, "sessions_since_trained" integer, "total_sessions" integer, "player_ids" "uuid"[], "player_names" "text"[], "gap_status" "text", "training_sessions" "jsonb", "priority_score" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_team_idp_gaps"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_team_player_matrix"("p_team_id" "uuid", "p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE("player_id" "uuid", "player_name" "text", "position" "text", "sessions_attended" bigint, "total_sessions" bigint, "attendance_percentage" numeric, "active_idp_count" bigint, "most_trained_idp" "text", "most_trained_sessions" bigint, "mid_trained_idp" "text", "mid_trained_sessions" bigint, "least_trained_idp" "text", "least_trained_sessions" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_team_player_matrix"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_team_session_block_usage"("p_team_id" "uuid", "p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_limit" integer DEFAULT 10) RETURNS TABLE("block_id" "uuid", "block_title" "text", "usage_count" bigint, "active_idp_impact" bigint, "first_order_attributes" "jsonb", "second_order_attributes" "jsonb", "impacted_players" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_team_session_block_usage"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_team_training_summary"("p_team_id" "uuid", "p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE("team_id" "uuid", "sessions_completed" bigint, "total_training_minutes" bigint, "total_players" bigint, "active_idps" bigint, "unique_idp_attributes" bigint, "attributes_trained" bigint, "idp_coverage_rate" numeric, "avg_attendance_percentage" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_team_training_summary"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_team_training_trend"("p_team_id" "uuid", "p_weeks" integer DEFAULT 12) RETURNS TABLE("week_start" "date", "week_label" "text", "sessions_count" bigint, "total_opportunities" numeric, "avg_attendance" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_team_training_trend"("p_team_id" "uuid", "p_weeks" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_feedback_insights"("p_session_feedback_id" "uuid", "p_insights" "jsonb") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."insert_feedback_insights"("p_session_feedback_id" "uuid", "p_insights" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."redeem_invite"("invite_token" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    invite_record RECORD;
    coach_id_var UUID;
    coach_email_var TEXT;
    new_membership_id UUID;
    result JSON;
BEGIN
    -- Verify user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get the coach ID and email for the current user
    SELECT id, email INTO coach_id_var, coach_email_var
    FROM coaches
    WHERE auth_user_id = auth.uid();

    IF coach_id_var IS NULL THEN
        RAISE EXCEPTION 'Coach profile not found';
    END IF;

    -- Get and validate the invite
    SELECT i.*, c.name as club_name
    INTO invite_record
    FROM club_invites i
    JOIN clubs c ON c.id = i.club_id
    WHERE i.token = invite_token
    FOR UPDATE; -- Lock the row to prevent race conditions

    IF invite_record IS NULL THEN
        RAISE EXCEPTION 'Invalid invite token';
    END IF;

    IF invite_record.used_at IS NOT NULL THEN
        RAISE EXCEPTION 'Invite has already been used';
    END IF;

    -- Verify email matches (case insensitive)
    IF LOWER(invite_record.email) != LOWER(coach_email_var) THEN
        RAISE EXCEPTION 'Email does not match invite';
    END IF;

    -- Check if coach already has a club membership
    IF EXISTS (SELECT 1 FROM club_memberships WHERE coach_id = coach_id_var) THEN
        RAISE EXCEPTION 'You are already a member of a club';
    END IF;

    -- Create the membership with 'coach' role
    INSERT INTO club_memberships (club_id, coach_id, role)
    VALUES (invite_record.club_id, coach_id_var, 'coach')
    RETURNING id INTO new_membership_id;

    -- Mark invite as used
    UPDATE club_invites
    SET used_at = NOW()
    WHERE id = invite_record.id;

    -- Return the membership data
    SELECT json_build_object(
        'membership', json_build_object(
            'id', m.id,
            'club_id', m.club_id,
            'coach_id', m.coach_id,
            'role', m.role,
            'joined_at', m.joined_at
        ),
        'club', json_build_object(
            'id', c.id,
            'name', c.name,
            'logo_url', c.logo_url
        )
    ) INTO result
    FROM club_memberships m
    JOIN clubs c ON c.id = m.club_id
    WHERE m.id = new_membership_id;

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."redeem_invite"("invite_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_coach_from_club"("target_membership_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    caller_coach_id UUID;
    target_membership RECORD;
BEGIN
    -- Get current coach ID
    SELECT id INTO caller_coach_id
    FROM coaches
    WHERE auth_user_id = auth.uid();

    IF caller_coach_id IS NULL THEN
        RAISE EXCEPTION 'Coach profile not found';
    END IF;

    -- Get target membership details
    SELECT * INTO target_membership
    FROM club_memberships
    WHERE id = target_membership_id;

    IF target_membership IS NULL THEN
        RAISE EXCEPTION 'Membership not found';
    END IF;

    -- Cannot remove an admin
    IF target_membership.role = 'admin' THEN
        RAISE EXCEPTION 'Cannot remove an admin. Change their role first.';
    END IF;

    -- Verify caller is an admin of the same club
    IF NOT EXISTS (
        SELECT 1 FROM club_memberships
        WHERE club_id = target_membership.club_id
        AND coach_id = caller_coach_id
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can remove coaches';
    END IF;

    -- Delete the membership
    DELETE FROM club_memberships
    WHERE id = target_membership_id;

    RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."remove_coach_from_club"("target_membership_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revert_team_game_model"("p_team_id" "uuid", "p_club_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."revert_team_game_model"("p_team_id" "uuid", "p_club_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revert_team_playing_methodology"("p_team_id" "uuid", "p_club_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."revert_team_playing_methodology"("p_team_id" "uuid", "p_club_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revert_team_positional_profiles"("p_team_id" "uuid", "p_club_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."revert_team_positional_profiles"("p_team_id" "uuid", "p_club_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revert_team_training_syllabus"("p_team_id" "uuid", "p_club_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."revert_team_training_syllabus"("p_team_id" "uuid", "p_club_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_coach_role"("target_membership_id" "uuid", "new_role" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    caller_coach_id UUID;
    target_membership RECORD;
    admin_count INTEGER;
BEGIN
    -- Validate role
    IF new_role NOT IN ('admin', 'coach') THEN
        RAISE EXCEPTION 'Invalid role. Must be admin or coach';
    END IF;

    -- Get current coach ID
    SELECT id INTO caller_coach_id
    FROM coaches
    WHERE auth_user_id = auth.uid();

    IF caller_coach_id IS NULL THEN
        RAISE EXCEPTION 'Coach profile not found';
    END IF;

    -- Get target membership details
    SELECT * INTO target_membership
    FROM club_memberships
    WHERE id = target_membership_id;

    IF target_membership IS NULL THEN
        RAISE EXCEPTION 'Membership not found';
    END IF;

    -- Verify caller is an admin of the same club
    IF NOT EXISTS (
        SELECT 1 FROM club_memberships
        WHERE club_id = target_membership.club_id
        AND coach_id = caller_coach_id
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can change roles';
    END IF;

    -- If demoting from admin, ensure at least one admin remains
    IF target_membership.role = 'admin' AND new_role = 'coach' THEN
        SELECT COUNT(*) INTO admin_count
        FROM club_memberships
        WHERE club_id = target_membership.club_id
        AND role = 'admin';

        IF admin_count <= 1 THEN
            RAISE EXCEPTION 'Cannot remove the last admin. Promote another coach first.';
        END IF;
    END IF;

    -- Update the role
    UPDATE club_memberships
    SET role = new_role
    WHERE id = target_membership_id;

    RETURN json_build_object('success', true, 'role', new_role);
END;
$$;


ALTER FUNCTION "public"."update_coach_role"("target_membership_id" "uuid", "new_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_player_idps"("p_player_id" "uuid", "p_new_idps" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_new_attributes TEXT[];
BEGIN
  -- Extract attribute keys from the new IDPs array
  SELECT ARRAY_AGG(idp->>'attribute_key')
  INTO v_new_attributes
  FROM jsonb_array_elements(p_new_idps) as idp;

  -- For IDPs being removed: check if player attended any sessions during the IDP period
  -- If yes: mark as historical (set ended_at)
  -- If no: delete the record

  -- Delete IDPs with no session attendance during their period
  DELETE FROM player_idps pi
  WHERE pi.player_id = p_player_id
    AND pi.ended_at IS NULL
    AND pi.attribute_key != ALL(COALESCE(v_new_attributes, ARRAY[]::TEXT[]))
    AND NOT EXISTS (
      SELECT 1 FROM session_attendance sa
      JOIN sessions s ON s.id = sa.session_id
      WHERE sa.player_id = p_player_id
        AND sa.status = 'present'
        AND s.session_date >= pi.started_at
        AND s.session_date <= NOW()
    );

  -- End IDPs that have session attendance (make historical)
  UPDATE player_idps
  SET ended_at = NOW(), updated_at = NOW()
  WHERE player_id = p_player_id
    AND ended_at IS NULL
    AND attribute_key != ALL(COALESCE(v_new_attributes, ARRAY[]::TEXT[]));

  -- Insert new IDPs (only those not already active)
  INSERT INTO player_idps (player_id, attribute_key, priority, notes, started_at)
  SELECT
    p_player_id,
    (idp->>'attribute_key')::TEXT,
    COALESCE((idp->>'priority')::INTEGER, 1),
    (idp->>'notes')::TEXT,
    NOW()
  FROM jsonb_array_elements(p_new_idps) as idp
  WHERE NOT EXISTS (
    SELECT 1 FROM player_idps existing
    WHERE existing.player_id = p_player_id
      AND existing.attribute_key = (idp->>'attribute_key')::TEXT
      AND existing.ended_at IS NULL
  );

  -- Update priority/notes for existing active IDPs that remain
  UPDATE player_idps pi
  SET
    priority = COALESCE((new_idp.idp->>'priority')::INTEGER, pi.priority),
    notes = COALESCE(new_idp.idp->>'notes', pi.notes),
    updated_at = NOW()
  FROM (
    SELECT idp FROM jsonb_array_elements(p_new_idps) as idp
  ) new_idp
  WHERE pi.player_id = p_player_id
    AND pi.ended_at IS NULL
    AND pi.attribute_key = (new_idp.idp->>'attribute_key')::TEXT;
END;
$$;


ALTER FUNCTION "public"."update_player_idps"("p_player_id" "uuid", "p_new_idps" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."block_player_exclusions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "assignment_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."block_player_exclusions" OWNER TO "postgres";


COMMENT ON TABLE "public"."block_player_exclusions" IS 'Players excluded from specific training blocks. Excluded players do not get IDP outcomes for that block.';



COMMENT ON COLUMN "public"."block_player_exclusions"."assignment_id" IS 'References the specific block assignment in a session';



COMMENT ON COLUMN "public"."block_player_exclusions"."player_id" IS 'The player excluded from this block';



CREATE TABLE IF NOT EXISTS "public"."club_invites" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "club_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "token" "text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."club_invites" OWNER TO "postgres";


COMMENT ON TABLE "public"."club_invites" IS 'One-time invite links for coaches to join clubs.';



COMMENT ON COLUMN "public"."club_invites"."email" IS 'Email address the invite is tied to.';



COMMENT ON COLUMN "public"."club_invites"."token" IS 'Unique token for the invite URL.';



COMMENT ON COLUMN "public"."club_invites"."used_at" IS 'Timestamp when invite was used (NULL if unused).';



CREATE TABLE IF NOT EXISTS "public"."club_memberships" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "club_id" "uuid" NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'coach'::"text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "club_memberships_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'coach'::"text"])))
);


ALTER TABLE "public"."club_memberships" OWNER TO "postgres";


COMMENT ON TABLE "public"."club_memberships" IS 'Links coaches to clubs. Role can be admin or coach.';



COMMENT ON COLUMN "public"."club_memberships"."role" IS 'Role: admin (full permissions) or coach (limited permissions). Multiple admins allowed.';



CREATE TABLE IF NOT EXISTS "public"."clubs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "logo_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clubs" OWNER TO "postgres";


COMMENT ON TABLE "public"."clubs" IS 'Organizations that own all data. Coaches join clubs via invite links.';



CREATE TABLE IF NOT EXISTS "public"."coaches" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "auth_user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "profile_picture" "text",
    "position" "text",
    "onboarding_completed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."coaches" OWNER TO "postgres";


COMMENT ON TABLE "public"."coaches" IS 'Core user table for coaches, linked to Supabase Auth';



COMMENT ON COLUMN "public"."coaches"."profile_picture" IS 'URL to profile picture in Supabase Storage';



COMMENT ON COLUMN "public"."coaches"."position" IS 'Role title: Head Coach, Assistant Coach, Goalkeeping Coach, etc.';



COMMENT ON COLUMN "public"."coaches"."onboarding_completed" IS 'Whether coach has completed onboarding wizard';



CREATE TABLE IF NOT EXISTS "public"."feedback_insights" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_feedback_id" "uuid" NOT NULL,
    "player_id" "uuid",
    "attribute_key" "text",
    "sentiment" "text",
    "confidence" double precision,
    "extracted_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "feedback_insights_confidence_check" CHECK ((("confidence" >= (0)::double precision) AND ("confidence" <= (1)::double precision))),
    CONSTRAINT "feedback_insights_sentiment_check" CHECK (("sentiment" = ANY (ARRAY['positive'::"text", 'negative'::"text", 'neutral'::"text"])))
);


ALTER TABLE "public"."feedback_insights" OWNER TO "postgres";


COMMENT ON TABLE "public"."feedback_insights" IS 'LLM-extracted insights from session feedback';



COMMENT ON COLUMN "public"."feedback_insights"."player_id" IS 'NULL for team-level insights';



COMMENT ON COLUMN "public"."feedback_insights"."attribute_key" IS 'NULL if insight is not attribute-specific';



CREATE TABLE IF NOT EXISTS "public"."game_model" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "club_id" "uuid" NOT NULL,
    "team_id" "uuid",
    "created_by_coach_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "zones" "jsonb",
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."game_model" OWNER TO "postgres";


COMMENT ON TABLE "public"."game_model" IS 'Game model zones. Club-level (team_id NULL) or team-specific.';



COMMENT ON COLUMN "public"."game_model"."team_id" IS 'NULL for club-level game model, set for team-specific.';



COMMENT ON COLUMN "public"."game_model"."created_by_coach_id" IS 'Coach who created this game model. Used for edit permissions.';



COMMENT ON COLUMN "public"."game_model"."zones" IS 'JSON object with zone_count and zones array for in/out possession states.';



CREATE TABLE IF NOT EXISTS "public"."methodology_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "source" "text" NOT NULL,
    "template_type" "text" NOT NULL,
    "content" "jsonb" NOT NULL,
    "description" "text",
    "logo_url" "text",
    "is_premium" boolean DEFAULT false,
    "price_cents" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."methodology_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."methodology_templates" IS 'Pre-built methodology packages (QPR, Barcelona, etc.) for future marketplace.';



COMMENT ON COLUMN "public"."methodology_templates"."source" IS 'Origin: QPR, FC Barcelona, VIA, etc.';



COMMENT ON COLUMN "public"."methodology_templates"."template_type" IS 'Type: playing, training, positional, full_bundle';



COMMENT ON COLUMN "public"."methodology_templates"."price_cents" IS 'Price in cents for premium templates';



CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "club_id" "uuid" NOT NULL,
    "team_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "age" integer,
    "position" "text",
    "gender" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."players" OWNER TO "postgres";


COMMENT ON TABLE "public"."players" IS 'Players on teams. Can be moved between teams within same club.';



CREATE TABLE IF NOT EXISTS "public"."session_attendance" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'present'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."session_attendance" OWNER TO "postgres";


COMMENT ON TABLE "public"."session_attendance" IS 'Tracks which players attended each session.';



CREATE OR REPLACE VIEW "public"."player_attendance_summary" AS
 SELECT "sa"."player_id",
    "p"."team_id",
    "p"."club_id",
    "count"(*) FILTER (WHERE ("sa"."status" = 'present'::"text")) AS "sessions_attended",
    "count"(*) FILTER (WHERE ("sa"."status" = 'absent'::"text")) AS "sessions_missed",
    "count"(*) AS "total_sessions",
    "round"(((100.0 * ("count"(*) FILTER (WHERE ("sa"."status" = 'present'::"text")))::numeric) / (NULLIF("count"(*), 0))::numeric), 1) AS "attendance_percentage"
   FROM ("public"."session_attendance" "sa"
     JOIN "public"."players" "p" ON (("p"."id" = "sa"."player_id")))
  GROUP BY "sa"."player_id", "p"."team_id", "p"."club_id";


ALTER VIEW "public"."player_attendance_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_feedback_notes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_feedback_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "note" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."player_feedback_notes" OWNER TO "postgres";


COMMENT ON TABLE "public"."player_feedback_notes" IS 'Player-specific notes within session feedback';



CREATE TABLE IF NOT EXISTS "public"."player_idps" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "player_id" "uuid" NOT NULL,
    "attribute_key" "text" NOT NULL,
    "priority" integer DEFAULT 1,
    "notes" "text",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "player_idps_priority_check" CHECK ((("priority" >= 1) AND ("priority" <= 3)))
);


ALTER TABLE "public"."player_idps" OWNER TO "postgres";


COMMENT ON TABLE "public"."player_idps" IS 'Individual Development Plans per player with historical tracking';



COMMENT ON COLUMN "public"."player_idps"."attribute_key" IS 'The attribute being developed, references system_defaults';



COMMENT ON COLUMN "public"."player_idps"."priority" IS '1 = primary focus, 2 = secondary, 3 = tertiary';



COMMENT ON COLUMN "public"."player_idps"."ended_at" IS 'NULL means IDP is currently active';



CREATE TABLE IF NOT EXISTS "public"."player_training_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "player_id" "uuid" NOT NULL,
    "session_id" "uuid" NOT NULL,
    "attribute_key" "text" NOT NULL,
    "weight" double precision DEFAULT 1.0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."player_training_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."player_training_events" IS 'Records training opportunities per player per session per attribute';



COMMENT ON COLUMN "public"."player_training_events"."weight" IS 'Relevance score (0.0-1.0) from session block attributes';



CREATE OR REPLACE VIEW "public"."player_idp_progress" AS
 SELECT "pi"."id" AS "idp_id",
    "pi"."player_id",
    "pi"."attribute_key",
    "pi"."priority",
    "pi"."notes" AS "idp_notes",
    "pi"."started_at",
    "pi"."ended_at",
    "count"(DISTINCT "pte"."session_id") AS "training_sessions",
    COALESCE("sum"("pte"."weight"), (0)::double precision) AS "total_training_weight",
    "count"(DISTINCT "fi"."id") FILTER (WHERE ("fi"."sentiment" = 'positive'::"text")) AS "positive_mentions",
    "count"(DISTINCT "fi"."id") FILTER (WHERE ("fi"."sentiment" = 'negative'::"text")) AS "negative_mentions",
    "count"(DISTINCT "fi"."id") FILTER (WHERE ("fi"."sentiment" = 'neutral'::"text")) AS "neutral_mentions"
   FROM (("public"."player_idps" "pi"
     LEFT JOIN "public"."player_training_events" "pte" ON ((("pte"."player_id" = "pi"."player_id") AND ("pte"."attribute_key" = "pi"."attribute_key") AND ("pte"."created_at" >= "pi"."started_at") AND (("pi"."ended_at" IS NULL) OR ("pte"."created_at" <= "pi"."ended_at")))))
     LEFT JOIN "public"."feedback_insights" "fi" ON ((("fi"."player_id" = "pi"."player_id") AND ("fi"."attribute_key" = "pi"."attribute_key") AND ("fi"."created_at" >= "pi"."started_at") AND (("pi"."ended_at" IS NULL) OR ("fi"."created_at" <= "pi"."ended_at")))))
  GROUP BY "pi"."id", "pi"."player_id", "pi"."attribute_key", "pi"."priority", "pi"."notes", "pi"."started_at", "pi"."ended_at";


ALTER VIEW "public"."player_idp_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."position_suggestions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "club_id" "uuid" NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "suggested_name" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."position_suggestions" OWNER TO "postgres";


COMMENT ON TABLE "public"."position_suggestions" IS 'Coach suggestions for new positions to add to system.';



COMMENT ON COLUMN "public"."position_suggestions"."status" IS 'pending, approved, rejected';



CREATE TABLE IF NOT EXISTS "public"."positional_profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "club_id" "uuid" NOT NULL,
    "team_id" "uuid",
    "position_key" "text" NOT NULL,
    "custom_position_name" "text",
    "attributes" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."positional_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."positional_profiles" IS 'Position profiles with attributes. Club-level or team-specific copies.';



COMMENT ON COLUMN "public"."positional_profiles"."position_key" IS 'References system_defaults position key, or custom if custom_position_name set.';



COMMENT ON COLUMN "public"."positional_profiles"."custom_position_name" IS 'For custom positions not in system_defaults.';



COMMENT ON COLUMN "public"."positional_profiles"."attributes" IS 'Array of up to 5 attribute keys from system_defaults.';



CREATE TABLE IF NOT EXISTS "public"."session_block_assignments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "block_id" "uuid" NOT NULL,
    "position" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "slot_index" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "chk_slot_index" CHECK ((("slot_index" >= 0) AND ("slot_index" <= 1)))
);


ALTER TABLE "public"."session_block_assignments" OWNER TO "postgres";


COMMENT ON TABLE "public"."session_block_assignments" IS 'Links reusable blocks to sessions with position ordering.';



COMMENT ON COLUMN "public"."session_block_assignments"."position" IS 'Order of block within the session (0-indexed)';



COMMENT ON COLUMN "public"."session_block_assignments"."slot_index" IS 'Slot within a position group. 0=primary practice, 1=simultaneous practice. Blocks with same position form a group.';



CREATE TABLE IF NOT EXISTS "public"."session_block_attributes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "block_id" "uuid" NOT NULL,
    "attribute_key" "text" NOT NULL,
    "relevance" double precision DEFAULT 1.0,
    "source" "text" DEFAULT 'llm'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "order_type" "text" DEFAULT 'first'::"text",
    CONSTRAINT "session_block_attributes_order_type_check" CHECK (("order_type" = ANY (ARRAY['first'::"text", 'second'::"text"]))),
    CONSTRAINT "session_block_attributes_relevance_check" CHECK ((("relevance" >= (0)::double precision) AND ("relevance" <= (1)::double precision))),
    CONSTRAINT "session_block_attributes_source_check" CHECK (("source" = ANY (ARRAY['llm'::"text", 'coach'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."session_block_attributes" OWNER TO "postgres";


COMMENT ON TABLE "public"."session_block_attributes" IS 'Links session blocks to the attributes they train with relevance scores';



COMMENT ON COLUMN "public"."session_block_attributes"."attribute_key" IS 'References system_defaults key where category=attributes';



COMMENT ON COLUMN "public"."session_block_attributes"."relevance" IS 'How relevant this attribute is to the block (0.0-1.0)';



COMMENT ON COLUMN "public"."session_block_attributes"."source" IS 'Origin: llm (auto-suggested), coach (manual), system (default)';



COMMENT ON COLUMN "public"."session_block_attributes"."order_type" IS 'first = primary training focus, second = secondary/indirect training (e.g., GK in shooting drill)';



CREATE TABLE IF NOT EXISTS "public"."session_blocks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "coaching_points" "text",
    "image_url" "text",
    "diagram_data" "jsonb",
    "duration" integer,
    "creator_id" "uuid" NOT NULL,
    "club_id" "uuid",
    "is_public" boolean DEFAULT false,
    "source" "text" DEFAULT 'user'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ball_rolling" integer,
    CONSTRAINT "check_ball_rolling_percentage" CHECK ((("ball_rolling" IS NULL) OR (("ball_rolling" >= 0) AND ("ball_rolling" <= 100)))),
    CONSTRAINT "session_blocks_source_check" CHECK (("source" = ANY (ARRAY['user'::"text", 'system'::"text", 'marketplace'::"text"])))
);


ALTER TABLE "public"."session_blocks" OWNER TO "postgres";


COMMENT ON TABLE "public"."session_blocks" IS 'Reusable content blocks that can be shared across sessions and coaches.';



COMMENT ON COLUMN "public"."session_blocks"."title" IS 'Block title (required)';



COMMENT ON COLUMN "public"."session_blocks"."description" IS 'Block description/explanation (optional)';



COMMENT ON COLUMN "public"."session_blocks"."coaching_points" IS 'Key coaching points for this block (optional)';



COMMENT ON COLUMN "public"."session_blocks"."image_url" IS 'Optional image URL (stored in Supabase Storage)';



COMMENT ON COLUMN "public"."session_blocks"."diagram_data" IS 'Tactics board diagram data (JSON array of elements: players, cones, arrows, lines). Mutually exclusive with image_url.';



COMMENT ON COLUMN "public"."session_blocks"."duration" IS 'Duration of this block in minutes (optional)';



COMMENT ON COLUMN "public"."session_blocks"."creator_id" IS 'Coach who created this block';



COMMENT ON COLUMN "public"."session_blocks"."club_id" IS 'NULL for global/marketplace blocks, set for club-specific blocks';



COMMENT ON COLUMN "public"."session_blocks"."is_public" IS 'Whether other coaches can discover and use this block';



COMMENT ON COLUMN "public"."session_blocks"."source" IS 'Origin: user (coach created), system (default), marketplace (purchased)';



COMMENT ON COLUMN "public"."session_blocks"."ball_rolling" IS 'Percentage of block duration where ball is in play (0-100). Distinct from total duration which includes setup/rest.';



CREATE TABLE IF NOT EXISTS "public"."session_feedback" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "team_feedback" "text",
    "audio_url" "text",
    "transcript" "text",
    "overall_rating" integer,
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "session_feedback_overall_rating_check" CHECK ((("overall_rating" >= 1) AND ("overall_rating" <= 5)))
);


ALTER TABLE "public"."session_feedback" OWNER TO "postgres";


COMMENT ON TABLE "public"."session_feedback" IS 'Post-session feedback from coaches. One record per session.';



COMMENT ON COLUMN "public"."session_feedback"."team_feedback" IS 'General feedback about the session';



COMMENT ON COLUMN "public"."session_feedback"."processed_at" IS 'When LLM analysis was completed (NULL if not processed)';



CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "club_id" "uuid" NOT NULL,
    "team_id" "uuid" NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "session_date" timestamp with time zone NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "notes" "text",
    "player_count" integer NOT NULL,
    "duration" integer NOT NULL,
    "age_group" "text" NOT NULL,
    "skill_level" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "syllabus_week_index" integer,
    "syllabus_day_of_week" integer,
    "theme_block_id" "text",
    "theme_snapshot" "jsonb",
    CONSTRAINT "chk_syllabus_day_of_week" CHECK ((("syllabus_day_of_week" IS NULL) OR (("syllabus_day_of_week" >= 0) AND ("syllabus_day_of_week" <= 6))))
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


COMMENT ON TABLE "public"."sessions" IS 'Training sessions. Can be linked to training syllabus (syllabus_week_index NOT NULL) or created manually (syllabus_week_index NULL).';



COMMENT ON COLUMN "public"."sessions"."coach_id" IS 'Coach who created the session.';



COMMENT ON COLUMN "public"."sessions"."session_date" IS 'Session date and start time.';



COMMENT ON COLUMN "public"."sessions"."duration" IS 'Session duration in minutes.';



COMMENT ON COLUMN "public"."sessions"."syllabus_week_index" IS '0-indexed week number from the training syllabus. NULL if session was created manually.';



COMMENT ON COLUMN "public"."sessions"."syllabus_day_of_week" IS 'Day of week from syllabus (0=Mon, 6=Sun). NULL if session was created manually.';



COMMENT ON COLUMN "public"."sessions"."theme_block_id" IS 'Reference to ZoneBlock.id from Game Model. NULL if manual or no theme.';



COMMENT ON COLUMN "public"."sessions"."theme_snapshot" IS 'Denormalized theme data: {zoneName, blockType, blockName}. Preserved even if syllabus changes.';



CREATE TABLE IF NOT EXISTS "public"."system_defaults" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "category" "text" NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."system_defaults" OWNER TO "postgres";


COMMENT ON TABLE "public"."system_defaults" IS 'System-wide defaults for positions, attributes, equipment, etc.';



COMMENT ON COLUMN "public"."system_defaults"."category" IS 'Category: positions, attributes, equipment, space_options';



COMMENT ON COLUMN "public"."system_defaults"."key" IS 'Unique key within category: goalkeeper, tackling, full_size_goal';



COMMENT ON COLUMN "public"."system_defaults"."value" IS 'JSONB data structure varies by category';



CREATE TABLE IF NOT EXISTS "public"."team_coaches" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."team_coaches" OWNER TO "postgres";


COMMENT ON TABLE "public"."team_coaches" IS 'Assigns coaches to teams they can manage.';



CREATE TABLE IF NOT EXISTS "public"."team_facilities" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "space_type" "text",
    "custom_space" "text",
    "equipment" "jsonb" DEFAULT '[]'::"jsonb",
    "other_factors" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."team_facilities" OWNER TO "postgres";


COMMENT ON TABLE "public"."team_facilities" IS 'Facility configuration for each team.';



COMMENT ON COLUMN "public"."team_facilities"."space_type" IS 'full_pitch, half_pitch, quarter_pitch, indoor_hall, other';



COMMENT ON COLUMN "public"."team_facilities"."custom_space" IS 'Description if space_type is other.';



COMMENT ON COLUMN "public"."team_facilities"."equipment" IS 'Array of {type, quantity} objects.';



CREATE OR REPLACE VIEW "public"."team_idp_gaps" AS
 SELECT "p"."team_id",
    "pi"."attribute_key",
    "count"(DISTINCT "pi"."player_id") AS "players_with_idp",
    "avg"(COALESCE("progress"."training_sessions", (0)::bigint)) AS "avg_training_sessions",
    "array_agg"(DISTINCT "p"."id") AS "player_ids",
    "array_agg"(DISTINCT "p"."name") AS "player_names"
   FROM (("public"."player_idps" "pi"
     JOIN "public"."players" "p" ON (("p"."id" = "pi"."player_id")))
     LEFT JOIN "public"."player_idp_progress" "progress" ON (("progress"."idp_id" = "pi"."id")))
  WHERE ("pi"."ended_at" IS NULL)
  GROUP BY "p"."team_id", "pi"."attribute_key";


ALTER VIEW "public"."team_idp_gaps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "club_id" "uuid" NOT NULL,
    "created_by_coach_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "age_group" "text" NOT NULL,
    "skill_level" "text" NOT NULL,
    "gender" "text",
    "player_count" integer NOT NULL,
    "sessions_per_week" integer NOT NULL,
    "session_duration" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "teams_player_count_check" CHECK (("player_count" >= 0)),
    CONSTRAINT "teams_session_duration_check" CHECK (("session_duration" >= 0)),
    CONSTRAINT "teams_sessions_per_week_check" CHECK (("sessions_per_week" >= 0))
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


COMMENT ON TABLE "public"."teams" IS 'Teams within a club. Owned by club, created by a coach.';



COMMENT ON COLUMN "public"."teams"."created_by_coach_id" IS 'Coach who created the team. Used for permission checks.';



COMMENT ON COLUMN "public"."teams"."session_duration" IS 'Default session duration in minutes';



CREATE OR REPLACE VIEW "public"."team_training_summary" AS
 SELECT "t"."id" AS "team_id",
    "t"."club_id",
    "count"(DISTINCT "sf"."session_id") AS "sessions_completed",
    COALESCE("sum"("s"."duration"), (0)::bigint) AS "total_training_minutes",
    "count"(DISTINCT "p"."id") AS "total_players",
    "count"(DISTINCT "pte"."player_id") AS "players_with_training",
    "count"(DISTINCT "pi"."id") FILTER (WHERE ("pi"."ended_at" IS NULL)) AS "active_idps",
    "count"(DISTINCT "pi"."attribute_key") FILTER (WHERE ("pi"."ended_at" IS NULL)) AS "unique_idp_attributes",
    "count"(DISTINCT "pte"."attribute_key") AS "attributes_trained",
    COALESCE("sum"("pte"."weight"), (0)::double precision) AS "total_training_opportunities"
   FROM ((((("public"."teams" "t"
     LEFT JOIN "public"."players" "p" ON (("p"."team_id" = "t"."id")))
     LEFT JOIN "public"."sessions" "s" ON (("s"."team_id" = "t"."id")))
     LEFT JOIN "public"."session_feedback" "sf" ON (("sf"."session_id" = "s"."id")))
     LEFT JOIN "public"."player_training_events" "pte" ON (("pte"."session_id" = "s"."id")))
     LEFT JOIN "public"."player_idps" "pi" ON (("pi"."player_id" = "p"."id")))
  GROUP BY "t"."id", "t"."club_id";


ALTER VIEW "public"."team_training_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."training_methodology" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "club_id" "uuid" NOT NULL,
    "team_id" "uuid",
    "created_by_coach_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "syllabus" "jsonb"
);


ALTER TABLE "public"."training_methodology" OWNER TO "postgres";


COMMENT ON TABLE "public"."training_methodology" IS 'Training syllabus. Club-level (team_id NULL) or team-specific. Uses syllabus JSONB column for weekly calendar data.';



COMMENT ON COLUMN "public"."training_methodology"."team_id" IS 'NULL for club-level rules, set for team-specific rules.';



COMMENT ON COLUMN "public"."training_methodology"."created_by_coach_id" IS 'Coach who created this rule. Used for edit permissions.';



COMMENT ON COLUMN "public"."training_methodology"."syllabus" IS 'JSONB containing weekly training calendar with themes from Game Model zones.';



ALTER TABLE ONLY "public"."block_player_exclusions"
    ADD CONSTRAINT "block_player_exclusions_assignment_id_player_id_key" UNIQUE ("assignment_id", "player_id");



ALTER TABLE ONLY "public"."block_player_exclusions"
    ADD CONSTRAINT "block_player_exclusions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."club_invites"
    ADD CONSTRAINT "club_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."club_invites"
    ADD CONSTRAINT "club_invites_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."club_memberships"
    ADD CONSTRAINT "club_memberships_club_id_coach_id_key" UNIQUE ("club_id", "coach_id");



ALTER TABLE ONLY "public"."club_memberships"
    ADD CONSTRAINT "club_memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clubs"
    ADD CONSTRAINT "clubs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coaches"
    ADD CONSTRAINT "coaches_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."coaches"
    ADD CONSTRAINT "coaches_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."coaches"
    ADD CONSTRAINT "coaches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback_insights"
    ADD CONSTRAINT "feedback_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."methodology_templates"
    ADD CONSTRAINT "methodology_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_feedback_notes"
    ADD CONSTRAINT "player_feedback_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_feedback_notes"
    ADD CONSTRAINT "player_feedback_notes_session_feedback_id_player_id_key" UNIQUE ("session_feedback_id", "player_id");



ALTER TABLE ONLY "public"."player_idps"
    ADD CONSTRAINT "player_idps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_training_events"
    ADD CONSTRAINT "player_training_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_training_events"
    ADD CONSTRAINT "player_training_events_player_id_session_id_attribute_key_key" UNIQUE ("player_id", "session_id", "attribute_key");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."game_model"
    ADD CONSTRAINT "playing_methodology_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."position_suggestions"
    ADD CONSTRAINT "position_suggestions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."positional_profiles"
    ADD CONSTRAINT "positional_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_attendance"
    ADD CONSTRAINT "session_attendance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_attendance"
    ADD CONSTRAINT "session_attendance_session_id_player_id_key" UNIQUE ("session_id", "player_id");



ALTER TABLE ONLY "public"."session_block_assignments"
    ADD CONSTRAINT "session_block_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_block_assignments"
    ADD CONSTRAINT "session_block_assignments_session_id_block_id_key" UNIQUE ("session_id", "block_id");



ALTER TABLE ONLY "public"."session_block_assignments"
    ADD CONSTRAINT "session_block_assignments_unique_position_slot" UNIQUE ("session_id", "position", "slot_index");



ALTER TABLE ONLY "public"."session_block_attributes"
    ADD CONSTRAINT "session_block_attributes_block_id_attribute_key_key" UNIQUE ("block_id", "attribute_key");



ALTER TABLE ONLY "public"."session_block_attributes"
    ADD CONSTRAINT "session_block_attributes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_blocks"
    ADD CONSTRAINT "session_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_feedback"
    ADD CONSTRAINT "session_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_feedback"
    ADD CONSTRAINT "session_feedback_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_defaults"
    ADD CONSTRAINT "system_defaults_category_key_key" UNIQUE ("category", "key");



ALTER TABLE ONLY "public"."system_defaults"
    ADD CONSTRAINT "system_defaults_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_coaches"
    ADD CONSTRAINT "team_coaches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_coaches"
    ADD CONSTRAINT "team_coaches_team_id_coach_id_key" UNIQUE ("team_id", "coach_id");



ALTER TABLE ONLY "public"."team_facilities"
    ADD CONSTRAINT "team_facilities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_facilities"
    ADD CONSTRAINT "team_facilities_team_id_key" UNIQUE ("team_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_methodology"
    ADD CONSTRAINT "training_methodology_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_block_player_exclusions_assignment" ON "public"."block_player_exclusions" USING "btree" ("assignment_id");



CREATE INDEX "idx_block_player_exclusions_player" ON "public"."block_player_exclusions" USING "btree" ("player_id");



CREATE INDEX "idx_club_invites_club_id" ON "public"."club_invites" USING "btree" ("club_id");



CREATE INDEX "idx_club_invites_email" ON "public"."club_invites" USING "btree" ("email");



CREATE INDEX "idx_club_invites_token" ON "public"."club_invites" USING "btree" ("token");



CREATE INDEX "idx_club_invites_unused" ON "public"."club_invites" USING "btree" ("club_id") WHERE ("used_at" IS NULL);



CREATE INDEX "idx_club_memberships_admin" ON "public"."club_memberships" USING "btree" ("club_id") WHERE ("role" = 'admin'::"text");



CREATE INDEX "idx_club_memberships_club_id" ON "public"."club_memberships" USING "btree" ("club_id");



CREATE INDEX "idx_club_memberships_coach_id" ON "public"."club_memberships" USING "btree" ("coach_id");



CREATE INDEX "idx_club_memberships_role" ON "public"."club_memberships" USING "btree" ("club_id", "role");



CREATE INDEX "idx_coaches_auth_user_id" ON "public"."coaches" USING "btree" ("auth_user_id");



CREATE INDEX "idx_coaches_email" ON "public"."coaches" USING "btree" ("email");



CREATE INDEX "idx_fi_attribute" ON "public"."feedback_insights" USING "btree" ("attribute_key") WHERE ("attribute_key" IS NOT NULL);



CREATE INDEX "idx_fi_feedback" ON "public"."feedback_insights" USING "btree" ("session_feedback_id");



CREATE INDEX "idx_fi_player" ON "public"."feedback_insights" USING "btree" ("player_id") WHERE ("player_id" IS NOT NULL);



CREATE INDEX "idx_fi_player_attribute" ON "public"."feedback_insights" USING "btree" ("player_id", "attribute_key") WHERE ("player_id" IS NOT NULL);



CREATE INDEX "idx_game_model_club_id" ON "public"."game_model" USING "btree" ("club_id");



CREATE INDEX "idx_game_model_club_level" ON "public"."game_model" USING "btree" ("club_id") WHERE ("team_id" IS NULL);



CREATE INDEX "idx_game_model_team_id" ON "public"."game_model" USING "btree" ("team_id");



CREATE INDEX "idx_game_model_zones" ON "public"."game_model" USING "btree" ("club_id") WHERE ("zones" IS NOT NULL);



CREATE INDEX "idx_methodology_templates_active" ON "public"."methodology_templates" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_methodology_templates_type" ON "public"."methodology_templates" USING "btree" ("template_type");



CREATE INDEX "idx_pfn_feedback" ON "public"."player_feedback_notes" USING "btree" ("session_feedback_id");



CREATE INDEX "idx_pfn_player" ON "public"."player_feedback_notes" USING "btree" ("player_id");



CREATE INDEX "idx_player_idps_active" ON "public"."player_idps" USING "btree" ("player_id") WHERE ("ended_at" IS NULL);



CREATE INDEX "idx_player_idps_attribute" ON "public"."player_idps" USING "btree" ("attribute_key");



CREATE INDEX "idx_player_idps_dates" ON "public"."player_idps" USING "btree" ("player_id", "started_at", "ended_at");



CREATE INDEX "idx_player_idps_player" ON "public"."player_idps" USING "btree" ("player_id");



CREATE INDEX "idx_players_club_id" ON "public"."players" USING "btree" ("club_id");



CREATE INDEX "idx_players_name" ON "public"."players" USING "btree" ("name");



CREATE INDEX "idx_players_team_id" ON "public"."players" USING "btree" ("team_id");



CREATE INDEX "idx_position_suggestions_club_id" ON "public"."position_suggestions" USING "btree" ("club_id");



CREATE INDEX "idx_position_suggestions_status" ON "public"."position_suggestions" USING "btree" ("status");



CREATE INDEX "idx_positional_profiles_club_id" ON "public"."positional_profiles" USING "btree" ("club_id");



CREATE INDEX "idx_positional_profiles_club_level" ON "public"."positional_profiles" USING "btree" ("club_id") WHERE ("team_id" IS NULL);



CREATE INDEX "idx_positional_profiles_team_id" ON "public"."positional_profiles" USING "btree" ("team_id");



CREATE UNIQUE INDEX "idx_positional_profiles_unique_position" ON "public"."positional_profiles" USING "btree" ("club_id", "position_key") WHERE ("team_id" IS NULL);



CREATE UNIQUE INDEX "idx_positional_profiles_unique_position_team" ON "public"."positional_profiles" USING "btree" ("club_id", "team_id", "position_key") WHERE ("team_id" IS NOT NULL);



CREATE INDEX "idx_pte_player_attribute" ON "public"."player_training_events" USING "btree" ("player_id", "attribute_key");



CREATE INDEX "idx_pte_player_date" ON "public"."player_training_events" USING "btree" ("player_id", "created_at");



CREATE INDEX "idx_pte_session" ON "public"."player_training_events" USING "btree" ("session_id");



CREATE INDEX "idx_sba_attribute" ON "public"."session_block_attributes" USING "btree" ("attribute_key");



CREATE INDEX "idx_sba_block" ON "public"."session_block_assignments" USING "btree" ("block_id");



CREATE INDEX "idx_sba_block_id" ON "public"."session_block_attributes" USING "btree" ("block_id");



CREATE INDEX "idx_sba_position" ON "public"."session_block_assignments" USING "btree" ("session_id", "position");



CREATE INDEX "idx_sba_session" ON "public"."session_block_assignments" USING "btree" ("session_id");



CREATE INDEX "idx_session_attendance_player_id" ON "public"."session_attendance" USING "btree" ("player_id");



CREATE INDEX "idx_session_attendance_session_id" ON "public"."session_attendance" USING "btree" ("session_id");



CREATE INDEX "idx_session_block_assignments_position_slot" ON "public"."session_block_assignments" USING "btree" ("session_id", "position", "slot_index");



CREATE INDEX "idx_session_block_attributes_order_type" ON "public"."session_block_attributes" USING "btree" ("block_id", "order_type");



CREATE INDEX "idx_session_blocks_club" ON "public"."session_blocks" USING "btree" ("club_id");



CREATE INDEX "idx_session_blocks_creator" ON "public"."session_blocks" USING "btree" ("creator_id");



CREATE INDEX "idx_session_blocks_public" ON "public"."session_blocks" USING "btree" ("is_public") WHERE ("is_public" = true);



CREATE INDEX "idx_session_blocks_source" ON "public"."session_blocks" USING "btree" ("source");



CREATE INDEX "idx_session_feedback_coach" ON "public"."session_feedback" USING "btree" ("coach_id");



CREATE INDEX "idx_session_feedback_session" ON "public"."session_feedback" USING "btree" ("session_id");



CREATE INDEX "idx_session_feedback_unprocessed" ON "public"."session_feedback" USING "btree" ("id") WHERE ("processed_at" IS NULL);



CREATE INDEX "idx_sessions_club_id" ON "public"."sessions" USING "btree" ("club_id");



CREATE INDEX "idx_sessions_coach_id" ON "public"."sessions" USING "btree" ("coach_id");



CREATE INDEX "idx_sessions_date" ON "public"."sessions" USING "btree" ("session_date");



CREATE INDEX "idx_sessions_syllabus_latest" ON "public"."sessions" USING "btree" ("team_id", "session_date" DESC) WHERE ("syllabus_week_index" IS NOT NULL);



CREATE INDEX "idx_sessions_team_id" ON "public"."sessions" USING "btree" ("team_id");



CREATE INDEX "idx_system_defaults_active" ON "public"."system_defaults" USING "btree" ("category", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_system_defaults_category" ON "public"."system_defaults" USING "btree" ("category");



CREATE INDEX "idx_team_coaches_coach_id" ON "public"."team_coaches" USING "btree" ("coach_id");



CREATE INDEX "idx_team_coaches_team_id" ON "public"."team_coaches" USING "btree" ("team_id");



CREATE INDEX "idx_team_facilities_team_id" ON "public"."team_facilities" USING "btree" ("team_id");



CREATE INDEX "idx_teams_club_id" ON "public"."teams" USING "btree" ("club_id");



CREATE INDEX "idx_teams_created_by" ON "public"."teams" USING "btree" ("created_by_coach_id");



CREATE INDEX "idx_training_methodology_club_id" ON "public"."training_methodology" USING "btree" ("club_id");



CREATE INDEX "idx_training_methodology_club_level" ON "public"."training_methodology" USING "btree" ("club_id") WHERE ("team_id" IS NULL);



CREATE INDEX "idx_training_methodology_team_id" ON "public"."training_methodology" USING "btree" ("team_id");



CREATE OR REPLACE TRIGGER "update_clubs_updated_at" BEFORE UPDATE ON "public"."clubs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_coaches_updated_at" BEFORE UPDATE ON "public"."coaches" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_game_model_updated_at" BEFORE UPDATE ON "public"."game_model" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_methodology_templates_updated_at" BEFORE UPDATE ON "public"."methodology_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_player_idps_updated_at" BEFORE UPDATE ON "public"."player_idps" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_players_updated_at" BEFORE UPDATE ON "public"."players" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_positional_profiles_updated_at" BEFORE UPDATE ON "public"."positional_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_session_attendance_updated_at" BEFORE UPDATE ON "public"."session_attendance" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_session_block_attributes_updated_at" BEFORE UPDATE ON "public"."session_block_attributes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_session_blocks_updated_at" BEFORE UPDATE ON "public"."session_blocks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_session_feedback_updated_at" BEFORE UPDATE ON "public"."session_feedback" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_sessions_updated_at" BEFORE UPDATE ON "public"."sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_system_defaults_updated_at" BEFORE UPDATE ON "public"."system_defaults" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_team_facilities_updated_at" BEFORE UPDATE ON "public"."team_facilities" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_teams_updated_at" BEFORE UPDATE ON "public"."teams" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_training_methodology_updated_at" BEFORE UPDATE ON "public"."training_methodology" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."block_player_exclusions"
    ADD CONSTRAINT "block_player_exclusions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."session_block_assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."block_player_exclusions"
    ADD CONSTRAINT "block_player_exclusions_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."club_invites"
    ADD CONSTRAINT "club_invites_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."club_invites"
    ADD CONSTRAINT "club_invites_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."coaches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."club_memberships"
    ADD CONSTRAINT "club_memberships_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."club_memberships"
    ADD CONSTRAINT "club_memberships_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coaches"
    ADD CONSTRAINT "coaches_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback_insights"
    ADD CONSTRAINT "feedback_insights_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback_insights"
    ADD CONSTRAINT "feedback_insights_session_feedback_id_fkey" FOREIGN KEY ("session_feedback_id") REFERENCES "public"."session_feedback"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_feedback_notes"
    ADD CONSTRAINT "player_feedback_notes_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_feedback_notes"
    ADD CONSTRAINT "player_feedback_notes_session_feedback_id_fkey" FOREIGN KEY ("session_feedback_id") REFERENCES "public"."session_feedback"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_idps"
    ADD CONSTRAINT "player_idps_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_training_events"
    ADD CONSTRAINT "player_training_events_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_training_events"
    ADD CONSTRAINT "player_training_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_model"
    ADD CONSTRAINT "playing_methodology_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_model"
    ADD CONSTRAINT "playing_methodology_created_by_coach_id_fkey" FOREIGN KEY ("created_by_coach_id") REFERENCES "public"."coaches"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."game_model"
    ADD CONSTRAINT "playing_methodology_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."position_suggestions"
    ADD CONSTRAINT "position_suggestions_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."position_suggestions"
    ADD CONSTRAINT "position_suggestions_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."positional_profiles"
    ADD CONSTRAINT "positional_profiles_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."positional_profiles"
    ADD CONSTRAINT "positional_profiles_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_attendance"
    ADD CONSTRAINT "session_attendance_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_attendance"
    ADD CONSTRAINT "session_attendance_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_block_assignments"
    ADD CONSTRAINT "session_block_assignments_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "public"."session_blocks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_block_assignments"
    ADD CONSTRAINT "session_block_assignments_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_block_attributes"
    ADD CONSTRAINT "session_block_attributes_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "public"."session_blocks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_blocks"
    ADD CONSTRAINT "session_blocks_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."session_blocks"
    ADD CONSTRAINT "session_blocks_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."coaches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_feedback"
    ADD CONSTRAINT "session_feedback_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id");



ALTER TABLE ONLY "public"."session_feedback"
    ADD CONSTRAINT "session_feedback_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_coaches"
    ADD CONSTRAINT "team_coaches_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_coaches"
    ADD CONSTRAINT "team_coaches_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_facilities"
    ADD CONSTRAINT "team_facilities_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_created_by_coach_id_fkey" FOREIGN KEY ("created_by_coach_id") REFERENCES "public"."coaches"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."training_methodology"
    ADD CONSTRAINT "training_methodology_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_methodology"
    ADD CONSTRAINT "training_methodology_created_by_coach_id_fkey" FOREIGN KEY ("created_by_coach_id") REFERENCES "public"."coaches"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."training_methodology"
    ADD CONSTRAINT "training_methodology_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE "public"."block_player_exclusions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bpe_delete" ON "public"."block_player_exclusions" FOR DELETE USING (("assignment_id" IN ( SELECT "sba"."id"
   FROM (("public"."session_block_assignments" "sba"
     JOIN "public"."sessions" "s" ON (("s"."id" = "sba"."session_id")))
     JOIN "public"."club_memberships" "cm" ON (("cm"."club_id" = "s"."club_id")))
  WHERE ("cm"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "bpe_insert" ON "public"."block_player_exclusions" FOR INSERT WITH CHECK (("assignment_id" IN ( SELECT "sba"."id"
   FROM (("public"."session_block_assignments" "sba"
     JOIN "public"."sessions" "s" ON (("s"."id" = "sba"."session_id")))
     JOIN "public"."club_memberships" "cm" ON (("cm"."club_id" = "s"."club_id")))
  WHERE ("cm"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "bpe_select" ON "public"."block_player_exclusions" FOR SELECT USING (("assignment_id" IN ( SELECT "sba"."id"
   FROM (("public"."session_block_assignments" "sba"
     JOIN "public"."sessions" "s" ON (("s"."id" = "sba"."session_id")))
     JOIN "public"."club_memberships" "cm" ON (("cm"."club_id" = "s"."club_id")))
  WHERE ("cm"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."club_invites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "club_invites_delete" ON "public"."club_invites" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "club_invites"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))));



CREATE POLICY "club_invites_insert" ON "public"."club_invites" FOR INSERT WITH CHECK ((("created_by" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND (EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "club_invites"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text"))))));



CREATE POLICY "club_invites_select" ON "public"."club_invites" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "club_invites"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))));



CREATE POLICY "club_invites_update" ON "public"."club_invites" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "club_invites"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))));



ALTER TABLE "public"."club_memberships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "club_memberships_delete" ON "public"."club_memberships" FOR DELETE USING ((("coach_id" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."club_memberships" "club_memberships_1"
  WHERE (("club_memberships_1"."club_id" = "club_memberships_1"."club_id") AND ("club_memberships_1"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships_1"."role" = 'admin'::"text"))))));



CREATE POLICY "club_memberships_insert" ON "public"."club_memberships" FOR INSERT WITH CHECK (("coach_id" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "club_memberships_select_own" ON "public"."club_memberships" FOR SELECT USING (("coach_id" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "club_memberships_update" ON "public"."club_memberships" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."club_memberships" "club_memberships_1"
  WHERE (("club_memberships_1"."club_id" = "club_memberships_1"."club_id") AND ("club_memberships_1"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships_1"."role" = 'admin'::"text")))));



ALTER TABLE "public"."clubs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clubs_delete_admin" ON "public"."clubs" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "clubs"."id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))));



CREATE POLICY "clubs_insert" ON "public"."clubs" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "clubs_select_member" ON "public"."clubs" FOR SELECT USING (("id" IN ( SELECT "club_memberships"."club_id"
   FROM "public"."club_memberships"
  WHERE ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "clubs_update_admin" ON "public"."clubs" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "clubs"."id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))));



ALTER TABLE "public"."coaches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "coaches_delete_own" ON "public"."coaches" FOR DELETE USING (("auth"."uid"() = "auth_user_id"));



CREATE POLICY "coaches_insert_own" ON "public"."coaches" FOR INSERT WITH CHECK (("auth"."uid"() = "auth_user_id"));



CREATE POLICY "coaches_select_own" ON "public"."coaches" FOR SELECT USING (("auth"."uid"() = "auth_user_id"));



CREATE POLICY "coaches_update_own" ON "public"."coaches" FOR UPDATE USING (("auth"."uid"() = "auth_user_id"));



ALTER TABLE "public"."feedback_insights" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fi_select" ON "public"."feedback_insights" FOR SELECT USING (("session_feedback_id" IN ( SELECT "sf"."id"
   FROM (("public"."session_feedback" "sf"
     JOIN "public"."sessions" "s" ON (("s"."id" = "sf"."session_id")))
     JOIN "public"."club_memberships" "cm" ON (("cm"."club_id" = "s"."club_id")))
  WHERE ("cm"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."game_model" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "game_model_delete" ON "public"."game_model" FOR DELETE USING (((("team_id" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "game_model"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text"))))) OR (("team_id" IS NOT NULL) AND (("created_by_coach_id" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "game_model"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text"))))))));



CREATE POLICY "game_model_insert" ON "public"."game_model" FOR INSERT WITH CHECK ((("created_by_coach_id" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ((("team_id" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "game_model"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text"))))) OR (("team_id" IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "game_model"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
   FROM "public"."team_coaches"
  WHERE (("team_coaches"."team_id" = "game_model"."team_id") AND ("team_coaches"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"())))))))))));



CREATE POLICY "game_model_select" ON "public"."game_model" FOR SELECT USING (("club_id" IN ( SELECT "club_memberships"."club_id"
   FROM "public"."club_memberships"
  WHERE ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "game_model_update" ON "public"."game_model" FOR UPDATE USING (((("team_id" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "game_model"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text"))))) OR (("team_id" IS NOT NULL) AND (("created_by_coach_id" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "game_model"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text"))))))));



ALTER TABLE "public"."methodology_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "methodology_templates_select" ON "public"."methodology_templates" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND ("is_active" = true)));



CREATE POLICY "pfn_delete" ON "public"."player_feedback_notes" FOR DELETE USING (("session_feedback_id" IN ( SELECT "sf"."id"
   FROM "public"."session_feedback" "sf"
  WHERE ("sf"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "pfn_insert" ON "public"."player_feedback_notes" FOR INSERT WITH CHECK (("session_feedback_id" IN ( SELECT "sf"."id"
   FROM "public"."session_feedback" "sf"
  WHERE ("sf"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "pfn_select" ON "public"."player_feedback_notes" FOR SELECT USING (("session_feedback_id" IN ( SELECT "sf"."id"
   FROM (("public"."session_feedback" "sf"
     JOIN "public"."sessions" "s" ON (("s"."id" = "sf"."session_id")))
     JOIN "public"."club_memberships" "cm" ON (("cm"."club_id" = "s"."club_id")))
  WHERE ("cm"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "pfn_update" ON "public"."player_feedback_notes" FOR UPDATE USING (("session_feedback_id" IN ( SELECT "sf"."id"
   FROM "public"."session_feedback" "sf"
  WHERE ("sf"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."player_feedback_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_idps" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_idps_delete" ON "public"."player_idps" FOR DELETE USING (("player_id" IN ( SELECT "p"."id"
   FROM ("public"."players" "p"
     JOIN "public"."club_memberships" "cm" ON (("cm"."club_id" = "p"."club_id")))
  WHERE (("cm"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("cm"."role" = 'admin'::"text")))));



CREATE POLICY "player_idps_insert" ON "public"."player_idps" FOR INSERT WITH CHECK (("player_id" IN ( SELECT "p"."id"
   FROM ("public"."players" "p"
     JOIN "public"."club_memberships" "cm" ON (("cm"."club_id" = "p"."club_id")))
  WHERE ("cm"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "player_idps_select" ON "public"."player_idps" FOR SELECT USING (("player_id" IN ( SELECT "p"."id"
   FROM ("public"."players" "p"
     JOIN "public"."club_memberships" "cm" ON (("cm"."club_id" = "p"."club_id")))
  WHERE ("cm"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "player_idps_update" ON "public"."player_idps" FOR UPDATE USING (("player_id" IN ( SELECT "p"."id"
   FROM ("public"."players" "p"
     JOIN "public"."club_memberships" "cm" ON (("cm"."club_id" = "p"."club_id")))
  WHERE ("cm"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."player_training_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "players_delete" ON "public"."players" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "players"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))));



CREATE POLICY "players_insert" ON "public"."players" FOR INSERT WITH CHECK ((("club_id" = ( SELECT "teams"."club_id"
   FROM "public"."teams"
  WHERE ("teams"."id" = "players"."team_id"))) AND ((EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "players"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
   FROM "public"."team_coaches"
  WHERE (("team_coaches"."team_id" = "players"."team_id") AND ("team_coaches"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"())))))))));



CREATE POLICY "players_select" ON "public"."players" FOR SELECT USING (("club_id" IN ( SELECT "club_memberships"."club_id"
   FROM "public"."club_memberships"
  WHERE ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "players_update" ON "public"."players" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "players"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
   FROM "public"."team_coaches"
  WHERE (("team_coaches"."team_id" = "players"."team_id") AND ("team_coaches"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))))));



ALTER TABLE "public"."position_suggestions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "position_suggestions_delete" ON "public"."position_suggestions" FOR DELETE USING ((("coach_id" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "position_suggestions"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text"))))));



CREATE POLICY "position_suggestions_insert" ON "public"."position_suggestions" FOR INSERT WITH CHECK ((("coach_id" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_id" IN ( SELECT "club_memberships"."club_id"
   FROM "public"."club_memberships"
  WHERE ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"())))))));



CREATE POLICY "position_suggestions_select" ON "public"."position_suggestions" FOR SELECT USING (("club_id" IN ( SELECT "club_memberships"."club_id"
   FROM "public"."club_memberships"
  WHERE ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "position_suggestions_update" ON "public"."position_suggestions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "position_suggestions"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))));



ALTER TABLE "public"."positional_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "positional_profiles_delete" ON "public"."positional_profiles" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "positional_profiles"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))));



CREATE POLICY "positional_profiles_insert" ON "public"."positional_profiles" FOR INSERT WITH CHECK (((("team_id" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "positional_profiles"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text"))))) OR (("team_id" IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "positional_profiles"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
   FROM "public"."team_coaches"
  WHERE (("team_coaches"."team_id" = "positional_profiles"."team_id") AND ("team_coaches"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))))))));



CREATE POLICY "positional_profiles_select" ON "public"."positional_profiles" FOR SELECT USING (("club_id" IN ( SELECT "club_memberships"."club_id"
   FROM "public"."club_memberships"
  WHERE ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "positional_profiles_update" ON "public"."positional_profiles" FOR UPDATE USING (((("team_id" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "positional_profiles"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text"))))) OR (("team_id" IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "positional_profiles"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
   FROM "public"."team_coaches"
  WHERE (("team_coaches"."team_id" = "positional_profiles"."team_id") AND ("team_coaches"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))))))));



CREATE POLICY "pte_select" ON "public"."player_training_events" FOR SELECT USING (("player_id" IN ( SELECT "p"."id"
   FROM ("public"."players" "p"
     JOIN "public"."club_memberships" "cm" ON (("cm"."club_id" = "p"."club_id")))
  WHERE ("cm"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "sba_delete" ON "public"."session_block_attributes" FOR DELETE USING (("block_id" IN ( SELECT "session_blocks"."id"
   FROM "public"."session_blocks"
  WHERE ("session_blocks"."creator_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "sba_insert" ON "public"."session_block_attributes" FOR INSERT WITH CHECK (("block_id" IN ( SELECT "session_blocks"."id"
   FROM "public"."session_blocks"
  WHERE ("session_blocks"."creator_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "sba_select" ON "public"."session_block_attributes" FOR SELECT USING (("block_id" IN ( SELECT "session_blocks"."id"
   FROM "public"."session_blocks"
  WHERE (("session_blocks"."is_public" = true) OR ("session_blocks"."creator_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) OR ("session_blocks"."club_id" IN ( SELECT "club_memberships"."club_id"
           FROM "public"."club_memberships"
          WHERE ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
                   FROM "public"."coaches"
                  WHERE ("coaches"."auth_user_id" = "auth"."uid"())))))))));



CREATE POLICY "sba_update" ON "public"."session_block_attributes" FOR UPDATE USING (("block_id" IN ( SELECT "session_blocks"."id"
   FROM "public"."session_blocks"
  WHERE ("session_blocks"."creator_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."session_attendance" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "session_attendance_delete" ON "public"."session_attendance" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."sessions" "s"
  WHERE (("s"."id" = "session_attendance"."session_id") AND ((EXISTS ( SELECT 1
           FROM "public"."club_memberships"
          WHERE (("club_memberships"."club_id" = "s"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
                   FROM "public"."coaches"
                  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
           FROM "public"."team_coaches"
          WHERE (("team_coaches"."team_id" = "s"."team_id") AND ("team_coaches"."coach_id" = ( SELECT "coaches"."id"
                   FROM "public"."coaches"
                  WHERE ("coaches"."auth_user_id" = "auth"."uid"())))))))))));



CREATE POLICY "session_attendance_insert" ON "public"."session_attendance" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."sessions" "s"
  WHERE (("s"."id" = "session_attendance"."session_id") AND ((EXISTS ( SELECT 1
           FROM "public"."club_memberships"
          WHERE (("club_memberships"."club_id" = "s"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
                   FROM "public"."coaches"
                  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
           FROM "public"."team_coaches"
          WHERE (("team_coaches"."team_id" = "s"."team_id") AND ("team_coaches"."coach_id" = ( SELECT "coaches"."id"
                   FROM "public"."coaches"
                  WHERE ("coaches"."auth_user_id" = "auth"."uid"())))))))))));



CREATE POLICY "session_attendance_select" ON "public"."session_attendance" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."sessions" "s"
  WHERE (("s"."id" = "session_attendance"."session_id") AND ((EXISTS ( SELECT 1
           FROM "public"."club_memberships"
          WHERE (("club_memberships"."club_id" = "s"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
                   FROM "public"."coaches"
                  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
           FROM "public"."team_coaches"
          WHERE (("team_coaches"."team_id" = "s"."team_id") AND ("team_coaches"."coach_id" = ( SELECT "coaches"."id"
                   FROM "public"."coaches"
                  WHERE ("coaches"."auth_user_id" = "auth"."uid"())))))))))));



CREATE POLICY "session_attendance_update" ON "public"."session_attendance" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."sessions" "s"
  WHERE (("s"."id" = "session_attendance"."session_id") AND ((EXISTS ( SELECT 1
           FROM "public"."club_memberships"
          WHERE (("club_memberships"."club_id" = "s"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
                   FROM "public"."coaches"
                  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
           FROM "public"."team_coaches"
          WHERE (("team_coaches"."team_id" = "s"."team_id") AND ("team_coaches"."coach_id" = ( SELECT "coaches"."id"
                   FROM "public"."coaches"
                  WHERE ("coaches"."auth_user_id" = "auth"."uid"())))))))))));



ALTER TABLE "public"."session_block_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "session_block_assignments_delete" ON "public"."session_block_assignments" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."sessions" "s"
     JOIN "public"."team_coaches" "tc" ON (("s"."team_id" = "tc"."team_id")))
  WHERE (("s"."id" = "session_block_assignments"."session_id") AND ("tc"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"())))))));



CREATE POLICY "session_block_assignments_insert" ON "public"."session_block_assignments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."sessions" "s"
     JOIN "public"."team_coaches" "tc" ON (("s"."team_id" = "tc"."team_id")))
  WHERE (("s"."id" = "session_block_assignments"."session_id") AND ("tc"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"())))))));



CREATE POLICY "session_block_assignments_select" ON "public"."session_block_assignments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."sessions" "s"
     JOIN "public"."team_coaches" "tc" ON (("s"."team_id" = "tc"."team_id")))
  WHERE (("s"."id" = "session_block_assignments"."session_id") AND ("tc"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"())))))));



CREATE POLICY "session_block_assignments_update" ON "public"."session_block_assignments" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."sessions" "s"
     JOIN "public"."team_coaches" "tc" ON (("s"."team_id" = "tc"."team_id")))
  WHERE (("s"."id" = "session_block_assignments"."session_id") AND ("tc"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"())))))));



ALTER TABLE "public"."session_block_attributes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_blocks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "session_blocks_delete" ON "public"."session_blocks" FOR DELETE USING (("creator_id" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "session_blocks_insert" ON "public"."session_blocks" FOR INSERT WITH CHECK (("creator_id" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "session_blocks_select" ON "public"."session_blocks" FOR SELECT USING ((("is_public" = true) OR ("creator_id" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) OR ("club_id" IN ( SELECT "club_memberships"."club_id"
   FROM "public"."club_memberships"
  WHERE ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"())))))));



CREATE POLICY "session_blocks_update" ON "public"."session_blocks" FOR UPDATE USING (("creator_id" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))));



ALTER TABLE "public"."session_feedback" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "session_feedback_delete" ON "public"."session_feedback" FOR DELETE USING (("session_id" IN ( SELECT "s"."id"
   FROM ("public"."sessions" "s"
     JOIN "public"."club_memberships" "cm" ON (("cm"."club_id" = "s"."club_id")))
  WHERE (("cm"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("cm"."role" = 'admin'::"text")))));



CREATE POLICY "session_feedback_insert" ON "public"."session_feedback" FOR INSERT WITH CHECK ((("coach_id" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("session_id" IN ( SELECT "s"."id"
   FROM ("public"."sessions" "s"
     JOIN "public"."club_memberships" "cm" ON (("cm"."club_id" = "s"."club_id")))
  WHERE ("cm"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"())))))));



CREATE POLICY "session_feedback_select" ON "public"."session_feedback" FOR SELECT USING (("session_id" IN ( SELECT "s"."id"
   FROM ("public"."sessions" "s"
     JOIN "public"."club_memberships" "cm" ON (("cm"."club_id" = "s"."club_id")))
  WHERE ("cm"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "session_feedback_update" ON "public"."session_feedback" FOR UPDATE USING ((("coach_id" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) OR ("session_id" IN ( SELECT "s"."id"
   FROM ("public"."sessions" "s"
     JOIN "public"."club_memberships" "cm" ON (("cm"."club_id" = "s"."club_id")))
  WHERE (("cm"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("cm"."role" = 'admin'::"text"))))));



ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sessions_delete" ON "public"."sessions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "sessions"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))));



CREATE POLICY "sessions_insert" ON "public"."sessions" FOR INSERT WITH CHECK ((("club_id" = ( SELECT "teams"."club_id"
   FROM "public"."teams"
  WHERE ("teams"."id" = "sessions"."team_id"))) AND ("coach_id" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ((EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "sessions"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
   FROM "public"."team_coaches"
  WHERE (("team_coaches"."team_id" = "sessions"."team_id") AND ("team_coaches"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"())))))))));



CREATE POLICY "sessions_select" ON "public"."sessions" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "sessions"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
   FROM "public"."team_coaches"
  WHERE (("team_coaches"."team_id" = "sessions"."team_id") AND ("team_coaches"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))))));



CREATE POLICY "sessions_update" ON "public"."sessions" FOR UPDATE USING ((("coach_id" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "sessions"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text"))))));



ALTER TABLE "public"."system_defaults" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "system_defaults_select" ON "public"."system_defaults" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."team_coaches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "team_coaches_delete" ON "public"."team_coaches" FOR DELETE USING ((("coach_id" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."teams" "t"
  WHERE (("t"."id" = "team_coaches"."team_id") AND ((EXISTS ( SELECT 1
           FROM "public"."club_memberships"
          WHERE (("club_memberships"."club_id" = "t"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
                   FROM "public"."coaches"
                  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))) OR ("t"."created_by_coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"())))))))));



CREATE POLICY "team_coaches_insert" ON "public"."team_coaches" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."teams" "t"
  WHERE (("t"."id" = "team_coaches"."team_id") AND ((EXISTS ( SELECT 1
           FROM "public"."club_memberships"
          WHERE (("club_memberships"."club_id" = "t"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
                   FROM "public"."coaches"
                  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))) OR ("t"."created_by_coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))))));



CREATE POLICY "team_coaches_select" ON "public"."team_coaches" FOR SELECT USING (("team_id" IN ( SELECT "t"."id"
   FROM ("public"."teams" "t"
     JOIN "public"."club_memberships" "cm" ON (("cm"."club_id" = "t"."club_id")))
  WHERE ("cm"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."team_facilities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "team_facilities_delete" ON "public"."team_facilities" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."teams" "t"
  WHERE (("t"."id" = "team_facilities"."team_id") AND ((EXISTS ( SELECT 1
           FROM "public"."club_memberships"
          WHERE (("club_memberships"."club_id" = "t"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
                   FROM "public"."coaches"
                  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
           FROM "public"."team_coaches"
          WHERE (("team_coaches"."team_id" = "t"."id") AND ("team_coaches"."coach_id" = ( SELECT "coaches"."id"
                   FROM "public"."coaches"
                  WHERE ("coaches"."auth_user_id" = "auth"."uid"())))))))))));



CREATE POLICY "team_facilities_insert" ON "public"."team_facilities" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."teams" "t"
  WHERE (("t"."id" = "team_facilities"."team_id") AND ((EXISTS ( SELECT 1
           FROM "public"."club_memberships"
          WHERE (("club_memberships"."club_id" = "t"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
                   FROM "public"."coaches"
                  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
           FROM "public"."team_coaches"
          WHERE (("team_coaches"."team_id" = "t"."id") AND ("team_coaches"."coach_id" = ( SELECT "coaches"."id"
                   FROM "public"."coaches"
                  WHERE ("coaches"."auth_user_id" = "auth"."uid"())))))))))));



CREATE POLICY "team_facilities_select" ON "public"."team_facilities" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."teams" "t"
  WHERE (("t"."id" = "team_facilities"."team_id") AND ((EXISTS ( SELECT 1
           FROM "public"."club_memberships"
          WHERE (("club_memberships"."club_id" = "t"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
                   FROM "public"."coaches"
                  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
           FROM "public"."team_coaches"
          WHERE (("team_coaches"."team_id" = "t"."id") AND ("team_coaches"."coach_id" = ( SELECT "coaches"."id"
                   FROM "public"."coaches"
                  WHERE ("coaches"."auth_user_id" = "auth"."uid"())))))))))));



CREATE POLICY "team_facilities_update" ON "public"."team_facilities" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."teams" "t"
  WHERE (("t"."id" = "team_facilities"."team_id") AND ((EXISTS ( SELECT 1
           FROM "public"."club_memberships"
          WHERE (("club_memberships"."club_id" = "t"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
                   FROM "public"."coaches"
                  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
           FROM "public"."team_coaches"
          WHERE (("team_coaches"."team_id" = "t"."id") AND ("team_coaches"."coach_id" = ( SELECT "coaches"."id"
                   FROM "public"."coaches"
                  WHERE ("coaches"."auth_user_id" = "auth"."uid"())))))))))));



ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teams_delete" ON "public"."teams" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "teams"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))));



CREATE POLICY "teams_insert" ON "public"."teams" FOR INSERT WITH CHECK ((("club_id" IN ( SELECT "club_memberships"."club_id"
   FROM "public"."club_memberships"
  WHERE ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))) AND ("created_by_coach_id" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"())))));



CREATE POLICY "teams_select" ON "public"."teams" FOR SELECT USING (("club_id" IN ( SELECT "club_memberships"."club_id"
   FROM "public"."club_memberships"
  WHERE ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "teams_update" ON "public"."teams" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "teams"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))) OR ("created_by_coach_id" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."team_coaches"
  WHERE (("team_coaches"."team_id" = "teams"."id") AND ("team_coaches"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))))));



ALTER TABLE "public"."training_methodology" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "training_methodology_delete" ON "public"."training_methodology" FOR DELETE USING (((("team_id" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "training_methodology"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text"))))) OR (("team_id" IS NOT NULL) AND (("created_by_coach_id" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "training_methodology"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text"))))))));



CREATE POLICY "training_methodology_insert" ON "public"."training_methodology" FOR INSERT WITH CHECK ((("created_by_coach_id" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ((("team_id" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "training_methodology"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text"))))) OR (("team_id" IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "training_methodology"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
   FROM "public"."team_coaches"
  WHERE (("team_coaches"."team_id" = "training_methodology"."team_id") AND ("team_coaches"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"())))))))))));



CREATE POLICY "training_methodology_select" ON "public"."training_methodology" FOR SELECT USING (("club_id" IN ( SELECT "club_memberships"."club_id"
   FROM "public"."club_memberships"
  WHERE ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "training_methodology_update" ON "public"."training_methodology" FOR UPDATE USING (((("team_id" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "training_methodology"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text"))))) OR (("team_id" IS NOT NULL) AND (("created_by_coach_id" = ( SELECT "coaches"."id"
   FROM "public"."coaches"
  WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."club_memberships"
  WHERE (("club_memberships"."club_id" = "training_methodology"."club_id") AND ("club_memberships"."coach_id" = ( SELECT "coaches"."id"
           FROM "public"."coaches"
          WHERE ("coaches"."auth_user_id" = "auth"."uid"()))) AND ("club_memberships"."role" = 'admin'::"text"))))))));



REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_idp_priority_score"("p_days_since_trained" integer, "p_players_with_idp" integer, "p_total_players" integer, "p_negative_mentions" integer, "p_positive_mentions" integer, "p_neutral_mentions" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_idp_priority_score"("p_days_since_trained" integer, "p_players_with_idp" integer, "p_total_players" integer, "p_negative_mentions" integer, "p_positive_mentions" integer, "p_neutral_mentions" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_idp_priority_score"("p_days_since_trained" integer, "p_players_with_idp" integer, "p_total_players" integer, "p_negative_mentions" integer, "p_positive_mentions" integer, "p_neutral_mentions" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_player_idp_priority_score"("p_days_since_trained" integer, "p_training_sessions" integer, "p_expected_sessions" integer, "p_negative_mentions" integer, "p_positive_mentions" integer, "p_neutral_mentions" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_player_idp_priority_score"("p_days_since_trained" integer, "p_training_sessions" integer, "p_expected_sessions" integer, "p_negative_mentions" integer, "p_positive_mentions" integer, "p_neutral_mentions" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_player_idp_priority_score"("p_days_since_trained" integer, "p_training_sessions" integer, "p_expected_sessions" integer, "p_negative_mentions" integer, "p_positive_mentions" integer, "p_neutral_mentions" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_email_has_club"("check_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_email_has_club"("check_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_email_has_club"("check_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."copy_club_methodology_to_team"("p_team_id" "uuid", "p_club_id" "uuid", "p_coach_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."copy_club_methodology_to_team"("p_team_id" "uuid", "p_club_id" "uuid", "p_coach_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."copy_club_methodology_to_team"("p_team_id" "uuid", "p_club_id" "uuid", "p_coach_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_club_with_membership"("club_name" "text", "club_logo_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_club_with_membership"("club_name" "text", "club_logo_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_club_with_membership"("club_name" "text", "club_logo_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_training_events"("p_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_training_events"("p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_training_events"("p_session_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_club_coaches"("target_club_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_club_coaches"("target_club_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_club_coaches"("target_club_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_invite_with_club"("invite_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_invite_with_club"("invite_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_invite_with_club"("invite_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_latest_syllabus_session"("p_team_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_latest_syllabus_session"("p_team_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_latest_syllabus_session"("p_team_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_player_block_recommendations"("p_player_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_player_block_recommendations"("p_player_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_player_block_recommendations"("p_player_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_player_comparison"("p_player_ids" "uuid"[], "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_player_comparison"("p_player_ids" "uuid"[], "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_player_comparison"("p_player_ids" "uuid"[], "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_player_feedback_insights"("p_player_id" "uuid", "p_attribute_key" "text", "p_sentiment" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_player_feedback_insights"("p_player_id" "uuid", "p_attribute_key" "text", "p_sentiment" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_player_feedback_insights"("p_player_id" "uuid", "p_attribute_key" "text", "p_sentiment" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_player_feedback_insights_count"("p_player_id" "uuid", "p_attribute_key" "text", "p_sentiment" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_player_feedback_insights_count"("p_player_id" "uuid", "p_attribute_key" "text", "p_sentiment" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_player_feedback_insights_count"("p_player_id" "uuid", "p_attribute_key" "text", "p_sentiment" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_player_idp_priorities"("p_player_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_player_idp_priorities"("p_player_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_player_idp_priorities"("p_player_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_player_training_balance"("p_player_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_player_training_balance"("p_player_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_player_training_balance"("p_player_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_team_attribute_breakdown"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_team_attribute_breakdown"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_team_attribute_breakdown"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_team_block_recommendations"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_team_block_recommendations"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_team_block_recommendations"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_team_idp_gaps"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_team_idp_gaps"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_team_idp_gaps"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_team_player_matrix"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_team_player_matrix"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_team_player_matrix"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_team_session_block_usage"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_team_session_block_usage"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_team_session_block_usage"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_team_training_summary"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_team_training_summary"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_team_training_summary"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_team_training_trend"("p_team_id" "uuid", "p_weeks" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_team_training_trend"("p_team_id" "uuid", "p_weeks" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_team_training_trend"("p_team_id" "uuid", "p_weeks" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_feedback_insights"("p_session_feedback_id" "uuid", "p_insights" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_feedback_insights"("p_session_feedback_id" "uuid", "p_insights" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_feedback_insights"("p_session_feedback_id" "uuid", "p_insights" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."redeem_invite"("invite_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."redeem_invite"("invite_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."redeem_invite"("invite_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_coach_from_club"("target_membership_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_coach_from_club"("target_membership_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_coach_from_club"("target_membership_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."revert_team_game_model"("p_team_id" "uuid", "p_club_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."revert_team_game_model"("p_team_id" "uuid", "p_club_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."revert_team_game_model"("p_team_id" "uuid", "p_club_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."revert_team_playing_methodology"("p_team_id" "uuid", "p_club_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."revert_team_playing_methodology"("p_team_id" "uuid", "p_club_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."revert_team_playing_methodology"("p_team_id" "uuid", "p_club_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."revert_team_positional_profiles"("p_team_id" "uuid", "p_club_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."revert_team_positional_profiles"("p_team_id" "uuid", "p_club_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."revert_team_positional_profiles"("p_team_id" "uuid", "p_club_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."revert_team_training_syllabus"("p_team_id" "uuid", "p_club_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."revert_team_training_syllabus"("p_team_id" "uuid", "p_club_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."revert_team_training_syllabus"("p_team_id" "uuid", "p_club_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_coach_role"("target_membership_id" "uuid", "new_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_coach_role"("target_membership_id" "uuid", "new_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_coach_role"("target_membership_id" "uuid", "new_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_player_idps"("p_player_id" "uuid", "p_new_idps" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_player_idps"("p_player_id" "uuid", "p_new_idps" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_player_idps"("p_player_id" "uuid", "p_new_idps" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."block_player_exclusions" TO "anon";
GRANT ALL ON TABLE "public"."block_player_exclusions" TO "authenticated";
GRANT ALL ON TABLE "public"."block_player_exclusions" TO "service_role";



GRANT ALL ON TABLE "public"."club_invites" TO "anon";
GRANT ALL ON TABLE "public"."club_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."club_invites" TO "service_role";



GRANT ALL ON TABLE "public"."club_memberships" TO "anon";
GRANT ALL ON TABLE "public"."club_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."club_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."clubs" TO "anon";
GRANT ALL ON TABLE "public"."clubs" TO "authenticated";
GRANT ALL ON TABLE "public"."clubs" TO "service_role";



GRANT ALL ON TABLE "public"."coaches" TO "anon";
GRANT ALL ON TABLE "public"."coaches" TO "authenticated";
GRANT ALL ON TABLE "public"."coaches" TO "service_role";



GRANT ALL ON TABLE "public"."feedback_insights" TO "anon";
GRANT ALL ON TABLE "public"."feedback_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback_insights" TO "service_role";



GRANT ALL ON TABLE "public"."game_model" TO "anon";
GRANT ALL ON TABLE "public"."game_model" TO "authenticated";
GRANT ALL ON TABLE "public"."game_model" TO "service_role";



GRANT ALL ON TABLE "public"."methodology_templates" TO "anon";
GRANT ALL ON TABLE "public"."methodology_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."methodology_templates" TO "service_role";



GRANT ALL ON TABLE "public"."players" TO "anon";
GRANT ALL ON TABLE "public"."players" TO "authenticated";
GRANT ALL ON TABLE "public"."players" TO "service_role";



GRANT ALL ON TABLE "public"."session_attendance" TO "anon";
GRANT ALL ON TABLE "public"."session_attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."session_attendance" TO "service_role";



GRANT ALL ON TABLE "public"."player_attendance_summary" TO "anon";
GRANT ALL ON TABLE "public"."player_attendance_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."player_attendance_summary" TO "service_role";



GRANT ALL ON TABLE "public"."player_feedback_notes" TO "anon";
GRANT ALL ON TABLE "public"."player_feedback_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."player_feedback_notes" TO "service_role";



GRANT ALL ON TABLE "public"."player_idps" TO "anon";
GRANT ALL ON TABLE "public"."player_idps" TO "authenticated";
GRANT ALL ON TABLE "public"."player_idps" TO "service_role";



GRANT ALL ON TABLE "public"."player_training_events" TO "anon";
GRANT ALL ON TABLE "public"."player_training_events" TO "authenticated";
GRANT ALL ON TABLE "public"."player_training_events" TO "service_role";



GRANT ALL ON TABLE "public"."player_idp_progress" TO "anon";
GRANT ALL ON TABLE "public"."player_idp_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."player_idp_progress" TO "service_role";



GRANT ALL ON TABLE "public"."position_suggestions" TO "anon";
GRANT ALL ON TABLE "public"."position_suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."position_suggestions" TO "service_role";



GRANT ALL ON TABLE "public"."positional_profiles" TO "anon";
GRANT ALL ON TABLE "public"."positional_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."positional_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."session_block_assignments" TO "anon";
GRANT ALL ON TABLE "public"."session_block_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."session_block_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."session_block_attributes" TO "anon";
GRANT ALL ON TABLE "public"."session_block_attributes" TO "authenticated";
GRANT ALL ON TABLE "public"."session_block_attributes" TO "service_role";



GRANT ALL ON TABLE "public"."session_blocks" TO "anon";
GRANT ALL ON TABLE "public"."session_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."session_blocks" TO "service_role";



GRANT ALL ON TABLE "public"."session_feedback" TO "anon";
GRANT ALL ON TABLE "public"."session_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."session_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."system_defaults" TO "anon";
GRANT ALL ON TABLE "public"."system_defaults" TO "authenticated";
GRANT ALL ON TABLE "public"."system_defaults" TO "service_role";



GRANT ALL ON TABLE "public"."team_coaches" TO "anon";
GRANT ALL ON TABLE "public"."team_coaches" TO "authenticated";
GRANT ALL ON TABLE "public"."team_coaches" TO "service_role";



GRANT ALL ON TABLE "public"."team_facilities" TO "anon";
GRANT ALL ON TABLE "public"."team_facilities" TO "authenticated";
GRANT ALL ON TABLE "public"."team_facilities" TO "service_role";



GRANT ALL ON TABLE "public"."team_idp_gaps" TO "anon";
GRANT ALL ON TABLE "public"."team_idp_gaps" TO "authenticated";
GRANT ALL ON TABLE "public"."team_idp_gaps" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."team_training_summary" TO "anon";
GRANT ALL ON TABLE "public"."team_training_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."team_training_summary" TO "service_role";



GRANT ALL ON TABLE "public"."training_methodology" TO "anon";
GRANT ALL ON TABLE "public"."training_methodology" TO "authenticated";
GRANT ALL ON TABLE "public"."training_methodology" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";




RESET ALL;
