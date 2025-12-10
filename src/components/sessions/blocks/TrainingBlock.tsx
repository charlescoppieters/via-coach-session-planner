'use client';

import React from 'react';
import { FiClock } from 'react-icons/fi';
import { theme } from '@/styles/theme';
import { type AssignedBlock } from '@/lib/sessionBlocks';
import dynamic from 'next/dynamic';

// Dynamic import for TacticsBoard (uses canvas which needs client-side only)
const TacticsBoard = dynamic(
  () => import('@/components/tactics/TacticsBoard').then(mod => mod.TacticsBoard),
  { ssr: false, loading: () => <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.text.muted, fontSize: theme.typography.fontSize.sm }}>Loading...</div> }
);

interface TrainingBlockProps {
  block: AssignedBlock;
  onClick?: () => void;
  readOnly?: boolean;
}

export const TrainingBlock: React.FC<TrainingBlockProps> = ({
  block,
  onClick,
  readOnly = false,
}) => {
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
      {/* Title Header - lighter grey background */}
      <div
        style={{
          padding: theme.spacing.md,
          backgroundColor: theme.colors.background.tertiary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.spacing.md,
        }}
      >
        {/* Title and Empty State */}
        <div style={{ flex: 1 }}>
          <h4
            style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
              margin: 0,
            }}
          >
            {block.title}
          </h4>

          {/* Empty state indicator (no description, no image, no diagram) */}
          {!block.description && !block.coaching_points && !block.image_url && !(block.diagram_data && block.diagram_data.length > 0) && !readOnly && (
            <p
              style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.muted,
                margin: 0,
                marginTop: theme.spacing.xs,
                fontStyle: 'italic',
              }}
            >
              Click to add details
            </p>
          )}
        </div>

        {/* Duration Badge */}
        {block.duration && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              backgroundColor: theme.colors.background.secondary,
              borderRadius: theme.borderRadius.sm,
            }}
          >
            <FiClock size={14} style={{ color: theme.colors.text.muted }} />
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

      {/* Body Section - secondary (darker) background */}
      {(block.description || block.coaching_points || block.image_url || (block.diagram_data && block.diagram_data.length > 0)) && (
        <div
          style={{
            padding: theme.spacing.md,
            backgroundColor: theme.colors.background.secondary,
          }}
        >
          {/* Three columns when diagram/image exists: Diagram/Image | Description | Coaching Points */}
          {(block.diagram_data && block.diagram_data.length > 0) || block.image_url ? (
            <div
              style={{
                display: 'flex',
                gap: theme.spacing.lg,
              }}
            >
              {/* Left - Pitch Diagram (16:9 aspect ratio) */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    width: '100%',
                    paddingBottom: '56.25%', // 16:9 aspect ratio
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: theme.borderRadius.sm,
                  }}
                >
                  {block.diagram_data && block.diagram_data.length > 0 ? (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                      <TacticsBoard
                        initialData={{ elements: block.diagram_data, selectedTool: 'select', selectedElementId: null }}
                        readOnly
                      />
                    </div>
                  ) : block.image_url ? (
                    <img
                      src={block.image_url}
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
              </div>

              {/* Middle - Description */}
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
                    fontSize: theme.typography.fontSize.base,
                    color: block.description ? theme.colors.text.primary : theme.colors.text.muted,
                    margin: 0,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontStyle: block.description ? 'normal' : 'italic',
                  }}
                >
                  {block.description || 'No description'}
                </p>
              </div>

              {/* Right - Coaching Points */}
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
                    fontSize: theme.typography.fontSize.base,
                    color: block.coaching_points ? theme.colors.text.primary : theme.colors.text.muted,
                    margin: 0,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontStyle: block.coaching_points ? 'normal' : 'italic',
                  }}
                >
                  {block.coaching_points || 'No coaching points'}
                </p>
              </div>
            </div>
          ) : (
            /* Three columns when no image: Description (2/3) | Coaching Points (1/3) */
            <div
              style={{
                display: 'flex',
                gap: theme.spacing.lg,
              }}
            >
              {/* Left - Description (takes 2 columns worth) */}
              <div style={{ flex: 2 }}>
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
                    fontSize: theme.typography.fontSize.base,
                    color: block.description ? theme.colors.text.primary : theme.colors.text.muted,
                    margin: 0,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontStyle: block.description ? 'normal' : 'italic',
                  }}
                >
                  {block.description || 'No description'}
                </p>
              </div>

              {/* Right - Coaching Points */}
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
                    fontSize: theme.typography.fontSize.base,
                    color: block.coaching_points ? theme.colors.text.primary : theme.colors.text.muted,
                    margin: 0,
                    lineHeight: 1.6,
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
        </div>
      )}
    </div>
  );
};
