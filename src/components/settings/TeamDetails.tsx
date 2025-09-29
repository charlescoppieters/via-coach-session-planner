'use client'

import React, { useRef, useState, useEffect } from 'react';
import { FaEdit, FaSave } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { CgSpinnerAlt } from "react-icons/cg";
import { theme } from "@/styles/theme";
import { supabase } from '@/lib/supabase';
import { getTeam, updateTeam, deleteTeam } from '@/lib/teams';
import { TeamForm } from '@/components/teams/TeamForm';
import { TeamRules } from '@/components/rules/TeamRules';
import type { Team } from '@/types/database';

interface TeamDetailsProps {
  teamId: string;
  coachId: string | null;
  onTeamDeleted?: () => void;
}

export const TeamDetails: React.FC<TeamDetailsProps> = ({
  teamId,
  coachId,
  onTeamDeleted,
}) => {
  const teamNameInputRef = useRef<HTMLInputElement>(null);

  // Local state
  const [team, setTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState<Team | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch team data when teamId changes
  useEffect(() => {
    const fetchTeam = async () => {
      if (!teamId || !coachId) {
        setTeam(null);
        setFormData(null);
        return;
      }

      setIsLoading(true);
      const { data, error } = await getTeam(teamId);

      if (data) {
        setTeam(data);
        setFormData({ ...data });
        // If this team was created very recently (within last 5 seconds), start in edit mode
        const teamCreatedAt = new Date(data.created_at);
        const now = new Date();
        const timeDifference = now.getTime() - teamCreatedAt.getTime();
        const fiveSecondsInMs = 5 * 1000;

        if (timeDifference < fiveSecondsInMs) {
          setIsEditing(true);
        }
      }
      if (error) {
        console.error('Error fetching team:', error);
      }
      setIsLoading(false);
    };

    fetchTeam();
    setIsEditing(false); // Reset edit state when team changes
  }, [teamId, coachId]);

  // Subscribe to team changes with tab-switch fix
  useEffect(() => {
    if (!teamId) return;

    let retryCount = 0;
    const maxRetries = 3;
    const baseDelay = 1000;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const handleTeamChange = (payload: { new?: Team; old?: Team; eventType: string }) => {
      try {
        if (payload.new && !isEditing) {
          setTeam(payload.new as Team);
          setFormData(payload.new as Team);
        }
      } catch (error) {
        console.error('Team details subscription handler failed:', error);
      }
    };

    const createSubscription = () => {
      try {
        channel = supabase
          .channel(`team-details-${teamId}-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'teams',
              filter: `id=eq.${teamId}`,
            },
            handleTeamChange
          )
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              isSubscribed = true;
              retryCount = 0;
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.warn('Team details subscription failed, retrying...');
              isSubscribed = false;
              if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(createSubscription, baseDelay * retryCount);
              }
            }
          });
      } catch (error) {
        console.error('Failed to create team details subscription:', error);
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
  }, [teamId, isEditing]);

  React.useEffect(() => {
    if (isEditing && teamNameInputRef.current) {
      teamNameInputRef.current.focus();
    }
  }, [isEditing]);

  // Reset form data when exiting edit mode
  React.useEffect(() => {
    if (!isEditing && team) {
      setFormData({ ...team });
    }
  }, [isEditing, team]);

  // Loading state
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: theme.colors.text.muted,
        }}
      >
        <CgSpinnerAlt
          style={{
            animation: 'spin 1s linear infinite',
            fontSize: '24px',
          }}
        />
      </div>
    );
  }

  // Don't render if no data
  if (!team || !formData) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: theme.colors.text.muted,
          fontSize: theme.typography.fontSize.lg,
        }}
      >
        Team not found
      </div>
    );
  }

  const handleFieldChange = (field: keyof Team, value: string | number) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => prev ? { ...prev, name } : null);
  };

  const handleSave = async () => {
    if (!formData) return;

    setIsSaving(true);
    const { data: updatedTeam, error } = await updateTeam(formData.id, formData);

    if (updatedTeam) {
      setTeam(updatedTeam);
      setFormData({ ...updatedTeam });
      setIsEditing(false);

      // Force trigger parent components to refresh since real-time might not be working
      // This is a fallback to ensure UI consistency
      setTimeout(() => {
        // The parent components should pick this up via their subscriptions
        // But if real-time isn't working, this gives us a backup
        window.dispatchEvent(new CustomEvent('teamUpdated', {
          detail: { team: updatedTeam, action: 'update' }
        }));
      }, 100);
    }
    if (error) {
      console.error('Error saving team:', error);
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!teamId || !confirm('Are you sure you want to delete this team?')) return;

    setIsDeleting(true);
    const { error } = await deleteTeam(teamId);

    if (!error) {
      // Team deleted successfully - notify parent to clear selection
      onTeamDeleted?.();
      // Also manually trigger team update event for Sidebar
      window.dispatchEvent(new CustomEvent('teamUpdated', { detail: { action: 'delete', teamId } }));
    } else {
      console.error('Error deleting team:', error);
    }
    setIsDeleting(false);
  };

  // Simple validation - check if required fields are filled
  const canSave = formData.name.trim() !== '';

  return (
    <>
      <div
        style={{
          padding: theme.spacing.lg,
          background: theme.colors.gold.main,
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          position: 'relative',
        }}
      >
        <div style={{ paddingRight: '200px' }}>
          {isEditing ? (
            <input
              ref={teamNameInputRef}
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                border: `1px solid rgba(255, 255, 255, 0.3)`,
                borderRadius: theme.borderRadius.sm,
                color: theme.colors.text.primary,
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                fontFamily: theme.typography.fontFamily.primary,
                outline: 'none',
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                letterSpacing: '-0.025em',
                boxSizing: 'border-box',
                width: '300px',
                maxWidth: '60%',
              }}
              onFocus={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}
              onBlur={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            />
          ) : (
            <h3
              style={{
                color: theme.colors.text.primary,
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                margin: 0,
                letterSpacing: '-0.025em',
              }}
            >
              {formData.name}
            </h3>
          )}
        </div>
        <p
          style={{
            color: theme.colors.text.primary,
            fontSize: theme.typography.fontSize.sm,
            margin: `${theme.spacing.xs} 0 0 0`,
            opacity: 0.8,
          }}
        >
          Edit team details and manage team-specific rules
        </p>

        {/* Action Buttons */}
        <div
          style={{
            position: 'absolute',
            right: theme.spacing.lg,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: `0 ${theme.spacing.md}`,
                height: '36px',
                backgroundColor: theme.colors.gold.light,
                color: theme.colors.text.primary,
                border: 'none',
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                cursor: 'pointer',
                transition: theme.transitions.normal,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: theme.spacing.sm,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.gold.main;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.gold.light;
              }}
            >
              <FaEdit size={16} />
              <span style={{ fontWeight: theme.typography.fontWeight.bold }}>Edit Team</span>
            </button>
          ) : (
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  padding: `0 ${theme.spacing.md}`,
                  height: '36px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.6 : 1,
                  transition: theme.transitions.normal,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: theme.spacing.xs,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#c82333';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc3545';
                }}
              >
                {isDeleting ? (
                  <>
                    <CgSpinnerAlt
                      style={{
                        animation: 'spin 1s linear infinite',
                        fontSize: '16px',
                      }}
                    />
                    <span style={{ fontWeight: theme.typography.fontWeight.bold }}>Deleting...</span>
                  </>
                ) : (
                  <>
                    <MdDelete size={16} />
                    <span style={{ fontWeight: theme.typography.fontWeight.bold }}>Delete Team</span>
                  </>
                )}
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave || isSaving}
                style={{
                  padding: `0 ${theme.spacing.md}`,
                  height: '36px',
                  backgroundColor: (canSave && !isSaving) ? theme.colors.gold.light : theme.colors.text.muted,
                  color: (canSave && !isSaving) ? theme.colors.text.primary : theme.colors.text.secondary,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  cursor: (canSave && !isSaving) ? 'pointer' : 'not-allowed',
                  transition: theme.transitions.normal,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: theme.spacing.sm,
                  boxShadow: (canSave && !isSaving) ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none',
                  whiteSpace: 'nowrap',
                  opacity: (canSave && !isSaving) ? 1 : 0.6,
                }}
                onMouseEnter={(e) => {
                  if (canSave && !isSaving) {
                    e.currentTarget.style.backgroundColor = theme.colors.gold.main;
                  }
                }}
                onMouseLeave={(e) => {
                  if (canSave && !isSaving) {
                    e.currentTarget.style.backgroundColor = theme.colors.gold.light;
                  }
                }}
              >
                {isSaving ? (
                  <>
                    <CgSpinnerAlt
                      style={{
                        animation: 'spin 1s linear infinite',
                        fontSize: '16px',
                      }}
                    />
                    <span style={{ fontWeight: theme.typography.fontWeight.bold }}>Saving...</span>
                  </>
                ) : (
                  <>
                    <FaSave size={16} />
                    <span style={{ fontWeight: theme.typography.fontWeight.bold }}>Save Team</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          maxHeight: '100%',
        }}
      >
        {/* Team Properties Form */}
        <div
          style={{
            padding: theme.spacing.lg,
            paddingBottom: theme.spacing.md,
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.md,
            flexShrink: 0,
          }}
        >
          <TeamForm
            team={formData}
            isEditing={isEditing}
            onChange={handleFieldChange}
          />
        </div>

        {/* Team Rules Section */}
        <TeamRules
          teamId={formData.id}
          teamName={formData.name}
        />
      </div>
    </>
  );
};