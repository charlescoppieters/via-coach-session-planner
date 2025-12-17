import { createClient } from '@/lib/supabase/server'
import type {
  PlayerIDPProgress,
  PlayerTrainingBalance,
} from '@/types/database'

// Types for report data
export interface PlayerReportIDP {
  idp_id: string
  attribute_key: string
  attribute_name: string
  priority: number
  started_at: string
  ended_at: string | null
  training_sessions: number
  last_trained_date: string | null
  sessions: Array<{
    session_id: string
    session_title: string
    session_date: string
  }>
}

export interface PlayerReportData {
  player: {
    id: string
    name: string
    position: string | null
    age: number | null
    gender: string | null
  }
  club: {
    id: string
    name: string
    logo_url: string | null
  }
  team: {
    id: string
    name: string
  }
  attendanceSummary: {
    sessions_attended: number
    total_sessions: number
    attendance_percentage: number
  }
  activeIdps: PlayerReportIDP[]
  historicalIdps: PlayerReportIDP[]
  trainingBalance: PlayerTrainingBalance[]
  generatedAt: string
}

/**
 * Fetch all data needed for player report PDF
 * This runs on the server side
 */
export async function getPlayerReportData(
  playerId: string,
  teamId: string
): Promise<{ data: PlayerReportData | null; error: string | null }> {
  try {
    const supabase = await createClient()

    // 1. Fetch player info
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id, name, position, age, gender, team_id')
      .eq('id', playerId)
      .single()

    if (playerError || !player) {
      return { data: null, error: 'Player not found' }
    }

    // 2. Fetch team info
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name, club_id')
      .eq('id', teamId)
      .single()

    if (teamError || !team) {
      return { data: null, error: 'Team not found' }
    }

    // 3. Fetch club info with logo
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, name, logo_url')
      .eq('id', team.club_id)
      .single()

    if (clubError || !club) {
      return { data: null, error: 'Club not found' }
    }

    // 4. Fetch attendance summary
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: attendanceData } = await (supabase as any)
      .from('player_attendance_summary')
      .select('*')
      .eq('player_id', playerId)
      .single()

    const attendanceSummary = {
      sessions_attended: attendanceData?.sessions_attended ?? 0,
      total_sessions: attendanceData?.total_sessions ?? 0,
      attendance_percentage: attendanceData?.attendance_percentage ?? 0,
    }

    // 5. Fetch all IDPs with progress data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: idpProgressData } = await (supabase as any)
      .from('player_idp_progress')
      .select('*')
      .eq('player_id', playerId)
      .order('ended_at', { ascending: true, nullsFirst: true })
      .order('priority', { ascending: true })

    const idpProgress = (idpProgressData as PlayerIDPProgress[]) || []

    // 6. Fetch training events to get sessions per IDP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: trainingEvents } = await (supabase as any)
      .from('player_training_events')
      .select('session_id, attribute_key')
      .eq('player_id', playerId)

    // Get all session IDs
    const sessionIds = [...new Set((trainingEvents || []).map((e: { session_id: string }) => e.session_id))] as string[]

    // Fetch session details
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, title, session_date')
      .in('id', sessionIds.length > 0 ? sessionIds : [''])
      .order('session_date', { ascending: false })

    // Create session map
    const sessionMap: Record<string, { title: string; session_date: string }> = {}
    sessions?.forEach((s) => {
      sessionMap[s.id] = { title: s.title, session_date: s.session_date }
    })

    // Group training events by attribute_key
    const trainingByAttribute: Record<string, string[]> = {}
    trainingEvents?.forEach((e: { session_id: string; attribute_key: string }) => {
      if (!trainingByAttribute[e.attribute_key]) {
        trainingByAttribute[e.attribute_key] = []
      }
      if (!trainingByAttribute[e.attribute_key].includes(e.session_id)) {
        trainingByAttribute[e.attribute_key].push(e.session_id)
      }
    })

    // 7. Fetch training balance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: balanceData } = await (supabase as any).rpc('get_player_training_balance', {
      p_player_id: playerId,
    })

    const trainingBalance = (balanceData as PlayerTrainingBalance[]) || []

    // 8. Build IDP lists with sessions
    const buildIdpWithSessions = (idp: PlayerIDPProgress): PlayerReportIDP => {
      const attributeSessionIds = trainingByAttribute[idp.attribute_key] || []
      const idpSessions = attributeSessionIds
        .filter((sid) => sessionMap[sid])
        .map((sid) => ({
          session_id: sid,
          session_title: sessionMap[sid].title,
          session_date: sessionMap[sid].session_date,
        }))
        .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())

      return {
        idp_id: idp.idp_id,
        attribute_key: idp.attribute_key,
        attribute_name: idp.attribute_name,
        priority: idp.priority,
        started_at: idp.started_at,
        ended_at: idp.ended_at,
        training_sessions: idp.training_sessions,
        last_trained_date: idp.last_trained_date,
        sessions: idpSessions,
      }
    }

    const activeIdps = idpProgress
      .filter((idp) => !idp.ended_at)
      .map(buildIdpWithSessions)

    const historicalIdps = idpProgress
      .filter((idp) => idp.ended_at)
      .map(buildIdpWithSessions)

    return {
      data: {
        player: {
          id: player.id,
          name: player.name,
          position: player.position,
          age: player.age,
          gender: player.gender,
        },
        club: {
          id: club.id,
          name: club.name,
          logo_url: club.logo_url,
        },
        team: {
          id: team.id,
          name: team.name,
        },
        attendanceSummary,
        activeIdps,
        historicalIdps,
        trainingBalance,
        generatedAt: new Date().toISOString(),
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching player report data:', error)
    return { data: null, error: 'Failed to fetch report data' }
  }
}
