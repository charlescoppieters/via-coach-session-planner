'use client'

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaEdit, FaRegTrashAlt } from "react-icons/fa";
import { IoSettingsSharp, IoLogOut } from "react-icons/io5";
import { CgSpinnerAlt } from "react-icons/cg";
import { theme } from "@/styles/theme";
import { supabase } from '@/lib/supabase';
import { getTeams } from '@/lib/teams';
import { getSessions, createSession, deleteSession } from '@/lib/sessions';
import { useAuth } from '@/contexts/AuthContext';
import { sessionItemVariants } from '@/constants/animations';
import type { Team, Session } from '@/types/database';

interface SidebarProps {
  currentScreen: string;
  selectedTeamId: string;
  setSelectedTeamId: (teamId: string) => void;
  currentSessionId: string | null;
  onNewSession: () => void;
  onAddNewTeam: () => void;
  onSessionClick: (sessionId: string | null) => void;
  onSettingsClick: () => void;
  onLogout: () => void;
  setCurrentScreen: React.Dispatch<React.SetStateAction<'email' | 'otp' | 'main' | 'settings'>>;
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  onTeamsLoad?: (teams: Team[]) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  selectedTeamId,
  setSelectedTeamId,
  currentSessionId,
  onNewSession,
  onAddNewTeam,
  onSessionClick,
  onSettingsClick,
  onLogout,
  setCurrentScreen,
  sidebarExpanded,
  setSidebarExpanded,
  onTeamsLoad,
}) => {
  const { coach } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Fetch teams on mount
  useEffect(() => {
    const fetchTeams = async () => {
      if (!coach?.id) {
        setTeams([]);
        setIsLoadingTeams(false);
        return;
      }

      setIsLoadingTeams(true);
      const { data, error } = await getTeams(coach.id);

      if (data) {
        setTeams(data);
        // Auto-select first team if none selected
        if (data.length > 0 && !selectedTeamId) {
          setSelectedTeamId(data[0].id);
        }
        // Notify parent about teams data
        if (onTeamsLoad) {
          onTeamsLoad(data);
        }
      }
      if (error) {
        console.error('Failed to fetch teams:', error);
      }
      setIsLoadingTeams(false);
    };

    fetchTeams();
  }, [coach?.id]);

  // Subscribe to team changes with tab-switch fix
  useEffect(() => {
    if (!coach?.id) return;

    let retryCount = 0;
    const maxRetries = 3;
    const baseDelay = 1000;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isSubscribed = false;

    const handleTeamChange = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Team fetch timeout after 5 seconds')), 5000);
        });

        const fetchPromise = getTeams(coach.id);
        const { data } = await Promise.race([fetchPromise, timeoutPromise]);

        if (data) {
          setTeams(data);

          // Check if currently selected team still exists
          const selectedTeamExists = data.find((team: Team) => team.id === selectedTeamId);

          if (!selectedTeamExists) {
            // Selected team was deleted, select first available team or clear selection
            if (data.length > 0) {
              setSelectedTeamId(data[0].id);
            } else {
              setSelectedTeamId('');
            }
          } else if (data.length > 0 && !selectedTeamId) {
            // Auto-select first team if none selected (for new team creation)
            setSelectedTeamId(data[0].id);
          }
        }
        retryCount = 0; // Reset retry count on success
      } catch (error) {
        console.error('Team subscription handler failed:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(() => {
            if (isSubscribed) {
              handleTeamChange();
            }
          }, baseDelay * retryCount);
        }
      }
    };

    const createSubscription = () => {
      try {
        channel = supabase
          .channel(`sidebar-team-changes-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'teams',
              filter: `coach_id=eq.${coach.id}`,
            },
            handleTeamChange
          )
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              isSubscribed = true;
              retryCount = 0;
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.warn('Sidebar team subscription failed, retrying...');
              isSubscribed = false;
              if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(createSubscription, baseDelay * retryCount);
              }
            }
          });
      } catch (error) {
        console.error('Failed to create team subscription:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(createSubscription, baseDelay * retryCount);
        }
      }
    };

    createSubscription();

    return () => {
      isSubscribed = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [coach?.id]);

  // Subscribe to session changes for the selected team with tab-switch fix
  useEffect(() => {
    if (!coach?.id || !selectedTeamId) return;

    let retryCount = 0;
    const maxRetries = 3;
    const baseDelay = 1000;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isSubscribed = false;

    const handleSessionChange = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Session fetch timeout after 5 seconds')), 5000);
        });

        const fetchPromise = getSessions(coach.id, selectedTeamId);
        const { data } = await Promise.race([fetchPromise, timeoutPromise]);

        if (data) {
          setSessions(data);
        }
        retryCount = 0; // Reset retry count on success
      } catch (error) {
        console.error('Session subscription handler failed:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(() => {
            if (isSubscribed) {
              handleSessionChange();
            }
          }, baseDelay * retryCount);
        }
      }
    };

    const createSubscription = () => {
      try {
        channel = supabase
          .channel(`sidebar-session-changes-${selectedTeamId}-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'sessions',
              filter: `team_id=eq.${selectedTeamId}`,
            },
            handleSessionChange
          )
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              isSubscribed = true;
              retryCount = 0;
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.warn('Sidebar session subscription failed, retrying...');
              isSubscribed = false;
              if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(createSubscription, baseDelay * retryCount);
              }
            }
          });
      } catch (error) {
        console.error('Failed to create session subscription:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(createSubscription, baseDelay * retryCount);
        }
      }
    };

    createSubscription();

    return () => {
      isSubscribed = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [coach?.id, selectedTeamId]);

  // Fallback: Listen for manual team update events
  useEffect(() => {
    const handleTeamUpdate = async () => {
      if (coach?.id) {
        const { data } = await getTeams(coach.id);
        if (data) {
          setTeams(data);

          // Check if currently selected team still exists
          const selectedTeamExists = data.find((team: { id: string }) => team.id === selectedTeamId);

          if (!selectedTeamExists) {
            // Selected team was deleted, select first available team or clear selection
            if (data.length > 0) {
              setSelectedTeamId(data[0].id);
            } else {
              setSelectedTeamId('');
            }
          } else if (data.length > 0 && !selectedTeamId) {
            // Auto-select first team if none selected (for new team creation)
            setSelectedTeamId(data[0].id);
          }
        }
      }
    };

    window.addEventListener('teamUpdated', handleTeamUpdate);
    return () => {
      window.removeEventListener('teamUpdated', handleTeamUpdate);
    };
  }, [coach?.id]);

  // Fallback: Listen for manual session update events
  useEffect(() => {
    const handleSessionUpdate = async () => {
      if (coach?.id && selectedTeamId) {
        const { data } = await getSessions(coach.id, selectedTeamId);
        if (data) {
          setSessions(data);
        }
      }
    };

    window.addEventListener('sessionUpdated', handleSessionUpdate);
    return () => {
      window.removeEventListener('sessionUpdated', handleSessionUpdate);
    };
  }, [coach?.id, selectedTeamId]);

  // Fetch sessions when team changes
  useEffect(() => {
    const fetchSessions = async () => {
      if (!coach?.id || !selectedTeamId) return;

      setIsLoadingSessions(true);
      setSessionError(null);

      const { data, error } = await getSessions(coach.id, selectedTeamId);

      if (data) {
        setSessions(data);
      }
      if (error) {
        setSessionError(error);
        console.error('Failed to fetch sessions:', error);
      }
      setIsLoadingSessions(false);
    };

    fetchSessions();
  }, [coach?.id, selectedTeamId]);

  const getSelectedTeam = () => {
    return teams.find((team: Team) => team.id === selectedTeamId);
  };

  const getTeamSessions = (teamId: string): Session[] => {
    return sessions.filter(session => session.team_id === teamId)
      .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
  };

  const handleAddTeamClick = () => {
    // Navigate to settings screen and trigger new team creation
    setCurrentScreen('settings');
    onAddNewTeam();
  };

  const handleNewSessionClick = async () => {
    if (!coach?.id) {
      onNewSession();
      return;
    }

    // Check if there are any teams available
    if (teams.length === 0) {
      alert('Please create a team first before creating a session.');
      return;
    }

    // Check if no team is selected
    if (!selectedTeamId) {
      alert('Please select a team from the dropdown above before creating a session.');
      return;
    }

    const newSessionData = {
      coach_id: coach.id,
      team_id: selectedTeamId,
      title: 'Untitled Session',
      content: '',
      session_date: new Date().toISOString().split('T')[0],
    };

    const { data: newSession, error } = await createSession(newSessionData);

    if (newSession) {
      // Add to local sessions state
      setSessions(prev => [newSession, ...prev]);
      // Navigate to the new session
      onSessionClick(newSession.id);
      setCurrentScreen('main');
    } else if (error) {
      console.error('Error creating session:', error);
      // Fallback to parent handler
      onNewSession();
    }
  };

  const handleSessionItemClick = (session: Session) => {
    onSessionClick(session.id);
    setCurrentScreen('main');
  };

  const handleDeleteSession = async (sessionId: string, sessionTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${sessionTitle}"?`)) return;

    const { error } = await deleteSession(sessionId);

    if (!error) {
      // Remove from local state immediately
      setSessions(prev => prev.filter(session => session.id !== sessionId));

      // If we're deleting the currently viewed session, clear it
      if (currentSessionId === sessionId) {
        onSessionClick(null); // Clear the current session
      }

      // Dispatch custom event for real-time fallback
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('sessionUpdated', {
          detail: { sessionId, action: 'delete' }
        }));
      }, 100);
    } else {
      console.error('Error deleting session:', error);
    }
  };

  if (currentScreen !== 'main' && currentScreen !== 'settings') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: sidebarExpanded ? '25%' : '60px',
        minWidth: sidebarExpanded ? '300px' : '60px',
        height: '100vh',
        backgroundColor: theme.colors.gold.main,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 999,
        transition: theme.transitions.normal,
        overflow: 'hidden',
      }}
      onMouseEnter={() => setSidebarExpanded(true)}
      onMouseLeave={() => setSidebarExpanded(false)}
    >
      {/* New Session Button - Always Visible at Top */}
      <div
        onClick={handleNewSessionClick}
        style={{
          position: 'absolute',
          top: theme.spacing.lg,
          left: '50%',
          transform: 'translateX(-50%)',
          width: sidebarExpanded ? `calc(100% - ${theme.spacing.lg} * 2)` : '36px',
          height: '36px',
          backgroundColor: sidebarExpanded ? theme.colors.gold.light : 'transparent',
          borderRadius: sidebarExpanded ? theme.borderRadius.md : '0',
          cursor: 'pointer',
          transition: theme.transitions.normal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarExpanded ? 'flex-start' : 'center',
          gap: sidebarExpanded ? theme.spacing.sm : '0',
          padding: sidebarExpanded ? `0 ${theme.spacing.md}` : '0',
          boxShadow: sidebarExpanded ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none',
        }}
        onMouseEnter={(e) => {
          if (sidebarExpanded) {
            e.currentTarget.style.backgroundColor = theme.colors.gold.dark;
            e.currentTarget.style.transform = 'translateX(-50%) translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
          } else {
            e.currentTarget.style.transform = 'translateX(-50%) scale(1.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (sidebarExpanded) {
            e.currentTarget.style.backgroundColor = theme.colors.gold.light;
            e.currentTarget.style.transform = 'translateX(-50%) translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
          } else {
            e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
          }
        }}
      >
        <FaEdit
          size={20}
          color={sidebarExpanded ? theme.colors.text.primary : theme.colors.text.secondary}
        />
        {sidebarExpanded && (
          <span
            style={{
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              whiteSpace: 'nowrap',
            }}
          >
            New Session
          </span>
        )}
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {sidebarExpanded && (
          <motion.div
            key="sidebar-content"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: {
                duration: 0.2,
                delay: 0.15,
                ease: "easeOut"
              }
            }}
            exit={{
              opacity: 0,
              transition: {
                duration: 0.1,
                ease: "easeIn"
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              paddingTop: `calc(36px + ${theme.spacing.lg} + ${theme.spacing.md})`,
            }}
          >
            {/* Team Selector Header */}
            <div
              style={{
                padding: theme.spacing.lg,
              }}
            >
              <h4
                style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.medium,
                  margin: '0 0 ' + theme.spacing.md + ' 0',
                }}
              >
                Team
              </h4>

              {/* Team Dropdown or Add Team Button */}
              {isLoadingTeams ? (
                <div
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    backgroundColor: theme.colors.background.secondary,
                    border: `1px solid ${theme.colors.gold.dark}`,
                    borderRadius: theme.borderRadius.md,
                    color: theme.colors.text.primary,
                    fontSize: theme.typography.fontSize.base,
                    fontFamily: theme.typography.fontFamily.primary,
                    marginBottom: theme.spacing.md,
                    textAlign: 'center',
                  }}
                >
                  Loading teams...
                </div>
              ) : teams.length === 0 ? (
                <div
                  onClick={handleAddTeamClick}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    backgroundColor: theme.colors.gold.main,
                    border: `1px solid ${theme.colors.gold.dark}`,
                    borderRadius: theme.borderRadius.md,
                    color: theme.colors.text.primary,
                    fontSize: theme.typography.fontSize.base,
                    fontFamily: theme.typography.fontFamily.primary,
                    marginBottom: theme.spacing.md,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: theme.transitions.fast,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.gold.light;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.gold.main;
                  }}
                >
                  + Add New Team
                </div>
              ) : (
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: `${theme.spacing.md} ${theme.spacing.xl} ${theme.spacing.md} ${theme.spacing.md}`,
                    backgroundColor: theme.colors.gold.light,
                    border: `1px solid ${theme.colors.gold.dark}`,
                    borderRadius: theme.borderRadius.md,
                    color: theme.colors.text.primary,
                    fontSize: theme.typography.fontSize.base,
                    fontFamily: theme.typography.fontFamily.primary,
                    outline: 'none',
                    marginBottom: theme.spacing.md,
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(theme.colors.text.primary)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: `right ${theme.spacing.md} center`,
                    backgroundSize: '16px',
                  }}
                >
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Team Stats */}
              {getSelectedTeam() && (
                <div
                  style={{
                    backgroundColor: 'transparent',
                    padding: theme.spacing.md,
                    borderRadius: theme.borderRadius.md,
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: theme.spacing.xs,
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text.primary,
                    }}
                  >
                    <span>{getSelectedTeam()!.age_group}</span>
                    <span>{getSelectedTeam()!.session_duration} min</span>
                    <span>{getSelectedTeam()!.player_count} players</span>
                    <span>{getSelectedTeam()!.sessions_per_week}x/week</span>
                  </div>
                </div>
              )}
            </div>

            {/* Session History */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: theme.spacing.lg,
              }}
            >
              <h4
                style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.medium,
                  margin: '0 0 ' + theme.spacing.md + ' 0',
                }}
              >
                Sessions
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                {isLoadingSessions ? (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: theme.spacing.lg,
                      color: theme.colors.text.muted,
                    }}
                  >
                    <CgSpinnerAlt
                      style={{
                        animation: 'spin 1s linear infinite',
                        fontSize: '20px'
                      }}
                    />
                  </div>
                ) : sessionError ? (
                  <div
                    style={{
                      padding: theme.spacing.md,
                      color: theme.colors.status.error,
                      fontSize: theme.typography.fontSize.sm,
                      textAlign: 'center',
                    }}
                  >
                    Failed to load sessions
                  </div>
                ) : getTeamSessions(selectedTeamId).length === 0 ? (
                  <div
                    onClick={handleNewSessionClick}
                    style={{
                      padding: theme.spacing.md,
                      backgroundColor: theme.colors.gold.main,
                      color: theme.colors.text.primary,
                      fontSize: theme.typography.fontSize.sm,
                      textAlign: 'center',
                      borderRadius: theme.borderRadius.md,
                      cursor: 'pointer',
                      transition: theme.transitions.fast,
                      border: `1px solid ${theme.colors.gold.dark}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.gold.light;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.gold.main;
                    }}
                  >
                    + Create A Session
                  </div>
                ) : (
                  <AnimatePresence>
                    {getTeamSessions(selectedTeamId).map(session => (
                      <motion.div
                        key={session.id}
                        variants={sessionItemVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        layout
                        style={{
                          backgroundColor: currentSessionId === session.id ? theme.colors.gold.dark : theme.colors.gold.light,
                          padding: theme.spacing.md,
                          borderRadius: theme.borderRadius.md,
                          transition: theme.transitions.fast,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: theme.spacing.sm,
                        }}
                      >
                      <div
                        style={{
                          flex: 1,
                          cursor: 'pointer',
                        }}
                        onClick={() => handleSessionItemClick(session)}
                      >
                        <div
                          style={{
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.text.primary,
                            fontWeight: theme.typography.fontWeight.medium,
                            marginBottom: theme.spacing.xs,
                          }}
                        >
                          {session.title}
                        </div>
                        <div
                          style={{
                            fontSize: theme.typography.fontSize.xs,
                            color: theme.colors.text.primary,
                          }}
                        >
                          {new Date(session.session_date).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id, session.title);
                        }}
                        style={{
                          padding: theme.spacing.xs,
                          backgroundColor: 'transparent',
                          color: theme.colors.text.primary,
                          border: 'none',
                          borderRadius: theme.borderRadius.sm,
                          cursor: 'pointer',
                          transition: theme.transitions.fast,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ff6b6b';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = theme.colors.text.primary;
                        }}
                        title="Delete session"
                      >
                        <FaRegTrashAlt size={14} />
                      </button>
                    </motion.div>
                  ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Button - Always Visible at Bottom */}
      <div
        onClick={onSettingsClick}
        style={{
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: sidebarExpanded ? `calc(100% - ${theme.spacing.lg} * 2)` : 'auto',
          height: '40px',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          transition: theme.transitions.normal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.sm,
          padding: sidebarExpanded ? `${theme.spacing.sm} ${theme.spacing.md}` : `${theme.spacing.sm}`,
          borderRadius: theme.borderRadius.sm,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.transform = 'translateX(-50%) translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.transform = 'translateX(-50%) translateY(0px)';
        }}
      >
        <IoSettingsSharp
          size={20}
          color={sidebarExpanded ? theme.colors.text.primary : theme.colors.text.secondary}
        />
        {sidebarExpanded && (
          <span
            style={{
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              whiteSpace: 'nowrap',
            }}
          >
            Settings
          </span>
        )}
      </div>

      {/* Logout Button - Always Visible at Bottom */}
      <div
        onClick={onLogout}
        style={{
          position: 'absolute',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: sidebarExpanded ? `calc(100% - ${theme.spacing.lg} * 2)` : 'auto',
          height: '40px',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          transition: theme.transitions.normal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.sm,
          padding: sidebarExpanded ? `${theme.spacing.sm} ${theme.spacing.md}` : `${theme.spacing.sm}`,
          borderRadius: theme.borderRadius.sm,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.transform = 'translateX(-50%) translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.transform = 'translateX(-50%) translateY(0px)';
        }}
      >
        <IoLogOut
          size={20}
          color={sidebarExpanded ? theme.colors.text.primary : theme.colors.text.secondary}
        />
        {sidebarExpanded && (
          <span
            style={{
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              whiteSpace: 'nowrap',
            }}
          >
            Logout
          </span>
        )}
      </div>
    </div>
  );
};