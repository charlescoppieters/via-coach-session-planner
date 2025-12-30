'use client';

import React from 'react';
import { theme } from '@/styles/theme';
import type { Player } from '@/types/database';

interface PlayerToggleRowProps {
  player: Player;
  isIncluded: boolean;
  onToggle: (included: boolean) => void;
  disabled?: boolean;
}

export const PlayerToggleRow: React.FC<PlayerToggleRowProps> = ({
  player,
  isIncluded,
  onToggle,
  disabled = false,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        backgroundColor: isIncluded
          ? theme.colors.background.secondary
          : theme.colors.background.primary,
        borderRadius: theme.borderRadius.md,
        border: `1px solid ${theme.colors.border.primary}`,
        opacity: disabled ? 0.6 : 1,
        transition: theme.transitions.fast,
      }}
    >
      {/* Player info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
        {/* Player indicator dot */}
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isIncluded
              ? theme.colors.gold.main
              : theme.colors.text.muted,
            transition: theme.transitions.fast,
          }}
        />
        <div>
          <span
            style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
              color: isIncluded
                ? theme.colors.text.primary
                : theme.colors.text.muted,
            }}
          >
            {player.name}
          </span>
          {player.position && (
            <span
              style={{
                marginLeft: theme.spacing.sm,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.muted,
              }}
            >
              ({player.position})
            </span>
          )}
        </div>
      </div>

      {/* Toggle switch */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onToggle(!isIncluded);
        }}
        disabled={disabled}
        style={{
          width: '48px',
          height: '26px',
          borderRadius: '13px',
          backgroundColor: isIncluded
            ? theme.colors.gold.main
            : theme.colors.background.tertiary,
          border: `1px solid ${isIncluded ? theme.colors.gold.main : theme.colors.border.primary}`,
          cursor: disabled ? 'not-allowed' : 'pointer',
          position: 'relative',
          transition: theme.transitions.fast,
          padding: 0,
        }}
      >
        {/* Toggle knob */}
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: isIncluded ? '24px' : '2px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: isIncluded
              ? theme.colors.background.primary
              : theme.colors.text.muted,
            transition: theme.transitions.fast,
          }}
        />
      </button>
    </div>
  );
};
