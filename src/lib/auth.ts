import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
import type { CoachInsert, Club, ClubMembership } from '@/types/database'

export async function signInWithOTP(email: string) {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // No emailRedirectTo for OTP - user enters code directly
      },
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error sending OTP:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function verifyOTP(email: string, token: string) {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    if (error) throw error

    // After successful verification, ensure coach profile exists
    if (data.user) {
      const coach = await ensureCoachProfile(data.user.id, email)
      if (!coach) {
        return {
          data: null,
          error: 'Failed to create coach profile. Please try signing in again.'
        }
      }
      return { data: { ...data, coach }, error: null }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function ensureCoachProfile(userId: string, email: string) {
  try {
    // Check if coach profile exists
    const { data: existingCoach, error: fetchError } = await supabase
      .from('coaches')
      .select('*')
      .eq('auth_user_id', userId)
      .single()

    if (existingCoach) {
      return existingCoach
    }

    // Create coach profile if it doesn't exist (PGRST116 = row not found)
    if (fetchError?.code === 'PGRST116') {
      const coachData: CoachInsert = {
        auth_user_id: userId,
        email,
        name: email.split('@')[0],
        onboarding_completed: false,
      }

      const { data: newCoach, error: createError } = await supabase
        .from('coaches')
        .insert(coachData)
        .select()
        .single()

      if (createError) {
        console.error('Error creating coach profile:', createError)
        throw createError
      }

      return newCoach
    }

    console.error('Unexpected error fetching coach:', fetchError)
    throw fetchError
  } catch (error) {
    console.error('Error ensuring coach profile:', error)
    return null
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error signing out:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error getting session:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function getUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error

    if (user) {
      // Fetch associated coach profile
      const { data: coach } = await supabase
        .from('coaches')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      return { user, coach, error: null }
    }

    return { user: null, coach: null, error: null }
  } catch (error) {
    console.error('Error getting user:', error)
    return { user: null, coach: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function resendOTP(email: string) {
  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error resending OTP:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ========================================
// Club Functions
// ========================================

/**
 * Creates a new club and makes the current coach an admin
 * Uses a secure RPC function to handle the atomic creation of both club and membership
 */
export async function createClub(
  name: string,
  coachId: string,
  logoUrl?: string
): Promise<{ club: Club | null; membership: ClubMembership | null; error: string | null }> {
  try {
    if (!name.trim()) {
      return { club: null, membership: null, error: 'Club name is required' }
    }

    // Use the secure RPC function that handles club + membership creation atomically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('create_club_with_membership', {
      club_name: name.trim(),
      club_logo_url: logoUrl || null,
    })

    if (error) {
      console.error('Error in create_club_with_membership RPC:', error)
      return { club: null, membership: null, error: error.message }
    }

    if (!data) {
      return { club: null, membership: null, error: 'No data returned from club creation' }
    }

    // The RPC returns { club: {...}, membership: {...} }
    const result = data as { club: Club; membership: ClubMembership }

    return { club: result.club, membership: result.membership, error: null }
  } catch (error) {
    console.error('Error creating club:', error)
    return { club: null, membership: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Gets the club membership for a coach (including club data)
 */
export async function getCoachClubMembership(
  coachId: string
): Promise<{ club: Club | null; membership: ClubMembership | null; error: string | null }> {
  try {
    // Get the membership with club data
    const { data: membership, error: membershipError } = await supabase
      .from('club_memberships')
      .select('*')
      .eq('coach_id', coachId)
      .single()

    if (membershipError?.code === 'PGRST116') {
      // No membership found - coach hasn't joined a club yet
      return { club: null, membership: null, error: null }
    }

    if (membershipError) throw membershipError

    // Get the club data
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', membership.club_id)
      .single()

    if (clubError) throw clubError

    return { club, membership, error: null }
  } catch (error) {
    console.error('Error getting coach club membership:', error)
    return { club: null, membership: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}