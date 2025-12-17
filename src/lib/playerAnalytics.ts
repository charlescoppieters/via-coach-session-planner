import { createClient } from '@/lib/supabase/client'
import type {
  PlayerIDPProgress,
  PlayerAttendanceSummary,
  PlayerTrainingEvent,
  PlayerSessionDetail,
  PlayerIDPPriority,
  PlayerFeedbackInsight,
  PlayerBlockRecommendation,
  PlayerTrainingBalance,
  FeedbackFilters,
  SessionBlock,
  SessionBlockAttribute,
} from '@/types/database'

const supabase = createClient()

// Helper types for querying database views and tables not in generated types
// These were added in v3 migrations and types need to be regenerated
type ViewName = 'player_idp_progress' | 'player_attendance_summary'
type UntypedTableName = 'player_training_events' | 'player_feedback_notes' | 'feedback_insights'

// Helper function to query database views or tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromView(viewName: ViewName): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase.from(viewName as any)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromTable(tableName: UntypedTableName): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase.from(tableName as any)
}

// ========================================
// IDP Progress Data
// ========================================

/**
 * Get IDP progress data from the player_idp_progress view
 * Returns aggregated training and feedback metrics per IDP
 */
export async function getPlayerIDPProgress(playerId: string) {
  try {
    const { data, error } = await fromView('player_idp_progress')
      .select('*')
      .eq('player_id', playerId)
      .order('ended_at', { ascending: true, nullsFirst: true }) // Active IDPs first
      .order('priority', { ascending: true })

    if (error) {
      console.error('Error fetching player IDP progress:', error)
      return { data: null, error }
    }

    return { data: data as unknown as PlayerIDPProgress[], error: null }
  } catch (error) {
    console.error('Error fetching player IDP progress:', error)
    return { data: null, error }
  }
}

/**
 * Get active IDP progress only (ended_at IS NULL)
 */
export async function getActiveIDPProgress(playerId: string) {
  try {
    const { data, error } = await fromView('player_idp_progress')
      .select('*')
      .eq('player_id', playerId)
      .is('ended_at', null)
      .order('priority', { ascending: true })

    if (error) {
      console.error('Error fetching active IDP progress:', error)
      return { data: null, error }
    }

    return { data: data as unknown as PlayerIDPProgress[], error: null }
  } catch (error) {
    console.error('Error fetching active IDP progress:', error)
    return { data: null, error }
  }
}

// ========================================
// Attendance Summary
// ========================================

/**
 * Get player attendance summary from the player_attendance_summary view
 */
export async function getPlayerAttendanceSummary(playerId: string) {
  try {
    const { data, error } = await fromView('player_attendance_summary')
      .select('*')
      .eq('player_id', playerId)
      .single()

    if (error) {
      // No attendance records is a valid state
      if (error.code === 'PGRST116') {
        return {
          data: {
            player_id: playerId,
            team_id: '',
            club_id: '',
            sessions_attended: 0,
            sessions_missed: 0,
            total_sessions: 0,
            attendance_percentage: 0,
          } as PlayerAttendanceSummary,
          error: null,
        }
      }
      console.error('Error fetching player attendance summary:', error)
      return { data: null, error }
    }

    return { data: data as unknown as PlayerAttendanceSummary, error: null }
  } catch (error) {
    console.error('Error fetching player attendance summary:', error)
    return { data: null, error }
  }
}

// ========================================
// Training Events
// ========================================

/**
 * Get all training events for a player
 */
export async function getPlayerTrainingEvents(playerId: string) {
  try {
    const { data, error } = await fromTable('player_training_events')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching player training events:', error)
      return { data: null, error }
    }

    return { data: data as PlayerTrainingEvent[], error: null }
  } catch (error) {
    console.error('Error fetching player training events:', error)
    return { data: null, error }
  }
}

/**
 * Get training events for a specific session
 */
