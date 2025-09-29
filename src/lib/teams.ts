import { supabase } from './supabase'
import { withSessionRetry } from './session-utils'
import type { TeamInsert, TeamUpdate } from '@/types/database'

export async function getTeams(coachId: string) {
  return withSessionRetry(async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching teams:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

export async function getTeam(teamId: string) {
  return withSessionRetry(async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching team:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

export async function createTeam(teamData: TeamInsert) {
  return withSessionRetry(async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert(teamData)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating team:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

export async function updateTeam(teamId: string, updates: TeamUpdate) {
  return withSessionRetry(async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating team:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

export async function deleteTeam(teamId: string) {
  return withSessionRetry(async () => {
    try {
      // Note: Sessions will be automatically deleted due to CASCADE in the database schema
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)

      if (error) throw error
      return { data: null, error: null }
    } catch (error) {
      console.error('Error deleting team:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}