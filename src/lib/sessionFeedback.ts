import { createClient } from '@/lib/supabase/client'
import { withSessionRetry } from './session-utils'
import type { Player } from '@/types/database'

const supabase = createClient()

// ============================================================
// Types
// ============================================================

export interface SessionFeedback {
  id: string
  session_id: string
  coach_id: string
  team_feedback: string | null
  audio_url: string | null
  transcript: string | null
  overall_rating: number | null
  processed_at: string | null
  created_at: string
  updated_at: string
}

export interface PlayerFeedbackNote {
  id: string
  session_feedback_id: string
  player_id: string
  note: string
  created_at: string
}

export interface PlayerAttendanceData {
  player_id: string
  status: 'present' | 'absent'
}

export interface PlayerNoteData {
  player_id: string
  note: string
}

// ============================================================
// Get Session Feedback
// ============================================================

/**
 * Fetch the session feedback record for a session (if exists)
 */
export async function getSessionFeedback(sessionId: string) {
  return withSessionRetry(async () => {
    try {
      const { data, error } = await supabase
        .from('session_feedback')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle()

      if (error) throw error
      return { data: data as SessionFeedback | null, error: null }
    } catch (error) {
      console.error('Error fetching session feedback:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

// ============================================================
// Get Player Feedback Notes
// ============================================================

/**
 * Fetch all player feedback notes for a session feedback record
 */
export async function getPlayerFeedbackNotes(sessionFeedbackId: string) {
  return withSessionRetry(async () => {
    try {
      const { data, error } = await supabase
        .from('player_feedback_notes')
        .select('*')
        .eq('session_feedback_id', sessionFeedbackId)

      if (error) throw error
      return { data: data as PlayerFeedbackNote[], error: null }
    } catch (error) {
      console.error('Error fetching player feedback notes:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

// ============================================================
// Save All Feedback (Main Save Function)
// ============================================================

/**
 * Save all feedback data for a session in one transaction:
 * - Upsert session_feedback record
 * - Upsert attendance records for all players
 * - Save player feedback notes (delete old, insert new)
 */
export async function saveAllFeedback(
  sessionId: string,
  coachId: string,
  teamFeedback: string,
  attendance: PlayerAttendanceData[],
  playerNotes: PlayerNoteData[]
) {
  return withSessionRetry(async () => {
    try {
      // 1. Upsert session_feedback record
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('session_feedback')
        .upsert(
          {
            session_id: sessionId,
            coach_id: coachId,
            team_feedback: teamFeedback || null,
          },
          {
            onConflict: 'session_id',
          }
        )
        .select()
        .single()

      if (feedbackError) throw feedbackError

      const sessionFeedbackId = feedbackData.id

      // 2. Upsert attendance records for all players
      if (attendance.length > 0) {
        const attendanceRecords = attendance.map((a) => ({
          session_id: sessionId,
          player_id: a.player_id,
          status: a.status,
        }))

        const { error: attendanceError } = await supabase
          .from('session_attendance')
          .upsert(attendanceRecords, {
            onConflict: 'session_id,player_id',
          })

        if (attendanceError) throw attendanceError
      }

      // 3. Handle player feedback notes
      // Delete existing notes for this feedback
      const { error: deleteError } = await supabase
        .from('player_feedback_notes')
        .delete()
        .eq('session_feedback_id', sessionFeedbackId)

      if (deleteError) throw deleteError

      // Insert new notes (only for players with non-empty notes)
      const notesToInsert = playerNotes
        .filter((n) => n.note.trim() !== '')
        .map((n) => ({
          session_feedback_id: sessionFeedbackId,
          player_id: n.player_id,
          note: n.note,
        }))

      if (notesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('player_feedback_notes')
          .insert(notesToInsert)

        if (insertError) throw insertError
      }

      // 4. Generate training events for attending players with matching IDPs
      const { error: trainingError } = await supabase.rpc(
        'generate_training_events',
        { p_session_id: sessionId }
      )

      if (trainingError) {
        console.error('Error generating training events:', trainingError)
        // Don't throw - feedback was saved successfully, training events are secondary
      }

      return { data: feedbackData, error: null }
    } catch (error) {
      console.error('Error saving all feedback:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

// ============================================================
// Load All Feedback Data for Modal
// ============================================================

export interface FeedbackModalData {
  teamFeedback: string
  attendance: Record<string, 'present' | 'absent'>
  playerNotes: Record<string, string>
}

/**
 * Load all existing feedback data for a session to populate the modal
 */
export async function loadFeedbackModalData(
  sessionId: string,
  players: Player[]
): Promise<{ data: FeedbackModalData | null; error: string | null }> {
  return withSessionRetry(async () => {
    try {
      // Initialize with defaults (all present, no notes)
      const result: FeedbackModalData = {
        teamFeedback: '',
        attendance: {},
        playerNotes: {},
      }

      // Set default attendance to 'present' for all players
      players.forEach((p) => {
        result.attendance[p.id] = 'present'
        result.playerNotes[p.id] = ''
      })

      // 1. Get session feedback
      const { data: feedback } = await getSessionFeedback(sessionId)
      if (feedback) {
        result.teamFeedback = feedback.team_feedback || ''

        // 2. Get player notes if feedback exists
        const { data: notes } = await getPlayerFeedbackNotes(feedback.id)
        if (notes) {
          notes.forEach((n) => {
            result.playerNotes[n.player_id] = n.note
          })
        }
      }

      // 3. Get existing attendance records
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('session_attendance')
        .select('player_id, status')
        .eq('session_id', sessionId)

      if (attendanceError) throw attendanceError

      if (attendanceRecords) {
        attendanceRecords.forEach((a) => {
          result.attendance[a.player_id] = a.status as 'present' | 'absent'
        })
      }

      return { data: result, error: null }
    } catch (error) {
      console.error('Error loading feedback modal data:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}
