'use client'

import React from 'react'
import { FaEdit } from 'react-icons/fa'
import { theme } from '@/styles/theme'
import type { GameZone } from '@/types/database'

interface ZoneCardProps {
  zone: GameZone
  zoneNumber: number
  totalZones: number
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  readOnly?: boolean
}

// Zone colors for visual distinction (matching pitch display)
const ZONE_BORDER_COLORS = [
  'rgba(74, 144, 164, 0.8)', // Blue-teal
  'rgba(164, 134, 74, 0.8)', // Gold-tan
  'rgba(134, 164, 74, 0.8)', // Green
  'rgba(164, 74, 134, 0.8)', // Purple-magenta
]

export function ZoneCard({
  zone,
  zoneNumber,
  totalZones,
  isSelected,
  onSelect,
  onEdit,
  readOnly = false,
}: ZoneCardProps) {
  const colorIndex = (zoneNumber - 1) % ZONE_BORDER_COLORS.length
  const borderColor = ZONE_BORDER_COLORS[colorIndex]

  const selectedBorderColor = isSelected ? theme.colors.gold.main : theme.colors.border.primary

  return (
    <div
      style={{
        backgroundColor: isSelected
          ? theme.colors.background.tertiary
          : theme.colors.background.secondary,
        borderRadius: theme.borderRadius.md,
        borderTop: `2px solid ${selectedBorderColor}`,
        borderRight: `2px solid ${selectedBorderColor}`,
        borderBottom: `2px solid ${selectedBorderColor}`,
        borderLeft: `4px solid ${borderColor}`,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: theme.spacing.md,
          cursor: 'pointer',
        }}
        onClick={onSelect}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              marginBottom: theme.spacing.xs,
            }}
          >
            <span
              style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
              }}
            >
              Zone {zoneNumber}:
            </span>
            <span
              style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text.primary,
              }}
            >
              {zone.name}
            </span>
          </div>
        </div>

        {/* Edit button */}
        {!readOnly && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            style={{
              padding: theme.spacing.sm,
              backgroundColor: 'transparent',
              border: `1px solid ${theme.colors.border.primary}`,
              borderRadius: theme.borderRadius.md,
              color: theme.colors.text.secondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
            }}
          >
            <FaEdit size={12} />
            <span style={{ fontSize: theme.typography.fontSize.sm }}>Edit</span>
          </button>
        )}
      </div>
    </div>
  )
}
