-- ========================================
-- VIA SESSION PLANNER V3 - Seed Data
-- ========================================
-- Run this AFTER schema.sql to populate system defaults
-- This includes: positions, attributes (in/out possession, physical, psychological), equipment, space options
-- ========================================

-- ========================================
-- SPACE OPTIONS
-- ========================================
INSERT INTO system_defaults (category, key, value, display_order) VALUES
('space_options', 'full_pitch', '{"name": "Full Pitch", "description": "Full-size football pitch"}', 1),
('space_options', 'half_pitch', '{"name": "Half Pitch", "description": "Half of a full-size pitch"}', 2),
('space_options', 'quarter_pitch', '{"name": "Quarter Pitch", "description": "Quarter of a full-size pitch"}', 3),
('space_options', 'indoor_hall', '{"name": "Indoor Hall", "description": "Indoor sports hall or gymnasium"}', 4),
('space_options', 'other', '{"name": "Other", "description": "Custom space configuration"}', 5);

-- ========================================
-- EQUIPMENT
-- ========================================
INSERT INTO system_defaults (category, key, value, display_order) VALUES
('equipment', 'full_size_goal', '{"name": "Full Size Goal", "description": "Standard 11-a-side goal"}', 1),
('equipment', 'mini_goal', '{"name": "Mini Goal", "description": "Small-sided game goal"}', 2),
('equipment', 'cones', '{"name": "Cones", "description": "Training cones/markers"}', 3),
('equipment', 'balls', '{"name": "Balls", "description": "Footballs"}', 4),
('equipment', 'bibs', '{"name": "Bibs", "description": "Training bibs/pinnies"}', 5),
('equipment', 'mannequins', '{"name": "Mannequins", "description": "Defensive mannequins/dummies"}', 6),
('equipment', 'poles', '{"name": "Poles", "description": "Slalom poles"}', 7),
('equipment', 'ladders', '{"name": "Ladders", "description": "Agility ladders"}', 8),
('equipment', 'hurdles', '{"name": "Hurdles", "description": "Training hurdles"}', 9),
('equipment', 'rebounders', '{"name": "Rebounders", "description": "Rebound boards/walls"}', 10),
('equipment', 'resistance_bands', '{"name": "Resistance Bands", "description": "Resistance training bands"}', 11),
('equipment', 'medicine_balls', '{"name": "Medicine Balls", "description": "Weighted training balls"}', 12);

-- ========================================
-- POSITIONS - Default (Base positions)
-- ========================================
INSERT INTO system_defaults (category, key, value, display_order) VALUES
('positions', 'gk', '{
  "name": "Goalkeeper",
  "abbreviation": "GK",
  "is_advanced": false,
  "default_attributes": [
    "strong_ability_to_make_saves_in_1v1_situations",
    "strong_ability_to_dive_effectively_to_both_feet",
    "strong_ability_to_claim_crosses_from_wide_or_central_areas",
    "strong_ability_to_play_both_through_and_around_an_opposition_press",
    "strong_ability_to_receive_under_pressure_in_build_up"
  ]
}', 1),
('positions', 'fullback', '{
  "name": "Fullback",
  "abbreviation": "FB",
  "is_advanced": false,
  "default_attributes": [
    "strong_ability_to_tackle_effectively_in_1v1_situations",
    "strong_ability_to_close_down_wide_attackers_efficiently",
    "strong_ability_to_mark_opposition_wide_players",
    "strong_ability_to_use_a_variety_of_crossing_types",
    "strong_ability_to_receive_under_pressure_in_build_up"
  ]
}', 2),
('positions', 'centre_back', '{
  "name": "Centre Back",
  "abbreviation": "CB",
  "is_advanced": false,
  "default_attributes": [
    "strong_ability_to_win_1v1_duels",
    "strong_ability_to_mark_opposition_attackers_tightly",
    "strong_ability_to_communicate_with_teammates",
    "strong_ability_to_play_both_through_and_around_an_opposition_press",
    "strong_ability_to_pass_longer_distances_beyond_the_back_line"
  ]
}', 3),
('positions', 'midfielder', '{
  "name": "Midfielder",
  "abbreviation": "MF",
  "is_advanced": false,
  "default_attributes": [
    "strong_ability_to_receive_under_pressure",
    "strong_ability_to_break_lines_using_passing",
    "strong_ability_to_scan_before_receiving",
    "strong_ability_to_win_1v1_defensive_duels_in_central_areas",
    "strong_ability_to_delay_attackers_to_allow_team_shape_to_recover"
  ]
}', 4),
('positions', 'winger', '{
  "name": "Winger",
  "abbreviation": "W",
  "is_advanced": false,
  "default_attributes": [
    "strong_ability_to_eliminate_opponents_and_dominate_defenders_in_1v1_moments",
    "strong_ability_to_deliver_accurate_crosses_and_cutbacks_into_goal_scoring_areas",
    "confident_ball_carrying_at_speed_into_attacking_areas",
    "strong_ability_to_strike_the_ball_cleanly_in_shooting_positions",
    "strong_ability_to_press_opposition_fullbacks_and_wide_midfielders"
  ]
}', 5),
('positions', 'striker', '{
  "name": "Striker",
  "abbreviation": "ST",
  "is_advanced": false,
  "default_attributes": [
    "strong_ability_to_finish_scoring_opportunities_inside_and_outside_the_box",
    "strong_ability_to_hold_the_ball_up_and_link_play_with_teammates",
    "strong_ability_to_dominate_defenders_in_1v1_situations",
    "strong_ability_to_make_runs_beyond_the_back_line",
    "strong_ability_to_press_opposition_center_backs_and_deep_defenders"
  ]
}', 6);

