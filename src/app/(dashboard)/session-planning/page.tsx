'use client'

import React, { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { SessionsListView } from '@/components/sessions/SessionsListView'
import { SessionDetailView } from '@/components/sessions/SessionDetailView'
import { useAuth } from '@/contexts/AuthContext'
import { useTeam } from '@/contexts/TeamContext'
import { theme } from '@/styles/theme'
import { CgSpinnerAlt } from 'react-icons/cg'
import { motion } from 'framer-motion'

export default function SessionPlanningPage() {
  const { coach } = useAuth()
  const { selectedTeam, isLoadingTeams } = useTeam()

  // View state: 'list' or { sessionId, mode }
  const [viewState, setViewState] = useState<
    'list' | { sessionId: string; mode: 'view' | 'edit' }
  >('list')

  const handleSessionSelect = (sessionId: string, mode: 'view' | 'edit') => {
    setViewState({ sessionId, mode })
  }

  const handleBack = () => {
    setViewState('list')
  }

  if (isLoadingTeams || !coach) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <CgSpinnerAlt size={32} color={theme.colors.gold.main} />
        </motion.div>
      </div>
    )
  }

  if (!selectedTeam) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: theme.colors.text.secondary,
        }}
      >
        Please select a team to view sessions
      </div>
    )
  }

  return (
    <div style={{ height: '100%', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        {viewState === 'list' ? (
          <SessionsListView
            key="sessions-list"
            coachId={coach.id}
            team={selectedTeam}
            onSessionSelect={handleSessionSelect}
          />
        ) : (
          <SessionDetailView
            key={`session-detail-${viewState.sessionId}`}
            sessionId={viewState.sessionId}
            coachId={coach.id}
            team={selectedTeam}
            onBack={handleBack}
            mode={viewState.mode}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
