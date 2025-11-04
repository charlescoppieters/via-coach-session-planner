import React from 'react';
import { IoSettingsSharp } from 'react-icons/io5';
import { FaUserCircle } from 'react-icons/fa';
import { theme } from '@/styles/theme';
import { TeamCard } from '@/components/teams/TeamCard';
import type { Team, Coach } from '@/types/database';

interface SettingsSidebarProps {
  selectedView: 'coach' | string | null; // 'coach' or team ID or null
  onViewChange: (view: 'coach' | string) => void;
  coach: Coach | null;
  teams: Team[];
  onAddTeam: () => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  selectedView,
  onViewChange,
  coach,
  teams,
  onAddTeam,
}) => {
  const CoachCard = () => {
    const isSelected = selectedView === 'coach';

    return (
      <div
        onClick={() => onViewChange('coach')}
        style={{
          padding: theme.spacing.md,
          backgroundColor: isSelected ? 'rgba(239, 191, 4, 0.1)' : 'transparent',
          border: isSelected ? `2px solid ${theme.colors.gold.main}` : '2px solid transparent',
          borderRadius: theme.borderRadius.md,
          cursor: 'pointer',
          transition: theme.transitions.fast,
          marginBottom: theme.spacing.sm,
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
          <FaUserCircle size={24} />
          <h3 style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            margin: 0,
          }}>
            Coach Profile
          </h3>
        </div>
        <p style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          margin: 0,
          lineHeight: '1.5',
        }}>
          {coach ? `Edit ${coach.name}'s details` : 'Edit your profile details'}
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
        <IoSettingsSharp size={28} />
        <h2 style={{
          fontSize: theme.typography.fontSize['2xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          margin: 0,
        }}>
          Settings
        </h2>
      </div>

      {/* Coach Profile Card */}
      <CoachCard />

      {/* Teams Section Header with Add Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: theme.spacing.md,
      }}>
        <h3 style={{
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
          margin: 0,
        }}>
          Teams
        </h3>

        {/* Add New Team Button */}
        <button
          onClick={onAddTeam}
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
            backgroundColor: 'transparent',
            color: theme.colors.gold.main,
            border: `2px dashed ${theme.colors.gold.main}`,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.semibold,
            cursor: 'pointer',
            opacity: 0.7,
            transition: theme.transitions.fast,
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.opacity = '0.7';
          }}
        >
          + Add New Team
        </button>
      </div>

      {/* Teams List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.sm,
        padding: theme.spacing.sm,
      }}>
        {teams.length === 0 ? (
          <div style={{
            padding: theme.spacing.lg,
            textAlign: 'center',
            color: theme.colors.text.secondary,
            fontSize: theme.typography.fontSize.sm,
          }}>
            No teams yet. Create your first team above.
          </div>
        ) : (
          teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              isSelected={selectedView === team.id}
              onClick={() => onViewChange(team.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
