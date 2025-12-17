import { createClient } from '@/lib/supabase/client'
import type {
  TeamTrainingSummary,
  TeamIDPGap,
  TeamAttributeBreakdown,
  TeamPlayerMatrixRow,
  TeamTrainingTrendPoint,
  TeamSessionBlockUsage,
  TeamBlockRecommendation,
} from '@/types/database'

const supabase = createClient()

// ========================================
// Team Training Summary
// ========================================

/**
 * Get team training summary (overview cards data)
 * Returns aggregate stats for the team within the date range
 */
export async function getTeamTrainingSummary(
  teamId: string,
  startDate?: Date | null,
  endDate?: Date | null
) {
  try {
    const { data, error } = await supabase.rpc('get_team_training_summary', {
      p_team_id: teamId,
      p_start_date: startDate?.toISOString() ?? null,
      p_end_date: endDate?.toISOString() ?? null,
    })

    if (error) {
      console.error('Error fetching team training summary:', error)
      return { data: null, error }
    }

    // RPC returns an array, get first row
    const summary = Array.isArray(data) ? data[0] : data
    return { data: summary as TeamTrainingSummary | null, error: null }
  } catch (error) {
    console.error('Error fetching team training summary:', error)
    return { data: null, error }
  }
}

// ========================================
// IDP Gap Analysis
// ========================================

/**
 * Get IDP gaps for the team
 * Shows which IDPs are undertrained (sorted by gap severity)
 */
export async function getTeamIDPGaps(
  teamId: string,
  startDate?: Date | null,
  endDate?: Date | null
) {
  try {
    const { data, error } = await supabase.rpc('get_team_idp_gaps', {
      p_team_id: teamId,
      p_start_date: startDate?.toISOString() ?? null,
      p_end_date: endDate?.toISOString() ?? null,
    })

    if (error) {
      console.error('Error fetching team IDP gaps:', error)
      return { data: null, error }
    }

    return { data: data as TeamIDPGap[], error: null }
  } catch (error) {
    console.error('Error fetching team IDP gaps:', error)
    return { data: null, error }
  }
}

// ========================================
// Attribute Breakdown by Category
// ========================================

/**
 * Get training breakdown by attribute category (Four Corners)
 * Returns opportunities grouped by In Possession, Out of Possession, Physical, Psychological
 */
export async function getTeamAttributeBreakdown(
  teamId: string,
  startDate?: Date | null,
  endDate?: Date | null
) {
  try {
    const { data, error } = await supabase.rpc('get_team_attribute_breakdown', {
      p_team_id: teamId,
      p_start_date: startDate?.toISOString() ?? null,
      p_end_date: endDate?.toISOString() ?? null,
    })

    if (error) {
      console.error('Error fetching team attribute breakdown:', error)
      return { data: null, error }
    }

    return { data: data as TeamAttributeBreakdown[], error: null }
  } catch (error) {
    console.error('Error fetching team attribute breakdown:', error)
    return { data: null, error }
  }
}

// ========================================
// Player Development Matrix
// ========================================

/**
 * Get player matrix data for the team
 * Returns per-player stats including attendance, IDPs, and trends
 */
export async function getTeamPlayerMatrix(
  teamId: string,
  startDate?: Date | null,
  endDate?: Date | null
) {
  try {
    const { data, error } = await supabase.rpc('get_team_player_matrix', {
      p_team_id: teamId,
      p_start_date: startDate?.toISOString() ?? null,
      p_end_date: endDate?.toISOString() ?? null,
    })

    if (error) {
      console.error('Error fetching team player matrix:', error)
      return { data: null, error }
    }

    return { data: data as TeamPlayerMatrixRow[], error: null }
  } catch (error) {
    console.error('Error fetching team player matrix:', error)
    return { data: null, error }
  }
}

// ========================================
// Training Trend
// ========================================

/**
 * Get weekly training trend data
 * Returns sessions and opportunities per week for chart visualization
 */
export async function getTeamTrainingTrend(
  teamId: string,
  weeks: number = 12
) {
  try {
    const { data, error } = await supabase.rpc('get_team_training_trend', {
      p_team_id: teamId,
      p_weeks: weeks,
    })

    if (error) {
      console.error('Error fetching team training trend:', error)
      return { data: null, error }
    }

    return { data: data as TeamTrainingTrendPoint[], error: null }
  } catch (error) {
    console.error('Error fetching team training trend:', error)
    return { data: null, error }
  }
}

// ========================================
// Session Block Usage
// ========================================

/**
 * Get most used session blocks for the team
 * Returns blocks sorted by usage count
 */