export async function getTrainingEventsForSession(
  playerId: string,
  sessionId: string
) {
  try {
    const { data, error } = await fromTable('player_training_events')
      .select('*')
      .eq('player_id', playerId)
      .eq('session_id', sessionId)

    if (error) {
      console.error('Error fetching session training events:', error)
      return { data: null, error }
    }

    return { data: data as PlayerTrainingEvent[], error: null }
  } catch (error) {
    console.error('Error fetching session training events:', error)
    return { data: null, error }
  }
}

/**
 * Get training sessions for a specific IDP attribute
 * Returns sessions where this attribute was trained with session details
 */
export interface IDPTrainingSession {
  session_id: string
  session_title: string
  session_date: string
  weight: number
}

export async function getIDPTrainingSessions(
  playerId: string,
  attributeKey: string
): Promise<{ data: IDPTrainingSession[] | null; error: unknown }> {
  try {
    // Get training events for this attribute
    const { data: trainingEvents, error: eventsError } = await fromTable('player_training_events')
      .select('session_id, weight')
      .eq('player_id', playerId)
      .eq('attribute_key', attributeKey)

    if (eventsError) {
      console.error('Error fetching IDP training events:', eventsError)
      return { data: null, error: eventsError }
    }

    if (!trainingEvents || trainingEvents.length === 0) {
      return { data: [], error: null }
    }

    // Get unique session IDs
    const sessionIds = Array.from(new Set(trainingEvents.map((e: { session_id: string }) => e.session_id))) as string[]

    // Fetch session details
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, title, session_date')
      .in('id', sessionIds)
      .order('session_date', { ascending: false })

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return { data: null, error: sessionsError }
    }

    // Create a map of session_id to weight
    const weightMap: Record<string, number> = {}
    trainingEvents.forEach((e: { session_id: string; weight: number }) => {
      weightMap[e.session_id] = e.weight
    })

    // Build result
    const result: IDPTrainingSession[] = sessions?.map((session) => ({
      session_id: session.id,
      session_title: session.title,
      session_date: session.session_date,
      weight: weightMap[session.id] || 0,
    })) || []

    return { data: result, error: null }
  } catch (error) {
    console.error('Error fetching IDP training sessions:', error)
    return { data: null, error }
  }
}

/**
 * Get training sessions for all active IDPs for a player
 * Returns a map of attribute_key to training sessions
 */
export async function getAllIDPTrainingSessions(
  playerId: string,
  attributeKeys: string[]
): Promise<{ data: Record<string, IDPTrainingSession[]> | null; error: unknown }> {
  try {
    if (attributeKeys.length === 0) {
      return { data: {}, error: null }
    }

    // Get all training events for these attributes
    const { data: trainingEvents, error: eventsError } = await fromTable('player_training_events')
      .select('session_id, attribute_key, weight')
      .eq('player_id', playerId)
      .in('attribute_key', attributeKeys)

    if (eventsError) {
      console.error('Error fetching IDP training events:', eventsError)
      return { data: null, error: eventsError }
    }

    if (!trainingEvents || trainingEvents.length === 0) {
      // Return empty arrays for each attribute
      const result: Record<string, IDPTrainingSession[]> = {}
      attributeKeys.forEach(key => { result[key] = [] })
      return { data: result, error: null }
    }

    // Get unique session IDs
    const sessionIds = Array.from(new Set(trainingEvents.map((e: { session_id: string }) => e.session_id))) as string[]

    // Fetch session details
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, title, session_date')
      .in('id', sessionIds)
      .order('session_date', { ascending: false })

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return { data: null, error: sessionsError }
    }

    // Create a map of session_id to session details
    const sessionMap: Record<string, { title: string; session_date: string }> = {}
    sessions?.forEach((session) => {
      sessionMap[session.id] = {
        title: session.title,
        session_date: session.session_date,
      }
    })

    // Group by attribute_key
    const result: Record<string, IDPTrainingSession[]> = {}
    attributeKeys.forEach(key => { result[key] = [] })

    trainingEvents.forEach((e: { session_id: string; attribute_key: string; weight: number }) => {
      const sessionInfo = sessionMap[e.session_id]
      if (sessionInfo) {
        result[e.attribute_key].push({
          session_id: e.session_id,
          session_title: sessionInfo.title,
          session_date: sessionInfo.session_date,
          weight: e.weight,
        })
      }
    })

    // Sort each array by session_date descending
    Object.keys(result).forEach(key => {
      result[key].sort((a, b) =>
        new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
      )
    })

    return { data: result, error: null }
  } catch (error) {
    console.error('Error fetching all IDP training sessions:', error)
    return { data: null, error }
  }
}

