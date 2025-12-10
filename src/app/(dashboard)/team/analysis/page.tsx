'use client'

import React from 'react'
import { FaChartBar } from 'react-icons/fa'
import { theme } from '@/styles/theme'

export default function TeamAnalysisPage() {
  return (
    <div>
      {/* Header */}
      <div
        style={{
          marginBottom: theme.spacing.xl,
        }}
      >
        <h1
          style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.sm,
          }}
        >
          Analysis
        </h1>
        <p
          style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.secondary,
          }}
        >
          View team performance data and development insights
        </p>
      </div>

      {/* Placeholder Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.xl,
          textAlign: 'center',
          color: theme.colors.text.secondary,
        }}
      >
        <FaChartBar size={48} style={{ marginBottom: theme.spacing.lg, opacity: 0.3 }} />
        <p style={{ fontSize: theme.typography.fontSize.lg, marginBottom: theme.spacing.sm }}>
          Insufficient data to assess
        </p>
        <p style={{ fontSize: theme.typography.fontSize.sm }}>
          Please come back once more session data has been collected. Analysis will show how frequently each IDP target has been addressed across sessions.
        </p>
      </div>
    </div>
  )
}
