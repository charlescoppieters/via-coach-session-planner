'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { FaSortUp, FaSortDown, FaSort } from 'react-icons/fa'
import { theme } from '@/styles/theme'
import type { TeamPlayerMatrixRow } from '@/types/database'
import { getAttendanceColor } from '@/lib/teamAnalytics'

interface PlayerDevelopmentMatrixProps {
  players: TeamPlayerMatrixRow[] | null
  loading?: boolean
}

type SortField = 'name' | 'attendance' | 'most' | 'least'
type SortDirection = 'asc' | 'desc'

interface SortConfig {
  field: SortField
  direction: SortDirection
}

function LoadingSkeleton() {
  return (
    <div
      style={{
        backgroundColor: theme.colors.background.secondary,
        border: `1px solid ${theme.colors.border.primary}`,
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: '48px',
          backgroundColor: theme.colors.background.tertiary,
          borderBottom: `1px solid ${theme.colors.border.primary}`,
        }}
      />
      {/* Rows */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            height: '56px',
            borderBottom: `1px solid ${theme.colors.border.primary}`,
            animation: 'pulse 2s infinite',
          }}
        />
      ))}
    </div>
  )
}

function IDPCell({ name, sessions }: { name: string | null; sessions: number }) {
  if (!name) {
    return (
      <span style={{ color: theme.colors.text.secondary, fontStyle: 'italic' }}>
        —
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span
        style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.primary,
        }}
      >
        {name}
      </span>
      <span
        style={{
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.secondary,
        }}
      >
        {sessions} {sessions === 1 ? 'session' : 'sessions'}
      </span>
    </div>
  )
}

export function PlayerDevelopmentMatrix({ players, loading }: PlayerDevelopmentMatrixProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'attendance',
    direction: 'desc',
  })

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }))
  }

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <FaSort size={10} style={{ color: theme.colors.text.secondary, opacity: 0.5 }} />
    }
    return sortConfig.direction === 'desc' ? (
      <FaSortDown size={10} style={{ color: theme.colors.gold.main }} />
    ) : (
      <FaSortUp size={10} style={{ color: theme.colors.gold.main }} />
    )
  }

  const sortedPlayers = React.useMemo(() => {
    if (!players) return []

    return [...players].sort((a, b) => {
      const direction = sortConfig.direction === 'desc' ? -1 : 1

      switch (sortConfig.field) {
        case 'name':
          return direction * a.player_name.localeCompare(b.player_name)
        case 'attendance':
          return direction * (a.attendance_percentage - b.attendance_percentage)
        case 'most':
          return direction * (a.most_trained_sessions - b.most_trained_sessions)
        case 'least':
          return direction * (a.least_trained_sessions - b.least_trained_sessions)
        default:
          return 0
      }
    })
  }, [players, sortConfig])

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
          Compare player attendance and IDP training progress
        </p>
        <LoadingSkeleton />
      </div>
    )
  }

  if (!players || players.length === 0) {
    return (
      <div>
        <p
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.md,
          }}
        >
          Compare player attendance and IDP training progress
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
          No players found. Add players to your team to see the development matrix.
        </div>
      </div>
    )
  }

  const headerStyle: React.CSSProperties = {
    padding: theme.spacing.md,
    textAlign: 'left',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    backgroundColor: theme.colors.background.tertiary,
    borderBottom: `1px solid ${theme.colors.border.primary}`,
    cursor: 'pointer',
    userSelect: 'none',
  }

  const cellStyle: React.CSSProperties = {
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    borderBottom: `1px solid ${theme.colors.border.primary}`,
    verticalAlign: 'middle',
  }

  return (
    <div>
      <p
        style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.md,
        }}
      >
        Compare player attendance and IDP training progress
      </p>

      <div
        style={{
          backgroundColor: theme.colors.background.secondary,
          border: `1px solid ${theme.colors.border.primary}`,
          borderRadius: theme.borderRadius.md,
          overflow: 'hidden',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead>
            <tr>
              <th style={headerStyle} onClick={() => handleSort('name')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  Player {getSortIcon('name')}
                </div>
              </th>
              <th style={headerStyle} onClick={() => handleSort('attendance')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  Attendance {getSortIcon('attendance')}
                </div>
              </th>
              <th style={{ ...headerStyle, cursor: 'default' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, color: '#22c55e' }}>
                  Most Trained IDP
                </div>
              </th>
              <th style={{ ...headerStyle, cursor: 'default' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, color: '#f59e0b' }}>
                  Mid Trained IDP
                </div>
              </th>
              <th style={{ ...headerStyle, cursor: 'default' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, color: '#ef4444' }}>
                  Least Trained IDP
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player) => {
              const attendanceColor = getAttendanceColor(player.attendance_percentage)

              return (
                <tr key={player.player_id}>
                  <td style={cellStyle}>
                    <Link
                      href={`/team/players/${player.player_id}`}
                      style={{
                        color: theme.colors.text.primary,
                        textDecoration: 'none',
                        fontWeight: theme.typography.fontWeight.medium,
                      }}
                    >
                      {player.player_name}
                    </Link>
                    {player.position && (
                      <span
                        style={{
                          marginLeft: theme.spacing.sm,
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.text.secondary,
                        }}
                      >
                        {player.position}
                      </span>
                    )}
                  </td>
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: attendanceColor, fontWeight: theme.typography.fontWeight.medium }}>
                        {Math.round(player.attendance_percentage)}%
                      </span>
                      <span style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.text.secondary }}>
                        {player.sessions_attended}/{player.total_sessions} sessions
                      </span>
                    </div>
                  </td>
                  <td style={cellStyle}>
                    <IDPCell name={player.most_trained_idp} sessions={player.most_trained_sessions} />
                  </td>
                  <td style={cellStyle}>
                    <IDPCell name={player.mid_trained_idp} sessions={player.mid_trained_sessions} />
                  </td>
                  <td style={cellStyle}>
                    <IDPCell name={player.least_trained_idp} sessions={player.least_trained_sessions} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
