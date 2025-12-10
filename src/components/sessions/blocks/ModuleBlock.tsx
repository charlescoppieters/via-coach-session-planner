'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiTrash2, FiImage } from 'react-icons/fi';
import { theme } from '@/styles/theme';
import type { ModuleBlock as ModuleBlockType } from '@/lib/sessionBlocks';

interface ModuleBlockProps {
  block: ModuleBlockType;
  onUpdate: (updates: Partial<ModuleBlockType>) => void;
  onDelete: () => void;
  readOnly?: boolean;
}

export const ModuleBlock: React.FC<ModuleBlockProps> = ({
  block,
  onUpdate,
  onDelete,
  readOnly = false,
}) => {
  const [title, setTitle] = useState(block.module_title);
  const [body, setBody] = useState(block.module_body);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTitle(block.module_title);
    setBody(block.module_body);
  }, [block.module_title, block.module_body]);

  useEffect(() => {
    if (isEditingTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [isEditingTitle]);

  // Auto-resize textarea
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.style.height = 'auto';
      bodyRef.current.style.height = `${bodyRef.current.scrollHeight}px`;
    }
  }, [body]);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title !== block.module_title) {
      onUpdate({ module_title: title });
    }
  };

  const handleBodyBlur = () => {
    if (body !== block.module_body) {
      onUpdate({ module_body: body });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
      // Focus body after title
      bodyRef.current?.focus();
    }
    if (e.key === 'Escape') {
      setTitle(block.module_title);
      handleTitleBlur();
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
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        border: `1px solid ${theme.colors.border.primary}`,
      }}
    >
      {/* Header with title and actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: theme.spacing.sm,
          marginBottom: theme.spacing.sm,
        }}
      >
        {/* Title */}
        <div style={{ flex: 1 }}>
          {isEditingTitle && !readOnly ? (
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              placeholder="Module title..."
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: `1px solid ${theme.colors.border.primary}`,
                color: theme.colors.text.primary,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                outline: 'none',
                width: '100%',
                padding: '2px 0',
              }}
            />
          ) : (
            <div
              onClick={() => !readOnly && setIsEditingTitle(true)}
              style={{
                color: title ? theme.colors.text.primary : theme.colors.text.muted,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                cursor: readOnly ? 'default' : 'text',
                padding: '2px 0',
                minHeight: '24px',
              }}
            >
              {title || (!readOnly && 'Click to add title...')}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!readOnly && (
          <div style={{ display: 'flex', gap: theme.spacing.xs }}>
            {/* Image button (future feature) */}
            <button
              onClick={() => {
                // TODO: Implement image upload
                alert('Image upload coming soon!');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.text.muted,
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
                e.currentTarget.style.color = theme.colors.text.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.6';
                e.currentTarget.style.color = theme.colors.text.muted;
              }}
              title="Add image"
            >
              <FiImage size={16} />
            </button>

            {/* Delete button */}
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
              title={showDeleteConfirm ? 'Click again to confirm' : 'Delete module'}
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Body text */}
      {readOnly ? (
        <div
          style={{
            color: body ? theme.colors.text.primary : theme.colors.text.muted,
            fontSize: theme.typography.fontSize.sm,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            minHeight: '40px',
          }}
        >
          {body || 'No content'}
        </div>
      ) : (
        <textarea
          ref={bodyRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onBlur={handleBodyBlur}
          placeholder="Describe this activity..."
          style={{
            background: 'transparent',
            border: 'none',
            color: theme.colors.text.primary,
            fontSize: theme.typography.fontSize.sm,
            lineHeight: 1.6,
            outline: 'none',
            width: '100%',
            resize: 'none',
            minHeight: '60px',
            padding: 0,
            fontFamily: 'inherit',
          }}
        />
      )}

      {/* Image preview (if exists) */}
      {block.module_image_url && (
        <div
          style={{
            marginTop: theme.spacing.md,
            borderRadius: theme.borderRadius.sm,
            overflow: 'hidden',
          }}
        >
          <img
            src={block.module_image_url}
            alt="Module illustration"
            style={{
              width: '100%',
              maxHeight: '200px',
              objectFit: 'cover',
            }}
          />
        </div>
      )}
    </div>
  );
};
