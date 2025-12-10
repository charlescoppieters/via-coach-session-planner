'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { theme } from '@/styles/theme';
import { mainVariants } from '@/constants/animations';
import { PlayerList } from './PlayerList';
import { PlayerDetail } from './PlayerDetail';
import { PlayerForm } from './PlayerForm';
import { getPlayers, createPlayer, updatePlayer } from '@/lib/players';
import type { Player, Team } from '@/types/database';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface PlayersViewProps {
  clubId: string;
  teamId: string;
  team?: Team;
}

export const PlayersView: React.FC<PlayersViewProps> = ({
  clubId,
  teamId,
  team: propTeam,
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(propTeam || null);

  // Fetch full team data if not provided
  useEffect(() => {
    const fetchTeam = async () => {
      if (!propTeam) {
        const { data } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .single();

        if (data) {
          setTeam(data as Team);
        }
      }
    };

    fetchTeam();
  }, [teamId, propTeam]);

  // Refetch players function
  const refetchPlayers = useCallback(async () => {
    const { data } = await getPlayers(clubId, teamId);
    if (data) {
      setPlayers(data);
    }
  }, [clubId, teamId]);

  // Fetch players on mount and when teamId changes
  useEffect(() => {
    const fetchPlayers = async () => {
      setIsLoading(true);
      const { data } = await getPlayers(clubId, teamId);
      if (data) {
        setPlayers(data);
      }
      setIsLoading(false);
    };

    fetchPlayers();
  }, [clubId, teamId]);

  // Set up real-time subscription for players
  useEffect(() => {
    const channel = supabase
      .channel('players-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `team_id=eq.${teamId}`,
        },
        async (payload) => {
          console.log('Players change received:', payload);

          if (payload.eventType === 'INSERT') {
            setPlayers((prev) => [...prev, payload.new as Player]);
          } else if (payload.eventType === 'UPDATE') {
            setPlayers((prev) =>
              prev.map((player) =>
                player.id === payload.new.id ? (payload.new as Player) : player
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setPlayers((prev) =>
              prev.filter((player) => player.id !== payload.old.id)
            );
            // Clear selection if deleted player was selected
            if (selectedPlayerId === payload.old.id) {
              setSelectedPlayerId(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, selectedPlayerId]);

  const handlePlayerSelect = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setIsAddingPlayer(false);
  };

  const handleAddPlayer = () => {
    setIsAddingPlayer(true);
    setSelectedPlayerId(null);
  };

  const handleCreatePlayer = async (playerData: {
    club_id: string;
    team_id: string;
    name: string;
    age?: number | null;
    position?: string | null;
    gender?: string | null;
    target_1?: string | null;
    target_2?: string | null;
    target_3?: string | null;
  }) => {
    console.log('PlayersView: Creating player with data:', playerData);
    const { data, error } = await createPlayer(playerData);

    if (error) {
      console.error('PlayersView: Error creating player:', error);
      throw error;
    }

    if (data) {
      // Refetch the player list to ensure it's up to date
      await refetchPlayers();
      // Select the newly created player
      setSelectedPlayerId(data.id);
      setIsAddingPlayer(false);
    }
  };

  const handleUpdatePlayer = async (
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
  ) => {
    const { error } = await updatePlayer(playerId, updates);

    if (error) {
      console.error('Error updating player:', error);
      throw error;
    }

    // Refetch the player list to ensure it's up to date
    await refetchPlayers();
  };

  const handleDeletePlayer = async (playerId: string) => {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId);

    if (error) {
      console.error('Error deleting player:', error);
      throw error;
    }

    // Refetch the player list to ensure it's up to date
    await refetchPlayers();
    // Clear selection
    setSelectedPlayerId(null);
  };

  const handleCancelAdd = () => {
    setIsAddingPlayer(false);
  };

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId) || null;

  return (
    <motion.div
      variants={mainVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        backgroundColor: theme.colors.background.primary,
      }}
    >
      {/* Left Side - Player List */}
      <PlayerList
        players={players}
        selectedPlayerId={selectedPlayerId}
        onPlayerSelect={handlePlayerSelect}
        onAddPlayer={handleAddPlayer}
      />

      {/* Right Side - Player Detail or Add Form */}
      {isLoading ? (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.colors.text.primary,
        }}>
          Loading players...
        </div>
      ) : isAddingPlayer && team ? (
        <PlayerForm
          team={team}
          onCreate={handleCreatePlayer}
          onCancel={handleCancelAdd}
        />
      ) : (
        <PlayerDetail
          player={selectedPlayer}
          onUpdate={handleUpdatePlayer}
          onDelete={handleDeletePlayer}
        />
      )}
    </motion.div>
  );
};
