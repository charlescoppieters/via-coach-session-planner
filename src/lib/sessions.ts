import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
import { withSessionRetry } from './session-utils'
import type { SessionInsert, SessionUpdate, SessionWithSyllabus, SessionThemeSnapshot } from '@/types/database'

export async function getSessions(coachId: string, teamId?: string) {
  return withSessionRetry(async () => {
    try {
      let query = supabase
        .from('sessions')
        .select('*')
        .eq('coach_id', coachId)
        .order('session_date', { ascending: false })

      if (teamId) {
        query = query.eq('team_id', teamId)
      }

      const { data, error } = await query

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching sessions:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

export async function createSession(sessionData: SessionInsert) {
  return withSessionRetry(async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert(sessionData)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating session:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

export async function updateSession(sessionId: string, updates: SessionUpdate) {
  return withSessionRetry(async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating session:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

export async function deleteSession(sessionId: string) {
  return withSessionRetry(async () => {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)

      if (error) throw error
      return { data: null, error: null }
    } catch (error) {
      console.error('Error deleting session:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

export async function getUpcomingSessions(teamId: string, limit: number = 10) {
  return withSessionRetry(async () => {
    try {
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('team_id', teamId)
        .gte('session_date', now)
        .order('session_date', { ascending: true })
        .limit(limit)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

// ========================================
// Session-Syllabus Integration
// ========================================

/**
 * Input type for creating a session with syllabus data
 */
export interface SessionWithSyllabusInsert extends SessionInsert {
  syllabus_week_index?: number | null
  syllabus_day_of_week?: number | null
  theme_block_id?: string | null
  theme_snapshot?: SessionThemeSnapshot | null
}

/**
 * Get the latest session for a team that has syllabus data
 * Used to determine the "next" syllabus slot when creating a new session
 * Only includes sessions with syllabus_week_index set (excludes manual sessions)
 *
 * @param teamId - The team ID to query
 * @returns The latest syllabus-linked session, or null if none exist
 */
export async function getLatestSyllabusSession(
  teamId: string
): Promise<{ data: SessionWithSyllabus | null; error: string | null }> {
  return withSessionRetry(async () => {
    try {
      // Query sessions that have syllabus data, ordered by session_date descending
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('team_id', teamId)
        .not('syllabus_week_index', 'is', null)
        .order('session_date', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        // PGRST116 means no rows returned - that's OK
        if (error.code === 'PGRST116') {
          return { data: null, error: null }
        }
        throw error
      }

      return { data: data as SessionWithSyllabus, error: null }
    } catch (error) {
      console.error('Error fetching latest syllabus session:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

/**
 * Create a session with syllabus integration data
 * Extends the base createSession to include syllabus fields
 */
export async function createSessionWithSyllabus(sessionData: SessionWithSyllabusInsert) {
  return withSessionRetry(async () => {
    try {
      // Cast to any to allow new columns that aren't in generated types yet
      const { data, error } = await (supabase.from('sessions') as any)
        .insert(sessionData)
        .select()
        .single()

      if (error) throw error
      return { data: data as SessionWithSyllabus, error: null }
    } catch (error) {
      console.error('Error creating session with syllabus:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}