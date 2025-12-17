'use client'

import React from 'react'
import { FaEdit } from 'react-icons/fa'
import { theme } from '@/styles/theme'

interface PositionCardProps {
  positionName: string
  description?: string
  isSelected?: boolean
  onSelect?: () => void
  onEdit: () => void
  readOnly?: boolean
}

export function PositionCard({
  positionName,
  description,
  isSelected = false,
  onSelect,
  onEdit,
  readOnly = false,
}: PositionCardProps) {
  const handleClick = () => {
    if (onSelect) {
      onSelect()
    }
  }

  return (
    <div
      onClick={handleClick}
      style={{
        backgroundColor: isSelected
          ? theme.colors.background.tertiary
          : theme.colors.background.secondary,
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${isSelected ? theme.colors.gold.main : 'rgba(68, 68, 68, 0.3)'}`,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        cursor: onSelect ? 'pointer' : 'default',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
        }}
      >
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
              marginBottom: description ? theme.spacing.xs : 0,
            }}
          >
            {positionName}
          </h3>
          {description && (
            <p
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              {description}
            </p>
          )}
        </div>

        {!readOnly && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              backgroundColor: 'transparent',
              border: `1px solid ${theme.colors.border.primary}`,
              borderRadius: theme.borderRadius.md,
              color: theme.colors.text.secondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              flexShrink: 0,
              transition: theme.transitions.fast,
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
