'use client'

import React, { useEffect, useState } from 'react'
import { FiZap, FiAlertCircle, FiRefreshCw } from 'react-icons/fi'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import { getTeamBlockRecommendations } from '@/lib/teamAnalytics'
import type { TeamBlockRecommendation } from '@/types/database'
import type { SessionBlock } from '@/lib/sessionBlocks'
import { RecommendedBlockCard } from './RecommendedBlockCard'
import { createClient } from '@/lib/supabase/client'

interface RecommendedBlocksTabProps {
  teamId: string
  onSelectBlock: (block: SessionBlock) => void
  excludeBlockIds?: string[]
}

export const RecommendedBlocksTab: React.FC<RecommendedBlocksTabProps> = ({
  teamId,
  onSelectBlock,
  excludeBlockIds = [],
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<TeamBlockRecommendation[]>([])
  const [blockDetails, setBlockDetails] = useState<Map<string, SessionBlock>>(new Map())
  const [error, setError] = useState<string | null>(null)

  const fetchRecommendations = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch more recommendations than needed so we can filter and still show 5
      const { data: recs, error: recsError } = await getTeamBlockRecommendations(teamId, null, null, 20)

      if (recsError) {
        console.error('Error fetching recommendations:', recsError)
        setError('Failed to load recommendations')
        setIsLoading(false)
        return
      }

      if (!recs || recs.length === 0) {
        setRecommendations([])
        setIsLoading(false)
        return
      }

      console.log('Raw recommendations data:', recs)
      setRecommendations(recs)

      // Fetch full block details for duration, etc.
      const blockIds = recs.map((r) => r.block_id)
      const supabase = createClient()
      const { data: blocks } = await supabase
        .from('session_blocks')
        .select('*')
        .in('id', blockIds)

      if (blocks) {
        const detailsMap = new Map<string, SessionBlock>()
        blocks.forEach((block) => {
          detailsMap.set(block.id, block as SessionBlock)
        })
        setBlockDetails(detailsMap)
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err)
      setError('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [teamId])

  // Filter out already-assigned blocks and take top 5
  const filteredRecommendations = recommendations
    .filter((rec) => !excludeBlockIds.includes(rec.block_id))
    .slice(0, 5)

  const handleSelectBlock = (recommendation: TeamBlockRecommendation) => {
    const block = blockDetails.get(recommendation.block_id)
    if (block) {
      onSelectBlock(block)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.xl,
          color: theme.colors.text.muted,
          height: '300px',
        }}
      >
        <CgSpinnerAlt
          style={{
            animation: 'spin 1s linear infinite',
            fontSize: '32px',
            marginBottom: theme.spacing.md,
          }}
        />
        <span>Analyzing team IDPs...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.xl,
          textAlign: 'center',
          height: '300px',
        }}
      >
        <FiAlertCircle size={32} style={{ color: theme.colors.text.muted, marginBottom: theme.spacing.md }} />
        <p style={{ color: theme.colors.text.secondary, marginBottom: theme.spacing.md }}>{error}</p>
        <button
          onClick={fetchRecommendations}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            backgroundColor: theme.colors.background.tertiary,
            color: theme.colors.text.primary,
            border: `1px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.md,
            cursor: 'pointer',
            fontSize: theme.typography.fontSize.sm,
          }}
        >
          <FiRefreshCw size={14} />
          Try Again
        </button>
      </div>
    )
  }

  // Empty state
  if (filteredRecommendations.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.xl,
          textAlign: 'center',
          height: '300px',
        }}
      >
        <FiZap size={32} style={{ color: theme.colors.text.muted, marginBottom: theme.spacing.md }} />
        <h4
          style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            margin: 0,
            marginBottom: theme.spacing.sm,
          }}
        >
          {excludeBlockIds.length > 0 ? 'No More Recommendations' : 'No Recommendations Yet'}
        </h4>
        <p
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            margin: 0,
            maxWidth: '400px',
          }}
        >
          {excludeBlockIds.length > 0
            ? 'All recommended blocks have been added to this session. Browse All to find more blocks.'
            : 'Recommendations appear when your players have active IDPs and your block library has matching training content. Add IDPs to players and create blocks with tagged outcomes.'}
        </p>
      </div>
    )
  }

  // Recommendations list
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: theme.spacing.sm,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <FiZap size={16} style={{ color: theme.colors.gold.main }} />
          <span
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
            }}
          >
            Top {filteredRecommendations.length} blocks for your team&apos;s IDPs
          </span>
        </div>
        <button
          onClick={fetchRecommendations}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            backgroundColor: 'transparent',
            color: theme.colors.text.muted,
            border: 'none',
            borderRadius: theme.borderRadius.sm,
            cursor: 'pointer',
            fontSize: theme.typography.fontSize.xs,
            transition: theme.transitions.fast,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = theme.colors.text.primary
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = theme.colors.text.muted
          }}
        >
          <FiRefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Scrollable list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.md,
          padding: theme.spacing.sm,
          minHeight: 0,
        }}
      >
        {filteredRecommendations.map((rec, index) => {
          const block = blockDetails.get(rec.block_id)
          return (
            <RecommendedBlockCard
              key={rec.block_id || index}
              recommendation={rec}
              onClick={() => handleSelectBlock(rec)}
              blockDuration={block?.duration}
            />
          )
        })}
      </div>

      {/* Future: Generate with AI placeholder */}
      <div
        style={{
          padding: theme.spacing.sm,
          borderTop: `1px solid ${theme.colors.border.primary}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.sm,
            padding: theme.spacing.sm,
            backgroundColor: theme.colors.background.tertiary,
            border: `1px dashed ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.md,
            opacity: 0.6,
            cursor: 'not-allowed',
          }}
        >
          <FiZap size={16} style={{ color: theme.colors.gold.main }} />
          <span
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
            }}
          >
            Generate with AI — Coming Soon
          </span>
        </div>
      </div>
    </div>
  )
}