-- ========================================
-- POSITIONS - Advanced (Specialized variants)
-- ========================================
INSERT INTO system_defaults (category, key, value, display_order) VALUES
('positions', 'wide_attacker', '{
  "name": "Wide Attacker",
  "abbreviation": "WA",
  "is_advanced": true,
  "parent_position": "winger",
  "description": "Wide player focused on attacking output with 1v1 skills and creativity",
  "default_attributes": [
    "strong_ability_to_dominate_opponents_in_1v1_attacking_situations",
    "strong_ability_to_receive_in_tight_areas",
    "strong_ability_to_use_a_variety_of_crossing_types",
    "strong_ability_to_create_goals_around_the_box",
    "strong_ability_to_press_fullbacks_and_centre_backs_aggressively"
  ]
}', 10),
('positions', 'centre_forward', '{
  "name": "Centre Forward",
  "abbreviation": "CF",
  "is_advanced": true,
  "parent_position": "striker",
  "description": "Central attacking player with finishing, hold-up play, and pressing ability",
  "default_attributes": [
    "strong_ability_to_use_a_variety_of_finishing_types_to_score",
    "strong_ability_to_hold_the_ball_up_and_retain_possession",
    "strong_ability_to_make_runs_beyond_the_back_line",
    "strong_ability_to_create_shooting_opportunities_with_individual_skill",
    "strong_ability_to_press_centre_backs_aggressively_and_intelligently"
  ]
}', 11),
('positions', 'inverted_fb', '{
  "name": "Inverted Fullback",
  "abbreviation": "IFB",
  "is_advanced": true,
  "parent_position": "fullback",
  "description": "Fullback who tucks into midfield when in possession",
  "default_attributes": [
    "strong_ability_to_tackle_effectively_in_central_or_wide_areas",
    "strong_ability_to_mark_opposition_midfielders_or_wide_attackers",
    "strong_ability_to_contain_opposition_attacks_in_central_and_half_space_areas",
    "strong_ability_to_block_shots_or_passes_from_opponents_in_central_areas",
    "confident_receiving_skills_in_central_crowded_zones"
  ]
}', 12),
('positions', 'attacking_fb', '{
  "name": "Attacking Fullback",
  "abbreviation": "AFB",
  "is_advanced": true,
  "parent_position": "fullback",
  "description": "Fullback with strong attacking output and crossing ability",
  "default_attributes": [
    "strong_ability_to_tackle_effectively_in_wide_areas",
    "strong_ability_to_recover_quickly_when_caught_high_up_the_pitch",
    "strong_ability_to_block_crosses_or_passes_from_wide_areas",
    "quality_delivery_of_crosses_from_wide_and_advanced_positions",
    "strong_overlapping_and_underlapping_receiving_skills"
  ]
}', 13),
('positions', 'defensive_fb', '{
  "name": "Defensive Fullback",
  "abbreviation": "DFB",
  "is_advanced": true,
  "parent_position": "fullback",
  "description": "Fullback prioritizing defensive solidity and positioning",
  "default_attributes": [
    "strong_ability_to_tackle_effectively_in_wide_areas",
    "strong_ability_to_block_crosses_and_passes_from_wide_areas",
    "strong_ability_to_win_aerial_duels",
    "strong_ability_to_mark_opposition_wide_players",
    "clean_and_secure_first_touch_under_pressure"
  ]
}', 14),
('positions', 'number_6', '{
  "name": "Number 6",
  "abbreviation": "6",
  "is_advanced": true,
  "parent_position": "midfielder",
  "description": "Deep-lying midfielder who shields the defense and distributes",
  "default_attributes": [
    "strong_ability_to_tackle_effectively_in_central_areas",
    "strong_ability_to_block_shooting_or_passing_lanes_in_midfield",
    "strong_ability_to_receive_from_all_angles_including_facing_own_goal",
    "strong_ability_to_break_lines_using_passing",
    "strong_ability_to_recover_quickly_when_out_of_position"
  ]
}', 15),
('positions', 'number_8', '{
  "name": "Number 8",
  "abbreviation": "8",
  "is_advanced": true,
  "parent_position": "midfielder",
  "description": "Box-to-box midfielder with all-round capabilities",
  "default_attributes": [
    "confident_receiving_on_the_half_turn_on_both_feet",
    "strong_ability_to_carry_the_ball_forward_over_short_and_medium_distances",
    "strong_ability_to_break_lines_using_passing",
    "strong_ability_to_tackle_effectively_in_central_or_half_space_areas",
    "strong_ability_to_recover_quickly_when_out_of_position"
  ]
}', 16),
('positions', 'number_10', '{
  "name": "Number 10",
  "abbreviation": "10",
  "is_advanced": true,
  "parent_position": "midfielder",
  "description": "Creative playmaker operating between the lines",
  "default_attributes": [
    "strong_ability_to_create_goals_through_accurate_passing_or_final_delivery",
    "strong_ability_to_finish_scoring_opportunities_inside_and_outside_the_box",
    "ability_to_receive_in_central_and_half_space_areas",
    "strong_ability_to_combine_in_tight_areas_around_the_box",
    "strong_ability_to_block_shooting_or_passing_lanes_in_midfield"
  ]
}', 17),
('positions', 'inside_forward', '{
  "name": "Inside Forward",
  "abbreviation": "IF",
  "is_advanced": true,
  "parent_position": "winger",
  "description": "Wide player who cuts inside onto stronger foot to score or create",
  "default_attributes": [
    "strong_ability_to_dominate_opponents_in_1v1_attacking_situations",
    "strong_ability_to_finish_scoring_opportunities_inside_and_outside_the_box",
    "strong_ability_to_create_goals_through_accurate_passing_or_final_delivery",
    "strong_ability_to_combine_in_tight_areas_with_teammates",
    "strong_ability_to_tackle_effectively_in_wide_or_half_space_areas"
  ]
}', 18),
('positions', 'poacher', '{
  "name": "Poacher",
  "abbreviation": "P",
  "is_advanced": true,
  "parent_position": "striker",
  "description": "Striker focused on positioning and finishing inside the box",
  "default_attributes": [
    "strong_ability_to_finish_scoring_opportunities_inside_the_box",
    "strong_ability_to_dominate_defenders_in_tight_1v1_situations_near_goal",
    "strong_ability_to_execute_quick_first_time_shots",
    "strong_ability_to_make_short_intelligent_runs_behind_the_back_line",
    "strong_ability_to_anticipate_opponent_passes_and_movements_in_the_final_third"
  ]
}', 19),
('positions', 'target_man', '{
  "name": "Target Man",
  "abbreviation": "TM",
  "is_advanced": true,
  "parent_position": "striker",
  "description": "Physical striker who holds up play and brings others into the game",
  "default_attributes": [
    "strong_ability_to_hold_the_ball_up_under_pressure",
    "strong_ability_to_finish_scoring_opportunities_inside_and_outside_the_box",
    "strong_ability_to_link_play_with_midfielders_and_wide_players",
    "strong_ability_to_dominate_defenders_in_physical_1v1_situations",
    "strong_ability_to_force_defenders_into_less_dangerous_areas"
  ]
}', 20),
('positions', 'complete_striker', '{
  "name": "Complete Striker",
  "abbreviation": "CS",
  "is_advanced": true,
  "parent_position": "striker",
  "description": "All-round striker capable of scoring, creating, and pressing",
  "default_attributes": [
    "strong_ability_to_finish_scoring_opportunities_inside_and_outside_the_box",
    "strong_ability_to_hold_the_ball_up_and_link_play_with_teammates",
    "strong_ability_to_dominate_defenders_in_1v1_situations",
    "strong_ability_to_make_runs_beyond_the_back_line",
    "strong_ability_to_press_opposition_center_backs_and_deep_defenders"
  ]
}', 21);

