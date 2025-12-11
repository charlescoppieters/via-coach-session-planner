-- ========================================
-- VIA SESSION PLANNER V2 - Seed Data
-- ========================================
-- Run this AFTER schema.sql to populate system defaults
-- This includes: positions, attributes, equipment, space options
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
-- ATTRIBUTES - Technical
-- ========================================
INSERT INTO system_defaults (category, key, value, display_order) VALUES
('attributes', 'passing', '{"name": "Passing", "description": "Accuracy and range of passing", "category": "technical"}', 1),
('attributes', 'dribbling', '{"name": "Dribbling", "description": "Ability to carry the ball past opponents", "category": "technical"}', 2),
('attributes', 'first_touch', '{"name": "First Touch", "description": "Control and quality of first touch", "category": "technical"}', 3),
('attributes', 'crossing', '{"name": "Crossing", "description": "Delivery of balls into the box from wide areas", "category": "technical"}', 4),
('attributes', 'shooting', '{"name": "Shooting", "description": "Accuracy and power of shots on goal", "category": "technical"}', 5),
('attributes', 'heading', '{"name": "Heading", "description": "Aerial ability with the ball", "category": "technical"}', 6),
('attributes', 'tackling', '{"name": "Tackling", "description": "Ability to win the ball from opponents", "category": "technical"}', 7),
('attributes', 'ball_control', '{"name": "Ball Control", "description": "Close control and manipulation of the ball", "category": "technical"}', 8),
('attributes', 'finishing', '{"name": "Finishing", "description": "Ability to convert chances into goals", "category": "technical"}', 9),
('attributes', 'long_shots', '{"name": "Long Shots", "description": "Shooting ability from distance", "category": "technical"}', 10),
('attributes', 'free_kicks', '{"name": "Free Kicks", "description": "Set piece delivery and execution", "category": "technical"}', 11),
('attributes', 'penalties', '{"name": "Penalties", "description": "Penalty kick taking ability", "category": "technical"}', 12);

-- ========================================
-- ATTRIBUTES - Physical
-- ========================================
INSERT INTO system_defaults (category, key, value, display_order) VALUES
('attributes', 'pace', '{"name": "Pace", "description": "Running speed and acceleration", "category": "physical"}', 20),
('attributes', 'strength', '{"name": "Strength", "description": "Physical power in challenges", "category": "physical"}', 21),
('attributes', 'stamina', '{"name": "Stamina", "description": "Endurance and energy levels throughout match", "category": "physical"}', 22),
('attributes', 'agility', '{"name": "Agility", "description": "Quickness in changing direction", "category": "physical"}', 23),
('attributes', 'balance', '{"name": "Balance", "description": "Stability when challenged or turning", "category": "physical"}', 24),
('attributes', 'jumping', '{"name": "Jumping", "description": "Vertical leap ability", "category": "physical"}', 25),
('attributes', 'acceleration', '{"name": "Acceleration", "description": "Speed to reach top pace", "category": "physical"}', 26),
('attributes', 'natural_fitness', '{"name": "Natural Fitness", "description": "Recovery and injury resistance", "category": "physical"}', 27);

-- ========================================
-- ATTRIBUTES - Mental
-- ========================================
INSERT INTO system_defaults (category, key, value, display_order) VALUES
('attributes', 'vision', '{"name": "Vision", "description": "Awareness of teammates and passing options", "category": "mental"}', 40),
('attributes', 'positioning', '{"name": "Positioning", "description": "Ability to find and maintain good positions", "category": "mental"}', 41),
('attributes', 'decision_making', '{"name": "Decision Making", "description": "Choosing the right option under pressure", "category": "mental"}', 42),
('attributes', 'leadership', '{"name": "Leadership", "description": "Ability to organize and motivate teammates", "category": "mental"}', 43),
('attributes', 'communication', '{"name": "Communication", "description": "Vocal and non-vocal team coordination", "category": "mental"}', 44),
('attributes', 'composure', '{"name": "Composure", "description": "Calmness under pressure", "category": "mental"}', 45),
('attributes', 'tactical_awareness', '{"name": "Tactical Awareness", "description": "Understanding of team shape and roles", "category": "mental"}', 46),
('attributes', 'work_rate', '{"name": "Work Rate", "description": "Effort and industry without the ball", "category": "mental"}', 47),
('attributes', 'concentration', '{"name": "Concentration", "description": "Focus throughout the match", "category": "mental"}', 48),
('attributes', 'anticipation', '{"name": "Anticipation", "description": "Reading the game and predicting play", "category": "mental"}', 49),
('attributes', 'bravery', '{"name": "Bravery", "description": "Willingness to challenge and compete", "category": "mental"}', 50),
('attributes', 'determination', '{"name": "Determination", "description": "Drive and desire to succeed", "category": "mental"}', 51),
('attributes', 'teamwork', '{"name": "Teamwork", "description": "Cooperation and support of teammates", "category": "mental"}', 52);

