-- ========================================
-- V3 Migration: Role System & Invite Links
-- ========================================
-- This migration updates the v2 schema for v3:
-- - Replaces is_head_coach boolean with role ('admin'/'coach')
-- - Removes club codes, adds invite link system
-- - All coaches can see all club players
-- - Multiple admins allowed per club
-- ========================================

-- ========================================
-- 1. DROP ALL OLD RLS POLICIES THAT DEPEND ON is_head_coach
-- Must be done BEFORE modifying the column
-- ========================================

-- Clubs policies
DROP POLICY IF EXISTS "clubs_update_head_coach" ON clubs;
DROP POLICY IF EXISTS "clubs_delete_head_coach" ON clubs;
DROP POLICY IF EXISTS "clubs_select_by_code" ON clubs;

-- Club memberships policies
DROP POLICY IF EXISTS "club_memberships_update" ON club_memberships;
DROP POLICY IF EXISTS "club_memberships_delete" ON club_memberships;

-- Teams policies
DROP POLICY IF EXISTS "teams_update" ON teams;
DROP POLICY IF EXISTS "teams_delete" ON teams;

-- Team coaches policies
DROP POLICY IF EXISTS "team_coaches_insert" ON team_coaches;
DROP POLICY IF EXISTS "team_coaches_delete" ON team_coaches;

-- Players policies
DROP POLICY IF EXISTS "players_select" ON players;
DROP POLICY IF EXISTS "players_insert" ON players;
DROP POLICY IF EXISTS "players_update" ON players;
DROP POLICY IF EXISTS "players_delete" ON players;

-- Sessions policies
DROP POLICY IF EXISTS "sessions_select" ON sessions;
DROP POLICY IF EXISTS "sessions_insert" ON sessions;
DROP POLICY IF EXISTS "sessions_update" ON sessions;
DROP POLICY IF EXISTS "sessions_delete" ON sessions;

-- Session attendance policies
DROP POLICY IF EXISTS "session_attendance_select" ON session_attendance;
DROP POLICY IF EXISTS "session_attendance_insert" ON session_attendance;
DROP POLICY IF EXISTS "session_attendance_update" ON session_attendance;
DROP POLICY IF EXISTS "session_attendance_delete" ON session_attendance;

-- Playing methodology policies
DROP POLICY IF EXISTS "playing_methodology_insert" ON playing_methodology;
DROP POLICY IF EXISTS "playing_methodology_update" ON playing_methodology;
DROP POLICY IF EXISTS "playing_methodology_delete" ON playing_methodology;

-- Training methodology policies
DROP POLICY IF EXISTS "training_methodology_insert" ON training_methodology;
DROP POLICY IF EXISTS "training_methodology_update" ON training_methodology;
DROP POLICY IF EXISTS "training_methodology_delete" ON training_methodology;

-- Positional profiles policies
DROP POLICY IF EXISTS "positional_profiles_insert" ON positional_profiles;
DROP POLICY IF EXISTS "positional_profiles_update" ON positional_profiles;
DROP POLICY IF EXISTS "positional_profiles_delete" ON positional_profiles;

-- Team facilities policies
DROP POLICY IF EXISTS "team_facilities_select" ON team_facilities;
DROP POLICY IF EXISTS "team_facilities_insert" ON team_facilities;
DROP POLICY IF EXISTS "team_facilities_update" ON team_facilities;
DROP POLICY IF EXISTS "team_facilities_delete" ON team_facilities;

-- Position suggestions policies
DROP POLICY IF EXISTS "position_suggestions_update" ON position_suggestions;
DROP POLICY IF EXISTS "position_suggestions_delete" ON position_suggestions;

-- ========================================
-- 2. MODIFY CLUBS TABLE - Remove code column
-- ========================================

ALTER TABLE clubs DROP CONSTRAINT IF EXISTS club_code_format;
ALTER TABLE clubs DROP COLUMN IF EXISTS code;

COMMENT ON TABLE clubs IS 'Organizations that own all data. Coaches belong to clubs via invite links.';

-- ========================================
-- 3. MODIFY CLUB_MEMBERSHIPS TABLE - Change to role system
-- ========================================

-- Add new role column
ALTER TABLE club_memberships ADD COLUMN IF NOT EXISTS role TEXT;

-- Migrate existing data (if any)
UPDATE club_memberships SET role = 'admin' WHERE is_head_coach = true;
UPDATE club_memberships SET role = 'coach' WHERE is_head_coach = false OR is_head_coach IS NULL;

-- Make role NOT NULL with default and add constraint
ALTER TABLE club_memberships ALTER COLUMN role SET NOT NULL;
ALTER TABLE club_memberships ALTER COLUMN role SET DEFAULT 'coach';
ALTER TABLE club_memberships ADD CONSTRAINT club_memberships_role_check CHECK (role IN ('admin', 'coach'));

