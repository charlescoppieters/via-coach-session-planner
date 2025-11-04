import React from 'react';
import { theme } from '@/styles/theme';
import { GiSoccerBall } from 'react-icons/gi';
import { IoMdTime } from 'react-icons/io';
import { HiUsers, HiUserGroup } from 'react-icons/hi';
import { MdUpcoming } from 'react-icons/md';

interface WeeklyStatsProps {
  sessionsCount: number;
  totalMinutes: number;
  playersTrained: number;
  upcomingCount: number;
}

export const WeeklyStats: React.FC<WeeklyStatsProps> = ({
  sessionsCount,
  totalMinutes,
  playersTrained,
  upcomingCount,
}) => {
  // Format minutes as "XXX min" or "Xh Xm"
  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Calculate average attendance
  const avgAttendance = sessionsCount > 0
    ? Math.round(playersTrained / sessionsCount)
    : 0;

  return (
    <div
      style={{
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.xl,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        marginTop: theme.spacing.lg,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.lg,
        }}
      >
        This Week
      </div>

      {/* Stacked Stats */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.xl,
          flex: 1,
          justifyContent: 'center',
        }}
      >
        {/* Sessions Count */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.lg,
            padding: theme.spacing.md,
            backgroundColor: theme.colors.background.primary,
            borderRadius: theme.borderRadius.md,
          }}
        >
          <GiSoccerBall
            size={40}
            style={{
              color: theme.colors.gold.main,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
              }}
            >
              {sessionsCount}
            </div>
            <div
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
              }}
            >
              Sessions
            </div>
          </div>
        </div>

        {/* Total Minutes */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.lg,
            padding: theme.spacing.md,
            backgroundColor: theme.colors.background.primary,
            borderRadius: theme.borderRadius.md,
          }}
        >
          <IoMdTime
            size={40}
            style={{
              color: theme.colors.gold.main,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
              }}
            >
              {formatMinutes(totalMinutes)}
            </div>
            <div
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
              }}
            >
              Training Time
            </div>
          </div>
        </div>

        {/* Players Trained */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.lg,
            padding: theme.spacing.md,
            backgroundColor: theme.colors.background.primary,
            borderRadius: theme.borderRadius.md,
          }}
        >
          <HiUsers
            size={40}
            style={{
              color: theme.colors.gold.main,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
              }}
            >
              {playersTrained}
            </div>
            <div
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
              }}
            >
              Players Trained
            </div>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.lg,
            padding: theme.spacing.md,
            backgroundColor: theme.colors.background.primary,
            borderRadius: theme.borderRadius.md,
          }}
        >
          <MdUpcoming
            size={40}
            style={{
              color: theme.colors.gold.main,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
              }}
            >
              {upcomingCount}
            </div>
            <div
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
              }}
            >
              Upcoming
            </div>
          </div>
        </div>

        {/* Average Attendance */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.lg,
            padding: theme.spacing.md,
            backgroundColor: theme.colors.background.primary,
            borderRadius: theme.borderRadius.md,
          }}
        >
          <HiUserGroup
            size={40}
            style={{
              color: theme.colors.gold.main,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
              }}
            >
              {avgAttendance}
            </div>
            <div
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
              }}
            >
              Avg. Attendance
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
