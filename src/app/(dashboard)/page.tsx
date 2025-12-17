'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MdDashboard } from 'react-icons/md'
import { theme } from '@/styles/theme'
import { mainVariants } from '@/constants/animations'
import { useTeam } from '@/contexts/TeamContext'
import type {
  TimePeriodPreset,
  TeamTrainingSummary,
  TeamIDPGap,
  TeamBlockRecommendation,
} from '@/types/database'
import {
  getTeamTrainingSummary,
  getTeamIDPGaps,
  getTeamBlockRecommendations,
} from '@/lib/teamAnalytics'
import { TimePeriodFilter } from '@/components/analysis/TimePeriodFilter'
import { OverviewCards } from '@/components/analysis/OverviewCards'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { selectedTeam } = useTeam()
  const router = useRouter()

  // Time period state
  const [preset, setPreset] = useState<TimePeriodPreset>('all')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  // Data state
  const [summary, setSummary] = useState<TeamTrainingSummary | null>(null)
  const [gaps, setGaps] = useState<TeamIDPGap[] | null>(null)
  const [recommendations, setRecommendations] = useState<TeamBlockRecommendation[] | null>(null)

  // Loading states
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingGaps, setLoadingGaps] = useState(true)
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

  // Navigate to IDP gaps tab with expanded item
  const handleIdpClick = useCallback((attributeKey: string) => {
    router.push(`/team/analysis?tab=idp-gaps&expand=${attributeKey}`)
  }, [router])

  // Navigate to patterns tab with expanded block
  const handleBlockClick = useCallback((blockId: string) => {
    router.push(`/team/analysis?tab=patterns&expand=${blockId}`)
  }, [router])

  // Fetch data when team or date range changes
  useEffect(() => {
    if (!selectedTeam) {
      setLoadingSummary(false)
      setLoadingGaps(false)
      setLoadingRecommendations(false)
      return
    }

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
    fetchRecommendations()
  }, [selectedTeam, startDate, endDate])

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
          paddingBottom: theme.spacing.md,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexShrink: 0,
          gap: theme.spacing.md,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.md,
              marginBottom: theme.spacing.xs,
            }}
          >
            <MdDashboard size={28} style={{ color: theme.colors.text.primary }} />
            <h1
              style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                margin: 0,
              }}
            >
              Dashboard
            </h1>
          </div>
          <p
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              margin: 0,
            }}
          >
            {formatTodaysDate().weekday}, {formatTodaysDate().dayWithMonth}
          </p>
        </div>

        {/* Time Period Filter */}
        <TimePeriodFilter
          preset={preset}
          startDate={startDate}
          endDate={endDate}
          onChange={handleTimePeriodChange}
        />
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: theme.spacing.xl,
          paddingTop: theme.spacing.xl,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1400px',
            paddingTop: '40px',
          }}
        >
          {!selectedTeam ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '300px',
                backgroundColor: theme.colors.background.primary,
                borderRadius: theme.borderRadius.lg,
                border: `1px dashed ${theme.colors.border.primary}`,
                color: theme.colors.text.secondary,
                fontSize: theme.typography.fontSize.base,
              }}
            >
              Please select a team to view analytics
            </div>
          ) : (
            <OverviewCards
              summary={summary}
              topIdps={gaps}
              topBlocks={recommendations}
              loading={loadingSummary || loadingGaps || loadingRecommendations}
              onIdpClick={handleIdpClick}
              onBlockClick={handleBlockClick}
              sectionGap="48px"
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}
