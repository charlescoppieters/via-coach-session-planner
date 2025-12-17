'use client'

import React from 'react'
import {
  FaCalendarCheck,
  FaClock,
  FaUsers,
  FaBullseye,
  FaLayerGroup,
} from 'react-icons/fa'
import { theme } from '@/styles/theme'
import type { TeamTrainingSummary, TeamIDPGap, TeamBlockRecommendation } from '@/types/database'
import { formatTrainingTime } from '@/lib/teamAnalytics'
import { RecommendationSummary } from './RecommendationSummary'

interface OverviewCardsProps {
  summary: TeamTrainingSummary | null
  topIdps?: TeamIDPGap[] | null
  topBlocks?: TeamBlockRecommendation[] | null
  loading?: boolean
  onIdpClick?: (attributeKey: string) => void
  onBlockClick?: (blockId: string) => void
  sectionGap?: string
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
        padding: theme.spacing.lg,
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

export function OverviewCards({ summary, topIdps, topBlocks, loading, onIdpClick, onBlockClick, sectionGap }: OverviewCardsProps) {
  const sessionsCompleted = summary?.sessions_completed ?? 0
  const totalMinutes = summary?.total_training_minutes ?? 0
  const avgAttendance = summary?.avg_attendance_percentage ?? 0
  const activeIdps = summary?.active_idps ?? 0
  const idpCoverageRate = summary?.idp_coverage_rate ?? 0
  const totalPlayers = summary?.total_players ?? 0
  const uniqueIdpAttributes = summary?.unique_idp_attributes ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: sectionGap || theme.spacing.lg }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: theme.spacing.md,
        }}
      >
        <StatCard
          icon={<FaCalendarCheck size={16} />}
          label="Sessions Completed"
          value={sessionsCompleted}
          subValue={totalMinutes > 0 ? `${formatTrainingTime(totalMinutes)} total` : undefined}
          loading={loading}
        />

        <StatCard
          icon={<FaClock size={16} />}
          label="Training Hours"
          value={formatTrainingTime(totalMinutes)}
          subValue={
            sessionsCompleted > 0
              ? `~${Math.round(totalMinutes / sessionsCompleted)}m avg per session`
              : undefined
          }
          loading={loading}
        />

        <StatCard
          icon={<FaUsers size={16} />}
          label="Team Attendance"
          value={`${Math.round(avgAttendance)}%`}
          subValue={`${totalPlayers} players`}
          loading={loading}
        />

        <StatCard
          icon={<FaBullseye size={16} />}
          label="Active IDPs"
          value={activeIdps}
          subValue={`${uniqueIdpAttributes} unique attributes`}
          loading={loading}
        />

        <StatCard
          icon={<FaLayerGroup size={16} />}
          label="IDP Coverage"
          value={`${Math.round(idpCoverageRate)}%`}
          subValue="of IDP attributes trained"
          loading={loading}
        />
      </div>

      <RecommendationSummary
        topIdps={topIdps ?? null}
        topBlocks={topBlocks ?? null}
        loading={loading}
        onIdpClick={onIdpClick}
        onBlockClick={onBlockClick}
      />
    </div>
  )
}
