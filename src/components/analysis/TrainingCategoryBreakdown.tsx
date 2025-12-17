'use client'

import React, { useState } from 'react'
import { theme } from '@/styles/theme'
import type { TeamAttributeBreakdown } from '@/types/database'

interface TrainingCategoryBreakdownProps {
  breakdown: TeamAttributeBreakdown[] | null
  loading?: boolean
}

// Category colors matching FA's Four Corners model
const CATEGORY_CONFIG: Record<string, { color: string; label: string }> = {
  attributes_in_possession: { color: '#3b82f6', label: 'In Possession' },
  attributes_out_of_possession: { color: '#ef4444', label: 'Out of Possession' },
  attributes_physical: { color: '#22c55e', label: 'Physical' },
  attributes_psychological: { color: '#a855f7', label: 'Psychological' },
}

// Order for radar chart (clockwise from top)
const CATEGORY_ORDER = [
  'attributes_in_possession',
  'attributes_out_of_possession',
  'attributes_psychological',
  'attributes_physical',
]

interface RadarChartProps {
  data: { category: string; value: number; percentage: number }[]
}

function RadarChart({ data }: RadarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Use a fixed viewBox size, SVG will scale to fill container
  const viewBoxSize = 500
  const center = viewBoxSize / 2
  const radius = 210 // Chart radius - extends close to labels
  const levels = 4 // Number of concentric rings

  // Calculate points for each axis
  const getPoint = (index: number, value: number): { x: number; y: number } => {
    const angle = (Math.PI * 2 * index) / data.length - Math.PI / 2 // Start from top
    const distance = (value / 100) * radius
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle),
    }
  }

  // Get label position (at the edge of the chart area)
  const getLabelPoint = (index: number): { x: number; y: number; anchor: 'start' | 'middle' | 'end' } => {
    const angle = (Math.PI * 2 * index) / data.length - Math.PI / 2
    const distance = radius + 30
    const x = center + distance * Math.cos(angle)
    const y = center + distance * Math.sin(angle)

    let anchor: 'start' | 'middle' | 'end' = 'middle'
    if (Math.abs(Math.cos(angle)) > 0.3) {
      anchor = Math.cos(angle) > 0 ? 'start' : 'end'
    }

    return { x, y, anchor }
  }

  // Get percentage label position (next to the data point)
  const getPercentageLabelPoint = (index: number, percentage: number): { x: number; y: number; anchor: 'start' | 'middle' | 'end' } => {
    const angle = (Math.PI * 2 * index) / data.length - Math.PI / 2
    const dataDistance = (percentage / 100) * radius
    const labelOffset = 25
    const x = center + (dataDistance + labelOffset) * Math.cos(angle)
    const y = center + (dataDistance + labelOffset) * Math.sin(angle)

    let anchor: 'start' | 'middle' | 'end' = 'middle'
    if (Math.abs(Math.cos(angle)) > 0.3) {
      anchor = Math.cos(angle) > 0 ? 'start' : 'end'
    }

    return { x, y, anchor }
  }

  // Generate polygon points for the data shape
  const dataPoints = data.map((d, i) => getPoint(i, d.percentage))
  const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  // Generate grid lines (concentric polygons)
  const gridLevels = Array.from({ length: levels }, (_, i) => {
    const levelPercentage = ((i + 1) / levels) * 100
    const points = data.map((_, idx) => getPoint(idx, levelPercentage))
    return points.map(p => `${p.x},${p.y}`).join(' ')
  })

  return (
    <svg
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      style={{
        display: 'block',
        width: '100%',
        height: 'auto',
        maxHeight: '500px',
      }}
    >
      {/* Background grid - concentric polygons */}
      {gridLevels.map((points, i) => (
        <polygon
          key={i}
          points={points}
          fill="none"
          stroke={theme.colors.border.primary}
          strokeWidth="1"
          opacity={0.5}
        />
      ))}

      {/* Axis lines */}
      {data.map((_, i) => {
        const endPoint = getPoint(i, 100)
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={endPoint.x}
            y2={endPoint.y}
            stroke={theme.colors.border.primary}
            strokeWidth="1"
            opacity={0.5}
          />
        )
      })}

      {/* Data polygon - filled area */}
      <polygon
        points={polygonPoints}
        fill={theme.colors.gold.main}
        fillOpacity={0.2}
        stroke={theme.colors.gold.main}
        strokeWidth="2"
      />

      {/* Data points */}
      {dataPoints.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r={hoveredIndex === i ? 8 : 6}
          fill={CATEGORY_CONFIG[data[i].category]?.color || theme.colors.gold.main}
          stroke={theme.colors.background.primary}
          strokeWidth="2"
          style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
        />
      ))}

      {/* Category Labels (at edges) */}
      {data.map((d, i) => {
        const labelPos = getLabelPoint(i)
        const config = CATEGORY_CONFIG[d.category]
        return (
          <text
            key={`label-${i}`}
            x={labelPos.x}
            y={labelPos.y}
            textAnchor={labelPos.anchor}
            dominantBaseline="middle"
            fill={config?.color || theme.colors.text.primary}
            fontSize="15"
            fontWeight="600"
          >
            {config?.label || d.category} Attributes
          </text>
        )
      })}

      {/* Percentage Labels (next to dots) */}
      {data.map((d, i) => {
        const percentPos = getPercentageLabelPoint(i, d.percentage)
        const config = CATEGORY_CONFIG[d.category]
        return (
          <text
            key={`percent-${i}`}
            x={percentPos.x}
            y={percentPos.y}
            textAnchor={percentPos.anchor}
            dominantBaseline="middle"
            fill={config?.color || theme.colors.text.secondary}
            fontSize="13"
            fontWeight="600"
          >
            {d.percentage.toFixed(0)}%
          </text>
        )
      })}

      {/* Center point */}
      <circle
        cx={center}
        cy={center}
        r="3"
        fill={theme.colors.border.primary}
      />
    </svg>
  )
}

