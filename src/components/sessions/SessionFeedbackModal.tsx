'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { theme } from '@/styles/theme';
import { FiArrowLeft, FiMic, FiMicOff } from 'react-icons/fi';
import { MdComment, MdModeComment } from 'react-icons/md';
import { CgSpinnerAlt } from 'react-icons/cg';

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}
import { getPlayers } from '@/lib/players';
import {
  loadFeedbackModalData,
  saveAllFeedback,
  type PlayerAttendanceData,
  type PlayerNoteData,
} from '@/lib/sessionFeedback';
import type { Player } from '@/types/database';

interface SessionFeedbackModalProps {
  sessionId: string;
  sessionTitle: string;
  teamId: string;
  coachId: string;
  clubId: string;
  onCancel: () => void;
  onSave: () => void;
}

export const SessionFeedbackModal: React.FC<SessionFeedbackModalProps> = ({
  sessionId,
  sessionTitle,
  teamId,
  coachId,
  clubId,
  onCancel,
  onSave,
}) => {
  // Data state
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamFeedback, setTeamFeedback] = useState('');
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({});
  const [playerNotes, setPlayerNotes] = useState<Record<string, string>>({});

  // UI state
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const baseTextRef = useRef<string>(''); // Text before speech started

  // Check for speech recognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSpeechSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    }
  }, []);

  // Get current text based on mode
  const getCurrentText = useCallback(() => {
    if (selectedPlayerId) {
      return playerNotes[selectedPlayerId] || '';
    }
    return teamFeedback;
  }, [selectedPlayerId, playerNotes, teamFeedback]);

  // Set current text based on mode
  const setCurrentText = useCallback((text: string) => {
    if (selectedPlayerId) {
      setPlayerNotes(prev => ({ ...prev, [selectedPlayerId]: text }));
    } else {
      setTeamFeedback(text);
    }
  }, [selectedPlayerId]);

  // Start speech recognition
  const startListening = useCallback(() => {
    if (!speechSupported) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // Store the current text as base
    baseTextRef.current = getCurrentText();

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Combine base text with new speech
      const separator = baseTextRef.current && !baseTextRef.current.endsWith(' ') ? ' ' : '';
      const newText = baseTextRef.current + separator + (finalTranscript || interimTranscript);
      setCurrentText(newText);

      // Update base text when we get final results
      if (finalTranscript) {
        baseTextRef.current = baseTextRef.current + separator + finalTranscript;
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [speechSupported, getCurrentText, setCurrentText]);

  // Stop speech recognition
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Toggle speech recognition
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Stop listening when switching between team/player feedback
  useEffect(() => {
    stopListening();
  }, [selectedPlayerId, stopListening]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // 1. Load players for the team
      const { data: playersData } = await getPlayers(clubId, teamId);
      if (!playersData) {
        setIsLoading(false);
        return;
      }
      setPlayers(playersData);

      // 2. Load existing feedback data
      const { data: feedbackData } = await loadFeedbackModalData(sessionId, playersData);
      if (feedbackData) {
        setTeamFeedback(feedbackData.teamFeedback);
        setAttendance(feedbackData.attendance);
        setPlayerNotes(feedbackData.playerNotes);
      }

      setIsLoading(false);
    };

    loadData();
  }, [sessionId, teamId, clubId]);

  // Toggle attendance
  const handleToggleAttendance = (playerId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [playerId]: prev[playerId] === 'present' ? 'absent' : 'present',
    }));
  };

  // Open player notes
  const handleOpenPlayerNotes = (playerId: string) => {
    setSelectedPlayerId(playerId);
  };

  // Close player notes (back to session feedback)
  const handleBackToSession = () => {
    setSelectedPlayerId(null);
  };

  // Update player note
  const handlePlayerNoteChange = (playerId: string, note: string) => {
    setPlayerNotes((prev) => ({
      ...prev,
      [playerId]: note,
    }));
  };

  // Save all data
  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Prepare attendance data
      const attendanceData: PlayerAttendanceData[] = players.map((p) => ({
        player_id: p.id,
        status: attendance[p.id] || 'present',
      }));

      // Prepare player notes data
      const notesData: PlayerNoteData[] = players
        .filter((p) => playerNotes[p.id]?.trim())
        .map((p) => ({
          player_id: p.id,
          note: playerNotes[p.id],
        }));

      const { error } = await saveAllFeedback(
        sessionId,
        coachId,
        teamFeedback,
        attendanceData,
        notesData
      );

      if (error) {
        console.error('Failed to save feedback:', error);
        alert('Failed to save feedback');
        setIsSaving(false);
        return;
      }

      onSave();
    } catch (err) {
      console.error('Error saving feedback:', err);
      alert('Failed to save feedback');
      setIsSaving(false);
    }
  };

  // Get selected player for right panel
  const selectedPlayer = selectedPlayerId
    ? players.find((p) => p.id === selectedPlayerId)
    : null;

  // Check if player has notes
  const playerHasNotes = (playerId: string) => {
    return playerNotes[playerId]?.trim().length > 0;
  };

  if (isLoading) {
    return (
      <div
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
        <div
          style={{
            backgroundColor: theme.colors.background.secondary,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.xl,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.md,
            color: theme.colors.text.primary,
          }}
        >
          <CgSpinnerAlt
            style={{
              animation: 'spin 1s linear infinite',
              fontSize: '24px',
            }}
          />
          Loading...
        </div>
      </div>
    );
  }

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
            width: '900px',
            height: '650px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: theme.spacing.lg }}>
            <h2
              style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                margin: 0,
                marginBottom: theme.spacing.xs,
              }}
            >
              Session Feedback
            </h2>
            <p
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                margin: 0,
              }}
            >
              {sessionTitle}
            </p>
          </div>

          {/* Two Column Layout */}
          <div
            style={{
              display: 'flex',
              gap: theme.spacing.lg,
              flex: 1,
              minHeight: 0,
            }}
          >
            {/* Left Column - Attendance */}
            <div
              style={{
                width: '340px',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
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
                Attendance
              </label>
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  minHeight: 0,
                }}
              >
                {players.map((player) => {
                  const isAttending = attendance[player.id] === 'present';
                  const hasNotes = playerHasNotes(player.id);
                  const isSelected = selectedPlayerId === player.id;

                  return (
                    <div
                      key={player.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.md,
                        padding: `${theme.spacing.sm} 0`,
                        borderBottom: `1px solid ${theme.colors.border.secondary}`,
                      }}
                    >
                      {/* Avatar with Initials */}
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: theme.colors.background.primary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: theme.typography.fontSize.xs,
                          fontWeight: theme.typography.fontWeight.bold,
                          color: theme.colors.text.muted,
                          flexShrink: 0,
                        }}
                      >
                        {player.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>

                      {/* Player Name */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: theme.typography.fontSize.sm,
                            fontWeight: theme.typography.fontWeight.medium,
                            color: theme.colors.text.primary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {player.name}
                        </div>
                      </div>

                      {/* Comment Button */}
                      <button
                        onClick={() => handleOpenPlayerNotes(player.id)}
                        title="Add notes for this player"
                        style={{
                          padding: theme.spacing.xs,
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: hasNotes
                            ? theme.colors.gold.main
                            : theme.colors.text.secondary,
                          fontSize: theme.typography.fontSize.lg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: theme.transitions.fast,
                        }}
                      >
                        {hasNotes ? <MdModeComment /> : <MdComment />}
                      </button>

                      {/* Attendance Toggle Switch */}
                      <button
                        onClick={() => handleToggleAttendance(player.id)}
                        title={isAttending ? 'Mark as absent' : 'Mark as present'}
                        style={{
                          position: 'relative',
                          width: '36px',
                          height: '20px',
                          backgroundColor: isAttending
                            ? theme.colors.gold.main
                            : theme.colors.border.primary,
                          borderRadius: '10px',
                          border: 'none',
                          cursor: 'pointer',
                          transition: theme.transitions.fast,
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            top: '2px',
                            left: isAttending ? '18px' : '2px',
                            width: '16px',
                            height: '16px',
                            backgroundColor: theme.colors.text.primary,
                            borderRadius: '50%',
                            transition: theme.transitions.fast,
                          }}
                        />
                      </button>
                    </div>
                  );
                })}

                {players.length === 0 && (
                  <div
                    style={{
                      padding: theme.spacing.lg,
                      textAlign: 'center',
                      color: theme.colors.text.secondary,
                      fontSize: theme.typography.fontSize.sm,
                    }}
                  >
                    No players in this team
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Feedback */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
              {/* Label with Back button for player mode */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  marginBottom: theme.spacing.xs,
                }}
              >
                {selectedPlayer ? (
                  <>
                    <button
                      onClick={handleBackToSession}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.xs,
                        padding: 0,
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: theme.colors.text.secondary,
                        fontSize: theme.typography.fontSize.sm,
                        transition: theme.transitions.fast,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = theme.colors.gold.main;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = theme.colors.text.secondary;
                      }}
                    >
                      <FiArrowLeft size={14} />
                      Back
                    </button>
                    <span
                      style={{
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: theme.colors.text.secondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      / {selectedPlayer.name}
                    </span>
                  </>
                ) : (
                  <label
                    style={{
                      display: 'block',
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.text.secondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Session Feedback
                  </label>
                )}
              </div>

              {/* Feedback Textarea Card */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: theme.colors.background.primary,
                  border: `2px solid ${isListening ? theme.colors.status.error : theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  position: 'relative',
                  transition: theme.transitions.fast,
                }}
              >
                {selectedPlayer ? (
                  <textarea
                    value={playerNotes[selectedPlayer.id] || ''}
                    onChange={(e) =>
                      handlePlayerNoteChange(selectedPlayer.id, e.target.value)
                    }
                    placeholder={`Notes for ${selectedPlayer.name}...`}
                    autoFocus
                    style={{
                      flex: 1,
                      width: '100%',
                      padding: theme.spacing.md,
                      paddingBottom: '60px', // Space for mic button
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.text.primary,
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      resize: 'none',
                      lineHeight: '1.5',
                    }}
                  />
                ) : (
                  <textarea
                    value={teamFeedback}
                    onChange={(e) => setTeamFeedback(e.target.value)}
                    placeholder="How did the session go? What worked well? What could be improved?"
                    autoFocus
                    style={{
                      flex: 1,
                      width: '100%',
                      padding: theme.spacing.md,
                      paddingBottom: '60px', // Space for mic button
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.text.primary,
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      resize: 'none',
                      lineHeight: '1.5',
                    }}
                  />
                )}

                {/* Microphone Button */}
                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                    style={{
                      position: 'absolute',
                      bottom: theme.spacing.md,
                      right: theme.spacing.md,
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: isListening
                        ? theme.colors.status.error
                        : theme.colors.background.tertiary,
                      color: isListening
                        ? '#fff'
                        : theme.colors.text.secondary,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: theme.transitions.fast,
                      boxShadow: isListening
                        ? '0 0 0 4px rgba(220, 53, 69, 0.3)'
                        : 'none',
                      animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isListening) {
                        e.currentTarget.style.backgroundColor = theme.colors.border.primary;
                        e.currentTarget.style.color = theme.colors.text.primary;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isListening) {
                        e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
                        e.currentTarget.style.color = theme.colors.text.secondary;
                      }
                    }}
                  >
                    {isListening ? <FiMicOff size={20} /> : <FiMic size={20} />}
                  </button>
                )}

                {/* Listening indicator */}
                {isListening && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: theme.spacing.md,
                      left: theme.spacing.md,
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      color: theme.colors.status.error,
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: theme.colors.status.error,
                        animation: 'pulse 1s ease-in-out infinite',
                      }}
                    />
                    Listening...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer - Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: theme.spacing.sm,
              justifyContent: 'flex-end',
              marginTop: theme.spacing.lg,
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
                  e.currentTarget.style.backgroundColor =
                    theme.colors.background.tertiary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.backgroundColor =
                    theme.colors.background.primary;
                }
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
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
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Animation keyframes */}
      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
      `}</style>
    </>
  );
};
