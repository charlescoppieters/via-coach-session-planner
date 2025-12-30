-- ========================================
-- VIA SESSION PLANNER V3 - Demo Data
-- ========================================
-- Run this to populate test data for the analytics dashboard
-- Prerequisites: schema.sql, seed.sql, and all migrations must be run first
--
-- RE-RUNNABLE: This script cleans up existing demo data before inserting.
-- It preserves the club, coach, and team entries but removes all associated data.
--
-- This demo showcases all V3 features:
-- - Game Model with zones
-- - Training Syllabus (4-week cycle)
-- - Session-Syllabus integration
-- - Simultaneous practices with block player exclusions
-- - Ball rolling time percentages
-- - First/Second order block attributes
-- - Feedback insights with sentiment
-- ========================================

-- Configuration
DO $$
DECLARE
    v_club_id UUID := '1f04ae17-871f-41d7-978b-6572112f71e7';
    v_team_id UUID := '2f863a57-2f6a-4528-8f56-1eae308c9c11';
    v_coach_id UUID := 'cc64a4bf-db59-4ce7-bb69-4602d175bb95';

    -- Game Model Zone Block IDs (for syllabus reference)
    gm_buildup_possession UUID := uuid_generate_v4();
    gm_buildup_transition UUID := uuid_generate_v4();
    gm_midfield_possession UUID := uuid_generate_v4();
    gm_midfield_pressing UUID := uuid_generate_v4();
    gm_final_third_creation UUID := uuid_generate_v4();
    gm_final_third_finishing UUID := uuid_generate_v4();
    gm_defensive_shape UUID := uuid_generate_v4();
    gm_defensive_pressing UUID := uuid_generate_v4();

    -- Player IDs
    p_gk UUID := uuid_generate_v4();
    p_cb1 UUID := uuid_generate_v4();
    p_cb2 UUID := uuid_generate_v4();
    p_fb1 UUID := uuid_generate_v4();
    p_fb2 UUID := uuid_generate_v4();
    p_mf1 UUID := uuid_generate_v4();
    p_mf2 UUID := uuid_generate_v4();
    p_w1 UUID := uuid_generate_v4();
    p_w2 UUID := uuid_generate_v4();
    p_st UUID := uuid_generate_v4();

    -- Session IDs (12 sessions over past 8 weeks)
    s1 UUID := uuid_generate_v4();
    s2 UUID := uuid_generate_v4();
    s3 UUID := uuid_generate_v4();
    s4 UUID := uuid_generate_v4();
    s5 UUID := uuid_generate_v4();
    s6 UUID := uuid_generate_v4();
    s7 UUID := uuid_generate_v4();
    s8 UUID := uuid_generate_v4();
    s9 UUID := uuid_generate_v4();
    s10 UUID := uuid_generate_v4();
    s11 UUID := uuid_generate_v4();
    s12 UUID := uuid_generate_v4();

    -- Reusable Block IDs
    b_rondo UUID := uuid_generate_v4();
    b_passing_patterns UUID := uuid_generate_v4();
    b_receiving_pressure UUID := uuid_generate_v4();
    b_shooting_warmup UUID := uuid_generate_v4();
    b_finishing_patterns UUID := uuid_generate_v4();
    b_crossing_finishing UUID := uuid_generate_v4();
    b_1v1_defending UUID := uuid_generate_v4();
    b_defensive_shape UUID := uuid_generate_v4();
    b_crossing_technique UUID := uuid_generate_v4();
    b_overlap_patterns UUID := uuid_generate_v4();
    b_gk_distribution UUID := uuid_generate_v4();
    b_buildup_patterns UUID := uuid_generate_v4();
    b_counter_attack UUID := uuid_generate_v4();
    b_pressing_triggers UUID := uuid_generate_v4();
    b_1v1_attacking UUID := uuid_generate_v4();
    b_speed_agility UUID := uuid_generate_v4();
    b_endurance UUID := uuid_generate_v4();
    b_possession_game UUID := uuid_generate_v4();
    b_small_sided_game UUID := uuid_generate_v4();
    b_match_simulation UUID := uuid_generate_v4();
    b_gk_shot_stopping UUID := uuid_generate_v4();

    -- Session Block Assignment IDs (for simultaneous practice exclusions)
    sba_s3_1v1_defending UUID := uuid_generate_v4();
    sba_s3_gk_shot_stopping UUID := uuid_generate_v4();
    sba_s9_1v1_attacking UUID := uuid_generate_v4();
    sba_s9_gk_distribution UUID := uuid_generate_v4();

    -- Feedback IDs
    f1 UUID; f2 UUID; f3 UUID; f4 UUID; f5 UUID;
    f6 UUID; f7 UUID; f8 UUID; f9 UUID; f10 UUID;
    f11 UUID; f12 UUID;

    -- Training Syllabus JSON
    v_syllabus JSONB;
    v_zones JSONB;

