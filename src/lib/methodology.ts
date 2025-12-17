import { createClient } from '@/lib/supabase/client'
import type { Json } from '@/types/database'
import type {
  PlayingZone,
  PlayingMethodologyZones,
  ZoneState,
  PositionalProfileAttributes,
} from '@/types/database'
import { isPlayingMethodologyZonesV2, isPositionalProfileAttributesV2 } from '@/types/database'

const supabase = createClient()

// ========================================
// Types
// ========================================

export interface PlayingMethodology {
  id: string
  club_id: string
  team_id: string | null
  created_by_coach_id: string
  title: string
  description: string | null
  display_order: number | null
  is_active: boolean | null
  created_at: string
  updated_at: string
}

export interface TrainingMethodology {
  id: string
  club_id: string
  team_id: string | null
  created_by_coach_id: string
  title: string
  description: string | null
  display_order: number | null
  is_active: boolean | null
  created_at: string
  updated_at: string
}

export interface PositionalProfile {
  id: string
  club_id: string
  team_id: string | null
  position_key: string
  custom_position_name: string | null
  attributes: PositionalProfileAttributes | string[] | null // v2 object or v1 array for backwards compat
  is_active: boolean | null
  display_order: number | null
  created_at: string
  updated_at: string
}

// Re-export PositionalProfileAttributes for convenience
export type { PositionalProfileAttributes }

export interface SystemDefault {
  id: string
  category: string
  key: string
  value: {
    name: string
    abbreviation?: string
    description?: string
    is_advanced?: boolean
    parent_position?: string
    default_attributes?: string[]
  }
  display_order: number | null
  is_active: boolean | null
}

// ========================================
// Playing Methodology Operations
// ========================================

