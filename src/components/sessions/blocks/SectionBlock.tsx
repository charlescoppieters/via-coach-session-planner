'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { FiTrash2 } from 'react-icons/fi';
import { theme } from '@/styles/theme';
import type { SectionBlock as SectionBlockType } from '@/lib/sessionBlocks';

interface SectionBlockProps {
  block: SectionBlockType;
  onUpdate: (updates: Partial<SectionBlockType>) => void;
  onDelete: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  collapsedCount?: number;
  readOnly?: boolean;
}

export const SectionBlock: React.FC<SectionBlockProps> = ({
  block,
  onUpdate,
  onDelete,
  isCollapsed,
  onToggleCollapse,
  collapsedCount = 0,
  readOnly = false,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [title, setTitle] = useState(block.section_title);
  const [subtitle, setSubtitle] = useState(block.section_subtitle || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const subtitleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(block.section_title);
    setSubtitle(block.section_subtitle || '');
  }, [block.section_title, block.section_subtitle]);

  useEffect(() => {
    if (isEditingTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingSubtitle && subtitleRef.current) {
      subtitleRef.current.focus();
      subtitleRef.current.select();
    }
  }, [isEditingSubtitle]);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title !== block.section_title) {
      onUpdate({ section_title: title });
    }
  };

  const handleSubtitleBlur = () => {
    setIsEditingSubtitle(false);
    if (subtitle !== (block.section_subtitle || '')) {
      onUpdate({ section_subtitle: subtitle || null });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, onBlur: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onBlur();
    }
    if (e.key === 'Escape') {
      setTitle(block.section_title);
      setSubtitle(block.section_subtitle || '');
      onBlur();
    }
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete();
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div
      style={{
        backgroundColor: theme.colors.background.tertiary,
        borderLeft: `4px solid ${theme.colors.gold.main}`,
        borderRadius: theme.borderRadius.md,
        padding: `${theme.spacing.md} ${theme.spacing.lg}`,
        marginBottom: theme.spacing.sm,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
        }}
      >
        {/* Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.gold.main,
            cursor: 'pointer',
            padding: theme.spacing.xs,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: theme.transitions.fast,
          }}
          title={isCollapsed ? 'Expand section' : 'Collapse section'}
        >
          {isCollapsed ? <FaChevronRight size={14} /> : <FaChevronDown size={14} />}
        </button>

        {/* Title and Subtitle */}
        <div style={{ flex: 1 }}>
          {isEditingTitle && !readOnly ? (
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => handleKeyDown(e, handleTitleBlur)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: `1px solid ${theme.colors.gold.main}`,
                color: theme.colors.gold.main,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.bold,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                outline: 'none',
                width: '100%',
                padding: '2px 0',
              }}
            />
          ) : (
            <div
              onClick={() => !readOnly && setIsEditingTitle(true)}
              style={{
                color: theme.colors.gold.main,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.bold,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: readOnly ? 'default' : 'text',
                padding: '2px 0',
              }}
            >
              {title}
              {isCollapsed && collapsedCount > 0 && (
                <span
                  style={{
                    marginLeft: theme.spacing.sm,
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.text.muted,
                    fontWeight: theme.typography.fontWeight.normal,
                    textTransform: 'none',
                  }}
                >
                  ({collapsedCount} module{collapsedCount !== 1 ? 's' : ''})
                </span>
              )}
            </div>
          )}

          {isEditingSubtitle && !readOnly ? (
            <input
              ref={subtitleRef}
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              onBlur={handleSubtitleBlur}
              onKeyDown={(e) => handleKeyDown(e, handleSubtitleBlur)}
              placeholder="Add subtitle..."
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: `1px solid ${theme.colors.border.primary}`,
                color: theme.colors.text.secondary,
                fontSize: theme.typography.fontSize.sm,
                outline: 'none',
                width: '100%',
                padding: '2px 0',
                marginTop: '2px',
              }}
            />
          ) : (
            <div
              onClick={() => !readOnly && setIsEditingSubtitle(true)}
              style={{
                color: theme.colors.text.secondary,
                fontSize: theme.typography.fontSize.sm,
                cursor: readOnly ? 'default' : 'text',
                padding: '2px 0',
                marginTop: '2px',
                minHeight: '20px',
              }}
            >
              {subtitle || (!readOnly && <span style={{ opacity: 0.5 }}>Add subtitle...</span>)}
            </div>
          )}
        </div>

        {/* Delete Button */}
        {!readOnly && (
          <button
            onClick={handleDelete}
            style={{
              background: 'none',
              border: 'none',
              color: showDeleteConfirm ? theme.colors.status.error : theme.colors.text.muted,
              cursor: 'pointer',
              padding: theme.spacing.xs,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: theme.transitions.fast,
              opacity: 0.6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.color = theme.colors.status.error;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.6';
              e.currentTarget.style.color = showDeleteConfirm
                ? theme.colors.status.error
                : theme.colors.text.muted;
            }}
            title={showDeleteConfirm ? 'Click again to confirm' : 'Delete section'}
          >
            <FiTrash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
