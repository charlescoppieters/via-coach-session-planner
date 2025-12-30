'use client';

import React from 'react';
import { FiClock, FiX } from 'react-icons/fi';
import { theme } from '@/styles/theme';
import { type AssignedBlock } from '@/lib/sessionBlocks';
import dynamic from 'next/dynamic';

// Dynamic import for TacticsBoard (uses canvas which needs client-side only)
const TacticsBoard = dynamic(
  () => import('@/components/tactics/TacticsBoard').then(mod => mod.TacticsBoard),
  { ssr: false, loading: () => <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.text.muted, fontSize: theme.typography.fontSize.sm }}>Loading...</div> }
);

interface TrainingBlockVerticalProps {
  block: AssignedBlock;
  onClick?: () => void;
  onRemove?: () => void;
  readOnly?: boolean;
  showDurationBadge?: boolean;
}

export const TrainingBlockVertical: React.FC<TrainingBlockVerticalProps> = ({
  block,
  onClick,
  onRemove,
  readOnly = false,
  showDurationBadge = true,
}) => {
  const hasDiagram = block.diagram_data && block.diagram_data.length > 0;
  const hasImage = block.image_url;
  const hasVisual = hasDiagram || hasImage;

  return (
    <div
      onClick={!readOnly ? onClick : undefined}
      style={{
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.md,
        border: `1px solid ${theme.colors.border.primary}`,
        overflow: 'hidden',
        cursor: readOnly ? 'default' : 'pointer',
        transition: theme.transitions.fast,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!readOnly) {
          e.currentTarget.style.borderColor = theme.colors.gold.main;
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (!readOnly) {
          e.currentTarget.style.borderColor = theme.colors.border.primary;
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {/* Remove button (only shown when onRemove is provided) */}
      {onRemove && !readOnly && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            position: 'absolute',
            top: theme.spacing.xs,
            right: theme.spacing.xs,
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            border: 'none',
            color: theme.colors.text.primary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            transition: theme.transitions.fast,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.status.error;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          }}
          title="Remove from group"
        >
          <FiX size={14} />
        </button>
      )}

      {/* Title Header */}
      <div
        style={{
          padding: theme.spacing.md,
          backgroundColor: theme.colors.background.tertiary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.spacing.sm,
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
        {showDurationBadge && block.duration && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              backgroundColor: theme.colors.background.secondary,
              borderRadius: theme.borderRadius.sm,
              flexShrink: 0,
            }}
          >
            <FiClock size={12} style={{ color: theme.colors.text.muted }} />
            <span
              style={{
                color: theme.colors.text.primary,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.semibold,
              }}
            >
              {block.duration}
            </span>
            <span
              style={{
                color: theme.colors.text.muted,
                fontSize: theme.typography.fontSize.xs,
              }}
            >
              min
            </span>
          </div>
        )}
      </div>

      {/* Body Section - Vertical Layout */}
      <div
        style={{
          flex: 1,
          padding: theme.spacing.md,
          backgroundColor: theme.colors.background.secondary,
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.md,
          overflow: 'hidden',
        }}
      >
        {/* Pitch Diagram / Image (16:9 aspect ratio) */}
        {hasVisual && (
          <div
            style={{
              width: '100%',
              paddingBottom: '56.25%', // 16:9 aspect ratio
              position: 'relative',
              overflow: 'hidden',
              borderRadius: theme.borderRadius.sm,
              flexShrink: 0,
            }}
          >
            {hasDiagram ? (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                <TacticsBoard
                  initialData={{ elements: block.diagram_data!, selectedTool: 'select', selectedElementId: null }}
                  readOnly
                />
              </div>
            ) : hasImage ? (
              <img
                src={block.image_url!}
                alt={block.title}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : null}
          </div>
        )}

        {/* Description and Coaching Points - Side by Side */}
        {(block.description || block.coaching_points || !readOnly) && (
          <div
            style={{
              display: 'flex',
              gap: theme.spacing.md,
              flex: 1,
            }}
          >
            {/* Description */}
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text.secondary,
                  margin: 0,
                  marginBottom: theme.spacing.xs,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Description
              </p>
              <p
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: block.description ? theme.colors.text.primary : theme.colors.text.muted,
                  margin: 0,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontStyle: block.description ? 'normal' : 'italic',
                }}
              >
                {block.description || 'No description'}
              </p>
            </div>

            {/* Coaching Points */}
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text.secondary,
                  margin: 0,
                  marginBottom: theme.spacing.xs,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Coaching Points
              </p>
              <p
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: block.coaching_points ? theme.colors.text.primary : theme.colors.text.muted,
                  margin: 0,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontStyle: block.coaching_points ? 'normal' : 'italic',
                }}
              >
                {block.coaching_points || 'No coaching points'}
              </p>
            </div>
          </div>
        )}

        {/* Empty state indicator */}
        {!block.description && !block.coaching_points && !hasVisual && !readOnly && (
          <p
            style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.text.muted,
              margin: 0,
              fontStyle: 'italic',
              textAlign: 'center',
              padding: theme.spacing.md,
            }}
          >
            Click to add details
          </p>
        )}
      </div>
    </div>
  );
};
