-- ========================================
-- VIA SESSION PLANNER V2 - Complete Database Schema
-- ========================================
-- Run this in your Supabase SQL Editor to set up the entire database
-- This is a fresh start schema - no migration from v1
--
-- OWNERSHIP MODEL:
-- - All data belongs to clubs, not individual coaches
-- - Coaches are members of clubs via club_memberships
-- - Coaches have role: 'admin' (full permissions) or 'coach' (limited permissions)
-- - Multiple admins allowed per club
-- - Coaches are assigned to teams via team_coaches
-- - Admins have elevated permissions (delete, manage coaches, club methodology)
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- GRANTS FOR SUPABASE ROLES
-- ========================================
-- These grants are required for Supabase to work correctly.
-- They allow the authenticated, anon, and service_role users to access the schema.
-- IMPORTANT: Run these after any schema reset (DROP SCHEMA public CASCADE).

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- ========================================
-- TABLES
-- ========================================

-- ----------------------------------------
-- COACHES
-- ----------------------------------------
-- Core user table, linked to Supabase Auth
CREATE TABLE coaches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    profile_picture TEXT,
    position TEXT,
    onboarding_completed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE coaches IS 'Core user table for coaches, linked to Supabase Auth';
COMMENT ON COLUMN coaches.profile_picture IS 'URL to profile picture in Supabase Storage';
COMMENT ON COLUMN coaches.position IS 'Role title: Head Coach, Assistant Coach, Goalkeeping Coach, etc.';
COMMENT ON COLUMN coaches.onboarding_completed IS 'Whether coach has completed onboarding wizard';

-- ----------------------------------------
-- CLUBS
-- ----------------------------------------
-- Organization that owns all data
CREATE TABLE clubs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE clubs IS 'Organizations that own all data. Coaches join clubs via invite links.';

-- ----------------------------------------
-- CLUB MEMBERSHIPS
-- ----------------------------------------
-- Junction table: coaches belong to clubs
CREATE TABLE club_memberships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'coach',
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(club_id, coach_id),
    CONSTRAINT club_memberships_role_check CHECK (role IN ('admin', 'coach'))
);

COMMENT ON TABLE club_memberships IS 'Links coaches to clubs. Role can be admin or coach.';
COMMENT ON COLUMN club_memberships.role IS 'Role: admin (full permissions) or coach (limited permissions). Multiple admins allowed.';

-- ----------------------------------------
-- CLUB INVITES
-- ----------------------------------------
-- One-time invite links for coaches to join clubs
CREATE TABLE club_invites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_by UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE club_invites IS 'One-time invite links for coaches to join clubs.';
COMMENT ON COLUMN club_invites.email IS 'Email address the invite is tied to.';
COMMENT ON COLUMN club_invites.token IS 'Unique token for the invite URL.';
COMMENT ON COLUMN club_invites.used_at IS 'Timestamp when invite was used (NULL if unused).';

-- ----------------------------------------
-- TEAMS
-- ----------------------------------------
-- Teams belong to clubs
CREATE TABLE teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    created_by_coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    age_group TEXT NOT NULL,
    skill_level TEXT NOT NULL,
    gender TEXT,
    player_count INTEGER NOT NULL CHECK (player_count >= 0),
    sessions_per_week INTEGER NOT NULL CHECK (sessions_per_week >= 0),
    session_duration INTEGER NOT NULL CHECK (session_duration >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE teams IS 'Teams within a club. Owned by club, created by a coach.';
COMMENT ON COLUMN teams.created_by_coach_id IS 'Coach who created the team. Used for permission checks.';
COMMENT ON COLUMN teams.session_duration IS 'Default session duration in minutes';

-- ----------------------------------------
-- TEAM COACHES
-- ----------------------------------------
-- Junction table: coaches assigned to teams
CREATE TABLE team_coaches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(team_id, coach_id)
);

COMMENT ON TABLE team_coaches IS 'Assigns coaches to teams they can manage.';

