import { createClient } from '@/lib/supabase/client'
import type { Club, ClubMembership } from '@/types/database'

const supabase = createClient()

interface InviteData {
  id: string
  email: string
  token: string
  used_at: string | null
  created_at: string
}

interface ValidateInviteResult {
  invite: InviteData | null
  club: Pick<Club, 'id' | 'name' | 'logo_url'> | null
  error: string | null
}

interface RedeemInviteResult {
  membership: ClubMembership | null
  club: Pick<Club, 'id' | 'name' | 'logo_url'> | null
  error: string | null
}

/**
 * Validates an invite token and returns the invite + club data
 * This can be called without authentication (for showing club info on invite page)
 */
export async function validateInviteToken(token: string): Promise<ValidateInviteResult> {
  try {
    if (!token || !token.trim()) {
      return { invite: null, club: null, error: 'Invalid invite token' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_invite_with_club', {
      invite_token: token.trim(),
    })

    if (error) {
      console.error('Error validating invite:', error)
      return { invite: null, club: null, error: 'Failed to validate invite' }
    }

    if (!data) {
      return { invite: null, club: null, error: 'Invalid or expired invite' }
    }

    const result = data as { invite: InviteData; club: Pick<Club, 'id' | 'name' | 'logo_url'> }
    return { invite: result.invite, club: result.club, error: null }
  } catch (error) {
    console.error('Error validating invite:', error)
    return { invite: null, club: null, error: 'Failed to validate invite' }
  }
}

/**
 * Checks if the provided email matches the invite email
 */
export function checkInviteEmail(inviteEmail: string, enteredEmail: string): boolean {
  return inviteEmail.toLowerCase() === enteredEmail.toLowerCase()
}

/**
 * Checks if an email is already associated with a club
 */
export async function checkEmailHasClub(email: string): Promise<{ hasClub: boolean; error: string | null }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('check_email_has_club', {
      check_email: email.trim(),
    })

    if (error) {
      console.error('Error checking email:', error)
      return { hasClub: false, error: 'Failed to check email' }
    }

    const result = data as { has_club: boolean }
    return { hasClub: result.has_club, error: null }
  } catch (error) {
    console.error('Error checking email:', error)
    return { hasClub: false, error: 'Failed to check email' }
  }
}

/**
 * Redeems an invite after OTP verification
 * Creates the club membership and marks the invite as used
 * Must be called by an authenticated user
 */
export async function redeemInvite(token: string): Promise<RedeemInviteResult> {
  try {
    if (!token || !token.trim()) {
      return { membership: null, club: null, error: 'Invalid invite token' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('redeem_invite', {
      invite_token: token.trim(),
    })

    if (error) {
      console.error('Error redeeming invite:', error)
      // Return user-friendly error messages
      if (error.message.includes('Invalid invite token')) {
        return { membership: null, club: null, error: 'This invite is no longer valid' }
      }
      if (error.message.includes('already been used')) {
        return { membership: null, club: null, error: 'This invite has already been used' }
      }
      if (error.message.includes('does not match')) {
        return { membership: null, club: null, error: 'Your email does not match the invite' }
      }
      if (error.message.includes('already a member')) {
        return { membership: null, club: null, error: 'You are already a member of a club' }
      }
      return { membership: null, club: null, error: 'Failed to join club' }
    }

    if (!data) {
      return { membership: null, club: null, error: 'Failed to join club' }
    }

    const result = data as {
      membership: ClubMembership;
      club: Pick<Club, 'id' | 'name' | 'logo_url'>
    }
    return { membership: result.membership, club: result.club, error: null }
  } catch (error) {
    console.error('Error redeeming invite:', error)
    return { membership: null, club: null, error: 'Failed to join club' }
  }
}
