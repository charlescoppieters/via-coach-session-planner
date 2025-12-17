'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import { SessionHistoryCard } from './SessionHistoryCard'
import type { PlayerSessionDetail, PlayerAttendanceSummary } from '@/types/database'
import { getPlayerSessions, getPlayerSessionsCount } from '@/lib/playerAnalytics'

interface PlayerSessionsTabProps {
  playerId: string
  attendanceSummary: PlayerAttendanceSummary | null
  attributeNames: Record<string, string>
}

const PAGE_SIZE = 20

export const PlayerSessionsTab: React.FC<PlayerSessionsTabProps> = ({
  playerId,
  attendanceSummary,
  attributeNames,
}) => {
  const [sessions, setSessions] = useState<PlayerSessionDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)

  const fetchSessions = useCallback(async (reset: boolean = false) => {
    const currentOffset = reset ? 0 : offset

    if (reset) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }

    const [sessionsResult, countResult] = await Promise.all([
      getPlayerSessions(playerId, PAGE_SIZE, currentOffset, attributeNames),
      reset ? getPlayerSessionsCount(playerId) : Promise.resolve({ count: totalCount, error: null }),
    ])

    if (sessionsResult.data) {
      if (reset) {
        setSessions(sessionsResult.data)
        setOffset(PAGE_SIZE)
      } else {
        setSessions((prev) => [...prev, ...sessionsResult.data!])
        setOffset((prev) => prev + PAGE_SIZE)
      }
    }

    if (countResult.count !== undefined) {
      setTotalCount(countResult.count)
    }

    setIsLoading(false)
    setIsLoadingMore(false)
  }, [playerId, offset, totalCount, attributeNames])

  useEffect(() => {
    fetchSessions(true)
  }, [playerId])

  const handleLoadMore = () => {
    fetchSessions(false)
  }

  const hasMore = sessions.length < totalCount

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

  // Get last 12 sessions for sparkline (reverse to show oldest first)
  const sparklineData = sessions.slice(0, 12).reverse()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Summary Header with Trend */}
      {attendanceSummary && attendanceSummary.total_sessions > 0 && (
        <div
          style={{
            backgroundColor: theme.colors.background.secondary,
            border: `1px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: theme.spacing.md,
            }}
          >
            <div
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
              }}
            >
              Total:{' '}
              <span style={{ color: theme.colors.text.primary }}>
                {attendanceSummary.total_sessions} sessions
              </span>
              {' · '}
              Attended:{' '}
              <span style={{ color: theme.colors.status.success }}>
                {attendanceSummary.sessions_attended}
              </span>
              {' · '}
              Missed:{' '}
              <span style={{ color: theme.colors.status.error }}>
                {attendanceSummary.sessions_missed}
              </span>
            </div>
            <div
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
              }}
            >
              {Math.round(attendanceSummary.attendance_percentage)}%
            </div>
          </div>

          {/* Attendance Trend Sparkline */}
          {sparklineData.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.sm,
                }}
              >
                Recent attendance (last {sparklineData.length} sessions)
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {sparklineData.map((session, index) => {
                  const attended = session.attendance_status === 'present'
                  return (
                    <div
                      key={session.session_id}
                      title={`${new Date(session.session_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - ${attended ? 'Attended' : 'Missed'}`}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: theme.borderRadius.sm,
                        backgroundColor: attended
                          ? theme.colors.status.success
                          : theme.colors.status.error,
                        opacity: 0.2 + (index / sparklineData.length) * 0.8,
                        transition: theme.transitions.fast,
                        cursor: 'default',
                      }}
                    />
                  )
                })}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.muted,
                  marginTop: theme.spacing.xs,
                }}
              >
                <span>Older</span>
                <span>Recent</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Session Cards */}
      {sessions.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.md,
          }}
        >
          {sessions.map((session) => (
            <SessionHistoryCard
              key={session.session_id}
              session={session}
              attributeNames={attributeNames}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: theme.spacing.xl,
            color: theme.colors.text.secondary,
          }}
        >
          <p>No session history found for this player.</p>
          <p
            style={{
              fontSize: theme.typography.fontSize.sm,
              marginTop: theme.spacing.sm,
            }}
          >
            Sessions will appear here once attendance has been recorded.
          </p>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div style={{ textAlign: 'center', paddingTop: theme.spacing.md }}>
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.xl}`,
              backgroundColor: 'transparent',
              color: theme.colors.gold.main,
              border: `1px solid ${theme.colors.gold.main}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              cursor: isLoadingMore ? 'not-allowed' : 'pointer',
              opacity: isLoadingMore ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.sm,
              margin: '0 auto',
            }}
          >
            {isLoadingMore ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'inline-flex' }}
                >
                  <CgSpinnerAlt size={16} />
                </motion.span>
                Loading...
              </>
            ) : (
              `Load More (${sessions.length}/${totalCount})`
            )}
          </button>
        </div>
      )}
    </div>
  )
}
