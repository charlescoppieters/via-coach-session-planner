'use client';

import React from 'react';
import { FiPlus } from 'react-icons/fi';
import { theme } from '@/styles/theme';
import { type AssignedBlock, type BlockGroup as BlockGroupType } from '@/lib/sessionBlocks';
import { TrainingBlockVertical } from './TrainingBlockVertical';

interface BlockGroupProps {
  group: BlockGroupType;
  onBlockClick: (block: AssignedBlock) => void;
  onAddSimultaneous: (position: number) => void;
  onRemoveBlock: (assignmentId: string) => void;
  readOnly?: boolean;
}

export const BlockGroup: React.FC<BlockGroupProps> = ({
  group,
  onBlockClick,
  onAddSimultaneous,
  onRemoveBlock,
  readOnly = false,
}) => {
  const hasTwoPractices = group.practices.length === 2;
  const canAddSimultaneous = !hasTwoPractices && !readOnly;
  const primaryPractice = group.practices[0];
  const simultaneousPractice = group.practices[1];

  return (
    <div
      style={{
        display: 'flex',
        gap: theme.spacing.md,
        alignItems: 'stretch',
        minHeight: '350px',
        minWidth: 'fit-content',
      }}
    >
      {/* Primary practice (slot 0) - vertical layout */}
      <div style={{ flex: 1, display: 'flex', minWidth: '700px' }}>
        <div style={{ flex: 1 }}>
          <TrainingBlockVertical
            block={primaryPractice}
            onClick={() => onBlockClick(primaryPractice)}
            onRemove={hasTwoPractices ? () => onRemoveBlock(primaryPractice.assignment_id) : undefined}
            readOnly={readOnly}
            showDurationBadge={true}
          />
        </div>
      </div>

      {/* Simultaneous practice (slot 1) OR Add button OR placeholder */}
      {hasTwoPractices ? (
        <div style={{ flex: 1, display: 'flex', minWidth: '700px' }}>
          <div style={{ flex: 1 }}>
            <TrainingBlockVertical
              block={simultaneousPractice!}
              onClick={() => onBlockClick(simultaneousPractice!)}
              onRemove={() => onRemoveBlock(simultaneousPractice!.assignment_id)}
              readOnly={readOnly}
              showDurationBadge={true}
            />
          </div>
        </div>
      ) : canAddSimultaneous ? (
        <div style={{ flex: 1, display: 'flex', minWidth: '700px' }}>
          <button
            onClick={() => onAddSimultaneous(group.position)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.sm,
              backgroundColor: 'transparent',
              border: `2px dashed ${theme.colors.border.primary}`,
              borderRadius: theme.borderRadius.md,
              color: theme.colors.text.muted,
              cursor: 'pointer',
              transition: theme.transitions.fast,
              fontSize: theme.typography.fontSize.sm,
              padding: theme.spacing.md,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.colors.gold.main;
              e.currentTarget.style.color = theme.colors.gold.main;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.colors.border.primary;
              e.currentTarget.style.color = theme.colors.text.muted;
            }}
            title="Add simultaneous practice"
          >
            <FiPlus size={32} style={{ opacity: 0.6 }} />
            <span
              style={{
                opacity: 0.6,
                fontSize: theme.typography.fontSize.base,
                textAlign: 'center',
              }}
            >
              Add Simultaneous Practice
            </span>
          </button>
        </div>
      ) : (
        // Placeholder in view mode to maintain consistent sizing
        <div style={{ flex: 1, minWidth: '700px' }} />
      )}
    </div>
  );
};
