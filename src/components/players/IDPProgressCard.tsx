'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaChevronDown } from 'react-icons/fa'
import { theme } from '@/styles/theme'
import type { PlayerIDPProgress } from '@/types/database'
import {
  formatIDPDuration,
  getPriorityLabel,
  formatTimeAgo,
  getGapStatusColor,
} from '@/lib/playerAnalytics'

export interface IDPTrainingSession {
  session_id: string
  session_title: string
  session_date: string
  weight: number
}

interface IDPProgressCardProps {
  idpProgress: PlayerIDPProgress
  attributeName: string
  isHistorical?: boolean
  // Enhanced props for urgency display
  gapStatus?: 'urgent' | 'due' | 'on_track'
  lastTrainedDate?: string | null
  // Training sessions for this IDP
  trainingSessions?: IDPTrainingSession[]
}

export const IDPProgressCard: React.FC<IDPProgressCardProps> = ({
  idpProgress,
  attributeName,
  isHistorical = false,
  gapStatus,
  lastTrainedDate,
  trainingSessions = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div
      style={{
        backgroundColor: isHistorical
          ? 'rgba(19, 25, 26, 0.5)'
          : theme.colors.background.secondary,
        border: `1px solid ${theme.colors.border.primary}`,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        opacity: isHistorical ? 0.8 : 1,
      }}
    >
      {/* Header - Clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: theme.spacing.md,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          {/* Priority Badge */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: isHistorical
                ? theme.colors.text.muted
                : theme.colors.gold.main,
              color: theme.colors.background.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: theme.typography.fontWeight.bold,
              fontSize: theme.typography.fontSize.sm,
              flexShrink: 0,
            }}
          >
            {isHistorical ? '—' : idpProgress.priority}
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
              }}
            >
              {/* Urgency dot (when available) */}
              {gapStatus && !isHistorical && (
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: getGapStatusColor(gapStatus),
                    flexShrink: 0,
                  }}
                  title={`Status: ${gapStatus.replace('_', ' ')}`}
                />
              )}
              <span
                style={{
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text.primary,
                }}
              >
                {attributeName}
              </span>
            </div>
            <div
              style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.secondary,
                marginTop: '2px',
              }}
            >
              {isHistorical ? (
                <>
                  {formatDate(idpProgress.started_at)} -{' '}
                  {idpProgress.ended_at ? formatDate(idpProgress.ended_at) : 'Present'}
                  {' · '}
                  {formatIDPDuration(idpProgress.started_at, idpProgress.ended_at)}
                </>
              ) : (
                <>
                  {getPriorityLabel(idpProgress.priority)}
                  {lastTrainedDate !== undefined && (
                    <> · {formatTimeAgo(lastTrainedDate)}</>
                  )}
                  {lastTrainedDate === undefined && (
                    <> · Started {formatDate(idpProgress.started_at)}</>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          {/* Quick Stats */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
            }}
          >
            <span>{idpProgress.training_sessions} sessions</span>
          </div>

          {/* Chevron */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <FaChevronDown
              size={14}
              color={theme.colors.text.secondary}
            />
          </motion.div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: theme.spacing.md,
                paddingTop: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.md,
              }}
            >
              {/* Training Progress Section */}
              <div
                style={{
                  backgroundColor: theme.colors.background.primary,
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.md,
                }}
              >
                <div
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.text.primary,
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  Training Progress
                </div>
                <div
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                    marginBottom: theme.spacing.md,
                  }}
                >
                  {idpProgress.training_sessions} session{idpProgress.training_sessions !== 1 ? 's' : ''} with relevant training
                </div>

                {/* Sessions Horizontal Scroll */}
                {trainingSessions.length > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      gap: theme.spacing.sm,
                      overflowX: 'auto',
                      paddingBottom: theme.spacing.sm,
                      WebkitOverflowScrolling: 'touch',
                    }}
                  >
                    {trainingSessions.map((session) => (
                      <div
                        key={session.session_id}
                        style={{
                          minWidth: '140px',
                          maxWidth: '180px',
                          flexShrink: 0,
                          backgroundColor: theme.colors.background.secondary,
                          borderRadius: theme.borderRadius.md,
                          padding: theme.spacing.sm,
                          border: `1px solid ${theme.colors.border.primary}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: theme.typography.fontSize.sm,
                            fontWeight: theme.typography.fontWeight.medium,
                            color: theme.colors.text.primary,
                            marginBottom: theme.spacing.xs,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {session.session_title}
                        </div>
                        <div
                          style={{
                            fontSize: theme.typography.fontSize.xs,
                            color: theme.colors.text.secondary,
                          }}
                        >
                          {formatShortDate(session.session_date)}
                        </div>
                        <div
                          style={{
                            fontSize: theme.typography.fontSize.xs,
                            color: session.weight >= 1
                              ? theme.colors.status.success
                              : theme.colors.gold.main,
                            marginTop: theme.spacing.xs,
                          }}
                        >
                          {session.weight >= 1 ? 'First order' : 'Second order'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text.muted,
                      fontStyle: 'italic',
                    }}
                  >
                    No training sessions recorded yet
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