-- ========================================
-- ATTRIBUTES - In Possession (General list)
-- ========================================
INSERT INTO system_defaults (category, key, value, display_order) VALUES
-- Core receiving and ball control
('attributes_in_possession', 'strong_ability_to_receive_on_both_feet', '{"name": "Strong ability to receive on both feet", "description": "Comfortable receiving the ball with either foot"}', 1),
('attributes_in_possession', 'strong_ability_to_pass_short_and_medium_passes', '{"name": "Strong ability to pass short and medium passes", "description": "Accurate passing over short and medium distances"}', 2),
('attributes_in_possession', 'strong_ability_to_play_both_through_and_around_an_opposition_press', '{"name": "Strong ability to play both through and around an opposition press", "description": "Can navigate pressing situations with variety"}', 3),
('attributes_in_possession', 'strong_ability_to_play_over_an_opposition_press', '{"name": "Strong ability to play over an opposition press", "description": "Can bypass press with longer passes"}', 4),
('attributes_in_possession', 'strong_ability_to_throw_over_short_and_large_distances', '{"name": "Strong ability to throw over short and large distances", "description": "Accurate throwing distribution"}', 5),
('attributes_in_possession', 'strong_ability_to_pass_over_different_distances_with_weaker_foot', '{"name": "Strong ability to pass over different distances with weaker foot", "description": "Two-footed passing ability"}', 6),
('attributes_in_possession', 'strong_ability_to_roll_inside_the_pitch', '{"name": "Strong ability to roll inside the pitch", "description": "Can move inside from wide areas effectively"}', 7),
('attributes_in_possession', 'strong_crossing_ability_from_different_locations_with_different_techniques', '{"name": "Strong crossing ability from different locations with different techniques", "description": "Varied crossing ability"}', 8),
('attributes_in_possession', 'strong_ability_to_make_underlapping_and_overlapping_runs', '{"name": "Strong ability to make underlapping and overlapping runs", "description": "Times runs to support wide play"}', 9),
('attributes_in_possession', 'strong_ability_to_combine_in_the_opposition_half', '{"name": "Strong ability to combine in the opposition half", "description": "Quick combinations in attacking areas"}', 10),
('attributes_in_possession', 'strong_ability_to_dominate_opponents_in_1v1_attacking_situations', '{"name": "Strong ability to dominate opponents in 1v1 attacking situations", "description": "Beats defenders in individual duels"}', 11),
('attributes_in_possession', 'strong_ability_to_take_set_pieces', '{"name": "Strong ability to take set pieces", "description": "Quality delivery from set pieces"}', 12),
('attributes_in_possession', 'strong_ability_to_win_aerial_duels_attacking', '{"name": "Strong ability to win aerial duels attacking", "description": "Wins headers in attacking situations"}', 13),
('attributes_in_possession', 'strong_ability_to_throw_quickly', '{"name": "Strong ability to throw quickly", "description": "Quick distribution to start attacks"}', 14),
('attributes_in_possession', 'strong_ability_using_diagonal_passing', '{"name": "Strong ability using diagonal passing", "description": "Switches play with diagonal balls"}', 15),
('attributes_in_possession', 'strong_ability_to_pass_over_larger_distances_beyond_the_back_line', '{"name": "Strong ability to pass over larger distances beyond the back line", "description": "Long passing range"}', 16),
('attributes_in_possession', 'strong_capability_to_carry_the_ball_or_step_in', '{"name": "Strong capability to carry the ball or step in", "description": "Can drive forward with the ball"}', 17),
('attributes_in_possession', 'strong_ability_to_receive_under_pressure_in_build_up', '{"name": "Strong ability to receive under pressure in build up", "description": "Comfortable receiving under pressure"}', 18),
('attributes_in_possession', 'strong_ability_to_break_lines_using_passing', '{"name": "Strong ability to break lines using passing", "description": "Penetrative passing through defensive lines"}', 19),
('attributes_in_possession', 'strong_ability_to_carry_the_ball_up_the_pitch', '{"name": "Strong ability to carry the ball up the pitch", "description": "Progressive ball carrying"}', 20),
('attributes_in_possession', 'strong_ability_to_score_inside_the_box', '{"name": "Strong ability to score inside the box", "description": "Clinical finishing inside the area"}', 21),
('attributes_in_possession', 'strong_ability_to_score_outside_the_box', '{"name": "Strong ability to score outside the box", "description": "Long-range shooting ability"}', 22),
('attributes_in_possession', 'strong_ability_to_create_goals_around_the_box', '{"name": "Strong ability to create goals around the box", "description": "Creates chances in and around the box"}', 23),
('attributes_in_possession', 'strong_ability_to_receive_in_tight_areas', '{"name": "Strong ability to receive in tight areas", "description": "Comfortable in congested spaces"}', 24),
('attributes_in_possession', 'strong_ability_to_receive_on_the_half_turn', '{"name": "Strong ability to receive on the half turn", "description": "Receives facing forward"}', 25),
('attributes_in_possession', 'strong_ability_to_make_runs_beyond_the_back_line', '{"name": "Strong ability to make runs beyond the back line", "description": "Times runs in behind defenders"}', 26),
('attributes_in_possession', 'strong_ability_to_use_a_variety_of_crossing_types', '{"name": "Strong ability to use a variety of crossing types", "description": "Varied crossing techniques"}', 27),
('attributes_in_possession', 'strong_ability_to_hold_the_ball_up', '{"name": "Strong ability to hold the ball up", "description": "Retains possession under pressure"}', 28),
('attributes_in_possession', 'strong_ability_to_combine_using_diamonds_and_triangles', '{"name": "Strong ability to combine using diamonds and triangles", "description": "Positional combinations with teammates"}', 29),
('attributes_in_possession', 'strong_ability_to_lose_marker', '{"name": "Strong ability to lose marker", "description": "Creates separation from defenders"}', 30),
('attributes_in_possession', 'strong_ability_to_adjust_body_shape_before_receiving', '{"name": "Strong ability to adjust body shape before receiving", "description": "Prepares body position before receiving"}', 31),
('attributes_in_possession', 'strong_ability_to_use_first_touch_to_move_away_from_pressure', '{"name": "Strong ability to use first touch to move away from pressure", "description": "First touch creates space"}', 32),
('attributes_in_possession', 'strong_ability_to_protect_the_ball_using_body_positioning', '{"name": "Strong ability to protect the ball using body positioning", "description": "Shields ball from opponents"}', 33),
('attributes_in_possession', 'strong_ability_to_receive_on_the_move', '{"name": "Strong ability to receive on the move", "description": "Controls ball while moving"}', 34),
('attributes_in_possession', 'strong_ability_to_scan_before_receiving', '{"name": "Strong ability to scan before receiving", "description": "Checks surroundings before receiving"}', 35),
('attributes_in_possession', 'strong_ability_to_receive_between_lines', '{"name": "Strong ability to receive between lines", "description": "Finds pockets between defensive lines"}', 36),
('attributes_in_possession', 'strong_ability_to_switch_play_effectively', '{"name": "Strong ability to switch play effectively", "description": "Changes point of attack"}', 37),
('attributes_in_possession', 'strong_ability_to_disguise_passes', '{"name": "Strong ability to disguise passes", "description": "Deceptive passing technique"}', 38),
('attributes_in_possession', 'strong_ability_to_play_forward_when_possible', '{"name": "Strong ability to play forward when possible", "description": "Positive forward passing"}', 39),
('attributes_in_possession', 'strong_ability_to_retain_possession_safely_when_required', '{"name": "Strong ability to retain possession safely when required", "description": "Safe possession when needed"}', 40),
('attributes_in_possession', 'strong_ability_to_play_one_touch_when_needed', '{"name": "Strong ability to play one touch when needed", "description": "Quick one-touch play"}', 41),
('attributes_in_possession', 'strong_ability_to_vary_speed_and_weight_of_pass', '{"name": "Strong ability to vary speed and weight of pass", "description": "Varies pass tempo and weight"}', 42),
('attributes_in_possession', 'strong_ability_to_accelerate_with_the_ball', '{"name": "Strong ability to accelerate with the ball", "description": "Explosive ball carrying"}', 43),
('attributes_in_possession', 'strong_ability_to_manipulate_the_ball_in_tight_areas', '{"name": "Strong ability to manipulate the ball in tight areas", "description": "Close control in tight spaces"}', 44),
('attributes_in_possession', 'strong_ability_to_use_feints_to_unbalance_opponents', '{"name": "Strong ability to use feints to unbalance opponents", "description": "Uses body feints effectively"}', 45),
('attributes_in_possession', 'strong_ability_to_drive_forward_into_open_space', '{"name": "Strong ability to drive forward into open space", "description": "Progressive driving runs"}', 46),
('attributes_in_possession', 'strong_ability_to_change_direction_at_speed_while_carrying', '{"name": "Strong ability to change direction at speed while carrying", "description": "Agile ball carrying"}', 47),
('attributes_in_possession', 'strong_ability_to_identify_when_to_pass_carry_or_shoot', '{"name": "Strong ability to identify when to pass carry or shoot", "description": "Good decision making on ball"}', 48),
('attributes_in_possession', 'strong_ability_to_recognise_overloads', '{"name": "Strong ability to recognise overloads", "description": "Identifies numerical advantages"}', 49),
('attributes_in_possession', 'strong_ability_to_create_passing_angles', '{"name": "Strong ability to create passing angles", "description": "Positions to receive passes"}', 50),
('attributes_in_possession', 'strong_ability_to_support_underneath_beside_or_beyond_the_ball', '{"name": "Strong ability to support underneath beside or beyond the ball", "description": "Varied support positions"}', 51),
('attributes_in_possession', 'strong_ability_to_link_play_between_thirds', '{"name": "Strong ability to link play between thirds", "description": "Connects different areas of pitch"}', 52),
('attributes_in_possession', 'strong_ability_to_interchange_positions', '{"name": "Strong ability to interchange positions", "description": "Fluid positional rotations"}', 53),
('attributes_in_possession', 'strong_ability_to_attack_the_box_with_timing', '{"name": "Strong ability to attack the box with timing", "description": "Late runs into the box"}', 54),
('attributes_in_possession', 'strong_ability_to_vary_finishing_techniques', '{"name": "Strong ability to vary finishing techniques", "description": "Multiple finishing methods"}', 55),
('attributes_in_possession', 'strong_ability_to_stay_composed_under_pressure', '{"name": "Strong ability to stay composed under pressure", "description": "Calm under pressure"}', 56),
('attributes_in_possession', 'strong_ability_to_escape_pressure_using_turns', '{"name": "Strong ability to escape pressure using turns", "description": "Uses turns to evade pressure"}', 57),
('attributes_in_possession', 'strong_ability_to_maintain_possession_in_tight_spaces', '{"name": "Strong ability to maintain possession in tight spaces", "description": "Keeps ball in congested areas"}', 58);

