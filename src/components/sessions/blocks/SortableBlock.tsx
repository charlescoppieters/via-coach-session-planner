'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RxDragHandleDots2 } from 'react-icons/rx';
import { theme } from '@/styles/theme';

interface SortableBlockProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const SortableBlock: React.FC<SortableBlockProps> = ({
  id,
  children,
  disabled = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'stretch',
        gap: theme.spacing.xs,
      }}
    >
      {/* Drag Handle */}
      {!disabled && (
        <div
          {...attributes}
          {...listeners}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            cursor: isDragging ? 'grabbing' : 'grab',
            color: theme.colors.text.muted,
            opacity: 0.5,
            transition: theme.transitions.fast,
            flexShrink: 0,
            marginTop: theme.spacing.md,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.color = theme.colors.text.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.5';
            e.currentTarget.style.color = theme.colors.text.muted;
          }}
        >
          <RxDragHandleDots2 size={18} />
        </div>
      )}

      {/* Block Content */}
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
};
