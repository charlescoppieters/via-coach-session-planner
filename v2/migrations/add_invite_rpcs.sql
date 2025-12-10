-- ========================================
-- Migration: Add Invite RPC Functions
-- ========================================
-- These functions handle invite validation and redemption
-- with proper RLS bypass using SECURITY DEFINER

-- ========================================
-- 1. get_invite_with_club - Public access (no auth required)
-- ========================================
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
    -- Validate input
    IF invite_token IS NULL OR TRIM(invite_token) = '' THEN
        RETURN NULL;
    END IF;

    -- Look up invite with club data
    -- Only return if invite exists and hasn't been used
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

-- Grant execute to anonymous users (for pre-auth invite page)
GRANT EXECUTE ON FUNCTION get_invite_with_club TO anon;
GRANT EXECUTE ON FUNCTION get_invite_with_club TO authenticated;

-- ========================================
-- 2. check_email_has_club - Check if email already has a club
-- ========================================
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
    -- Check if a coach with this email exists and has a club membership
    SELECT json_build_object(
        'has_club', TRUE,
        'coach_id', co.id
    ) INTO result
    FROM coaches co
    JOIN club_memberships cm ON cm.coach_id = co.id
    WHERE LOWER(co.email) = LOWER(check_email)
    LIMIT 1;

    -- If no result, return has_club = false
    IF result IS NULL THEN
        RETURN json_build_object('has_club', FALSE);
    END IF;

    RETURN result;
END;
$$;

-- Grant execute to anonymous users (for pre-auth check)
GRANT EXECUTE ON FUNCTION check_email_has_club TO anon;
GRANT EXECUTE ON FUNCTION check_email_has_club TO authenticated;

-- ========================================
-- 3. redeem_invite - Authenticated access
-- ========================================
-- Validates invite, creates membership, marks invite as used
-- Must be called by authenticated user after OTP verification

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
    -- Verify user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get the coach ID and email for the current user
    SELECT id, email INTO coach_id_var, coach_email_var
    FROM coaches
    WHERE auth_user_id = auth.uid();

    IF coach_id_var IS NULL THEN
        RAISE EXCEPTION 'Coach profile not found';
    END IF;

    -- Get and validate the invite
    SELECT i.*, c.name as club_name
    INTO invite_record
    FROM club_invites i
    JOIN clubs c ON c.id = i.club_id
    WHERE i.token = invite_token
    FOR UPDATE; -- Lock the row to prevent race conditions

    IF invite_record IS NULL THEN
        RAISE EXCEPTION 'Invalid invite token';
    END IF;

    IF invite_record.used_at IS NOT NULL THEN
        RAISE EXCEPTION 'Invite has already been used';
    END IF;

    -- Verify email matches (case insensitive)
    IF LOWER(invite_record.email) != LOWER(coach_email_var) THEN
        RAISE EXCEPTION 'Email does not match invite';
    END IF;

    -- Check if coach already has a club membership
    IF EXISTS (SELECT 1 FROM club_memberships WHERE coach_id = coach_id_var) THEN
        RAISE EXCEPTION 'You are already a member of a club';
    END IF;

    -- Create the membership with 'coach' role
    INSERT INTO club_memberships (club_id, coach_id, role)
    VALUES (invite_record.club_id, coach_id_var, 'coach')
    RETURNING id INTO new_membership_id;

    -- Mark invite as used
    UPDATE club_invites
    SET used_at = NOW()
    WHERE id = invite_record.id;

    -- Return the membership data
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

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION redeem_invite TO authenticated;
