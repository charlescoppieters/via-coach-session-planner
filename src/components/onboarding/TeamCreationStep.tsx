'use client'

import React, { useState } from 'react';
import { theme } from '@/styles/theme';

interface TeamCreationStepProps {
  onNext: (teamData: {
    name: string;
    age_group: string;
    skill_level: string;
    player_count: number;
    sessions_per_week: number;
    session_duration: number;
    gender: string | null;
  }) => void;
  onBack: () => void;
}

export const TeamCreationStep: React.FC<TeamCreationStepProps> = ({ onNext, onBack }) => {
  const [teamData, setTeamData] = useState({
    name: '',
    age_group: '',
    skill_level: '',
    player_count: 0,
    sessions_per_week: 0,
    session_duration: 0,
    gender: '',
  });

  const handleNext = () => {
    // Validation
    if (!teamData.name.trim()) {
      alert('Please enter a team name');
      return;
    }
    if (!teamData.age_group.trim()) {
      alert('Please enter an age group');
      return;
    }
    if (!teamData.skill_level.trim()) {
      alert('Please enter a skill level');
      return;
    }
    if (teamData.player_count <= 0) {
      alert('Please enter a valid player count');
      return;
    }
    if (teamData.sessions_per_week <= 0) {
      alert('Please enter sessions per week');
      return;
    }
    if (teamData.session_duration <= 0) {
      alert('Please enter session duration');
      return;
    }

    onNext({
      ...teamData,
      name: teamData.name.trim(),
      age_group: teamData.age_group.trim(),
      skill_level: teamData.skill_level.trim(),
      gender: teamData.gender || null,
    });
  };

  const isValid =
    teamData.name.trim() &&
    teamData.age_group.trim() &&
    teamData.skill_level.trim() &&
    teamData.player_count > 0 &&
    teamData.sessions_per_week > 0 &&
    teamData.session_duration > 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '700px',
      margin: '0 auto',
      padding: theme.spacing.xl,
    }}>
      {/* Header */}
      <h2 style={{
        fontSize: theme.typography.fontSize['3xl'],
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
      }}>
        Create Your First Team
      </h2>
      <p style={{
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xl,
        textAlign: 'center',
        lineHeight: '1.6',
      }}>
        Set up your team details to start planning sessions
      </p>

      {/* Team Name */}
      <div style={{ marginBottom: theme.spacing.lg }}>
        <label style={{
          display: 'block',
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.xs,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Team Name *
        </label>
        <input
          type="text"
          value={teamData.name}
          onChange={(e) => setTeamData({ ...teamData, name: e.target.value })}
          placeholder="e.g., U12 Eagles"
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
          }}
          onBlur={(e) => {
            e.target.style.borderColor = theme.colors.border.primary;
          }}
        />
      </div>

      {/* Two Column Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
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
            Age Group *
          </label>
          <input
            type="text"
            value={teamData.age_group}
            onChange={(e) => setTeamData({ ...teamData, age_group: e.target.value })}
            placeholder="e.g., U12, U15"
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
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme.colors.border.primary;
            }}
          />
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
            Skill Level *
          </label>
          <input
            type="text"
            value={teamData.skill_level}
            onChange={(e) => setTeamData({ ...teamData, skill_level: e.target.value })}
            placeholder="e.g., Beginner, Intermediate"
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
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme.colors.border.primary;
            }}
          />
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
            Player Count *
          </label>
          <input
            type="number"
            value={teamData.player_count || ''}
            onChange={(e) => setTeamData({ ...teamData, player_count: parseInt(e.target.value) || 0 })}
            placeholder="e.g., 12"
            min="1"
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
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme.colors.border.primary;
            }}
          />
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
            Sessions Per Week *
          </label>
          <input
            type="number"
            value={teamData.sessions_per_week || ''}
            onChange={(e) => setTeamData({ ...teamData, sessions_per_week: parseInt(e.target.value) || 0 })}
            placeholder="e.g., 2"
            min="1"
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
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme.colors.border.primary;
            }}
          />
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
            Session Duration (min) *
          </label>
          <input
            type="number"
            value={teamData.session_duration || ''}
            onChange={(e) => setTeamData({ ...teamData, session_duration: parseInt(e.target.value) || 0 })}
            placeholder="e.g., 60"
            min="1"
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
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme.colors.border.primary;
            }}
          />
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
            Gender (Optional)
          </label>
          <select
            value={teamData.gender}
            onChange={(e) => setTeamData({ ...teamData, gender: e.target.value })}
            style={{
              width: '100%',
              padding: theme.spacing.md,
              fontSize: theme.typography.fontSize.base,
              color: teamData.gender ? theme.colors.text.primary : theme.colors.text.secondary,
              backgroundColor: theme.colors.background.primary,
              border: `2px solid ${theme.colors.border.primary}`,
              borderRadius: theme.borderRadius.md,
              outline: 'none',
              boxSizing: 'border-box',
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.7rem center',
              backgroundSize: '1.2em',
              paddingRight: '2.5rem',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = theme.colors.gold.main;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme.colors.border.primary;
            }}
          >
            <option value="">Select...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Co-Ed">Co-Ed</option>
          </select>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: theme.spacing.md,
        marginTop: theme.spacing.xl,
      }}>
        <button
          onClick={onBack}
          style={{
            padding: `${theme.spacing.md} ${theme.spacing.xl}`,
            backgroundColor: theme.colors.background.primary,
            color: theme.colors.text.primary,
            border: `2px solid ${theme.colors.border.primary}`,
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
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={!isValid}
          style={{
            padding: `${theme.spacing.md} ${theme.spacing.xl}`,
            backgroundColor: isValid ? theme.colors.gold.main : theme.colors.text.disabled,
            color: theme.colors.background.primary,
            border: 'none',
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            cursor: isValid ? 'pointer' : 'not-allowed',
            transition: theme.transitions.fast,
            opacity: isValid ? 1 : 0.6,
          }}
          onMouseEnter={(e) => {
            if (isValid) {
              e.currentTarget.style.backgroundColor = theme.colors.gold.light;
            }
          }}
          onMouseLeave={(e) => {
            if (isValid) {
              e.currentTarget.style.backgroundColor = theme.colors.gold.main;
            }
          }}
        >
          Create Team & Continue
        </button>
      </div>
    </div>
  );
};
