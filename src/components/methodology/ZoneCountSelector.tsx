'use client'

import React from 'react'
import { theme } from '@/styles/theme'

interface ZoneCountSelectorProps {
  onSelect: (count: 3 | 4) => void
  disabled?: boolean
}

export function ZoneCountSelector({ onSelect, disabled = false }: ZoneCountSelectorProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: theme.spacing.xl,
      }}
    >
      <h2
        style={{
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.md,
          textAlign: 'center',
        }}
      >
        How many zones do you want to divide the pitch into?
      </h2>
      <p
        style={{
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.xl,
          textAlign: 'center',
          maxWidth: '500px',
        }}
      >
        Each zone will have in-possession and out-of-possession tactical instructions.
      </p>

      <div
        style={{
          display: 'flex',
          gap: theme.spacing.xl,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {/* 3 Zones Option */}
        <button
          onClick={() => onSelect(3)}
          disabled={disabled}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: theme.spacing.xl,
            backgroundColor: theme.colors.background.secondary,
            border: `2px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.lg,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.2s ease',
            width: '220px',
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.borderColor = theme.colors.gold.main
              e.currentTarget.style.transform = 'translateY(-2px)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.colors.border.primary
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          {/* Mini pitch preview with 3 zones */}
          <svg
            width={120}
            height={180}
            viewBox="0 0 120 180"
            style={{
              marginBottom: theme.spacing.md,
            }}
          >
            {/* Pitch background */}
            <rect
              x={10}
              y={10}
              width={100}
              height={160}
              fill="#1a472a"
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth={2}
              rx={4}
            />

            {/* Zone 3 (Attacking) */}
            <rect
              x={10}
              y={10}
              width={100}
              height={53.33}
              fill="rgba(134, 164, 74, 0.4)"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth={1}
            />

            {/* Zone 2 (Middle) */}
            <rect
              x={10}
              y={63.33}
              width={100}
              height={53.33}
              fill="rgba(164, 134, 74, 0.4)"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth={1}
            />

            {/* Zone 1 (Defensive) */}
            <rect
              x={10}
              y={116.67}
              width={100}
              height={53.33}
              fill="rgba(74, 144, 164, 0.4)"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth={1}
            />

            {/* Zone dividers */}
            <line
              x1={10}
              y1={63.33}
              x2={110}
              y2={63.33}
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth={2}
              strokeDasharray="4 2"
            />
            <line
              x1={10}
              y1={116.67}
              x2={110}
              y2={116.67}
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth={2}
              strokeDasharray="4 2"
            />

            {/* Center line */}
            <line
              x1={10}
              y1={90}
              x2={110}
              y2={90}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth={1}
            />
          </svg>

          <span
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.xs,
            }}
          >
            3 Zones
          </span>
          <span
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              textAlign: 'center',
            }}
          >
            Defensive, Middle, Attacking
          </span>
        </button>

        {/* 4 Zones Option */}
        <button
          onClick={() => onSelect(4)}
          disabled={disabled}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: theme.spacing.xl,
            backgroundColor: theme.colors.background.secondary,
            border: `2px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.lg,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.2s ease',
            width: '220px',
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.borderColor = theme.colors.gold.main
              e.currentTarget.style.transform = 'translateY(-2px)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.colors.border.primary
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          {/* Mini pitch preview with 4 zones */}
          <svg
            width={120}
            height={180}
            viewBox="0 0 120 180"
            style={{
              marginBottom: theme.spacing.md,
            }}
          >
            {/* Pitch background */}
            <rect
              x={10}
              y={10}
              width={100}
              height={160}
              fill="#1a472a"
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth={2}
              rx={4}
            />

            {/* Zone 4 (Attacking) */}
            <rect
              x={10}
              y={10}
              width={100}
              height={40}
              fill="rgba(164, 74, 134, 0.4)"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth={1}
            />

            {/* Zone 3 (Attacking-Mid) */}
            <rect
              x={10}
              y={50}
              width={100}
              height={40}
              fill="rgba(134, 164, 74, 0.4)"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth={1}
            />

            {/* Zone 2 (Defensive-Mid) */}
            <rect
              x={10}
              y={90}
              width={100}
              height={40}
              fill="rgba(164, 134, 74, 0.4)"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth={1}
            />

            {/* Zone 1 (Defensive) */}
            <rect
              x={10}
              y={130}
              width={100}
              height={40}
              fill="rgba(74, 144, 164, 0.4)"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth={1}
            />

            {/* Zone dividers */}
            <line
              x1={10}
              y1={50}
              x2={110}
              y2={50}
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth={2}
              strokeDasharray="4 2"
            />
            <line
              x1={10}
              y1={90}
              x2={110}
              y2={90}
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth={2}
              strokeDasharray="4 2"
            />
            <line
              x1={10}
              y1={130}
              x2={110}
              y2={130}
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth={2}
              strokeDasharray="4 2"
            />
          </svg>

          <span
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.xs,
            }}
          >
            4 Zones
          </span>
          <span
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              textAlign: 'center',
            }}
          >
            More granular control
          </span>
        </button>
      </div>
    </div>
  )
}