-- ========================================
-- ATTRIBUTES - Out of Possession (General list)
-- ========================================
INSERT INTO system_defaults (category, key, value, display_order) VALUES
('attributes_out_of_possession', 'strong_ability_to_press_intelligently', '{"name": "Strong ability to press intelligently", "description": "Smart pressing decisions and timing"}', 1),
('attributes_out_of_possession', 'strong_ability_to_delay_the_opponent', '{"name": "Strong ability to delay the opponent", "description": "Slows down opposition attacks"}', 2),
('attributes_out_of_possession', 'strong_ability_to_jockey_and_stay_balanced', '{"name": "Strong ability to jockey and stay balanced", "description": "Controlled defensive stance"}', 3),
('attributes_out_of_possession', 'strong_ability_to_defend_1v1', '{"name": "Strong ability to defend 1v1", "description": "Wins individual defensive duels"}', 4),
('attributes_out_of_possession', 'strong_ability_to_win_1v1_duels', '{"name": "Strong ability to win 1v1 duels", "description": "Dominant in defensive challenges"}', 5),
('attributes_out_of_possession', 'strong_ability_to_intercept_passes', '{"name": "Strong ability to intercept passes", "description": "Reads and intercepts passes"}', 6),
('attributes_out_of_possession', 'strong_ability_to_block_shots_and_crosses', '{"name": "Strong ability to block shots and crosses", "description": "Blocks shots and deliveries"}', 7),
('attributes_out_of_possession', 'strong_ability_to_regain_possession_quickly', '{"name": "Strong ability to regain possession quickly", "description": "Quick ball recovery"}', 8),
('attributes_out_of_possession', 'strong_ability_to_track_runners', '{"name": "Strong ability to track runners", "description": "Follows runners into dangerous areas"}', 9),
('attributes_out_of_possession', 'strong_ability_to_defend_space_behind', '{"name": "Strong ability to defend space behind", "description": "Protects space in behind"}', 10),
('attributes_out_of_possession', 'strong_ability_to_defend_the_box', '{"name": "Strong ability to defend the box", "description": "Strong in penalty area defense"}', 11),
('attributes_out_of_possession', 'strong_ability_to_defend_crosses', '{"name": "Strong ability to defend crosses", "description": "Deals with crosses effectively"}', 12),
('attributes_out_of_possession', 'strong_ability_to_defend_set_pieces', '{"name": "Strong ability to defend set pieces", "description": "Organized set piece defending"}', 13),
('attributes_out_of_possession', 'strong_ability_to_organise_teammates', '{"name": "Strong ability to organise teammates", "description": "Communicates defensive organization"}', 14),
('attributes_out_of_possession', 'strong_ability_to_step_in_to_win_the_ball', '{"name": "Strong ability to step in to win the ball", "description": "Proactive ball winning"}', 15),
('attributes_out_of_possession', 'strong_ability_to_screen_passing_lanes', '{"name": "Strong ability to screen passing lanes", "description": "Blocks passing options"}', 16),
('attributes_out_of_possession', 'strong_ability_to_force_play_away_from_danger', '{"name": "Strong ability to force play away from danger", "description": "Channels play to safe areas"}', 17),
('attributes_out_of_possession', 'strong_ability_to_squeeze_the_pitch_as_a_unit', '{"name": "Strong ability to squeeze the pitch as a unit", "description": "Compresses space collectively"}', 18),
('attributes_out_of_possession', 'strong_ability_to_drop_into_a_compact_shape', '{"name": "Strong ability to drop into a compact shape", "description": "Maintains compact defensive block"}', 19),
('attributes_out_of_possession', 'strong_ability_to_press_as_part_of_a_unit', '{"name": "Strong ability to press as part of a unit", "description": "Coordinates pressing with team"}', 20),
('attributes_out_of_possession', 'strong_ability_to_transition_quickly_after_losing_the_ball', '{"name": "Strong ability to transition quickly after losing the ball", "description": "Quick defensive transition"}', 21),
('attributes_out_of_possession', 'strong_ability_to_manage_distances_between_units', '{"name": "Strong ability to manage distances between units", "description": "Maintains defensive distances"}', 22),
('attributes_out_of_possession', 'strong_ability_to_apply_cover_and_support', '{"name": "Strong ability to apply cover and support", "description": "Provides defensive cover"}', 23),
('attributes_out_of_possession', 'strong_ability_to_time_tackles_without_fouling', '{"name": "Strong ability to time tackles without fouling", "description": "Clean tackling technique"}', 24),
('attributes_out_of_possession', 'strong_ability_to_maintain_concentration_in_blocks', '{"name": "Strong ability to maintain concentration in blocks", "description": "Focused in defensive blocks"}', 25),
('attributes_out_of_possession', 'strong_ability_to_disrupt_opponent_rhythm', '{"name": "Strong ability to disrupt opponent rhythm", "description": "Breaks up opposition play"}', 26),
('attributes_out_of_possession', 'strong_ability_to_protect_the_goal_centrally', '{"name": "Strong ability to protect the goal centrally", "description": "Central defensive positioning"}', 27),
('attributes_out_of_possession', 'strong_ability_to_predict_opponent_movements', '{"name": "Strong ability to predict opponent movements", "description": "Anticipates opposition play"}', 28),
('attributes_out_of_possession', 'strong_ability_to_shadow_press', '{"name": "Strong ability to shadow press", "description": "Covers passing lanes while pressing"}', 29),
('attributes_out_of_possession', 'strong_ability_to_counter_press', '{"name": "Strong ability to counter press", "description": "Immediate pressing after loss"}', 30),
('attributes_out_of_possession', 'strong_ability_to_manage_defensive_duels_without_fouling', '{"name": "Strong ability to manage defensive duels without fouling", "description": "Controlled defensive challenges"}', 31);

-- ========================================
-- ATTRIBUTES - Physical
-- ========================================
INSERT INTO system_defaults (category, key, value, display_order) VALUES
('attributes_physical', 'strong_acceleration', '{"name": "Strong acceleration", "description": "Quick to reach top speed"}', 1),
('attributes_physical', 'strong_top_speed', '{"name": "Strong top speed", "description": "High maximum running speed"}', 2),
('attributes_physical', 'strong_agility', '{"name": "Strong agility", "description": "Quick and nimble movements"}', 3),
('attributes_physical', 'strong_coordination', '{"name": "Strong coordination", "description": "Smooth and controlled body movements"}', 4),
('attributes_physical', 'strong_ability_to_change_direction_quickly', '{"name": "Strong ability to change direction quickly", "description": "Sharp directional changes"}', 5),
('attributes_physical', 'strong_ability_to_repeat_high_intensity_actions', '{"name": "Strong ability to repeat high intensity actions", "description": "Maintains intensity throughout"}', 6),
('attributes_physical', 'strong_aerobic_endurance', '{"name": "Strong aerobic endurance", "description": "High stamina and endurance"}', 7),
('attributes_physical', 'strong_anaerobic_power', '{"name": "Strong anaerobic power", "description": "Explosive power output"}', 8),
('attributes_physical', 'strong_jumping_ability', '{"name": "Strong jumping ability", "description": "Strong vertical leap"}', 9),
('attributes_physical', 'strong_core_stability', '{"name": "Strong core stability", "description": "Stable core for balance and power"}', 10),
('attributes_physical', 'strong_balance_under_pressure', '{"name": "Strong balance under pressure", "description": "Maintains balance when challenged"}', 11),
('attributes_physical', 'strong_robustness_in_contact', '{"name": "Strong robustness in contact", "description": "Physical in challenges"}', 12),
('attributes_physical', 'strong_mobility', '{"name": "Strong mobility", "description": "Good range of movement"}', 13),
('attributes_physical', 'strong_upper_body_strength', '{"name": "Strong upper body strength", "description": "Upper body power"}', 14),
('attributes_physical', 'strong_lower_body_strength', '{"name": "Strong lower body strength", "description": "Lower body power"}', 15),
('attributes_physical', 'strong_ability_to_hold_off_opponents', '{"name": "Strong ability to hold off opponents", "description": "Physical strength in duels"}', 16),
('attributes_physical', 'strong_ability_to_maintain_intensity_late_in_games', '{"name": "Strong ability to maintain intensity late in games", "description": "Late game fitness"}', 17),
('attributes_physical', 'strong_ability_to_recover_between_efforts', '{"name": "Strong ability to recover between efforts", "description": "Quick recovery between actions"}', 18),
('attributes_physical', 'strong_ability_to_produce_power', '{"name": "Strong ability to produce power", "description": "Explosive power generation"}', 19),
('attributes_physical', 'strong_flexibility', '{"name": "Strong flexibility", "description": "Good body flexibility"}', 20),
('attributes_physical', 'strong_running_efficiency', '{"name": "Strong running efficiency", "description": "Efficient running technique"}', 21),
('attributes_physical', 'strong_landing_technique', '{"name": "Strong landing technique", "description": "Safe landing mechanics"}', 22),
('attributes_physical', 'strong_deceleration_control', '{"name": "Strong deceleration control", "description": "Controlled slowing down"}', 23),
('attributes_physical', 'strong_braking_ability', '{"name": "Strong braking ability", "description": "Quick stopping ability"}', 24),
('attributes_physical', 'strong_sprint_technique', '{"name": "Strong sprint technique", "description": "Efficient sprinting form"}', 25),
('attributes_physical', 'strong_ability_to_maintain_balance_when_dribbling', '{"name": "Strong ability to maintain balance when dribbling", "description": "Balanced on the ball"}', 26);

