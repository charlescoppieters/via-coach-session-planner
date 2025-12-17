-- ========================================
-- VIA SESSION PLANNER V3 - Demo Data
-- ========================================
-- Run this to populate test data for the analytics dashboard
-- Prerequisites: schema.sql and seed.sql must be run first
-- ========================================

-- Configuration
DO $$
DECLARE
    v_club_id UUID := 'fa2f60de-72bb-4310-b2cc-9d127d346f3d';
    v_team_id UUID := 'd7e55751-810d-46db-9d78-33977b1d1712';
    v_coach_id UUID := '96c08ad4-ae8b-41e7-9d3d-c96b872c631d';

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

    -- Reusable Block IDs (fewer blocks, used multiple times)
    -- Warm-up / Technical blocks
    b_rondo UUID := uuid_generate_v4();
    b_passing_patterns UUID := uuid_generate_v4();
    b_receiving_pressure UUID := uuid_generate_v4();

    -- Finishing blocks
    b_shooting_warmup UUID := uuid_generate_v4();
    b_finishing_patterns UUID := uuid_generate_v4();
    b_crossing_finishing UUID := uuid_generate_v4();

    -- Defensive blocks
    b_1v1_defending UUID := uuid_generate_v4();
    b_defensive_shape UUID := uuid_generate_v4();

    -- Wide play blocks
    b_crossing_technique UUID := uuid_generate_v4();
    b_overlap_patterns UUID := uuid_generate_v4();

    -- Build-up blocks
    b_gk_distribution UUID := uuid_generate_v4();
    b_buildup_patterns UUID := uuid_generate_v4();

    -- Transition blocks
    b_counter_attack UUID := uuid_generate_v4();
    b_pressing_triggers UUID := uuid_generate_v4();

    -- 1v1 blocks
    b_1v1_attacking UUID := uuid_generate_v4();

    -- Physical blocks
    b_speed_agility UUID := uuid_generate_v4();
    b_endurance UUID := uuid_generate_v4();

    -- Game blocks
    b_possession_game UUID := uuid_generate_v4();
    b_small_sided_game UUID := uuid_generate_v4();
    b_match_simulation UUID := uuid_generate_v4();

    -- Feedback IDs
    f1 UUID; f2 UUID; f3 UUID; f4 UUID; f5 UUID;
    f6 UUID; f7 UUID; f8 UUID; f9 UUID; f10 UUID;
    f11 UUID; f12 UUID;

