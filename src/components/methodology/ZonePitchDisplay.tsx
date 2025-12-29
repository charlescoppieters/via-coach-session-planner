'use client'

import React from 'react'
import { theme } from '@/styles/theme'
import type { GameModelZones, GameZone } from '@/types/database'

interface ZonePitchDisplayProps {
  zones: GameModelZones | null
  selectedZoneId: string | null
  onZoneClick?: (zone: GameZone) => void
  showLabels?: boolean
  height?: number
}

// Zone colors for visual distinction (muted to match dark theme)
const ZONE_COLORS = [
  'rgba(74, 144, 164, 0.15)', // Blue-teal
  'rgba(164, 134, 74, 0.15)', // Gold-tan
  'rgba(134, 164, 74, 0.15)', // Green
  'rgba(164, 74, 134, 0.15)', // Purple-magenta
]

const ZONE_COLORS_SELECTED = [
  'rgba(74, 144, 164, 0.35)',
  'rgba(164, 134, 74, 0.35)',
  'rgba(134, 164, 74, 0.35)',
  'rgba(164, 74, 134, 0.35)',
]

export function ZonePitchDisplay({
  zones,
  selectedZoneId,
  onZoneClick,
  showLabels = true,
  height = 500,
}: ZonePitchDisplayProps) {
  const zoneCount = zones?.zone_count || 3
  const zoneList = zones?.zones || []

  // Calculate pitch dimensions (standard ratio approximately 1:1.5)
  const pitchWidth = height * 0.667
  const pitchHeight = height
  const padding = 20
  const innerWidth = pitchWidth - padding * 2
  const innerHeight = pitchHeight - padding * 2

  // Zone height calculation
  const zoneHeight = innerHeight / zoneCount

  // Goal dimensions
  const goalWidth = innerWidth * 0.35
  const goalHeight = 15

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: theme.spacing.md,
      }}
    >
      <svg
        width={pitchWidth}
        height={pitchHeight}
        viewBox={`0 0 ${pitchWidth} ${pitchHeight}`}
        style={{
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.lg,
          overflow: 'hidden',
          border: `1px solid ${theme.colors.border.primary}`,
        }}
      >
        {/* Pitch outline */}
        <rect
          x={padding}
          y={padding}
          width={innerWidth}
          height={innerHeight}
          fill="none"
          stroke={theme.colors.border.primary}
          strokeWidth={2}
        />

        {/* Center line */}
        <line
          x1={padding}
          y1={pitchHeight / 2}
          x2={pitchWidth - padding}
          y2={pitchHeight / 2}
          stroke={theme.colors.border.primary}
          strokeWidth={1}
        />

        {/* Center circle */}
        <circle
          cx={pitchWidth / 2}
          cy={pitchHeight / 2}
          r={innerWidth * 0.15}
          fill="none"
          stroke={theme.colors.border.primary}
          strokeWidth={1}
        />

        {/* Center dot */}
        <circle
          cx={pitchWidth / 2}
          cy={pitchHeight / 2}
          r={3}
          fill={theme.colors.border.primary}
        />

        {/* Top goal (opponent) */}
        <rect
          x={(pitchWidth - goalWidth) / 2}
          y={padding - goalHeight}
          width={goalWidth}
          height={goalHeight}
          fill="none"
          stroke={theme.colors.border.primary}
          strokeWidth={2}
        />

        {/* Top penalty area */}
        <rect
          x={(pitchWidth - innerWidth * 0.6) / 2}
          y={padding}
          width={innerWidth * 0.6}
          height={innerHeight * 0.15}
          fill="none"
          stroke={theme.colors.border.primary}
          strokeWidth={1}
        />

        {/* Top goal box (6 yard) */}
        <rect
          x={(pitchWidth - innerWidth * 0.3) / 2}
          y={padding}
          width={innerWidth * 0.3}
          height={innerHeight * 0.05}
          fill="none"
          stroke={theme.colors.border.primary}
          strokeWidth={1}
        />

        {/* Bottom goal (own) */}
        <rect
          x={(pitchWidth - goalWidth) / 2}
          y={pitchHeight - padding}
          width={goalWidth}
          height={goalHeight}
          fill="none"
          stroke={theme.colors.border.primary}
          strokeWidth={2}
        />

        {/* Bottom penalty area */}
        <rect
          x={(pitchWidth - innerWidth * 0.6) / 2}
          y={pitchHeight - padding - innerHeight * 0.15}
          width={innerWidth * 0.6}
          height={innerHeight * 0.15}
          fill="none"
          stroke={theme.colors.border.primary}
          strokeWidth={1}
        />

        {/* Bottom goal box (6 yard) */}
        <rect
          x={(pitchWidth - innerWidth * 0.3) / 2}
          y={pitchHeight - padding - innerHeight * 0.05}
          width={innerWidth * 0.3}
          height={innerHeight * 0.05}
          fill="none"
          stroke={theme.colors.border.primary}
          strokeWidth={1}
        />

        {/* Zone overlays - rendered from top (attacking) to bottom (defensive) */}
        {Array.from({ length: zoneCount }).map((_, index) => {
          // Zones are ordered 1 (defensive) to N (attacking)
          // So we need to reverse: index 0 = attacking (zone N), index N-1 = defensive (zone 1)
          const zoneIndex = zoneCount - 1 - index
          const zone = zoneList[zoneIndex]
          const isSelected = zone?.id === selectedZoneId
          const colorIndex = zoneIndex % ZONE_COLORS.length
          const zoneY = padding + index * zoneHeight

          return (
            <g key={zone?.id || `zone-${index}`}>
              {/* Zone fill */}
              <rect
                x={padding}
                y={zoneY}
                width={innerWidth}
                height={zoneHeight}
                fill={isSelected ? ZONE_COLORS_SELECTED[colorIndex] : ZONE_COLORS[colorIndex]}
                stroke={isSelected ? theme.colors.gold.main : 'rgba(255, 255, 255, 0.3)'}
                strokeWidth={isSelected ? 3 : 1}
                style={{
                  cursor: onZoneClick ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => zone && onZoneClick?.(zone)}
              />

              {/* Zone label */}
              {showLabels && zone && (
                <text
                  x={pitchWidth / 2}
                  y={zoneY + zoneHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={theme.colors.text.primary}
                  fontSize={14}
                  fontWeight="600"
                  style={{
                    pointerEvents: 'none',
                  }}
                >
                  {zone.name}
                </text>
              )}

              {/* Zone divider line (except for last zone) */}
              {index < zoneCount - 1 && (
                <line
                  x1={padding}
                  y1={zoneY + zoneHeight}
                  x2={pitchWidth - padding}
                  y2={zoneY + zoneHeight}
                  stroke={theme.colors.border.primary}
                  strokeWidth={1}
                  strokeDasharray="6 3"
                />
              )}
            </g>
          )
        })}

      </svg>
    </div>
  )
}