-- ========================================
-- ATTRIBUTES - Psychological
-- ========================================
INSERT INTO system_defaults (category, key, value, display_order) VALUES
('attributes_psychological', 'strong_confidence', '{"name": "Strong confidence", "description": "Belief in own abilities"}', 1),
('attributes_psychological', 'strong_resilience', '{"name": "Strong resilience", "description": "Bounces back from setbacks"}', 2),
('attributes_psychological', 'strong_composure_under_pressure', '{"name": "Strong composure under pressure", "description": "Calm in high-pressure situations"}', 3),
('attributes_psychological', 'strong_competitiveness', '{"name": "Strong competitiveness", "description": "Drive to win and compete"}', 4),
('attributes_psychological', 'strong_desire_to_win_duels', '{"name": "Strong desire to win duels", "description": "Determination in challenges"}', 5),
('attributes_psychological', 'strong_coachability', '{"name": "Strong coachability", "description": "Receptive to coaching and feedback"}', 6),
('attributes_psychological', 'strong_concentration', '{"name": "Strong concentration", "description": "Sustained focus throughout"}', 7),
('attributes_psychological', 'strong_decision_making_under_pressure', '{"name": "Strong decision making under pressure", "description": "Clear thinking under pressure"}', 8),
('attributes_psychological', 'strong_ability_to_learn_from_mistakes', '{"name": "Strong ability to learn from mistakes", "description": "Grows from errors"}', 9),
('attributes_psychological', 'strong_adaptability', '{"name": "Strong adaptability", "description": "Adjusts to different situations"}', 10),
('attributes_psychological', 'strong_communication', '{"name": "Strong communication", "description": "Clear on-field communication"}', 11),
('attributes_psychological', 'strong_leadership', '{"name": "Strong leadership", "description": "Leads and organizes teammates"}', 12),
('attributes_psychological', 'strong_responsibility', '{"name": "Strong responsibility", "description": "Takes ownership of actions"}', 13),
('attributes_psychological', 'strong_emotional_control', '{"name": "Strong emotional control", "description": "Manages emotions effectively"}', 14),
('attributes_psychological', 'strong_game_intelligence', '{"name": "Strong game intelligence", "description": "Reads and understands the game"}', 15),
('attributes_psychological', 'strong_anticipation', '{"name": "Strong anticipation", "description": "Predicts play development"}', 16),
('attributes_psychological', 'strong_work_rate', '{"name": "Strong work rate", "description": "High effort and intensity"}', 17),
('attributes_psychological', 'strong_accountability', '{"name": "Strong accountability", "description": "Takes responsibility for performance"}', 18),
('attributes_psychological', 'strong_motivation', '{"name": "Strong motivation", "description": "Driven to improve and succeed"}', 19),
('attributes_psychological', 'strong_tactical_discipline', '{"name": "Strong tactical discipline", "description": "Follows tactical instructions"}', 20),
('attributes_psychological', 'strong_mental_toughness', '{"name": "Strong mental toughness", "description": "Mentally strong in adversity"}', 21),
('attributes_psychological', 'strong_creativity_in_problem_solving', '{"name": "Strong creativity in problem solving", "description": "Creative solutions to challenges"}', 22),
('attributes_psychological', 'strong_self_awareness', '{"name": "Strong self awareness", "description": "Understands own strengths and weaknesses"}', 23),
('attributes_psychological', 'strong_team_first_mentality', '{"name": "Strong team first mentality", "description": "Prioritizes team over individual"}', 24),
('attributes_psychological', 'strong_ability_to_stay_calm_when_pressed', '{"name": "Strong ability to stay calm when pressed", "description": "Composed under pressing"}', 25);