-- ========================================
-- ATTRIBUTES - Goalkeeping (Specific)
-- ========================================
INSERT INTO system_defaults (category, key, value, display_order) VALUES
('attributes', 'shot_stopping', '{"name": "Shot Stopping", "description": "Ability to save shots on goal", "category": "goalkeeping"}', 60),
('attributes', 'handling', '{"name": "Handling", "description": "Catching and holding the ball securely", "category": "goalkeeping"}', 61),
('attributes', 'distribution', '{"name": "Distribution", "description": "Accuracy of throws and kicks", "category": "goalkeeping"}', 62),
('attributes', 'aerial_ability', '{"name": "Aerial Ability", "description": "Claiming crosses and high balls", "category": "goalkeeping"}', 63),
('attributes', 'reflexes', '{"name": "Reflexes", "description": "Reaction speed to close-range shots", "category": "goalkeeping"}', 64),
('attributes', 'one_on_ones', '{"name": "One-on-Ones", "description": "Dealing with breakaway situations", "category": "goalkeeping"}', 65),
('attributes', 'command_of_area', '{"name": "Command of Area", "description": "Organizing defense and claiming balls", "category": "goalkeeping"}', 66),
('attributes', 'kicking', '{"name": "Kicking", "description": "Goal kicks and clearance distance/accuracy", "category": "goalkeeping"}', 67),
('attributes', 'throwing', '{"name": "Throwing", "description": "Distribution by hand", "category": "goalkeeping"}', 68),
('attributes', 'sweeping', '{"name": "Sweeping", "description": "Coming off line to clear danger", "category": "goalkeeping"}', 69);

-- ========================================
-- POSITIONS - Standard
-- ========================================
INSERT INTO system_defaults (category, key, value, display_order) VALUES
('positions', 'goalkeeper', '{
  "name": "Goalkeeper",
  "abbreviation": "GK",
  "is_advanced": false,
  "default_attributes": ["shot_stopping", "handling", "distribution", "communication", "aerial_ability"]
}', 1),
('positions', 'centre_back', '{
  "name": "Centre Back",
  "abbreviation": "CB",
  "is_advanced": false,
  "default_attributes": ["tackling", "heading", "positioning", "passing", "leadership"]
}', 2),
('positions', 'full_back', '{
  "name": "Full Back",
  "abbreviation": "FB",
  "is_advanced": false,
  "default_attributes": ["tackling", "pace", "crossing", "stamina", "positioning"]
}', 3),
('positions', 'defensive_midfielder', '{
  "name": "Defensive Midfielder",
  "abbreviation": "DM",
  "is_advanced": false,
  "default_attributes": ["tackling", "positioning", "passing", "tactical_awareness", "stamina"]
}', 4),
('positions', 'central_midfielder', '{
  "name": "Central Midfielder",
  "abbreviation": "CM",
  "is_advanced": false,
  "default_attributes": ["passing", "vision", "stamina", "tackling", "ball_control"]
}', 5),
('positions', 'attacking_midfielder', '{
  "name": "Attacking Midfielder",
  "abbreviation": "AM",
  "is_advanced": false,
  "default_attributes": ["vision", "passing", "dribbling", "finishing", "composure"]
}', 6),
('positions', 'winger', '{
  "name": "Winger",
  "abbreviation": "W",
  "is_advanced": false,
  "default_attributes": ["pace", "dribbling", "crossing", "acceleration", "work_rate"]
}', 7),
('positions', 'striker', '{
  "name": "Striker",
  "abbreviation": "ST",
  "is_advanced": false,
  "default_attributes": ["finishing", "positioning", "heading", "composure", "first_touch"]
}', 8);