// ========================================
// Player Sessions (Composite Data)
// ========================================

/**
 * Get all sessions for a player with attendance, feedback, training events, and blocks
 * Only returns sessions where the player has an attendance record
 */
export async function getPlayerSessions(
  playerId: string,
  limit: number = 20,
  offset: number = 0,
  attributeNames: Record<string, string> = {}
): Promise<{ data: PlayerSessionDetail[] | null; error: unknown }> {
  try {
    // Get all attendance records for this player with session details
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('session_attendance')
      .select(`
        session_id,
        status,
        sessions:session_id (
          id,
          title,
          session_date,
          duration
        )
      `)
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (attendanceError) {
      console.error('Error fetching player attendance:', attendanceError)
      return { data: null, error: attendanceError }
    }

    if (!attendanceData || attendanceData.length === 0) {
      return { data: [], error: null }
    }

    // Get session IDs
    const sessionIds = attendanceData.map((a) => a.session_id)

    // Fetch current active IDPs for the player
    // We show current IDPs matched against all sessions (past and future)
    // This is more useful for coaches than historical accuracy
    const { data: activeIdps } = await supabase
      .from('player_idps')
      .select('attribute_key')
      .eq('player_id', playerId)
      .is('ended_at', null)

    // Create a set of active IDP attribute keys for fast lookup
    const activeIdpKeys = new Set(activeIdps?.map(idp => idp.attribute_key) || [])

    // Helper function to check if an attribute is a current IDP
    const isCurrentIdp = (attributeKey: string): boolean => {
      return activeIdpKeys.has(attributeKey)
    }

    // Fetch session feedback for these sessions
    const { data: feedbackData } = await supabase
      .from('session_feedback')
      .select('session_id, team_feedback')
      .in('session_id', sessionIds)

    // Fetch player-specific notes for these sessions
    const { data: playerNotesData } = await fromTable('player_feedback_notes')
      .select(`
        note,
        session_feedback:session_feedback_id (
          session_id
        )
      `)
      .eq('player_id', playerId)

    // Fetch training events for this player in these sessions
    const { data: trainingEventsData } = await fromTable('player_training_events')
      .select('session_id, attribute_key, weight')
      .eq('player_id', playerId)
      .in('session_id', sessionIds)

    // Fetch block assignments for these sessions with block details and attributes
    const { data: blockAssignmentsData } = await supabase
      .from('session_block_assignments')
      .select(`
        session_id,
        position,
        block:block_id (
          id,
          title
        )
      `)
      .in('session_id', sessionIds)
      .order('position', { ascending: true })

    // Get unique block IDs
    const blockIds = [
      ...new Set(
        blockAssignmentsData?.map((ba) => {
          const block = ba.block as unknown as { id: string; title: string } | null
          return block?.id
        }).filter(Boolean) || []
      ),
    ] as string[]

    // Fetch attributes for all blocks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: blockAttributesData } = await (supabase as any)
      .from('session_block_attributes')
      .select('block_id, attribute_key, order_type')
      .in('block_id', blockIds)

    // Build a map of block_id -> raw attributes (without is_player_idp yet)
    const blockAttributesRawMap: Record<
      string,
      { first: Array<{ key: string; name: string }>; second: Array<{ key: string; name: string }> }
    > = {}

    blockAttributesData?.forEach(
      (attr: { block_id: string; attribute_key: string; order_type: string }) => {
        if (!blockAttributesRawMap[attr.block_id]) {
          blockAttributesRawMap[attr.block_id] = { first: [], second: [] }
        }

        const attrData = {
          key: attr.attribute_key,
          name: attributeNames[attr.attribute_key] || attr.attribute_key,
        }

        if (attr.order_type === 'first') {
          blockAttributesRawMap[attr.block_id].first.push(attrData)
        } else {
          blockAttributesRawMap[attr.block_id].second.push(attrData)
        }
      }
    )

    // Build a map of session_id -> blocks (with is_player_idp based on current IDPs)
    const sessionBlocksMap: Record<string, SessionBlock[]> = {}
    blockAssignmentsData?.forEach((ba) => {
      const block = ba.block as unknown as { id: string; title: string } | null
      if (!block) return

      if (!sessionBlocksMap[ba.session_id]) {
        sessionBlocksMap[ba.session_id] = []
      }

      const rawAttrs = blockAttributesRawMap[block.id] || { first: [], second: [] }

      // Build attributes with is_player_idp flag based on current active IDPs
      const firstOrderOutcomes: SessionBlockAttribute[] = rawAttrs.first.map(attr => ({
        ...attr,
        is_player_idp: isCurrentIdp(attr.key),
      }))

      const secondOrderOutcomes: SessionBlockAttribute[] = rawAttrs.second.map(attr => ({
        ...attr,
        is_player_idp: isCurrentIdp(attr.key),
      }))

      sessionBlocksMap[ba.session_id].push({
        block_id: block.id,
        block_title: block.title,
        position: ba.position,
        first_order_outcomes: firstOrderOutcomes,
        second_order_outcomes: secondOrderOutcomes,
      })
    })

    // Build the composite result
    const result: PlayerSessionDetail[] = attendanceData.map((attendance) => {
      const session = attendance.sessions as unknown as {
        id: string
        title: string
        session_date: string
        duration: number
      }

      // Find feedback for this session
      const feedback = feedbackData?.find(
        (f) => f.session_id === attendance.session_id
      )

      // Find player note for this session
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const playerNote = playerNotesData?.find(
        (n: { note: string; session_feedback: { session_id: string } | null }) =>
          n.session_feedback?.session_id === attendance.session_id
      )

      // Find training events for this session
      const sessionTrainingEvents =
        trainingEventsData?.filter(
          (e: { session_id: string; attribute_key: string; weight: number }) => e.session_id === attendance.session_id
        ) || []

      // Get blocks for this session
      const sessionBlocks = sessionBlocksMap[attendance.session_id] || []

      return {
        session_id: attendance.session_id,
        title: session?.title || 'Unknown Session',
        session_date: session?.session_date || '',
        duration: session?.duration || 0,
        attendance_status: attendance.status as 'present' | 'absent',
        team_feedback: feedback?.team_feedback || null,
        player_note: playerNote?.note || null,
        training_events: sessionTrainingEvents.map((e: { attribute_key: string; weight: number }) => ({
          attribute_key: e.attribute_key,
          weight: e.weight,
        })),
        blocks: sessionBlocks,
      }
    })

    // Sort by session date descending
    result.sort(
      (a, b) =>
        new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
    )

    return { data: result, error: null }
  } catch (error) {
    console.error('Error fetching player sessions:', error)
    return { data: null, error }
  }
}

