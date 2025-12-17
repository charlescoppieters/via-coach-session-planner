'use client'

import React, { useState } from 'react'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'
import { theme } from '@/styles/theme'
import type { TeamSessionBlockUsage, TeamBlockRecommendation, BlockAttribute } from '@/types/database'
import { getPriorityColor } from '@/lib/teamAnalytics'

type ViewMode = 'usage' | 'impact'

interface SessionPatternsProps {
  blocks: TeamSessionBlockUsage[] | null
  recommendations?: TeamBlockRecommendation[] | null
  loading?: boolean
  expandedBlockId?: string | null
}

interface BlockRowProps {
  block: TeamSessionBlockUsage
  defaultExpanded?: boolean
}

interface RecommendationBlockRowProps {
  block: TeamBlockRecommendation
  defaultExpanded?: boolean
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function AttributeChip({ attribute }: { attribute: BlockAttribute }) {
  return (
    <span
      style={{
        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: theme.borderRadius.sm,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
      }}
    >
      {attribute.name}
    </span>
  )
}

function BlockRow({ block, defaultExpanded = false }: BlockRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const hasFirstOrder = block.first_order_attributes && block.first_order_attributes.length > 0
  const hasSecondOrder = block.second_order_attributes && block.second_order_attributes.length > 0

  return (
    <div
      style={{
        backgroundColor: theme.colors.background.secondary,
        border: `1px solid ${theme.colors.border.primary}`,
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
        marginBottom: theme.spacing.sm,
      }}
    >
      {/* Main Row */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: theme.spacing.md,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, flex: 1 }}>
          {/* Block Title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: theme.typography.fontSize.base,
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

          {/* Usage Count */}
          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              flexShrink: 0,
              textAlign: 'right',
            }}
          >
            Used in{' '}
            <span style={{ fontWeight: theme.typography.fontWeight.medium, color: theme.colors.text.primary }}>
              {block.usage_count}
            </span>
            {' '}{block.usage_count === 1 ? 'session' : 'sessions'}
          </div>

          {/* Active IDP Impact */}
          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.primary,
              flexShrink: 0,
              textAlign: 'right',
            }}
          >
            <span
              style={{
                fontWeight: theme.typography.fontWeight.medium,
                color: block.active_idp_impact > 0 ? theme.colors.gold.main : theme.colors.text.secondary,
              }}
            >
              {block.active_idp_impact}
            </span>
            <span style={{ color: theme.colors.text.secondary }}>
              {' '}player {block.active_idp_impact === 1 ? 'IDP' : 'IDPs'} targeted
            </span>
          </div>

          {/* Expand Icon */}
          {expanded ? (
            <FaChevronUp size={12} style={{ color: theme.colors.text.secondary, flexShrink: 0 }} />
          ) : (
            <FaChevronDown size={12} style={{ color: theme.colors.text.secondary, flexShrink: 0 }} />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div
          style={{
            padding: theme.spacing.md,
            borderTop: `1px solid ${theme.colors.border.primary}`,
          }}
        >
          {/* First Order Attributes */}
          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.sm,
            }}
          >
            First Order Attributes:
          </div>
          {hasFirstOrder ? (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: theme.spacing.xs,
                marginBottom: theme.spacing.lg,
              }}
            >
              {block.first_order_attributes.map((attr) => (
                <AttributeChip key={attr.key} attribute={attr} />
              ))}
            </div>
          ) : (
            <div
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                fontStyle: 'italic',
                marginBottom: theme.spacing.lg,
              }}
            >
              None
            </div>
          )}

          {/* Second Order Attributes */}
          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.sm,
            }}
          >
            Second Order Attributes:
          </div>
          {hasSecondOrder ? (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: theme.spacing.xs,
                marginBottom: theme.spacing.lg,
              }}
            >
              {block.second_order_attributes.map((attr) => (
                <AttributeChip key={attr.key} attribute={attr} />
              ))}
            </div>
          ) : (
            <div
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                fontStyle: 'italic',
                marginBottom: theme.spacing.lg,
              }}
            >
              None
            </div>
          )}

          {/* Impacted Players */}
          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.sm,
            }}
          >
            Players with matching IDPs:
          </div>
          {block.impacted_players && block.impacted_players.length > 0 ? (
            <div
              style={{
                display: 'flex',
                overflowX: 'auto',
                gap: theme.spacing.sm,
                paddingBottom: theme.spacing.xs,
                scrollbarWidth: 'thin',
                scrollbarColor: `${theme.colors.border.primary} transparent`,
              }}
            >
              {block.impacted_players.map((player) => (
                <a
                  key={player.player_id}
                  href={`/team/players/${player.player_id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    padding: theme.spacing.sm,
                    backgroundColor: theme.colors.background.tertiary,
                    border: `1px solid ${theme.colors.border.primary}`,
                    borderRadius: theme.borderRadius.md,
                    textDecoration: 'none',
                    flexShrink: 0,
                    transition: 'border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.gold.main
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border.primary
                  }}
                >
                  {/* Initials Avatar */}
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: theme.colors.border.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.bold,
                      color: theme.colors.text.primary,
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(player.player_name)}
                  </div>
                  {/* Name and Position */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span
                      style={{
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.text.primary,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {player.player_name}
                    </span>
                    {player.position && (
                      <span
                        style={{
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.text.secondary,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {player.position}
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                fontStyle: 'italic',
              }}
            >
              None
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            height: '56px',
            backgroundColor: theme.colors.background.secondary,
            border: `1px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.md,
            animation: 'pulse 2s infinite',
          }}
        />
      ))}
    </div>
  )
}

