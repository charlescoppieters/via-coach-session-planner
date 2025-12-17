import React from 'react'
import { theme } from '@/styles/theme'

interface ProgressBarProps {
  value: number // 0-100
  max?: number
  height?: number
  backgroundColor?: string
  fillColor?: string
  showLabel?: boolean
  labelPosition?: 'inside' | 'right'
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  height = 8,
  backgroundColor = theme.colors.background.primary,
  fillColor = theme.colors.gold.main,
  showLabel = false,
  labelPosition = 'right',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.sm,
        width: '100%',
      }}
    >
      <div
        style={{
          flex: 1,
          height: `${height}px`,
          backgroundColor,
          borderRadius: `${height / 2}px`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            backgroundColor: fillColor,
            borderRadius: `${height / 2}px`,
            transition: 'width 0.3s ease-out',
          }}
        />
        {showLabel && labelPosition === 'inside' && height >= 16 && (
          <span
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: theme.typography.fontSize.xs,
              fontWeight: theme.typography.fontWeight.medium,
              color: percentage > 50 ? theme.colors.background.primary : theme.colors.text.primary,
            }}
          >
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      {showLabel && labelPosition === 'right' && (
        <span
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            minWidth: '40px',
            textAlign: 'right',
          }}
        >
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  )
}