export async function getTeamSessionBlockUsage(
  teamId: string,
  startDate?: Date | null,
  endDate?: Date | null,
  limit: number = 10
) {
  try {
    const { data, error } = await supabase.rpc('get_team_session_block_usage', {
      p_team_id: teamId,
      p_start_date: startDate?.toISOString() ?? null,
      p_end_date: endDate?.toISOString() ?? null,
      p_limit: limit,
    })

    if (error) {
      console.error('Error fetching team session block usage:', error)
      return { data: null, error }
    }

    return { data: data as unknown as TeamSessionBlockUsage[], error: null }
  } catch (error) {
    console.error('Error fetching team session block usage:', error)
    return { data: null, error }
  }
}

// ========================================
// Block Recommendations (by IDP Priority)
// ========================================

/**
 * Get recommended training blocks for the team
 * Returns blocks sorted by their impact on high-priority IDPs
 * Block_Score = Sum of (IDP_score * relevance) for matching attributes
 */
export async function getTeamBlockRecommendations(
  teamId: string,
  startDate?: Date | null,
  endDate?: Date | null,
  limit: number = 10
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_team_block_recommendations', {
      p_team_id: teamId,
      p_start_date: startDate?.toISOString() ?? null,
      p_end_date: endDate?.toISOString() ?? null,
      p_limit: limit,
    })

    if (error) {
      console.error('Error fetching team block recommendations:', error)
      return { data: null, error }
    }

    return { data: data as unknown as TeamBlockRecommendation[], error: null }
  } catch (error) {
    console.error('Error fetching team block recommendations:', error)
    return { data: null, error }
  }
}

// ========================================
// Utility Functions
// ========================================

/**
 * Format training minutes as hours and minutes
 */
export function formatTrainingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${remainingMinutes}m`
}

/**
 * Get status color for IDP gap
 */
export function getGapStatusColor(status: 'urgent' | 'due' | 'on_track'): string {
  switch (status) {
    case 'urgent':
      return '#ef4444' // red
    case 'due':
      return '#f59e0b' // amber
    case 'on_track':
      return '#22c55e' // green
  }
}

/**
 * Get status label for IDP gap
 */
export function getGapStatusLabel(status: 'urgent' | 'due' | 'on_track'): string {
  switch (status) {
    case 'urgent':
      return 'Needs Attention'
    case 'due':
      return 'Recommended Soon'
    case 'on_track':
      return 'Recently Trained'
  }
}

/**
 * Format sessions since trained display
 */
export function formatSessionsAgo(sessionsSince: number, totalSessions: number): { prefix: string; count: number | null; suffix: string } {
  if (totalSessions === 0) return { prefix: '', count: null, suffix: 'No sessions in selected period' }
  if (sessionsSince >= totalSessions) return { prefix: '', count: null, suffix: 'Never in selected period' }
  if (sessionsSince === 0) return { prefix: 'Last trained', count: null, suffix: 'last session' }
  return { prefix: 'Last trained', count: sessionsSince, suffix: sessionsSince === 1 ? 'session ago' : 'sessions ago' }
}

/**
 * Format a date as human-readable relative time (e.g., "2 weeks ago")
 */
export function formatTimeAgo(date: string | null): string {
  if (!date) return 'Never trained'

  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
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
 * Get trend icon and color
 */
export function getTrendDisplay(trend: 'improving' | 'stable' | 'declining'): {
  icon: string
  color: string
  label: string
} {
  switch (trend) {
    case 'improving':
      return { icon: '↑', color: '#22c55e', label: 'Improving' }
    case 'stable':
      return { icon: '→', color: '#6b7280', label: 'Stable' }
    case 'declining':
      return { icon: '↓', color: '#ef4444', label: 'Needs Focus' }
  }
}

/**
 * Get attendance color based on percentage
 */
export function getAttendanceColor(percentage: number): string {
  if (percentage >= 85) return '#22c55e' // green
  if (percentage >= 70) return '#f59e0b' // amber
  return '#ef4444' // red
}

/**
 * Get priority color for score display (0-100)
 * High priority (>= 70): red - needs attention
 * Medium priority (>= 40): amber - recommended soon
 * Low priority (< 40): green - on track
 */
export function getPriorityColor(score: number): string {
  if (score >= 70) return '#ef4444' // red - high priority
  if (score >= 40) return '#f59e0b' // amber - medium priority
  return '#22c55e' // green - low priority
}

/**
 * Get priority level from score (0-100)
 */
export function getPriorityLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

/**
 * Calculate category percentage from breakdown
 */
export function calculateCategoryPercentage(
  breakdown: TeamAttributeBreakdown[],
  category: string
): number {
  const total = breakdown.reduce((sum, b) => sum + b.total_opportunities, 0)
  if (total === 0) return 0
  const categoryData = breakdown.find((b) => b.category === category)
  if (!categoryData) return 0
  return Math.round((categoryData.total_opportunities / total) * 100)
}

/**
 * Get players list for team (for comparison selector)
 */
export async function getTeamPlayers(teamId: string) {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('id, name, position')
      .eq('team_id', teamId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching team players:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching team players:', error)
    return { data: null, error }
  }
}
