import React, { useState } from 'react';
import { theme } from '@/styles/theme';
import type { Team } from '@/types/database';

interface CreateSessionModalProps {
  team: Team;
  coachId: string;
  onCancel: () => void;
  onCreate: (sessionData: {
    coach_id: string;
    team_id: string;
    title: string;
    session_date: string;
    player_count: number;
    duration: number;
    age_group: string;
    skill_level: string;
    content: string;
  }) => Promise<void>;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  team,
  coachId,
  onCancel,
  onCreate,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    session_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    player_count: team.player_count,
    duration: team.session_duration,
  });

  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter a session title');
      return;
    }

    setIsCreating(true);
    try {
      await onCreate({
        coach_id: coachId,
        team_id: team.id,
        title: formData.title,
        session_date: formData.session_date,
        player_count: formData.player_count,
        duration: formData.duration,
        age_group: team.age_group,
        skill_level: team.skill_level,
        content: '', // Start with empty content
      });
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session');
      setIsCreating(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: theme.colors.background.secondary,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.xl,
            width: '90%',
            maxWidth: '500px',
          }}
        >
          <h2
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              margin: 0,
              marginBottom: theme.spacing.lg,
            }}
          >
            Create New Session
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Title Field */}
            <div style={{ marginBottom: theme.spacing.lg }}>
              <label
                style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.xs,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Session Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Strength Training Exercise"
                required
                autoFocus
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
            </div>

            {/* Session Date Field */}
            <div style={{ marginBottom: theme.spacing.lg }}>
              <label
                style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.xs,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Session Date *
              </label>
              <input
                type="date"
                value={formData.session_date}
                onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                required
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
                  colorScheme: 'dark',
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
            </div>

            {/* Player Count and Duration (side by side) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: theme.spacing.md,
                marginBottom: theme.spacing.xl,
              }}
            >
              {/* Player Count */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text.secondary,
                    marginBottom: theme.spacing.xs,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Players *
                </label>
                <input
                  type="number"
                  value={formData.player_count}
                  onChange={(e) => setFormData({ ...formData, player_count: parseInt(e.target.value) || 0 })}
                  min="1"
                  required
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
              </div>

              {/* Duration */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text.secondary,
                    marginBottom: theme.spacing.xs,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Duration (min) *
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  min="1"
                  required
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
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: theme.spacing.sm,
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={onCancel}
                disabled={isCreating}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  backgroundColor: theme.colors.background.primary,
                  color: theme.colors.text.primary,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  cursor: isCreating ? 'not-allowed' : 'pointer',
                  opacity: isCreating ? 0.6 : 1,
                  transition: theme.transitions.fast,
                }}
                onMouseEnter={(e) => {
                  if (!isCreating) {
                    e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCreating) {
                    e.currentTarget.style.backgroundColor = theme.colors.background.primary;
                  }
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isCreating}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  backgroundColor: theme.colors.gold.main,
                  color: theme.colors.background.primary,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  cursor: isCreating ? 'not-allowed' : 'pointer',
                  opacity: isCreating ? 0.6 : 1,
                  transition: theme.transitions.fast,
                }}
                onMouseEnter={(e) => {
                  if (!isCreating) {
                    e.currentTarget.style.backgroundColor = theme.colors.gold.light;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCreating) {
                    e.currentTarget.style.backgroundColor = theme.colors.gold.main;
                  }
                }}
              >
                {isCreating ? 'Creating...' : 'Create Session'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