-- ========================================
-- POSITION DEFAULT ATTRIBUTES - In Possession
-- These define the top 10 in-possession attributes for each position
-- ========================================
INSERT INTO system_defaults (category, key, value, display_order) VALUES
('position_attributes_in_possession', 'gk', '{
  "position": "gk",
  "attributes": [
    "confident_distribution_with_both_feet",
    "accurate_passing_into_midfield_units",
    "clean_first_touch_to_create_space",
    "ability_to_break_lines_with_passes",
    "calm_retention_under_pressure",
    "effective_disguise_on_passes",
    "ability_to_clip_passes_into_wide_areas",
    "secure_receiving_technique_in_tight_spaces",
    "smart_decision_making_on_when_to_play_short_or_long",
    "ability_to_draw_pressure_and_release_teammates"
  ]
}', 1),
('position_attributes_in_possession', 'fullback', '{
  "position": "fullback",
  "attributes": [
    "strong_ability_to_make_underlapping_and_overlapping_runs",
    "strong_crossing_ability_from_different_locations_with_different_techniques",
    "strong_ability_to_use_a_variety_of_crossing_types",
    "strong_ability_to_combine_in_the_opposition_half",
    "strong_ability_to_receive_under_pressure_in_build_up",
    "strong_ability_to_play_both_through_and_around_an_opposition_press",
    "strong_ability_to_play_over_an_opposition_press",
    "strong_ability_to_roll_inside_the_pitch",
    "strong_ability_to_pass_short_and_medium_passes",
    "strong_ability_to_throw_effectively"
  ]
}', 2),
('position_attributes_in_possession', 'centre_back', '{
  "position": "centre_back",
  "attributes": [
    "strong_ability_to_receive_under_pressure_in_build_up",
    "strong_ability_to_pass_short_and_medium_distances",
    "strong_capability_to_carry_the_ball_or_step_in",
    "strong_ability_to_break_lines_using_passing",
    "strong_ability_to_play_both_through_and_around_an_opposition_press",
    "strong_ability_to_play_over_an_opposition_press",
    "strong_ability_using_diagonal_passing",
    "strong_ability_to_switch_play_effectively",
    "strong_ability_to_pass_longer_distances_beyond_the_back_line",
    "strong_ability_to_receive_on_both_feet"
  ]
}', 3),
('position_attributes_in_possession', 'midfielder', '{
  "position": "midfielder",
  "attributes": [
    "secure_first_touch_that_sets_up_the_next_action",
    "ability_to_receive_in_any_body_orientation",
    "strong_passing_range_across_all_distances",
    "ability_to_break_lines_with_penetrative_passes",
    "confident_ball_carrying_to_progress_play",
    "quick_combinations_in_tight_areas",
    "close_control_to_retain_possession_under_pressure",
    "high_quality_weight_and_timing_of_pass",
    "ability_to_scan_early_and_often",
    "ability_to_score_goals_in_and_around_the_box"
  ]
}', 4),
('position_attributes_in_possession', 'wide_attacker', '{
  "position": "wide_attacker",
  "attributes": [
    "strong_ability_to_dominate_opponents_in_1v1_attacking_situations",
    "strong_ability_to_receive_in_tight_areas",
    "strong_ability_to_receive_on_the_half_turn",
    "strong_ability_to_create_goals_around_the_box",
    "strong_ability_to_use_a_variety_of_crossing_types",
    "strong_ability_to_combine_in_the_opposition_half",
    "strong_ability_to_make_runs_beyond_the_back_line",
    "strong_ability_to_receive_on_both_feet",
    "strong_ability_to_carry_the_ball_up_the_pitch",
    "strong_ability_to_lose_marker"
  ]
}', 5),
('position_attributes_in_possession', 'centre_forward', '{
  "position": "centre_forward",
  "attributes": [
    "strong_ability_to_finish_consistently_inside_the_box",
    "strong_ability_to_use_a_variety_of_finishing_types_to_score",
    "strong_ability_to_receive_the_ball_under_pressure_with_back_to_goal",
    "strong_ability_to_hold_the_ball_up_and_retain_possession",
    "strong_ability_to_receive_on_the_half_turn",
    "strong_ability_to_combine_with_teammates_using_quick_one_and_two_touch_play",
    "strong_ability_to_carry_the_ball_forward_with_control",
    "strong_ability_to_make_runs_beyond_the_back_line",
    "strong_ability_to_create_shooting_opportunities_with_individual_skill",
    "strong_ability_to_link_play_with_clean_short_passing"
  ]
}', 6),
('position_attributes_in_possession', 'inverted_fb', '{
  "position": "inverted_fb",
  "attributes": [
    "clean_first_touch_when_moving_inside_from_wide_areas",
    "confident_receiving_skills_in_central_crowded_zones",
    "strong_short_and_medium_range_passing_from_interior_positions",
    "ability_to_combine_quickly_with_midfielders_in_tight_spaces",
    "reliable_ball_security_under_pressure_in_central_zones",
    "ability_to_carry_forward_through_midfield_traffic",
    "strong_ability_to_play_forward_breaking_opposition_lines",
    "balanced_receiving_on_both_feet_to_open_different_angles",
    "confident_switches_of_play_from_inside_channels",
    "quality_delivery_of_passes_into_wide_runners_or_forwards"
  ]
}', 7),
('position_attributes_in_possession', 'attacking_fb', '{
  "position": "attacking_fb",
  "attributes": [
    "clean_first_touch_when_moving_at_speed_into_advanced_areas",
    "confident_ball_carrying_over_longer_distances",
    "quality_delivery_of_crosses_from_wide_and_advanced_positions",
    "strong_overlapping_and_underlapping_receiving_skills",
    "ability_to_combine_quickly_with_wide_attackers",
    "reliable_short_and_medium_range_passing",
    "ability_to_play_accurate_cutbacks_into_forwards",
    "confident_touches_and_dribbling_in_1v1_attacking_moments",
    "strong_ability_to_switch_play_from_wide_channels",
    "reliable_control_when_receiving_high_and_bouncing_balls"
  ]
}', 8),
('position_attributes_in_possession', 'defensive_fb', '{
  "position": "defensive_fb",
  "attributes": [
    "clean_and_secure_first_touch_under_pressure",
    "reliable_short_passing_to_help_build_from_deep",
    "strong_ability_to_retain_the_ball_in_tight_areas",
    "confident_receiving_on_both_feet_when_facing_own_goal",
    "accurate_medium_range_passes_into_midfield",
    "ability_to_play_simple_progression_passes_through_the_nearest_line",
    "controlled_ball_carrying_to_move_out_of_pressure",
    "good_quality_clearing_techniques_when_required",
    "confident_control_of_bouncing_and_high_balls",
    "ability_to_set_the_ball_for_teammates_with_consistent_weight_of_pass"
  ]
}', 9),
('position_attributes_in_possession', 'number_6', '{
  "position": "number_6",
  "attributes": [
    "clean_and_secure_first_touch_when_receiving_under_pressure",
    "confident_receiving_on_the_half_turn_on_both_feet",
    "strong_ability_to_control_and_protect_the_ball_in_tight_areas",
    "reliable_short_and_medium_range_passing_to_connect_the_team",
    "strong_ability_to_break_lines_using_passing",
    "confident_ball_carrying_to_move_the_team_forward",
    "accurate_switching_of_play_over_varying_distances",
    "strong_ability_to_receive_from_all_angles_including_facing_own_goal",
    "ability_to_disguise_and_vary_passing_techniques_when_required",
    "consistent_ability_to_set_the_ball_with_correct_weight_and_speed"
  ]
}', 10),
('position_attributes_in_possession', 'number_8', '{
  "position": "number_8",
  "attributes": [
    "clean_and_secure_first_touch_under_pressure",
    "confident_receiving_on_the_half_turn_on_both_feet",
    "strong_ability_to_carry_the_ball_forward_over_short_and_medium_distances",
    "reliable_short_and_medium_range_passing",
    "strong_ability_to_break_lines_using_passing",
    "ability_to_combine_in_tight_areas_with_teammates",
    "strong_ability_to_receive_and_control_the_ball_while_moving_at_pace",
    "consistent_ability_to_switch_play_effectively",
    "ability_to_receive_in_central_and_half_space_areas",
    "reliable_passing_with_correct_weight_and_timing"
  ]
}', 11),
('position_attributes_in_possession', 'number_10', '{
  "position": "number_10",
  "attributes": [
    "clean_and_secure_first_touch_under_pressure",
    "confident_receiving_on_the_half_turn_on_both_feet",
    "strong_ability_to_carry_the_ball_forward_in_attacking_areas",
    "reliable_short_and_medium_range_passing",
    "strong_ability_to_combine_in_tight_areas_around_the_box",
    "strong_ability_to_create_goals_through_accurate_passing_or_final_delivery",
    "strong_ability_to_receive_and_control_the_ball_while_moving_at_pace",
    "strong_ability_to_finish_scoring_opportunities_inside_and_outside_the_box",
    "ability_to_receive_in_central_and_half_space_areas",
    "reliable_first_time_passing_or_shooting_in_close_quarters"
  ]
}', 12),
('position_attributes_in_possession', 'inside_forward', '{
  "position": "inside_forward",
  "attributes": [
    "strong_ability_to_dominate_opponents_in_1v1_attacking_situations",
    "strong_ability_to_finish_scoring_opportunities_inside_and_outside_the_box",
    "strong_ability_to_create_goals_through_accurate_passing_or_final_delivery",
    "clean_and_secure_first_touch_under_pressure",
    "confident_receiving_on_the_half_turn_on_both_feet",
    "strong_ability_to_carry_the_ball_into_attacking_areas",
    "reliable_short_and_medium_range_passing",
    "strong_ability_to_combine_in_tight_areas_with_teammates",
    "ability_to_receive_in_central_and_half_space_areas",
    "reliable_first_time_passing_or_shooting_in_advanced_areas"
  ]
}', 13),
('position_attributes_in_possession', 'winger', '{
  "position": "winger",
  "attributes": [
    "strong_ability_to_eliminate_opponents_and_dominate_defenders_in_1v1_moments",
    "strong_ability_to_deliver_accurate_crosses_and_cutbacks_into_goal_scoring_areas",
    "confident_ball_carrying_at_speed_into_attacking_areas",
    "strong_ability_to_strike_the_ball_cleanly_in_shooting_positions",
    "strong_ability_to_create_goals_through_passes_or_final_delivery",
    "clean_and_secure_first_touch_under_pressure",
    "strong_ability_to_combine_in_tight_areas_with_overlapping_teammates",
    "ability_to_receive_in_wide_and_half_space_areas",
    "strong_ability_to_switch_play_from_wide_channels",
    "reliable_first_time_passing_or_shooting_in_advanced_areas"
  ]
}', 14),
('position_attributes_in_possession', 'complete_striker', '{
  "position": "complete_striker",
  "attributes": [
    "strong_ability_to_finish_scoring_opportunities_inside_and_outside_the_box",
    "strong_ability_to_create_goals_through_accurate_passes_or_final_delivery",
    "strong_ability_to_dominate_defenders_in_1v1_situations",
    "clean_and_secure_first_touch_under_pressure",
    "strong_ability_to_hold_the_ball_up_and_link_play_with_teammates",
    "strong_ability_to_receive_on_the_half_turn",
    "strong_ability_to_make_runs_beyond_the_back_line",
    "strong_ability_to_combine_in_tight_areas_around_the_box",
    "strong_ability_to_carry_the_ball_toward_goal_with_control",
    "reliable_first_time_finishing_or_passing_in_close_quarters"
  ]
}', 15),
('position_attributes_in_possession', 'striker', '{
  "position": "striker",
  "attributes": [
    "strong_ability_to_finish_scoring_opportunities_inside_and_outside_the_box",
    "strong_ability_to_create_goals_through_accurate_passes_or_final_delivery",
    "strong_ability_to_dominate_defenders_in_1v1_situations",
    "clean_and_secure_first_touch_under_pressure",
    "strong_ability_to_hold_the_ball_up_and_link_play_with_teammates",
    "strong_ability_to_receive_on_the_half_turn",
    "strong_ability_to_make_runs_beyond_the_back_line",
    "strong_ability_to_combine_in_tight_areas_around_the_box",
    "strong_ability_to_carry_the_ball_toward_goal_with_control",
    "reliable_first_time_finishing_or_passing_in_close_quarters"
  ]
}', 16),
('position_attributes_in_possession', 'poacher', '{
  "position": "poacher",
  "attributes": [
    "strong_ability_to_finish_scoring_opportunities_inside_the_box",
    "strong_ability_to_create_goals_through_quick_passes_or_final_delivery",
    "strong_ability_to_dominate_defenders_in_tight_1v1_situations_near_goal",
    "clean_and_secure_first_touch_in_tight_spaces",
    "strong_ability_to_anticipate_and_react_to_rebounds_or_loose_balls",
    "strong_ability_to_position_effectively_in_goal_scoring_areas",
    "strong_ability_to_combine_in_very_tight_areas_around_the_box",
    "strong_ability_to_execute_quick_first_time_shots",
    "strong_ability_to_make_short_intelligent_runs_behind_the_back_line",
    "reliable_finishing_under_pressure_from_central_and_wide_deliveries"
  ]
}', 17),
('position_attributes_in_possession', 'target_man', '{
  "position": "target_man",
  "attributes": [
    "strong_ability_to_hold_the_ball_up_under_pressure",
    "strong_ability_to_finish_scoring_opportunities_inside_and_outside_the_box",
    "strong_ability_to_create_goals_through_accurate_lay_offs_or_final_delivery",
    "strong_ability_to_dominate_defenders_in_physical_1v1_situations",
    "clean_and_secure_first_touch_to_control_aerial_and_ground_balls",
    "strong_ability_to_link_play_with_midfielders_and_wide_players",
    "strong_ability_to_carry_the_ball_forward_with_control",
    "strong_ability_to_receive_with_back_to_goal_and_shield_the_ball",
    "strong_ability_to_attack_spaces_and_make_runs_behind_the_back_line",
    "reliable_first_time_passing_or_finishing_in_tight_areas"
  ]
}', 18);

