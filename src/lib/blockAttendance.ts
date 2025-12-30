import { createClient } from '@/lib/supabase/client';
import type { Player } from '@/types/database';

const supabase = createClient();

/**
 * Player with their block-level inclusion status
 */
export interface PlayerBlockStatus {
  player: Player;
  isIncluded: boolean; // true = participates in block, false = excluded
}

/**
 * Get all players for a team with their inclusion status for a specific block assignment.
 * Players are "included" by default - only those with exclusion records are marked excluded.
 */
export async function getBlockPlayerStatuses(
  assignmentId: string,
  teamId: string
): Promise<{ data: PlayerBlockStatus[] | null; error: unknown }> {
  try {
    // Get all players for the team
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId)
      .order('name', { ascending: true });

    if (playersError) throw playersError;
    if (!players) return { data: [], error: null };

    // Get exclusions for this block assignment
    const { data: exclusions, error: exclusionsError } = await supabase
      .from('block_player_exclusions')
      .select('player_id')
      .eq('assignment_id', assignmentId);

    if (exclusionsError) throw exclusionsError;

    // Create a set of excluded player IDs for efficient lookup
    const excludedPlayerIds = new Set(
      (exclusions || []).map((e) => e.player_id)
    );

    // Map players with their inclusion status
    const playerStatuses: PlayerBlockStatus[] = players.map((player) => ({
      player: player as Player,
      isIncluded: !excludedPlayerIds.has(player.id),
    }));

    return { data: playerStatuses, error: null };
  } catch (error) {
    console.error('Error fetching block player statuses:', error);
    return { data: null, error };
  }
}

/**
 * Toggle a single player's inclusion in a block.
 * - include=true: Remove exclusion record (player participates)
 * - include=false: Add exclusion record (player excluded)
 */
export async function toggleBlockPlayerInclusion(
  assignmentId: string,
  playerId: string,
  include: boolean
): Promise<{ error: unknown }> {
  try {
    if (include) {
      // Remove exclusion record (player is now included)
      const { error } = await supabase
        .from('block_player_exclusions')
        .delete()
        .eq('assignment_id', assignmentId)
        .eq('player_id', playerId);

      if (error) throw error;
    } else {
      // Add exclusion record (player is now excluded)
      const { error } = await supabase
        .from('block_player_exclusions')
        .upsert(
          { assignment_id: assignmentId, player_id: playerId },
          { onConflict: 'assignment_id,player_id' }
        );

      if (error) throw error;
    }
    return { error: null };
  } catch (error) {
    console.error('Error toggling block player inclusion:', error);
    return { error };
  }
}

/**
 * Bulk set player exclusions for a block (replaces all existing exclusions).
 * Used when saving the block editor modal.
 */
export async function setBlockExclusions(
  assignmentId: string,
  excludedPlayerIds: string[]
): Promise<{ error: unknown }> {
  try {
    // Delete all existing exclusions for this block
    const { error: deleteError } = await supabase
      .from('block_player_exclusions')
      .delete()
      .eq('assignment_id', assignmentId);

    if (deleteError) throw deleteError;

    // Insert new exclusions if any
    if (excludedPlayerIds.length > 0) {
      const exclusions = excludedPlayerIds.map((playerId) => ({
        assignment_id: assignmentId,
        player_id: playerId,
      }));

      const { error: insertError } = await supabase
        .from('block_player_exclusions')
        .insert(exclusions);

      if (insertError) throw insertError;
    }

    return { error: null };
  } catch (error) {
    console.error('Error setting block exclusions:', error);
    return { error };
  }
}

/**
 * Get exclusion count for a block assignment.
 * Useful for displaying "X of Y participating" without loading all player data.
 */
export async function getBlockExclusionCount(
  assignmentId: string
): Promise<{ count: number; error: unknown }> {
  try {
    const { count, error } = await supabase
      .from('block_player_exclusions')
      .select('*', { count: 'exact', head: true })
      .eq('assignment_id', assignmentId);

    if (error) throw error;

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Error getting block exclusion count:', error);
    return { count: 0, error };
  }
}

/**
 * Get all players for a team (without exclusion status).
 * Used when creating a new block where no assignment_id exists yet.
 */
export async function getTeamPlayers(
  teamId: string
): Promise<{ data: Player[] | null; error: unknown }> {
  try {
    const { data: players, error } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId)
      .order('name', { ascending: true });

    if (error) throw error;

    return { data: players as Player[], error: null };
  } catch (error) {
    console.error('Error fetching team players:', error);
    return { data: null, error };
  }
}

/**
 * Player with their IDP context for AI coaching points generation
 */
export interface PlayerIDPDetail {
  attribute_key: string;
  priority: number;
  days_since_trained: number | null;
  training_sessions: number;
  positive_mentions: number;
  negative_mentions: number;
}

