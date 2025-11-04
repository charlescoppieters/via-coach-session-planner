-- ========================================
-- VIA SESSION PLANNER - Complete Database Schema
-- ========================================
-- This file contains the complete database schema including all migrations
-- Run this in your Supabase SQL Editor to set up the entire database

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- COACHES TABLE
-- ========================================
CREATE TABLE coaches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    profile_picture TEXT,
    position TEXT,
    onboarding_completed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON COLUMN coaches.profile_picture IS 'URL to profile picture stored in Supabase Storage';
COMMENT ON COLUMN coaches.position IS 'Coach role: Head Coach, Assistant Coach, Director of Coaching, Technical Director, etc.';
COMMENT ON COLUMN coaches.onboarding_completed IS 'Tracks whether coach has completed the onboarding wizard';

-- ========================================
-- TEAMS TABLE
-- ========================================
CREATE TABLE teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age_group TEXT NOT NULL,
    skill_level TEXT NOT NULL,
    gender TEXT,
    player_count INTEGER NOT NULL CHECK (player_count >= 0),
    sessions_per_week INTEGER NOT NULL CHECK (sessions_per_week >= 0),
    session_duration INTEGER NOT NULL CHECK (session_duration >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ========================================
-- PLAYERS TABLE
-- ========================================
CREATE TABLE players (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER,
    position TEXT,
    gender TEXT,
    target_1 TEXT,
    target_2 TEXT,
    target_3 TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON COLUMN players.age IS 'Player age (defaults from team age_group, editable)';
COMMENT ON COLUMN players.target_1 IS 'IDP target 1: what player is working to improve';
COMMENT ON COLUMN players.target_2 IS 'IDP target 2: what player is working to improve';
COMMENT ON COLUMN players.target_3 IS 'IDP target 3: what player is working to improve';

-- ========================================
-- COACHING RULES TABLE
-- ========================================
CREATE TABLE coaching_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    category TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ========================================
-- SESSIONS TABLE
-- ========================================
CREATE TABLE sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    content TEXT NOT NULL,
    title TEXT NOT NULL,
    notes TEXT,
    player_count INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    age_group TEXT NOT NULL,
    skill_level TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON COLUMN sessions.player_count IS 'Number of players in this session (defaults from team but can be customized)';
COMMENT ON COLUMN sessions.duration IS 'Session duration in minutes (defaults from team but can be customized)';
COMMENT ON COLUMN sessions.age_group IS 'Age group from team (e.g., U13, U15)';
COMMENT ON COLUMN sessions.skill_level IS 'Skill level from team (e.g., Beginner, Intermediate)';

-- ========================================
-- SESSION ATTENDANCE TABLE
-- ========================================
CREATE TABLE session_attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_session_player UNIQUE (session_id, player_id)
);

-- ========================================
-- INDEXES
-- ========================================
CREATE INDEX idx_coaches_email ON coaches(email);
CREATE INDEX idx_coaches_auth_user_id ON coaches(auth_user_id);

CREATE INDEX idx_teams_coach_id ON teams(coach_id);

CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_players_coach_id ON players(coach_id);
CREATE INDEX idx_players_name ON players(name);

CREATE INDEX idx_coaching_rules_coach_id ON coaching_rules(coach_id);
CREATE INDEX idx_coaching_rules_team_id ON coaching_rules(team_id);
CREATE INDEX idx_coaching_rules_is_active ON coaching_rules(is_active);

CREATE INDEX idx_sessions_coach_id ON sessions(coach_id);
CREATE INDEX idx_sessions_team_id ON sessions(team_id);
CREATE INDEX idx_sessions_session_date ON sessions(session_date);

CREATE INDEX idx_session_attendance_session_id ON session_attendance(session_id);
CREATE INDEX idx_session_attendance_player_id ON session_attendance(player_id);

-- ========================================
-- TRIGGERS
-- ========================================
-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON coaches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coaching_rules_updated_at BEFORE UPDATE ON coaching_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_attendance_updated_at BEFORE UPDATE ON session_attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================
-- Enable Row Level Security for all tables
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS POLICIES - COACHES
-- ========================================
CREATE POLICY "Coaches can view their own record" ON coaches
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Coaches can update their own record" ON coaches
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Coaches can insert their own record" ON coaches
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Coaches can delete their own record" ON coaches
    FOR DELETE USING (auth.uid() = auth_user_id);

-- ========================================
-- RLS POLICIES - TEAMS
-- ========================================
CREATE POLICY "Coaches can view their own teams" ON teams
    FOR SELECT USING (
        coach_id IN (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Coaches can insert their own teams" ON teams
    FOR INSERT WITH CHECK (
        coach_id IN (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Coaches can update their own teams" ON teams
    FOR UPDATE USING (
        coach_id IN (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Coaches can delete their own teams" ON teams
    FOR DELETE USING (
        coach_id IN (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
    );

-- ========================================
-- RLS POLICIES - PLAYERS
-- ========================================
CREATE POLICY "Coaches can view their own players" ON players
    FOR SELECT USING (
        coach_id IN (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Coaches can insert their own players" ON players
    FOR INSERT WITH CHECK (
        coach_id IN (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        AND team_id IN (
            SELECT id FROM teams WHERE coach_id IN (
                SELECT id FROM coaches WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Coaches can update their own players" ON players
    FOR UPDATE USING (
        coach_id IN (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Coaches can delete their own players" ON players
    FOR DELETE USING (
        coach_id IN (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
    );

-- ========================================
-- RLS POLICIES - COACHING RULES
-- ========================================
CREATE POLICY "Coaches can view their own rules" ON coaching_rules
    FOR SELECT USING (
        coach_id IN (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Coaches can insert their own rules" ON coaching_rules
    FOR INSERT WITH CHECK (
        coach_id IN (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        AND (team_id IS NULL OR team_id IN (
            SELECT id FROM teams WHERE coach_id IN (
                SELECT id FROM coaches WHERE auth_user_id = auth.uid()
            )
        ))
    );

CREATE POLICY "Coaches can update their own rules" ON coaching_rules
    FOR UPDATE USING (
        coach_id IN (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Coaches can delete their own rules" ON coaching_rules
    FOR DELETE USING (
        coach_id IN (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
    );

-- ========================================
-- RLS POLICIES - SESSIONS
-- ========================================
CREATE POLICY "Coaches can view their own sessions" ON sessions
    FOR SELECT USING (
        coach_id IN (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Coaches can insert their own sessions" ON sessions
    FOR INSERT WITH CHECK (
        coach_id IN (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        AND team_id IN (
            SELECT id FROM teams WHERE coach_id IN (
                SELECT id FROM coaches WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Coaches can update their own sessions" ON sessions
    FOR UPDATE USING (
        coach_id IN (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Coaches can delete their own sessions" ON sessions
    FOR DELETE USING (
        coach_id IN (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
    );

-- ========================================
-- RLS POLICIES - SESSION ATTENDANCE
-- ========================================
CREATE POLICY "Coaches can view their own session attendance"
    ON session_attendance FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN coaches c ON s.coach_id = c.id
            WHERE s.id = session_attendance.session_id
            AND c.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can insert attendance for their own sessions"
    ON session_attendance FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN coaches c ON s.coach_id = c.id
            WHERE s.id = session_attendance.session_id
            AND c.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can update their own session attendance"
    ON session_attendance FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN coaches c ON s.coach_id = c.id
            WHERE s.id = session_attendance.session_id
            AND c.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can delete their own session attendance"
    ON session_attendance FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN coaches c ON s.coach_id = c.id
            WHERE s.id = session_attendance.session_id
            AND c.auth_user_id = auth.uid()
        )
    );

-- ========================================
-- STORAGE SETUP
-- ========================================
-- Create the coach-profiles bucket for profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'coach-profiles',
  'coach-profiles',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- STORAGE POLICIES
-- ========================================
-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Coaches can upload their own profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'coach-profiles' AND
  (storage.foldername(name))[1] = 'profiles'
);

-- Allow public read access to profile pictures
CREATE POLICY "Public can view profile pictures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'coach-profiles');

-- Allow coaches to update their own profile pictures
CREATE POLICY "Coaches can update their own profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'coach-profiles');

-- Allow coaches to delete their own profile pictures
CREATE POLICY "Coaches can delete their own profile pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'coach-profiles');
