'use client'

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdDashboard } from 'react-icons/md';
import { theme } from '@/styles/theme';
import { mainVariants } from '@/constants/animations';
import { SessionCard } from '@/components/sessions/SessionCard';
import { CommentModal } from '@/components/sessions/CommentModal';
import { WeeklyStats } from '@/components/dashboard/WeeklyStats';
import { AttendanceTracker } from '@/components/attendance/AttendanceTracker';
import { getSessions } from '@/lib/sessions';
import { getSessionAttendance } from '@/lib/attendance';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
import type { Session, Team } from '@/types/database';

interface DashboardViewProps {
  coachId: string;
  teamId: string;
  onNavigateToSession?: (sessionId: string, mode: 'view' | 'edit') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  coachId,
  teamId,
  onNavigateToSession,
}) => {
  const [team, setTeam] = useState<Team | null>(null);
  const [upcomingSession, setUpcomingSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Comment modal state
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentingSession, setCommentingSession] = useState<Session | null>(null);

  // Weekly stats state
  const [weeklyStats, setWeeklyStats] = useState({
    sessionsCount: 0,
    totalMinutes: 0,
    playersTrained: 0,
    upcomingCount: 0,
  });

  // Fetch team data
  useEffect(() => {
    const fetchTeam = async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (data) {
        setTeam(data as Team);
      }
      if (error) {
        console.error('Error fetching team:', error);
      }
    };

    fetchTeam();
  }, [teamId]);

  // Helper function to get start of week (Monday)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  // Helper function to get end of week (Sunday)
  const getWeekEnd = (date: Date): Date => {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  };

  // Fetch sessions and find next upcoming
  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      const { data, error } = await getSessions(coachId, teamId);

      if (data) {
        // Filter and find next upcoming session
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = data
          .filter((session) => {
            const sessionDate = new Date(session.session_date);
            sessionDate.setHours(0, 0, 0, 0);
            return sessionDate >= today;
          })
          .sort((a, b) =>
            new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
          );

        setUpcomingSession(upcoming[0] || null);

        // Calculate weekly stats
        const weekStart = getWeekStart(new Date());
        const weekEnd = getWeekEnd(new Date());

        const weekSessions = data.filter((session) => {
          const sessionDate = new Date(session.session_date);
          return sessionDate >= weekStart && sessionDate <= weekEnd;
        });

        const sessionsCount = weekSessions.length;
        const totalMinutes = weekSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        const upcomingCount = weekSessions.filter((session) => {
          const sessionDate = new Date(session.session_date);
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate >= today;
        }).length;

        // Calculate actual attendance from attendance records
        let totalPlayersAttended = 0;
        let sessionsWithAttendance = 0;

        for (const session of weekSessions) {
          const { data: attendanceData } = await getSessionAttendance(session.id);
          if (attendanceData && attendanceData.length > 0) {
            const presentCount = attendanceData.filter(record => record.status === 'present').length;
            totalPlayersAttended += presentCount;
            sessionsWithAttendance++;
          }
        }

        // Calculate players trained (total present across all sessions)
        const playersTrained = totalPlayersAttended;

        setWeeklyStats({
          sessionsCount,
          totalMinutes,
          playersTrained,
          upcomingCount,
        });
      }

      if (error) {
        console.error('Error fetching sessions:', error);
      }

      setIsLoading(false);
    };

    fetchSessions();
  }, [coachId, teamId]);

  // Get ordinal suffix for day
  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  // Format today's date
  const formatTodaysDate = () => {
    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleDateString('en-US', { month: 'long' });
    const year = today.getFullYear();
    const weekday = today.toLocaleDateString('en-US', { weekday: 'long' });

    return {
      dayWithMonth: `${day}${getOrdinalSuffix(day)} ${month}, ${year}`,
      weekday: weekday,
    };
  };

  // Session action handlers
  const handleViewSession = (sessionId: string) => {
    if (onNavigateToSession) {
      onNavigateToSession(sessionId, 'view');
    }
  };

  const handleEditSession = (sessionId: string) => {
    if (onNavigateToSession) {
      onNavigateToSession(sessionId, 'edit');
    }
  };

  const handleCommentSession = (sessionId: string) => {
    if (upcomingSession && upcomingSession.id === sessionId) {
      setCommentingSession(upcomingSession);
      setCommentModalOpen(true);
    }
  };

  const handleSaveNotes = async (notes: string) => {
    if (!commentingSession) return;

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ notes })
        .eq('id', commentingSession.id);

      if (error) throw error;

      // Update local state
      setUpcomingSession(prev => prev ? { ...prev, notes } : null);

      // Close modal
      setCommentModalOpen(false);
      setCommentingSession(null);
    } catch (error) {
      console.error('Error saving notes:', error);
      throw error;
    }
  };

  if (!team) {
    return (
      <motion.div
        variants={mainVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: theme.colors.background.primary,
        }}
      >
        <div style={{
          textAlign: 'center',
          color: theme.colors.text.secondary,
          fontSize: theme.typography.fontSize.lg,
        }}>
          Loading...
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="dashboard"
      variants={mainVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        flex: 1,
        height: '100vh',
        backgroundColor: theme.colors.background.primary,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: theme.spacing.xl,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
        }}>
          <MdDashboard
            size={32}
            style={{ color: theme.colors.text.primary }}
          />
          <h1 style={{
            fontSize: theme.typography.fontSize['3xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            margin: 0,
          }}>
            Dashboard: {team.name}
          </h1>
        </div>
      </div>

      {/* Content Area */}
      <div style={{
        flex: 1,
        overflow: 'visible',
        padding: theme.spacing.xl,
        paddingTop: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: theme.spacing.xl,
          flex: 1,
          minHeight: 0,
        }}>
          {/* Left Column: Upcoming Session and Attendance */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'visible',
          }}>
            {/* Next Session Section */}
            <div>
              <h2 style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                margin: 0,
                marginBottom: theme.spacing.lg,
              }}>
                Next Session
              </h2>

              {isLoading ? (
                <div style={{
                  backgroundColor: theme.colors.background.secondary,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing.xl,
                  textAlign: 'center',
                  color: theme.colors.text.secondary,
                }}>
                  Loading session...
                </div>
              ) : upcomingSession ? (
                <SessionCard
                  session={upcomingSession}
                  teamName={team.name}
                  onView={handleViewSession}
                  onEdit={handleEditSession}
                  onComment={handleCommentSession}
                />
              ) : (
                <div style={{
                  backgroundColor: theme.colors.background.secondary,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing.xl,
                  textAlign: 'center',
                  color: theme.colors.text.secondary,
                }}>
                  No upcoming sessions scheduled
                </div>
              )}
            </div>

            {/* Attendance Tracking Section */}
            <div style={{
              marginTop: theme.spacing.xl,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}>
              <h2 style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                margin: 0,
                marginBottom: theme.spacing.lg,
              }}>
                Attendance
              </h2>

              <AttendanceTracker
                teamId={teamId}
                coachId={coachId}
                sessionId={upcomingSession?.id}
              />
            </div>
          </div>

          {/* Right Column: Today's Date and Weekly Stats */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'visible',
          }}>
            <div style={{
              backgroundColor: theme.colors.background.secondary,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.xl,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              marginTop: '52px', // Align with content below "Upcoming Session" header
            }}>
              <div style={{
                fontSize: theme.typography.fontSize['3xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.sm,
              }}>
                {formatTodaysDate().dayWithMonth}
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.lg,
                color: theme.colors.text.secondary,
              }}>
                {formatTodaysDate().weekday}
              </div>
            </div>

            {/* Weekly Stats - Extends to bottom */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <WeeklyStats
                sessionsCount={weeklyStats.sessionsCount}
                totalMinutes={weeklyStats.totalMinutes}
                playersTrained={weeklyStats.playersTrained}
                upcomingCount={weeklyStats.upcomingCount}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      {commentModalOpen && commentingSession && (
        <CommentModal
          sessionTitle={commentingSession.title}
          initialNotes={commentingSession.notes}
          onCancel={() => {
            setCommentModalOpen(false);
            setCommentingSession(null);
          }}
          onSave={handleSaveNotes}
        />
      )}
    </motion.div>
  );
};
