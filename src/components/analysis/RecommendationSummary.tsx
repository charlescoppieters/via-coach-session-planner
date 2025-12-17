'use client'

import React from 'react'
import { theme } from '@/styles/theme'
import type { TeamIDPGap, TeamBlockRecommendation } from '@/types/database'
import { formatTimeAgo } from '@/lib/teamAnalytics'

interface RecommendationSummaryProps {
  topIdps: TeamIDPGap[] | null
  topBlocks: TeamBlockRecommendation[] | null
  loading?: boolean
  onIdpClick?: (attributeKey: string) => void
  onBlockClick?: (blockId: string) => void
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: '52px',
            backgroundColor: theme.colors.background.tertiary,
            borderRadius: theme.borderRadius.md,
            animation: 'pulse 2s infinite',
          }}
        />
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: theme.spacing.lg,
        textAlign: 'center',
        color: theme.colors.text.secondary,
        fontSize: theme.typography.fontSize.sm,
      }}
    >
      {message}
    </div>
  )
}

function MetadataTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        backgroundColor: theme.colors.background.secondary,
        padding: `2px ${theme.spacing.sm}`,
        borderRadius: theme.borderRadius.full,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function RecommendedIDPRow({ idp, rank, onClick }: { idp: TeamIDPGap; rank: number; onClick?: () => void }) {
  const lastTrained = formatTimeAgo(idp.last_trained_date)

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.xs,
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: theme.borderRadius.md,
        border: '1px solid transparent',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'border-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.colors.accent.gold
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'transparent'
      }}
    >
      {/* Top row: Rank, Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
        {/* Rank */}
        <span
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            width: '24px',
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          #{rank}
        </span>

        {/* Attribute Name */}
        <div
          style={{
            flex: 1,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.text.primary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {idp.attribute_name}
        </div>
      </div>

      {/* Bottom row: Metadata tags */}
      <div style={{ display: 'flex', gap: theme.spacing.sm, marginLeft: '32px' }}>
        <MetadataTag>
          {idp.players_with_idp} {idp.players_with_idp === 1 ? 'player needs this' : 'players need this'}
        </MetadataTag>
        <MetadataTag>
          {lastTrained === 'Never trained' ? 'Never trained' : `Last trained ${lastTrained.toLowerCase()}`}
        </MetadataTag>
      </div>
    </button>
  )
}

function RecommendedBlockRow({ block, rank, onClick }: { block: TeamBlockRecommendation; rank: number; onClick?: () => void }) {
  const playerCount = block.impacted_players.length

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.xs,
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: theme.borderRadius.md,
        border: '1px solid transparent',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'border-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.colors.accent.gold
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'transparent'
      }}
    >
      {/* Top row: Rank, Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
        {/* Rank */}
        <span
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            width: '24px',
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          #{rank}
        </span>

        {/* Block Title */}
        <div
          style={{
            flex: 1,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.text.primary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {block.block_title}
        </div>
      </div>

      {/* Bottom row: Metadata tags */}
      <div style={{ display: 'flex', gap: theme.spacing.sm, marginLeft: '32px' }}>
        <MetadataTag>
          Targets {block.idp_impact_count} {block.idp_impact_count === 1 ? 'IDP' : 'IDPs'}
        </MetadataTag>
        <MetadataTag>
          Benefits {playerCount} {playerCount === 1 ? 'player' : 'players'}
        </MetadataTag>
      </div>
    </button>
  )
}

export function RecommendationSummary({ topIdps, topBlocks, loading, onIdpClick, onBlockClick }: RecommendationSummaryProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: theme.spacing.lg,
        marginTop: theme.spacing.lg,
      }}
    >
      {/* Recommended IDPs Card */}
      <div
        style={{
          backgroundColor: theme.colors.background.secondary,
          border: `1px solid ${theme.colors.border.primary}`,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.lg,
        }}
      >
        <h3
          style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.xs,
          }}
        >
          Recommended IDPs for Next Session
        </h3>
        <p
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.md,
          }}
        >
          IDPs that need the most attention based on recency and player impact
        </p>

        {loading ? (
          <LoadingSkeleton />
        ) : topIdps && topIdps.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            {topIdps.slice(0, 5).map((idp, index) => (
              <RecommendedIDPRow
                key={idp.attribute_key}
                idp={idp}
                rank={index + 1}
                onClick={() => onIdpClick?.(idp.attribute_key)}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="No active IDPs found. Assign IDPs to players to see recommendations." />
        )}
      </div>

      {/* Recommended Blocks Card */}
      <div
        style={{
          backgroundColor: theme.colors.background.secondary,
          border: `1px solid ${theme.colors.border.primary}`,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.lg,
        }}
      >
        <h3
          style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.xs,
          }}
        >
          Recommended Training Blocks for Next Session
        </h3>
        <p
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.md,
          }}
        >
          Training blocks with the highest impact on your players' active IDPs
        </p>

        {loading ? (
          <LoadingSkeleton />
        ) : topBlocks && topBlocks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            {topBlocks.slice(0, 5).map((block, index) => (
              <RecommendedBlockRow
                key={block.block_id}
                block={block}
                rank={index + 1}
                onClick={() => onBlockClick?.(block.block_id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="No block recommendations available. Create blocks with attributes to see recommendations." />
        )}
      </div>
    </div>
  )
}
