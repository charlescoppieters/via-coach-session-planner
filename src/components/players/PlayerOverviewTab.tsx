'use client'

import React from 'react'
import {
  FaCalendarCheck,
  FaBullseye,
  FaPercentage,
  FaCube,
  FaQuoteLeft,
} from 'react-icons/fa'
import { theme } from '@/styles/theme'
import type {
  PlayerAttendanceSummary,
  PlayerIDPPriority,
  PlayerBlockRecommendation,
} from '@/types/database'
import type { PlayerFeedbackNote } from '@/lib/playerAnalytics'
import {
  formatTimeAgo,
  getGapStatusColor,
} from '@/lib/playerAnalytics'

interface PlayerOverviewTabProps {
  attendanceSummary: PlayerAttendanceSummary | null
  idpPriorities: PlayerIDPPriority[] | null
  blockRecommendations: PlayerBlockRecommendation[] | null
  recentFeedback: PlayerFeedbackNote[] | null
  attributeNames: Record<string, string>
  isLoading: boolean
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subValue?: string
  loading?: boolean
}

function StatCard({ icon, label, value, subValue, loading }: StatCardProps) {
  return (
    <div
      style={{
        backgroundColor: theme.colors.background.secondary,
        border: `1px solid ${theme.colors.border.primary}`,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.sm,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          color: theme.colors.text.secondary,
        }}
      >
        {icon}
        <span style={{ fontSize: theme.typography.fontSize.sm }}>{label}</span>
      </div>
      {loading ? (
        <div
          style={{
            height: '32px',
            backgroundColor: theme.colors.background.tertiary,
            borderRadius: theme.borderRadius.sm,
            animation: 'pulse 2s infinite',
          }}
        />
      ) : (
        <>
          <div
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
            }}
          >
            {value}
          </div>
          {subValue && (
            <div
              style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.secondary,
              }}
            >
              {subValue}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height: '52px',
            backgroundColor: theme.colors.background.tertiary,
            borderRadius: theme.borderRadius.md,
            animation: 'pulse 2s infinite',
          }}
        />
      ))}
    </div>
  )
}

function IDPPriorityRow({ idp, rank }: { idp: PlayerIDPPriority; rank: number }) {
  const lastTrained = formatTimeAgo(idp.last_trained_date)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.md,
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: theme.borderRadius.md,
      }}
    >
      {/* Rank */}
      <span
        style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          width: '24px',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        #{rank}
      </span>

      {/* Urgency Dot */}
      <div
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: getGapStatusColor(idp.gap_status),
          flexShrink: 0,
        }}
      />

      {/* Attribute Name */}
      <div
        style={{
          flex: 1,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.primary,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {idp.attribute_name}
      </div>

      {/* Last Trained */}
      <span
        style={{
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.secondary,
          backgroundColor: theme.colors.background.secondary,
          padding: `2px ${theme.spacing.sm}`,
          borderRadius: theme.borderRadius.full,
          whiteSpace: 'nowrap',
        }}
      >
        {lastTrained}
      </span>
    </div>
  )
}

function BlockRecommendationRow({ block, rank }: { block: PlayerBlockRecommendation; rank: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.md,
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: theme.borderRadius.md,
      }}
    >
      {/* Rank */}
      <span
        style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          width: '24px',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        #{rank}
      </span>

      {/* Block Title */}
      <div
        style={{
          flex: 1,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.primary,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {block.block_title}
      </div>

      {/* IDP Impact */}
      <span
        style={{
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.secondary,
          backgroundColor: theme.colors.background.secondary,
          padding: `2px ${theme.spacing.sm}`,
          borderRadius: theme.borderRadius.full,
          whiteSpace: 'nowrap',
        }}
      >
        Targets {block.idp_impact_count} {block.idp_impact_count === 1 ? 'IDP' : 'IDPs'}
      </span>
    </div>
  )
}

function FeedbackRow({ feedback }: { feedback: PlayerFeedbackNote }) {
  const sessionDate = new Date(feedback.session_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.xs,
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: theme.borderRadius.md,
        borderLeft: `3px solid ${theme.colors.gold.main}`,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Session title */}
        <span
          style={{
            fontSize: theme.typography.fontSize.xs,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.text.primary,
          }}
        >
          {feedback.session_title}
        </span>

        {/* Session date */}
        <span
          style={{
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.text.secondary,
          }}
        >
          {sessionDate}
        </span>
      </div>

      {/* Quote */}
      <div
        style={{
          display: 'flex',
          gap: theme.spacing.xs,
        }}
      >
        <FaQuoteLeft
          size={10}
          style={{
            color: theme.colors.text.secondary,
            opacity: 0.5,
            flexShrink: 0,
            marginTop: '2px',
          }}
        />
        <span
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            fontStyle: 'italic',
            lineHeight: 1.4,
          }}
        >
          {feedback.note}
        </span>
      </div>
    </div>
  )
}

