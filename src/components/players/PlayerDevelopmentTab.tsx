'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import { IDPProgressCard, type IDPTrainingSession } from './IDPProgressCard'
import { getAllIDPTrainingSessions } from '@/lib/playerAnalytics'
import type {
  PlayerIDPProgress,
  PlayerIDPPriority,
} from '@/types/database'

interface PlayerDevelopmentTabProps {
  idpProgress: PlayerIDPProgress[]
  attributeNames: Record<string, string>
  isLoading: boolean
  playerId: string
  // Enhanced props for new features
  idpPriorities?: PlayerIDPPriority[] | null
}

export const PlayerDevelopmentTab: React.FC<PlayerDevelopmentTabProps> = ({
  idpProgress,
  attributeNames,
  isLoading,
  playerId,
  idpPriorities,
}) => {
  const [showHistory, setShowHistory] = useState(false)
  const [trainingSessions, setTrainingSessions] = useState<Record<string, IDPTrainingSession[]>>({})
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)

  // Separate active and historical IDPs
  const activeIDPs = idpProgress.filter((idp) => idp.ended_at === null)
  const historicalIDPs = idpProgress.filter((idp) => idp.ended_at !== null)

  const displayedIDPs = showHistory ? idpProgress : activeIDPs

  const getAttributeName = (key: string) => {
    return attributeNames[key] || key
  }

  // Get priority data for a specific IDP
  const getPriorityData = (attributeKey: string) => {
    return idpPriorities?.find((p) => p.attribute_key === attributeKey)
  }

  // Fetch training sessions for all IDPs
  const fetchTrainingSessions = useCallback(async () => {
    const attributeKeys = idpProgress.map(idp => idp.attribute_key)
    if (attributeKeys.length === 0) return

    setIsLoadingSessions(true)
    const { data } = await getAllIDPTrainingSessions(playerId, attributeKeys)
    if (data) {
      setTrainingSessions(data)
    }
    setIsLoadingSessions(false)
  }, [playerId, idpProgress])

  useEffect(() => {
    if (idpProgress.length > 0 && Object.keys(trainingSessions).length === 0) {
      fetchTrainingSessions()
    }
  }, [idpProgress, trainingSessions, fetchTrainingSessions])

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.xl,
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xl }}>
      {/* Toggle: Current vs All History */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          backgroundColor: theme.colors.background.secondary,
          padding: theme.spacing.xs,
          borderRadius: theme.borderRadius.md,
          width: 'fit-content',
        }}
      >
        <button
          onClick={() => setShowHistory(false)}
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            backgroundColor: !showHistory
              ? theme.colors.gold.main
              : 'transparent',
            color: !showHistory
              ? theme.colors.background.primary
              : theme.colors.text.secondary,
            border: 'none',
            borderRadius: theme.borderRadius.sm,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            cursor: 'pointer',
            transition: theme.transitions.fast,
          }}
        >
          Current IDPs
        </button>
        <button
          onClick={() => setShowHistory(true)}
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            backgroundColor: showHistory
              ? theme.colors.gold.main
              : 'transparent',
            color: showHistory
              ? theme.colors.background.primary
              : theme.colors.text.secondary,
            border: 'none',
            borderRadius: theme.borderRadius.sm,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            cursor: 'pointer',
            transition: theme.transitions.fast,
          }}
        >
          All History ({idpProgress.length})
        </button>
      </div>

      {/* IDP Cards */}
      {displayedIDPs.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.md,
          }}
        >
          {displayedIDPs.map((idp) => {
            const priorityData = getPriorityData(idp.attribute_key)
            const sessions = trainingSessions[idp.attribute_key] || []
            return (
              <IDPProgressCard
                key={idp.idp_id}
                idpProgress={idp}
                attributeName={getAttributeName(idp.attribute_key)}
                isHistorical={idp.ended_at !== null}
                gapStatus={priorityData?.gap_status}
                lastTrainedDate={priorityData?.last_trained_date}
                trainingSessions={sessions}
              />
            )
          })}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: theme.spacing.xl,
            color: theme.colors.text.secondary,
          }}
        >
          {showHistory ? (
            <p>No IDP history found for this player.</p>
          ) : (
            <>
              <p style={{ marginBottom: theme.spacing.sm }}>
                No active IDPs set for this player.
              </p>
              <p style={{ fontSize: theme.typography.fontSize.sm }}>
                Go to the Details tab and click Edit to add development targets.
              </p>
            </>
          )}
        </div>
      )}

      {/* Historical IDPs Section Header (when showing current) */}
      {!showHistory && historicalIDPs.length > 0 && (
        <div
          style={{
            textAlign: 'center',
            paddingTop: theme.spacing.md,
            borderTop: `1px solid ${theme.colors.border.primary}`,
          }}
        >
          <button
            onClick={() => setShowHistory(true)}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              backgroundColor: 'transparent',
              color: theme.colors.text.secondary,
              border: `1px solid ${theme.colors.border.primary}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.sm,
              cursor: 'pointer',
              transition: theme.transitions.fast,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.colors.text.secondary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.colors.border.primary
            }}
          >
            View {historicalIDPs.length} Historical IDP
            {historicalIDPs.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  )
}
