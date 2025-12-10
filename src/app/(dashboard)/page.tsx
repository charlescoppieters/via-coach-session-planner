'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { MdDashboard } from 'react-icons/md'
import { HiOfficeBuilding } from 'react-icons/hi'
import { theme } from '@/styles/theme'
import { mainVariants } from '@/constants/animations'
import { useAuth } from '@/contexts/AuthContext'

export default function DashboardPage() {
  const { coach, club, isAdmin } = useAuth()

  // Format today's date
  const formatTodaysDate = () => {
    const today = new Date()
    const day = today.getDate()
    const month = today.toLocaleDateString('en-US', { month: 'long' })
    const year = today.getFullYear()
    const weekday = today.toLocaleDateString('en-US', { weekday: 'long' })

    const getOrdinalSuffix = (d: number) => {
      if (d > 3 && d < 21) return 'th'
      switch (d % 10) {
        case 1: return 'st'
        case 2: return 'nd'
        case 3: return 'rd'
        default: return 'th'
      }
    }

    return {
      dayWithMonth: `${day}${getOrdinalSuffix(day)} ${month}, ${year}`,
      weekday: weekday,
    }
  }

  return (
    <motion.div
      key="dashboard"
      variants={mainVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        flex: 1,
        height: '100vh',
        backgroundColor: theme.colors.background.secondary,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: theme.spacing.xl,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.md,
          }}
        >
          <MdDashboard size={32} style={{ color: theme.colors.text.primary }} />
          <h1
            style={{
              fontSize: theme.typography.fontSize['3xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              margin: 0,
            }}
          >
            Dashboard
          </h1>
        </div>

        {/* Date display */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
            }}
          >
            {formatTodaysDate().dayWithMonth}
          </div>
          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
            }}
          >
            {formatTodaysDate().weekday}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: theme.spacing.xl,
          paddingTop: 0,
        }}
      >
        {/* Placeholder for future content */}
        <div
          style={{
            marginTop: theme.spacing['2xl'],
            padding: theme.spacing.xl,
            backgroundColor: theme.colors.background.primary,
            borderRadius: theme.borderRadius.lg,
            border: `1px dashed ${theme.colors.border.primary}`,
            textAlign: 'center',
            color: theme.colors.text.secondary,
          }}
        >
          <p style={{ margin: 0 }}>
            More dashboard features coming soon: recent sessions, upcoming sessions, team stats, and quick actions.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