-- ----------------------------------------
-- PLAYERS
-- ----------------------------------------
-- Players belong to teams (and transitively to clubs)
CREATE TABLE players (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER,
    position TEXT,
    gender TEXT,
    target_1 TEXT,
    target_2 TEXT,
    target_3 TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE players IS 'Players on teams. Can be moved between teams within same club.';
COMMENT ON COLUMN players.target_1 IS 'IDP target 1: development focus area';
COMMENT ON COLUMN players.target_2 IS 'IDP target 2: development focus area';
COMMENT ON COLUMN players.target_3 IS 'IDP target 3: development focus area';

-- ----------------------------------------
-- SESSIONS
-- ----------------------------------------
-- Training sessions for teams
CREATE TABLE sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE RESTRICT,
    session_date TIMESTAMPTZ NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    notes TEXT,
    player_count INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    age_group TEXT NOT NULL,
    skill_level TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE sessions IS 'Training sessions created by coaches for their teams.';
COMMENT ON COLUMN sessions.coach_id IS 'Coach who created the session.';
COMMENT ON COLUMN sessions.session_date IS 'Session date and start time.';
COMMENT ON COLUMN sessions.duration IS 'Session duration in minutes.';

-- ----------------------------------------
-- SESSION BLOCKS
-- ----------------------------------------
-- Reusable content blocks that can be shared across sessions
CREATE TABLE session_blocks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Content fields
    title TEXT NOT NULL,
    description TEXT,
    coaching_points TEXT,
    image_url TEXT,
    diagram_data JSONB,
    duration INTEGER,

    -- Ownership & visibility
    creator_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,  -- NULL = global/marketplace block
    is_public BOOLEAN DEFAULT FALSE,                        -- Can other coaches discover this?
    source TEXT DEFAULT 'user' CHECK (source IN ('user', 'system', 'marketplace')),

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE session_blocks IS 'Reusable content blocks that can be shared across sessions and coaches.';
COMMENT ON COLUMN session_blocks.title IS 'Block title (required)';
COMMENT ON COLUMN session_blocks.description IS 'Block description/explanation (optional)';
COMMENT ON COLUMN session_blocks.coaching_points IS 'Key coaching points for this block (optional)';
COMMENT ON COLUMN session_blocks.image_url IS 'Optional image URL (stored in Supabase Storage)';
COMMENT ON COLUMN session_blocks.diagram_data IS 'Tactics board diagram data (JSON array of elements: players, cones, arrows, lines). Mutually exclusive with image_url.';
COMMENT ON COLUMN session_blocks.duration IS 'Duration of this block in minutes (optional)';
COMMENT ON COLUMN session_blocks.creator_id IS 'Coach who created this block';
COMMENT ON COLUMN session_blocks.club_id IS 'NULL for global/marketplace blocks, set for club-specific blocks';
COMMENT ON COLUMN session_blocks.is_public IS 'Whether other coaches can discover and use this block';
COMMENT ON COLUMN session_blocks.source IS 'Origin: user (coach created), system (default), marketplace (purchased)';

-- ----------------------------------------
-- SESSION BLOCK ASSIGNMENTS
-- ----------------------------------------
-- Junction table: links blocks to sessions with ordering
CREATE TABLE session_block_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    block_id UUID NOT NULL REFERENCES session_blocks(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Prevent duplicate block assignments in same session
    UNIQUE(session_id, block_id)
);

COMMENT ON TABLE session_block_assignments IS 'Links reusable blocks to sessions with position ordering.';
COMMENT ON COLUMN session_block_assignments.position IS 'Order of block within the session (0-indexed)';

-- ----------------------------------------
-- SESSION ATTENDANCE
-- ----------------------------------------
-- Track player attendance per session
CREATE TABLE session_attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(session_id, player_id)
);

COMMENT ON TABLE session_attendance IS 'Tracks which players attended each session.';

-- ----------------------------------------
-- SYSTEM DEFAULTS
-- ----------------------------------------
-- Editable system defaults for positions, attributes, equipment
CREATE TABLE system_defaults (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category TEXT NOT NULL,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(category, key)
);

COMMENT ON TABLE system_defaults IS 'System-wide defaults for positions, attributes, equipment, etc.';
COMMENT ON COLUMN system_defaults.category IS 'Category: positions, attributes, equipment, space_options';
COMMENT ON COLUMN system_defaults.key IS 'Unique key within category: goalkeeper, tackling, full_size_goal';
COMMENT ON COLUMN system_defaults.value IS 'JSONB data structure varies by category';

-- ----------------------------------------
-- METHODOLOGY TEMPLATES
-- ----------------------------------------
-- Purchasable/selectable methodology packages (future feature)
CREATE TABLE methodology_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    source TEXT NOT NULL,
    template_type TEXT NOT NULL,
    content JSONB NOT NULL,
    description TEXT,
    logo_url TEXT,
    is_premium BOOLEAN DEFAULT false,
    price_cents INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE methodology_templates IS 'Pre-built methodology packages (QPR, Barcelona, etc.) for future marketplace.';
COMMENT ON COLUMN methodology_templates.source IS 'Origin: QPR, FC Barcelona, VIA, etc.';
COMMENT ON COLUMN methodology_templates.template_type IS 'Type: playing, training, positional, full_bundle';
COMMENT ON COLUMN methodology_templates.price_cents IS 'Price in cents for premium templates';

