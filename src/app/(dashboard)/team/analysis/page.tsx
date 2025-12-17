'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { theme } from '@/styles/theme'
import { useTeam } from '@/contexts/TeamContext'
import type {
  TimePeriodPreset,
  TeamTrainingSummary,
  TeamIDPGap,
  TeamAttributeBreakdown,
  TeamPlayerMatrixRow,
  TeamSessionBlockUsage,
  TeamBlockRecommendation,
} from '@/types/database'
import {
  getTeamTrainingSummary,
  getTeamIDPGaps,
  getTeamAttributeBreakdown,
  getTeamPlayerMatrix,
  getTeamSessionBlockUsage,
  getTeamBlockRecommendations,
} from '@/lib/teamAnalytics'
import { TimePeriodFilter } from '@/components/analysis/TimePeriodFilter'
import { OverviewCards } from '@/components/analysis/OverviewCards'
import { IDPGapAnalysis } from '@/components/analysis/IDPGapAnalysis'
import { TrainingCategoryBreakdown } from '@/components/analysis/TrainingCategoryBreakdown'
import { PlayerDevelopmentMatrix } from '@/components/analysis/PlayerDevelopmentMatrix'
import { SessionPatterns } from '@/components/analysis/SessionPatterns'

type AnalyticsTab = 'overview' | 'idp-gaps' | 'categories' | 'players' | 'patterns'

const TABS: { id: AnalyticsTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'idp-gaps', label: 'IDP Gaps' },
  { id: 'patterns', label: 'Training Blocks' },
  { id: 'categories', label: 'Balance' },
  { id: 'players', label: 'Player Matrix' },
]

export default function TeamAnalysisPage() {
  const { selectedTeam } = useTeam()

  // Tab state
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview')

  // Expanded item state (for navigating from Overview to specific items)
  const [expandedIdpKey, setExpandedIdpKey] = useState<string | null>(null)
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null)

  // Time period state
  const [preset, setPreset] = useState<TimePeriodPreset>('all')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  // Data state
  const [summary, setSummary] = useState<TeamTrainingSummary | null>(null)
  const [gaps, setGaps] = useState<TeamIDPGap[] | null>(null)
  const [breakdown, setBreakdown] = useState<TeamAttributeBreakdown[] | null>(null)
  const [playerMatrix, setPlayerMatrix] = useState<TeamPlayerMatrixRow[] | null>(null)
  const [blocks, setBlocks] = useState<TeamSessionBlockUsage[] | null>(null)
  const [recommendations, setRecommendations] = useState<TeamBlockRecommendation[] | null>(null)

  // Loading states
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingGaps, setLoadingGaps] = useState(true)
  const [loadingBreakdown, setLoadingBreakdown] = useState(true)
  const [loadingMatrix, setLoadingMatrix] = useState(true)
  const [loadingBlocks, setLoadingBlocks] = useState(true)
  const [loadingRecommendations, setLoadingRecommendations] = useState(true)

  // Handle time period change
  const handleTimePeriodChange = useCallback(
    (newPreset: TimePeriodPreset, start: Date | null, end: Date | null) => {
      setPreset(newPreset)
      setStartDate(start)
      setEndDate(end)
    },
    []
  )

  // Handle clicking on a recommended IDP
  const handleIdpClick = useCallback((attributeKey: string) => {
    setExpandedIdpKey(attributeKey)
    setExpandedBlockId(null)
    setActiveTab('idp-gaps')
  }, [])

  // Handle clicking on a recommended block
  const handleBlockClick = useCallback((blockId: string) => {
    setExpandedBlockId(blockId)
    setExpandedIdpKey(null)
    setActiveTab('patterns')
  }, [])

  // Fetch all data when team or date range changes
  useEffect(() => {
    if (!selectedTeam) return

    const teamId = selectedTeam.id

    // Fetch summary
    async function fetchSummary() {
      setLoadingSummary(true)
      const { data } = await getTeamTrainingSummary(teamId, startDate, endDate)
      setSummary(data)
      setLoadingSummary(false)
    }

    // Fetch IDP gaps
    async function fetchGaps() {
      setLoadingGaps(true)
      const { data } = await getTeamIDPGaps(teamId, startDate, endDate)
      setGaps(data)
      setLoadingGaps(false)
    }

    // Fetch attribute breakdown
    async function fetchBreakdown() {
      setLoadingBreakdown(true)
      const { data } = await getTeamAttributeBreakdown(teamId, startDate, endDate)
      setBreakdown(data)
      setLoadingBreakdown(false)
    }

    // Fetch player matrix
    async function fetchMatrix() {
      setLoadingMatrix(true)
      const { data } = await getTeamPlayerMatrix(teamId, startDate, endDate)
      setPlayerMatrix(data)
      setLoadingMatrix(false)
    }

    // Fetch block usage
    async function fetchBlocks() {
      setLoadingBlocks(true)
      const { data } = await getTeamSessionBlockUsage(teamId, startDate, endDate)
      setBlocks(data)
      setLoadingBlocks(false)
    }

    // Fetch block recommendations
    async function fetchRecommendations() {
      setLoadingRecommendations(true)
      const { data } = await getTeamBlockRecommendations(teamId, startDate, endDate)
      setRecommendations(data)
      setLoadingRecommendations(false)
    }

    // Run all fetches in parallel
    fetchSummary()
    fetchGaps()
    fetchBreakdown()
    fetchMatrix()
    fetchBlocks()
    fetchRecommendations()
  }, [selectedTeam, startDate, endDate])

  if (!selectedTeam) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: theme.colors.text.secondary,
        }}
      >
        Please select a team to view analysis
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewCards
            summary={summary}
            topIdps={gaps}
            topBlocks={recommendations}
            loading={loadingSummary || loadingGaps || loadingRecommendations}
            onIdpClick={handleIdpClick}
            onBlockClick={handleBlockClick}
          />
        )
      case 'idp-gaps':
        return (
          <IDPGapAnalysis
            gaps={gaps}
            loading={loadingGaps}
            expandedKey={expandedIdpKey}
          />
        )
      case 'categories':
        return <TrainingCategoryBreakdown breakdown={breakdown} loading={loadingBreakdown} />
      case 'players':
        return <PlayerDevelopmentMatrix players={playerMatrix} loading={loadingMatrix} />
      case 'patterns':
        return (
          <SessionPatterns
            blocks={blocks}
            recommendations={recommendations}
            loading={loadingBlocks || loadingRecommendations}
            expandedBlockId={expandedBlockId}
          />
        )
      default:
        return null
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Pinned Header */}
      <div
        style={{
          paddingBottom: theme.spacing.md,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: theme.spacing.md,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.xs,
              }}
            >
              Team Analytics
            </h2>
            <p
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
              }}
            >
              Track development progress, identify training gaps, and monitor player performance
            </p>
          </div>
          <TimePeriodFilter
            preset={preset}
            startDate={startDate}
            endDate={endDate}
            onChange={handleTimePeriodChange}
          />
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: theme.spacing.lg,
            marginTop: theme.spacing.lg,
            borderBottom: `1px solid ${theme.colors.border.primary}`,
            overflowX: 'auto',
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: `${theme.spacing.sm} 0`,
                paddingBottom: theme.spacing.md,
                backgroundColor: 'transparent',
                color: activeTab === tab.id ? theme.colors.gold.main : theme.colors.text.secondary,
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? theme.colors.gold.main : 'transparent'}`,
                marginBottom: '-1px',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = theme.colors.text.primary
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = theme.colors.text.secondary
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
        }}
      >
        {renderTabContent()}
      </div>
    </div>
  )
}
