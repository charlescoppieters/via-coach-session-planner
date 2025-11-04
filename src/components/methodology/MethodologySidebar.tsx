import React from 'react';
import { FaGraduationCap } from 'react-icons/fa';
import { MdGroup } from 'react-icons/md';
import { theme } from '@/styles/theme';

interface MethodologySidebarProps {
  selectedView: 'global' | 'team' | null;
  onViewChange: (view: 'global' | 'team') => void;
  teamName?: string;
}

export const MethodologySidebar: React.FC<MethodologySidebarProps> = ({
  selectedView,
  onViewChange,
  teamName,
}) => {
  const SelectorCard = ({
    view,
    icon: Icon,
    title,
    description,
  }: {
    view: 'global' | 'team';
    icon: React.ComponentType<{ size: number }>;
    title: string;
    description: string;
  }) => {
    const isSelected = selectedView === view;

    return (
      <div
        onClick={() => onViewChange(view)}
        style={{
          padding: theme.spacing.lg,
          backgroundColor: isSelected ? 'rgba(239, 191, 4, 0.1)' : 'transparent',
          border: isSelected ? `2px solid ${theme.colors.gold.main}` : '2px solid transparent',
          borderRadius: theme.borderRadius.md,
          cursor: 'pointer',
          transition: theme.transitions.fast,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
          marginBottom: theme.spacing.sm,
          color: theme.colors.text.primary,
        }}>
          <Icon size={24} />
          <h3 style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            margin: 0,
          }}>
            {title}
          </h3>
        </div>
        <p style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          margin: 0,
          lineHeight: '1.5',
        }}>
          {description}
        </p>
      </div>
    );
  };

  return (
    <div style={{
      width: '30%',
      minWidth: '300px',
      height: '100vh',
      backgroundColor: theme.colors.background.primary,
      padding: theme.spacing.lg,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.lg,
      borderRight: `1px solid ${theme.colors.border.primary}`,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.sm,
        color: theme.colors.text.primary,
      }}>
        <FaGraduationCap size={28} />
        <h2 style={{
          fontSize: theme.typography.fontSize['2xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          margin: 0,
        }}>
          Methodology
        </h2>
      </div>

      {/* Description */}
      <div style={{
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: theme.borderRadius.md,
        borderLeft: `3px solid ${theme.colors.gold.main}`,
      }}>
        <p style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          margin: 0,
          lineHeight: '1.6',
        }}>
          Manage your coaching methodology and team-specific rules. These rules guide the AI when generating session plans. Active rules have this gold border next to them.
        </p>
      </div>

      {/* Selector Cards */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.md,
      }}>
        <SelectorCard
          view="global"
          icon={FaGraduationCap}
          title="Global Rules"
          description="Coaching methodology that applies to all teams"
        />
        <SelectorCard
          view="team"
          icon={MdGroup}
          title="Team Rules"
          description={teamName ? `Team-specific rules for ${teamName}` : 'Team-specific rules'}
        />
      </div>
    </div>
  );
};