export interface PlayerWithIDPContext {
  id: string;
  name: string;
  position: string | null;
  idps: PlayerIDPDetail[];
}

/**
 * Get players with their IDP context for coaching points generation.
 * Includes active IDPs with training stats (days since trained, session count, sentiment).
 */
export async function getPlayersWithIDPContext(
  playerIds: string[]
): Promise<{ data: PlayerWithIDPContext[] | null; error: unknown }> {
  if (playerIds.length === 0) {
    return { data: [], error: null };
  }

  try {
    // Get players basic info
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, name, position')
      .in('id', playerIds);

    if (playersError) throw playersError;
    if (!players || players.length === 0) return { data: [], error: null };

    // Get active IDPs for these players
    const { data: idps, error: idpsError } = await supabase
      .from('player_idps')
      .select('player_id, attribute_key, priority')
      .in('player_id', playerIds)
      .is('ended_at', null)
      .order('priority', { ascending: true });

    if (idpsError) throw idpsError;

    // Types for data from views/tables that may not be in generated types
    type ProgressRow = { player_id: string; attribute_key: string; training_sessions: number; positive_mentions: number; negative_mentions: number };
    type TrainingEventRow = { player_id: string; attribute_key: string; created_at: string };

    // Get IDP progress stats from the view (view may not exist in all environments)
    let progressData: ProgressRow[] = [];
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabase as any)
        .from('player_idp_progress')
        .select('player_id, attribute_key, training_sessions, positive_mentions, negative_mentions')
        .in('player_id', playerIds);

      if (!result.error && result.data) {
        progressData = result.data as ProgressRow[];
      } else if (result.error) {
        // View might not exist in all environments - continue without progress data
        console.warn('Could not fetch IDP progress data:', result.error);
      }
    } catch (err) {
      console.warn('Could not fetch IDP progress data:', err);
    }

    // Get last training date for each IDP (from player_training_events)
    let lastTrainedData: TrainingEventRow[] = [];
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabase as any)
        .from('player_training_events')
        .select('player_id, attribute_key, created_at')
        .in('player_id', playerIds)
        .order('created_at', { ascending: false });

      if (!result.error && result.data) {
        lastTrainedData = result.data as TrainingEventRow[];
      } else if (result.error) {
        console.warn('Could not fetch last trained data:', result.error);
      }
    } catch (err) {
      console.warn('Could not fetch last trained data:', err);
    }

    // Build a map of progress stats keyed by player_id + attribute_key
    const progressMap = new Map<string, { training_sessions: number; positive_mentions: number; negative_mentions: number }>();
    progressData.forEach((p) => {
      progressMap.set(`${p.player_id}:${p.attribute_key}`, {
        training_sessions: p.training_sessions || 0,
        positive_mentions: p.positive_mentions || 0,
        negative_mentions: p.negative_mentions || 0,
      });
    });

    // Build a map of last trained dates keyed by player_id + attribute_key
    const lastTrainedMap = new Map<string, Date>();
    lastTrainedData.forEach((t) => {
      const key = `${t.player_id}:${t.attribute_key}`;
      // Only keep the most recent (first due to order)
      if (!lastTrainedMap.has(key)) {
        lastTrainedMap.set(key, new Date(t.created_at));
      }
    });

    // Build player-to-IDPs map
    const playerIdpsMap = new Map<string, PlayerIDPDetail[]>();
    (idps || []).forEach((idp) => {
      const key = `${idp.player_id}:${idp.attribute_key}`;
      const progress = progressMap.get(key);
      const lastTrained = lastTrainedMap.get(key);

      let daysSinceTrained: number | null = null;
      if (lastTrained) {
        const now = new Date();
        daysSinceTrained = Math.floor((now.getTime() - lastTrained.getTime()) / (1000 * 60 * 60 * 24));
      }

      const idpDetail: PlayerIDPDetail = {
        attribute_key: idp.attribute_key,
        priority: idp.priority,
        days_since_trained: daysSinceTrained,
        training_sessions: progress?.training_sessions || 0,
        positive_mentions: progress?.positive_mentions || 0,
        negative_mentions: progress?.negative_mentions || 0,
      };

      const existing = playerIdpsMap.get(idp.player_id) || [];
      existing.push(idpDetail);
      playerIdpsMap.set(idp.player_id, existing);
    });

    // Combine into final structure
    const result: PlayerWithIDPContext[] = players.map((player) => ({
      id: player.id,
      name: player.name,
      position: player.position,
      idps: playerIdpsMap.get(player.id) || [],
    }));

    return { data: result, error: null };
  } catch (error) {
    console.error('Error fetching players with IDP context:', error);
    return { data: null, error };
  }
}
