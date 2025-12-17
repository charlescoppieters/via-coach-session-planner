'use client'

import React from 'react'
import { theme } from '@/styles/theme'

export type PlayerTab = 'details' | 'overview' | 'development' | 'balance' | 'feedback' | 'sessions'

interface PlayerTabsProps {
  activeTab: PlayerTab
  onTabChange: (tab: PlayerTab) => void
}

const tabs: { key: PlayerTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'details', label: 'Details' },
  { key: 'development', label: 'Development' },
  { key: 'balance', label: 'Balance' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'sessions', label: 'Sessions' },
]

export const PlayerTabs: React.FC<PlayerTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: theme.spacing.md,
        borderBottom: `1px solid ${theme.colors.border.primary}`,
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            backgroundColor: 'transparent',
            color:
              activeTab === tab.key
                ? theme.colors.gold.main
                : theme.colors.text.secondary,
            border: 'none',
            borderBottom:
              activeTab === tab.key
                ? `2px solid ${theme.colors.gold.main}`
                : '2px solid transparent',
            cursor: 'pointer',
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            marginBottom: '-1px',
            transition: theme.transitions.fast,
          }}
          onMouseEnter={(e) => {
            if (activeTab !== tab.key) {
              e.currentTarget.style.color = theme.colors.text.primary
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== tab.key) {
              e.currentTarget.style.color = theme.colors.text.secondary
            }
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
