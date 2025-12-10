'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { FaGraduationCap } from 'react-icons/fa'
import { theme } from '@/styles/theme'
import { mainVariants } from '@/constants/animations'

interface MethodologyViewProps {
  coachId: string
  teamId: string
}

export const MethodologyView: React.FC<MethodologyViewProps> = () => {
  return (
    <motion.div
      variants={mainVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100%',
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing.xl,
      }}
    >
      <div
        style={{
          backgroundColor: theme.colors.background.primary,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing['2xl'],
          textAlign: 'center',
          maxWidth: '500px',
          border: `1px solid ${theme.colors.border.primary}`,
        }}
      >
        <FaGraduationCap
          size={64}
          style={{
            color: theme.colors.gold.main,
            marginBottom: theme.spacing.lg,
          }}
        />
        <h2
          style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.md,
          }}
        >
          My Methodology
        </h2>
        <p
          style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.lg,
          }}
        >
          Define your playing style, training principles, and positional profiles.
          This feature is being upgraded to the new methodology system.
        </p>
        <div
          style={{
            padding: theme.spacing.md,
            backgroundColor: theme.colors.background.tertiary,
            borderRadius: theme.borderRadius.md,
            color: theme.colors.gold.main,
            fontSize: theme.typography.fontSize.sm,
          }}
        >
          Coming soon in the next update
        </div>
      </div>
    </motion.div>
  )
}
