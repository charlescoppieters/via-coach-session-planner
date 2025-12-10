import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
import type { Player, PlayerInsert, PlayerUpdate } from '@/types/database';

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
  target_1?: string | null;
  target_2?: string | null;
  target_3?: string | null;
}) {
  try {
    const insertData: PlayerInsert = {
      club_id: playerData.club_id,
      team_id: playerData.team_id,
      name: playerData.name,
      age: playerData.age || null,
      position: playerData.position || null,
      gender: playerData.gender || null,
      target_1: playerData.target_1 || null,
      target_2: playerData.target_2 || null,
      target_3: playerData.target_3 || null,
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
    target_1?: string | null;
    target_2?: string | null;
    target_3?: string | null;
  }
) {
  try {
    const updateData: PlayerUpdate = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.age !== undefined) updateData.age = updates.age;
    if (updates.position !== undefined) updateData.position = updates.position;
    if (updates.gender !== undefined) updateData.gender = updates.gender;
    if (updates.target_1 !== undefined) updateData.target_1 = updates.target_1;
    if (updates.target_2 !== undefined) updateData.target_2 = updates.target_2;
    if (updates.target_3 !== undefined) updateData.target_3 = updates.target_3;

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