function RecommendationBlockRow({ block, defaultExpanded = false }: RecommendationBlockRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const hasFirstOrder = block.first_order_attributes && block.first_order_attributes.length > 0
  const hasSecondOrder = block.second_order_attributes && block.second_order_attributes.length > 0

  return (
    <div
      style={{
        backgroundColor: theme.colors.background.secondary,
        border: `1px solid ${theme.colors.border.primary}`,
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
        marginBottom: theme.spacing.sm,
      }}
    >
      {/* Main Row */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: theme.spacing.md,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, flex: 1 }}>
          {/* Block Title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: theme.typography.fontSize.base,
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

          {/* IDP Impact Count */}
          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              flexShrink: 0,
              textAlign: 'right',
            }}
          >
            Trains{' '}
            <span style={{ fontWeight: theme.typography.fontWeight.medium, color: theme.colors.text.primary }}>
              {block.idp_impact_count}
            </span>
            {' '}{block.idp_impact_count === 1 ? 'priority IDP' : 'priority IDPs'}
          </div>

          {/* Players Benefiting */}
          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              flexShrink: 0,
              textAlign: 'right',
            }}
          >
            <span style={{ fontWeight: theme.typography.fontWeight.medium, color: theme.colors.text.primary }}>
              {block.impacted_players.length}
            </span>
            {' '}{block.impacted_players.length === 1 ? 'player benefits' : 'players benefit'}
          </div>

          {/* Expand Icon */}
          {expanded ? (
            <FaChevronUp size={12} style={{ color: theme.colors.text.secondary, flexShrink: 0 }} />
          ) : (
            <FaChevronDown size={12} style={{ color: theme.colors.text.secondary, flexShrink: 0 }} />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div
          style={{
            padding: theme.spacing.md,
            borderTop: `1px solid ${theme.colors.border.primary}`,
          }}
        >
          {/* IDPs This Block Trains */}
          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.sm,
            }}
          >
            IDPs This Block Trains:
          </div>
          {block.idp_breakdown && block.idp_breakdown.length > 0 ? (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: theme.spacing.xs,
                marginBottom: theme.spacing.lg,
              }}
            >
              {block.idp_breakdown.map((idp) => (
                <span
                  key={idp.attribute_key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.xs,
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    backgroundColor: theme.colors.background.tertiary,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.sm,
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: getPriorityColor(idp.idp_score),
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: theme.colors.text.primary }}>{idp.attribute_name}</span>
                  <span style={{ color: theme.colors.text.secondary }}>
                    ({idp.players?.length ?? 0} {(idp.players?.length ?? 0) === 1 ? 'player' : 'players'})
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <div
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                fontStyle: 'italic',
                marginBottom: theme.spacing.lg,
              }}
            >
              None
            </div>
          )}

          {/* First Order Attributes */}
          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.sm,
            }}
          >
            First Order Attributes:
          </div>
          {hasFirstOrder ? (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: theme.spacing.xs,
                marginBottom: theme.spacing.lg,
              }}
            >
              {block.first_order_attributes.map((attr) => (
                <AttributeChip key={attr.key} attribute={attr} />
              ))}
            </div>
          ) : (
            <div
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                fontStyle: 'italic',
                marginBottom: theme.spacing.lg,
              }}
            >
              None
            </div>
          )}

          {/* Second Order Attributes */}
          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.sm,
            }}
          >
            Second Order Attributes:
          </div>
          {hasSecondOrder ? (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: theme.spacing.xs,
                marginBottom: theme.spacing.lg,
              }}
            >
              {block.second_order_attributes.map((attr) => (
                <AttributeChip key={attr.key} attribute={attr} />
              ))}
            </div>
          ) : (
            <div
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                fontStyle: 'italic',
                marginBottom: theme.spacing.lg,
              }}
            >
              None
            </div>
          )}

          {/* Impacted Players */}
          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.sm,
            }}
          >
            Players with matching IDPs:
          </div>
          {block.impacted_players && block.impacted_players.length > 0 ? (
            <div
              style={{
                display: 'flex',
                overflowX: 'auto',
                gap: theme.spacing.sm,
                paddingBottom: theme.spacing.xs,
                scrollbarWidth: 'thin',
                scrollbarColor: `${theme.colors.border.primary} transparent`,
              }}
            >
              {block.impacted_players.map((player) => (
                <a
                  key={player.player_id}
                  href={`/team/players/${player.player_id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    padding: theme.spacing.sm,
                    backgroundColor: theme.colors.background.tertiary,
                    border: `1px solid ${theme.colors.border.primary}`,
                    borderRadius: theme.borderRadius.md,
                    textDecoration: 'none',
                    flexShrink: 0,
                    transition: 'border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.gold.main
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border.primary
                  }}
                >
                  {/* Initials Avatar */}
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: theme.colors.border.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.bold,
                      color: theme.colors.text.primary,
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(player.player_name)}
                  </div>
                  {/* Name and Position */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span
                      style={{
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.text.primary,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {player.player_name}
                    </span>
                    {player.position && (
                      <span
                        style={{
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.text.secondary,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {player.position}
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                fontStyle: 'italic',
              }}
            >
              None
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function SessionPatterns({ blocks, recommendations, loading, expandedBlockId }: SessionPatternsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(expandedBlockId ? 'impact' : 'impact')
  if (loading) {
    return (
      <div>
        <p
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.md,
          }}
        >
          View your most used training blocks and which players they impact
        </p>
        <LoadingSkeleton />
      </div>
    )
  }

  // Check if we have data for the current view
  const hasUsageData = blocks && blocks.length > 0
  const hasRecommendationData = recommendations && recommendations.length > 0

  // Toggle button style helper
  const getToggleStyle = (mode: ViewMode) => ({
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    border: 'none',
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    backgroundColor: viewMode === mode ? theme.colors.gold.main : 'transparent',
    color: viewMode === mode ? theme.colors.background.primary : theme.colors.text.secondary,
  })

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.spacing.md,
        }}
      >
        <p
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            margin: 0,
          }}
        >
          {viewMode === 'impact'
            ? 'Blocks ranked by their impact on priority IDPs'
            : 'View your most used training blocks'}
        </p>

        {/* View Toggle */}
        <div
          style={{
            display: 'flex',
            gap: '2px',
            padding: '2px',
            backgroundColor: theme.colors.background.tertiary,
            borderRadius: theme.borderRadius.md,
          }}
        >
          <button
            onClick={() => setViewMode('impact')}
            style={getToggleStyle('impact')}
          >
            By IDP Impact
          </button>
          <button
            onClick={() => setViewMode('usage')}
            style={getToggleStyle('usage')}
          >
            By Usage
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'impact' ? (
        hasRecommendationData ? (
          <>
            {recommendations.map((block) => (
              <RecommendationBlockRow
                key={block.block_id}
                block={block}
                defaultExpanded={block.block_id === expandedBlockId}
              />
            ))}
          </>
        ) : (
          <div
            style={{
              padding: theme.spacing.xl,
              textAlign: 'center',
              color: theme.colors.text.secondary,
              backgroundColor: theme.colors.background.secondary,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border.primary}`,
            }}
          >
            No block recommendations available. Assign IDPs to players and create blocks with attributes to see recommendations.
          </div>
        )
      ) : (
        hasUsageData ? (
          <>
            <div
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.sm,
                textAlign: 'right',
              }}
            >
              {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'} used
            </div>
            {blocks.map((block) => (
              <BlockRow key={block.block_id} block={block} />
            ))}
          </>
        ) : (
          <div
            style={{
              padding: theme.spacing.xl,
              textAlign: 'center',
              color: theme.colors.text.secondary,
              backgroundColor: theme.colors.background.secondary,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border.primary}`,
            }}
          >
            No training blocks used yet. Complete sessions with blocks to see usage patterns.
          </div>
        )
      )}
    </div>
  )
}