export function PlayerOverviewTab({
  attendanceSummary,
  idpPriorities,
  blockRecommendations,
  recentFeedback,
  attributeNames,
  isLoading,
}: PlayerOverviewTabProps) {
  const activeIdps = idpPriorities?.filter((idp) => !idp.ended_at) || []
  const sessionsAttended = attendanceSummary?.sessions_attended ?? 0
  const attendancePercentage = attendanceSummary?.attendance_percentage ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: theme.spacing.md,
        }}
      >
        <StatCard
          icon={<FaCalendarCheck size={16} />}
          label="Sessions Attended"
          value={sessionsAttended}
          subValue={`of ${attendanceSummary?.total_sessions ?? 0} total`}
          loading={isLoading}
        />

        <StatCard
          icon={<FaPercentage size={16} />}
          label="Attendance Rate"
          value={`${Math.round(attendancePercentage)}%`}
          loading={isLoading}
        />

        <StatCard
          icon={<FaBullseye size={16} />}
          label="Active IDPs"
          value={activeIdps.length}
          subValue={activeIdps.length > 0 ? `${activeIdps.length} focus areas` : undefined}
          loading={isLoading}
        />
      </div>

      {/* Two-column layout for priorities and recommendations */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: theme.spacing.lg,
        }}
      >
        {/* IDP Priorities */}
        <div
          style={{
            backgroundColor: theme.colors.background.secondary,
            border: `1px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.md,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
            <FaBullseye size={14} style={{ color: theme.colors.gold.main }} />
            <h3
              style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                margin: 0,
              }}
            >
              IDP Priorities
            </h3>
          </div>
          <p
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.md,
            }}
          >
            Development goals ranked by training urgency
          </p>

          {isLoading ? (
            <LoadingSkeleton rows={3} />
          ) : activeIdps.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
              {activeIdps.slice(0, 3).map((idp, index) => (
                <IDPPriorityRow key={idp.idp_id} idp={idp} rank={index + 1} />
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: theme.spacing.md,
                textAlign: 'center',
                color: theme.colors.text.secondary,
                fontSize: theme.typography.fontSize.sm,
              }}
            >
              No active IDPs assigned
            </div>
          )}
        </div>

        {/* Block Recommendations */}
        <div
          style={{
            backgroundColor: theme.colors.background.secondary,
            border: `1px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.md,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
            <FaCube size={14} style={{ color: theme.colors.gold.main }} />
            <h3
              style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                margin: 0,
              }}
            >
              Recommended Training Blocks
            </h3>
          </div>
          <p
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.md,
            }}
          >
            Blocks that best target this player&apos;s IDPs
          </p>

          {isLoading ? (
            <LoadingSkeleton rows={3} />
          ) : blockRecommendations && blockRecommendations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
              {blockRecommendations.slice(0, 3).map((block, index) => (
                <BlockRecommendationRow key={block.block_id} block={block} rank={index + 1} />
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: theme.spacing.md,
                textAlign: 'center',
                color: theme.colors.text.secondary,
                fontSize: theme.typography.fontSize.sm,
              }}
            >
              No recommendations available
            </div>
          )}
        </div>
      </div>

      {/* Recent Feedback */}
      <div
        style={{
          backgroundColor: theme.colors.background.secondary,
          border: `1px solid ${theme.colors.border.primary}`,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.md,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
          <FaQuoteLeft size={14} style={{ color: theme.colors.gold.main }} />
          <h3
            style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
              margin: 0,
            }}
          >
            Recent Feedback
          </h3>
        </div>
        <p
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.md,
          }}
        >
          Latest coach observations about this player
        </p>

        {isLoading ? (
          <LoadingSkeleton rows={3} />
        ) : recentFeedback && recentFeedback.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            {recentFeedback.slice(0, 5).map((feedback) => (
              <FeedbackRow key={feedback.id} feedback={feedback} />
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: theme.spacing.md,
              textAlign: 'center',
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.sm,
            }}
          >
            No feedback recorded yet
          </div>
        )}
      </div>
    </div>
  )
}
