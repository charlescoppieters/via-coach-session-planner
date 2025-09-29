'use client'

import React from 'react';
import { theme } from "@/styles/theme";
import type { Team } from '@/types/database';

interface TeamFormProps {
  team: Team;
  isEditing: boolean;
  onChange: (field: keyof Team, value: string | number) => void;
}

export const TeamForm: React.FC<TeamFormProps> = ({
  team,
  isEditing,
  onChange,
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: theme.spacing.md,
        padding: theme.spacing.lg,
        backgroundColor: isEditing
          ? theme.colors.background.tertiary
          : theme.colors.background.secondary,
        borderRadius: theme.borderRadius.md,
        border: isEditing
          ? `1px solid ${theme.colors.gold.main}`
          : `1px solid rgba(212, 175, 55, 0.2)`,
      }}
    >
      {/* Age Group */}
      <div>
        <label
          style={{
            display: 'block',
            color: theme.colors.text.primary,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.bold,
            marginBottom: theme.spacing.xs,
          }}
        >
          Age Group
        </label>
        {isEditing ? (
          <input
            type="text"
            value={team.age_group}
            onChange={(e) => onChange('age_group', e.target.value)}
            placeholder="eg. U12"
            style={{
              width: '100%',
              padding: theme.spacing.sm,
              backgroundColor: theme.colors.background.secondary,
              border: `1px solid ${theme.colors.gold.main}`,
              borderRadius: theme.borderRadius.sm,
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.sm,
              fontFamily: theme.typography.fontFamily.primary,
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: theme.shadows.gold,
            }}
          />
        ) : (
          <div
            style={{
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.sm,
              lineHeight: 1.5,
              fontFamily: theme.typography.fontFamily.primary,
            }}
          >
            {team.age_group}
          </div>
        )}
      </div>

      {/* Player Count */}
      <div>
        <label
          style={{
            display: 'block',
            color: theme.colors.text.primary,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.bold,
            marginBottom: theme.spacing.xs,
          }}
        >
          Player Count
        </label>
        {isEditing ? (
          <input
            type="number"
            value={team.player_count === 0 ? '' : team.player_count}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                onChange('player_count', '');
              } else {
                const num = parseInt(value);
                onChange('player_count', isNaN(num) ? 0 : Math.max(0, num));
              }
            }}
            onBlur={(e) => {
              if (e.target.value === '') {
                onChange('player_count', 0);
              }
            }}
            min="0"
            placeholder="0"
            style={{
              width: '100%',
              padding: theme.spacing.sm,
              backgroundColor: theme.colors.background.secondary,
              border: `1px solid ${theme.colors.gold.main}`,
              borderRadius: theme.borderRadius.sm,
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.sm,
              fontFamily: theme.typography.fontFamily.primary,
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: theme.shadows.gold,
            }}
          />
        ) : (
          <div
            style={{
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.sm,
              lineHeight: 1.5,
              fontFamily: theme.typography.fontFamily.primary,
            }}
          >
            {team.player_count}
          </div>
        )}
      </div>

      {/* Sessions Per Week */}
      <div>
        <label
          style={{
            display: 'block',
            color: theme.colors.text.primary,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.bold,
            marginBottom: theme.spacing.xs,
          }}
        >
          Sessions Per Week
        </label>
        {isEditing ? (
          <input
            type="number"
            value={team.sessions_per_week === 0 ? '' : team.sessions_per_week}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                onChange('sessions_per_week', '');
              } else {
                const num = parseInt(value);
                onChange('sessions_per_week', isNaN(num) ? 0 : Math.max(0, num));
              }
            }}
            onBlur={(e) => {
              if (e.target.value === '') {
                onChange('sessions_per_week', 0);
              }
            }}
            min="0"
            placeholder="0"
            style={{
              width: '100%',
              padding: theme.spacing.sm,
              backgroundColor: theme.colors.background.secondary,
              border: `1px solid ${theme.colors.gold.main}`,
              borderRadius: theme.borderRadius.sm,
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.sm,
              fontFamily: theme.typography.fontFamily.primary,
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: theme.shadows.gold,
            }}
          />
        ) : (
          <div
            style={{
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.sm,
              lineHeight: 1.5,
              fontFamily: theme.typography.fontFamily.primary,
            }}
          >
            {team.sessions_per_week}
          </div>
        )}
      </div>

      {/* Session Duration */}
      <div>
        <label
          style={{
            display: 'block',
            color: theme.colors.text.primary,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.bold,
            marginBottom: theme.spacing.xs,
          }}
        >
          Session Duration
        </label>
        {isEditing ? (
          <input
            type="number"
            value={team.session_duration === 0 ? '' : team.session_duration}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                onChange('session_duration', '');
              } else {
                const num = parseInt(value);
                onChange('session_duration', isNaN(num) ? 0 : Math.max(0, num));
              }
            }}
            onBlur={(e) => {
              if (e.target.value === '') {
                onChange('session_duration', 0);
              }
            }}
            min="0"
            placeholder="0"
            style={{
              width: '100%',
              padding: theme.spacing.sm,
              backgroundColor: theme.colors.background.secondary,
              border: `1px solid ${theme.colors.gold.main}`,
              borderRadius: theme.borderRadius.sm,
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.sm,
              fontFamily: theme.typography.fontFamily.primary,
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: theme.shadows.gold,
            }}
          />
        ) : (
          <div
            style={{
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.sm,
              lineHeight: 1.5,
              fontFamily: theme.typography.fontFamily.primary,
            }}
          >
            {team.session_duration}
          </div>
        )}
      </div>

    </div>
  );
};