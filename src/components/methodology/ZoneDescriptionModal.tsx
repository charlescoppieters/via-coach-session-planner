'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiTrash2 } from 'react-icons/fi';
import { theme } from '@/styles/theme';
import { type PitchZone, type ZoneDescriptionModalProps, ZONE_COLORS } from './zoneTypes';

export const ZoneDescriptionModal: React.FC<ZoneDescriptionModalProps> = ({
  zone,
  onSave,
  onDelete,
  onCancel,
}) => {
  const [title, setTitle] = useState(zone?.title || '');
  const [description, setDescription] = useState(zone?.description || '');
  const [color, setColor] = useState(zone?.color || ZONE_COLORS[0]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset form when zone changes
  useEffect(() => {
    if (zone) {
      setTitle(zone.title || '');
      setDescription(zone.description || '');
      setColor(zone.color || ZONE_COLORS[0]);
    }
  }, [zone]);

  // Lock body scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleSave = () => {
    if (!zone || !title.trim()) return;

    const updatedZone: PitchZone = {
      ...zone,
      title: title.trim(),
      description: description.trim(),
      color,
    };

    onSave(updatedZone);
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete?.();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  if (!zone) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: theme.colors.background.secondary,
            borderRadius: theme.borderRadius.lg,
            width: '95%',
            maxWidth: '500px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: theme.spacing.lg,
              borderBottom: `1px solid ${theme.colors.border.primary}`,
            }}
          >
            <h2
              style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                margin: 0,
              }}
            >
              Edit Zone
            </h2>
            <button
              onClick={onCancel}
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.text.muted,
                cursor: 'pointer',
                padding: theme.spacing.xs,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Content */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: theme.spacing.lg,
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing.lg,
            }}
          >
            {/* Title Input */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.xs,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Zone Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Left Wing Attack Zone"
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.text.primary,
                  backgroundColor: theme.colors.background.primary,
                  border: `1px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.colors.gold.main;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.colors.border.primary;
                }}
              />
            </div>

            {/* Description Textarea */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.xs,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Description / Goals
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose of this zone, tactical objectives, player responsibilities..."
                rows={5}
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.text.primary,
                  backgroundColor: theme.colors.background.primary,
                  border: `1px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  minHeight: '120px',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.colors.gold.main;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.colors.border.primary;
                }}
              />
            </div>

            {/* Color Picker */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.sm,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Zone Color
              </label>
              <div
                style={{
                  display: 'flex',
                  gap: theme.spacing.sm,
                  flexWrap: 'wrap',
                }}
              >
                {ZONE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: theme.borderRadius.md,
                      backgroundColor: c,
                      border: color === c
                        ? `3px solid ${theme.colors.gold.main}`
                        : `2px solid ${theme.colors.border.primary}`,
                      cursor: 'pointer',
                      transition: theme.transitions.fast,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: theme.spacing.lg,
              borderTop: `1px solid ${theme.colors.border.primary}`,
              gap: theme.spacing.md,
            }}
          >
            {/* Delete Button */}
            {onDelete && (
              <button
                onClick={handleDelete}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  backgroundColor: showDeleteConfirm ? '#EF4444' : 'transparent',
                  color: showDeleteConfirm ? 'white' : '#EF4444',
                  border: showDeleteConfirm ? 'none' : '1px solid #EF4444',
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  cursor: 'pointer',
                  transition: theme.transitions.fast,
                }}
              >
                <FiTrash2 size={16} />
                {showDeleteConfirm ? 'Confirm Delete' : 'Delete Zone'}
              </button>
            )}

            <div style={{ display: 'flex', gap: theme.spacing.md, marginLeft: 'auto' }}>
              {/* Cancel Button */}
              <button
                onClick={onCancel}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  backgroundColor: 'transparent',
                  color: theme.colors.text.secondary,
                  border: `1px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.medium,
                  cursor: 'pointer',
                  transition: theme.transitions.fast,
                }}
              >
                Cancel
              </button>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={!title.trim()}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  backgroundColor: title.trim() ? theme.colors.gold.main : theme.colors.background.tertiary,
                  color: title.trim() ? theme.colors.background.primary : theme.colors.text.muted,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  cursor: title.trim() ? 'pointer' : 'not-allowed',
                  transition: theme.transitions.fast,
                }}
              >
                Save Zone
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
