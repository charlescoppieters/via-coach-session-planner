import React from 'react';
import { FaEye, FaRegTrashAlt, FaRegCommentDots } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';
import { theme } from '@/styles/theme';
import type { Session } from '@/types/database';

interface SessionCardProps {
  session: Session;
  teamName: string;
  onView: (sessionId: string) => void;
  onEdit: (sessionId: string) => void;
  onComment: (sessionId: string) => void;
  onDelete?: (sessionId: string) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  teamName,
  onView,
  onEdit,
  onComment,
  onDelete,
}) => {
  const handleDelete = async () => {
    if (onDelete && confirm(`Are you sure you want to delete "${session.title}"?`)) {
      onDelete(session.id);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get content preview (first 150 characters)
  const contentPreview = session.content.length > 150
    ? session.content.substring(0, 150) + '...'
    : session.content;

  return (
    <div
      style={{
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.md,
        overflow: 'hidden',
        transition: theme.transitions.fast,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Main Content */}
      <div style={{ padding: theme.spacing.xl }}>
        {/* Title */}
        <h3
          style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            margin: 0,
            marginBottom: theme.spacing.md,
          }}
        >
          {session.title}
        </h3>

        {/* Session Date */}
        <div
          style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.primary,
            fontWeight: theme.typography.fontWeight.medium,
            marginBottom: theme.spacing.sm,
          }}
        >
          {formatDate(session.session_date)}
        </div>

        {/* Metadata Row with Last Updated */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing.lg,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: theme.spacing.md,
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <span>{session.age_group}</span>
            <span>{session.player_count} PLAYERS</span>
            <span>{session.duration} MIN</span>
          </div>

          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
            }}
          >
            Last updated {formatDate(session.updated_at)}
          </div>
        </div>

        {/* Content Preview */}
        <div
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.primary,
            lineHeight: '1.6',
          }}
        >
          {contentPreview}
        </div>
      </div>

      {/* Action Bar */}
      <div
        style={{
          display: 'flex',
          backgroundColor: theme.colors.background.primary,
          borderTop: `1px solid ${theme.colors.border.primary}`,
        }}
      >
        <button
          onClick={() => onView(session.id)}
          title="View session"
          style={{
            flex: 1,
            padding: theme.spacing.lg,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: theme.colors.text.primary,
            border: 'none',
            cursor: 'pointer',
            transition: theme.transitions.fast,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          }}
        >
          <FaEye size={24} />
        </button>

        <button
          onClick={() => onEdit(session.id)}
          title="Edit session"
          style={{
            flex: 1,
            padding: theme.spacing.lg,
            backgroundColor: 'transparent',
            color: theme.colors.text.muted,
            border: 'none',
            cursor: 'pointer',
            transition: theme.transitions.fast,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = theme.colors.text.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = theme.colors.text.muted;
          }}
        >
          <MdEdit size={24} />
        </button>

        <button
          onClick={() => onComment(session.id)}
          title="Add comments"
          style={{
            flex: 1,
            padding: theme.spacing.lg,
            backgroundColor: 'transparent',
            color: theme.colors.text.muted,
            border: 'none',
            cursor: 'pointer',
            transition: theme.transitions.fast,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = theme.colors.text.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = theme.colors.text.muted;
          }}
        >
          <FaRegCommentDots size={24} />
        </button>

        {onDelete && (
          <button
            onClick={handleDelete}
            title="Delete session"
            style={{
              flex: 1,
              padding: theme.spacing.lg,
              backgroundColor: 'transparent',
              color: theme.colors.text.muted,
              border: 'none',
              cursor: 'pointer',
              transition: theme.transitions.fast,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = theme.colors.status.error;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = theme.colors.text.muted;
            }}
          >
            <FaRegTrashAlt size={20} />
          </button>
        )}
      </div>
    </div>
  );
};