-- Drop old column (now safe since policies are dropped)
ALTER TABLE club_memberships DROP COLUMN IF EXISTS is_head_coach;

COMMENT ON TABLE club_memberships IS 'Links coaches to clubs. Role can be admin or coach.';
COMMENT ON COLUMN club_memberships.role IS 'Role: admin (full permissions) or coach (limited permissions).';

-- ========================================
-- 4. CREATE CLUB_INVITES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS club_invites (
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

-- ========================================
-- 5. UPDATE INDEXES
-- ========================================

-- Remove old indexes
DROP INDEX IF EXISTS idx_clubs_code;
DROP INDEX IF EXISTS idx_one_head_coach_per_club;
DROP INDEX IF EXISTS idx_club_memberships_is_head_coach;

-- Add new indexes
CREATE INDEX IF NOT EXISTS idx_club_memberships_role ON club_memberships(club_id, role);
CREATE INDEX IF NOT EXISTS idx_club_memberships_admin ON club_memberships(club_id) WHERE role = 'admin';

-- Club invites indexes
CREATE INDEX IF NOT EXISTS idx_club_invites_club_id ON club_invites(club_id);
CREATE INDEX IF NOT EXISTS idx_club_invites_token ON club_invites(token);
CREATE INDEX IF NOT EXISTS idx_club_invites_email ON club_invites(email);
CREATE INDEX IF NOT EXISTS idx_club_invites_unused ON club_invites(club_id) WHERE used_at IS NULL;

-- ========================================
-- 6. REMOVE OLD HELPER FUNCTIONS
-- ========================================

DROP FUNCTION IF EXISTS generate_club_code();
DROP FUNCTION IF EXISTS get_unique_club_code();

-- ========================================
-- 7. CREATE NEW RLS POLICIES - CLUBS
-- ========================================
CREATE POLICY "clubs_update_admin" ON clubs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_id = clubs.id
            AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND role = 'admin'
        )
    );

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
-- 8. CREATE NEW RLS POLICIES - CLUB_MEMBERSHIPS
-- ========================================

-- Admin can update memberships (change roles)
CREATE POLICY "club_memberships_update" ON club_memberships
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM club_memberships cm
            WHERE cm.club_id = club_memberships.club_id
            AND cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND cm.role = 'admin'
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
            SELECT 1 FROM club_memberships cm
            WHERE cm.club_id = club_memberships.club_id
            AND cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            AND cm.role = 'admin'
        )
    );

-- ========================================
-- 9. CREATE NEW RLS POLICIES - TEAMS
-- ========================================

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
-- 10. CREATE NEW RLS POLICIES - TEAM_COACHES
-- ========================================

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
-- 11. CREATE NEW RLS POLICIES - PLAYERS
-- V3: All club members can see all club players
-- ========================================

-- All club members can view all players in their club
CREATE POLICY "players_select" ON players
    FOR SELECT USING (
        club_id IN (
            SELECT club_id FROM club_memberships
            WHERE coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- Coaches assigned to team can add players, or admin can add to any team
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

-- Coaches assigned to team or admin can update players
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
-- 12. CREATE NEW RLS POLICIES - SESSIONS
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
-- 13. CREATE NEW RLS POLICIES - SESSION ATTENDANCE
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
-- 14. CREATE NEW RLS POLICIES - PLAYING METHODOLOGY
-- ========================================

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
                SELECT 1 FROM team_coaches
                WHERE team_id = playing_methodology.team_id
                AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            )
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
                SELECT 1 FROM team_coaches
                WHERE team_id = playing_methodology.team_id
                AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            )
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
-- 15. CREATE NEW RLS POLICIES - TRAINING METHODOLOGY
-- ========================================

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
                SELECT 1 FROM team_coaches
                WHERE team_id = training_methodology.team_id
                AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            )
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
                SELECT 1 FROM team_coaches
                WHERE team_id = training_methodology.team_id
                AND coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            )
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
-- 16. CREATE NEW RLS POLICIES - POSITIONAL PROFILES
-- ========================================

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
-- 17. CREATE NEW RLS POLICIES - TEAM FACILITIES
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
-- 18. CREATE NEW RLS POLICIES - POSITION SUGGESTIONS
-- ========================================

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
-- 19. CREATE NEW RLS POLICIES - CLUB_INVITES
-- ========================================

ALTER TABLE club_invites ENABLE ROW LEVEL SECURITY;

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
-- MIGRATION COMPLETE
-- ========================================
-- V3 changes applied:
-- - Removed club codes, added invite system
-- - Changed is_head_coach to role ('admin'/'coach')
-- - All club members can now see all club players
-- - Multiple admins allowed per club
-- ========================================
