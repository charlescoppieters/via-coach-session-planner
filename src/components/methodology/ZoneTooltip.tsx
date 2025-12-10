'use client';

import React from 'react';
import { theme } from '@/styles/theme';
import type { ZoneTooltipProps } from './zoneTypes';

export const ZoneTooltip: React.FC<ZoneTooltipProps> = ({
  zone,
  x,
  y,
  readOnly = false,
}) => {
  // Truncate description if too long
  const maxDescLength = 150;
  const truncatedDesc = zone.description && zone.description.length > maxDescLength
    ? zone.description.substring(0, maxDescLength) + '...'
    : zone.description;

  // Offset tooltip from cursor
  const offsetX = 15;
  const offsetY = 15;

  return (
    <div
      style={{
        position: 'absolute',
        left: x + offsetX,
        top: y + offsetY,
        backgroundColor: theme.colors.background.primary,
        border: `1px solid ${theme.colors.border.primary}`,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        maxWidth: '280px',
        boxShadow: theme.shadows.lg,
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      {/* Zone color indicator and title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          marginBottom: zone.description ? theme.spacing.sm : 0,
        }}
      >
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '3px',
            backgroundColor: zone.color || theme.colors.gold.main,
            flexShrink: 0,
          }}
        />
        <h4
          style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            margin: 0,
          }}
        >
          {zone.title || 'Untitled Zone'}
        </h4>
      </div>

      {/* Description */}
      {truncatedDesc && (
        <p
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {truncatedDesc}
        </p>
      )}

      {/* Click hint - only show in edit mode */}
      {!readOnly && (
        <div
          style={{
            marginTop: theme.spacing.sm,
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.text.muted,
            fontStyle: 'italic',
          }}
        >
          Click to edit
        </div>
      )}
    </div>
  );
};
