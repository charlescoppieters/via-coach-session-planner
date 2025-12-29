'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FaTimes, FaTrash } from 'react-icons/fa'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import { ThemeDropdown } from './ThemeDropdown'
import type { SyllabusDay, GameZone, ThemeSelection } from '@/types/database'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

interface DayEditModalProps {
  day: SyllabusDay
  weekNumber: number
  zones: GameZone[]
  onSave: (updatedDay: SyllabusDay) => void
  onClose: () => void
  isSaving?: boolean
}

export function DayEditModal({
  day,
  weekNumber,
  zones,
  onSave,
  onClose,
  isSaving = false,
}: DayEditModalProps) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeSelection | null>(day.theme)
  const [comments, setComments] = useState(day.comments || '')

  const handleSave = () => {
    onSave({
      ...day,
      theme: selectedTheme,
      comments: comments.trim() || null,
    })
  }

  const handleClear = () => {
    setSelectedTheme(null)
    setComments('')
  }

  const dayName = DAY_NAMES[day.dayOfWeek]

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: theme.spacing.lg,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          onClose()
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          backgroundColor: theme.colors.background.primary,
          borderRadius: theme.borderRadius.lg,
          width: '100%',
          maxWidth: '500px',
          padding: theme.spacing.xl,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing.lg,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                margin: 0,
              }}
            >
              {dayName}
            </h2>
            <p
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.muted,
                margin: 0,
                marginTop: theme.spacing.xs,
              }}
            >
              Week {weekNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              background: 'none',
              border: 'none',
              color: theme.colors.text.secondary,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              padding: theme.spacing.xs,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isSaving ? 0.5 : 1,
            }}
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Theme Selection */}
        <div style={{ marginBottom: theme.spacing.lg }}>
          <label
            style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.sm,
            }}
          >
            Training Theme
          </label>
          <ThemeDropdown zones={zones} selectedTheme={selectedTheme} onSelect={setSelectedTheme} />
          {selectedTheme && (
            <p
              style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.muted,
                marginTop: theme.spacing.sm,
                opacity: 0.6,
              }}
            >
              From: Zone {zones.find((z) => z.id === selectedTheme.zoneId)?.order} -{' '}
              {selectedTheme.zoneName} (
              {selectedTheme.blockType === 'in_possession' ? 'In Possession' : 'Out of Possession'})
            </p>
          )}
        </div>

        {/* Comments */}
        <div style={{ marginBottom: theme.spacing.xl }}>
          <label
            style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.sm,
            }}
          >
            Training Notes (Optional)
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add any specific notes for this training session..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: theme.spacing.md,
              backgroundColor: theme.colors.background.tertiary,
              color: theme.colors.text.primary,
              border: `1px solid ${theme.colors.border.primary}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.base,
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: theme.spacing.md }}>
          {/* Clear button */}
          <button
            onClick={handleClear}
            disabled={isSaving || (!selectedTheme && !comments)}
            style={{
              padding: `${theme.spacing.md} ${theme.spacing.lg}`,
              backgroundColor: 'transparent',
              color: theme.colors.status.error,
              border: `1px solid ${theme.colors.status.error}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.base,
              cursor: isSaving || (!selectedTheme && !comments) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              opacity: isSaving || (!selectedTheme && !comments) ? 0.5 : 1,
            }}
          >
            <FaTrash size={12} />
            Clear
          </button>

          <div style={{ flex: 1 }} />

          {/* Cancel button */}
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              backgroundColor: theme.colors.background.tertiary,
              color: theme.colors.text.primary,
              border: 'none',
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.base,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.5 : 1,
            }}
          >
            Cancel
          </button>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              backgroundColor: theme.colors.gold.main,
              color: theme.colors.background.primary,
              border: 'none',
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
            }}
          >
            {isSaving && (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-flex' }}
              >
                <CgSpinnerAlt size={16} />
              </motion.span>
            )}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
