'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { FaTimes } from 'react-icons/fa'
import { theme } from '@/styles/theme'
import type { MatchFormat } from '@/types/database'

const MATCH_FORMATS: MatchFormat[] = ['3v3', '5v5', '7v7', '9v9', '11v11']

interface MatchFormatModalProps {
  currentFormat: MatchFormat
  onSelect: (format: MatchFormat) => void
  onClose: () => void
}

export function MatchFormatModal({
  currentFormat,
  onSelect,
  onClose,
}: MatchFormatModalProps) {
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
        if (e.target === e.currentTarget) {
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
          maxWidth: '400px',
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
          <h2
            style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              margin: 0,
            }}
          >
            Select Match Format
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: theme.colors.text.secondary,
              cursor: 'pointer',
              padding: theme.spacing.xs,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Format Options */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.sm,
          }}
        >
          {MATCH_FORMATS.map((format) => {
            const isSelected = format === currentFormat
            return (
              <button
                key={format}
                onClick={() => {
                  onSelect(format)
                  onClose()
                }}
                style={{
                  padding: theme.spacing.md,
                  backgroundColor: isSelected
                    ? theme.colors.gold.main
                    : theme.colors.background.secondary,
                  color: isSelected
                    ? theme.colors.background.primary
                    : theme.colors.text.primary,
                  border: `2px solid ${isSelected ? theme.colors.gold.main : theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  cursor: 'pointer',
                  transition: theme.transitions.fast,
                  textAlign: 'center',
                }}
              >
                {format}
              </button>
            )
          })}
        </div>

        {/* Cancel Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: theme.spacing.lg,
            padding: theme.spacing.md,
            backgroundColor: 'transparent',
            color: theme.colors.text.secondary,
            border: `1px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.base,
            cursor: 'pointer',
            transition: theme.transitions.fast,
          }}
        >
          Cancel
        </button>
      </motion.div>
    </div>
  )
}