/**
 * Get total count of sessions for a player (for pagination)
 */
export async function getPlayerSessionsCount(playerId: string) {
  try {
    const { count, error } = await supabase
      .from('session_attendance')
      .select('*', { count: 'exact', head: true })
      .eq('player_id', playerId)

    if (error) {
      console.error('Error fetching player sessions count:', error)
      return { count: 0, error }
    }

    return { count: count || 0, error: null }
  } catch (error) {
    console.error('Error fetching player sessions count:', error)
    return { count: 0, error }
  }
}

// ========================================
// Utility Functions
// ========================================

/**
 * Calculate trend indicator based on feedback sentiment
 * Returns: 'improving' | 'stable' | 'declining'
 */
export function calculateTrend(
  positiveMentions: number,
  negativeMentions: number,
  neutralMentions: number
): 'improving' | 'stable' | 'declining' {
  const total = positiveMentions + negativeMentions + neutralMentions
  if (total === 0) return 'stable'

  const positiveRatio = positiveMentions / total
  const negativeRatio = negativeMentions / total

  if (positiveRatio > 0.6) return 'improving'
  if (negativeRatio > 0.4) return 'declining'
  return 'stable'
}

/**
 * Format weight as percentage string
 */
export function formatWeightAsPercentage(weight: number): string {
  return `${Math.round(weight * 100)}%`
}