BEGIN
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
    -- SESSIONS (12 sessions over past 8 weeks)
    -- ========================================
    INSERT INTO sessions (id, club_id, team_id, coach_id, session_date, title, content, player_count, duration, age_group, skill_level) VALUES
    (s1, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '8 weeks', 'Possession & Pressing', 'Focus on keeping possession under pressure and pressing triggers', 10, 90, 'U14', 'intermediate'),
    (s2, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '7 weeks 3 days', 'Finishing Session', 'Shooting drills and finishing in the box', 10, 90, 'U14', 'intermediate'),
    (s3, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '7 weeks', 'Defensive Shape', 'Working on defensive organization and 1v1 defending', 10, 90, 'U14', 'intermediate'),
    (s4, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '6 weeks 3 days', 'Wide Play & Crossing', 'Developing attacks down the flanks', 10, 90, 'U14', 'intermediate'),
    (s5, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '6 weeks', 'Build-Up Play', 'Playing out from the back under pressure', 10, 90, 'U14', 'intermediate'),
    (s6, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '5 weeks 3 days', 'Counter Attacking', 'Quick transitions and direct play', 10, 90, 'U14', 'intermediate'),
    (s7, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '5 weeks', 'Finishing & Movement', 'Movement patterns and clinical finishing', 10, 90, 'U14', 'intermediate'),
    (s8, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '4 weeks 3 days', 'Midfield Dominance', 'Controlling the middle of the park', 10, 90, 'U14', 'intermediate'),
    (s9, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '4 weeks', '1v1 Skills', 'Individual attacking and defending duels', 10, 90, 'U14', 'intermediate'),
    (s10, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '3 weeks', 'Build-Up & Finishing', 'Connecting build-up to goal scoring', 10, 90, 'U14', 'intermediate'),
    (s11, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '2 weeks', 'Physical & Technical', 'Fitness with technical work', 10, 90, 'U14', 'intermediate'),
    (s12, v_club_id, v_team_id, v_coach_id, NOW() - INTERVAL '1 week', 'Match Preparation', 'Tactical session focusing on weekend opponent', 10, 90, 'U14', 'intermediate');

    -- ========================================
    -- SESSION BLOCKS (reusable across sessions)
    -- ========================================
    INSERT INTO session_blocks (id, creator_id, club_id, title, description, coaching_points, duration, is_public, source) VALUES
    -- Warm-up / Technical
    (b_rondo, v_coach_id, v_club_id, 'Rondo 4v2', 'Quick passing under pressure', 'Quick feet, body shape, communication', 15, false, 'user'),
    (b_passing_patterns, v_coach_id, v_club_id, 'Passing Patterns', 'Combination play and movement', 'Weight of pass, movement after', 20, false, 'user'),
    (b_receiving_pressure, v_coach_id, v_club_id, 'Receiving Under Pressure', 'Technical receiving in tight spaces', 'Body shape, first touch direction', 20, false, 'user'),

    -- Finishing
    (b_shooting_warmup, v_coach_id, v_club_id, 'Shooting Warm-Up', 'Basic finishing drills', 'Technique, placement over power', 15, false, 'user'),
    (b_finishing_patterns, v_coach_id, v_club_id, 'Finishing Patterns', 'Combination play into finish', 'Movement before shot, first touch setup', 20, false, 'user'),
    (b_crossing_finishing, v_coach_id, v_club_id, 'Crossing & Finishing', 'Wide delivery and attacking crosses', 'Timing runs, near/far post movement', 25, false, 'user'),

    -- Defensive
    (b_1v1_defending, v_coach_id, v_club_id, '1v1 Defending', 'Individual defensive technique', 'Stay on feet, show wide, patience', 20, false, 'user'),
    (b_defensive_shape, v_coach_id, v_club_id, 'Defensive Shape', '4v4 defending as a unit', 'Compactness, cover, communication', 25, false, 'user'),

    -- Wide play
    (b_crossing_technique, v_coach_id, v_club_id, 'Crossing Technique', 'Different types of crosses', 'Driven, floated, cutback technique', 20, false, 'user'),
    (b_overlap_patterns, v_coach_id, v_club_id, 'Overlap Patterns', 'Fullback and winger combinations', 'Timing of run, decision making', 25, false, 'user'),

    -- Build-up
    (b_gk_distribution, v_coach_id, v_club_id, 'GK Distribution', 'Playing out from the back', 'Angles, timing of pass, composure', 15, false, 'user'),
    (b_buildup_patterns, v_coach_id, v_club_id, 'Build-Up Patterns', 'CB and FB combinations', 'Movement to receive, third man runs', 25, false, 'user'),

    -- Transition
    (b_counter_attack, v_coach_id, v_club_id, 'Counter Attack Drill', 'Quick breaks after winning ball', 'First pass forward, speed of thought', 25, false, 'user'),
    (b_pressing_triggers, v_coach_id, v_club_id, 'Pressing Triggers', 'Team pressing patterns', 'Trigger recognition, coordinated press', 25, false, 'user'),

    -- 1v1
    (b_1v1_attacking, v_coach_id, v_club_id, '1v1 Attacking', 'Taking on defenders', 'Commit defender, change of pace', 25, false, 'user'),

    -- Physical
    (b_speed_agility, v_coach_id, v_club_id, 'Speed & Agility', 'Ladder work and short sprints', 'Technique, explosiveness', 20, false, 'user'),
    (b_endurance, v_coach_id, v_club_id, 'Endurance Circuits', 'High intensity intervals', 'Maintain quality when tired', 25, false, 'user'),

    -- Games
    (b_possession_game, v_coach_id, v_club_id, 'Possession Game', '7v7 keep ball with conditions', 'Ball retention, switch play', 30, false, 'user'),
    (b_small_sided_game, v_coach_id, v_club_id, 'Small-Sided Game', 'Competitive game with focus', 'Apply session learnings', 25, false, 'user'),
    (b_match_simulation, v_coach_id, v_club_id, 'Match Simulation', 'Full game with tactical focus', 'Game management, execution', 40, false, 'user');

    -- ========================================
    -- SESSION BLOCK ASSIGNMENTS (blocks reused across sessions!)
    -- ========================================
    INSERT INTO session_block_assignments (session_id, block_id, "position") VALUES
    -- Session 1: Possession & Pressing (rondo, pressing, possession game)
    (s1, b_rondo, 0), (s1, b_pressing_triggers, 1), (s1, b_possession_game, 2),

    -- Session 2: Finishing (shooting warmup, finishing patterns, crossing finishing, small sided game)
    (s2, b_shooting_warmup, 0), (s2, b_finishing_patterns, 1), (s2, b_crossing_finishing, 2), (s2, b_small_sided_game, 3),

    -- Session 3: Defensive Shape (1v1 defending, defensive shape, small sided game)
    (s3, b_1v1_defending, 0), (s3, b_defensive_shape, 1), (s3, b_small_sided_game, 2),

    -- Session 4: Wide Play (crossing technique, overlap patterns, crossing finishing) - reuses crossing_finishing from s2
    (s4, b_crossing_technique, 0), (s4, b_overlap_patterns, 1), (s4, b_crossing_finishing, 2),

    -- Session 5: Build-Up (gk distribution, buildup patterns, possession game) - reuses possession_game from s1
    (s5, b_gk_distribution, 0), (s5, b_buildup_patterns, 1), (s5, b_possession_game, 2),

    -- Session 6: Counter Attacking (pressing triggers, counter attack, small sided game) - reuses pressing_triggers from s1
    (s6, b_pressing_triggers, 0), (s6, b_counter_attack, 1), (s6, b_small_sided_game, 2),

    -- Session 7: Finishing & Movement (receiving pressure, finishing patterns, crossing finishing) - reuses finishing blocks
    (s7, b_receiving_pressure, 0), (s7, b_finishing_patterns, 1), (s7, b_crossing_finishing, 2),

    -- Session 8: Midfield Dominance (rondo, receiving pressure, passing patterns, possession game) - reuses rondo and possession_game
    (s8, b_rondo, 0), (s8, b_receiving_pressure, 1), (s8, b_passing_patterns, 2), (s8, b_possession_game, 3),

    -- Session 9: 1v1 Skills (1v1 attacking, 1v1 defending, small sided game) - reuses 1v1_defending from s3
    (s9, b_1v1_attacking, 0), (s9, b_1v1_defending, 1), (s9, b_small_sided_game, 2),

    -- Session 10: Build-Up & Finishing (buildup patterns, finishing patterns, match simulation) - reuses buildup and finishing
    (s10, b_buildup_patterns, 0), (s10, b_finishing_patterns, 1), (s10, b_match_simulation, 2),

    -- Session 11: Physical & Technical (speed agility, endurance, rondo, small sided game) - reuses rondo
    (s11, b_speed_agility, 0), (s11, b_endurance, 1), (s11, b_rondo, 2), (s11, b_small_sided_game, 3),

    -- Session 12: Match Preparation (pressing triggers, finishing patterns, match simulation) - reuses several blocks
    (s12, b_pressing_triggers, 0), (s12, b_finishing_patterns, 1), (s12, b_match_simulation, 2);

    -- ========================================
    -- SESSION BLOCK ATTRIBUTES
    -- (order_type: 'first' = primary, 'second' = secondary)
    -- (relevance: 1.0 for primary, 0.5 for secondary)
    -- ========================================

    -- Rondo - receiving and passing
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_rondo, 'strong_ability_to_receive_under_pressure_in_build_up', 'first', 1.0, 'coach'),
    (b_rondo, 'strong_ability_to_pass_short_and_medium_passes', 'first', 1.0, 'coach'),
    (b_rondo, 'strong_ability_to_receive_on_the_half_turn', 'second', 0.5, 'coach');

    -- Passing Patterns - receiving and passing
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_passing_patterns, 'strong_ability_to_receive_on_the_half_turn', 'first', 1.0, 'coach'),
    (b_passing_patterns, 'strong_ability_to_pass_short_and_medium_passes', 'first', 1.0, 'coach'),
    (b_passing_patterns, 'strong_ability_to_break_lines_using_passing', 'second', 0.5, 'coach');

    -- Receiving Under Pressure
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_receiving_pressure, 'strong_ability_to_receive_on_the_half_turn', 'first', 1.0, 'coach'),
    (b_receiving_pressure, 'strong_ability_to_receive_in_tight_areas', 'first', 1.0, 'coach');

    -- Shooting Warm-Up
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_shooting_warmup, 'strong_ability_to_score_inside_the_box', 'first', 1.0, 'coach'),
    (b_shooting_warmup, 'strong_ability_to_score_outside_the_box', 'second', 0.5, 'coach');

    -- Finishing Patterns - key block for scoring IDP
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_finishing_patterns, 'strong_ability_to_score_inside_the_box', 'first', 1.0, 'coach'),
    (b_finishing_patterns, 'strong_ability_to_receive_on_the_half_turn', 'first', 1.0, 'coach'),
    (b_finishing_patterns, 'strong_ability_to_make_runs_beyond_the_back_line', 'second', 0.5, 'coach');

    -- Crossing & Finishing - key block for crossing IDP
    INSERT INTO session_block_attributes (block_id, attribute_key, order_type, relevance, source) VALUES
    (b_crossing_finishing, 'strong_ability_to_use_a_variety_of_crossing_types', 'first', 1.0, 'coach'),
    (b_crossing_finishing, 'strong_ability_to_score_inside_the_box', 'first', 1.0, 'coach'),
    (b_crossing_finishing, 'strong_ability_to_make_runs_beyond_the_back_line', 'second', 0.5, 'coach');

    -- 1v1 Defending - key block for defend_1v1 IDP
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

    -- Pressing Triggers - key block for pressing IDP
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

    -- ========================================
    -- SESSION ATTENDANCE (varied attendance patterns)
    -- ========================================
    -- Session 1 - All present
    INSERT INTO session_attendance (session_id, player_id, status) VALUES
    (s1, p_gk, 'present'), (s1, p_cb1, 'present'), (s1, p_cb2, 'present'),
    (s1, p_fb1, 'present'), (s1, p_fb2, 'present'), (s1, p_mf1, 'present'),
    (s1, p_mf2, 'present'), (s1, p_w1, 'present'), (s1, p_w2, 'present'), (s1, p_st, 'present');

    -- Session 2 - W2 and MF2 absent (miss finishing session - creates gap for their scoring IDP!)
    INSERT INTO session_attendance (session_id, player_id, status) VALUES
    (s2, p_gk, 'present'), (s2, p_cb1, 'present'), (s2, p_cb2, 'present'),
    (s2, p_fb1, 'present'), (s2, p_fb2, 'present'), (s2, p_mf1, 'present'),
    (s2, p_mf2, 'absent'), (s2, p_w1, 'present'), (s2, p_w2, 'absent'), (s2, p_st, 'present');

    -- Session 3 - FB1 absent (misses defending session - but they have defend_1v1 IDP!)
    INSERT INTO session_attendance (session_id, player_id, status) VALUES
    (s3, p_gk, 'present'), (s3, p_cb1, 'present'), (s3, p_cb2, 'present'),
    (s3, p_fb1, 'absent'), (s3, p_fb2, 'present'), (s3, p_mf1, 'present'),
    (s3, p_mf2, 'present'), (s3, p_w1, 'present'), (s3, p_w2, 'present'), (s3, p_st, 'present');

    -- Session 4 - All present
    INSERT INTO session_attendance (session_id, player_id, status) VALUES
    (s4, p_gk, 'present'), (s4, p_cb1, 'present'), (s4, p_cb2, 'present'),
    (s4, p_fb1, 'present'), (s4, p_fb2, 'present'), (s4, p_mf1, 'present'),
    (s4, p_mf2, 'present'), (s4, p_w1, 'present'), (s4, p_w2, 'present'), (s4, p_st, 'present');

    -- Session 5 - CB1, FB2, W1 absent (CB1 misses but no relevant IDP here)
    INSERT INTO session_attendance (session_id, player_id, status) VALUES
    (s5, p_gk, 'present'), (s5, p_cb1, 'absent'), (s5, p_cb2, 'present'),
    (s5, p_fb1, 'present'), (s5, p_fb2, 'absent'), (s5, p_mf1, 'present'),
    (s5, p_mf2, 'present'), (s5, p_w1, 'absent'), (s5, p_w2, 'present'), (s5, p_st, 'present');

    -- Session 6 - W2 absent (misses another session with scoring content)
    INSERT INTO session_attendance (session_id, player_id, status) VALUES
    (s6, p_gk, 'present'), (s6, p_cb1, 'present'), (s6, p_cb2, 'present'),
    (s6, p_fb1, 'present'), (s6, p_fb2, 'present'), (s6, p_mf1, 'present'),
    (s6, p_mf2, 'present'), (s6, p_w1, 'present'), (s6, p_w2, 'absent'), (s6, p_st, 'present');

    -- Session 7 - All present (finishing session - good for W2/MF2 who missed earlier)
    INSERT INTO session_attendance (session_id, player_id, status) VALUES
    (s7, p_gk, 'present'), (s7, p_cb1, 'present'), (s7, p_cb2, 'present'),
    (s7, p_fb1, 'present'), (s7, p_fb2, 'present'), (s7, p_mf1, 'present'),
    (s7, p_mf2, 'present'), (s7, p_w1, 'present'), (s7, p_w2, 'present'), (s7, p_st, 'present');

    -- Session 8 - CB2, MF1 absent (MF1 misses half_turn training!)
    INSERT INTO session_attendance (session_id, player_id, status) VALUES
    (s8, p_gk, 'present'), (s8, p_cb1, 'present'), (s8, p_cb2, 'absent'),
    (s8, p_fb1, 'present'), (s8, p_fb2, 'present'), (s8, p_mf1, 'absent'),
    (s8, p_mf2, 'present'), (s8, p_w1, 'present'), (s8, p_w2, 'present'), (s8, p_st, 'present');

    -- Session 9 - All present
    INSERT INTO session_attendance (session_id, player_id, status) VALUES
    (s9, p_gk, 'present'), (s9, p_cb1, 'present'), (s9, p_cb2, 'present'),
    (s9, p_fb1, 'present'), (s9, p_fb2, 'present'), (s9, p_mf1, 'present'),
    (s9, p_mf2, 'present'), (s9, p_w1, 'present'), (s9, p_w2, 'present'), (s9, p_st, 'present');

    -- Session 10 - MF2 absent (misses finishing and build-up!)
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
    WHERE sba.block_id IN (b_rondo, b_pressing_triggers, b_possession_game)
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
    WHERE sba.block_id IN (b_1v1_defending, b_defensive_shape, b_small_sided_game)
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
    WHERE sba.block_id IN (b_gk_distribution, b_buildup_patterns, b_possession_game)
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
    WHERE sba.block_id IN (b_buildup_patterns, b_finishing_patterns, b_match_simulation)
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

    INSERT INTO session_feedback (id, session_id, coach_id, team_feedback, overall_rating) VALUES
    (f1, s1, v_coach_id, 'Good intensity in the rondos. Players understanding pressing triggers better. Need work on recovery runs.', 4),
    (f2, s2, v_coach_id, 'Finishing was sharp today. Michael and Chris clinical. Some need more composure in front of goal.', 4),
    (f3, s3, v_coach_id, 'Defensive organization improving. James excellent as organizer. 1v1 defending needs work.', 3),
    (f4, s4, v_coach_id, 'Excellent wide play session. Ryan and Jamal combining well. Need more variety in crossing types.', 4),
    (f5, s5, v_coach_id, 'Build-up play more confident. Marcus improving distribution. CBs need to be braver.', 3),
    (f6, s6, v_coach_id, 'Counter attacks looking dangerous. Good transition speed. Final third decisions need work.', 4),
    (f7, s7, v_coach_id, 'Movement patterns improving. Tom and Michael linking up well. Finishing still inconsistent.', 4),
    (f8, s8, v_coach_id, 'Midfield controlling games better. Tom excellent. Need more penetrating passes.', 4),
    (f9, s9, v_coach_id, 'Great 1v1 energy. Chris and Jamal confident taking on defenders. Omar defending well.', 5),
    (f10, s10, v_coach_id, 'Good connection between build-up and finishing. David progressive with passes.', 4),
    (f11, s11, v_coach_id, 'Physical numbers looking good. Maintaining quality while tired. Mental toughness improving.', 4),
    (f12, s12, v_coach_id, 'Ready for the match. Tactical understanding clear. Confident heading into weekend.', 4);

    -- ========================================
    -- PLAYER FEEDBACK NOTES
    -- ========================================
    INSERT INTO player_feedback_notes (session_feedback_id, player_id, note) VALUES
    -- Session 1 notes
    (f1, p_mf1, 'Alex pressed excellently, great timing on triggers'),
    (f1, p_mf2, 'Tom receiving on half turn improving'),
    (f1, p_cb2, 'David composed on the ball, good line-breaking passes'),

    -- Session 2 notes
    (f2, p_st, 'Michael clinical today - 4 goals from 5 chances'),
    (f2, p_w1, 'Chris finishing improving when cutting inside'),
    (f2, p_fb1, 'Ryan delivery much improved'),

    -- Session 3 notes
    (f3, p_cb1, 'James organizing well, dominant in the air'),
    (f3, p_fb2, 'Omar staying on feet in 1v1s, reading game better'),

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
    (f7, p_st, 'Michael and Tom combining well'),
    (f7, p_mf2, 'Tom half-turn receiving excellent'),
    (f7, p_w2, 'Jamal finishing improving, hit the target more'),

    -- Session 8 notes
    (f8, p_mf2, 'Tom dictating tempo, excellent vision'),
    (f8, p_st, 'Michael receiving and turning quickly'),

    -- Session 9 notes
    (f9, p_w1, 'Chris dominating 1v1 situations'),
    (f9, p_fb2, 'Omar 1v1 defending much improved'),
    (f9, p_cb1, 'James solid in defensive duels'),

    -- Session 10 notes
    (f10, p_cb2, 'David break-lines passing confident'),
    (f10, p_st, 'Michael movement creating space'),

    -- Session 11 notes
    (f11, p_mf1, 'Alex fitness levels impressive, endurance outstanding'),
    (f11, p_cb1, 'James maintaining focus when tired'),

    -- Session 12 notes
    (f12, p_cb1, 'James ready to lead from the back'),
    (f12, p_st, 'Michael confident for match day'),
    (f12, p_mf1, 'Alex pressing discipline excellent');

    RAISE NOTICE 'Demo data inserted successfully!';
    RAISE NOTICE 'Players: 10';
    RAISE NOTICE 'Sessions: 12';
    RAISE NOTICE 'Reusable Blocks: 20 (used 37 times across sessions)';
    RAISE NOTICE 'Player IDPs: 24 (with significant overlap)';
    RAISE NOTICE 'Attendance records: 120';
    RAISE NOTICE '';
    RAISE NOTICE 'IDP Overlaps:';
    RAISE NOTICE '  - score_inside_the_box: ST, W1, W2, MF2 (4 players)';
    RAISE NOTICE '  - receive_on_the_half_turn: MF1, MF2, ST (3 players)';
    RAISE NOTICE '  - defend_1v1: CB1, FB1, FB2 (3 players)';
    RAISE NOTICE '  - press_intelligently: MF1, MF2, W1 (3 players)';
    RAISE NOTICE '  - crossing_types: FB1, W2 (2 players)';
    RAISE NOTICE '  - break_lines_passing: CB2, MF2 (2 players)';

END $$;
