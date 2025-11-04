'use client'

import React from 'react';
import { theme } from "@/styles/theme";
import type { Team } from '@/types/database';

interface TeamCardProps {
  team: Team;
  isSelected: boolean;
  onClick: () => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  isSelected,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        padding: theme.spacing.md,
        backgroundColor: isSelected ? 'rgba(239, 191, 4, 0.1)' : 'transparent',
        border: isSelected ? `2px solid ${theme.colors.gold.main}` : '2px solid transparent',
        borderRadius: theme.borderRadius.md,
        cursor: 'pointer',
        transition: theme.transitions.fast,
        marginBottom: theme.spacing.sm,
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4)',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent';
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
        {team.name}
      </h4>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: theme.spacing.xs,
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
        }}
      >
        <span>{team.age_group}</span>
        <span>{team.session_duration} min</span>
        <span>{team.player_count} players</span>
        <span>{team.sessions_per_week}x/week</span>
      </div>
    </div>
  );
};