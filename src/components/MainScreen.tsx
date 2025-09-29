'use client'

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { theme } from "@/styles/theme";
import { mainVariants } from '@/constants/animations';
import { SessionEditor } from '@/components/sessions/SessionEditor';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ChatInput } from '@/components/chat/ChatInput';
import type { ChatMessageType } from '@/components/chat/ChatMessage';
import type { Session } from '@/types/database';
import { supabase } from '@/lib/supabase';

interface MainScreenProps {
  sessionId: string | null;
  coachId: string | null;
  teamId?: string | null;
  teams?: Array<{
    id: string;
    name: string;
    age_group: string;
    skill_level: string;
    player_count: number;
    session_duration: number;
  }>;
}

export const MainScreen: React.FC<MainScreenProps> = ({
  sessionId,
  coachId,
  teamId,
  teams = [],
}) => {
  // Local chat state
  const [chatMessages, setChatMessages] = useState<ChatMessageType[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const [sessionContent, setSessionContent] = useState<string>('');
  const [aiUpdatedContent, setAiUpdatedContent] = useState<string | undefined>(undefined);

  // Session and context state
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [globalRules, setGlobalRules] = useState<Array<{ content: string }>>([]);
  const [teamRules, setTeamRules] = useState<Array<{ content: string }>>([]);

  // Callback to receive content from SessionEditor
  const handleContentUpdate = (newContent: string) => {
    setSessionContent(newContent);
  };

  // Callback to receive session data from SessionEditor
  const handleSessionLoad = (session: Session) => {
    setCurrentSession(session);
  };

  // Fetch coaching rules when session or team changes
  useEffect(() => {
    const fetchCoachingRules = async () => {
      if (!coachId) return;

      try {
        // Fetch global rules
        const { data: globalData } = await supabase
          .from('coaching_rules')
          .select('content')
          .is('team_id', null)
          .eq('is_active', true);

        // Fetch team-specific rules
        const { data: teamData } = await supabase
          .from('coaching_rules')
          .select('content')
          .eq('team_id', teamId || '')
          .eq('is_active', true);

        setGlobalRules(globalData || []);
        setTeamRules(teamData || []);
      } catch (error) {
        console.error('Failed to fetch coaching rules:', error);
      }
    };

    fetchCoachingRules();
  }, [coachId, teamId]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !sessionId || !teamId || !currentSession) return;

    // Find current team data
    const currentTeam = teams.find(team => team.id === teamId);
    if (!currentTeam) return;

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
            id: currentSession.id, // Session unique identifier
            title: currentSession.title, // Session title/name
            date: currentSession.session_date, // Date of the session
            teamId: currentSession.team_id // ID of team this session is for
          },
          // Team data with clear labels
          team: {
            name: currentTeam.name, // Team name
            ageGroup: currentTeam.age_group, // Age category (e.g., U12, U16)
            skillLevel: currentTeam.skill_level, // Skill level (beginner/intermediate/advanced)
            playerCount: currentTeam.player_count, // Number of players in the team
            sessionDuration: currentTeam.session_duration // Typical training session length in minutes
          },
          // Coaching rules with clear labels
          teamRules: teamRules, // Array of team-specific coaching guidelines
          globalRules: globalRules, // Array of general coaching methodology rules
          // Content and conversation
          currentContent: sessionContent, // The current session plan text
          conversationHistory: chatMessages.slice(-10), // Previous chat messages for context
          message: currentInput // User's current request/question
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
          content: data.message.replace(/\\n/g, '\n'), // Convert escaped newlines back to actual newlines
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
      key="main"
      variants={mainVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        flex: 1,
        height: '100vh',
        backgroundColor: theme.colors.background.primary,
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      {/* Main Content Area */}
      {sessionId ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            gap: theme.spacing.lg,
            padding: theme.spacing.md,
            height: '100%',
          }}
        >
          {/* Session Editor */}
          <SessionEditor
            sessionId={sessionId}
            coachId={coachId}
            onContentUpdate={handleContentUpdate}
            onSessionLoad={handleSessionLoad}
            externalContent={aiUpdatedContent}
            isAILoading={isAILoading}
          />

          {/* Chat Interface */}
          <div
            style={{
              width: '50%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              background: theme.colors.background.secondary,
              borderRadius: theme.borderRadius.lg,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
            }}
          >
            {/* Fixed Header */}
            <div
              style={{
                padding: theme.spacing.lg,
                background: theme.colors.gold.main,
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
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
                AI Coach Chat
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
        </div>
      ) : (
        // Default state when no session is selected
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: theme.spacing.xl,
          }}
        >
          <div
            style={{
              textAlign: 'center',
              padding: `${theme.spacing['2xl']} ${theme.spacing.xl}`,
              backgroundColor: theme.colors.background.secondary,
              borderRadius: theme.borderRadius.xl,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              maxWidth: '500px',
              background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
            }}
          >
            <h2
              style={{
                color: theme.colors.text.primary,
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.semibold,
                marginBottom: theme.spacing.lg,
                letterSpacing: '-0.025em',
              }}
            >
              Welcome to Session Planning
            </h2>
            <p
              style={{
                color: theme.colors.text.muted,
                fontSize: theme.typography.fontSize.base,
                lineHeight: 1.7,
                marginBottom: theme.spacing.md,
              }}
            >
              Select a session from the sidebar to begin editing, or create a new session to start planning your next training.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};