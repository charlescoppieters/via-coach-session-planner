import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
import { withSessionRetry } from './session-utils'
import type { SessionInsert, SessionUpdate } from '@/types/database'

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