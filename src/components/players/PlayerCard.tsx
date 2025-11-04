import React from 'react';
import { theme } from '@/styles/theme';
import type { Player } from '@/types/database';

interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  onClick: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, isSelected, onClick }) => {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
        {/* Player Name and Details */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            marginBottom: '2px',
          }}>
            {player.name}
          </div>
          <div style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            display: 'flex',
            gap: theme.spacing.sm,
          }}>
            {player.age && <span>{player.age}</span>}
            {player.age && player.gender && <span>•</span>}
            {player.gender && <span>{player.gender.toUpperCase()}</span>}
            {(player.age || player.gender) && player.position && <span>•</span>}
            {player.position && <span>{player.position}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