/**
 * Calculate training progress percentage
 * Based on total_training_weight relative to training_sessions
 */
export function calculateTrainingProgress(
  trainingSessions: number,
  totalWeight: number,
  maxExpectedSessions: number = 20
): number {
  // Simple heuristic: compare sessions to expected max
  if (maxExpectedSessions === 0) return 0
  return Math.min(100, Math.round((trainingSessions / maxExpectedSessions) * 100))
}

/**
 * Format date duration between two dates
 */
export function formatIDPDuration(startedAt: string, endedAt: string | null): string {
  const start = new Date(startedAt)
  const end = endedAt ? new Date(endedAt) : new Date()

  const diffMs = end.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} week${weeks !== 1 ? 's' : ''}`
  } else {
    const months = Math.floor(diffDays / 30)
    return `${months} month${months !== 1 ? 's' : ''}`
  }
}

/**
 * Get priority label from number
 */
export function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 1:
      return 'Primary'
    case 2:
      return 'Secondary'
    case 3:
      return 'Tertiary'
    default:
      return `Priority ${priority}`
  }
}

// ========================================
// Player Analytics (Enhanced with Scoring)
// ========================================

/**
 * Get player IDPs with priority scores
 * Uses the get_player_idp_priorities RPC function
 */
export async function getPlayerIDPPriorities(playerId: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_player_idp_priorities', {
      p_player_id: playerId,
    })

    if (error) {
      console.error('Error fetching player IDP priorities:', error)
      return { data: null, error }
    }

    return { data: data as PlayerIDPPriority[], error: null }
  } catch (error) {
    console.error('Error fetching player IDP priorities:', error)
    return { data: null, error }
  }
}

/**
 * Get feedback insights for a player with extracted quotes
 * Uses the get_player_feedback_insights RPC function
 */
export async function getPlayerFeedbackInsights(
  playerId: string,
  filters?: FeedbackFilters,
  limit: number = 50,
  offset: number = 0
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_player_feedback_insights', {
      p_player_id: playerId,
      p_attribute_key: filters?.attributeKey || null,
      p_sentiment: filters?.sentiment || null,
      p_start_date: filters?.startDate?.toISOString() || null,
      p_end_date: filters?.endDate?.toISOString() || null,
      p_limit: limit,
      p_offset: offset,
    })

    if (error) {
      console.error('Error fetching player feedback insights:', error)
      return { data: null, error }
    }

    return { data: data as PlayerFeedbackInsight[], error: null }
  } catch (error) {
    console.error('Error fetching player feedback insights:', error)
    return { data: null, error }
  }
}

/**
 * Get total count of feedback insights for pagination
 */
export async function getPlayerFeedbackInsightsCount(
  playerId: string,
  filters?: FeedbackFilters
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_player_feedback_insights_count', {
      p_player_id: playerId,
      p_attribute_key: filters?.attributeKey || null,
      p_sentiment: filters?.sentiment || null,
      p_start_date: filters?.startDate?.toISOString() || null,
      p_end_date: filters?.endDate?.toISOString() || null,
    })

    if (error) {
      console.error('Error fetching player feedback insights count:', error)
      return { count: 0, error }
    }

    return { count: data as number, error: null }
  } catch (error) {
    console.error('Error fetching player feedback insights count:', error)
    return { count: 0, error }
  }
}

/**
 * Get block recommendations for a player based on their active IDPs
 * Uses the get_player_block_recommendations RPC function
 */
export async function getPlayerBlockRecommendations(
  playerId: string,
  limit: number = 10
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_player_block_recommendations', {
      p_player_id: playerId,
      p_limit: limit,
    })

    if (error) {
      console.error('Error fetching player block recommendations:', error)
      return { data: null, error }
    }

    return { data: data as PlayerBlockRecommendation[], error: null }
  } catch (error) {
    console.error('Error fetching player block recommendations:', error)
    return { data: null, error }
  }
}

/**
 * Get training balance (Four Corners breakdown) for a player
 * Uses the get_player_training_balance RPC function
 */
export async function getPlayerTrainingBalance(playerId: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_player_training_balance', {
      p_player_id: playerId,
    })

    if (error) {
      console.error('Error fetching player training balance:', error)
      return { data: null, error }
    }

    return { data: data as PlayerTrainingBalance[], error: null }
  } catch (error) {
    console.error('Error fetching player training balance:', error)
    return { data: null, error }
  }
}

/**
 * Format time ago for display (e.g., "2 days ago", "1 week ago")
 */
export function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return 'Never trained'

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 14) return '1 week ago'
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 60) return '1 month ago'
  return `${Math.floor(diffDays / 30)} months ago`
}

/**
 * Get sentiment color for badges
 */
export function getSentimentColor(sentiment: string | null): string {
  switch (sentiment) {
    case 'positive':
      return '#22c55e' // green
    case 'negative':
      return '#ef4444' // red
    case 'neutral':
      return '#f59e0b' // amber
    default:
      return '#6b7280' // gray
  }
}

/**
 * Get gap status color (matching team analytics)
 */
export function getGapStatusColor(status: string): string {
  switch (status) {
    case 'urgent':
      return '#ef4444' // red
    case 'due':
      return '#f59e0b' // amber
    case 'on_track':
      return '#22c55e' // green
    default:
      return '#6b7280' // gray
  }
}

// ========================================
// Recent Feedback Notes (Raw Data)
// ========================================

export interface PlayerFeedbackNote {
  id: string
  note: string
  session_id: string
  session_title: string
  session_date: string
  created_at: string
}

/**
 * Get recent player feedback notes (raw data, not AI-analyzed)
 * This fetches directly from player_feedback_notes table
 */
export async function getRecentPlayerFeedbackNotes(
  playerId: string,
  limit: number = 5
): Promise<{ data: PlayerFeedbackNote[] | null; error: unknown }> {
  try {
    const { data, error } = await fromTable('player_feedback_notes')
      .select(`
        id,
        note,
        session_feedback:session_feedback_id (
          session_id,
          sessions:session_id (
            id,
            title,
            session_date
          )
        ),
        created_at
      `)
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching player feedback notes:', error)
      return { data: null, error }
    }

    if (!data) {
      return { data: [], error: null }
    }

    // Transform the data to flatten the nested structure
    const notes: PlayerFeedbackNote[] = data
      .filter((item: { note: string; session_feedback: unknown }) => item.session_feedback && item.note)
      .map((item: { id: string; note: string; session_feedback: unknown; created_at: string }) => {
        const sessionFeedback = item.session_feedback as {
          session_id: string
          sessions: { id: string; title: string; session_date: string }
        }
        return {
          id: item.id,
          note: item.note,
          session_id: sessionFeedback?.sessions?.id || '',
          session_title: sessionFeedback?.sessions?.title || 'Unknown Session',
          session_date: sessionFeedback?.sessions?.session_date || '',
          created_at: item.created_at,
        }
      })
      .filter((note: PlayerFeedbackNote) => note.session_id) // Only include notes with valid sessions

    return { data: notes, error: null }
  } catch (error) {
    console.error('Error fetching player feedback notes:', error)
    return { data: null, error }
  }
}
