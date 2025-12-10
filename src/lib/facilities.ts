import { createClient } from '@/lib/supabase/client'
import type { TeamFacility, TeamFacilityInsert, TeamFacilityUpdate, SystemDefault } from '@/types/database'

const supabase = createClient()

// Equipment item type for the JSONB array
export interface EquipmentItem {
  type: string
  quantity: number
}

/**
 * Get facilities for a team
 */
export async function getTeamFacilities(teamId: string) {
  try {
    const { data, error } = await supabase
      .from('team_facilities')
      .select('*')
      .eq('team_id', teamId)
      .single()

    if (error) {
      // If no record exists, that's not an error - just return null
      if (error.code === 'PGRST116') {
        return { data: null, error: null }
      }
      console.error('Error fetching team facilities:', error)
      return { data: null, error }
    }

    return { data: data as TeamFacility, error: null }
  } catch (error) {
    console.error('Error fetching team facilities:', error)
    return { data: null, error }
  }
}

/**
 * Create or update team facilities (upsert since team_id is unique)
 */
export async function saveTeamFacilities(
  teamId: string,
  facilities: {
    space_type?: string | null
    custom_space?: string | null
    equipment?: EquipmentItem[] | null
    other_factors?: string | null
  }
) {
  try {
    // First check if a record exists
    const { data: existing } = await supabase
      .from('team_facilities')
      .select('id')
      .eq('team_id', teamId)
      .single()

    if (existing) {
      // Update existing record
      const updateData: TeamFacilityUpdate = {
        space_type: facilities.space_type,
        custom_space: facilities.custom_space,
        equipment: facilities.equipment as any,
        other_factors: facilities.other_factors,
      }

      const { data, error } = await supabase
        .from('team_facilities')
        .update(updateData)
        .eq('team_id', teamId)
        .select()
        .single()

      if (error) {
        console.error('Error updating team facilities:', error)
        return { data: null, error }
      }

      return { data: data as TeamFacility, error: null }
    } else {
      // Insert new record
      const insertData: TeamFacilityInsert = {
        team_id: teamId,
        space_type: facilities.space_type,
        custom_space: facilities.custom_space,
        equipment: facilities.equipment as any,
        other_factors: facilities.other_factors,
      }

      const { data, error } = await supabase
        .from('team_facilities')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Error creating team facilities:', error)
        return { data: null, error }
      }

      return { data: data as TeamFacility, error: null }
    }
  } catch (error) {
    console.error('Error saving team facilities:', error)
    return { data: null, error }
  }
}

/**
 * Get space options from system defaults
 */
export async function getSpaceOptions() {
  try {
    const { data, error } = await supabase
      .from('system_defaults')
      .select('*')
      .eq('category', 'space_options')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching space options:', error)
      return { data: null, error }
    }

    return { data: data as SystemDefault[], error: null }
  } catch (error) {
    console.error('Error fetching space options:', error)
    return { data: null, error }
  }
}

/**
 * Get equipment options from system defaults
 */
export async function getEquipmentOptions() {
  try {
    const { data, error } = await supabase
      .from('system_defaults')
      .select('*')
      .eq('category', 'equipment')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching equipment options:', error)
      return { data: null, error }
    }

    return { data: data as SystemDefault[], error: null }
  } catch (error) {
    console.error('Error fetching equipment options:', error)
    return { data: null, error }
  }
}

/**
 * Subscribe to realtime facility changes for a team
 */
export function subscribeToFacilities(
  teamId: string,
  onUpdate: () => void
) {
  const channel = supabase
    .channel(`facilities-${teamId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'team_facilities',
        filter: `team_id=eq.${teamId}`,
      },
      () => {
        onUpdate()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