-- ========================================
-- POSITION DEFAULT ATTRIBUTES - Out of Possession
-- These define the top 10 out-of-possession attributes for each position
-- ========================================
INSERT INTO system_defaults (category, key, value, display_order) VALUES
('position_attributes_out_of_possession', 'gk', '{
  "position": "gk",
  "attributes": [
    "strong_ability_to_make_saves_in_1v1_situations",
    "strong_ability_to_react_quickly_to_close_range_shots",
    "strong_ability_to_dive_effectively_to_both_feet",
    "strong_ability_to_anticipate_opponents_shooting_angles",
    "strong_ability_to_maintain_composure_under_pressure_in_the_box",
    "strong_ability_to_claim_crosses_from_wide_or_central_areas",
    "strong_ability_to_punch_or_deflect_crosses_safely_under_pressure",
    "strong_ability_to_command_the_penalty_area_and_dominate_space_against_attackers",
    "strong_ability_to_position_effectively_to_narrow_shooting_angles",
    "strong_ability_to_parry_dangerous_shots_away_from_goal"
  ]
}', 1),
('position_attributes_out_of_possession', 'fullback', '{
  "position": "fullback",
  "attributes": [
    "strong_ability_to_maintain_correct_defensive_positioning_relative_to_teammates_and_ball",
    "strong_ability_to_tackle_effectively_in_1v1_situations",
    "strong_ability_to_mark_opposition_wide_players",
    "strong_ability_to_track_runners_in_wide_and_half_spaces",
    "strong_ability_to_support_center_backs_in_defensive_situations",
    "strong_ability_to_intercept_passes_in_wide_areas",
    "strong_ability_to_contain_and_delay_opposition_attacks",
    "strong_ability_to_maintain_team_shape_and_width",
    "strong_ability_to_communicate_with_defensive_line_and_midfield",
    "strong_ability_to_close_down_wide_attackers_efficiently"
  ]
}', 2),
('position_attributes_out_of_possession', 'centre_back', '{
  "position": "centre_back",
  "attributes": [
    "strong_ability_to_maintain_correct_defensive_positioning_relative_to_teammates_and_ball",
    "strong_ability_to_mark_opposition_attackers_tightly",
    "strong_ability_to_track_runners_in_central_and_wide_channels",
    "strong_ability_to_win_1v1_duels",
    "strong_ability_to_intercept_passes",
    "strong_ability_to_tackle_effectively",
    "strong_ability_to_maintain_team_shape_and_defensive_organization",
    "strong_ability_to_communicate_with_teammates",
    "strong_ability_to_defend_set_piece_situations",
    "strong_ability_to_cover_space_behind_teammates"
  ]
}', 3),
('position_attributes_out_of_possession', 'midfielder', '{
  "position": "midfielder",
  "attributes": [
    "strong_ability_to_win_1v1_defensive_duels_in_central_areas",
    "strong_ability_to_press_opponents_aggressively_and_intelligently",
    "strong_ability_to_counter_press_immediately_after_possession_is_lost",
    "strong_ability_to_delay_attackers_to_allow_team_shape_to_recover",
    "strong_ability_to_intercept_passes_in_midfield",
    "strong_ability_to_tackle_cleanly_and_regain_possession",
    "strong_ability_to_block_shots_or_key_passes_from_central_areas",
    "strong_ability_to_track_runners_beyond_and_around_them",
    "strong_ability_to_anticipate_and_cut_off_passing_lanes",
    "strong_ability_to_apply_pressure_without_being_played_around"
  ]
}', 4),
('position_attributes_out_of_possession', 'wide_attacker', '{
  "position": "wide_attacker",
  "attributes": [
    "strong_ability_to_win_1v1_defensive_duels_in_wide_areas",
    "strong_ability_to_press_fullbacks_and_centre_backs_aggressively",
    "strong_ability_to_counter_press_immediately_after_losing_the_ball",
    "strong_ability_to_delay_attackers_in_wide_channels",
    "strong_ability_to_force_opponents_into_predictable_areas",
    "strong_ability_to_intercept_passes_played_into_wide_zones",
    "strong_ability_to_block_crosses_early",
    "strong_ability_to_anticipate_and_jump_passing_lanes",
    "strong_ability_to_maintain_pressure_without_being_easily_played_around",
    "strong_ability_to_win_loose_balls_and_second_balls_in_wide_areas"
  ]
}', 5),
('position_attributes_out_of_possession', 'centre_forward', '{
  "position": "centre_forward",
  "attributes": [
    "strong_ability_to_press_centre_backs_aggressively_and_intelligently",
    "strong_ability_to_win_1v1_defensive_duels_against_centre_backs_or_pivots",
    "strong_ability_to_counter_press_immediately_after_losing_the_ball",
    "strong_ability_to_block_central_passing_lanes_into_the_opposition_pivot",
    "strong_ability_to_force_opposition_build_up_into_predictable_areas",
    "strong_ability_to_close_down_goalkeepers_effectively",
    "strong_ability_to_anticipate_passes_into_midfield_and_intercept",
    "strong_ability_to_apply_pressure_without_being_easily_bypassed",
    "strong_ability_to_disrupt_opposition_build_up_with_pressing_angles",
    "strong_ability_to_win_loose_balls_and_second_balls_around_the_box"
  ]
}', 6),
('position_attributes_out_of_possession', 'inverted_fb', '{
  "position": "inverted_fb",
  "attributes": [
    "strong_ability_to_engage_in_1v1_defensive_duels_against_midfielders_or_attackers",
    "strong_ability_to_tackle_effectively_in_central_or_wide_areas",
    "strong_ability_to_track_runners_moving_into_half_spaces",
    "strong_ability_to_mark_opposition_midfielders_or_wide_attackers",
    "strong_ability_to_recover_quickly_when_out_of_position",
    "strong_ability_to_contain_opposition_attacks_in_central_and_half_space_areas",
    "strong_ability_to_intercept_passes_between_lines",
    "strong_ability_to_block_shots_or_passes_from_opponents_in_central_areas",
    "strong_ability_to_force_opponents_into_less_dangerous_channels",
    "strong_ability_to_delay_attacks_to_allow_defensive_organization"
  ]
}', 7),
('position_attributes_out_of_possession', 'attacking_fb', '{
  "position": "attacking_fb",
  "attributes": [
    "strong_ability_to_engage_in_1v1_defensive_duels_against_opposition_wingers_or_wide_midfielders",
    "strong_ability_to_tackle_effectively_in_wide_areas",
    "strong_ability_to_close_down_opponents_quickly_on_the_ball",
    "strong_ability_to_track_runners_making_overlapping_or_inside_runs",
    "strong_ability_to_recover_quickly_when_caught_high_up_the_pitch",
    "strong_ability_to_mark_opposition_wide_attackers_cutting_inside",
    "strong_ability_to_contain_opposition_attacks_in_wide_areas",
    "strong_ability_to_intercept_passes_from_advanced_wide_players",
    "strong_ability_to_block_crosses_or_passes_from_wide_areas",
    "strong_ability_to_force_opponents_into_less_dangerous_areas"
  ]
}', 8),
('position_attributes_out_of_possession', 'defensive_fb', '{
  "position": "defensive_fb",
  "attributes": [
    "strong_ability_to_engage_in_1v1_defensive_duels_against_opposition_wingers_or_wide_attackers",
    "strong_ability_to_tackle_effectively_in_wide_areas",
    "strong_ability_to_close_down_opponents_quickly_on_the_ball",
    "strong_ability_to_track_runners_making_overlapping_or_inside_runs",
    "strong_ability_to_mark_opposition_wide_players",
    "strong_ability_to_contain_opposition_attacks_in_wide_areas",
    "strong_ability_to_intercept_passes_from_wide_players_or_midfielders",
    "strong_ability_to_block_crosses_and_passes_from_wide_areas",
    "strong_ability_to_force_opponents_into_less_dangerous_areas",
    "strong_ability_to_win_aerial_duels"
  ]
}', 9),
('position_attributes_out_of_possession', 'number_6', '{
  "position": "number_6",
  "attributes": [
    "strong_ability_to_engage_in_1v1_defensive_duels_against_opposition_central_midfielders",
    "strong_ability_to_tackle_effectively_in_central_areas",
    "strong_ability_to_intercept_passes_between_lines",
    "strong_ability_to_block_shooting_or_passing_lanes_in_midfield",
    "strong_ability_to_contain_opposition_attacks_in_central_areas",
    "strong_ability_to_recover_quickly_when_out_of_position",
    "strong_ability_to_track_runners_from_deep_or_wide_positions",
    "strong_ability_to_anticipate_opponent_passes_and_movements",
    "strong_ability_to_force_opponents_into_less_dangerous_areas",
    "strong_ability_to_delay_attacks_to_allow_team_defensive_organization"
  ]
}', 10),
('position_attributes_out_of_possession', 'number_8', '{
  "position": "number_8",
  "attributes": [
    "strong_ability_to_engage_in_1v1_defensive_duels_against_opposition_central_or_wide_midfielders",
    "strong_ability_to_tackle_effectively_in_central_or_half_space_areas",
    "strong_ability_to_intercept_passes_between_lines",
    "strong_ability_to_block_shooting_or_passing_lanes_in_midfield",
    "strong_ability_to_contain_opposition_attacks_in_central_and_half_space_areas",
    "strong_ability_to_track_runners_from_deep_wide_or_late_attacking_positions",
    "strong_ability_to_anticipate_opponent_passes_and_movements",
    "strong_ability_to_recover_quickly_when_out_of_position",
    "strong_ability_to_force_opponents_into_less_dangerous_areas",
    "strong_ability_to_delay_attacks_to_allow_team_defensive_organization"
  ]
}', 11),
('position_attributes_out_of_possession', 'number_10', '{
  "position": "number_10",
  "attributes": [
    "strong_ability_to_engage_in_1v1_defensive_duels_against_opposition_central_or_wide_midfielders",
    "strong_ability_to_tackle_effectively_in_central_or_half_space_areas",
    "strong_ability_to_intercept_passes_between_lines",
    "strong_ability_to_block_shooting_or_passing_lanes_in_midfield",
    "strong_ability_to_contain_opposition_attacks_in_central_and_half_space_areas",
    "strong_ability_to_track_runners_from_deep_wide_or_late_attacking_positions",
    "strong_ability_to_anticipate_opponent_passes_and_movements",
    "strong_ability_to_recover_quickly_when_out_of_position",
    "strong_ability_to_force_opponents_into_less_dangerous_areas",
    "strong_ability_to_delay_attacks_to_allow_team_defensive_organization"
  ]
}', 12),
('position_attributes_out_of_possession', 'inside_forward', '{
  "position": "inside_forward",
  "attributes": [
    "strong_ability_to_engage_in_1v1_defensive_duels_against_opposition_fullbacks_or_wide_midfielders",
    "strong_ability_to_tackle_effectively_in_wide_or_half_space_areas",
    "strong_ability_to_close_down_opponents_quickly_on_the_ball",
    "strong_ability_to_track_runners_making_overlapping_or_inside_runs",
    "strong_ability_to_recover_quickly_when_caught_high_up_the_pitch",
    "strong_ability_to_mark_opposition_wide_attackers_cutting_inside",
    "strong_ability_to_contain_opposition_attacks_in_wide_and_half_space_areas",
    "strong_ability_to_intercept_passes_from_wide_players_or_central_midfielders",
    "strong_ability_to_block_passes_or_crosses_from_advanced_wide_areas",
    "strong_ability_to_force_opponents_into_less_dangerous_areas"
  ]
}', 13),
('position_attributes_out_of_possession', 'winger', '{
  "position": "winger",
  "attributes": [
    "strong_ability_to_tackle_effectively_in_1v1_situations",
    "strong_ability_to_press_opposition_fullbacks_and_wide_midfielders",
    "strong_ability_to_track_back_to_support_fullbacks_defensively",
    "strong_ability_to_mark_opposition_wide_players",
    "strong_ability_to_anticipate_opponent_movements_in_wide_channels",
    "strong_ability_to_close_down_opponents_quickly_on_the_ball",
    "strong_ability_to_communicate_and_coordinate_with_teammates",
    "strong_ability_to_contain_opposition_attacks_in_wide_areas",
    "strong_ability_to_recover_quickly_after_being_caught_high_up_the_pitch",
    "strong_ability_to_coordinate_pressing_triggers_with_teammates"
  ]
}', 14),
('position_attributes_out_of_possession', 'complete_striker', '{
  "position": "complete_striker",
  "attributes": [
    "strong_ability_to_engage_in_1v1_defensive_duels_against_defenders",
    "strong_ability_to_press_opposition_center_backs_and_deep_defenders",
    "strong_ability_to_anticipate_opponent_passes_and_movements",
    "strong_ability_to_contain_defenders_and_block_passing_lanes",
    "strong_ability_to_communicate_with_teammates_to_coordinate_pressing",
    "strong_ability_to_maintain_correct_positioning_relative_to_defensive_line_and_teammates",
    "strong_ability_to_track_back_into_midfield_when_required",
    "strong_ability_to_delay_opposition_attacks_to_allow_team_defensive_organization",
    "strong_ability_to_recover_quickly_after_being_caught_high_up_the_pitch",
    "strong_ability_to_force_opponents_into_less_dangerous_areas"
  ]
}', 15),
('position_attributes_out_of_possession', 'striker', '{
  "position": "striker",
  "attributes": [
    "strong_ability_to_engage_in_1v1_defensive_duels_against_defenders",
    "strong_ability_to_press_opposition_center_backs_and_deep_defenders",
    "strong_ability_to_anticipate_opponent_passes_and_movements",
    "strong_ability_to_contain_defenders_and_block_passing_lanes",
    "strong_ability_to_communicate_with_teammates_to_coordinate_pressing",
    "strong_ability_to_maintain_correct_positioning_relative_to_defensive_line_and_teammates",
    "strong_ability_to_track_back_into_midfield_when_required",
    "strong_ability_to_delay_opposition_attacks_to_allow_team_defensive_organization",
    "strong_ability_to_recover_quickly_after_being_caught_high_up_the_pitch",
    "strong_ability_to_force_opponents_into_less_dangerous_areas"
  ]
}', 16),
('position_attributes_out_of_possession', 'poacher', '{
  "position": "poacher",
  "attributes": [
    "strong_ability_to_engage_in_1v1_defensive_duels_against_defenders",
    "strong_ability_to_press_opposition_center_backs_and_deep_defenders",
    "strong_ability_to_anticipate_opponent_passes_and_movements_in_the_final_third",
    "strong_ability_to_contain_defenders_and_block_passing_lanes_in_advanced_areas",
    "strong_ability_to_communicate_with_teammates_to_coordinate_pressing",
    "strong_ability_to_maintain_correct_positioning_relative_to_defensive_line_and_teammates",
    "strong_ability_to_force_defenders_into_less_dangerous_areas",
    "strong_ability_to_recover_quickly_after_being_caught_high_up_the_pitch",
    "strong_ability_to_delay_opposition_buildup_in_advanced_areas",
    "strong_ability_to_coordinate_pressing_triggers_with_wide_players_and_midfielders"
  ]
}', 17),
('position_attributes_out_of_possession', 'target_man', '{
  "position": "target_man",
  "attributes": [
    "strong_ability_to_engage_in_1v1_defensive_duels_against_defenders",
    "strong_ability_to_press_opposition_center_backs_and_deep_defenders",
    "strong_ability_to_anticipate_opponent_passes_and_movements",
    "strong_ability_to_contain_defenders_and_block_passing_lanes",
    "strong_ability_to_communicate_with_teammates_to_coordinate_pressing",
    "strong_ability_to_maintain_correct_positioning_relative_to_defensive_line_and_teammates",
    "strong_ability_to_force_defenders_into_less_dangerous_areas",
    "strong_ability_to_recover_quickly_after_being_caught_high_up_the_pitch",
    "strong_ability_to_delay_opposition_buildup_to_allow_team_defensive_organization",
    "strong_ability_to_coordinate_pressing_triggers_with_wide_players_and_midfielders"
  ]
}', 18);
