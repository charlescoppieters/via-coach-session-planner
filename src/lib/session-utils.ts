import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export async function validateAndRefreshSession() {
  try {
    // First try to get the current session
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Error getting session:', error)
      return { valid: false, session: null }
    }

    if (!session) {
      return { valid: false, session: null }
    }

    // Check if token is expired or about to expire (within 60 seconds)
    const expiresAt = session.expires_at
    const now = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = expiresAt ? expiresAt - now : 0

    if (timeUntilExpiry <= 60) {
      // Try to refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError) {
        console.error('Failed to refresh session:', refreshError)
        return { valid: false, session: null }
      }

      if (refreshData.session) {
        return { valid: true, session: refreshData.session }
      }
    }

    return { valid: true, session }
  } catch (error) {
    console.error('Unexpected error validating session:', error)
    return { valid: false, session: null }
  }
}

export async function withSessionRetry<T>(
  operation: () => Promise<{ data: T | null; error: string | null }>
): Promise<{ data: T | null; error: string | null }> {
  try {
    // Add timeout to prevent hanging operations
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout after 10 seconds')), 10000);
    });

    const result = await Promise.race([operation(), timeoutPromise]);
    return result;
  } catch (error) {
    console.error('Operation failed with timeout or error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Operation failed'
    };
  }
}