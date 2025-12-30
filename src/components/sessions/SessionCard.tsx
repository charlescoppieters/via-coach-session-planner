import React from 'react';
import { FaEye, FaRegTrashAlt, FaRegCommentDots } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';
import { theme } from '@/styles/theme';
import type { Session, SessionThemeSnapshot } from '@/types/database';

// Extended session type that includes syllabus fields
interface SessionWithTheme extends Session {
  theme_snapshot?: SessionThemeSnapshot | null;
}

interface SessionCardProps {
  session: SessionWithTheme;
  teamName: string;
  onView: (sessionId: string) => void;
  onEdit?: (sessionId: string) => void;
  onComment?: (sessionId: string) => void;
  onDelete?: (sessionId: string) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
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

  // Format date and time for display
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateStr} at ${timeStr}`;
  };

  return (
    <div
      style={{
        width: '480px',
        minWidth: '480px',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        transition: theme.transitions.fast,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        flexShrink: 0,
      }}
    >
      {/* Main Content */}
      <div style={{ padding: `${theme.spacing['2xl']} ${theme.spacing.xl}` }}>
        {/* Title */}
        <h3
          style={{
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            margin: 0,
            marginBottom: theme.spacing.sm,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {session.title}
        </h3>

        {/* Theme Badge - placeholder space when no theme */}
        <div
          style={{
            minHeight: '24px',
            marginBottom: theme.spacing.md,
          }}
        >
          {session.theme_snapshot && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                backgroundColor: 'rgba(239, 191, 4, 0.15)',
                borderRadius: theme.borderRadius.sm,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: theme.colors.gold.main,
                }}
              />
              <span
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.gold.main,
                  fontWeight: theme.typography.fontWeight.medium,
                }}
              >
                {session.theme_snapshot.zoneName}
              </span>
            </div>
          )}
        </div>

        {/* Session Date */}
        <div
          style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.gold.main,
            fontWeight: theme.typography.fontWeight.medium,
            marginBottom: theme.spacing.md,
          }}
        >
          {formatDateTime(session.session_date)}
        </div>

        {/* Metadata */}
        <div
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
          }}
        >
          {session.player_count} players • {session.duration} min
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
            padding: theme.spacing.md,
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
          <FaEye size={16} />
        </button>

        {onEdit && (
          <button
            onClick={() => onEdit(session.id)}
            title="Edit session"
            style={{
              flex: 1,
              padding: theme.spacing.md,
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
            <MdEdit size={16} />
          </button>
        )}

        {onComment && (
          <button
            onClick={() => onComment(session.id)}
            title="Add comments"
            style={{
              flex: 1,
              padding: theme.spacing.md,
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
            <FaRegCommentDots size={16} />
          </button>
        )}

        {onDelete && (
          <button
            onClick={handleDelete}
            title="Delete session"
            style={{
              flex: 1,
              padding: theme.spacing.md,
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
            <FaRegTrashAlt size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
