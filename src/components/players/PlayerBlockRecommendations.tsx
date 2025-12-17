'use client'

import React, { useState } from 'react'
import { FaChevronDown, FaChevronUp, FaCube } from 'react-icons/fa'
import { theme } from '@/styles/theme'
import type { PlayerBlockRecommendation } from '@/types/database'
import { getGapStatusColor } from '@/lib/playerAnalytics'
import { getPriorityColor } from '@/lib/teamAnalytics'

interface PlayerBlockRecommendationsProps {
  recommendations: PlayerBlockRecommendation[] | null
  isLoading?: boolean
  limit?: number
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: '56px',
            backgroundColor: theme.colors.background.tertiary,
            borderRadius: theme.borderRadius.md,
            animation: 'pulse 2s infinite',
          }}
        />
      ))}
    </div>
  )
}

function BlockRow({ block, rank }: { block: PlayerBlockRecommendation; rank: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      style={{
        backgroundColor: theme.colors.background.secondary,
        border: `1px solid ${theme.colors.border.primary}`,
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
      }}
    >
      {/* Main Row */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
          padding: theme.spacing.md,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
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

        {/* Block icon */}
        <FaCube size={14} style={{ color: theme.colors.gold.main, flexShrink: 0 }} />

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

        {/* IDP Impact Badge */}
        <span
          style={{
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.text.secondary,
            backgroundColor: theme.colors.background.tertiary,
            padding: `2px ${theme.spacing.sm}`,
            borderRadius: theme.borderRadius.full,
            whiteSpace: 'nowrap',
          }}
        >
          {block.idp_impact_count} {block.idp_impact_count === 1 ? 'IDP' : 'IDPs'}
        </span>

        {/* Expand icon */}
        {expanded ? (
          <FaChevronUp size={12} style={{ color: theme.colors.text.secondary, flexShrink: 0 }} />
        ) : (
          <FaChevronDown size={12} style={{ color: theme.colors.text.secondary, flexShrink: 0 }} />
        )}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div
          style={{
            padding: `0 ${theme.spacing.md} ${theme.spacing.md}`,
            borderTop: `1px solid ${theme.colors.border.primary}`,
          }}
        >
          {/* First Order Attributes */}
          {block.first_order_attributes.length > 0 && (
            <div style={{ marginTop: theme.spacing.md }}>
              <div
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.xs,
                }}
              >
                Primary Outcomes
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                {block.first_order_attributes.map((attr) => (
                  <span
                    key={attr.key}
                    style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.text.primary,
                      backgroundColor: theme.colors.background.tertiary,
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      borderRadius: theme.borderRadius.sm,
                    }}
                  >
                    {attr.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Second Order Attributes */}
          {block.second_order_attributes.length > 0 && (
            <div style={{ marginTop: theme.spacing.md }}>
              <div
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.xs,
                }}
              >
                Secondary Outcomes
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                {block.second_order_attributes.map((attr) => (
                  <span
                    key={attr.key}
                    style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.text.secondary,
                      backgroundColor: theme.colors.background.tertiary,
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      borderRadius: theme.borderRadius.sm,
                    }}
                  >
                    {attr.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* IDP Breakdown */}
          {block.idp_breakdown.length > 0 && (
            <div style={{ marginTop: theme.spacing.md }}>
              <div
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.xs,
                }}
              >
                IDPs This Block Trains
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                {block.idp_breakdown.map((idp) => (
                  <div
                    key={idp.attribute_key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      padding: theme.spacing.xs,
                      backgroundColor: theme.colors.background.tertiary,
                      borderRadius: theme.borderRadius.sm,
                    }}
                  >
                    {/* Priority dot */}
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: getPriorityColor(idp.idp_score),
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.text.primary,
                      }}
                    >
                      {idp.attribute_name}
                    </span>
                    <span
                      style={{
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.text.secondary,
                      }}
                    >
                      {idp.relevance >= 1.0 ? 'Primary' : 'Secondary'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function PlayerBlockRecommendations({
  recommendations,
  isLoading,
  limit = 5,
}: PlayerBlockRecommendationsProps) {
  const displayedBlocks = recommendations?.slice(0, limit) || []

  return (
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
        Recommended Training Blocks
      </h3>
      <p
        style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.md,
        }}
      >
        Blocks that best address this player&apos;s development needs
      </p>

      {isLoading ? (
        <LoadingSkeleton />
      ) : displayedBlocks.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {displayedBlocks.map((block, index) => (
            <BlockRow key={block.block_id} block={block} rank={index + 1} />
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: theme.spacing.lg,
            textAlign: 'center',
            color: theme.colors.text.secondary,
            fontSize: theme.typography.fontSize.sm,
          }}
        >
          No recommendations available. Assign IDPs to this player to see recommended training blocks.
        </div>
      )}
    </div>
  )
}
