import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GiSoccerBall } from 'react-icons/gi';
import { theme } from '@/styles/theme';
import { SessionCard } from './SessionCard';
import { CreateSessionModal } from './CreateSessionModal';
import { CommentModal } from './CommentModal';
import { getSessions, createSession, deleteSession } from '@/lib/sessions';
import type { Session, Team } from '@/types/database';
import { supabase } from '@/lib/supabase';

interface SessionsListViewProps {
  coachId: string;
  team: Team;
  onSessionSelect: (sessionId: string, mode: 'view' | 'edit') => void;
}

export const SessionsListView: React.FC<SessionsListViewProps> = ({
  coachId,
  team,
  onSessionSelect,
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Comment modal state
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentingSession, setCommentingSession] = useState<Session | null>(null);

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      const { data, error } = await getSessions(coachId, team.id);

      if (data) {
        setSessions(data);
      }
      if (error) {
        console.error('Error fetching sessions:', error);
      }
      setIsLoading(false);
    };

    fetchSessions();
  }, [coachId, team.id]);

  // Real-time subscription for sessions
  useEffect(() => {
    const channel = supabase
      .channel(`sessions-list-${team.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `team_id=eq.${team.id}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            setSessions((prev) => [...prev, payload.new as Session]);
          } else if (payload.eventType === 'UPDATE') {
            setSessions((prev) =>
              prev.map((session) =>
                session.id === payload.new.id ? (payload.new as Session) : session
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setSessions((prev) =>
              prev.filter((session) => session.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [team.id]);

  // Categorize sessions by date
  const categorizeSessions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming: Session[] = [];
    const previous: Session[] = [];

    sessions.forEach((session) => {
      const sessionDate = new Date(session.session_date);
      sessionDate.setHours(0, 0, 0, 0);

      if (sessionDate >= today) {
        upcoming.push(session);
      } else {
        previous.push(session);
      }
    });

    // Sort upcoming sessions by date (earliest first)
    upcoming.sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());

    // Sort previous sessions by date (most recent first)
    previous.sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());

    return { upcoming, previous };
  };

  const { upcoming, previous } = categorizeSessions();

  const handleCreateSession = async (sessionData: {
    coach_id: string;
    team_id: string;
    title: string;
    session_date: string;
    player_count: number;
    duration: number;
    age_group: string;
    skill_level: string;
    content: string;
  }) => {
    const { data, error } = await createSession(sessionData);

    if (error) {
      console.error('Error creating session:', error);
      throw error;
    }

    if (data) {
      setIsCreating(false);
      // Navigate to the newly created session in edit mode
      onSessionSelect(data.id, 'edit');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const { error } = await deleteSession(sessionId);

    if (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session');
      return;
    }

    // Refetch sessions to ensure UI is updated
    const { data } = await getSessions(coachId, team.id);
    if (data) {
      setSessions(data);
    }
  };

  const handleCommentSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCommentingSession(session);
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
      setSessions(prev =>
        prev.map(session =>
          session.id === commentingSession.id
            ? { ...session, notes }
            : session
        )
      );

      // Close modal
      setCommentModalOpen(false);
      setCommentingSession(null);
    } catch (error) {
      console.error('Error saving notes:', error);
      throw error;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: theme.colors.background.primary,
      }}
    >
      {/* Header with Title and Create Session Button */}
      <div
        style={{
          padding: theme.spacing.xl,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        {/* Sessions Title with Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.md,
          }}
        >
          <GiSoccerBall
            size={32}
            style={{
              color: theme.colors.text.primary,
            }}
          />
          <h1
            style={{
              fontSize: theme.typography.fontSize['3xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              margin: 0,
            }}
          >
            Sessions
          </h1>
        </div>

        {/* Create Session Button */}
        <button
          onClick={() => setIsCreating(true)}
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
          + Create Session
        </button>
      </div>

      {/* Sessions Content */}
      <div
        style={{
          flex: 1,
          padding: theme.spacing.xl,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: theme.spacing.xl,
              color: theme.colors.text.secondary,
            }}
          >
            Loading sessions...
          </div>
        ) : (
          <>
            {/* Upcoming Sessions Section */}
            <div style={{
              marginBottom: theme.spacing.xl,
              flex: upcoming.length === 0 && previous.length === 0 ? 1 : undefined,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <h2
                style={{
                  fontSize: theme.typography.fontSize.xl,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.text.primary,
                  margin: 0,
                  marginBottom: theme.spacing.lg,
                }}
              >
                Upcoming Sessions
              </h2>
              {upcoming.length > 0 ? (
                upcoming.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    teamName={team.name}
                    onView={(id) => onSessionSelect(id, 'view')}
                    onEdit={(id) => onSessionSelect(id, 'edit')}
                    onComment={handleCommentSession}
                    onDelete={handleDeleteSession}
                  />
                ))
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    padding: theme.spacing.xl,
                    color: theme.colors.text.secondary,
                    textAlign: 'center',
                  }}
                >
                  <p style={{ fontSize: theme.typography.fontSize.sm, margin: 0 }}>
                    No upcoming sessions
                  </p>
                </div>
              )}
            </div>

            {/* Previous Sessions Section */}
            <div style={{
              flex: upcoming.length === 0 && previous.length === 0 ? 1 : undefined,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <h2
                style={{
                  fontSize: theme.typography.fontSize.xl,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.text.primary,
                  margin: 0,
                  marginBottom: theme.spacing.lg,
                }}
              >
                Previous Sessions
              </h2>
              {previous.length > 0 ? (
                previous.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    teamName={team.name}
                    onView={(id) => onSessionSelect(id, 'view')}
                    onEdit={(id) => onSessionSelect(id, 'edit')}
                    onComment={handleCommentSession}
                    onDelete={handleDeleteSession}
                  />
                ))
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    padding: theme.spacing.xl,
                    color: theme.colors.text.secondary,
                    textAlign: 'center',
                  }}
                >
                  <p style={{ fontSize: theme.typography.fontSize.sm, margin: 0 }}>
                    No previous sessions
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Session Modal */}
      {isCreating && (
        <CreateSessionModal
          team={team}
          coachId={coachId}
          onCancel={() => setIsCreating(false)}
          onCreate={handleCreateSession}
        />
      )}

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
