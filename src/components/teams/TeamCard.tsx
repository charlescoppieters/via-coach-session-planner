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
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        background: isSelected
          ? theme.colors.gold.main
          : `linear-gradient(135deg, ${theme.colors.background.tertiary} 0%, ${theme.colors.background.secondary} 100%)`,
        cursor: 'pointer',
        transition: theme.transitions.fast,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
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
          color: isSelected ? theme.colors.text.primary : theme.colors.text.muted,
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