'use client'

import React from 'react'
import { FaComment } from 'react-icons/fa'
import { theme } from '@/styles/theme'
import type { SyllabusDay } from '@/types/database'

interface DayCellProps {
  day: SyllabusDay
  onClick: () => void
  readOnly?: boolean
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function DayCell({ day, onClick, readOnly = false }: DayCellProps) {
  const hasTheme = day.theme !== null
  const hasComments = day.comments !== null && day.comments.trim() !== ''

  return (
    <div
      onClick={readOnly ? undefined : onClick}
      style={{
        width: '150px',
        minWidth: '150px',
        height: '85px',
        backgroundColor: hasTheme
          ? day.theme?.blockType === 'in_possession'
            ? 'rgba(217, 179, 76, 0.15)'
            : 'rgba(220, 53, 69, 0.15)'
          : theme.colors.background.tertiary,
        border: `1px solid ${hasTheme ? (day.theme?.blockType === 'in_possession' ? theme.colors.gold.main : theme.colors.status.error) : theme.colors.border.primary}`,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.sm,
        cursor: readOnly ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Day label */}
      <span
        style={{
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.muted,
          fontWeight: theme.typography.fontWeight.medium,
          marginBottom: theme.spacing.xs,
          opacity: 0.6,
        }}
      >
        {DAY_LABELS[day.dayOfWeek]}
      </span>

      {/* Theme name or placeholder */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        {hasTheme ? (
          <span
            style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text.primary,
              textAlign: 'left',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {day.theme?.blockName}
          </span>
        ) : (
          <span
            style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.text.muted,
              fontStyle: 'italic',
              opacity: 0.6,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {readOnly ? 'No theme' : (
              <>
                <span style={{ fontSize: theme.typography.fontSize.sm }}>+</span>
                Add session theme
              </>
            )}
          </span>
        )}
      </div>

      {/* Comments indicator */}
      {hasComments && (
        <div
          style={{
            position: 'absolute',
            bottom: theme.spacing.xs,
            right: theme.spacing.xs,
            color: theme.colors.text.muted,
          }}
        >
          <FaComment size={10} />
        </div>
      )}
    </div>
  )
}
