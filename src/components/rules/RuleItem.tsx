'use client'

import React, { useState, useEffect, useRef } from 'react';
import { FaEdit, FaRegTrashAlt } from "react-icons/fa";
import { theme } from "@/styles/theme";

export interface RuleItemProps {
  rule: {
    id: string;
    content: string;
    category?: string | null;
    is_active: boolean;
    isEditing?: boolean;
  };
  onEdit: (ruleId: string) => void;
  onSave: (ruleId: string, newContent: string) => void;
  onCancel: (ruleId: string) => void;
  onDelete: (ruleId: string) => void;
  onToggleActive: (ruleId: string) => void;
}

export const RuleItem: React.FC<RuleItemProps> = ({
  rule,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onToggleActive,
}) => {
  const [editContent, setEditContent] = useState(rule.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditContent(rule.content);
  }, [rule.content]);

  // Auto-resize textarea to fit content and auto-focus when editing
  useEffect(() => {
    if (rule.isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(80, textarea.scrollHeight) + 'px';

      // Auto-focus and position cursor at end of text
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  }, [rule.isEditing, editContent]);

  return (
    <div
      style={{
        padding: theme.spacing.lg,
        backgroundColor: rule.is_active ? theme.colors.background.tertiary : theme.colors.background.secondary,
        borderRadius: theme.borderRadius.md,
        borderLeft: rule.isEditing ? 'none' : `3px solid ${rule.is_active ? theme.colors.gold.main : 'transparent'}`,
        opacity: rule.is_active ? 1 : 0.6,
        transition: theme.transitions.fast,
      }}
    >
      {rule.isEditing ? (
        // Edit Mode
        <>
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            style={{
              width: '100%',
              padding: theme.spacing.md,
              backgroundColor: theme.colors.background.secondary,
              border: `1px solid ${theme.colors.gold.main}`,
              borderRadius: theme.borderRadius.sm,
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.sm,
              fontFamily: theme.typography.fontFamily.primary,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: theme.shadows.gold,
              overflow: 'hidden',
            }}
          />
          <div
            style={{
              display: 'flex',
              gap: theme.spacing.sm,
              marginTop: theme.spacing.md,
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={() => onCancel(rule.id)}
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                backgroundColor: theme.colors.background.primary,
                color: theme.colors.text.primary,
                border: 'none',
                borderRadius: theme.borderRadius.sm,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.semibold,
                cursor: 'pointer',
                transition: theme.transitions.fast,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.background.primary;
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(rule.id, editContent)}
              disabled={!editContent.trim()}
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                backgroundColor: theme.colors.gold.main,
                color: theme.colors.background.primary,
                border: 'none',
                borderRadius: theme.borderRadius.sm,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.semibold,
                cursor: editContent.trim() ? 'pointer' : 'not-allowed',
                opacity: editContent.trim() ? 1 : 0.5,
                transition: theme.transitions.fast,
              }}
              onMouseEnter={(e) => {
                if (editContent.trim()) {
                  e.currentTarget.style.backgroundColor = theme.colors.gold.light;
                }
              }}
              onMouseLeave={(e) => {
                if (editContent.trim()) {
                  e.currentTarget.style.backgroundColor = theme.colors.gold.main;
                }
              }}
            >
              Save
            </button>
          </div>
        </>
      ) : (
        // View Mode
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: theme.spacing.md,
            }}
          >
            <div
              style={{
                color: theme.colors.text.primary,
                fontSize: theme.typography.fontSize.sm,
                lineHeight: 1.5,
                margin: 0,
                flex: 1,
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
              }}
            >
              {rule.content}
            </div>
            <div
              style={{
                display: 'flex',
                gap: theme.spacing.xs,
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => onToggleActive(rule.id)}
                style={{
                  padding: theme.spacing.sm,
                  backgroundColor: 'transparent',
                  color: rule.is_active ? theme.colors.gold.main : theme.colors.text.muted,
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  fontSize: '24px',
                  cursor: 'pointer',
                  transition: theme.transitions.fast,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={rule.is_active ? 'Deactivate rule' : 'Activate rule'}
              >
                {rule.is_active ? '●' : '○'}
              </button>
              <button
                onClick={() => onEdit(rule.id)}
                style={{
                  padding: theme.spacing.xs,
                  backgroundColor: 'transparent',
                  color: theme.colors.text.muted,
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  cursor: 'pointer',
                  transition: theme.transitions.fast,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.colors.text.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.colors.text.muted;
                }}
                title="Edit rule"
              >
                <FaEdit size={16} />
              </button>
              <button
                onClick={() => onDelete(rule.id)}
                style={{
                  padding: theme.spacing.xs,
                  backgroundColor: 'transparent',
                  color: theme.colors.text.muted,
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  cursor: 'pointer',
                  transition: theme.transitions.fast,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.colors.status.error;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.colors.text.muted;
                }}
                title="Delete rule"
              >
                <FaRegTrashAlt size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};