'use client'

import React, { useState } from 'react'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'
import { theme } from '@/styles/theme'
import type { PlayerTrainingBalance } from '@/types/database'

interface SkillBalanceChartProps {
  balance: PlayerTrainingBalance[] | null
  isLoading?: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  'attributes_in_possession': '#3b82f6', // blue
  'attributes_out_of_possession': '#ef4444', // red
  'attributes_physical': '#22c55e', // green
  'attributes_psychological': '#f59e0b', // amber
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            height: '48px',
            backgroundColor: theme.colors.background.tertiary,
            borderRadius: theme.borderRadius.md,
            animation: 'pulse 2s infinite',
          }}
        />
      ))}
    </div>
  )
}

function CategoryRow({ category, maxPercentage }: { category: PlayerTrainingBalance; maxPercentage: number }) {
  const [expanded, setExpanded] = useState(false)
  const color = CATEGORY_COLORS[category.category] || theme.colors.text.secondary
  const barWidth = maxPercentage > 0 ? (category.percentage / maxPercentage) * 100 : 0

  return (
    <div
      style={{
        backgroundColor: theme.colors.background.secondary,
        border: `1px solid ${theme.colors.border.primary}`,
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
      }}
    >
      {/* Main Row */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
          padding: theme.spacing.md,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Color indicator */}
        <div
          style={{
            width: '4px',
            height: '32px',
            backgroundColor: color,
            borderRadius: theme.borderRadius.full,
            flexShrink: 0,
          }}
        />

        {/* Category name and percentage */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.xs }}>
            <span
              style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text.primary,
              }}
            >
              {category.category_display_name}
            </span>
            <span
              style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
              }}
            >
              {Math.round(category.percentage)}%
            </span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: '8px',
              backgroundColor: theme.colors.background.tertiary,
              borderRadius: theme.borderRadius.full,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${barWidth}%`,
                height: '100%',
                backgroundColor: color,
                borderRadius: theme.borderRadius.full,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Expand icon */}
        {category.attributes.length > 0 && (
          expanded ? (
            <FaChevronUp size={12} style={{ color: theme.colors.text.secondary, flexShrink: 0 }} />
          ) : (
            <FaChevronDown size={12} style={{ color: theme.colors.text.secondary, flexShrink: 0 }} />
          )
        )}
      </button>

      {/* Expanded attributes */}
      {expanded && category.attributes.length > 0 && (
        <div
          style={{
            padding: `0 ${theme.spacing.md} ${theme.spacing.md}`,
            paddingLeft: `calc(${theme.spacing.md} + 4px + ${theme.spacing.md})`, // Align with content
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: theme.spacing.sm,
            }}
          >
            {category.attributes.map((attr) => (
              <span
                key={attr.key}
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.secondary,
                  backgroundColor: theme.colors.background.tertiary,
                  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                  borderRadius: theme.borderRadius.sm,
                }}
              >
                {attr.name}
                <span style={{ marginLeft: theme.spacing.xs, color: theme.colors.text.primary, fontWeight: 500 }}>
                  ({Math.round(attr.opportunities)})
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function SkillBalanceChart({ balance, isLoading }: SkillBalanceChartProps) {
  if (isLoading) {
    return (
      <div
        style={{
          backgroundColor: theme.colors.background.secondary,
          border: `1px solid ${theme.colors.border.primary}`,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.lg,
        }}
      >
        <h3
          style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.xs,
          }}
        >
          Training Balance
        </h3>
        <p
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.md,
          }}
        >
          Distribution across skill categories
        </p>
        <LoadingSkeleton />
      </div>
    )
  }

  const totalOpportunities = balance?.reduce((sum, cat) => sum + cat.total_opportunities, 0) || 0
  const maxPercentage = balance?.reduce((max, cat) => Math.max(max, cat.percentage), 0) || 100

  return (
    <div
      style={{
        backgroundColor: theme.colors.background.secondary,
        border: `1px solid ${theme.colors.border.primary}`,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.xs }}>
        <h3
          style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            margin: 0,
          }}
        >
          Training Balance
        </h3>
        {totalOpportunities > 0 && (
          <span
            style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.text.secondary,
            }}
          >
            {Math.round(totalOpportunities)} total opportunities
          </span>
        )}
      </div>
      <p
        style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.md,
        }}
      >
        Distribution across skill categories
      </p>

      {!balance || balance.length === 0 || totalOpportunities === 0 ? (
        <div
          style={{
            padding: theme.spacing.lg,
            textAlign: 'center',
            color: theme.colors.text.secondary,
            fontSize: theme.typography.fontSize.sm,
          }}
        >
          No training data available yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {balance.map((category) => (
            <CategoryRow key={category.category} category={category} maxPercentage={maxPercentage} />
          ))}
        </div>
      )}
    </div>
  )
}
