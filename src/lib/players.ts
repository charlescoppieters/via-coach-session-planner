import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
import type { Player, PlayerInsert, PlayerUpdate, PlayerIDP, PlayerIDPInsert } from '@/types/database';

/**
 * Get all players for a club, optionally filtered by team
 */
export async function getPlayers(clubId: string, teamId?: string | null) {
  try {
    let query = supabase
      .from('players')
      .select('*')
      .eq('club_id', clubId)
      .order('name', { ascending: true });

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching players:', error);
      return { data: null, error };
    }

    return { data: data as Player[], error: null };
  } catch (error) {
    console.error('Error fetching players:', error);
    return { data: null, error };
  }
}

/**
 * Get a single player by ID
 */
export async function getPlayer(playerId: string) {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();

    if (error) {
      console.error('Error fetching player:', error);
      return { data: null, error };
    }

    return { data: data as Player, error: null };
  } catch (error) {
    console.error('Error fetching player:', error);
    return { data: null, error };
  }
}

/**
 * Create a new player
 */
export async function createPlayer(playerData: {
  club_id: string;
  team_id: string;
  name: string;
  age?: number | null;
  position?: string | null;
  gender?: string | null;
}) {
  try {
    const insertData: PlayerInsert = {
      club_id: playerData.club_id,
      team_id: playerData.team_id,
      name: playerData.name,
      age: playerData.age || null,
      position: playerData.position || null,
      gender: playerData.gender || null,
    };

    const { data, error } = await supabase
      .from('players')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating player - Full error:', JSON.stringify(error, null, 2));
      console.error('Insert data:', JSON.stringify(insertData, null, 2));
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      return { data: null, error };
    }

    return { data: data as Player, error: null };
  } catch (error) {
    console.error('Error creating player:', error);
    return { data: null, error };
  }
}

/**
 * Update an existing player
 */
export async function updatePlayer(
  playerId: string,
  updates: {
    name?: string;
    age?: number | null;
    position?: string | null;
    gender?: string | null;
  }
) {
  try {
    const updateData: PlayerUpdate = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.age !== undefined) updateData.age = updates.age;
    if (updates.position !== undefined) updateData.position = updates.position;
    if (updates.gender !== undefined) updateData.gender = updates.gender;

    const { data, error } = await supabase
      .from('players')
      .update(updateData)
      .eq('id', playerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating player:', error);
      return { data: null, error };
    }

    return { data: data as Player, error: null };
  } catch (error) {
    console.error('Error updating player:', error);
    return { data: null, error };
  }
}

/**
 * Delete a player
 */
export async function deletePlayer(playerId: string) {
  try {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId);

    if (error) {
      console.error('Error deleting player:', error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('Error deleting player:', error);
    return { error };
  }
}

/**
 * Subscribe to realtime player changes for a team
 */
export function subscribeToPlayers(
  teamId: string,
  onUpdate: () => void
) {
  const channel = supabase
    .channel(`players-${teamId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `team_id=eq.${teamId}`,
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ========================================
// Player IDP Operations
// ========================================

/**
 * Get active IDPs for a player
 */
export async function getPlayerIDPs(playerId: string) {
  try {
    const { data, error } = await supabase
      .from('player_idps')
      .select('*')
      .eq('player_id', playerId)
      .is('ended_at', null)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error fetching player IDPs:', error);
      return { data: null, error };
    }

    return { data: data as PlayerIDP[], error: null };
  } catch (error) {
    console.error('Error fetching player IDPs:', error);
    return { data: null, error };
  }
}

/**
 * Get IDP history for a player (including ended IDPs)
 */
export async function getPlayerIDPHistory(playerId: string) {
  try {
    const { data, error } = await supabase
      .from('player_idps')
      .select('*')
      .eq('player_id', playerId)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching player IDP history:', error);
      return { data: null, error };
    }

    return { data: data as PlayerIDP[], error: null };
  } catch (error) {
    console.error('Error fetching player IDP history:', error);
    return { data: null, error };
  }
}

/**
 * Create initial IDPs for a new player
 */
export async function createPlayerIDPs(
  playerId: string,
  idps: Array<{ attribute_key: string; priority: number; notes?: string }>
) {
  try {
    if (idps.length === 0) {
      return { data: [], error: null };
    }

    const insertData: PlayerIDPInsert[] = idps.map((idp) => ({
      player_id: playerId,
      attribute_key: idp.attribute_key,
      priority: idp.priority,
      notes: idp.notes || null,
    }));

    const { data, error } = await supabase
      .from('player_idps')
      .insert(insertData)
      .select();

    if (error) {
      console.error('Error creating player IDPs:', error);
      return { data: null, error };
    }

    return { data: data as PlayerIDP[], error: null };
  } catch (error) {
    console.error('Error creating player IDPs:', error);
    return { data: null, error };
  }
}

/**
 * Update player IDPs using the RPC function (ends current, creates new)
 */
export async function updatePlayerIDPs(
  playerId: string,
  newIdps: Array<{ attribute_key: string; priority: number; notes?: string }>
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('update_player_idps', {
      p_player_id: playerId,
      p_new_idps: newIdps,
    });

    if (error) {
      console.error('Error updating player IDPs:', error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('Error updating player IDPs:', error);
    return { error };
  }
}

/**
 * Subscribe to realtime IDP changes for a player
 */
export function subscribeToPlayerIDPs(
  playerId: string,
  onUpdate: () => void
) {
  const channel = supabase
    .channel(`player-idps-${playerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'player_idps',
        filter: `player_id=eq.${playerId}`,
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