-- ----------------------------------------
-- PLAYING METHODOLOGY
-- ----------------------------------------
-- How teams should play during matches (zones/rules)
CREATE TABLE playing_methodology (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    created_by_coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    zones JSONB DEFAULT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE playing_methodology IS 'Playing rules/zones. Club-level (team_id NULL) or team-specific.';
COMMENT ON COLUMN playing_methodology.team_id IS 'NULL for club-level rules, set for team-specific rules.';
COMMENT ON COLUMN playing_methodology.created_by_coach_id IS 'Coach who created this rule. Used for edit permissions.';
COMMENT ON COLUMN playing_methodology.zones IS 'JSON array of pitch zones: [{id, x, y, width, height, title, description, color}]';

-- ----------------------------------------
-- TRAINING METHODOLOGY
-- ----------------------------------------
-- How teams train (practice design, coaching style)
CREATE TABLE training_methodology (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    created_by_coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE training_methodology IS 'Training rules. Club-level (team_id NULL) or team-specific.';
COMMENT ON COLUMN training_methodology.team_id IS 'NULL for club-level rules, set for team-specific rules.';
COMMENT ON COLUMN training_methodology.created_by_coach_id IS 'Coach who created this rule. Used for edit permissions.';

-- ----------------------------------------
-- POSITIONAL PROFILES
-- ----------------------------------------
-- Position definitions with attributes
CREATE TABLE positional_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    position_key TEXT NOT NULL,
    custom_position_name TEXT,
    attributes JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE positional_profiles IS 'Position profiles with attributes. Club-level or team-specific copies.';
COMMENT ON COLUMN positional_profiles.position_key IS 'References system_defaults position key, or custom if custom_position_name set.';
COMMENT ON COLUMN positional_profiles.custom_position_name IS 'For custom positions not in system_defaults.';
COMMENT ON COLUMN positional_profiles.attributes IS 'Array of up to 5 attribute keys from system_defaults.';

-- ----------------------------------------
-- TEAM FACILITIES
-- ----------------------------------------
-- Facility configuration per team
CREATE TABLE team_facilities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID UNIQUE NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    space_type TEXT,
    custom_space TEXT,
    equipment JSONB DEFAULT '[]'::jsonb,
    other_factors TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE team_facilities IS 'Facility configuration for each team.';
COMMENT ON COLUMN team_facilities.space_type IS 'full_pitch, half_pitch, quarter_pitch, indoor_hall, other';
COMMENT ON COLUMN team_facilities.custom_space IS 'Description if space_type is other.';
COMMENT ON COLUMN team_facilities.equipment IS 'Array of {type, quantity} objects.';

-- ----------------------------------------
-- POSITION SUGGESTIONS
-- ----------------------------------------
-- Coach suggestions for new positions
CREATE TABLE position_suggestions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    suggested_name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' NOT NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE position_suggestions IS 'Coach suggestions for new positions to add to system.';
COMMENT ON COLUMN position_suggestions.status IS 'pending, approved, rejected';

-- ========================================
-- INDEXES
-- ========================================

-- Coaches
CREATE INDEX idx_coaches_auth_user_id ON coaches(auth_user_id);
CREATE INDEX idx_coaches_email ON coaches(email);

-- Club Memberships
CREATE INDEX idx_club_memberships_club_id ON club_memberships(club_id);
CREATE INDEX idx_club_memberships_coach_id ON club_memberships(coach_id);
CREATE INDEX idx_club_memberships_role ON club_memberships(club_id, role);
CREATE INDEX idx_club_memberships_admin ON club_memberships(club_id) WHERE role = 'admin';

-- Club Invites
CREATE INDEX idx_club_invites_club_id ON club_invites(club_id);
CREATE INDEX idx_club_invites_token ON club_invites(token);
CREATE INDEX idx_club_invites_email ON club_invites(email);
CREATE INDEX idx_club_invites_unused ON club_invites(club_id) WHERE used_at IS NULL;

-- Teams
CREATE INDEX idx_teams_club_id ON teams(club_id);
CREATE INDEX idx_teams_created_by ON teams(created_by_coach_id);

-- Team Coaches
CREATE INDEX idx_team_coaches_team_id ON team_coaches(team_id);
CREATE INDEX idx_team_coaches_coach_id ON team_coaches(coach_id);

-- Players
CREATE INDEX idx_players_club_id ON players(club_id);
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_players_name ON players(name);

-- Sessions
CREATE INDEX idx_sessions_club_id ON sessions(club_id);
CREATE INDEX idx_sessions_team_id ON sessions(team_id);
CREATE INDEX idx_sessions_coach_id ON sessions(coach_id);
CREATE INDEX idx_sessions_date ON sessions(session_date);

-- Session Blocks
CREATE INDEX idx_session_blocks_creator ON session_blocks(creator_id);
CREATE INDEX idx_session_blocks_club ON session_blocks(club_id);
CREATE INDEX idx_session_blocks_public ON session_blocks(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_session_blocks_source ON session_blocks(source);

-- Session Block Assignments
CREATE INDEX idx_sba_session ON session_block_assignments(session_id);
CREATE INDEX idx_sba_block ON session_block_assignments(block_id);
CREATE INDEX idx_sba_position ON session_block_assignments(session_id, position);

-- Session Attendance
CREATE INDEX idx_session_attendance_session_id ON session_attendance(session_id);
CREATE INDEX idx_session_attendance_player_id ON session_attendance(player_id);

-- System Defaults
CREATE INDEX idx_system_defaults_category ON system_defaults(category);
CREATE INDEX idx_system_defaults_active ON system_defaults(category, is_active) WHERE is_active = true;

-- Methodology Templates
CREATE INDEX idx_methodology_templates_type ON methodology_templates(template_type);
CREATE INDEX idx_methodology_templates_active ON methodology_templates(is_active) WHERE is_active = true;

-- Playing Methodology
CREATE INDEX idx_playing_methodology_club_id ON playing_methodology(club_id);
CREATE INDEX idx_playing_methodology_team_id ON playing_methodology(team_id);
CREATE INDEX idx_playing_methodology_club_level ON playing_methodology(club_id) WHERE team_id IS NULL;
CREATE INDEX idx_playing_methodology_zones ON playing_methodology(club_id) WHERE zones IS NOT NULL;

-- Training Methodology
CREATE INDEX idx_training_methodology_club_id ON training_methodology(club_id);
CREATE INDEX idx_training_methodology_team_id ON training_methodology(team_id);
CREATE INDEX idx_training_methodology_club_level ON training_methodology(club_id) WHERE team_id IS NULL;

-- Positional Profiles
CREATE INDEX idx_positional_profiles_club_id ON positional_profiles(club_id);
CREATE INDEX idx_positional_profiles_team_id ON positional_profiles(team_id);
CREATE INDEX idx_positional_profiles_club_level ON positional_profiles(club_id) WHERE team_id IS NULL;

-- Unique constraint to prevent duplicate position profiles per club/team
CREATE UNIQUE INDEX idx_positional_profiles_unique_position
    ON positional_profiles (club_id, position_key)
    WHERE team_id IS NULL;
CREATE UNIQUE INDEX idx_positional_profiles_unique_position_team
    ON positional_profiles (club_id, team_id, position_key)
    WHERE team_id IS NOT NULL;

-- Team Facilities
CREATE INDEX idx_team_facilities_team_id ON team_facilities(team_id);

-- Position Suggestions
CREATE INDEX idx_position_suggestions_club_id ON position_suggestions(club_id);
CREATE INDEX idx_position_suggestions_status ON position_suggestions(status);

-- ========================================
-- TRIGGERS
-- ========================================

-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_coaches_updated_at
    BEFORE UPDATE ON coaches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clubs_updated_at
    BEFORE UPDATE ON clubs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_blocks_updated_at
    BEFORE UPDATE ON session_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_attendance_updated_at
    BEFORE UPDATE ON session_attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_defaults_updated_at
    BEFORE UPDATE ON system_defaults
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_methodology_templates_updated_at
    BEFORE UPDATE ON methodology_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playing_methodology_updated_at
    BEFORE UPDATE ON playing_methodology
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_methodology_updated_at
    BEFORE UPDATE ON training_methodology
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positional_profiles_updated_at
    BEFORE UPDATE ON positional_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_facilities_updated_at
    BEFORE UPDATE ON team_facilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

-- Enable RLS on all tables
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_block_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE methodology_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE playing_methodology ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_methodology ENABLE ROW LEVEL SECURITY;
ALTER TABLE positional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_suggestions ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS POLICIES - COACHES
-- ========================================
-- Keep it simple: coaches can only access their own record.
-- To view other coaches in a club, use JOINs through club_memberships in application queries.

-- Coaches can view their own record
CREATE POLICY "coaches_select_own" ON coaches
    FOR SELECT USING (auth.uid() = auth_user_id);

-- Coaches can insert their own record (during signup)
CREATE POLICY "coaches_insert_own" ON coaches
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Coaches can update their own record
CREATE POLICY "coaches_update_own" ON coaches
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Coaches can delete their own record
CREATE POLICY "coaches_delete_own" ON coaches
    FOR DELETE USING (auth.uid() = auth_user_id);

-- ========================================
-- RLS POLICIES - CLUBS
-- ========================================

-- Club members can view their clubs
CREATE POLICY "clubs_select_member" ON clubs
    FOR SELECT USING (
        id IN (
            SELECT club_id FROM club_memberships
            WHERE coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- Any authenticated coach can create a club
CREATE POLICY "clubs_insert" ON clubs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only admin can update club
CREATE POLICY "clubs_update_admin" ON clubs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = clubs.id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        )
    );

-- Only admin can delete club
CREATE POLICY "clubs_delete_admin" ON clubs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = clubs.id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        )
    );

-- ========================================
-- RLS POLICIES - CLUB MEMBERSHIPS
-- ========================================
-- Keep it simple: coaches can see their own memberships.
-- To view other club members, use JOINs in application queries.

-- Coaches can view their own memberships
CREATE POLICY "club_memberships_select_own" ON club_memberships
    FOR SELECT USING (
        coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
    );

-- Coaches can insert themselves (joining a club or creating one)
-- Note: Admin adding others is handled via application logic to avoid circular RLS references
CREATE POLICY "club_memberships_insert" ON club_memberships
    FOR INSERT WITH CHECK (
        coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
    );

-- Admin can update memberships (change roles)
CREATE POLICY "club_memberships_update" ON club_memberships
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = club_memberships.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        )
    );

