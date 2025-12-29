import { createClient } from '@/lib/supabase/client'
import type { Json } from '@/types/database'
import type {
  GameZone,
  GameModelZones,
  ZoneState,
  ZoneBlock,
  PositionalProfileAttributes,
  MatchFormat,
  TrainingSyllabus,
  SyllabusWeek,
  SyllabusDay,
} from '@/types/database'
import { isGameModelZonesV2, isPositionalProfileAttributesV2, isTrainingSyllabus, isZoneBlockArray } from '@/types/database'

const supabase = createClient()

// ========================================
// Types
// ========================================

export interface GameModel {
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
  syllabus?: TrainingSyllabus | null  // Optional for backwards compatibility
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
// Game Model Operations
// ========================================

export async function getClubGameModel(
  clubId: string
): Promise<{ data: GameModel[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('game_model')
    .select('*')
    .eq('club_id', clubId)
    .is('team_id', null)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching game model:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function getTeamGameModel(
  clubId: string,
  teamId: string
): Promise<{ data: GameModel[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('game_model')
    .select('*')
    .eq('club_id', clubId)
    .eq('team_id', teamId)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching team game model:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function createGameModel(
  clubId: string,
  coachId: string,
  title: string,
  description: string,
  teamId: string | null = null
): Promise<{ data: GameModel | null; error: string | null }> {
  // Get the next display order
  let query = supabase
    .from('game_model')
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
    .from('game_model')
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
    console.error('Error creating game model:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function updateGameModel(
  id: string,
  updates: { title?: string; description?: string; display_order?: number; is_active?: boolean }
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('game_model')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating game model:', error)
    return { error: error.message }
  }

  return { error: null }
}

export async function deleteGameModel(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('game_model')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting game model:', error)
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

export function subscribeToGameModel(
  clubId: string,
  teamId: string | null,
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel(`game_model_${clubId}_${teamId || 'club'}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_model',
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
// Game Model Zones Operations (v2)
// ========================================

// Re-export types from database.ts for convenience
export type { GameZone, GameModelZones, ZoneState, ZoneBlock, MatchFormat }

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
export interface GameModelWithZones extends GameModel {
  zones?: GameModelZones | null
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
 * v3: Uses empty arrays for in_possession and out_of_possession
 */
export function createDefaultZones(zoneCount: 3 | 4): GameModelZones {
  const defaults = zoneCount === 3 ? DEFAULT_ZONE_NAMES_3 : DEFAULT_ZONE_NAMES_4

  const zones: GameZone[] = defaults.map((zone, index) => ({
    id: `zone-${index + 1}`,
    order: index + 1,
    name: zone.name,
    in_possession: [],      // v3: Empty array of ZoneBlocks
    out_of_possession: [],  // v3: Empty array of ZoneBlocks
  }))

  return {
    zone_count: zoneCount,
    zones,
    match_format: '11v11',
  }
}

/**
 * Migrate a single zone from v2 (single ZoneState) to v3 (array of ZoneBlocks)
 * Handles both formats gracefully
 */
function migrateZonePossession(
  zoneId: string,
  possession: ZoneState | ZoneBlock[] | unknown,
  blockType: 'in' | 'out'
): ZoneBlock[] {
  // Already v3 format (array)
  if (isZoneBlockArray(possession)) {
    return possession
  }

  // v2 format (single object with name/details)
  const state = possession as ZoneState
  if (state && typeof state === 'object' && 'name' in state && 'details' in state) {
    // Only create a block if there's actual content
    if (state.name.trim() !== '' || state.details.trim() !== '') {
      return [
        {
          id: `${zoneId}-${blockType}-1`,
          name: state.name,
          details: state.details,
        },
      ]
    }
  }

  // Empty or invalid - return empty array
  return []
}

/**
 * Migrate entire GameModelZones from v2 to v3 format
 * Returns migrated data and a flag indicating if migration occurred
 */
export function migrateGameModelZonesToV3(zones: GameModelZones): { data: GameModelZones; migrated: boolean } {
  let migrated = false

  const migratedZones: GameZone[] = zones.zones.map((zone) => {
    const inPossessionIsArray = isZoneBlockArray(zone.in_possession)
    const outPossessionIsArray = isZoneBlockArray(zone.out_of_possession)

    if (!inPossessionIsArray || !outPossessionIsArray) {
      migrated = true
    }

    return {
      ...zone,
      in_possession: migrateZonePossession(zone.id, zone.in_possession, 'in'),
      out_of_possession: migrateZonePossession(zone.id, zone.out_of_possession, 'out'),
    }
  })

  return {
    data: {
      ...zones,
      zones: migratedZones,
    },
    migrated,
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

// Get pitch zones for a club (v2/v3 format with auto-migration)
export async function getClubGameModelZones(
  clubId: string
): Promise<{ data: GameModelZones | null; error: string | null }> {
  // Get the first club-level record that has zones
  const { data, error } = await supabase
    .from('game_model')
    .select('id, zones')
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

  // Check if it's in v2+ format
  if (isGameModelZonesV2(data.zones)) {
    // Migrate to v3 if needed (converts single objects to arrays)
    const { data: migratedZones, migrated } = migrateGameModelZonesToV3(data.zones)

    // If migration occurred, save the migrated data
    if (migrated && data.id) {
      await supabase
        .from('game_model')
        .update({ zones: migratedZones as unknown as Json })
        .eq('id', data.id)
    }

    return { data: migratedZones, error: null }
  }

  // Legacy v1 format or invalid - treat as no zones
  return { data: null, error: null }
}

// Legacy function - deprecated, use getClubGameModelZones
export async function getGameModelWithZones(
  clubId: string
): Promise<{ data: { zones: PitchZone[] } | null; error: string | null }> {
  // Get the first club-level record that has zones
  const { data, error } = await supabase
    .from('game_model')
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
export async function saveClubGameModelZones(
  clubId: string,
  coachId: string,
  zones: GameModelZones
): Promise<{ error: string | null }> {
  // First, check if any record exists for this club
  const { data: existing } = await supabase
    .from('game_model')
    .select('id')
    .eq('club_id', clubId)
    .is('team_id', null)
    .limit(1)
    .single()

  if (existing) {
    // Update existing record's zones
    const { error } = await supabase
      .from('game_model')
      .update({ zones: zones as unknown as Json })
      .eq('id', existing.id)

    if (error) {
      console.error('Error updating zones:', error)
      return { error: error.message }
    }
  } else {
    // Create a new record with zones
    const { error } = await supabase
      .from('game_model')
      .insert({
        club_id: clubId,
        team_id: null,
        created_by_coach_id: coachId,
        title: 'Game Model',
        description: 'Club game model with pitch zones',
        zones: zones as unknown as Json,
        display_order: 0,
        is_active: true,
      })

    if (error) {
      console.error('Error creating zones record:', error)
      return { error: error.message }
    }
  }

  // Clean orphaned syllabus entries that reference deleted zones or blocks
  const validZoneIds = zones.zones.map((z) => z.id)
  const validBlockIds = zones.zones.flatMap((z) => [
    ...z.in_possession.map((b) => b.id),
    ...z.out_of_possession.map((b) => b.id),
  ])
  await cleanOrphanedSyllabusEntries(clubId, validZoneIds, validBlockIds)

  return { error: null }
}

// Legacy function - deprecated, use saveClubGameModelZones
export async function saveGameModelZones(
  clubId: string,
  coachId: string,
  zones: PitchZone[]
): Promise<{ error: string | null }> {
  // First, check if any record with zones exists for this club
  const { data: existing } = await supabase
    .from('game_model')
    .select('id')
    .eq('club_id', clubId)
    .is('team_id', null)
    .not('zones', 'is', null)
    .limit(1)
    .single()

  if (existing) {
    // Update existing record's zones
    const { error } = await supabase
      .from('game_model')
      .update({ zones: zones as unknown as Json })
      .eq('id', existing.id)

    if (error) {
      console.error('Error updating zones:', error)
      return { error: error.message }
    }
  } else {
    // Check if there's any club-level record we can add zones to
    const { data: anyRecord } = await supabase
      .from('game_model')
      .select('id')
      .eq('club_id', clubId)
      .is('team_id', null)
      .limit(1)
      .single()

    if (anyRecord) {
      // Add zones to existing record
      const { error } = await supabase
        .from('game_model')
        .update({ zones: zones as unknown as Json })
        .eq('id', anyRecord.id)

      if (error) {
        console.error('Error adding zones to record:', error)
        return { error: error.message }
      }
    } else {
      // Create a new record with zones
      const { error } = await supabase
        .from('game_model')
        .insert({
          club_id: clubId,
          team_id: null,
          created_by_coach_id: coachId,
          title: 'Game Model',
          description: 'Club game model with pitch zones',
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
// Training Syllabus Operations
// ========================================

// Re-export syllabus types for convenience
export type { TrainingSyllabus, SyllabusWeek, SyllabusDay } from '@/types/database'

/**
 * Creates a default empty syllabus with 1 week
 */
export function createDefaultSyllabus(): TrainingSyllabus {
  const emptyDays: SyllabusDay[] = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek: dayOfWeek as SyllabusDay['dayOfWeek'],
    theme: null,
    comments: null,
  }))

  return {
    weeks: [
      {
        id: crypto.randomUUID(),
        order: 1,
        days: emptyDays,
      },
    ],
  }
}

/**
 * Get club-level training syllabus
 */
export async function getClubTrainingSyllabus(
  clubId: string
): Promise<{ data: TrainingSyllabus | null; error: string | null }> {
  // Use * select and cast since the syllabus column isn't in generated types yet
  const { data, error } = await supabase
    .from('training_methodology')
    .select('*')
    .eq('club_id', clubId)
    .is('team_id', null)
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching club syllabus:', error)
    return { data: null, error: error.message }
  }

  // Cast to access syllabus field
  const record = data as TrainingMethodology | null
  if (!record?.syllabus || !isTrainingSyllabus(record.syllabus)) {
    return { data: null, error: null }
  }

  return { data: record.syllabus, error: null }
}

/**
 * Get team-level training syllabus
 */
export async function getTeamTrainingSyllabus(
  clubId: string,
  teamId: string
): Promise<{ data: TrainingSyllabus | null; error: string | null }> {
  // Use * select and cast since the syllabus column isn't in generated types yet
  const { data, error } = await supabase
    .from('training_methodology')
    .select('*')
    .eq('club_id', clubId)
    .eq('team_id', teamId)
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching team syllabus:', error)
    return { data: null, error: error.message }
  }

  // Cast to access syllabus field
  const record = data as TrainingMethodology | null
  if (!record?.syllabus || !isTrainingSyllabus(record.syllabus)) {
    return { data: null, error: null }
  }

  return { data: record.syllabus, error: null }
}

/**
 * Save club-level training syllabus
 */
export async function saveClubTrainingSyllabus(
  clubId: string,
  coachId: string,
  syllabus: TrainingSyllabus
): Promise<{ error: string | null }> {
  // Check if record exists
  const { data: existing } = await supabase
    .from('training_methodology')
    .select('id')
    .eq('club_id', clubId)
    .is('team_id', null)
    .limit(1)
    .single()

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('training_methodology') as any)
      .update({ syllabus })
      .eq('id', existing.id)

    if (error) {
      console.error('Error updating club syllabus:', error)
      return { error: error.message }
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('training_methodology') as any).insert({
      club_id: clubId,
      team_id: null,
      created_by_coach_id: coachId,
      title: 'Training Syllabus',
      syllabus,
      display_order: 0,
      is_active: true,
    })

    if (error) {
      console.error('Error creating club syllabus:', error)
      return { error: error.message }
    }
  }

  return { error: null }
}

/**
 * Save team-level training syllabus
 */
export async function saveTeamTrainingSyllabus(
  clubId: string,
  teamId: string,
  coachId: string,
  syllabus: TrainingSyllabus
): Promise<{ error: string | null }> {
  // Check if record exists
  const { data: existing } = await supabase
    .from('training_methodology')
    .select('id')
    .eq('club_id', clubId)
    .eq('team_id', teamId)
    .limit(1)
    .single()

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('training_methodology') as any)
      .update({ syllabus })
      .eq('id', existing.id)

    if (error) {
      console.error('Error updating team syllabus:', error)
      return { error: error.message }
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('training_methodology') as any).insert({
      club_id: clubId,
      team_id: teamId,
      created_by_coach_id: coachId,
      title: 'Training Syllabus',
      syllabus,
      display_order: 0,
      is_active: true,
    })

    if (error) {
      console.error('Error creating team syllabus:', error)
      return { error: error.message }
    }
  }

  return { error: null }
}

/**
 * Revert team syllabus to club version
 */
export async function revertTeamTrainingSyllabus(
  teamId: string,
  clubId: string
): Promise<{ error: string | null }> {
  const { error } = await (supabase.rpc as any)('revert_team_training_syllabus', {
    p_team_id: teamId,
    p_club_id: clubId,
  })

  if (error) {
    console.error('Error reverting team syllabus:', error)
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Clean orphaned syllabus entries when Game Model zones change
 * Removes theme selections that reference deleted zones or blocks
 * @param clubId - The club ID
 * @param zones - The current zones with valid block IDs
 */
export async function cleanOrphanedSyllabusEntries(
  clubId: string,
  validZoneIds: string[],
  validBlockIds?: string[]
): Promise<{ error: string | null }> {
  // Get all syllabi for this club (club-level and all team-level)
  const { data: methodologyRecords, error: fetchError } = await supabase
    .from('training_methodology')
    .select('*')
    .eq('club_id', clubId)

  if (fetchError) {
    console.error('Error fetching syllabi for cleanup:', fetchError)
    return { error: fetchError.message }
  }

  if (!methodologyRecords || methodologyRecords.length === 0) {
    return { error: null }
  }

  // Process each record
  for (const record of methodologyRecords) {
    const typedRecord = record as TrainingMethodology
    if (!typedRecord.syllabus || !isTrainingSyllabus(typedRecord.syllabus)) {
      continue
    }

    let hasChanges = false
    const updatedSyllabus: TrainingSyllabus = {
      weeks: typedRecord.syllabus.weeks.map((week) => ({
        ...week,
        days: week.days.map((day) => {
          // If day has a theme referencing a deleted zone, clear it
          if (day.theme && !validZoneIds.includes(day.theme.zoneId)) {
            hasChanges = true
            return { ...day, theme: null }
          }
          // If day has a theme referencing a deleted block, clear it
          if (day.theme && validBlockIds && day.theme.blockId && !validBlockIds.includes(day.theme.blockId)) {
            hasChanges = true
            return { ...day, theme: null }
          }
          return day
        }),
      })),
    }

    if (hasChanges) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase.from('training_methodology') as any)
        .update({ syllabus: updatedSyllabus })
        .eq('id', record.id)

      if (updateError) {
        console.error('Error cleaning orphaned syllabus entries:', updateError)
        // Continue processing other records even if one fails
      }
    }
  }

  return { error: null }
}

// ========================================
// Team Game Model (Zones) Operations
// ========================================

// Get team zones (v2/v3 format with auto-migration)
export async function getTeamGameModelZones(
  clubId: string,
  teamId: string
): Promise<{ data: GameModelZones | null; error: string | null }> {
  const { data, error } = await supabase
    .from('game_model')
    .select('id, zones')
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

  // Check if it's in v2+ format
  if (isGameModelZonesV2(data.zones)) {
    // Migrate to v3 if needed (converts single objects to arrays)
    const { data: migratedZones, migrated } = migrateGameModelZonesToV3(data.zones)

    // If migration occurred, save the migrated data
    if (migrated && data.id) {
      await supabase
        .from('game_model')
        .update({ zones: migratedZones as unknown as Json })
        .eq('id', data.id)
    }

    return { data: migratedZones, error: null }
  }

  // Legacy v1 format or invalid - treat as no zones
  return { data: null, error: null }
}

// Save team zones (v2 format)
export async function saveTeamGameModelZonesV2(
  clubId: string,
  teamId: string,
  coachId: string,
  zones: GameModelZones
): Promise<{ error: string | null }> {
  // Check if team record exists
  const { data: existing } = await supabase
    .from('game_model')
    .select('id')
    .eq('club_id', clubId)
    .eq('team_id', teamId)
    .limit(1)
    .single()

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from('game_model')
      .update({ zones: zones as unknown as Json })
      .eq('id', existing.id)

    if (error) {
      console.error('Error updating team zones:', error)
      return { error: error.message }
    }
  } else {
    // Create new team record
    const { error } = await supabase
      .from('game_model')
      .insert({
        club_id: clubId,
        team_id: teamId,
        created_by_coach_id: coachId,
        title: 'Game Model',
        description: 'Team game model',
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
export async function getTeamGameModelWithZones(
  clubId: string,
  teamId: string
): Promise<{ data: { zones: PitchZone[] } | null; error: string | null }> {
  const { data, error } = await supabase
    .from('game_model')
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
export async function saveTeamGameModelZones(
  clubId: string,
  teamId: string,
  coachId: string,
  zones: PitchZone[]
): Promise<{ error: string | null }> {
  // Check if team record exists
  const { data: existing } = await supabase
    .from('game_model')
    .select('id')
    .eq('club_id', clubId)
    .eq('team_id', teamId)
    .limit(1)
    .single()

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from('game_model')
      .update({ zones: zones as unknown as Json })
      .eq('id', existing.id)

    if (error) {
      console.error('Error updating team zones:', error)
      return { error: error.message }
    }
  } else {
    // Create new team record
    const { error } = await supabase
      .from('game_model')
      .insert({
        club_id: clubId,
        team_id: teamId,
        created_by_coach_id: coachId,
        title: 'Game Model',
        description: 'Team game model',
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

export async function revertTeamGameModel(
  teamId: string,
  clubId: string
): Promise<{ error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('revert_team_game_model', {
    p_team_id: teamId,
    p_club_id: clubId,
  })

  if (error) {
    console.error('Error reverting game model:', error)
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
