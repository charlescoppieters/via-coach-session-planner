'use client'

import React, { useState, useEffect } from 'react';
import { theme } from '@/styles/theme';
import { supabase } from '@/lib/supabase';
import { getTeam } from '@/lib/teams';
import type { Team } from '@/types/database';

interface TeamDetailsProps {
  teamId: string | null;
  coachId: string | null;
  onTeamDeleted?: () => void;
  onTeamUpdated?: () => void;
  onTeamCreated?: (teamData: {
    name: string;
    age_group: string;
    skill_level: string;
    player_count: number;
    sessions_per_week: number;
    session_duration: number;
    gender: string | null;
  }) => Promise<void>;
  onTeamCancelled?: () => void;
}

export const TeamDetails: React.FC<TeamDetailsProps> = ({
  teamId,
  coachId,
  onTeamDeleted,
  onTeamUpdated,
  onTeamCreated,
  onTeamCancelled,
}) => {
  const isNewTeam = teamId === null;
  const [team, setTeam] = useState<Team | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedTeam, setEditedTeam] = useState<{
    name: string;
    age_group: string;
    skill_level: string;
    player_count: number;
    sessions_per_week: number;
    session_duration: number;
    gender: string;
  }>({
    name: '',
    age_group: '',
    skill_level: '',
    player_count: 0,
    sessions_per_week: 0,
    session_duration: 0,
    gender: '',
  });

  // Fetch team data when teamId changes
  useEffect(() => {
    const fetchTeam = async () => {
      // Handle new team creation
      if (isNewTeam) {
        setTeam(null);
        setEditedTeam({
          name: '',
          age_group: '',
          skill_level: '',
          player_count: 0,
          sessions_per_week: 0,
          session_duration: 0,
          gender: '',
        });
        setIsEditing(true);
        setIsLoading(false);
        return;
      }

      if (!teamId || !coachId) {
        setTeam(null);
        return;
      }

      setIsLoading(true);
      const { data, error } = await getTeam(teamId);

      if (data) {
        setTeam(data);
        setEditedTeam({
          name: data.name || '',
          age_group: data.age_group || '',
          skill_level: data.skill_level || '',
          player_count: data.player_count || 0,
          sessions_per_week: data.sessions_per_week || 0,
          session_duration: data.session_duration || 0,
          gender: data.gender || '',
        });

        // Don't auto-edit - let user click Edit button when they want to make changes
      }
      if (error) {
        console.error('Error fetching team:', error);
      }
      setIsLoading(false);
    };

    fetchTeam();
    if (!isNewTeam) {
      setIsEditing(false);
    }
  }, [teamId, coachId, isNewTeam]);

  // Real-time subscription
  useEffect(() => {
    if (!teamId) return;

    const channel = supabase
      .channel(`team-details-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'teams',
          filter: `id=eq.${teamId}`,
        },
        (payload) => {
          if (!isEditing && payload.new) {
            setTeam(payload.new as Team);
            setEditedTeam({
              name: (payload.new as Team).name || '',
              age_group: (payload.new as Team).age_group || '',
              skill_level: (payload.new as Team).skill_level || '',
              player_count: (payload.new as Team).player_count || 0,
              sessions_per_week: (payload.new as Team).sessions_per_week || 0,
              session_duration: (payload.new as Team).session_duration || 0,
              gender: (payload.new as Team).gender || '',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, isEditing]);

  const handleSave = async () => {
    // Handle creating new team
    if (isNewTeam && onTeamCreated) {
      await onTeamCreated({
        name: editedTeam.name,
        age_group: editedTeam.age_group,
        skill_level: editedTeam.skill_level,
        player_count: editedTeam.player_count,
        sessions_per_week: editedTeam.sessions_per_week,
        session_duration: editedTeam.session_duration,
        gender: editedTeam.gender || null,
      });
      return;
    }

    // Handle updating existing team
    if (!team) return;

    const { error } = await supabase
      .from('teams')
      .update({
        name: editedTeam.name,
        age_group: editedTeam.age_group,
        skill_level: editedTeam.skill_level,
        player_count: editedTeam.player_count,
        sessions_per_week: editedTeam.sessions_per_week,
        session_duration: editedTeam.session_duration,
        gender: editedTeam.gender || null,
      })
      .eq('id', team.id);

    if (error) {
      console.error('Error updating team:', error);
      return;
    }

    // Update local state immediately with new values
    setTeam({
      ...team,
      name: editedTeam.name,
      age_group: editedTeam.age_group,
      skill_level: editedTeam.skill_level,
      player_count: editedTeam.player_count,
      sessions_per_week: editedTeam.sessions_per_week,
      session_duration: editedTeam.session_duration,
      gender: editedTeam.gender || null,
    });

    setIsEditing(false);

    // Refetch teams list to ensure sidebar is updated
    if (onTeamUpdated) {
      await onTeamUpdated();
    }
  };

  const handleDelete = async () => {
    if (!team || !confirm(`Are you sure you want to delete ${team.name}?`)) return;

    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', team.id);

    if (error) {
      console.error('Error deleting team:', error);
      return;
    }

    // Refetch teams list to ensure sidebar is updated
    if (onTeamUpdated) {
      await onTeamUpdated();
    }

    if (onTeamDeleted) {
      onTeamDeleted();
    }
  };

  if (isLoading) {
    return (
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
          Loading team details...
        </div>
      </div>
    );
  }

  if (!team && !isNewTeam) {
    return (
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
          Select a team to view details
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      padding: theme.spacing.xl,
    }}>
      <div style={{
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.xl,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      }}>
        {/* Header: Team Name and Edit/Save/Delete Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.xl,
          paddingBottom: theme.spacing.lg,
          borderBottom: `1px solid ${theme.colors.border.primary}`,
        }}>
          {/* Team Name */}
          {isEditing ? (
            <input
              type="text"
              value={editedTeam.name}
              onChange={(e) => setEditedTeam({ ...editedTeam, name: e.target.value })}
              placeholder="Enter team name"
              style={{
                flex: 1,
                fontSize: theme.typography.fontSize['3xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                padding: theme.spacing.sm,
                border: `2px solid ${theme.colors.border.primary}`,
                borderRadius: theme.borderRadius.md,
                outline: 'none',
                backgroundColor: theme.colors.background.primary,
                marginRight: theme.spacing.lg,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.colors.gold.main;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme.colors.border.primary;
              }}
            />
          ) : (
            <h1 style={{
              flex: 1,
              fontSize: theme.typography.fontSize['3xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              margin: 0,
            }}>
              {team?.name || editedTeam.name}
            </h1>
          )}

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: theme.spacing.sm,
            flexShrink: 0,
          }}>
            {/* Save Button (or Edit for existing teams when not editing) */}
            {(!isNewTeam || isEditing) && (
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  backgroundColor: isEditing ? theme.colors.gold.main : theme.colors.background.primary,
                  color: isEditing ? theme.colors.background.primary : theme.colors.text.primary,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  cursor: 'pointer',
                  transition: theme.transitions.fast,
                }}
                onMouseEnter={(e) => {
                  if (isEditing) {
                    e.currentTarget.style.backgroundColor = theme.colors.gold.light;
                  } else {
                    e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (isEditing) {
                    e.currentTarget.style.backgroundColor = theme.colors.gold.main;
                  } else {
                    e.currentTarget.style.backgroundColor = theme.colors.background.primary;
                  }
                }}
              >
                {isEditing ? 'Save' : 'Edit'}
              </button>
            )}

            {/* Cancel Button (only for new teams) */}
            {isNewTeam && onTeamCancelled && (
              <button
                onClick={onTeamCancelled}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  backgroundColor: theme.colors.background.primary,
                  color: theme.colors.text.primary,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  cursor: 'pointer',
                  transition: theme.transitions.fast,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.background.primary;
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Team Details Fields */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: theme.spacing.lg,
        }}>
          {/* Age Group */}
          <div>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Age Group
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedTeam.age_group}
                onChange={(e) => setEditedTeam({ ...editedTeam, age_group: e.target.value })}
                placeholder="e.g. U12, U15"
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.text.primary,
                  backgroundColor: theme.colors.background.primary,
                  border: `2px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.colors.gold.main;
                  e.target.style.boxShadow = theme.shadows.gold;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.colors.border.primary;
                  e.target.style.boxShadow = 'none';
                }}
              />
            ) : (
              <div style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.primary,
              }}>
                {team?.age_group || editedTeam.age_group}
              </div>
            )}
          </div>

          {/* Skill Level */}
          <div>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Skill Level
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedTeam.skill_level}
                onChange={(e) => setEditedTeam({ ...editedTeam, skill_level: e.target.value })}
                placeholder="e.g. Beginner, Intermediate"
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.text.primary,
                  backgroundColor: theme.colors.background.primary,
                  border: `2px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.colors.gold.main;
                  e.target.style.boxShadow = theme.shadows.gold;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.colors.border.primary;
                  e.target.style.boxShadow = 'none';
                }}
              />
            ) : (
              <div style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.primary,
              }}>
                {team?.skill_level || editedTeam.skill_level}
              </div>
            )}
          </div>

          {/* Player Count */}
          <div>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Player Count
            </label>
            {isEditing ? (
              <input
                type="number"
                value={editedTeam.player_count || ''}
                onChange={(e) => setEditedTeam({ ...editedTeam, player_count: parseInt(e.target.value) || 0 })}
                placeholder="e.g. 12"
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.text.primary,
                  backgroundColor: theme.colors.background.primary,
                  border: `2px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.colors.gold.main;
                  e.target.style.boxShadow = theme.shadows.gold;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.colors.border.primary;
                  e.target.style.boxShadow = 'none';
                }}
              />
            ) : (
              <div style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.primary,
              }}>
                {team?.player_count || editedTeam.player_count}
              </div>
            )}
          </div>

          {/* Sessions Per Week */}
          <div>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Sessions Per Week
            </label>
            {isEditing ? (
              <input
                type="number"
                value={editedTeam.sessions_per_week || ''}
                onChange={(e) => setEditedTeam({ ...editedTeam, sessions_per_week: parseInt(e.target.value) || 0 })}
                placeholder="e.g. 2"
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.text.primary,
                  backgroundColor: theme.colors.background.primary,
                  border: `2px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.colors.gold.main;
                  e.target.style.boxShadow = theme.shadows.gold;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.colors.border.primary;
                  e.target.style.boxShadow = 'none';
                }}
              />
            ) : (
              <div style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.primary,
              }}>
                {team?.sessions_per_week || editedTeam.sessions_per_week}
              </div>
            )}
          </div>

          {/* Session Duration */}
          <div>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Session Duration (min)
            </label>
            {isEditing ? (
              <input
                type="number"
                value={editedTeam.session_duration || ''}
                onChange={(e) => setEditedTeam({ ...editedTeam, session_duration: parseInt(e.target.value) || 0 })}
                placeholder="e.g. 60"
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.text.primary,
                  backgroundColor: theme.colors.background.primary,
                  border: `2px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.colors.gold.main;
                  e.target.style.boxShadow = theme.shadows.gold;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.colors.border.primary;
                  e.target.style.boxShadow = 'none';
                }}
              />
            ) : (
              <div style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.primary,
              }}>
                {team?.session_duration || editedTeam.session_duration}
              </div>
            )}
          </div>

          {/* Gender */}
          <div>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Gender
            </label>
            {isEditing ? (
              <select
                value={editedTeam.gender}
                onChange={(e) => setEditedTeam({ ...editedTeam, gender: e.target.value })}
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  fontSize: theme.typography.fontSize.base,
                  color: editedTeam.gender ? theme.colors.text.primary : theme.colors.text.secondary,
                  backgroundColor: theme.colors.background.primary,
                  border: `2px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  outline: 'none',
                  boxSizing: 'border-box',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.7rem center',
                  backgroundSize: '1.2em',
                  paddingRight: '2.5rem',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.colors.gold.main;
                  e.target.style.boxShadow = theme.shadows.gold;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.colors.border.primary;
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="" style={{ color: theme.colors.text.secondary }}>Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Co-Ed">Co-Ed</option>
              </select>
            ) : (
              <div style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.primary,
              }}>
                {team?.gender || editedTeam.gender || 'Not specified'}
              </div>
            )}
          </div>
        </div>

        {/* Delete Button - Only visible when editing existing teams */}
        {isEditing && !isNewTeam && (
          <div style={{
            marginTop: theme.spacing.xl,
            paddingTop: theme.spacing.xl,
            borderTop: `1px solid ${theme.colors.border.primary}`,
            display: 'flex',
            justifyContent: 'center',
          }}>
            <button
              onClick={handleDelete}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                backgroundColor: theme.colors.background.primary,
                color: theme.colors.status.error,
                border: 'none',
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                cursor: 'pointer',
                transition: theme.transitions.fast,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.background.primary;
              }}
            >
              Delete Team
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