-- Admin can remove members, or coach can remove self
CREATE POLICY "club_memberships_delete" ON club_memberships
    FOR DELETE USING (
        -- Self-removal (leaving club)
        coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        OR
        -- Admin removing others
        EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = club_memberships.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        )
    );

-- ========================================
-- RLS POLICIES - CLUB_INVITES
-- ========================================

-- Admin can view invites for their club
CREATE POLICY "club_invites_select" ON club_invites
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = club_invites.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        )
    );

-- Admin can create invites
CREATE POLICY "club_invites_insert" ON club_invites
    FOR INSERT WITH CHECK (
        created_by = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        AND EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = club_invites.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        )
    );

-- Admin can update invites (mark as used)
CREATE POLICY "club_invites_update" ON club_invites
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = club_invites.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        )
    );

-- Admin can delete/revoke invites
CREATE POLICY "club_invites_delete" ON club_invites
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = club_invites.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        )
    );

-- ========================================
-- RLS POLICIES - TEAMS
-- ========================================

-- Club members can view all teams in their clubs
CREATE POLICY "teams_select" ON teams
    FOR SELECT USING (
        club_id IN (
            SELECT club_id FROM club_memberships
            WHERE coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- Club members can create teams
CREATE POLICY "teams_insert" ON teams
    FOR INSERT WITH CHECK (
        club_id IN (
            SELECT club_id FROM club_memberships
            WHERE coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
        AND created_by_coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
    );

-- Team creator, assigned coaches, or admin can update
CREATE POLICY "teams_update" ON teams
    FOR UPDATE USING (
        -- Admin
        EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = teams.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        )
        OR
        -- Team creator
        created_by_coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        OR
        -- Assigned coach
        EXISTS (
            SELECT 1 FROM team_coaches
            WHERE team_id = teams.id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- Only admin can delete teams
CREATE POLICY "teams_delete" ON teams
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = teams.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        )
    );

-- ========================================
-- RLS POLICIES - TEAM COACHES
-- ========================================

-- Club members can view team assignments
CREATE POLICY "team_coaches_select" ON team_coaches
    FOR SELECT USING (
        team_id IN (
            SELECT t.id FROM teams t
            JOIN club_memberships cm ON cm.club_id = t.club_id
            WHERE cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- Admin or team creator can assign coaches
CREATE POLICY "team_coaches_insert" ON team_coaches
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM teams t
            WHERE t.id = team_coaches.team_id
            AND (
                -- Admin
                EXISTS (
                    SELECT 1 FROM club_memberships
                    WHERE club_id = t.club_id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                    AND role = 'admin'
                )
                OR
                -- Team creator
                t.created_by_coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            )
        )
    );

-- Admin or team creator can remove assignments, or self-removal
CREATE POLICY "team_coaches_delete" ON team_coaches
    FOR DELETE USING (
        -- Self-removal
        coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        OR
        EXISTS (
            SELECT 1 FROM teams t
            WHERE t.id = team_coaches.team_id
            AND (
                -- Admin
                EXISTS (
                    SELECT 1 FROM club_memberships
                    WHERE club_id = t.club_id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                    AND role = 'admin'
                )
                OR
                -- Team creator
                t.created_by_coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            )
        )
    );

-- ========================================
-- RLS POLICIES - PLAYERS
-- ========================================

-- All club members can view all players in their club
CREATE POLICY "players_select" ON players
    FOR SELECT USING (
        club_id IN (
            SELECT club_id FROM club_memberships
            WHERE coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- Assigned coaches can add players to their teams
CREATE POLICY "players_insert" ON players
    FOR INSERT WITH CHECK (
        -- Club ID must match team's club
        club_id = (SELECT club_id FROM teams WHERE id = players.team_id)
        AND (
            -- Admin
            EXISTS (
                SELECT 1 FROM club_memberships
                WHERE club_id = players.club_id
                AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                AND role = 'admin'
            )
            OR
            -- Assigned coach
            EXISTS (
                SELECT 1 FROM team_coaches
                WHERE team_id = players.team_id
                AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            )
        )
    );

-- Assigned coaches and admin can update players
CREATE POLICY "players_update" ON players
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = players.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        )
        OR
        EXISTS (
            SELECT 1 FROM team_coaches
            WHERE team_id = players.team_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- Only admin can delete players
CREATE POLICY "players_delete" ON players
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = players.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        )
    );

-- ========================================
-- RLS POLICIES - SESSIONS
-- ========================================

-- Assigned coaches and admin can view sessions
CREATE POLICY "sessions_select" ON sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = sessions.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        )
        OR
        EXISTS (
            SELECT 1 FROM team_coaches
            WHERE team_id = sessions.team_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- Assigned coaches can create sessions
CREATE POLICY "sessions_insert" ON sessions
    FOR INSERT WITH CHECK (
        club_id = (SELECT club_id FROM teams WHERE id = sessions.team_id)
        AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        AND (
            EXISTS (
                SELECT 1 FROM club_memberships
                WHERE club_id = sessions.club_id
                AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                AND role = 'admin'
            )
            OR
            EXISTS (
                SELECT 1 FROM team_coaches
                WHERE team_id = sessions.team_id
                AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            )
        )
    );

-- Session creator or admin can update
CREATE POLICY "sessions_update" ON sessions
    FOR UPDATE USING (
        coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        OR
        EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = sessions.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        )
    );

-- Only admin can delete sessions
CREATE POLICY "sessions_delete" ON sessions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = sessions.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        )
    );

