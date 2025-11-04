'use client'

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { theme } from "@/styles/theme";
import { mainVariants } from '@/constants/animations';
import { SessionsListView } from '@/components/sessions/SessionsListView';
import { SessionDetailView } from '@/components/sessions/SessionDetailView';
import type { Team } from '@/types/database';
import { supabase } from '@/lib/supabase';

interface MainScreenProps {
  sessionId?: string | null;
  sessionMode?: 'view' | 'edit';
  coachId: string | null;
  teamId: string | null;
  teams?: Array<{
    id: string;
    name: string;
    age_group: string;
    skill_level: string;
    player_count: number;
    session_duration: number;
  }>;
  onClearSession?: () => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({
  sessionId: initialSessionId,
  sessionMode: initialSessionMode = 'view',
  coachId,
  teamId,
  onClearSession,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionMode, setSessionMode] = useState<'view' | 'edit'>('view');
  const [team, setTeam] = useState<Team | null>(null);

  // Fetch team data
  useEffect(() => {
    const fetchTeam = async () => {
      if (!teamId) return;

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

  // Handle navigation from external sources (like dashboard)
  useEffect(() => {
    if (initialSessionId) {
      setSelectedSessionId(initialSessionId);
      setSessionMode(initialSessionMode);
      setViewMode('detail');
    }
  }, [initialSessionId, initialSessionMode]);

  const handleSessionSelect = (sessionId: string, mode: 'view' | 'edit') => {
    setSelectedSessionId(sessionId);
    setSessionMode(mode);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedSessionId(null);
    // Clear parent state so returning to sessions tab doesn't auto-navigate
    if (onClearSession) {
      onClearSession();
    }
  };

  if (!coachId || !teamId || !team) {
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
        <div
          style={{
            textAlign: 'center',
            color: theme.colors.text.secondary,
            fontSize: theme.typography.fontSize.lg,
          }}
        >
          Loading...
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="sessions"
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
      {/* Conditional Rendering: List or Detail View */}
      {viewMode === 'list' ? (
        <SessionsListView
          coachId={coachId}
          team={team}
          onSessionSelect={handleSessionSelect}
        />
      ) : selectedSessionId ? (
        <SessionDetailView
          sessionId={selectedSessionId}
          coachId={coachId}
          team={team}
          onBack={handleBackToList}
          mode={sessionMode}
        />
      ) : null}
    </motion.div>
  );
};