-- ========================================
-- POSITIONS - Advanced Variants
-- ========================================
INSERT INTO system_defaults (category, key, value, display_order) VALUES
('positions', 'sweeper_keeper', '{
  "name": "Sweeper Keeper",
  "abbreviation": "SK",
  "is_advanced": true,
  "parent_position": "goalkeeper",
  "description": "Goalkeeper who actively sweeps behind the defense and plays with feet",
  "default_attributes": ["shot_stopping", "sweeping", "distribution", "passing", "composure"]
}', 10),
('positions', 'ball_playing_cb', '{
  "name": "Ball-Playing Centre Back",
  "abbreviation": "BPD",
  "is_advanced": true,
  "parent_position": "centre_back",
  "description": "Centre back comfortable bringing the ball out from defense",
  "default_attributes": ["passing", "ball_control", "composure", "tackling", "vision"]
}', 11),
('positions', 'inverted_fullback', '{
  "name": "Inverted Full Back",
  "abbreviation": "IFB",
  "is_advanced": true,
  "parent_position": "full_back",
  "description": "Full back who tucks into midfield when in possession",
  "default_attributes": ["positioning", "passing", "ball_control", "tactical_awareness", "composure"]
}', 12),
('positions', 'defensive_fullback', '{
  "name": "Defensive Full Back",
  "abbreviation": "DFB",
  "is_advanced": true,
  "parent_position": "full_back",
  "description": "Full back prioritizing defensive duties",
  "default_attributes": ["tackling", "positioning", "concentration", "heading", "strength"]
}', 13),
('positions', 'wing_back', '{
  "name": "Wing Back",
  "abbreviation": "WB",
  "is_advanced": true,
  "parent_position": "full_back",
  "description": "Full back in a 3-at-the-back system with attacking responsibilities",
  "default_attributes": ["stamina", "crossing", "pace", "dribbling", "work_rate"]
}', 14),
('positions', 'box_to_box', '{
  "name": "Box-to-Box Midfielder",
  "abbreviation": "B2B",
  "is_advanced": true,
  "parent_position": "central_midfielder",
  "description": "Midfielder covering both boxes with energy and work rate",
  "default_attributes": ["stamina", "tackling", "passing", "shooting", "work_rate"]
}', 15),
('positions', 'deep_lying_playmaker', '{
  "name": "Deep-Lying Playmaker",
  "abbreviation": "DLP",
  "is_advanced": true,
  "parent_position": "central_midfielder",
  "description": "Midfield orchestrator operating in deeper positions",
  "default_attributes": ["passing", "vision", "composure", "first_touch", "tactical_awareness"]
}', 16),
('positions', 'mezzala', '{
  "name": "Mezzala",
  "abbreviation": "MEZ",
  "is_advanced": true,
  "parent_position": "central_midfielder",
  "description": "Half-winger who drifts wide and attacks from midfield",
  "default_attributes": ["dribbling", "passing", "pace", "stamina", "finishing"]
}', 17),
('positions', 'regista', '{
  "name": "Regista",
  "abbreviation": "REG",
  "is_advanced": true,
  "parent_position": "defensive_midfielder",
  "description": "Deep-lying playmaker who dictates tempo from defensive midfield",
  "default_attributes": ["passing", "vision", "composure", "first_touch", "ball_control"]
}', 18),
('positions', 'inside_forward', '{
  "name": "Inside Forward",
  "abbreviation": "IF",
  "is_advanced": true,
  "parent_position": "winger",
  "description": "Winger who cuts inside onto stronger foot",
  "default_attributes": ["dribbling", "finishing", "pace", "acceleration", "composure"]
}', 19),
('positions', 'inverted_winger', '{
  "name": "Inverted Winger",
  "abbreviation": "IW",
  "is_advanced": true,
  "parent_position": "winger",
  "description": "Winger playing on opposite flank to create space",
  "default_attributes": ["dribbling", "crossing", "pace", "vision", "first_touch"]
}', 20),
('positions', 'false_nine', '{
  "name": "False Nine",
  "abbreviation": "F9",
  "is_advanced": true,
  "parent_position": "striker",
  "description": "Striker who drops deep to create space and link play",
  "default_attributes": ["vision", "passing", "dribbling", "composure", "first_touch"]
}', 21),
('positions', 'target_man', '{
  "name": "Target Man",
  "abbreviation": "TM",
  "is_advanced": true,
  "parent_position": "striker",
  "description": "Striker who holds up play and brings others into the game",
  "default_attributes": ["strength", "heading", "first_touch", "positioning", "teamwork"]
}', 22),
('positions', 'poacher', '{
  "name": "Poacher",
  "abbreviation": "P",
  "is_advanced": true,
  "parent_position": "striker",
  "description": "Striker focused on being in the right place to score",
  "default_attributes": ["finishing", "positioning", "anticipation", "composure", "acceleration"]
}', 23),
('positions', 'complete_forward', '{
  "name": "Complete Forward",
  "abbreviation": "CF",
  "is_advanced": true,
  "parent_position": "striker",
  "description": "All-round striker capable of all attacking duties",
  "default_attributes": ["finishing", "dribbling", "heading", "first_touch", "strength"]
}', 24),
('positions', 'second_striker', '{
  "name": "Second Striker",
  "abbreviation": "SS",
  "is_advanced": true,
  "parent_position": "striker",
  "description": "Striker playing just behind the main forward",
  "default_attributes": ["passing", "finishing", "dribbling", "vision", "positioning"]
}', 25),
('positions', 'trequartista', '{
  "name": "Trequartista",
  "abbreviation": "TRQ",
  "is_advanced": true,
  "parent_position": "attacking_midfielder",
  "description": "Creative playmaker with freedom to roam",
  "default_attributes": ["vision", "dribbling", "passing", "first_touch", "composure"]
}', 26),
('positions', 'enganche', '{
  "name": "Enganche",
  "abbreviation": "ENG",
  "is_advanced": true,
  "parent_position": "attacking_midfielder",
  "description": "Classic number 10 who operates between the lines",
  "default_attributes": ["vision", "passing", "first_touch", "composure", "finishing"]
}', 27);