function LoadingSkeleton() {
  return (
    <div
      style={{
        aspectRatio: '1',
        maxHeight: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background.secondary,
        border: `1px solid ${theme.colors.border.primary}`,
        borderRadius: theme.borderRadius.md,
      }}
    >
      <div
        style={{
          width: '60%',
          aspectRatio: '1',
          borderRadius: '50%',
          backgroundColor: theme.colors.background.tertiary,
          animation: 'pulse 2s infinite',
        }}
      />
    </div>
  )
}

export function TrainingCategoryBreakdown({ breakdown, loading }: TrainingCategoryBreakdownProps) {
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
          See how training is distributed across the four main attribute types
        </p>
        <LoadingSkeleton />
      </div>
    )
  }

  if (!breakdown || breakdown.length === 0) {
    return (
      <div>
        <p
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.md,
          }}
        >
          See how training is distributed across the four main attribute types
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
          No training data available. Complete sessions with tagged blocks to see training balance.
        </div>
      </div>
    )
  }

  // Calculate totals and percentages
  const totalOpportunities = breakdown.reduce((sum, b) => sum + b.total_opportunities, 0)

  // Prepare data in the correct order for the radar chart
  const radarData = CATEGORY_ORDER.map(categoryKey => {
    const category = breakdown.find(b => b.category === categoryKey)
    const value = category?.total_opportunities || 0
    const percentage = totalOpportunities > 0 ? (value / totalOpportunities) * 100 : 0
    return {
      category: categoryKey,
      value,
      percentage,
    }
  }).filter(d => CATEGORY_CONFIG[d.category]) // Only include configured categories

  // Find the weakest and strongest areas
  const weakestArea = radarData.reduce((min, d) =>
    d.percentage < min.percentage ? d : min
  , radarData[0])

  const strongestArea = radarData.reduce((max, d) =>
    d.percentage > max.percentage ? d : max
  , radarData[0])

  return (
    <div>
      <p
        style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.md,
        }}
      >
        Training distribution across the four main attribute categories
      </p>

      <div
        style={{
          backgroundColor: theme.colors.background.secondary,
          border: `1px solid ${theme.colors.border.primary}`,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.lg,
        }}
      >
        <RadarChart data={radarData} />

        {/* Summary Stats */}
        <div
          style={{
            marginTop: theme.spacing.lg,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: theme.spacing.md,
          }}
        >
          {radarData.map((d) => {
            const config = CATEGORY_CONFIG[d.category]
            return (
              <div
                key={d.category}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  padding: theme.spacing.sm,
                  backgroundColor: theme.colors.background.tertiary,
                  borderRadius: theme.borderRadius.md,
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: config?.color,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text.primary,
                      fontWeight: theme.typography.fontWeight.medium,
                    }}
                  >
                    {config?.label}
                  </div>
                  <div
                    style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.text.secondary,
                    }}
                  >
                    {d.value.toFixed(0)} opportunities ({d.percentage.toFixed(0)}%)
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Insight text */}
        {totalOpportunities > 0 && weakestArea.percentage < strongestArea.percentage - 10 && (
          <div
            style={{
              marginTop: theme.spacing.md,
              padding: theme.spacing.sm,
              backgroundColor: theme.colors.background.tertiary,
              borderRadius: theme.borderRadius.sm,
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              textAlign: 'center',
            }}
          >
            <span style={{ color: CATEGORY_CONFIG[weakestArea.category]?.color }}>
              {CATEGORY_CONFIG[weakestArea.category]?.label}
            </span>
            {' '}attributes could use more focus ({weakestArea.percentage.toFixed(0)}% of training)
          </div>
        )}
      </div>
    </div>
  )
}
