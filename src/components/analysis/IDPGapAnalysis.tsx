'use client'

import React, { useState } from 'react'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'
import { theme } from '@/styles/theme'
import type { TeamIDPGap } from '@/types/database'
import { getPriorityColor, formatSessionsAgo } from '@/lib/teamAnalytics'

interface IDPGapAnalysisProps {
  gaps: TeamIDPGap[] | null
  loading?: boolean
  expandedKey?: string | null
}

interface GapRowProps {
  gap: TeamIDPGap
  defaultExpanded?: boolean
}

function GapRow({ gap, defaultExpanded = false }: GapRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const priorityColor = getPriorityColor(gap.priority_score)
  const lastTrained = formatSessionsAgo(gap.sessions_since_trained, gap.total_sessions)

  // Sort sessions by date (newest first)
  const sortedSessions = gap.training_sessions
    ? [...gap.training_sessions].sort(
        (a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
      )
    : []

  return (
    <div
      style={{
        backgroundColor: theme.colors.background.secondary,
        border: `1px solid ${theme.colors.border.primary}`,
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
        marginBottom: theme.spacing.sm,
      }}
    >
      {/* Main Row */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: theme.spacing.md,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, flex: 1 }}>
          {/* Priority Indicator Dot */}
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: priorityColor,
              flexShrink: 0,
            }}
          />

          {/* Attribute Name */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text.primary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {gap.attribute_name}
            </div>
          </div>

          {/* Player Count */}
          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              flexShrink: 0,
              textAlign: 'right',
            }}
          >
            <span style={{ fontWeight: theme.typography.fontWeight.medium, color: theme.colors.text.primary }}>
              {gap.players_with_idp}
            </span>
            {' '}{gap.players_with_idp === 1 ? 'player with this IDP' : 'players with this IDP'}
          </div>

          {/* Last Trained */}
          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              flexShrink: 0,
              textAlign: 'right',
            }}
          >
            {lastTrained.prefix && <>{lastTrained.prefix}{' '}</>}
            {lastTrained.count !== null && (
              <span style={{ fontWeight: theme.typography.fontWeight.medium, color: theme.colors.text.primary }}>
                {lastTrained.count}
              </span>
            )}
            {lastTrained.count !== null && ' '}
            {lastTrained.suffix}
          </div>

          {/* Expand Icon */}
          {expanded ? (
            <FaChevronUp size={12} style={{ color: theme.colors.text.secondary, flexShrink: 0 }} />
          ) : (
            <FaChevronDown size={12} style={{ color: theme.colors.text.secondary, flexShrink: 0 }} />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div
          style={{
            padding: theme.spacing.md,
            borderTop: `1px solid ${theme.colors.border.primary}`,
          }}
        >
          {/* Players Section */}
          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.sm,
            }}
          >
            Players:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs, marginBottom: theme.spacing.lg }}>
            {gap.player_names.map((name, index) => (
              <span
                key={gap.player_ids[index]}
                style={{
                  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                  backgroundColor: theme.colors.background.tertiary,
                  borderRadius: theme.borderRadius.sm,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.primary,
                }}
              >
                {name}
              </span>
            ))}
          </div>

          {/* Sessions Section */}
          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.sm,
            }}
          >
            Sessions trained in:
          </div>
          {sortedSessions.length === 0 ? (
            <div
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                fontStyle: 'italic',
              }}
            >
              No sessions in selected period
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                overflowX: 'auto',
                gap: theme.spacing.sm,
                paddingBottom: theme.spacing.sm,
                // Scrollbar styling
                scrollbarWidth: 'thin',
                scrollbarColor: `${theme.colors.border.primary} transparent`,
              }}
            >
              {sortedSessions.map((session) => (
                <a
                  key={session.session_id}
                  href={`/sessions/${session.session_id}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: theme.spacing.xs,
                    padding: theme.spacing.sm,
                    backgroundColor: theme.colors.background.tertiary,
                    border: `1px solid ${theme.colors.border.primary}`,
                    borderRadius: theme.borderRadius.md,
                    minWidth: '140px',
                    flexShrink: 0,
                    textDecoration: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.accent.gold
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border.primary
                  }}
                >
                  <div
                    style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.text.secondary,
                    }}
                  >
                    {new Date(session.session_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.text.primary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {session.session_name}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: '56px',
            backgroundColor: theme.colors.background.secondary,
            border: `1px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.md,
            animation: 'pulse 2s infinite',
          }}
        />
      ))}
    </div>
  )
}

export function IDPGapAnalysis({ gaps, loading, expandedKey }: IDPGapAnalysisProps) {
  if (loading) {
    return (
      <div>
        <p
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.md,
          }}
        >
          Track which player IDPs need attention based on recent training
        </p>
        <LoadingSkeleton />
      </div>
    )
  }

  if (!gaps || gaps.length === 0) {
    return (
      <div>
        <p
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.md,
          }}
        >
          Track which player IDPs need attention based on recent training
        </p>
        <div
          style={{
            padding: theme.spacing.xl,
            textAlign: 'center',
            color: theme.colors.text.secondary,
            backgroundColor: theme.colors.background.secondary,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.border.primary}`,
          }}
        >
          No active IDPs found. Assign IDPs to players to see training priorities.
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.spacing.md,
        }}
      >
        <p
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            margin: 0,
          }}
        >
          Track which player IDPs need attention based on recent training
        </p>
        <div
          style={{
            display: 'flex',
            gap: theme.spacing.lg,
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
              }}
            />
            Needs Attention
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#f59e0b',
              }}
            />
            Due Soon
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
              }}
            />
            On Track
          </span>
        </div>
      </div>

      {/* All gaps sorted by priority_score from SQL (highest first) */}
      {gaps.map((gap) => (
        <GapRow
          key={gap.attribute_key}
          gap={gap}
          defaultExpanded={gap.attribute_key === expandedKey}
        />
      ))}
    </div>
  )
}