BEGIN
    -- ========================================
    -- CLEANUP - Remove existing demo data
    -- Deletes in correct order for FK constraints
    -- Keeps: clubs, coaches, teams, club_memberships
    -- ========================================
    RAISE NOTICE 'Cleaning up existing demo data for club %...', v_club_id;

    -- Delete feedback insights (depends on session_feedback)
    DELETE FROM feedback_insights WHERE session_feedback_id IN (
        SELECT id FROM session_feedback WHERE session_id IN (
            SELECT id FROM sessions WHERE club_id = v_club_id
        )
    );

    -- Delete player feedback notes (depends on session_feedback, players)
    DELETE FROM player_feedback_notes WHERE session_feedback_id IN (
        SELECT id FROM session_feedback WHERE session_id IN (
            SELECT id FROM sessions WHERE club_id = v_club_id
        )
    );

    -- Delete session feedback (depends on sessions)
    DELETE FROM session_feedback WHERE session_id IN (
        SELECT id FROM sessions WHERE club_id = v_club_id
    );

    -- Delete player training events (depends on sessions)
    DELETE FROM player_training_events WHERE session_id IN (
        SELECT id FROM sessions WHERE club_id = v_club_id
    );

    -- Delete session attendance (depends on sessions, players)
    DELETE FROM session_attendance WHERE session_id IN (
        SELECT id FROM sessions WHERE club_id = v_club_id
    );

    -- Delete block player exclusions (depends on session_block_assignments)
    DELETE FROM block_player_exclusions WHERE assignment_id IN (
        SELECT id FROM session_block_assignments WHERE session_id IN (
            SELECT id FROM sessions WHERE club_id = v_club_id
        )
    );

    -- Delete session block assignments (depends on sessions)
    DELETE FROM session_block_assignments WHERE session_id IN (
        SELECT id FROM sessions WHERE club_id = v_club_id
    );

    -- Delete session block attributes (depends on session_blocks)
    DELETE FROM session_block_attributes WHERE block_id IN (
        SELECT id FROM session_blocks WHERE club_id = v_club_id
    );

    -- Delete session blocks (club-level reusable blocks)
    DELETE FROM session_blocks WHERE club_id = v_club_id;

    -- Delete sessions
    DELETE FROM sessions WHERE club_id = v_club_id;

    -- Delete player IDPs (depends on players)
    DELETE FROM player_idps WHERE player_id IN (
        SELECT id FROM players WHERE club_id = v_club_id
    );

    -- Delete players
    DELETE FROM players WHERE club_id = v_club_id;

    -- Delete training methodology
    DELETE FROM training_methodology WHERE club_id = v_club_id;

    -- Delete game model
    DELETE FROM game_model WHERE club_id = v_club_id;

    -- Delete positional profiles
    DELETE FROM positional_profiles WHERE club_id = v_club_id;

    RAISE NOTICE 'Cleanup complete. Inserting new demo data...';

    -- ========================================
    -- GAME MODEL - Club Level with Zones (V3 Format)
    -- ========================================
    -- V3 format uses: zone_count, match_format, zones array
    -- Each zone has: id, order, name, in_possession[], out_of_possession[]
    -- Each block has: id, name, details
    v_zones := jsonb_build_object(
        'zone_count', 4,
        'match_format', '11v11',
        'zones', jsonb_build_array(
            jsonb_build_object(
                'id', 'zone-1',
                'order', 1,
                'name', 'Building from the Back',
                'in_possession', jsonb_build_array(
                    jsonb_build_object('id', gm_buildup_possession::text, 'name', 'Build-Up Play', 'details', 'Patient build-up through the thirds. GK and CBs comfortable on the ball, creating numerical superiority.')
                ),
                'out_of_possession', jsonb_build_array(
                    jsonb_build_object('id', gm_buildup_transition::text, 'name', 'Counter-Press', 'details', 'Immediate pressure after losing the ball. Win it back within 6 seconds or recover shape.')
                )
            ),
            jsonb_build_object(
                'id', 'zone-2',
                'order', 2,
                'name', 'Midfield Control',
                'in_possession', jsonb_build_array(
                    jsonb_build_object('id', gm_midfield_possession::text, 'name', 'Possession Patterns', 'details', 'Maintaining possession and progressing play through combination play and third-man runs.')
                ),
                'out_of_possession', jsonb_build_array(
                    jsonb_build_object('id', gm_midfield_pressing::text, 'name', 'Pressing Triggers', 'details', 'When and how to press as a unit. Triggers: heavy touch, backwards pass, player facing own goal.')
                )
            ),
            jsonb_build_object(
                'id', 'zone-3',
                'order', 3,
                'name', 'Final Third',
                'in_possession', jsonb_build_array(
                    jsonb_build_object('id', gm_final_third_creation::text, 'name', 'Chance Creation', 'details', 'Creating goal-scoring opportunities through width, overloads, and penetrating runs.'),
                    jsonb_build_object('id', gm_final_third_finishing::text, 'name', 'Clinical Finishing', 'details', 'Converting chances into goals. Movement in the box, attacking crosses, second balls.')
                ),
                'out_of_possession', jsonb_build_array()
            ),
            jsonb_build_object(
                'id', 'zone-4',
                'order', 4,
                'name', 'Defensive Organization',
                'in_possession', jsonb_build_array(),
                'out_of_possession', jsonb_build_array(
                    jsonb_build_object('id', gm_defensive_shape::text, 'name', 'Defensive Shape', 'details', 'Maintaining compact defensive block. 4-4-2 mid-block with narrow distances between lines.'),
                    jsonb_build_object('id', gm_defensive_pressing::text, 'name', '1v1 Defending', 'details', 'Winning individual defensive duels. Body position, jockeying, timing of tackle.')
                )
            )
        )
    );

    INSERT INTO game_model (club_id, team_id, created_by_coach_id, title, description, zones, display_order, is_active)
    VALUES (v_club_id, NULL, v_coach_id, 'Club Game Model', 'Our philosophy for how we play', v_zones, 0, true)
    ON CONFLICT DO NOTHING;

    -- Copy to team level
    INSERT INTO game_model (club_id, team_id, created_by_coach_id, title, description, zones, display_order, is_active)
    VALUES (v_club_id, v_team_id, v_coach_id, 'U14 Game Model', 'Team game model', v_zones, 0, true)
    ON CONFLICT DO NOTHING;

    -- ========================================
    -- TRAINING SYLLABUS - 4 Week Cycle
    -- ========================================
    -- ThemeSelection format: zoneId, zoneName, blockType (in_possession/out_of_possession), blockId, blockName
    -- Each week MUST have all 7 days (0=Mon through 6=Sun) to match UI behavior
    v_syllabus := jsonb_build_object(
        'weeks', jsonb_build_array(
            -- Week 1: Building & Possession focus
            jsonb_build_object(
                'id', uuid_generate_v4()::text,
                'order', 1,
                'days', jsonb_build_array(
                    jsonb_build_object('dayOfWeek', 0, 'theme', NULL, 'comments', NULL),
                    jsonb_build_object('dayOfWeek', 1, 'theme', jsonb_build_object('zoneId', 'zone-1', 'zoneName', 'Building from the Back', 'blockType', 'in_possession', 'blockId', gm_buildup_possession::text, 'blockName', 'Build-Up Play'), 'comments', NULL),
                    jsonb_build_object('dayOfWeek', 2, 'theme', NULL, 'comments', NULL),
                    jsonb_build_object('dayOfWeek', 3, 'theme', jsonb_build_object('zoneId', 'zone-2', 'zoneName', 'Midfield Control', 'blockType', 'in_possession', 'blockId', gm_midfield_possession::text, 'blockName', 'Possession Patterns'), 'comments', NULL),
                    jsonb_build_object('dayOfWeek', 4, 'theme', NULL, 'comments', NULL),
                    jsonb_build_object('dayOfWeek', 5, 'theme', NULL, 'comments', 'Recovery session'),
                    jsonb_build_object('dayOfWeek', 6, 'theme', NULL, 'comments', 'Match day')
                )
            ),
            -- Week 2: Final Third focus
            jsonb_build_object(
                'id', uuid_generate_v4()::text,
                'order', 2,
                'days', jsonb_build_array(
                    jsonb_build_object('dayOfWeek', 0, 'theme', NULL, 'comments', NULL),
                    jsonb_build_object('dayOfWeek', 1, 'theme', jsonb_build_object('zoneId', 'zone-3', 'zoneName', 'Final Third', 'blockType', 'in_possession', 'blockId', gm_final_third_creation::text, 'blockName', 'Chance Creation'), 'comments', NULL),
                    jsonb_build_object('dayOfWeek', 2, 'theme', NULL, 'comments', NULL),
                    jsonb_build_object('dayOfWeek', 3, 'theme', jsonb_build_object('zoneId', 'zone-3', 'zoneName', 'Final Third', 'blockType', 'in_possession', 'blockId', gm_final_third_finishing::text, 'blockName', 'Clinical Finishing'), 'comments', NULL),
                    jsonb_build_object('dayOfWeek', 4, 'theme', NULL, 'comments', NULL),
                    jsonb_build_object('dayOfWeek', 5, 'theme', NULL, 'comments', 'Recovery session'),
                    jsonb_build_object('dayOfWeek', 6, 'theme', NULL, 'comments', 'Match day')
                )
            ),
            -- Week 3: Defensive focus
            jsonb_build_object(
                'id', uuid_generate_v4()::text,
                'order', 3,
                'days', jsonb_build_array(
                    jsonb_build_object('dayOfWeek', 0, 'theme', NULL, 'comments', NULL),
                    jsonb_build_object('dayOfWeek', 1, 'theme', jsonb_build_object('zoneId', 'zone-4', 'zoneName', 'Defensive Organization', 'blockType', 'out_of_possession', 'blockId', gm_defensive_shape::text, 'blockName', 'Defensive Shape'), 'comments', NULL),
                    jsonb_build_object('dayOfWeek', 2, 'theme', NULL, 'comments', NULL),
                    jsonb_build_object('dayOfWeek', 3, 'theme', jsonb_build_object('zoneId', 'zone-4', 'zoneName', 'Defensive Organization', 'blockType', 'out_of_possession', 'blockId', gm_defensive_pressing::text, 'blockName', '1v1 Defending'), 'comments', NULL),
                    jsonb_build_object('dayOfWeek', 4, 'theme', NULL, 'comments', NULL),
                    jsonb_build_object('dayOfWeek', 5, 'theme', NULL, 'comments', 'Recovery session'),
                    jsonb_build_object('dayOfWeek', 6, 'theme', NULL, 'comments', 'Match day')
                )
            ),
            -- Week 4: Transition & Pressing focus
            jsonb_build_object(
                'id', uuid_generate_v4()::text,
                'order', 4,
                'days', jsonb_build_array(
                    jsonb_build_object('dayOfWeek', 0, 'theme', NULL, 'comments', NULL),
                    jsonb_build_object('dayOfWeek', 1, 'theme', jsonb_build_object('zoneId', 'zone-2', 'zoneName', 'Midfield Control', 'blockType', 'out_of_possession', 'blockId', gm_midfield_pressing::text, 'blockName', 'Pressing Triggers'), 'comments', NULL),
                    jsonb_build_object('dayOfWeek', 2, 'theme', NULL, 'comments', NULL),
                    jsonb_build_object('dayOfWeek', 3, 'theme', jsonb_build_object('zoneId', 'zone-1', 'zoneName', 'Building from the Back', 'blockType', 'out_of_possession', 'blockId', gm_buildup_transition::text, 'blockName', 'Counter-Press'), 'comments', NULL),
                    jsonb_build_object('dayOfWeek', 4, 'theme', NULL, 'comments', NULL),
                    jsonb_build_object('dayOfWeek', 5, 'theme', NULL, 'comments', 'Match preparation'),
                    jsonb_build_object('dayOfWeek', 6, 'theme', NULL, 'comments', 'Match day')
                )
            )
        )
    );

    INSERT INTO training_methodology (club_id, team_id, created_by_coach_id, title, description, syllabus, display_order, is_active)
    VALUES (v_club_id, NULL, v_coach_id, 'Club Training Syllabus', '4-week training cycle aligned with Game Model', v_syllabus, 0, true)
    ON CONFLICT DO NOTHING;

    -- Copy to team level
    INSERT INTO training_methodology (club_id, team_id, created_by_coach_id, title, description, syllabus, display_order, is_active)
    VALUES (v_club_id, v_team_id, v_coach_id, 'U14 Training Syllabus', 'Team training syllabus', v_syllabus, 0, true)
    ON CONFLICT DO NOTHING;

    -- ========================================
    -- POSITIONAL PROFILES (V2 format with in/out possession)
    -- ========================================
    -- V2 format: { "in_possession": [...], "out_of_possession": [...] }
    INSERT INTO positional_profiles (club_id, team_id, position_key, attributes, display_order, is_active) VALUES
    -- Club-level profiles (team_id = NULL)
    (v_club_id, NULL, 'goalkeeper', '{"in_possession": ["strong_ability_to_receive_under_pressure_in_build_up", "strong_ability_to_pass_short_and_medium_passes", "strong_ability_to_distribute_quickly"], "out_of_possession": ["strong_ability_to_shot_stop", "strong_ability_to_command_the_box"]}', 0, true),
    (v_club_id, NULL, 'centre_back', '{"in_possession": ["strong_ability_to_break_lines_using_passing", "strong_ability_to_carry_the_ball_up_the_pitch", "strong_ability_to_play_out_from_the_back"], "out_of_possession": ["strong_ability_to_defend_1v1", "strong_ability_to_read_the_game", "strong_ability_to_organise_teammates"]}', 1, true),
    (v_club_id, NULL, 'fullback', '{"in_possession": ["strong_ability_to_use_a_variety_of_crossing_types", "strong_ability_to_overlap_and_underlap", "strong_ability_to_switch_play"], "out_of_possession": ["strong_ability_to_defend_1v1", "strong_ability_to_track_runners"]}', 2, true),
    (v_club_id, NULL, 'central_midfielder', '{"in_possession": ["strong_ability_to_receive_on_the_half_turn", "strong_ability_to_break_lines_using_passing", "strong_ability_to_control_tempo"], "out_of_possession": ["strong_ability_to_press_intelligently", "strong_ability_to_cover_passing_lanes"]}', 3, true),
    (v_club_id, NULL, 'winger', '{"in_possession": ["strong_ability_to_beat_players_1v1", "strong_ability_to_use_a_variety_of_crossing_types", "strong_ability_to_score_inside_the_box"], "out_of_possession": ["strong_ability_to_press_intelligently", "strong_ability_to_track_back"]}', 4, true),
    (v_club_id, NULL, 'striker', '{"in_possession": ["strong_ability_to_score_inside_the_box", "strong_ability_to_receive_on_the_half_turn", "strong_ability_to_link_up_play"], "out_of_possession": ["strong_ability_to_press_intelligently", "strong_ability_to_press_from_the_front"]}', 5, true),
    -- Team-level profiles (copy of club with slight variations)
    (v_club_id, v_team_id, 'goalkeeper', '{"in_possession": ["strong_ability_to_receive_under_pressure_in_build_up", "strong_ability_to_pass_short_and_medium_passes"], "out_of_possession": ["strong_ability_to_shot_stop", "strong_ability_to_command_the_box"]}', 0, true),
    (v_club_id, v_team_id, 'centre_back', '{"in_possession": ["strong_ability_to_break_lines_using_passing", "strong_ability_to_carry_the_ball_up_the_pitch"], "out_of_possession": ["strong_ability_to_defend_1v1", "strong_ability_to_organise_teammates"]}', 1, true),
    (v_club_id, v_team_id, 'fullback', '{"in_possession": ["strong_ability_to_use_a_variety_of_crossing_types", "strong_ability_to_overlap_and_underlap"], "out_of_possession": ["strong_ability_to_defend_1v1", "strong_ability_to_track_runners"]}', 2, true),
    (v_club_id, v_team_id, 'central_midfielder', '{"in_possession": ["strong_ability_to_receive_on_the_half_turn", "strong_ability_to_break_lines_using_passing"], "out_of_possession": ["strong_ability_to_press_intelligently"]}', 3, true),
    (v_club_id, v_team_id, 'winger', '{"in_possession": ["strong_ability_to_beat_players_1v1", "strong_ability_to_score_inside_the_box"], "out_of_possession": ["strong_ability_to_press_intelligently"]}', 4, true),
    (v_club_id, v_team_id, 'striker', '{"in_possession": ["strong_ability_to_score_inside_the_box", "strong_ability_to_receive_on_the_half_turn"], "out_of_possession": ["strong_ability_to_press_from_the_front"]}', 5, true);

    -- ========================================
    -- PLAYERS (10 players with realistic positions)
    -- ========================================
    INSERT INTO players (id, club_id, team_id, name, "position", age, gender) VALUES
    (p_gk, v_club_id, v_team_id, 'Marcus Thompson', 'Goalkeeper', 14, 'male'),
    (p_cb1, v_club_id, v_team_id, 'James Wilson', 'Centre Back', 14, 'male'),
    (p_cb2, v_club_id, v_team_id, 'David Chen', 'Centre Back', 14, 'male'),
    (p_fb1, v_club_id, v_team_id, 'Ryan Peters', 'Fullback', 14, 'male'),
    (p_fb2, v_club_id, v_team_id, 'Omar Hassan', 'Fullback', 13, 'male'),
    (p_mf1, v_club_id, v_team_id, 'Alex Rodriguez', 'Midfielder', 14, 'male'),
    (p_mf2, v_club_id, v_team_id, 'Tom Baker', 'Midfielder', 14, 'male'),
    (p_w1, v_club_id, v_team_id, 'Chris Evans', 'Winger', 14, 'male'),
    (p_w2, v_club_id, v_team_id, 'Jamal Williams', 'Winger', 13, 'male'),
    (p_st, v_club_id, v_team_id, 'Michael Johnson', 'Striker', 14, 'male');

    -- ========================================
    -- PLAYER IDPs (with significant overlap!)
    -- Key overlapping attributes:
    -- - strong_ability_to_score_inside_the_box: ST, W1, W2, MF2 (4 players)
    -- - strong_ability_to_receive_on_the_half_turn: MF1, MF2, ST (3 players)
    -- - strong_ability_to_defend_1v1: FB1, FB2, CB1 (3 players)
    -- - strong_ability_to_use_a_variety_of_crossing_types: FB1, W2 (2 players)
    -- - strong_ability_to_press_intelligently: MF1, MF2, W1 (3 players)
    -- - strong_ability_to_break_lines_using_passing: CB2, MF2 (2 players)
    -- ========================================
    INSERT INTO player_idps (player_id, attribute_key, priority, notes) VALUES
    -- GK - Distribution focus
    (p_gk, 'strong_ability_to_receive_under_pressure_in_build_up', 1, 'Focus on composure when pressed'),
    (p_gk, 'strong_ability_to_pass_short_and_medium_passes', 2, 'Improve accuracy to fullbacks'),

    -- CB1 - Defending and leadership (shares defend_1v1 with fullbacks)
    (p_cb1, 'strong_ability_to_defend_1v1', 1, 'Staying on feet in duels'),
    (p_cb1, 'strong_ability_to_organise_teammates', 2, 'Developing leadership skills'),
    (p_cb1, 'strong_communication', 3, 'More vocal in organizing defense'),

    -- CB2 - Ball-playing (shares break_lines with MF2)
    (p_cb2, 'strong_ability_to_break_lines_using_passing', 1, 'Key progression skill'),
    (p_cb2, 'strong_ability_to_carry_the_ball_up_the_pitch', 2, 'Confident stepping out'),

    -- FB1 - Attacking fullback (shares crossing with W2, shares defend_1v1 with CB1/FB2)
    (p_fb1, 'strong_ability_to_use_a_variety_of_crossing_types', 1, 'End product from wide'),
    (p_fb1, 'strong_ability_to_defend_1v1', 2, 'Recovery defending'),

    -- FB2 - Defensive fullback (shares defend_1v1 with CB1/FB1)
    (p_fb2, 'strong_ability_to_defend_1v1', 1, 'Staying on feet'),
    (p_fb2, 'strong_ability_to_track_runners', 2, 'Awareness of runners behind'),

    -- MF1 - Box-to-box (shares half_turn with MF2/ST, shares pressing with MF2/W1)
    (p_mf1, 'strong_ability_to_receive_on_the_half_turn', 1, 'Opens up play quickly'),
    (p_mf1, 'strong_ability_to_press_intelligently', 2, 'Timing of press triggers'),
    (p_mf1, 'strong_aerobic_endurance', 3, 'Maintain intensity throughout'),

    -- MF2 - Creative playmaker (shares half_turn with MF1/ST, shares pressing with MF1/W1, shares break_lines with CB2, shares scoring with attackers)
    (p_mf2, 'strong_ability_to_receive_on_the_half_turn', 1, 'Receiving in tight spaces'),
    (p_mf2, 'strong_ability_to_break_lines_using_passing', 2, 'Final third creativity'),
    (p_mf2, 'strong_ability_to_score_inside_the_box', 3, 'Late runs into box'),

    -- W1 - Direct winger (shares scoring with ST/W2/MF2, shares pressing with MF1/MF2)
    (p_w1, 'strong_ability_to_dominate_opponents_in_1v1_attacking_situations', 1, 'Take on defenders'),
    (p_w1, 'strong_ability_to_score_inside_the_box', 2, 'Finishing when cutting inside'),
    (p_w1, 'strong_ability_to_press_intelligently', 3, 'Pressing from the front'),

    -- W2 - Crossing winger (shares crossing with FB1, shares scoring with ST/W1/MF2)
    (p_w2, 'strong_ability_to_use_a_variety_of_crossing_types', 1, 'Variety in delivery'),
    (p_w2, 'strong_ability_to_score_inside_the_box', 2, 'Cutting inside to finish'),

    -- ST - Finisher (shares scoring with W1/W2/MF2, shares half_turn with MF1/MF2)
    (p_st, 'strong_ability_to_score_inside_the_box', 1, 'Clinical finishing'),
    (p_st, 'strong_ability_to_receive_on_the_half_turn', 2, 'Link play with midfield'),
    (p_st, 'strong_ability_to_make_runs_beyond_the_back_line', 3, 'Movement off the ball');

    -- ========================================
    -- SESSION BLOCKS with ball_rolling percentages
    -- ========================================
    INSERT INTO session_blocks (id, creator_id, club_id, title, description, coaching_points, duration, ball_rolling, is_public, source) VALUES
    -- Warm-up / Technical
    (b_rondo, v_coach_id, v_club_id, 'Rondo 4v2', 'Quick passing under pressure', 'Quick feet, body shape, communication', 15, 75, false, 'user'),
    (b_passing_patterns, v_coach_id, v_club_id, 'Passing Patterns', 'Combination play and movement', 'Weight of pass, movement after', 20, 65, false, 'user'),
    (b_receiving_pressure, v_coach_id, v_club_id, 'Receiving Under Pressure', 'Technical receiving in tight spaces', 'Body shape, first touch direction', 20, 60, false, 'user'),

    -- Finishing
    (b_shooting_warmup, v_coach_id, v_club_id, 'Shooting Warm-Up', 'Basic finishing drills', 'Technique, placement over power', 15, 55, false, 'user'),
    (b_finishing_patterns, v_coach_id, v_club_id, 'Finishing Patterns', 'Combination play into finish', 'Movement before shot, first touch setup', 20, 50, false, 'user'),
    (b_crossing_finishing, v_coach_id, v_club_id, 'Crossing & Finishing', 'Wide delivery and attacking crosses', 'Timing runs, near/far post movement', 25, 45, false, 'user'),

    -- Defensive
    (b_1v1_defending, v_coach_id, v_club_id, '1v1 Defending', 'Individual defensive technique', 'Stay on feet, show wide, patience', 20, 70, false, 'user'),
    (b_defensive_shape, v_coach_id, v_club_id, 'Defensive Shape', '4v4 defending as a unit', 'Compactness, cover, communication', 25, 55, false, 'user'),

    -- Wide play
    (b_crossing_technique, v_coach_id, v_club_id, 'Crossing Technique', 'Different types of crosses', 'Driven, floated, cutback technique', 20, 50, false, 'user'),
    (b_overlap_patterns, v_coach_id, v_club_id, 'Overlap Patterns', 'Fullback and winger combinations', 'Timing of run, decision making', 25, 55, false, 'user'),

    -- Build-up
    (b_gk_distribution, v_coach_id, v_club_id, 'GK Distribution', 'Playing out from the back', 'Angles, timing of pass, composure', 15, 45, false, 'user'),
    (b_buildup_patterns, v_coach_id, v_club_id, 'Build-Up Patterns', 'CB and FB combinations', 'Movement to receive, third man runs', 25, 60, false, 'user'),

    -- Transition
    (b_counter_attack, v_coach_id, v_club_id, 'Counter Attack Drill', 'Quick breaks after winning ball', 'First pass forward, speed of thought', 25, 65, false, 'user'),
    (b_pressing_triggers, v_coach_id, v_club_id, 'Pressing Triggers', 'Team pressing patterns', 'Trigger recognition, coordinated press', 25, 70, false, 'user'),

    -- 1v1
    (b_1v1_attacking, v_coach_id, v_club_id, '1v1 Attacking', 'Taking on defenders', 'Commit defender, change of pace', 25, 75, false, 'user'),

    -- Physical
    (b_speed_agility, v_coach_id, v_club_id, 'Speed & Agility', 'Ladder work and short sprints', 'Technique, explosiveness', 20, 30, false, 'user'),
    (b_endurance, v_coach_id, v_club_id, 'Endurance Circuits', 'High intensity intervals', 'Maintain quality when tired', 25, 40, false, 'user'),

    -- Games
    (b_possession_game, v_coach_id, v_club_id, 'Possession Game', '7v7 keep ball with conditions', 'Ball retention, switch play', 30, 80, false, 'user'),
    (b_small_sided_game, v_coach_id, v_club_id, 'Small-Sided Game', 'Competitive game with focus', 'Apply session learnings', 25, 85, false, 'user'),
    (b_match_simulation, v_coach_id, v_club_id, 'Match Simulation', 'Full game with tactical focus', 'Game management, execution', 40, 75, false, 'user'),

    -- GK Specific (for simultaneous practices)
    (b_gk_shot_stopping, v_coach_id, v_club_id, 'GK Shot Stopping', 'Goalkeeper shot stopping drills', 'Set position, reactions, footwork', 20, 65, false, 'user');

    -- ========================================
    -- SESSIONS (12 sessions over past 8 weeks)
    -- Mix of syllabus-linked and manual
    -- ========================================
    INSERT INTO sessions (id, club_id, team_id, coach_id, session_date, title, content, player_count, duration, age_group, skill_level, syllabus_week_index, syllabus_day_of_week, theme_block_id, theme_snapshot) VALUES
    -- Week 1 - Syllabus linked: Build-Up Play
    (s1, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '8 weeks', 'Build-Up Session', 'Focus on building from the back', 10, 90, 'U14', 'intermediate', 0, 1, gm_buildup_possession::text, '{"zoneName": "Building from the Back", "blockType": "in_possession", "blockName": "Build-Up Play"}'),

    -- Week 2 - Syllabus linked: Clinical Finishing (day 3 = Thursday)
    (s2, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '7 weeks 3 days', 'Finishing Session', 'Shooting drills and finishing in the box', 10, 90, 'U14', 'intermediate', 1, 3, gm_final_third_finishing::text, '{"zoneName": "Final Third", "blockType": "in_possession", "blockName": "Clinical Finishing"}'),

    -- Week 3 - Syllabus linked: Defensive Shape
    (s3, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '7 weeks', 'Defensive Shape', 'Working on defensive organization and 1v1 defending', 10, 90, 'U14', 'intermediate', 2, 1, gm_defensive_shape::text, '{"zoneName": "Defensive Organization", "blockType": "out_of_possession", "blockName": "Defensive Shape"}'),

    -- Week 4 - Manual session (not syllabus linked)
    (s4, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '6 weeks 3 days', 'Wide Play & Crossing', 'Developing attacks down the flanks', 10, 90, 'U14', 'intermediate', NULL, NULL, NULL, NULL),

    -- Week 5 - Syllabus linked: Possession Patterns
    (s5, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '6 weeks', 'Midfield Control', 'Playing out from the back under pressure', 10, 90, 'U14', 'intermediate', 0, 3, gm_midfield_possession::text, '{"zoneName": "Midfield Control", "blockType": "in_possession", "blockName": "Possession Patterns"}'),

    -- Week 6 - Syllabus linked: Counter-Press
    (s6, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '5 weeks 3 days', 'Transition Session', 'Quick transitions and direct play', 10, 90, 'U14', 'intermediate', 3, 3, gm_buildup_transition::text, '{"zoneName": "Building from the Back", "blockType": "out_of_possession", "blockName": "Counter-Press"}'),

    -- Week 7 - Syllabus linked: Chance Creation
    (s7, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '5 weeks', 'Creating Chances', 'Movement patterns and clinical finishing', 10, 90, 'U14', 'intermediate', 1, 1, gm_final_third_creation::text, '{"zoneName": "Final Third", "blockType": "in_possession", "blockName": "Chance Creation"}'),

    -- Week 8 - Manual session
    (s8, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '4 weeks 3 days', 'Midfield Dominance', 'Controlling the middle of the park', 10, 90, 'U14', 'intermediate', NULL, NULL, NULL, NULL),

    -- Week 9 - Syllabus linked: 1v1 Defending
    (s9, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '4 weeks', '1v1 Skills', 'Individual attacking and defending duels', 10, 90, 'U14', 'intermediate', 2, 3, gm_defensive_pressing::text, '{"zoneName": "Defensive Organization", "blockType": "out_of_possession", "blockName": "1v1 Defending"}'),

    -- Week 10 - Syllabus linked: Pressing Triggers
    (s10, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '3 weeks', 'Pressing Session', 'Connecting build-up to goal scoring', 10, 90, 'U14', 'intermediate', 3, 1, gm_midfield_pressing::text, '{"zoneName": "Midfield Control", "blockType": "out_of_possession", "blockName": "Pressing Triggers"}'),

    -- Week 11 - Manual session
    (s11, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '2 weeks', 'Physical & Technical', 'Fitness with technical work', 10, 90, 'U14', 'intermediate', NULL, NULL, NULL, NULL),

    -- Week 12 - Manual session
    (s12, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '1 week', 'Match Preparation', 'Tactical session focusing on weekend opponent', 10, 90, 'U14', 'intermediate', NULL, NULL, NULL, NULL);

    -- ========================================
    -- SESSION BLOCK ASSIGNMENTS
    -- Includes slot_index for simultaneous practices
    -- ========================================

    -- Session 1: Build-Up Session (no simultaneous)
    INSERT INTO session_block_assignments (session_id, block_id, position, slot_index) VALUES
    (s1, b_rondo, 0, 0), (s1, b_gk_distribution, 1, 0), (s1, b_buildup_patterns, 2, 0), (s1, b_possession_game, 3, 0);

    -- Session 2: Finishing (no simultaneous)
    INSERT INTO session_block_assignments (session_id, block_id, position, slot_index) VALUES
    (s2, b_shooting_warmup, 0, 0), (s2, b_finishing_patterns, 1, 0), (s2, b_crossing_finishing, 2, 0), (s2, b_small_sided_game, 3, 0);

    -- Session 3: Defensive Shape - WITH SIMULTANEOUS PRACTICE
    -- Position 1 has both 1v1 Defending (outfield) and GK Shot Stopping (GK only)
    INSERT INTO session_block_assignments (id, session_id, block_id, position, slot_index) VALUES
    (uuid_generate_v4(), s3, b_speed_agility, 0, 0),
    (sba_s3_1v1_defending, s3, b_1v1_defending, 1, 0),        -- Slot 0: Outfield players
    (sba_s3_gk_shot_stopping, s3, b_gk_shot_stopping, 1, 1), -- Slot 1: GK only
    (uuid_generate_v4(), s3, b_defensive_shape, 2, 0),
    (uuid_generate_v4(), s3, b_small_sided_game, 3, 0);

    -- Session 4: Wide Play (no simultaneous)
    INSERT INTO session_block_assignments (session_id, block_id, position, slot_index) VALUES
    (s4, b_crossing_technique, 0, 0), (s4, b_overlap_patterns, 1, 0), (s4, b_crossing_finishing, 2, 0);

    -- Session 5: Midfield Control (no simultaneous)
    INSERT INTO session_block_assignments (session_id, block_id, position, slot_index) VALUES
    (s5, b_rondo, 0, 0), (s5, b_passing_patterns, 1, 0), (s5, b_possession_game, 2, 0);

    -- Session 6: Transition (no simultaneous)
    INSERT INTO session_block_assignments (session_id, block_id, position, slot_index) VALUES
    (s6, b_pressing_triggers, 0, 0), (s6, b_counter_attack, 1, 0), (s6, b_small_sided_game, 2, 0);

    -- Session 7: Creating Chances (no simultaneous)
    INSERT INTO session_block_assignments (session_id, block_id, position, slot_index) VALUES
    (s7, b_receiving_pressure, 0, 0), (s7, b_finishing_patterns, 1, 0), (s7, b_crossing_finishing, 2, 0);

    -- Session 8: Midfield Dominance (no simultaneous)
    INSERT INTO session_block_assignments (session_id, block_id, position, slot_index) VALUES
    (s8, b_rondo, 0, 0), (s8, b_receiving_pressure, 1, 0), (s8, b_passing_patterns, 2, 0), (s8, b_possession_game, 3, 0);

    -- Session 9: 1v1 Skills - WITH SIMULTANEOUS PRACTICE
    -- Position 0 has both 1v1 Attacking (outfield) and GK Distribution (GK only)
    INSERT INTO session_block_assignments (id, session_id, block_id, position, slot_index) VALUES
    (sba_s9_1v1_attacking, s9, b_1v1_attacking, 0, 0),     -- Slot 0: Outfield players
    (sba_s9_gk_distribution, s9, b_gk_distribution, 0, 1), -- Slot 1: GK only
    (uuid_generate_v4(), s9, b_1v1_defending, 1, 0),
    (uuid_generate_v4(), s9, b_small_sided_game, 2, 0);

    -- Session 10: Pressing Session (no simultaneous)
    INSERT INTO session_block_assignments (session_id, block_id, position, slot_index) VALUES
    (s10, b_pressing_triggers, 0, 0), (s10, b_buildup_patterns, 1, 0), (s10, b_match_simulation, 2, 0);

    -- Session 11: Physical & Technical (no simultaneous)
    INSERT INTO session_block_assignments (session_id, block_id, position, slot_index) VALUES
    (s11, b_speed_agility, 0, 0), (s11, b_endurance, 1, 0), (s11, b_rondo, 2, 0), (s11, b_small_sided_game, 3, 0);

    -- Session 12: Match Preparation (no simultaneous)
    INSERT INTO session_block_assignments (session_id, block_id, position, slot_index) VALUES
    (s12, b_pressing_triggers, 0, 0), (s12, b_finishing_patterns, 1, 0), (s12, b_match_simulation, 2, 0);

    -- ========================================
    -- BLOCK PLAYER EXCLUSIONS (for simultaneous practices)
    -- ========================================

    -- Session 3: GK excluded from 1v1 Defending, Outfield excluded from GK Shot Stopping
    INSERT INTO block_player_exclusions (assignment_id, player_id) VALUES
    (sba_s3_1v1_defending, p_gk),      -- GK excluded from 1v1 defending
    (sba_s3_gk_shot_stopping, p_cb1),  -- Outfield excluded from GK drill
    (sba_s3_gk_shot_stopping, p_cb2),
    (sba_s3_gk_shot_stopping, p_fb1),
    (sba_s3_gk_shot_stopping, p_fb2),
    (sba_s3_gk_shot_stopping, p_mf1),
    (sba_s3_gk_shot_stopping, p_mf2),
    (sba_s3_gk_shot_stopping, p_w1),
    (sba_s3_gk_shot_stopping, p_w2),
    (sba_s3_gk_shot_stopping, p_st);

    -- Session 9: GK excluded from 1v1 Attacking, Outfield excluded from GK Distribution
    INSERT INTO block_player_exclusions (assignment_id, player_id) VALUES
    (sba_s9_1v1_attacking, p_gk),      -- GK excluded from 1v1 attacking
    (sba_s9_gk_distribution, p_cb1),   -- Outfield excluded from GK drill
    (sba_s9_gk_distribution, p_cb2),
    (sba_s9_gk_distribution, p_fb1),
    (sba_s9_gk_distribution, p_fb2),
    (sba_s9_gk_distribution, p_mf1),
    (sba_s9_gk_distribution, p_mf2),
    (sba_s9_gk_distribution, p_w1),
    (sba_s9_gk_distribution, p_w2),
    (sba_s9_gk_distribution, p_st);

    -- ========================================
    -- SESSION BLOCK ATTRIBUTES with order_type
    -- ========================================

    -- Rondo - receiving and passing (first order)
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_rondo, 'strong_ability_to_receive_under_pressure_in_build_up', 'first', 1.0, 'coach'),
    (b_rondo, 'strong_ability_to_pass_short_and_medium_passes', 'first', 1.0, 'coach'),
    (b_rondo, 'strong_ability_to_receive_on_the_half_turn', 'second', 0.5, 'coach');

    -- Passing Patterns
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_passing_patterns, 'strong_ability_to_receive_on_the_half_turn', 'first', 1.0, 'coach'),
    (b_passing_patterns, 'strong_ability_to_pass_short_and_medium_passes', 'first', 1.0, 'coach'),
    (b_passing_patterns, 'strong_ability_to_break_lines_using_passing', 'second', 0.5, 'coach');

    -- Receiving Under Pressure
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_receiving_pressure, 'strong_ability_to_receive_on_the_half_turn', 'first', 1.0, 'coach'),
    (b_receiving_pressure, 'strong_ability_to_receive_in_tight_areas', 'first', 1.0, 'coach');

    -- Shooting Warm-Up - GK second order
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_shooting_warmup, 'strong_ability_to_score_inside_the_box', 'first', 1.0, 'coach'),
    (b_shooting_warmup, 'strong_ability_to_score_outside_the_box', 'second', 0.5, 'coach');

    -- Finishing Patterns
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_finishing_patterns, 'strong_ability_to_score_inside_the_box', 'first', 1.0, 'coach'),
    (b_finishing_patterns, 'strong_ability_to_receive_on_the_half_turn', 'first', 1.0, 'coach'),
    (b_finishing_patterns, 'strong_ability_to_make_runs_beyond_the_back_line', 'second', 0.5, 'coach');

    -- Crossing & Finishing
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_crossing_finishing, 'strong_ability_to_use_a_variety_of_crossing_types', 'first', 1.0, 'coach'),
    (b_crossing_finishing, 'strong_ability_to_score_inside_the_box', 'first', 1.0, 'coach'),
    (b_crossing_finishing, 'strong_ability_to_make_runs_beyond_the_back_line', 'second', 0.5, 'coach');

    -- 1v1 Defending
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_1v1_defending, 'strong_ability_to_defend_1v1', 'first', 1.0, 'coach'),
    (b_1v1_defending, 'strong_ability_to_track_runners', 'second', 0.5, 'coach');

    -- Defensive Shape
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_defensive_shape, 'strong_ability_to_organise_teammates', 'first', 1.0, 'coach'),
    (b_defensive_shape, 'strong_ability_to_defend_1v1', 'second', 0.5, 'coach'),
    (b_defensive_shape, 'strong_communication', 'first', 1.0, 'coach');

    -- Crossing Technique
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_crossing_technique, 'strong_ability_to_use_a_variety_of_crossing_types', 'first', 1.0, 'coach');

    -- Overlap Patterns
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_overlap_patterns, 'strong_ability_to_use_a_variety_of_crossing_types', 'first', 1.0, 'coach'),
    (b_overlap_patterns, 'strong_ability_to_make_underlapping_and_overlapping_runs', 'first', 1.0, 'coach');

    -- GK Distribution
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_gk_distribution, 'strong_ability_to_receive_under_pressure_in_build_up', 'first', 1.0, 'coach'),
    (b_gk_distribution, 'strong_ability_to_pass_short_and_medium_passes', 'first', 1.0, 'coach');

    -- Build-Up Patterns
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_buildup_patterns, 'strong_ability_to_break_lines_using_passing', 'first', 1.0, 'coach'),
    (b_buildup_patterns, 'strong_ability_to_carry_the_ball_up_the_pitch', 'first', 1.0, 'coach'),
    (b_buildup_patterns, 'strong_ability_to_receive_on_the_half_turn', 'second', 0.5, 'coach');

    -- Counter Attack
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_counter_attack, 'strong_ability_to_make_runs_beyond_the_back_line', 'first', 1.0, 'coach'),
    (b_counter_attack, 'strong_acceleration', 'first', 1.0, 'coach'),
    (b_counter_attack, 'strong_ability_to_score_inside_the_box', 'second', 0.5, 'coach');

    -- Pressing Triggers
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_pressing_triggers, 'strong_ability_to_press_intelligently', 'first', 1.0, 'coach'),
    (b_pressing_triggers, 'strong_communication', 'second', 0.5, 'coach');

    -- 1v1 Attacking
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_1v1_attacking, 'strong_ability_to_dominate_opponents_in_1v1_attacking_situations', 'first', 1.0, 'coach'),
    (b_1v1_attacking, 'strong_ability_to_score_inside_the_box', 'second', 0.5, 'coach');

    -- Speed & Agility
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_speed_agility, 'strong_acceleration', 'first', 1.0, 'coach'),
    (b_speed_agility, 'strong_agility', 'first', 1.0, 'coach');

    -- Endurance
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_endurance, 'strong_aerobic_endurance', 'first', 1.0, 'coach'),
    (b_endurance, 'strong_ability_to_repeat_high_intensity_actions', 'first', 1.0, 'coach');

    -- Possession Game
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_possession_game, 'strong_ability_to_receive_on_the_half_turn', 'first', 1.0, 'coach'),
    (b_possession_game, 'strong_ability_to_press_intelligently', 'second', 0.5, 'coach'),
    (b_possession_game, 'strong_ability_to_break_lines_using_passing', 'second', 0.5, 'coach');

    -- Small-Sided Game
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_small_sided_game, 'strong_ability_to_score_inside_the_box', 'second', 0.5, 'coach'),
    (b_small_sided_game, 'strong_ability_to_defend_1v1', 'second', 0.5, 'coach');

    -- Match Simulation
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_match_simulation, 'strong_ability_to_press_intelligently', 'second', 0.5, 'coach'),
    (b_match_simulation, 'strong_ability_to_receive_on_the_half_turn', 'second', 0.5, 'coach');

    -- GK Shot Stopping
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_gk_shot_stopping, 'strong_ability_to_receive_under_pressure_in_build_up', 'first', 1.0, 'coach');

    -- ========================================
    -- SESSION ATTENDANCE (varied attendance patterns)
    -- ========================================
    -- Session 1 - All present
    INSERT INTO session_attendance (session_id, player_id, status) VALUES
    (s1, p_gk, 'present'), (s1, p_cb1, 'present'), (s1, p_cb2, 'present'),
    (s1, p_fb1, 'present'), (s1, p_fb2, 'present'), (s1, p_mf1, 'present'),
    (s1, p_mf2, 'present'), (s1, p_w1, 'present'), (s1, p_w2, 'present'), (s1, p_st, 'present');

    -- Session 2 - W2 and MF2 absent (miss finishing session)
    INSERT INTO session_attendance (session_id, player_id, status) VALUES
    (s2, p_gk, 'present'), (s2, p_cb1, 'present'), (s2, p_cb2, 'present'),
    (s2, p_fb1, 'present'), (s2, p_fb2, 'present'), (s2, p_mf1, 'present'),
    (s2, p_mf2, 'absent'), (s2, p_w1, 'present'), (s2, p_w2, 'absent'), (s2, p_st, 'present');

    -- Session 3 - FB1 absent (misses defending session)
    INSERT INTO session_attendance (session_id, player_id, status) VALUES
    (s3, p_gk, 'present'), (s3, p_cb1, 'present'), (s3, p_cb2, 'present'),
    (s3, p_fb1, 'absent'), (s3, p_fb2, 'present'), (s3, p_mf1, 'present'),
    (s3, p_mf2, 'present'), (s3, p_w1, 'present'), (s3, p_w2, 'present'), (s3, p_st, 'present');

    -- Session 4 - All present
    INSERT INTO session_attendance (session_id, player_id, status) VALUES
    (s4, p_gk, 'present'), (s4, p_cb1, 'present'), (s4, p_cb2, 'present'),
    (s4, p_fb1, 'present'), (s4, p_fb2, 'present'), (s4, p_mf1, 'present'),
    (s4, p_mf2, 'present'), (s4, p_w1, 'present'), (s4, p_w2, 'present'), (s4, p_st, 'present');

    -- Session 5 - CB1, FB2, W1 absent
    INSERT INTO session_attendance (session_id, player_id, status) VALUES
    (s5, p_gk, 'present'), (s5, p_cb1, 'absent'), (s5, p_cb2, 'present'),
    (s5, p_fb1, 'present'), (s5, p_fb2, 'absent'), (s5, p_mf1, 'present'),
    (s5, p_mf2, 'present'), (s5, p_w1, 'absent'), (s5, p_w2, 'present'), (s5, p_st, 'present');

    -- Session 6 - W2 absent
    INSERT INTO session_attendance (session_id, player_id, status) VALUES
    (s6, p_gk, 'present'), (s6, p_cb1, 'present'), (s6, p_cb2, 'present'),
    (s6, p_fb1, 'present'), (s6, p_fb2, 'present'), (s6, p_mf1, 'present'),
    (s6, p_mf2, 'present'), (s6, p_w1, 'present'), (s6, p_w2, 'absent'), (s6, p_st, 'present');

    -- Session 7 - All present
    INSERT INTO session_attendance (session_id, player_id, status) VALUES
    (s7, p_gk, 'present'), (s7, p_cb1, 'present'), (s7, p_cb2, 'present'),
    (s7, p_fb1, 'present'), (s7, p_fb2, 'present'), (s7, p_mf1, 'present'),
    (s7, p_mf2, 'present'), (s7, p_w1, 'present'), (s7, p_w2, 'present'), (s7, p_st, 'present');

    -- Session 8 - CB2, MF1 absent
    INSERT INTO session_attendance (session_id, player_id, status) VALUES
    (s8, p_gk, 'present'), (s8, p_cb1, 'present'), (s8, p_cb2, 'absent'),
    (s8, p_fb1, 'present'), (s8, p_fb2, 'present'), (s8, p_mf1, 'absent'),
    (s8, p_mf2, 'present'), (s8, p_w1, 'present'), (s8, p_w2, 'present'), (s8, p_st, 'present');

    -- Session 9 - All present
    INSERT INTO session_attendance (session_id, player_id, status) VALUES
    (s9, p_gk, 'present'), (s9, p_cb1, 'present'), (s9, p_cb2, 'present'),
    (s9, p_fb1, 'present'), (s9, p_fb2, 'present'), (s9, p_mf1, 'present'),
    (s9, p_mf2, 'present'), (s9, p_w1, 'present'), (s9, p_w2, 'present'), (s9, p_st, 'present');

    -- Session 10 - MF2 absent
    INSERT INTO session_attendance (session_id, player_id, status) VALUES
    (s10, p_gk, 'present'), (s10, p_cb1, 'present'), (s10, p_cb2, 'present'),
    (s10, p_fb1, 'present'), (s10, p_fb2, 'present'), (s10, p_mf1, 'present'),
    (s10, p_mf2, 'absent'), (s10, p_w1, 'present'), (s10, p_w2, 'present'), (s10, p_st, 'present');

    -- Session 11 - GK, W2 absent
    INSERT INTO session_attendance (session_id, player_id, status) VALUES
    (s11, p_gk, 'absent'), (s11, p_cb1, 'present'), (s11, p_cb2, 'present'),
    (s11, p_fb1, 'present'), (s11, p_fb2, 'present'), (s11, p_mf1, 'present'),
    (s11, p_mf2, 'present'), (s11, p_w1, 'present'), (s11, p_w2, 'absent'), (s11, p_st, 'present');

    -- Session 12 - All present
    INSERT INTO session_attendance (session_id, player_id, status) VALUES
    (s12, p_gk, 'present'), (s12, p_cb1, 'present'), (s12, p_cb2, 'present'),
    (s12, p_fb1, 'present'), (s12, p_fb2, 'present'), (s12, p_mf1, 'present'),
    (s12, p_mf2, 'present'), (s12, p_w1, 'present'), (s12, p_w2, 'present'), (s12, p_st, 'present');

    -- ========================================
    -- PLAYER TRAINING EVENTS
    -- Generated from attendance + session block attributes
    -- ========================================

    -- Session 1 training events (all attended)
    INSERT INTO player_training_events (player_id, session_id, attribute_key, weight)
    SELECT p.id, s1, sba.attribute_key, sba.relevance
    FROM (VALUES (p_gk), (p_cb1), (p_cb2), (p_fb1), (p_fb2), (p_mf1), (p_mf2), (p_w1), (p_w2), (p_st)) AS p(id)
    CROSS JOIN session_block_attributes sba
    WHERE sba.block_id IN (b_rondo, b_gk_distribution, b_buildup_patterns, b_possession_game)
    ON CONFLICT (player_id, session_id, attribute_key) DO NOTHING;

    -- Session 2 training events (W2, MF2 absent)
    INSERT INTO player_training_events (player_id, session_id, attribute_key, weight)
    SELECT p.id, s2, sba.attribute_key, sba.relevance
    FROM (VALUES (p_gk), (p_cb1), (p_cb2), (p_fb1), (p_fb2), (p_mf1), (p_w1), (p_st)) AS p(id)
    CROSS JOIN session_block_attributes sba
    WHERE sba.block_id IN (b_shooting_warmup, b_finishing_patterns, b_crossing_finishing, b_small_sided_game)
    ON CONFLICT (player_id, session_id, attribute_key) DO NOTHING;

    -- Session 3 training events (FB1 absent)
    INSERT INTO player_training_events (player_id, session_id, attribute_key, weight)
    SELECT p.id, s3, sba.attribute_key, sba.relevance
    FROM (VALUES (p_gk), (p_cb1), (p_cb2), (p_fb2), (p_mf1), (p_mf2), (p_w1), (p_w2), (p_st)) AS p(id)
    CROSS JOIN session_block_attributes sba
    WHERE sba.block_id IN (b_speed_agility, b_1v1_defending, b_defensive_shape, b_small_sided_game)
    ON CONFLICT (player_id, session_id, attribute_key) DO NOTHING;

    -- Session 4 training events (all attended)
    INSERT INTO player_training_events (player_id, session_id, attribute_key, weight)
    SELECT p.id, s4, sba.attribute_key, sba.relevance
    FROM (VALUES (p_gk), (p_cb1), (p_cb2), (p_fb1), (p_fb2), (p_mf1), (p_mf2), (p_w1), (p_w2), (p_st)) AS p(id)
    CROSS JOIN session_block_attributes sba
    WHERE sba.block_id IN (b_crossing_technique, b_overlap_patterns, b_crossing_finishing)
    ON CONFLICT (player_id, session_id, attribute_key) DO NOTHING;

    -- Session 5 training events (CB1, FB2, W1 absent)
    INSERT INTO player_training_events (player_id, session_id, attribute_key, weight)
    SELECT p.id, s5, sba.attribute_key, sba.relevance
    FROM (VALUES (p_gk), (p_cb2), (p_fb1), (p_mf1), (p_mf2), (p_w2), (p_st)) AS p(id)
    CROSS JOIN session_block_attributes sba
    WHERE sba.block_id IN (b_rondo, b_passing_patterns, b_possession_game)
    ON CONFLICT (player_id, session_id, attribute_key) DO NOTHING;

    -- Session 6 training events (W2 absent)
    INSERT INTO player_training_events (player_id, session_id, attribute_key, weight)
    SELECT p.id, s6, sba.attribute_key, sba.relevance
    FROM (VALUES (p_gk), (p_cb1), (p_cb2), (p_fb1), (p_fb2), (p_mf1), (p_mf2), (p_w1), (p_st)) AS p(id)
    CROSS JOIN session_block_attributes sba
    WHERE sba.block_id IN (b_pressing_triggers, b_counter_attack, b_small_sided_game)
    ON CONFLICT (player_id, session_id, attribute_key) DO NOTHING;

    -- Session 7 training events (all attended)
    INSERT INTO player_training_events (player_id, session_id, attribute_key, weight)
    SELECT p.id, s7, sba.attribute_key, sba.relevance
    FROM (VALUES (p_gk), (p_cb1), (p_cb2), (p_fb1), (p_fb2), (p_mf1), (p_mf2), (p_w1), (p_w2), (p_st)) AS p(id)
    CROSS JOIN session_block_attributes sba
    WHERE sba.block_id IN (b_receiving_pressure, b_finishing_patterns, b_crossing_finishing)
    ON CONFLICT (player_id, session_id, attribute_key) DO NOTHING;

    -- Session 8 training events (CB2, MF1 absent)
    INSERT INTO player_training_events (player_id, session_id, attribute_key, weight)
    SELECT p.id, s8, sba.attribute_key, sba.relevance
    FROM (VALUES (p_gk), (p_cb1), (p_fb1), (p_fb2), (p_mf2), (p_w1), (p_w2), (p_st)) AS p(id)
    CROSS JOIN session_block_attributes sba
    WHERE sba.block_id IN (b_rondo, b_receiving_pressure, b_passing_patterns, b_possession_game)
    ON CONFLICT (player_id, session_id, attribute_key) DO NOTHING;

    -- Session 9 training events (all attended)
    INSERT INTO player_training_events (player_id, session_id, attribute_key, weight)
    SELECT p.id, s9, sba.attribute_key, sba.relevance
    FROM (VALUES (p_gk), (p_cb1), (p_cb2), (p_fb1), (p_fb2), (p_mf1), (p_mf2), (p_w1), (p_w2), (p_st)) AS p(id)
    CROSS JOIN session_block_attributes sba
    WHERE sba.block_id IN (b_1v1_attacking, b_1v1_defending, b_small_sided_game)
    ON CONFLICT (player_id, session_id, attribute_key) DO NOTHING;

    -- Session 10 training events (MF2 absent)
    INSERT INTO player_training_events (player_id, session_id, attribute_key, weight)
    SELECT p.id, s10, sba.attribute_key, sba.relevance
    FROM (VALUES (p_gk), (p_cb1), (p_cb2), (p_fb1), (p_fb2), (p_mf1), (p_w1), (p_w2), (p_st)) AS p(id)
    CROSS JOIN session_block_attributes sba
    WHERE sba.block_id IN (b_pressing_triggers, b_buildup_patterns, b_match_simulation)
    ON CONFLICT (player_id, session_id, attribute_key) DO NOTHING;

    -- Session 11 training events (GK, W2 absent)
    INSERT INTO player_training_events (player_id, session_id, attribute_key, weight)
    SELECT p.id, s11, sba.attribute_key, sba.relevance
    FROM (VALUES (p_cb1), (p_cb2), (p_fb1), (p_fb2), (p_mf1), (p_mf2), (p_w1), (p_st)) AS p(id)
    CROSS JOIN session_block_attributes sba
    WHERE sba.block_id IN (b_speed_agility, b_endurance, b_rondo, b_small_sided_game)
    ON CONFLICT (player_id, session_id, attribute_key) DO NOTHING;

    -- Session 12 training events (all attended)
    INSERT INTO player_training_events (player_id, session_id, attribute_key, weight)
    SELECT p.id, s12, sba.attribute_key, sba.relevance
    FROM (VALUES (p_gk), (p_cb1), (p_cb2), (p_fb1), (p_fb2), (p_mf1), (p_mf2), (p_w1), (p_w2), (p_st)) AS p(id)
    CROSS JOIN session_block_attributes sba
    WHERE sba.block_id IN (b_pressing_triggers, b_finishing_patterns, b_match_simulation)
    ON CONFLICT (player_id, session_id, attribute_key) DO NOTHING;

    -- ========================================
    -- SESSION FEEDBACK
    -- ========================================
    f1 := uuid_generate_v4(); f2 := uuid_generate_v4(); f3 := uuid_generate_v4();
    f4 := uuid_generate_v4(); f5 := uuid_generate_v4(); f6 := uuid_generate_v4();
    f7 := uuid_generate_v4(); f8 := uuid_generate_v4(); f9 := uuid_generate_v4();
    f10 := uuid_generate_v4(); f11 := uuid_generate_v4(); f12 := uuid_generate_v4();

    INSERT INTO session_feedback (id, session_id, coach_id, team_feedback, overall_rating, processed_at) VALUES
    (f1, s1, v_coach_id, 'Good intensity in the rondos. Players understanding build-up patterns better. Need work on final third entries.', 4, NOW() - INTERVAL '7 weeks'),
    (f2, s2, v_coach_id, 'Finishing was sharp today. Michael and Chris clinical. Some need more composure in front of goal.', 4, NOW() - INTERVAL '7 weeks'),
    (f3, s3, v_coach_id, 'Defensive organization improving. James excellent as organizer. 1v1 defending needs work from Omar.', 3, NOW() - INTERVAL '6 weeks'),
    (f4, s4, v_coach_id, 'Excellent wide play session. Ryan and Jamal combining well. Need more variety in crossing types.', 4, NOW() - INTERVAL '6 weeks'),
    (f5, s5, v_coach_id, 'Build-up play more confident. Marcus improving distribution. CBs need to be braver in possession.', 3, NOW() - INTERVAL '5 weeks'),
    (f6, s6, v_coach_id, 'Counter attacks looking dangerous. Good transition speed. Final third decisions need improvement.', 4, NOW() - INTERVAL '5 weeks'),
    (f7, s7, v_coach_id, 'Movement patterns improving. Tom and Michael linking up well. Finishing still inconsistent from wide areas.', 4, NOW() - INTERVAL '4 weeks'),
    (f8, s8, v_coach_id, 'Midfield controlling games better. Tom excellent on the half-turn. Need more penetrating passes.', 4, NOW() - INTERVAL '4 weeks'),
    (f9, s9, v_coach_id, 'Great 1v1 energy. Chris and Jamal confident taking on defenders. Omar defending much better today.', 5, NOW() - INTERVAL '3 weeks'),
    (f10, s10, v_coach_id, 'Pressing triggers being recognized. Alex leading the press well. Need to sustain intensity longer.', 4, NOW() - INTERVAL '2 weeks'),
    (f11, s11, v_coach_id, 'Physical numbers looking good. Maintaining quality while tired. Mental toughness improving.', 4, NOW() - INTERVAL '1 week'),
    (f12, s12, v_coach_id, 'Ready for the match. Tactical understanding clear. Confident heading into weekend.', 4, NOW());

    -- ========================================
    -- PLAYER FEEDBACK NOTES
    -- ========================================
    INSERT INTO player_feedback_notes (session_feedback_id, player_id, note) VALUES
    -- Session 1 notes
    (f1, p_mf1, 'Alex positioning in rondos excellent, creating space well'),
    (f1, p_mf2, 'Tom receiving on half turn improving significantly'),
    (f1, p_cb2, 'David composed on the ball, good line-breaking passes'),

    -- Session 2 notes
    (f2, p_st, 'Michael clinical today - 4 goals from 5 chances'),
    (f2, p_w1, 'Chris finishing improving when cutting inside'),
    (f2, p_fb1, 'Ryan delivery much improved, variety in crosses'),

    -- Session 3 notes
    (f3, p_cb1, 'James organizing well, dominant in defensive duels'),
    (f3, p_fb2, 'Omar needs to stay on feet more in 1v1s'),
    (f3, p_gk, 'Marcus shot stopping excellent in GK drills'),

    -- Session 4 notes
    (f4, p_w2, 'Jamal crossing technique improving'),
    (f4, p_fb1, 'Ryan overlap timing excellent, delivery consistent'),

    -- Session 5 notes
    (f5, p_gk, 'Marcus distribution much better, composure on ball'),
    (f5, p_cb2, 'David brave stepping out, progressive passing'),
    (f5, p_mf2, 'Tom receiving and turning quickly'),

    -- Session 6 notes
    (f6, p_w1, 'Chris pace causing problems on counter'),
    (f6, p_st, 'Michael movement in behind excellent'),
    (f6, p_mf1, 'Alex pressing triggers improving'),

    -- Session 7 notes
    (f7, p_st, 'Michael and Tom combining well in final third'),
    (f7, p_mf2, 'Tom half-turn receiving excellent'),
    (f7, p_w2, 'Jamal finishing improving, hitting target more'),

    -- Session 8 notes
    (f8, p_mf2, 'Tom dictating tempo, excellent vision'),
    (f8, p_st, 'Michael receiving and turning quickly'),

    -- Session 9 notes
    (f9, p_w1, 'Chris dominating 1v1 attacking situations'),
    (f9, p_fb2, 'Omar 1v1 defending much improved'),
    (f9, p_cb1, 'James solid in defensive duels'),

    -- Session 10 notes
    (f10, p_mf1, 'Alex leading press excellently'),
    (f10, p_cb2, 'David break-lines passing confident'),
    (f10, p_st, 'Michael pressing from front intelligent'),

    -- Session 11 notes
    (f11, p_mf1, 'Alex fitness levels impressive, endurance outstanding'),
    (f11, p_cb1, 'James maintaining focus when tired'),

    -- Session 12 notes
    (f12, p_cb1, 'James ready to lead from the back'),
    (f12, p_st, 'Michael confident for match day'),
    (f12, p_mf1, 'Alex pressing discipline excellent');

    -- ========================================
    -- FEEDBACK INSIGHTS (LLM-extracted)
    -- ========================================
    INSERT INTO feedback_insights (session_feedback_id, player_id, attribute_key, sentiment, confidence, extracted_text) VALUES
    -- Session 1 insights
    (f1, p_mf1, 'strong_ability_to_receive_on_the_half_turn', 'positive', 0.85, 'Alex positioning in rondos excellent'),
    (f1, p_mf2, 'strong_ability_to_receive_on_the_half_turn', 'positive', 0.9, 'Tom receiving on half turn improving significantly'),
    (f1, p_cb2, 'strong_ability_to_break_lines_using_passing', 'positive', 0.88, 'David composed on the ball, good line-breaking passes'),

    -- Session 2 insights
    (f2, p_st, 'strong_ability_to_score_inside_the_box', 'positive', 0.95, 'Michael clinical today - 4 goals from 5 chances'),
    (f2, p_w1, 'strong_ability_to_score_inside_the_box', 'positive', 0.8, 'Chris finishing improving when cutting inside'),
    (f2, p_fb1, 'strong_ability_to_use_a_variety_of_crossing_types', 'positive', 0.85, 'Ryan delivery much improved, variety in crosses'),

    -- Session 3 insights
    (f3, p_cb1, 'strong_ability_to_organise_teammates', 'positive', 0.9, 'James organizing well'),
    (f3, p_cb1, 'strong_ability_to_defend_1v1', 'positive', 0.85, 'dominant in defensive duels'),
    (f3, p_fb2, 'strong_ability_to_defend_1v1', 'negative', 0.75, 'Omar needs to stay on feet more in 1v1s'),

    -- Session 4 insights
    (f4, p_w2, 'strong_ability_to_use_a_variety_of_crossing_types', 'positive', 0.8, 'Jamal crossing technique improving'),
    (f4, p_fb1, 'strong_ability_to_use_a_variety_of_crossing_types', 'positive', 0.88, 'Ryan overlap timing excellent, delivery consistent'),

    -- Session 5 insights
    (f5, p_gk, 'strong_ability_to_pass_short_and_medium_passes', 'positive', 0.85, 'Marcus distribution much better'),
    (f5, p_cb2, 'strong_ability_to_carry_the_ball_up_the_pitch', 'positive', 0.8, 'David brave stepping out'),
    (f5, NULL, NULL, 'neutral', 0.7, 'CBs need to be braver in possession'),

    -- Session 6 insights
    (f6, p_st, 'strong_ability_to_make_runs_beyond_the_back_line', 'positive', 0.9, 'Michael movement in behind excellent'),
    (f6, p_mf1, 'strong_ability_to_press_intelligently', 'positive', 0.8, 'Alex pressing triggers improving'),

    -- Session 7 insights
    (f7, p_mf2, 'strong_ability_to_receive_on_the_half_turn', 'positive', 0.92, 'Tom half-turn receiving excellent'),
    (f7, p_w2, 'strong_ability_to_score_inside_the_box', 'positive', 0.75, 'Jamal finishing improving, hitting target more'),

    -- Session 8 insights
    (f8, p_mf2, 'strong_ability_to_break_lines_using_passing', 'positive', 0.88, 'Tom dictating tempo, excellent vision'),

    -- Session 9 insights
    (f9, p_w1, 'strong_ability_to_dominate_opponents_in_1v1_attacking_situations', 'positive', 0.95, 'Chris dominating 1v1 attacking situations'),
    (f9, p_fb2, 'strong_ability_to_defend_1v1', 'positive', 0.85, 'Omar 1v1 defending much improved'),
    (f9, p_cb1, 'strong_ability_to_defend_1v1', 'positive', 0.82, 'James solid in defensive duels'),

    -- Session 10 insights
    (f10, p_mf1, 'strong_ability_to_press_intelligently', 'positive', 0.9, 'Alex leading press excellently'),
    (f10, p_cb2, 'strong_ability_to_break_lines_using_passing', 'positive', 0.85, 'David break-lines passing confident'),

    -- Session 11 insights
    (f11, p_mf1, 'strong_aerobic_endurance', 'positive', 0.95, 'Alex fitness levels impressive, endurance outstanding'),

    -- Session 12 insights
    (f12, p_cb1, 'strong_communication', 'positive', 0.85, 'James ready to lead from the back'),
    (f12, p_mf1, 'strong_ability_to_press_intelligently', 'positive', 0.88, 'Alex pressing discipline excellent');

    RAISE NOTICE 'Demo data inserted successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '=== V3 FEATURES DEMONSTRATED ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Game Model: 4 zones with 8 blocks';
    RAISE NOTICE 'Training Syllabus: 4-week cycle linked to Game Model';
    RAISE NOTICE 'Sessions: 12 (8 syllabus-linked, 4 manual)';
    RAISE NOTICE 'Simultaneous Practices: 2 sessions with GK/Outfield split';
    RAISE NOTICE 'Block Player Exclusions: 20 records';
    RAISE NOTICE '';
    RAISE NOTICE 'Players: 10';
    RAISE NOTICE 'Player IDPs: 24 (with significant overlap)';
    RAISE NOTICE 'Reusable Blocks: 21 (with ball_rolling percentages)';
    RAISE NOTICE 'Block Attributes: 40+ (with order_type first/second)';
    RAISE NOTICE 'Attendance records: 120';
    RAISE NOTICE 'Feedback Insights: 25 (with sentiment)';
    RAISE NOTICE '';
    RAISE NOTICE 'IDP Overlaps:';
    RAISE NOTICE '  - score_inside_the_box: ST, W1, W2, MF2 (4 players)';
    RAISE NOTICE '  - receive_on_the_half_turn: MF1, MF2, ST (3 players)';
    RAISE NOTICE '  - defend_1v1: CB1, FB1, FB2 (3 players)';
    RAISE NOTICE '  - press_intelligently: MF1, MF2, W1 (3 players)';
    RAISE NOTICE '  - crossing_types: FB1, W2 (2 players)';
    RAISE NOTICE '  - break_lines_passing: CB2, MF2 (2 players)';

END $$;