-- ========================================
-- RLS POLICIES - SESSION BLOCKS
-- Blocks are reusable content objects with relaxed read access
-- ========================================

-- Anyone can read: public blocks, their own blocks, or blocks from their club
CREATE POLICY "session_blocks_select" ON session_blocks
    FOR SELECT USING (
        is_public = TRUE
        OR creator_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        OR club_id IN (
            SELECT club_id FROM club_memberships
            WHERE coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- Anyone can create blocks (they become the creator)
CREATE POLICY "session_blocks_insert" ON session_blocks
    FOR INSERT WITH CHECK (
        creator_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
    );

-- Only creator can update their own blocks
CREATE POLICY "session_blocks_update" ON session_blocks
    FOR UPDATE USING (
        creator_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
    );

-- Only creator can delete their own blocks
CREATE POLICY "session_blocks_delete" ON session_blocks
    FOR DELETE USING (
        creator_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
    );

-- ========================================
-- RLS POLICIES - SESSION BLOCK ASSIGNMENTS
-- Tied to session access via team_coaches
-- ========================================

-- Can view assignments if you're a coach for the session's team
CREATE POLICY "session_block_assignments_select" ON session_block_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN team_coaches tc ON s.team_id = tc.team_id
            WHERE s.id = session_block_assignments.session_id
            AND tc.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- Can insert assignments if you're a coach for the session's team
CREATE POLICY "session_block_assignments_insert" ON session_block_assignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN team_coaches tc ON s.team_id = tc.team_id
            WHERE s.id = session_block_assignments.session_id
            AND tc.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- Can update assignments if you're a coach for the session's team
CREATE POLICY "session_block_assignments_update" ON session_block_assignments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN team_coaches tc ON s.team_id = tc.team_id
            WHERE s.id = session_block_assignments.session_id
            AND tc.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- Can delete assignments if you're a coach for the session's team
CREATE POLICY "session_block_assignments_delete" ON session_block_assignments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN team_coaches tc ON s.team_id = tc.team_id
            WHERE s.id = session_block_assignments.session_id
            AND tc.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- ========================================
-- RLS POLICIES - SESSION ATTENDANCE
-- ========================================

-- Can view attendance for accessible sessions
CREATE POLICY "session_attendance_select" ON session_attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_attendance.session_id
            AND (
                EXISTS (
                    SELECT 1 FROM club_memberships
                    WHERE club_id = s.club_id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                    AND role = 'admin'
                )
                OR
                EXISTS (
                    SELECT 1 FROM team_coaches
                    WHERE team_id = s.team_id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                )
            )
        )
    );

-- Can insert attendance for accessible sessions
CREATE POLICY "session_attendance_insert" ON session_attendance
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_attendance.session_id
            AND (
                EXISTS (
                    SELECT 1 FROM club_memberships
                    WHERE club_id = s.club_id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                    AND role = 'admin'
                )
                OR
                EXISTS (
                    SELECT 1 FROM team_coaches
                    WHERE team_id = s.team_id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                )
            )
        )
    );

