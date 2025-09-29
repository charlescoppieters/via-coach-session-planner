import { supabase } from './supabase'
import type { CoachInsert } from '@/types/database'

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

async function ensureCoachProfile(userId: string, email: string) {
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

    // Create coach profile if it doesn't exist
    if (fetchError?.code === 'PGRST116') {
      const coachData: CoachInsert = {
        auth_user_id: userId,
        email,
        name: email.split('@')[0], // Default name from email
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