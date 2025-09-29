-- Enable UUID extension (if not already enabled)
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- Create coaches table
  CREATE TABLE coaches (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
  );

  -- Create teams table
  CREATE TABLE teams (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      age_group TEXT NOT NULL,
      skill_level TEXT NOT NULL,
      player_count INTEGER NOT NULL CHECK (player_count >= 0),
      sessions_per_week INTEGER NOT NULL CHECK (sessions_per_week >= 0),
      session_duration INTEGER NOT NULL CHECK (session_duration >= 0),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
  );

  -- Create coaching_rules table
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

  -- Create sessions table
  CREATE TABLE sessions (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
      team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      session_date DATE NOT NULL,
      content TEXT NOT NULL,
      title TEXT NOT NULL,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
  );

  -- Create indexes for better performance
  CREATE INDEX idx_coaches_email ON coaches(email);
  CREATE INDEX idx_coaches_auth_user_id ON coaches(auth_user_id);
  CREATE INDEX idx_teams_coach_id ON teams(coach_id);
  CREATE INDEX idx_coaching_rules_coach_id ON coaching_rules(coach_id);
  CREATE INDEX idx_coaching_rules_team_id ON coaching_rules(team_id);
  CREATE INDEX idx_coaching_rules_is_active ON coaching_rules(is_active);
  CREATE INDEX idx_sessions_coach_id ON sessions(coach_id);
  CREATE INDEX idx_sessions_team_id ON sessions(team_id);
  CREATE INDEX idx_sessions_session_date ON sessions(session_date);

  -- Create function to automatically update updated_at column
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

  CREATE TRIGGER update_coaching_rules_updated_at BEFORE UPDATE ON coaching_rules
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  -- Enable Row Level Security (RLS) for security
  ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
  ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
  ALTER TABLE coaching_rules ENABLE ROW LEVEL SECURITY;
  ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

  -- Create RLS policies for coaches table
  -- Coaches can only see/modify their own record
  CREATE POLICY "Coaches can view their own record" ON coaches
      FOR SELECT USING (auth.uid() = auth_user_id);

  CREATE POLICY "Coaches can update their own record" ON coaches
      FOR UPDATE USING (auth.uid() = auth_user_id);

  CREATE POLICY "Coaches can insert their own record" ON coaches
      FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

  CREATE POLICY "Coaches can delete their own record" ON coaches
      FOR DELETE USING (auth.uid() = auth_user_id);

  -- Create RLS policies for teams table
  -- Coaches can only see/modify their own teams
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

  -- Create RLS policies for coaching_rules table
  -- Coaches can only see/modify their own rules
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

  -- Create RLS policies for sessions table
  -- Coaches can only see/modify their own sessions
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