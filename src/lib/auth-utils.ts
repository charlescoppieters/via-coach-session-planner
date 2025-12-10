import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

/**
 * Validates an email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

// Force refresh the auth session in the client
export async function forceAuthRefresh() {
  try {
    // Get current session
    const { data: { session: currentSession } } = await supabase.auth.getSession()

    if (currentSession) {
      // Force refresh the session
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession(currentSession)

      if (error) {
        console.error('Failed to refresh session:', error)
        return false
      }

      if (refreshedSession) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Error during force auth refresh:', error)
    return false
  }
}

// Test if the Supabase client can make requests
export async function testSupabaseConnection() {
  try {
    // Add a timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Connection test timeout after 5 seconds')), 5000)
    })

    const testPromise = async () => {
      const { data } = await supabase.auth.getSession()

      if (data.session) {
        // Test a simple query with timeout
        const { error: queryError } = await supabase.from('coaches').select('id').limit(1)
        return !queryError
      }

      return true // No session is fine
    }

    return await Promise.race([testPromise(), timeoutPromise])
  } catch (error) {
    console.error('Supabase connection test failed:', error)
    return false
  }
}