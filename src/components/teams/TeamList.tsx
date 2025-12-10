'use client'

import React, { useState, useEffect, useRef } from 'react';
import { CgSpinnerAlt } from "react-icons/cg";
import { theme } from "@/styles/theme";
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
import { getTeams, createTeam } from '@/lib/teams';
import type { Team, TeamInsert } from '@/types/database';
import { TeamCard } from './TeamCard';

interface TeamListProps {
  coachId: string | null;
  clubId: string | null;
  selectedTeamId: string | null;
  onTeamSelect: (teamId: string) => void;
  triggerNewTeam?: number;
  deletedTeamId?: string | null;
  onTeamCreated?: (team: Team) => void;
}

export const TeamList: React.FC<TeamListProps> = ({
  coachId,
  clubId,
  selectedTeamId,
  onTeamSelect,
  triggerNewTeam,
  deletedTeamId,
  onTeamCreated,
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const processedTriggerRef = useRef<number | undefined>(undefined);

  // Fetch teams when component mounts or coachId changes
  useEffect(() => {
    const fetchTeams = async () => {
      if (!coachId) {
        setTeams([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await getTeams(coachId);

      if (data) {
        setTeams(data);
      }
      if (fetchError) {
        console.error('Error fetching teams:', fetchError);
        setError('Failed to load teams');
      }
      setIsLoading(false);
    };

    fetchTeams();
  }, [coachId]);

  // Subscribe to team changes with tab-switch fix
  useEffect(() => {
    if (!coachId) return;

    let retryCount = 0;
    const maxRetries = 3;
    const baseDelay = 1000;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isSubscribed = false;

    const handleTeamChange = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Team fetch timeout after 5 seconds')), 5000);
        });

        const fetchPromise = getTeams(coachId);
        const { data } = await Promise.race([fetchPromise, timeoutPromise]);

        if (data) {
          setTeams(data);
        }
        retryCount = 0; // Reset retry count on success
      } catch (error) {
        console.error('TeamList subscription handler failed:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(() => {
            if (isSubscribed) {
              handleTeamChange();
            }
          }, baseDelay * retryCount);
        }
      }
    };

    const createSubscription = () => {
      try {
        channel = supabase
          .channel(`teamlist-changes-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'teams',
              filter: `coach_id=eq.${coachId}`,
            },
            handleTeamChange
          )
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              isSubscribed = true;
              retryCount = 0;
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.warn('TeamList subscription failed, retrying...');
              isSubscribed = false;
              if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(createSubscription, baseDelay * retryCount);
              }
            }
          });
      } catch (error) {
        console.error('Failed to create TeamList subscription:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(createSubscription, baseDelay * retryCount);
        }
      }
    };

    createSubscription();

    return () => {
      isSubscribed = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [coachId]);

  // Fallback: Listen for manual team update events
  useEffect(() => {
    const handleTeamUpdate = async () => {
      if (coachId) {
        const { data } = await getTeams(coachId);
        if (data) {
          setTeams(data);
        }
      }
    };

    window.addEventListener('teamUpdated', handleTeamUpdate);
    return () => {
      window.removeEventListener('teamUpdated', handleTeamUpdate);
    };
  }, [coachId]);

  const handleAddNewTeam = async () => {
    if (!coachId || !clubId) return;


    // Prevent double execution
    if (isAddingTeam) {
      return;
    }

    setIsAddingTeam(true);
    const newTeamData: TeamInsert = {
      club_id: clubId,
      created_by_coach_id: coachId,
      name: 'New Team',
      age_group: '',
      skill_level: '',
      player_count: 0,
      sessions_per_week: 0,
      session_duration: 0,
    };

    const { data: newTeam, error: createError } = await createTeam(newTeamData);

    if (newTeam) {
      // Add to local state immediately
      setTeams(prev => [newTeam, ...prev]);
      // Notify parent for consistency
      onTeamCreated?.(newTeam);
      onTeamSelect(newTeam.id);
      // Also manually trigger team update event for Sidebar
      window.dispatchEvent(new CustomEvent('teamUpdated', { detail: { action: 'create', team: newTeam } }));
    }
    if (createError) {
      console.error('Error creating team:', createError);
      setError('Failed to create team');
    }
    setIsAddingTeam(false);
  };

  // Listen for external trigger to create new team
  useEffect(() => {
    if (triggerNewTeam && triggerNewTeam > 0 && processedTriggerRef.current !== triggerNewTeam) {
      processedTriggerRef.current = triggerNewTeam;
      handleAddNewTeam();
    }
  }, [triggerNewTeam]);

  // Listen for team deletion and remove from local state immediately
  useEffect(() => {
    if (deletedTeamId) {
      setTeams(prev => prev.filter(team => team.id !== deletedTeamId));
    }
  }, [deletedTeamId]);


  return (
    <div
      style={{
        width: '40%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.lg,
        boxShadow: theme.shadows.xl,
        overflow: 'visible',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: theme.spacing.lg,
          background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
          borderBottom: `1px solid ${theme.colors.border.secondary}`,
        }}
      >
        <h3
          style={{
            color: theme.colors.text.primary,
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            margin: '0 0 ' + theme.spacing.xs + ' 0',
            letterSpacing: '-0.025em',
          }}
        >
          Teams & Settings
        </h3>
        <p
          style={{
            color: theme.colors.text.muted,
            fontSize: theme.typography.fontSize.sm,
            margin: 0,
          }}
        >
          Manage your teams and coaching methodology
        </p>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: theme.spacing.lg,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible',
        }}
      >
        {/* Coaching Methodology Card */}
        <div
          onClick={() => onTeamSelect('global')}
          style={{
            padding: theme.spacing.lg,
            borderRadius: theme.borderRadius.md,
            background: selectedTeamId === 'global'
              ? theme.colors.gold.main
              : `linear-gradient(135deg, ${theme.colors.background.tertiary} 0%, ${theme.colors.background.secondary} 100%)`,
            cursor: 'pointer',
            transition: theme.transitions.fast,
            boxShadow: theme.shadows.md,
          }}
          onMouseEnter={(e) => {
            if (selectedTeamId !== 'global') {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = theme.shadows.lg;
            }
          }}
          onMouseLeave={(e) => {
            if (selectedTeamId !== 'global') {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = theme.shadows.md;
            }
          }}
        >
          <h4
            style={{
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              margin: '0 0 ' + theme.spacing.xs + ' 0',
            }}
          >
            Coaching Methodology
          </h4>
          <p
            style={{
              color: selectedTeamId === 'global' ? theme.colors.text.primary : theme.colors.text.muted,
              fontSize: theme.typography.fontSize.sm,
              margin: 0,
            }}
          >
            Define your overall coaching philosophy and rules
          </p>
        </div>

        {/* Teams Section Header */}
        <h3
          style={{
            color: theme.colors.text.primary,
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            margin: theme.spacing.lg + ' 0 ' + theme.spacing.md + ' 0',
            textAlign: 'left',
          }}
        >
          Teams
        </h3>

        {/* Add New Team Button */}
        <div
          onClick={handleAddNewTeam}
          style={{
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            backgroundColor: 'transparent',
            color: theme.colors.gold.main,
            border: `2px dashed ${theme.colors.gold.main}`,
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            cursor: 'pointer',
            transition: theme.transitions.fast,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.md,
            opacity: isAddingTeam ? 0.6 : 1,
            pointerEvents: isAddingTeam ? 'none' : 'auto',
          }}
          onMouseEnter={(e) => {
            if (!isAddingTeam) {
              e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
            }
          }}
          onMouseLeave={(e) => {
            if (!isAddingTeam) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {isAddingTeam ? (
            <CgSpinnerAlt
              style={{
                animation: 'spin 1s linear infinite',
                fontSize: '18px',
                color: theme.colors.gold.main,
              }}
            />
          ) : (
            <span
              style={{
                color: theme.colors.gold.main,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
              }}
            >
              + Add New Team
            </span>
          )}
        </div>

        {/* Teams List - Scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.md,
            padding: theme.spacing.sm,
          }}
        >
          {isLoading ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: theme.spacing.lg,
                color: theme.colors.text.muted,
              }}
            >
              <CgSpinnerAlt
                style={{
                  animation: 'spin 1s linear infinite',
                  fontSize: '20px'
                }}
              />
            </div>
          ) : error ? (
            <div
              style={{
                padding: theme.spacing.md,
                color: theme.colors.status.error,
                fontSize: theme.typography.fontSize.sm,
                textAlign: 'center',
              }}
            >
              Failed to load teams
            </div>
          ) : (
            teams.map(team => (
              <TeamCard
                key={team.id}
                team={team}
                isSelected={selectedTeamId === team.id}
                onClick={() => onTeamSelect(team.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};