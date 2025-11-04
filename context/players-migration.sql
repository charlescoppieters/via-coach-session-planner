-- Players Table Migration
-- This adds support for managing players with Individual Development Plans (IDPs)

-- Create players table
CREATE TABLE players (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER,  -- Player age (defaults from team age_group, editable)
    position TEXT,
    gender TEXT,
    target_1 TEXT,  -- IDP target 1: what player is working to improve
    target_2 TEXT,  -- IDP target 2: what player is working to improve
    target_3 TEXT,  -- IDP target 3: what player is working to improve
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_players_coach_id ON players(coach_id);
CREATE INDEX idx_players_name ON players(name);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for players table
-- Coaches can only see/modify players on their own teams

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