-- Can update attendance for accessible sessions
CREATE POLICY "session_attendance_update" ON session_attendance
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_attendance.session_id
            AND (
                EXISTS (
                    SELECT 1 FROM club_memberships
                    WHERE club_id = s.club_id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                    AND role = 'admin'
                )
                OR
                EXISTS (
                    SELECT 1 FROM team_coaches
                    WHERE team_id = s.team_id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                )
            )
        )
    );

-- Can delete attendance for accessible sessions
CREATE POLICY "session_attendance_delete" ON session_attendance
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_attendance.session_id
            AND (
                EXISTS (
                    SELECT 1 FROM club_memberships
                    WHERE club_id = s.club_id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                    AND role = 'admin'
                )
                OR
                EXISTS (
                    SELECT 1 FROM team_coaches
                    WHERE team_id = s.team_id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                )
            )
        )
    );

-- ========================================
-- RLS POLICIES - SYSTEM DEFAULTS
-- ========================================

-- Any authenticated user can read system defaults
CREATE POLICY "system_defaults_select" ON system_defaults
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- No insert/update/delete via RLS (managed by migrations/admin)

-- ========================================
-- RLS POLICIES - METHODOLOGY TEMPLATES
-- ========================================

-- Any authenticated user can browse templates
CREATE POLICY "methodology_templates_select" ON methodology_templates
    FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- No insert/update/delete via RLS (managed by admin)

-- ========================================
-- RLS POLICIES - PLAYING METHODOLOGY
-- ========================================

-- Club members can view their club's methodology
CREATE POLICY "playing_methodology_select" ON playing_methodology
    FOR SELECT USING (
        club_id IN (
            SELECT club_id FROM club_memberships
            WHERE coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- Club-level: admin only. Team-level: assigned coaches or admin
CREATE POLICY "playing_methodology_insert" ON playing_methodology
    FOR INSERT WITH CHECK (
        created_by_coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        AND (
            -- Club-level rule: must be admin
            (team_id IS NULL AND EXISTS (
                SELECT 1 FROM club_memberships
                WHERE club_id = playing_methodology.club_id
                AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                AND role = 'admin'
            ))
            OR
            -- Team-level rule: must be admin or assigned to team
            (team_id IS NOT NULL AND (
                EXISTS (
                    SELECT 1 FROM club_memberships
                    WHERE club_id = playing_methodology.club_id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                    AND role = 'admin'
                )
                OR
                EXISTS (
                    SELECT 1 FROM team_coaches
                    WHERE team_id = playing_methodology.team_id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                )
            ))
        )
    );

-- Club-level: admin. Team-level: creator, assigned coach, or admin
CREATE POLICY "playing_methodology_update" ON playing_methodology
    FOR UPDATE USING (
        -- Club-level: admin only
        (team_id IS NULL AND EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = playing_methodology.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        ))
        OR
        -- Team-level: creator, assigned coach, or admin
        (team_id IS NOT NULL AND (
            created_by_coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            OR
            EXISTS (
                SELECT 1 FROM club_memberships
                WHERE club_id = playing_methodology.club_id
                AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                AND role = 'admin'
            )
        ))
    );

-- Club-level: admin. Team-level: creator, assigned coach, or admin
CREATE POLICY "playing_methodology_delete" ON playing_methodology
    FOR DELETE USING (
        (team_id IS NULL AND EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = playing_methodology.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        ))
        OR
        (team_id IS NOT NULL AND (
            created_by_coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            OR
            EXISTS (
                SELECT 1 FROM club_memberships
                WHERE club_id = playing_methodology.club_id
                AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                AND role = 'admin'
            )
        ))
    );

-- ========================================
-- RLS POLICIES - TRAINING METHODOLOGY
-- ========================================

-- Club members can view their club's methodology
CREATE POLICY "training_methodology_select" ON training_methodology
    FOR SELECT USING (
        club_id IN (
            SELECT club_id FROM club_memberships
            WHERE coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- Club-level: admin only. Team-level: assigned coaches or admin
CREATE POLICY "training_methodology_insert" ON training_methodology
    FOR INSERT WITH CHECK (
        created_by_coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        AND (
            (team_id IS NULL AND EXISTS (
                SELECT 1 FROM club_memberships
                WHERE club_id = training_methodology.club_id
                AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                AND role = 'admin'
            ))
            OR
            (team_id IS NOT NULL AND (
                EXISTS (
                    SELECT 1 FROM club_memberships
                    WHERE club_id = training_methodology.club_id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                    AND role = 'admin'
                )
                OR
                EXISTS (
                    SELECT 1 FROM team_coaches
                    WHERE team_id = training_methodology.team_id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                )
            ))
        )
    );

-- Club-level: admin. Team-level: creator, assigned coach, or admin
CREATE POLICY "training_methodology_update" ON training_methodology
    FOR UPDATE USING (
        (team_id IS NULL AND EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = training_methodology.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        ))
        OR
        (team_id IS NOT NULL AND (
            created_by_coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            OR
            EXISTS (
                SELECT 1 FROM club_memberships
                WHERE club_id = training_methodology.club_id
                AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                AND role = 'admin'
            )
        ))
    );

-- Club-level: admin. Team-level: creator, assigned coach, or admin
CREATE POLICY "training_methodology_delete" ON training_methodology
    FOR DELETE USING (
        (team_id IS NULL AND EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = training_methodology.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        ))
        OR
        (team_id IS NOT NULL AND (
            created_by_coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            OR
            EXISTS (
                SELECT 1 FROM club_memberships
                WHERE club_id = training_methodology.club_id
                AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                AND role = 'admin'
            )
        ))
    );

