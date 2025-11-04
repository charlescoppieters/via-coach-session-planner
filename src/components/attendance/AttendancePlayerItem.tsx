'use client'

import React from 'react';
import { theme } from '@/styles/theme';
import { MdComment } from 'react-icons/md';
import type { Player } from '@/types/database';

interface AttendancePlayerItemProps {
  player: Player;
  isAttending: boolean;
  hasNotes: boolean;
  onToggle: (playerId: string) => void;
  onComment: (playerId: string) => void;
}

export const AttendancePlayerItem: React.FC<AttendancePlayerItemProps> = ({
  player,
  isAttending,
  hasNotes,
  onToggle,
  onComment,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.md,
        padding: theme.spacing.md,
        backgroundColor: isAttending
          ? theme.colors.background.tertiary
          : theme.colors.background.secondary,
        borderRadius: theme.borderRadius.md,
        borderLeft: `3px solid ${isAttending ? theme.colors.gold.main : 'transparent'}`,
        opacity: isAttending ? 1 : 0.6,
        transition: theme.transitions.fast,
      }}
    >
      {/* Player Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {player.name}
        </div>
        {player.position && (
          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              marginTop: '2px',
            }}
          >
            {player.position}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: theme.spacing.xs, alignItems: 'center' }}>
        {/* Comment Button */}
        <button
          onClick={() => onComment(player.id)}
          title="Add notes for this player"
          style={{
            padding: theme.spacing.sm,
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: hasNotes ? theme.colors.gold.main : theme.colors.text.muted,
            fontSize: theme.typography.fontSize.xl,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: theme.transitions.fast,
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <MdComment />
        </button>

        {/* Toggle Button */}
        <button
          onClick={() => onToggle(player.id)}
          title={isAttending ? 'Mark as absent' : 'Mark as present'}
          style={{
            padding: theme.spacing.sm,
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: isAttending ? theme.colors.gold.main : theme.colors.text.muted,
            fontSize: theme.typography.fontSize['2xl'],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: theme.transitions.fast,
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isAttending ? '●' : '○'}
        </button>
      </div>
    </div>
  );
};
