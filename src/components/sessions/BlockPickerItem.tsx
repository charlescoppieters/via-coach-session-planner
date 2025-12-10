'use client';

import React from 'react';
import { FiClock } from 'react-icons/fi';
import { theme } from '@/styles/theme';
import { type SessionBlock } from '@/lib/sessionBlocks';

interface BlockPickerItemProps {
  block: SessionBlock;
  onClick: () => void;
}

export const BlockPickerItem: React.FC<BlockPickerItemProps> = ({
  block,
  onClick,
}) => {
  // Truncate description to ~80 characters
  const truncatedDescription = block.description
    ? block.description.length > 80
      ? block.description.substring(0, 80) + '...'
      : block.description
    : null;

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.borderRadius.md,
        border: `1px solid ${theme.colors.border.primary}`,
        padding: theme.spacing.md,
        cursor: 'pointer',
        transition: theme.transitions.fast,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.colors.gold.main;
        e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.colors.border.primary;
        e.currentTarget.style.backgroundColor = theme.colors.background.primary;
      }}
    >
      {/* Title Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: truncatedDescription ? theme.spacing.xs : 0,
        }}
      >
        <h4
          style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            margin: 0,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {block.title}
        </h4>

        {/* Duration Badge */}
        {block.duration && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              marginLeft: theme.spacing.sm,
              flexShrink: 0,
            }}
          >
            <FiClock size={12} style={{ color: theme.colors.text.muted }} />
            <span
              style={{
                color: theme.colors.text.muted,
                fontSize: theme.typography.fontSize.xs,
              }}
            >
              {block.duration} min
            </span>
          </div>
        )}
      </div>

      {/* Description Snippet */}
      {truncatedDescription && (
        <p
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {truncatedDescription}
        </p>
      )}
    </div>
  );
};
