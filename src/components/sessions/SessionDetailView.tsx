import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';
import { GiSoccerBall } from 'react-icons/gi';
import { theme } from '@/styles/theme';
import { SessionEditor } from '@/components/sessions/SessionEditor';
import { BlockEditor } from '@/components/sessions/BlockEditor';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ChatInput } from '@/components/chat/ChatInput';
import type { ChatMessageType } from '@/components/chat/ChatMessage';
import type { Session, Team, SessionThemeSnapshot, GameModelZones } from '@/types/database';
import { getClubGameModelZones } from '@/lib/methodology';

// Extended session type that includes syllabus fields
interface SessionWithTheme extends Session {
  theme_snapshot?: SessionThemeSnapshot | null;
}
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface SessionDetailViewProps {
  sessionId: string;
  coachId: string;
  team: Team;
  onBack: () => void;
  mode: 'view' | 'edit';
}

export const SessionDetailView: React.FC<SessionDetailViewProps> = ({
  sessionId,
  coachId,
  team,
  onBack,
  mode,
}) => {
  // Local chat state
  const [chatMessages, setChatMessages] = useState<ChatMessageType[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const [sessionContent, setSessionContent] = useState<string>('');
  const [aiUpdatedContent, setAiUpdatedContent] = useState<string | undefined>(undefined);

  // Session and context state
  const [currentSession, setCurrentSession] = useState<SessionWithTheme | null>(null);
  const [gameModel, setGameModel] = useState<GameModelZones | null>(null);
  const [globalRules, setGlobalRules] = useState<Array<{ content: string }>>([]);
  const [teamRules, setTeamRules] = useState<Array<{ content: string }>>([]);
  const [players, setPlayers] = useState<Array<{
    name: string;
    age: number | null;
    position: string | null;
    gender: string | null;
    idps: Array<{ attribute_key: string; priority: number; notes: string | null }>;
  }>>([]);

  // Callback to receive content from SessionEditor
  const handleContentUpdate = (newContent: string) => {
    setSessionContent(newContent);
  };

  // Callback to receive session data from SessionEditor
  const handleSessionLoad = (session: SessionWithTheme) => {
    setCurrentSession(session);
  };

  // Fetch session data when in view mode
  useEffect(() => {
    const fetchSession = async () => {
      if (mode !== 'view' || !sessionId) return;

      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (error) {
          console.error('Error fetching session:', error);
          return;
        }

        if (data) {
          setCurrentSession(data as SessionWithTheme);
          setSessionContent(data.content || '');
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
      }
    };

    fetchSession();
  }, [sessionId, mode]);

  // Fetch game model when session is loaded
  useEffect(() => {
    const fetchGameModel = async () => {
      if (!currentSession?.club_id) {
        setGameModel(null);
        return;
      }

      const { data, error } = await getClubGameModelZones(currentSession.club_id);
      if (error) {
        console.error('Failed to fetch game model:', error);
      }
      setGameModel(data);
    };

    fetchGameModel();
  }, [currentSession?.club_id]);

  // TODO: Fetch methodology data from v2 tables (game_model, training_methodology)
  // For now, rules are empty until methodology migration is complete
  useEffect(() => {
    setGlobalRules([]);
    setTeamRules([]);
  }, [coachId, team.id]);

  // Fetch players for the team with their active IDPs
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const { data: playersData } = await supabase
          .from('players')
          .select(`
            id,
            name,
            age,
            position,
            gender,
            player_idps!inner (
              attribute_key,
              priority,
              notes
            )
          `)
          .eq('team_id', team.id)
          .eq('player_idps.status', 'active')
          .order('name', { ascending: true });

        // Also fetch players without IDPs
        const { data: allPlayersData } = await supabase
          .from('players')
          .select('id, name, age, position, gender')
          .eq('team_id', team.id)
          .order('name', { ascending: true });

        // Merge players with and without IDPs
        interface PlayerWithIdps {
          id: string;
          name: string;
          age: number | null;
          position: string | null;
          gender: string | null;
          player_idps: Array<{ attribute_key: string; priority: number; notes: string | null }>;
        }

        const playersWithIdps = new Map<string, PlayerWithIdps>(
          (playersData || []).map((p: PlayerWithIdps) => [p.id, p])
        );

        const mergedPlayers = (allPlayersData || []).map((player: { id: string; name: string; age: number | null; position: string | null; gender: string | null }) => {
          const playerWithIdps = playersWithIdps.get(player.id);
          return {
            name: player.name,
            age: player.age,
            position: player.position,
            gender: player.gender,
            idps: playerWithIdps ? playerWithIdps.player_idps : []
          };
        });

        setPlayers(mergedPlayers);
      } catch (error) {
        console.error('Failed to fetch players:', error);
      }
    };

    fetchPlayers();
  }, [team.id]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !sessionId || !currentSession) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');
    setIsAILoading(true);

    // Add temporary "thinking" message
    const thinkingMessage = {
      id: 'thinking',
      type: 'assistant' as const,
      content: '...',
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, thinkingMessage]);

    try {
      // Call AI API with complete context
      const response = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Session data with clear labels
          session: {
            id: currentSession.id,
            title: currentSession.title,
            date: currentSession.session_date,
            teamId: currentSession.team_id
          },
          // Team data with clear labels
          team: {
            name: team.name,
            ageGroup: team.age_group,
            skillLevel: team.skill_level,
            playerCount: team.player_count,
            sessionDuration: team.session_duration
          },
          // Coaching rules with clear labels
          teamRules: teamRules,
          globalRules: globalRules,
          // Player IDPs
          players: players,
          // Content and conversation
          currentContent: sessionContent,
          conversationHistory: chatMessages.slice(-10),
          message: currentInput
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Handle intent-based responses
        if (data.intent === 'change' && data.updatedPlan) {
          // Update session content only for change requests
          setAiUpdatedContent(data.updatedPlan);
          handleContentUpdate(data.updatedPlan);
        }
        // For questions, session content remains unchanged

        // Remove thinking message and add AI response
        setChatMessages(prev => prev.filter(msg => msg.id !== 'thinking'));
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant' as const,
          content: data.message.replace(/\\n/g, '\n'),
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, aiMessage]);
      } else {
        // Remove thinking message and handle error
        setChatMessages(prev => prev.filter(msg => msg.id !== 'thinking'));
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant' as const,
          content: `Sorry, I couldn't process your request: ${data.error || 'Unknown error'}`,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Failed to get AI response:', error);
      // Remove thinking message and add error
      setChatMessages(prev => prev.filter(msg => msg.id !== 'thinking'));
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAILoading(false);
    }
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{
        flex: 1,
        height: '100%',
        backgroundColor: theme.colors.background.primary,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header with Title and Back Button */}
      <div
        style={{
          padding: `${theme.spacing.xl} ${theme.spacing.xl} ${theme.spacing.md} ${theme.spacing.xl}`,
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
          <div>
            <h1
              style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                margin: 0,
              }}
            >
              Session Planning
            </h1>
            <p
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                margin: 0,
                marginTop: '2px',
              }}
            >
              {team.name}
            </p>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            backgroundColor: 'transparent',
            color: theme.colors.text.secondary,
            border: 'none',
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.semibold,
            cursor: 'pointer',
            transition: theme.transitions.fast,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
            e.currentTarget.style.color = theme.colors.text.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = theme.colors.text.secondary;
          }}
        >
          <FaArrowLeft size={16} />
          <span>Back to Sessions</span>
        </button>
      </div>

      {/* Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: theme.spacing.lg,
          padding: `${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.md} ${theme.spacing.md}`,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {mode === 'view' ? (
          /* View Mode - Read-only Session Display */
          <div
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              background: theme.colors.background.secondary,
              borderRadius: theme.borderRadius.lg,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}
          >
            {/* Session Header */}
            <div
              style={{
                padding: theme.spacing.xl,
                background: theme.colors.background.secondary,
                borderBottom: `1px solid ${theme.colors.border.secondary}`,
                flexShrink: 0,
              }}
            >
              <h2
                style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.fontSize['2xl'],
                  fontWeight: theme.typography.fontWeight.bold,
                  margin: 0,
                  marginBottom: theme.spacing.sm,
                }}
              >
                {currentSession?.title || 'Loading...'}
              </h2>
              <div
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.secondary,
                }}
              >
                {currentSession ? new Date(currentSession.session_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : ''}
              </div>

              {/* Theme Badge (if from syllabus) */}
              {currentSession?.theme_snapshot && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    backgroundColor:
                      currentSession.theme_snapshot.blockType === 'in_possession'
                        ? 'rgba(239, 191, 4, 0.15)'
                        : 'rgba(220, 53, 69, 0.15)',
                    borderRadius: theme.borderRadius.sm,
                    marginTop: theme.spacing.md,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor:
                        currentSession.theme_snapshot.blockType === 'in_possession'
                          ? theme.colors.gold.main
                          : theme.colors.status.error,
                    }}
                  />
                  <span
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      color:
                        currentSession.theme_snapshot.blockType === 'in_possession'
                          ? theme.colors.gold.main
                          : theme.colors.status.error,
                      fontWeight: theme.typography.fontWeight.medium,
                    }}
                  >
                    {currentSession.theme_snapshot.zoneName} • {currentSession.theme_snapshot.blockName}
                  </span>
                </div>
              )}
            </div>

            {/* Session Blocks - Read Only */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <BlockEditor
                sessionId={sessionId}
                coachId={coachId}
                clubId={currentSession?.club_id || null}
                teamId={team.id}
                readOnly={true}
                gameModel={gameModel}
                sessionTheme={currentSession?.theme_snapshot || null}
              />
            </div>
          </div>
        ) : (
          /* Edit Mode - Session Editor (Full Width) */
          <>
            {/* Session Editor - Full Width */}
            <SessionEditor
              sessionId={sessionId}
              coachId={coachId}
              onContentUpdate={handleContentUpdate}
              onSessionLoad={handleSessionLoad}
              externalContent={aiUpdatedContent}
              isAILoading={isAILoading}
            />

            {/* AI Chat Interface - Hidden for now */}
            {false && (
              <div
                style={{
                  width: '50%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: theme.colors.background.secondary,
                  borderRadius: theme.borderRadius.lg,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  overflow: 'hidden',
                }}
              >
                {/* Fixed Header */}
                <div
                  style={{
                    padding: theme.spacing.lg,
                    background: theme.colors.background.secondary,
                    borderBottom: `1px solid ${theme.colors.border.secondary}`,
                    flexShrink: 0,
                  }}
                >
                  <h3
                    style={{
                      color: theme.colors.text.primary,
                      fontSize: theme.typography.fontSize.lg,
                      fontWeight: theme.typography.fontWeight.semibold,
                      margin: 0,
                      letterSpacing: '-0.025em',
                    }}
                  >
                    AI Coach Helper
                  </h3>
                  <p
                    style={{
                      color: theme.colors.text.primary,
                      fontSize: theme.typography.fontSize.sm,
                      margin: `${theme.spacing.xs} 0 0 0`,
                      opacity: 0.8,
                    }}
                  >
                    Get help planning your session
                  </p>
                </div>

                {/* Scrollable Messages Area */}
                <ChatInterface
                  messages={chatMessages}
                />

                {/* Fixed Input at Bottom */}
                <div style={{ flexShrink: 0 }}>
                  <ChatInput
                    value={chatInput}
                    onChange={setChatInput}
                    onSend={handleSendMessage}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};
