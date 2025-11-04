import React, { useState } from 'react';
import { theme } from '@/styles/theme';

interface NotesModalProps {
  title: string;
  subtitle: string;
  initialNotes: string | null;
  placeholder?: string;
  onCancel: () => void;
  onSave: (notes: string) => Promise<void>;
}

export const NotesModal: React.FC<NotesModalProps> = ({
  title,
  subtitle,
  initialNotes,
  placeholder = 'Add your notes here...',
  onCancel,
  onSave,
}) => {
  const [notes, setNotes] = useState(initialNotes || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSaving(true);
    try {
      await onSave(notes);
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
      setIsSaving(false);
    }
  };

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
            padding: theme.spacing.xl,
            width: '90%',
            maxWidth: '600px',
          }}
        >
          <h2
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              margin: 0,
              marginBottom: theme.spacing.xs,
            }}
          >
            {title}
          </h2>

          <p
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              margin: 0,
              marginBottom: theme.spacing.lg,
            }}
          >
            {subtitle}
          </p>

          <form onSubmit={handleSubmit}>
            {/* Notes Field */}
            <div style={{ marginBottom: theme.spacing.lg }}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={placeholder}
                autoFocus
                rows={8}
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.text.primary,
                  backgroundColor: theme.colors.background.primary,
                  border: `2px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  lineHeight: '1.5',
                }}
              />
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: theme.spacing.sm,
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  backgroundColor: theme.colors.background.primary,
                  color: theme.colors.text.primary,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.6 : 1,
                  transition: theme.transitions.fast,
                }}
                onMouseEnter={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.backgroundColor = theme.colors.background.primary;
                  }
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  backgroundColor: theme.colors.gold.main,
                  color: theme.colors.background.primary,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.6 : 1,
                  transition: theme.transitions.fast,
                }}
                onMouseEnter={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.backgroundColor = theme.colors.gold.light;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.backgroundColor = theme.colors.gold.main;
                  }
                }}
              >
                {isSaving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
