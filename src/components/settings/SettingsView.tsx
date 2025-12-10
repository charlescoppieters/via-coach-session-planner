'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { theme } from '@/styles/theme';
import { mainVariants } from '@/constants/animations';
import { SettingsSidebar } from './SettingsSidebar';
import { CoachDetails } from './CoachDetails';
import { TeamDetails } from './TeamDetails';
import { getTeams, createTeam, updateTeam } from '@/lib/teams';
import type { Team, Coach } from '@/types/database';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface SettingsViewProps {
  coachId: string;
  clubId: string;
  coach: Coach | null;
  refreshAuth: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  coachId,
  clubId,
  coach: propCoach,
  refreshAuth,
}) => {
  const [selectedView, setSelectedView] = useState<'coach' | string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [coach, setCoach] = useState<Coach | null>(propCoach);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isAddingTeam, setIsAddingTeam] = useState(false);

  // Refetch teams function
  const refetchTeams = useCallback(async () => {
    const { data } = await getTeams(coachId);
    if (data) {
      setTeams(data);
    }
  }, [coachId]);

  // Fetch coach data
  useEffect(() => {
    const fetchCoach = async () => {
      if (!propCoach) {
        const { data } = await supabase
          .from('coaches')
          .select('*')
          .eq('id', coachId)
          .single();

        if (data) {
          setCoach(data as Coach);
        }
      }
    };

    fetchCoach();
  }, [coachId, propCoach]);

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoadingTeams(true);
      const { data } = await getTeams(coachId);
      if (data) {
        setTeams(data);
      }
      setIsLoadingTeams(false);
    };

    fetchTeams();
  }, [coachId]);

  // Real-time subscriptions for teams
  useEffect(() => {
    const channel = supabase
      .channel('settings-teams-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
          filter: `coach_id=eq.${coachId}`,
        },
        async (payload) => {
          console.log('Teams change received:', payload);

          if (payload.eventType === 'INSERT') {
            setTeams((prev) => [...prev, payload.new as Team]);
            // Auto-select newly created team
            setSelectedView(payload.new.id);
          } else if (payload.eventType === 'UPDATE') {
            setTeams((prev) =>
              prev.map((team) =>
                team.id === payload.new.id ? (payload.new as Team) : team
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTeams((prev) => prev.filter((team) => team.id !== payload.old.id));
            // If deleted team was selected, clear selection
            if (selectedView === payload.old.id) {
              setSelectedView(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coachId, selectedView]);

  const handleViewChange = (view: 'coach' | string) => {
    setSelectedView(view);
    setIsAddingTeam(false);
  };

  const handleAddTeam = () => {
    setIsAddingTeam(true);
    setSelectedView('new');
  };

  const handleCreateTeam = async (teamData: {
    name: string;
    age_group: string;
    skill_level: string;
    player_count: number;
    sessions_per_week: number;
    session_duration: number;
    gender: string | null;
  }) => {
    const { data, error } = await createTeam({
      club_id: clubId,
      created_by_coach_id: coachId,
      ...teamData,
    });

    if (error) {
      console.error('Error creating team:', error);
      throw error;
    }

    if (data) {
      // Refetch teams and select the new team
      await refetchTeams();
      setSelectedView(data.id);
      setIsAddingTeam(false);
    }
  };

  const handleCancelAddTeam = () => {
    setIsAddingTeam(false);
    setSelectedView(null);
  };

  const handleUpdateCoach = async (coachId: string, updates: { name?: string; position?: string; profile_picture?: string }) => {
    const { error } = await supabase
      .from('coaches')
      .update(updates)
      .eq('id', coachId);

    if (error) {
      console.error('Error updating coach:', error);
      throw error;
    }

    // Update local state
    setCoach((prev) => (prev ? { ...prev, ...updates } : null));

    // Refresh auth context to update sidebar
    await refreshAuth();
  };

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
      {/* Left Side - Settings Sidebar */}
      <SettingsSidebar
        selectedView={selectedView}
        onViewChange={handleViewChange}
        coach={coach}
        teams={teams}
        onAddTeam={handleAddTeam}
      />

      {/* Right Side - Content Display */}
      {isLoadingTeams ? (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.colors.text.primary,
        }}>
          Loading...
        </div>
      ) : !selectedView ? (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.xl,
        }}>
          <div style={{
            textAlign: 'center',
            color: theme.colors.text.secondary,
            fontSize: theme.typography.fontSize.lg,
          }}>
            Select a option in the menu to view and edit details
          </div>
        </div>
      ) : selectedView === 'coach' ? (
        <CoachDetails coach={coach} onUpdate={handleUpdateCoach} />
      ) : isAddingTeam ? (
        <TeamDetails
          teamId={null}
          coachId={coachId}
          onTeamCreated={handleCreateTeam}
          onTeamCancelled={handleCancelAddTeam}
        />
      ) : (
        <TeamDetails
          teamId={selectedView}
          coachId={coachId}
          onTeamDeleted={() => setSelectedView(null)}
          onTeamUpdated={refetchTeams}
        />
      )}
    </motion.div>
  );
};
