import { supabase } from './supabase'
import { withSessionRetry } from './session-utils'
import type { CoachingRuleInsert, CoachingRuleUpdate } from '@/types/database'

export async function getRules(coachId: string, teamId?: string | null) {
  return withSessionRetry(async () => {
    try {
      let query = supabase
        .from('coaching_rules')
        .select('*')
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false })

      if (teamId !== undefined) {
        // If teamId is provided, filter by it (null for global rules, string for team-specific)
        query = teamId === null
          ? query.is('team_id', null)
          : query.eq('team_id', teamId)
      }

      const { data, error } = await query

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching rules:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

export async function createRule(ruleData: CoachingRuleInsert) {
  return withSessionRetry(async () => {
    try {
      const { data, error } = await supabase
        .from('coaching_rules')
        .insert(ruleData)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating rule:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

export async function updateRule(ruleId: string, updates: CoachingRuleUpdate) {
  return withSessionRetry(async () => {
    try {
      const { data, error } = await supabase
        .from('coaching_rules')
        .update(updates)
        .eq('id', ruleId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating rule:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

export async function deleteRule(ruleId: string) {
  return withSessionRetry(async () => {
    try {
      const { error } = await supabase
        .from('coaching_rules')
        .delete()
        .eq('id', ruleId)

      if (error) throw error
      return { data: null, error: null }
    } catch (error) {
      console.error('Error deleting rule:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

export async function toggleRuleActive(ruleId: string, isActive: boolean) {
  return withSessionRetry(async () => {
    try {
      const { data, error } = await supabase
        .from('coaching_rules')
        .update({ is_active: isActive })
        .eq('id', ruleId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error toggling rule active status:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}