export async function getClubPlayingMethodology(
  clubId: string
): Promise<{ data: PlayingMethodology[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('playing_methodology')
    .select('*')
    .eq('club_id', clubId)
    .is('team_id', null)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching playing methodology:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function getTeamPlayingMethodology(
  clubId: string,
  teamId: string
): Promise<{ data: PlayingMethodology[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('playing_methodology')
    .select('*')
    .eq('club_id', clubId)
    .eq('team_id', teamId)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching team playing methodology:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function createPlayingMethodology(
  clubId: string,
  coachId: string,
  title: string,
  description: string,
  teamId: string | null = null
): Promise<{ data: PlayingMethodology | null; error: string | null }> {
  // Get the next display order
  let query = supabase
    .from('playing_methodology')
    .select('display_order')
    .eq('club_id', clubId)

  if (teamId === null) {
    query = query.is('team_id', null)
  } else {
    query = query.eq('team_id', teamId)
  }

  const { data: existing } = await query
    .order('display_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? (existing[0].display_order ?? 0) + 1 : 0

  const { data, error } = await supabase
    .from('playing_methodology')
    .insert({
      club_id: clubId,
      team_id: teamId,
      created_by_coach_id: coachId,
      title,
      description,
      display_order: nextOrder,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating playing methodology:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function updatePlayingMethodology(
  id: string,
  updates: { title?: string; description?: string; display_order?: number; is_active?: boolean }
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('playing_methodology')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating playing methodology:', error)
    return { error: error.message }
  }

  return { error: null }
}

export async function deletePlayingMethodology(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('playing_methodology')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting playing methodology:', error)
    return { error: error.message }
  }

  return { error: null }
}

// ========================================
// Training Methodology Operations
// ========================================

export async function getClubTrainingMethodology(
  clubId: string
): Promise<{ data: TrainingMethodology[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('training_methodology')
    .select('*')
    .eq('club_id', clubId)
    .is('team_id', null)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching training methodology:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function getTeamTrainingMethodology(
  clubId: string,
  teamId: string
): Promise<{ data: TrainingMethodology[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('training_methodology')
    .select('*')
    .eq('club_id', clubId)
    .eq('team_id', teamId)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching team training methodology:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function createTrainingMethodology(
  clubId: string,
  coachId: string,
  title: string,
  description: string,
  teamId: string | null = null
): Promise<{ data: TrainingMethodology | null; error: string | null }> {
  // Get the next display order
  let query = supabase
    .from('training_methodology')
    .select('display_order')
    .eq('club_id', clubId)

  if (teamId === null) {
    query = query.is('team_id', null)
  } else {
    query = query.eq('team_id', teamId)
  }

  const { data: existing } = await query
    .order('display_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? (existing[0].display_order ?? 0) + 1 : 0

  const { data, error } = await supabase
    .from('training_methodology')
    .insert({
      club_id: clubId,
      team_id: teamId,
      created_by_coach_id: coachId,
      title,
      description,
      display_order: nextOrder,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating training methodology:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function updateTrainingMethodology(
  id: string,
  updates: { title?: string; description?: string; display_order?: number; is_active?: boolean }
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('training_methodology')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating training methodology:', error)
    return { error: error.message }
  }

  return { error: null }
}

export async function deleteTrainingMethodology(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('training_methodology')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting training methodology:', error)
    return { error: error.message }
  }

  return { error: null }
}

// ========================================
// Positional Profiles Operations
// ========================================

export async function getClubPositionalProfiles(
  clubId: string
): Promise<{ data: PositionalProfile[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('positional_profiles')
    .select('*')
    .eq('club_id', clubId)
    .is('team_id', null)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching positional profiles:', error)
    return { data: null, error: error.message }
  }

  return { data: data as PositionalProfile[], error: null }
}

export async function createPositionalProfile(
  clubId: string,
  positionKey: string,
  attributes?: PositionalProfileAttributes | string[],
  teamId: string | null = null,
  customPositionName: string | null = null
): Promise<{ data: PositionalProfile | null; error: string | null }> {
  // Get the next display order
  let query = supabase
    .from('positional_profiles')
    .select('display_order')
    .eq('club_id', clubId)

  if (teamId === null) {
    query = query.is('team_id', null)
  } else {
    query = query.eq('team_id', teamId)
  }

  const { data: existing } = await query
    .order('display_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? (existing[0].display_order ?? 0) + 1 : 0

  // If no attributes provided, start with empty arrays
  let finalAttributes: PositionalProfileAttributes
  if (!attributes) {
    finalAttributes = {
      in_possession: [],
      out_of_possession: [],
    }
  } else if (Array.isArray(attributes)) {
    // Legacy v1 format - convert to v2
    finalAttributes = {
      in_possession: attributes.slice(0, 5),
      out_of_possession: [],
    }
  } else {
    finalAttributes = attributes
  }

  const { data, error } = await supabase
    .from('positional_profiles')
    .insert({
      club_id: clubId,
      team_id: teamId,
      position_key: positionKey,
      custom_position_name: customPositionName,
      attributes: finalAttributes as unknown as Json,
      display_order: nextOrder,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating positional profile:', error)
    return { data: null, error: error.message }
  }

  return { data: data as PositionalProfile, error: null }
}

export async function updatePositionalProfile(
  id: string,
  updates: { attributes?: PositionalProfileAttributes | string[]; is_active?: boolean; display_order?: number }
): Promise<{ error: string | null }> {
  // Normalize attributes to v2 format if provided
  const normalizedUpdates: { attributes?: Json; is_active?: boolean; display_order?: number } = {}

  if (updates.is_active !== undefined) {
    normalizedUpdates.is_active = updates.is_active
  }
  if (updates.display_order !== undefined) {
    normalizedUpdates.display_order = updates.display_order
  }
  if (updates.attributes !== undefined) {
    // Handle both v1 and v2 formats
    if (Array.isArray(updates.attributes)) {
      normalizedUpdates.attributes = {
        in_possession: updates.attributes.slice(0, 5),
        out_of_possession: [],
      } as unknown as Json
    } else {
      normalizedUpdates.attributes = updates.attributes as unknown as Json
    }
  }

  const { error } = await supabase
    .from('positional_profiles')
    .update(normalizedUpdates)
    .eq('id', id)

  if (error) {
    console.error('Error updating positional profile:', error)
    return { error: error.message }
  }

  return { error: null }
}

export async function deletePositionalProfile(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('positional_profiles')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting positional profile:', error)
    return { error: error.message }
  }

  return { error: null }
}

// ========================================
// System Defaults Operations
// ========================================

// Attribute category types
export type AttributeCategory =
  | 'attributes' // legacy
  | 'attributes_in_possession'
  | 'attributes_out_of_possession'
  | 'attributes_physical'
  | 'attributes_psychological'
  | 'position_attributes_in_possession'
  | 'position_attributes_out_of_possession'

export type SystemDefaultCategory =
  | 'positions'
  | 'equipment'
  | 'space_options'
  | AttributeCategory

export async function getSystemDefaults(
  category: SystemDefaultCategory
): Promise<{ data: SystemDefault[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('system_defaults')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching system defaults:', error)
    return { data: null, error: error.message }
  }

  return { data: data as unknown as SystemDefault[], error: null }
}

/**
 * Get all in-possession attributes (combines in_possession + physical + psychological)
 */
export async function getInPossessionAttributes(): Promise<{ data: SystemDefault[] | null; error: string | null }> {
  const [inPoss, physical, psychological] = await Promise.all([
    getSystemDefaults('attributes_in_possession'),
    getSystemDefaults('attributes_physical'),
    getSystemDefaults('attributes_psychological'),
  ])

  if (inPoss.error || physical.error || psychological.error) {
    return { data: null, error: inPoss.error || physical.error || psychological.error }
  }

  const combined = [
    ...(inPoss.data || []),
    ...(physical.data || []),
    ...(psychological.data || []),
  ]

  return { data: combined, error: null }
}

/**
 * Get all out-of-possession attributes (combines out_of_possession + physical + psychological)
 */
export async function getOutOfPossessionAttributes(): Promise<{ data: SystemDefault[] | null; error: string | null }> {
  const [outPoss, physical, psychological] = await Promise.all([
    getSystemDefaults('attributes_out_of_possession'),
    getSystemDefaults('attributes_physical'),
    getSystemDefaults('attributes_psychological'),
  ])

  if (outPoss.error || physical.error || psychological.error) {
    return { data: null, error: outPoss.error || physical.error || psychological.error }
  }

  const combined = [
    ...(outPoss.data || []),
    ...(physical.data || []),
    ...(psychological.data || []),
  ]

  return { data: combined, error: null }
}

/**
 * Get position-specific default attributes for a given position key
 */
export async function getPositionDefaultAttributes(
  positionKey: string
): Promise<{ inPossession: string[]; outOfPossession: string[] }> {
  const [inPossDefaults, outPossDefaults] = await Promise.all([
    getSystemDefaults('position_attributes_in_possession'),
    getSystemDefaults('position_attributes_out_of_possession'),
  ])

  let inPossession: string[] = []
  let outOfPossession: string[] = []

  // Find position-specific defaults
  // The value type is dynamic - position_attributes_* have { position, attributes } structure
  const inPossMatch = inPossDefaults.data?.find(d => d.key === positionKey)
  const inPossValue = inPossMatch?.value as { position?: string; attributes?: string[] } | undefined
  if (inPossValue?.attributes) {
    inPossession = inPossValue.attributes.slice(0, 5)
  }

  const outPossMatch = outPossDefaults.data?.find(d => d.key === positionKey)
  const outPossValue = outPossMatch?.value as { position?: string; attributes?: string[] } | undefined
  if (outPossValue?.attributes) {
    outOfPossession = outPossValue.attributes.slice(0, 5)
  }

  return { inPossession, outOfPossession }
}

/**
 * Helper to normalize profile attributes to v2 format
 * Handles backwards compatibility with v1 string[] format
 */
export function normalizeProfileAttributes(
  attrs: PositionalProfileAttributes | string[] | null | undefined
): PositionalProfileAttributes {
  if (!attrs) {
    return { in_possession: [], out_of_possession: [] }
  }

  // Already v2 format
  if (isPositionalProfileAttributesV2(attrs)) {
    return attrs
  }

  // v1 format (string array) - migrate to in_possession only
  if (Array.isArray(attrs)) {
    return {
      in_possession: attrs.slice(0, 5),
      out_of_possession: [],
    }
  }

  return { in_possession: [], out_of_possession: [] }
}

// ========================================
// Realtime Subscriptions
// ========================================

export function subscribeToPlayingMethodology(
  clubId: string,
  teamId: string | null,
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel(`playing_methodology_${clubId}_${teamId || 'club'}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'playing_methodology',
        filter: teamId
          ? `club_id=eq.${clubId},team_id=eq.${teamId}`
          : `club_id=eq.${clubId}`,
      },
      callback
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export function subscribeToTrainingMethodology(
  clubId: string,
  teamId: string | null,
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel(`training_methodology_${clubId}_${teamId || 'club'}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'training_methodology',
        filter: teamId
          ? `club_id=eq.${clubId},team_id=eq.${teamId}`
          : `club_id=eq.${clubId}`,
      },
      callback
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export function subscribeToPositionalProfiles(
  clubId: string,
  teamId: string | null,
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel(`positional_profiles_${clubId}_${teamId || 'club'}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'positional_profiles',
        filter: teamId
          ? `club_id=eq.${clubId},team_id=eq.${teamId}`
          : `club_id=eq.${clubId}`,
      },
      callback
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// ========================================
// Playing Methodology Zones Operations (v2)
// ========================================

// Re-export types from database.ts for convenience
export type { PlayingZone, PlayingMethodologyZones, ZoneState }

// Legacy PitchZone type for backwards compatibility (deprecated)
export interface PitchZone {
  id: string
  x: number
  y: number
  width: number
  height: number
  title: string
  description: string
  color?: string
}

// Extended type with zones (v2)
export interface PlayingMethodologyWithZones extends PlayingMethodology {
  zones?: PlayingMethodologyZones | null
}

// ========================================
// Zone Default Names and Helpers
// ========================================

const DEFAULT_ZONE_NAMES_3: Array<{ name: string }> = [
  { name: 'Defensive Third' },
  { name: 'Middle Third' },
  { name: 'Attacking Third' },
]

const DEFAULT_ZONE_NAMES_4: Array<{ name: string }> = [
  { name: 'Defensive Quarter' },
  { name: 'Defensive-Mid Quarter' },
  { name: 'Attacking-Mid Quarter' },
  { name: 'Attacking Quarter' },
]

/**
 * Create default zones structure for a given zone count
 */
export function createDefaultZones(zoneCount: 3 | 4): PlayingMethodologyZones {
  const defaults = zoneCount === 3 ? DEFAULT_ZONE_NAMES_3 : DEFAULT_ZONE_NAMES_4

  const zones: PlayingZone[] = defaults.map((zone, index) => ({
    id: `zone-${index + 1}`,
    order: index + 1,
    name: zone.name,
    in_possession: {
      name: '',
      details: '',
    },
    out_of_possession: {
      name: '',
      details: '',
    },
  }))

  return {
    zone_count: zoneCount,
    zones,
  }
}

/**
 * Check if zones data is in the legacy (v1) format
 */
export function isLegacyZonesFormat(zones: unknown): zones is PitchZone[] {
  if (!Array.isArray(zones)) return false
  if (zones.length === 0) return false
  const first = zones[0]
  return (
    typeof first === 'object' &&
    first !== null &&
    'x' in first &&
    'y' in first &&
    'width' in first &&
    'height' in first
  )
}

// Get pitch zones for a club (v2 format)
export async function getClubPlayingMethodologyZones(
  clubId: string
): Promise<{ data: PlayingMethodologyZones | null; error: string | null }> {
  // Get the first club-level record that has zones
  const { data, error } = await supabase
    .from('playing_methodology')
    .select('zones')
    .eq('club_id', clubId)
    .is('team_id', null)
    .not('zones', 'is', null)
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "no rows returned" - that's OK, it means no zones yet
    console.error('Error fetching zones:', error)
    return { data: null, error: error.message }
  }

  if (!data || !data.zones) {
    return { data: null, error: null }
  }

  // Check if it's in v2 format
  if (isPlayingMethodologyZonesV2(data.zones)) {
    return { data: data.zones, error: null }
  }

  // Legacy format or invalid - treat as no zones
  return { data: null, error: null }
}

// Legacy function - deprecated, use getClubPlayingMethodologyZones
export async function getPlayingMethodologyWithZones(
  clubId: string
): Promise<{ data: { zones: PitchZone[] } | null; error: string | null }> {
  // Get the first club-level record that has zones
  const { data, error } = await supabase
    .from('playing_methodology')
    .select('zones')
    .eq('club_id', clubId)
    .is('team_id', null)
    .not('zones', 'is', null)
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching zones:', error)
    return { data: null, error: error.message }
  }

  if (!data || !data.zones) {
    return { data: { zones: [] }, error: null }
  }

  // Only return if legacy format
  if (isLegacyZonesFormat(data.zones)) {
    return { data: { zones: data.zones }, error: null }
  }

  return { data: { zones: [] }, error: null }
}

// Save pitch zones for a club (v2 format)
export async function saveClubPlayingMethodologyZones(
  clubId: string,
  coachId: string,
  zones: PlayingMethodologyZones
): Promise<{ error: string | null }> {
  // First, check if any record exists for this club
  const { data: existing } = await supabase
    .from('playing_methodology')
    .select('id')
    .eq('club_id', clubId)
    .is('team_id', null)
    .limit(1)
    .single()

  if (existing) {
    // Update existing record's zones
    const { error } = await supabase
      .from('playing_methodology')
      .update({ zones: zones as unknown as Json })
      .eq('id', existing.id)

    if (error) {
      console.error('Error updating zones:', error)
      return { error: error.message }
    }
  } else {
    // Create a new record with zones
    const { error } = await supabase
      .from('playing_methodology')
      .insert({
        club_id: clubId,
        team_id: null,
        created_by_coach_id: coachId,
        title: 'Playing Methodology',
        description: 'Club playing methodology with pitch zones',
        zones: zones as unknown as Json,
        display_order: 0,
        is_active: true,
      })

    if (error) {
      console.error('Error creating zones record:', error)
      return { error: error.message }
    }
  }

  return { error: null }
}

// Legacy function - deprecated, use saveClubPlayingMethodologyZones
export async function savePlayingMethodologyZones(
  clubId: string,
  coachId: string,
  zones: PitchZone[]
): Promise<{ error: string | null }> {
  // First, check if any record with zones exists for this club
  const { data: existing } = await supabase
    .from('playing_methodology')
    .select('id')
    .eq('club_id', clubId)
    .is('team_id', null)
    .not('zones', 'is', null)
    .limit(1)
    .single()

  if (existing) {
    // Update existing record's zones
    const { error } = await supabase
      .from('playing_methodology')
      .update({ zones: zones as unknown as Json })
      .eq('id', existing.id)

    if (error) {
      console.error('Error updating zones:', error)
      return { error: error.message }
    }
  } else {
    // Check if there's any club-level record we can add zones to
    const { data: anyRecord } = await supabase
      .from('playing_methodology')
      .select('id')
      .eq('club_id', clubId)
      .is('team_id', null)
      .limit(1)
      .single()

    if (anyRecord) {
      // Add zones to existing record
      const { error } = await supabase
        .from('playing_methodology')
        .update({ zones: zones as unknown as Json })
        .eq('id', anyRecord.id)

      if (error) {
        console.error('Error adding zones to record:', error)
        return { error: error.message }
      }
    } else {
      // Create a new record with zones
      const { error } = await supabase
        .from('playing_methodology')
        .insert({
          club_id: clubId,
          team_id: null,
          created_by_coach_id: coachId,
          title: 'Playing Methodology',
          description: 'Club playing methodology with pitch zones',
          zones: zones as unknown as Json,
          display_order: 0,
          is_active: true,
        })

      if (error) {
        console.error('Error creating zones record:', error)
        return { error: error.message }
      }
    }
  }

  return { error: null }
}

// ========================================
// Team Training Rule Toggle Operations
// ========================================

export interface TrainingRuleToggle {
  id: string
  team_id: string
  training_rule_id: string
  is_enabled: boolean
  created_at: string
  updated_at: string
}

export async function getTeamTrainingRuleToggles(
  teamId: string
): Promise<{ data: TrainingRuleToggle[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('team_training_rule_toggles')
    .select('*')
    .eq('team_id', teamId)

  if (error) {
    console.error('Error fetching training rule toggles:', error)
    return { data: null, error: error.message }
  }

  return { data: data as TrainingRuleToggle[], error: null }
}

export async function toggleClubTrainingRule(
  teamId: string,
  trainingRuleId: string,
  isEnabled: boolean
): Promise<{ error: string | null }> {
  // Upsert: insert if not exists, update if exists
  const { error } = await supabase
    .from('team_training_rule_toggles')
    .upsert(
      {
        team_id: teamId,
        training_rule_id: trainingRuleId,
        is_enabled: isEnabled,
      },
      {
        onConflict: 'team_id,training_rule_id',
      }
    )

  if (error) {
    console.error('Error toggling training rule:', error)
    return { error: error.message }
  }

  return { error: null }
}

// ========================================
// Team Playing Methodology (Zones) Operations
// ========================================

// Get team zones (v2 format)
export async function getTeamPlayingMethodologyZones(
  clubId: string,
  teamId: string
): Promise<{ data: PlayingMethodologyZones | null; error: string | null }> {
  const { data, error } = await supabase
    .from('playing_methodology')
    .select('zones')
    .eq('club_id', clubId)
    .eq('team_id', teamId)
    .not('zones', 'is', null)
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching team zones:', error)
    return { data: null, error: error.message }
  }

  if (!data || !data.zones) {
    return { data: null, error: null }
  }

  // Check if it's in v2 format
  if (isPlayingMethodologyZonesV2(data.zones)) {
    return { data: data.zones, error: null }
  }

  // Legacy format or invalid - treat as no zones
  return { data: null, error: null }
}

// Save team zones (v2 format)
export async function saveTeamPlayingMethodologyZonesV2(
  clubId: string,
  teamId: string,
  coachId: string,
  zones: PlayingMethodologyZones
): Promise<{ error: string | null }> {
  // Check if team record exists
  const { data: existing } = await supabase
    .from('playing_methodology')
    .select('id')
    .eq('club_id', clubId)
    .eq('team_id', teamId)
    .limit(1)
    .single()

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from('playing_methodology')
      .update({ zones: zones as unknown as Json })
      .eq('id', existing.id)

    if (error) {
      console.error('Error updating team zones:', error)
      return { error: error.message }
    }
  } else {
    // Create new team record
    const { error } = await supabase
      .from('playing_methodology')
      .insert({
        club_id: clubId,
        team_id: teamId,
        created_by_coach_id: coachId,
        title: 'Playing Methodology',
        description: 'Team playing methodology',
        zones: zones as unknown as Json,
        display_order: 0,
        is_active: true,
      })

    if (error) {
      console.error('Error creating team zones:', error)
      return { error: error.message }
    }
  }

  return { error: null }
}

// Legacy function - deprecated
export async function getTeamPlayingMethodologyWithZones(
  clubId: string,
  teamId: string
): Promise<{ data: { zones: PitchZone[] } | null; error: string | null }> {
  const { data, error } = await supabase
    .from('playing_methodology')
    .select('zones')
    .eq('club_id', clubId)
    .eq('team_id', teamId)
    .not('zones', 'is', null)
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching team zones:', error)
    return { data: null, error: error.message }
  }

  if (!data || !data.zones) {
    return { data: { zones: [] }, error: null }
  }

  // Only return if legacy format
  if (isLegacyZonesFormat(data.zones)) {
    return { data: { zones: data.zones }, error: null }
  }

  return { data: { zones: [] }, error: null }
}

// Legacy function - deprecated
export async function saveTeamPlayingMethodologyZones(
  clubId: string,
  teamId: string,
  coachId: string,
  zones: PitchZone[]
): Promise<{ error: string | null }> {
  // Check if team record exists
  const { data: existing } = await supabase
    .from('playing_methodology')
    .select('id')
    .eq('club_id', clubId)
    .eq('team_id', teamId)
    .limit(1)
    .single()

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from('playing_methodology')
      .update({ zones: zones as unknown as Json })
      .eq('id', existing.id)

    if (error) {
      console.error('Error updating team zones:', error)
      return { error: error.message }
    }
  } else {
    // Create new team record
    const { error } = await supabase
      .from('playing_methodology')
      .insert({
        club_id: clubId,
        team_id: teamId,
        created_by_coach_id: coachId,
        title: 'Playing Methodology',
        description: 'Team playing methodology',
        zones: zones as unknown as Json,
        display_order: 0,
        is_active: true,
      })

    if (error) {
      console.error('Error creating team zones:', error)
      return { error: error.message }
    }
  }

  return { error: null }
}

// ========================================
// Team Positional Profiles Operations
// ========================================

export async function getTeamPositionalProfiles(
  clubId: string,
  teamId: string
): Promise<{ data: PositionalProfile[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('positional_profiles')
    .select('*')
    .eq('club_id', clubId)
    .eq('team_id', teamId)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching team positional profiles:', error)
    return { data: null, error: error.message }
  }

  return { data: data as PositionalProfile[], error: null }
}

export async function createTeamPositionalProfile(
  clubId: string,
  teamId: string,
  positionKey: string,
  attributes?: PositionalProfileAttributes | string[],
  customPositionName: string | null = null
): Promise<{ data: PositionalProfile | null; error: string | null }> {
  // Get the next display order for this team
  const { data: existing } = await supabase
    .from('positional_profiles')
    .select('display_order')
    .eq('club_id', clubId)
    .eq('team_id', teamId)
    .order('display_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? (existing[0].display_order ?? 0) + 1 : 0

  // If no attributes provided, start with empty arrays
  let finalAttributes: PositionalProfileAttributes
  if (!attributes) {
    finalAttributes = {
      in_possession: [],
      out_of_possession: [],
    }
  } else if (Array.isArray(attributes)) {
    // Legacy v1 format - convert to v2
    finalAttributes = {
      in_possession: attributes.slice(0, 5),
      out_of_possession: [],
    }
  } else {
    finalAttributes = attributes
  }

  const { data, error } = await supabase
    .from('positional_profiles')
    .insert({
      club_id: clubId,
      team_id: teamId,
      position_key: positionKey,
      custom_position_name: customPositionName,
      attributes: finalAttributes as unknown as Json,
      display_order: nextOrder,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating team positional profile:', error)
    return { data: null, error: error.message }
  }

  return { data: data as PositionalProfile, error: null }
}

// ========================================
// Revert Operations (RPC calls)
// ========================================

export async function revertTeamPlayingMethodology(
  teamId: string,
  clubId: string
): Promise<{ error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('revert_team_playing_methodology', {
    p_team_id: teamId,
    p_club_id: clubId,
  })

  if (error) {
    console.error('Error reverting playing methodology:', error)
    return { error: error.message }
  }

  return { error: null }
}

export async function revertTeamPositionalProfiles(
  teamId: string,
  clubId: string
): Promise<{ error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('revert_team_positional_profiles', {
    p_team_id: teamId,
    p_club_id: clubId,
  })

  if (error) {
    console.error('Error reverting positional profiles:', error)
    return { error: error.message }
  }

  return { error: null }
}

// ========================================
// Copy Methodology on Team Creation (RPC call)
// ========================================

export async function copyClubMethodologyToTeam(
  teamId: string,
  clubId: string,
  coachId: string
): Promise<{ error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('copy_club_methodology_to_team', {
    p_team_id: teamId,
    p_club_id: clubId,
    p_coach_id: coachId,
  })

  if (error) {
    console.error('Error copying methodology to team:', error)
    return { error: error.message }
  }

  return { error: null }
}
