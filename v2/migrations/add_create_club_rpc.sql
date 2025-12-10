-- ========================================
-- Migration: Add create_club_with_membership RPC
-- ========================================
-- This migration:
-- 1. Reverts the permissive "clubs_select" policy (if it exists)
-- 2. Restores the proper "clubs_select_member" policy
-- 3. Creates a secure RPC function for club creation
-- ========================================

-- Step 1: Revert the permissive SELECT policy
DROP POLICY IF EXISTS "clubs_select" ON clubs;

-- Step 2: Restore the proper member-only SELECT policy
DROP POLICY IF EXISTS "clubs_select_member" ON clubs;
CREATE POLICY "clubs_select_member" ON clubs
    FOR SELECT USING (
        id IN (
            SELECT club_id FROM club_memberships
            WHERE coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- Step 3: Create secure RPC function for club creation
-- This function bypasses RLS using SECURITY DEFINER to handle the
-- chicken-and-egg problem: you need to create a club before you can be a member,
-- but you need to be a member to read the club you just created.

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

-- Step 4: Drop the test function if it exists (cleanup from debugging)
DROP FUNCTION IF EXISTS test_auth_uid();