-- ========================================
-- RLS POLICIES - POSITIONAL PROFILES
-- ========================================

-- Club members can view profiles
CREATE POLICY "positional_profiles_select" ON positional_profiles
    FOR SELECT USING (
        club_id IN (
            SELECT club_id FROM club_memberships
            WHERE coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- Club-level: admin. Team-level: admin or assigned coaches
CREATE POLICY "positional_profiles_insert" ON positional_profiles
    FOR INSERT WITH CHECK (
        (team_id IS NULL AND EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = positional_profiles.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        ))
        OR
        (team_id IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM club_memberships
                WHERE club_id = positional_profiles.club_id
                AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                AND role = 'admin'
            )
            OR
            EXISTS (
                SELECT 1 FROM team_coaches
                WHERE team_id = positional_profiles.team_id
                AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            )
        ))
    );

-- Club-level: admin. Team-level: admin or assigned coaches
CREATE POLICY "positional_profiles_update" ON positional_profiles
    FOR UPDATE USING (
        (team_id IS NULL AND EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = positional_profiles.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        ))
        OR
        (team_id IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM club_memberships
                WHERE club_id = positional_profiles.club_id
                AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                AND role = 'admin'
            )
            OR
            EXISTS (
                SELECT 1 FROM team_coaches
                WHERE team_id = positional_profiles.team_id
                AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            )
        ))
    );

-- Only admin can delete positional profiles
CREATE POLICY "positional_profiles_delete" ON positional_profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = positional_profiles.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        )
    );

-- ========================================
-- RLS POLICIES - TEAM FACILITIES
-- ========================================

-- Admin or assigned coaches can view
CREATE POLICY "team_facilities_select" ON team_facilities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teams t
            WHERE t.id = team_facilities.team_id
            AND (
                EXISTS (
                    SELECT 1 FROM club_memberships
                    WHERE club_id = t.club_id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                    AND role = 'admin'
                )
                OR
                EXISTS (
                    SELECT 1 FROM team_coaches
                    WHERE team_id = t.id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                )
            )
        )
    );

-- Admin or assigned coaches can insert
CREATE POLICY "team_facilities_insert" ON team_facilities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM teams t
            WHERE t.id = team_facilities.team_id
            AND (
                EXISTS (
                    SELECT 1 FROM club_memberships
                    WHERE club_id = t.club_id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                    AND role = 'admin'
                )
                OR
                EXISTS (
                    SELECT 1 FROM team_coaches
                    WHERE team_id = t.id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                )
            )
        )
    );

-- Admin or assigned coaches can update
CREATE POLICY "team_facilities_update" ON team_facilities
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM teams t
            WHERE t.id = team_facilities.team_id
            AND (
                EXISTS (
                    SELECT 1 FROM club_memberships
                    WHERE club_id = t.club_id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                    AND role = 'admin'
                )
                OR
                EXISTS (
                    SELECT 1 FROM team_coaches
                    WHERE team_id = t.id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                )
            )
        )
    );

-- Admin or assigned coaches can delete
CREATE POLICY "team_facilities_delete" ON team_facilities
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM teams t
            WHERE t.id = team_facilities.team_id
            AND (
                EXISTS (
                    SELECT 1 FROM club_memberships
                    WHERE club_id = t.club_id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                    AND role = 'admin'
                )
                OR
                EXISTS (
                    SELECT 1 FROM team_coaches
                    WHERE team_id = t.id
                    AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                )
            )
        )
    );

-- ========================================
-- RLS POLICIES - POSITION SUGGESTIONS
-- ========================================

-- Club members can view suggestions
CREATE POLICY "position_suggestions_select" ON position_suggestions
    FOR SELECT USING (
        club_id IN (
            SELECT club_id FROM club_memberships
            WHERE coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- Club members can create suggestions
CREATE POLICY "position_suggestions_insert" ON position_suggestions
    FOR INSERT WITH CHECK (
        coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        AND club_id IN (
            SELECT club_id FROM club_memberships
            WHERE coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- Admin can update (approve/reject)
CREATE POLICY "position_suggestions_update" ON position_suggestions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = position_suggestions.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        )
    );

-- Creator or admin can delete
CREATE POLICY "position_suggestions_delete" ON position_suggestions
    FOR DELETE USING (
        coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        OR
        EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = position_suggestions.club_id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        )
    );

-- ========================================
-- STORAGE BUCKETS
-- ========================================

-- Coach profile pictures bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'coach-profiles',
    'coach-profiles',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Club logos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'club-logos',
    'club-logos',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Session images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'session-images',
    'session-images',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- STORAGE POLICIES - COACH PROFILES
-- ========================================

-- Authenticated users can upload profile pictures
CREATE POLICY "coach_profiles_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'coach-profiles');

-- Public can view profile pictures
CREATE POLICY "coach_profiles_select" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'coach-profiles');

-- Authenticated users can update their profile pictures
CREATE POLICY "coach_profiles_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'coach-profiles');

-- Authenticated users can delete their profile pictures
CREATE POLICY "coach_profiles_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'coach-profiles');

-- ========================================
-- STORAGE POLICIES - CLUB LOGOS
-- ========================================

-- Authenticated users can upload club logos
CREATE POLICY "club_logos_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'club-logos');

-- Public can view club logos
CREATE POLICY "club_logos_select" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'club-logos');

-- Authenticated users can update club logos
CREATE POLICY "club_logos_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'club-logos');

-- Authenticated users can delete club logos
CREATE POLICY "club_logos_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'club-logos');

-- ========================================
-- STORAGE POLICIES - SESSION IMAGES
-- ========================================

-- Authenticated users can upload session images
CREATE POLICY "session_images_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'session-images');

