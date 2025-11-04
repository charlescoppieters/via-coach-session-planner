import { supabase } from './supabase'
import { withSessionRetry } from './session-utils'
import type { SessionAttendanceInsert, SessionAttendanceUpdate, Player } from '@/types/database'

export interface AttendanceWithPlayer {
  id: string
  session_id: string
  player_id: string
  status: string
  notes: string | null
  created_at: string
  updated_at: string
  player: Player
}

/**
 * Fetch all attendance records for a session with player details
 */
export async function getSessionAttendance(sessionId: string) {
  return withSessionRetry(async () => {
    try {
      const { data, error } = await supabase
        .from('session_attendance')
        .select(`
          *,
          player:players (*)
        `)
        .eq('session_id', sessionId)

      if (error) throw error
      return { data: data as unknown as AttendanceWithPlayer[], error: null }
    } catch (error) {
      console.error('Error fetching session attendance:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

/**
 * Mark or update attendance for a single player in a session
 * Uses upsert to handle both insert and update cases
 */
export async function markAttendance(
  sessionId: string,
  playerId: string,
  status: 'present' | 'absent' = 'present'
) {
  return withSessionRetry(async () => {
    try {
      const { data, error } = await supabase
        .from('session_attendance')
        .upsert(
          {
            session_id: sessionId,
            player_id: playerId,
            status,
          },
          {
            onConflict: 'session_id,player_id',
          }
        )
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error marking attendance:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

/**
 * Initialize attendance records for all players in a team for a specific session
 * All players default to 'present' status
 */
export async function initializeSessionAttendance(
  sessionId: string,
  teamId: string,
  coachId: string
) {
  return withSessionRetry(async () => {
    try {
      // First, fetch all players for the team
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id')
        .eq('team_id', teamId)
        .eq('coach_id', coachId)

      if (playersError) throw playersError
      if (!players || players.length === 0) {
        return { data: [], error: null }
      }

      // Create attendance records for all players
      const attendanceRecords: SessionAttendanceInsert[] = players.map((player) => ({
        session_id: sessionId,
        player_id: player.id,
        status: 'present',
      }))

      const { data, error } = await supabase
        .from('session_attendance')
        .insert(attendanceRecords)
        .select()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error initializing session attendance:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

/**
 * Delete all attendance records for a session
 */
export async function deleteSessionAttendance(sessionId: string) {
  return withSessionRetry(async () => {
    try {
      const { error } = await supabase
        .from('session_attendance')
        .delete()
        .eq('session_id', sessionId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error deleting session attendance:', error)
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

/**
 * Update attendance notes for a specific player in a session
 */
export async function updateAttendanceNotes(
  sessionId: string,
  playerId: string,
  notes: string
) {
  return withSessionRetry(async () => {
    try {
      const { data, error } = await supabase
        .from('session_attendance')
        .update({ notes })
        .eq('session_id', sessionId)
        .eq('player_id', playerId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating attendance notes:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}
