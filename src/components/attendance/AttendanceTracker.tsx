'use client'

import React, { useState, useEffect } from 'react';
import { theme } from '@/styles/theme';
import { getPlayers } from '@/lib/players';
import { getSessionAttendance, markAttendance, initializeSessionAttendance, updateAttendanceNotes } from '@/lib/attendance';
import { supabase } from '@/lib/supabase';
import { AttendancePlayerItem } from './AttendancePlayerItem';
import { NotesModal } from '@/components/common/NotesModal';
import { CgSpinnerAlt } from 'react-icons/cg';
import type { Player } from '@/types/database';

interface AttendanceTrackerProps {
  teamId: string;
  coachId: string;
  sessionId?: string | null;
}

export const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  teamId,
  coachId,
  sessionId,
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [attendance, setAttendance] = useState<{ [playerId: string]: boolean }>({});
  const [playerNotes, setPlayerNotes] = useState<{ [playerId: string]: string | null }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Modal state
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentingPlayer, setCommentingPlayer] = useState<Player | null>(null);

  // Fetch players and attendance data
  useEffect(() => {
    const fetchData = async () => {
      if (!teamId || !coachId) return;

      setIsLoading(true);

      // Fetch all players
      const { data: playersData, error: playersError } = await getPlayers(coachId, teamId);

      if (playersError) {
        console.error('Error fetching players:', playersError);
        setIsLoading(false);
        return;
      }

      if (playersData) {
        setPlayers(playersData);

        // If we have a session, fetch or initialize attendance
        if (sessionId) {
          const { data: attendanceData, error: attendanceError } = await getSessionAttendance(sessionId);

          if (attendanceError) {
            console.error('Error fetching attendance:', attendanceError);
          }

          if (attendanceData && attendanceData.length > 0) {
            // Use existing attendance data
            const attendanceMap: { [playerId: string]: boolean } = {};
            const notesMap: { [playerId: string]: string | null } = {};
            attendanceData.forEach((record) => {
              attendanceMap[record.player_id] = record.status === 'present';
              notesMap[record.player_id] = record.notes;
            });
            setAttendance(attendanceMap);
            setPlayerNotes(notesMap);
          } else {
            // No attendance data yet, initialize it
            const { error: initError } = await initializeSessionAttendance(sessionId, teamId, coachId);

            if (initError) {
              console.error('Error initializing attendance:', initError);
            }

            // Set all players as present by default
            const initialAttendance: { [playerId: string]: boolean } = {};
            playersData.forEach((player) => {
              initialAttendance[player.id] = true;
            });
            setAttendance(initialAttendance);
          }
        } else {
          // No session selected, default all to present
          const initialAttendance: { [playerId: string]: boolean } = {};
          playersData.forEach((player) => {
            initialAttendance[player.id] = true;
          });
          setAttendance(initialAttendance);
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, [teamId, coachId, sessionId]);

  // Real-time subscription for attendance changes
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`attendance-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_attendance',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const record = payload.new as { player_id: string; status: string; notes: string | null };
            setAttendance((prev) => ({
              ...prev,
              [record.player_id]: record.status === 'present',
            }));
            setPlayerNotes((prev) => ({
              ...prev,
              [record.player_id]: record.notes,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const handleToggleAttendance = async (playerId: string) => {
    const newStatus = !attendance[playerId];

    // Optimistic update
    setAttendance((prev) => ({
      ...prev,
      [playerId]: newStatus,
    }));

    // Persist to database if we have a session
    if (sessionId) {
      const { error } = await markAttendance(
        sessionId,
        playerId,
        newStatus ? 'present' : 'absent'
      );

      if (error) {
        console.error('Error marking attendance:', error);
        // Revert optimistic update on error
        setAttendance((prev) => ({
          ...prev,
          [playerId]: !newStatus,
        }));
      }
    }
  };

  const handleCommentPlayer = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    if (player) {
      setCommentingPlayer(player);
      setCommentModalOpen(true);
    }
  };

  const handleSaveNotes = async (notes: string) => {
    if (!commentingPlayer || !sessionId) return;

    try {
      const { error } = await updateAttendanceNotes(sessionId, commentingPlayer.id, notes);

      if (error) throw error;

      // Update local state
      setPlayerNotes((prev) => ({
        ...prev,
        [commentingPlayer.id]: notes,
      }));

      // Close modal
      setCommentModalOpen(false);
      setCommentingPlayer(null);
    } catch (error) {
      console.error('Error saving notes:', error);
      throw error;
    }
  };

  // Calculate attendance stats
  const presentCount = sessionId ? Object.values(attendance).filter((isPresent) => isPresent).length : 0;
  const totalCount = sessionId ? players.length : 0;

  return (
    <div
      style={{
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.xl,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
      }}
    >
      {/* Stats Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.spacing.lg,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
          }}
        >
          Players
        </div>
        <div
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
          }}
        >
          {presentCount} of {totalCount} attending
        </div>
      </div>

      {/* Scrollable Player List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.sm,
          minHeight: 0,
          padding: theme.spacing.md,
        }}
      >
        {!sessionId ? (
          <div
            style={{
              textAlign: 'center',
              padding: theme.spacing.xl,
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.base,
            }}
          >
            Please plan a session to take attendance.
          </div>
        ) : isLoading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: theme.spacing.xl,
            }}
          >
            <CgSpinnerAlt
              style={{
                animation: 'spin 1s linear infinite',
                fontSize: '24px',
                color: theme.colors.text.muted,
              }}
            />
          </div>
        ) : players.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: theme.spacing.xl,
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.base,
            }}
          >
            No players in this team yet.
          </div>
        ) : (
          players.map((player) => (
            <AttendancePlayerItem
              key={player.id}
              player={player}
              isAttending={attendance[player.id] ?? true}
              hasNotes={!!(playerNotes[player.id])}
              onToggle={handleToggleAttendance}
              onComment={handleCommentPlayer}
            />
          ))
        )}
      </div>

      {/* Notes Modal */}
      {commentModalOpen && commentingPlayer && (
        <NotesModal
          title="Player Notes"
          subtitle={`${commentingPlayer.name}${commentingPlayer.position ? ` (${commentingPlayer.position})` : ''}`}
          initialNotes={playerNotes[commentingPlayer.id] || null}
          placeholder="Add notes about this player's performance, behavior, or any observations..."
          onCancel={() => {
            setCommentModalOpen(false);
            setCommentingPlayer(null);
          }}
          onSave={handleSaveNotes}
        />
      )}
    </div>
  );
};