-- Public can view session images
CREATE POLICY "session_images_select" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'session-images');

-- Authenticated users can update session images
CREATE POLICY "session_images_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'session-images');

-- Authenticated users can delete session images
CREATE POLICY "session_images_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'session-images');

-- ========================================
-- RPC FUNCTIONS
-- ========================================
-- Secure database functions for operations that need to bypass RLS

-- Create club with membership (SECURITY DEFINER)
-- This function handles the chicken-and-egg problem where you need to create
-- a club before you can be a member, but SELECT requires membership.
CREATE OR REPLACE FUNCTION create_club_with_membership(
    club_name TEXT,
    club_logo_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with function creator's privileges, bypassing RLS
SET search_path = public
AS $$
DECLARE
    new_club_id UUID;
    coach_id_var UUID;
    result JSON;
BEGIN
    -- Verify user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get the coach ID for the current user
    SELECT id INTO coach_id_var
    FROM coaches
    WHERE auth_user_id = auth.uid();

    IF coach_id_var IS NULL THEN
        RAISE EXCEPTION 'Coach profile not found';
    END IF;

    -- Validate input
    IF club_name IS NULL OR TRIM(club_name) = '' THEN
        RAISE EXCEPTION 'Club name is required';
    END IF;

    -- Create the club
    INSERT INTO clubs (name, logo_url)
    VALUES (TRIM(club_name), club_logo_url)
    RETURNING id INTO new_club_id;

    -- Create the membership with admin role
    INSERT INTO club_memberships (club_id, coach_id, role)
    VALUES (new_club_id, coach_id_var, 'admin');

    -- Return the club and membership data
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_club_with_membership TO authenticated;

-- ----------------------------------------
-- Get invite with club data (public access)
-- ----------------------------------------
-- Returns invite and club data for valid, unused invites
-- Used to show club info on the invite page before user signs in

CREATE OR REPLACE FUNCTION get_invite_with_club(invite_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
BEGIN
    IF invite_token IS NULL OR TRIM(invite_token) = '' THEN
        RETURN NULL;
    END IF;

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

GRANT EXECUTE ON FUNCTION get_invite_with_club TO anon;
GRANT EXECUTE ON FUNCTION get_invite_with_club TO authenticated;

-- ----------------------------------------
-- Check if email already has a club
-- ----------------------------------------
-- Used to show error if user already has an account with a club

CREATE OR REPLACE FUNCTION check_email_has_club(check_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'has_club', TRUE,
        'coach_id', co.id
    ) INTO result
    FROM coaches co
    JOIN club_memberships cm ON cm.coach_id = co.id
    WHERE LOWER(co.email) = LOWER(check_email)
    LIMIT 1;

    IF result IS NULL THEN
        RETURN json_build_object('has_club', FALSE);
    END IF;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION check_email_has_club TO anon;
GRANT EXECUTE ON FUNCTION check_email_has_club TO authenticated;

-- ----------------------------------------
-- Redeem invite (authenticated access)
-- ----------------------------------------
-- Validates invite, creates membership, marks invite as used

CREATE OR REPLACE FUNCTION redeem_invite(invite_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invite_record RECORD;
    coach_id_var UUID;
    coach_email_var TEXT;
    new_membership_id UUID;
    result JSON;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT id, email INTO coach_id_var, coach_email_var
    FROM coaches
    WHERE auth_user_id = auth.uid();

    IF coach_id_var IS NULL THEN
        RAISE EXCEPTION 'Coach profile not found';
    END IF;

    SELECT i.*, c.name as club_name
    INTO invite_record
    FROM club_invites i
    JOIN clubs c ON c.id = i.club_id
    WHERE i.token = invite_token
    FOR UPDATE;

    IF invite_record IS NULL THEN
        RAISE EXCEPTION 'Invalid invite token';
    END IF;

    IF invite_record.used_at IS NOT NULL THEN
        RAISE EXCEPTION 'Invite has already been used';
    END IF;

    IF LOWER(invite_record.email) != LOWER(coach_email_var) THEN
        RAISE EXCEPTION 'Email does not match invite';
    END IF;

    IF EXISTS (SELECT 1 FROM club_memberships WHERE coach_id = coach_id_var) THEN
        RAISE EXCEPTION 'You are already a member of a club';
    END IF;

    INSERT INTO club_memberships (club_id, coach_id, role)
    VALUES (invite_record.club_id, coach_id_var, 'coach')
    RETURNING id INTO new_membership_id;

    UPDATE club_invites
    SET used_at = NOW()
    WHERE id = invite_record.id;

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

GRANT EXECUTE ON FUNCTION redeem_invite TO authenticated;

-- ----------------------------------------
-- Get Club Coaches (authenticated access)
-- ----------------------------------------
-- Returns all coaches in a club with their details
-- Only accessible by club members

CREATE OR REPLACE FUNCTION get_club_coaches(target_club_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

GRANT EXECUTE ON FUNCTION get_club_coaches TO authenticated;

-- ----------------------------------------
-- Update Coach Role (authenticated access)
-- ----------------------------------------
-- Updates a coach's role in a club (admin only)
-- Bypasses RLS to avoid infinite recursion

CREATE OR REPLACE FUNCTION update_coach_role(target_membership_id UUID, new_role TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

GRANT EXECUTE ON FUNCTION update_coach_role TO authenticated;

-- ----------------------------------------
-- Remove Coach From Club (authenticated access)
-- ----------------------------------------
-- Removes a coach from a club (admin only, cannot remove admins)

CREATE OR REPLACE FUNCTION remove_coach_from_club(target_membership_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

GRANT EXECUTE ON FUNCTION remove_coach_from_club TO authenticated;

