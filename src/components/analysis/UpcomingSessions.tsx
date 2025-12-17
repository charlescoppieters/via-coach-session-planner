'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FaCalendarAlt, FaChevronRight } from 'react-icons/fa'
import { theme } from '@/styles/theme'
import { SessionCard } from '@/components/sessions/SessionCard'
import { getUpcomingSessions } from '@/lib/sessions'
import type { Session } from '@/types/database'

interface UpcomingSessionsProps {
  teamId: string
  teamName: string
}

export function UpcomingSessions({ teamId, teamName }: UpcomingSessionsProps) {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSessions() {
      setLoading(true)
      const { data } = await getUpcomingSessions(teamId, 10)
      setSessions(data || [])
      setLoading(false)
    }

    fetchSessions()
  }, [teamId])

  const handleView = (sessionId: string) => {
    router.push(`/session-planning?session=${sessionId}&mode=view`)
  }

  const handleEdit = (sessionId: string) => {
    router.push(`/session-planning?session=${sessionId}&mode=edit`)
  }

  return (
    <div style={{ marginBottom: theme.spacing.xl }}>
      {/* Section Header */}
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
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
          }}
        >
          <FaCalendarAlt size={18} style={{ color: theme.colors.gold.main }} />
          <h2
            style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
              margin: 0,
            }}
          >
            Upcoming Sessions
          </h2>
        </div>

        <button
          onClick={() => router.push('/session-planning')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            backgroundColor: 'transparent',
            color: theme.colors.text.secondary,
            border: 'none',
            borderRadius: theme.borderRadius.sm,
            fontSize: theme.typography.fontSize.sm,
            cursor: 'pointer',
            transition: theme.transitions.fast,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = theme.colors.gold.main
            e.currentTarget.style.backgroundColor = theme.colors.background.tertiary
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = theme.colors.text.secondary
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <span>View all</span>
          <FaChevronRight size={12} />
        </button>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div
          style={{
            display: 'flex',
            gap: theme.spacing.md,
            overflowX: 'auto',
            paddingBottom: theme.spacing.sm,
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: '480px',
                minWidth: '480px',
                height: '160px',
                backgroundColor: theme.colors.background.secondary,
                borderRadius: theme.borderRadius.lg,
                animation: 'pulse 2s infinite',
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      ) : sessions.length > 0 ? (
        <div
          style={{
            display: 'flex',
            gap: theme.spacing.md,
            overflowX: 'auto',
            paddingBottom: theme.spacing.sm,
          }}
        >
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              teamName={teamName}
              onView={handleView}
              onEdit={handleEdit}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: theme.spacing.xl,
            backgroundColor: theme.colors.background.secondary,
            borderRadius: theme.borderRadius.lg,
            border: `1px dashed ${theme.colors.border.primary}`,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.base,
              margin: 0,
              marginBottom: theme.spacing.md,
            }}
          >
            No upcoming sessions scheduled
          </p>
          <button
            onClick={() => router.push('/session-planning')}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              backgroundColor: 'transparent',
              color: theme.colors.gold.main,
              border: `2px dashed ${theme.colors.gold.main}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              cursor: 'pointer',
              opacity: 0.7,
              transition: theme.transitions.fast,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.background.tertiary
              e.currentTarget.style.opacity = '1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.opacity = '0.7'
            }}
          >
            + Create Session
          </button>
        </div>
      )}
    </div>
  )
}
