-- ========================================
-- Get Club Coaches RPC Function
-- ========================================
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

-- ========================================
-- Update Coach Role RPC Function
-- ========================================
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

-- ========================================
-- Remove Coach From Club RPC Function
-- ========================================
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
