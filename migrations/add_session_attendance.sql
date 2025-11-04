-- Create session_attendance junction table for tracking player attendance at sessions
CREATE TABLE IF NOT EXISTS session_attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_session_player UNIQUE (session_id, player_id)
);

-- Create indexes for fast lookups
CREATE INDEX idx_session_attendance_session_id ON session_attendance(session_id);
CREATE INDEX idx_session_attendance_player_id ON session_attendance(player_id);

-- Add trigger to automatically update updated_at timestamp
CREATE TRIGGER update_session_attendance_updated_at
    BEFORE UPDATE ON session_attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Coaches can only access attendance for their own sessions/players
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
