'use client'

import React, { useState } from 'react'
import { FiClock, FiChevronDown, FiChevronUp, FiUsers } from 'react-icons/fi'
import { theme } from '@/styles/theme'
import { getPriorityColor, getPriorityLevel } from '@/lib/teamAnalytics'
import type { TeamBlockRecommendation } from '@/types/database'

interface RecommendedBlockCardProps {
  recommendation: TeamBlockRecommendation
  onClick: () => void
  blockDuration?: number | null
}

export const RecommendedBlockCard: React.FC<RecommendedBlockCardProps> = ({
  recommendation,
  onClick,
  blockDuration,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Safely extract values with fallbacks
  const title = recommendation.block_title || 'Untitled Block'
  const priorityScore = recommendation.priority_score ?? 0
  const impactedPlayers = Array.isArray(recommendation.impacted_players) ? recommendation.impacted_players : []
  const idpBreakdown = Array.isArray(recommendation.idp_breakdown) ? recommendation.idp_breakdown : []

  // Calculate direct (primary) and indirect (secondary) IDP counts
  const directIdpCount = idpBreakdown.filter(idp => (idp.relevance ?? 0) >= 1).length
  const indirectIdpCount = idpBreakdown.filter(idp => (idp.relevance ?? 0) < 1).length

  const priorityLevel = getPriorityLevel(priorityScore)
  const priorityColor = getPriorityColor(priorityScore)

  const priorityLabels = {
    high: 'High Priority',
    medium: 'Recommended',
    low: 'Good Match',
  }

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div
      style={{
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.borderRadius.md,
        border: `1px solid ${theme.colors.border.primary}`,
        overflow: 'hidden',
        transition: theme.transitions.fast,
        flexShrink: 0,
      }}
    >
      {/* Main clickable area */}
      <div
        onClick={onClick}
        style={{
          padding: theme.spacing.md,
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          const parent = e.currentTarget.parentElement
          if (parent) {
            parent.style.borderColor = theme.colors.gold.main
            parent.style.backgroundColor = theme.colors.background.tertiary
          }
        }}
        onMouseLeave={(e) => {
          const parent = e.currentTarget.parentElement
          if (parent) {
            parent.style.borderColor = theme.colors.border.primary
            parent.style.backgroundColor = theme.colors.background.primary
          }
        }}
      >
        {/* Header Row: Title + Priority + Duration */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.sm,
          }}
        >
          {/* Left side: Title + Priority Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              flex: 1,
              flexWrap: 'wrap',
            }}
          >
            <h4
              style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {title}
            </h4>

            {/* Priority Badge */}
            <span
              style={{
                backgroundColor: `${priorityColor}20`,
                color: priorityColor,
                fontSize: theme.typography.fontSize.xs,
                fontWeight: theme.typography.fontWeight.medium,
                padding: `2px ${theme.spacing.sm}`,
                borderRadius: theme.borderRadius.full,
                whiteSpace: 'nowrap',
              }}
            >
              {priorityLabels[priorityLevel]}
            </span>
          </div>

          {/* Duration (top right) */}
          {blockDuration && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                color: theme.colors.text.muted,
                fontSize: theme.typography.fontSize.sm,
                flexShrink: 0,
              }}
            >
              <FiClock size={14} />
              <span>{blockDuration} min</span>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: theme.spacing.sm,
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
          }}
        >
          {/* Players Targeted */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
            }}
          >
            <FiUsers size={14} />
            <span>
              {impactedPlayers.length} {impactedPlayers.length === 1 ? 'player' : 'players'} targeted
            </span>
          </div>

          <span style={{ color: theme.colors.text.muted }}>•</span>

          {/* Direct IDPs */}
          <span style={{ color: theme.colors.status.success }}>
            {directIdpCount} {directIdpCount === 1 ? 'IDP' : 'IDPs'} directly trained
          </span>

          {/* Indirect IDPs (only show if > 0) */}
          {indirectIdpCount > 0 && (
            <>
              <span style={{ color: theme.colors.text.muted }}>•</span>
              <span style={{ color: theme.colors.status.warning }}>
                {indirectIdpCount} {indirectIdpCount === 1 ? 'IDP' : 'IDPs'} indirectly trained
              </span>
            </>
          )}
        </div>
      </div>

      {/* Expand/Collapse Button */}
      <button
        onClick={handleExpandClick}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.sm,
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          backgroundColor: isExpanded ? theme.colors.background.secondary : theme.colors.background.tertiary,
          border: 'none',
          borderTop: `1px solid ${theme.colors.border.primary}`,
          color: isExpanded ? theme.colors.gold.main : theme.colors.text.secondary,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          cursor: 'pointer',
          transition: theme.transitions.fast,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.background.secondary
          e.currentTarget.style.color = theme.colors.gold.main
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isExpanded ? theme.colors.background.secondary : theme.colors.background.tertiary
          e.currentTarget.style.color = isExpanded ? theme.colors.gold.main : theme.colors.text.secondary
        }}
      >
        {isExpanded ? (
          <>
            <FiChevronUp size={16} />
            <span>Hide details</span>
          </>
        ) : (
          <>
            <FiChevronDown size={16} />
            <span>Why this block?</span>
          </>
        )}
      </button>

      {/* Expanded Detail Section */}
      {isExpanded && (
        <div
          style={{
            padding: theme.spacing.md,
            borderTop: `1px solid ${theme.colors.border.primary}`,
            backgroundColor: theme.colors.background.tertiary,
          }}
        >
          {/* IDP Breakdown with Players */}
          {idpBreakdown.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {idpBreakdown.map((item, idx) => {
                const players = Array.isArray(item.players) ? item.players : []

                // Get urgency color for each label
                const getUrgencyColor = (label: string) => {
                  switch (label) {
                    case 'Underdeveloped':
                      return theme.colors.status.error
                    case 'Due for Training':
                      return theme.colors.status.warning
                    default:
                      return theme.colors.status.success
                  }
                }

                return (
                  <div
                    key={item.attribute_key || idx}
                    style={{
                      backgroundColor: theme.colors.background.primary,
                      borderRadius: theme.borderRadius.md,
                      padding: theme.spacing.md,
                      border: `1px solid ${theme.colors.border.primary}`,
                    }}
                  >
                    {/* Attribute Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.sm,
                        marginBottom: theme.spacing.xs,
                      }}
                    >
                      {/* Urgency Dot */}
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: getPriorityColor(item.idp_score ?? 0),
                          flexShrink: 0,
                        }}
                      />
                      {/* Attribute Name */}
                      <span
                        style={{
                          flex: 1,
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.semibold,
                          color: theme.colors.text.primary,
                        }}
                      >
                        {item.attribute_name || item.attribute_key}
                      </span>
                      {/* Relevance Badge */}
                      <span
                        style={{
                          fontSize: theme.typography.fontSize.xs,
                          color: (item.relevance ?? 0) >= 1 ? theme.colors.status.success : theme.colors.status.warning,
                          padding: `2px ${theme.spacing.sm}`,
                          backgroundColor: (item.relevance ?? 0) >= 1
                            ? `${theme.colors.status.success}20`
                            : `${theme.colors.status.warning}20`,
                          borderRadius: theme.borderRadius.full,
                          fontWeight: theme.typography.fontWeight.medium,
                        }}
                      >
                        {(item.relevance ?? 0) >= 1 ? 'Primary Outcome' : 'Secondary Outcome'}
                      </span>
                    </div>

                    {/* Players who need this IDP - horizontal scrolling cards */}
                    <div
                      style={{
                        display: 'flex',
                        gap: theme.spacing.sm,
                        overflowX: 'auto',
                        paddingBottom: theme.spacing.sm,
                        marginTop: theme.spacing.sm,
                      }}
                    >
                      {players.length > 0 ? (
                        players.map((player, pIdx) => {
                          // Get initials from name (first letter of first and last name)
                          const nameParts = player.name.split(' ')
                          const initials = nameParts.length > 1
                            ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
                            : player.name.substring(0, 2)

                          return (
                            <div
                              key={pIdx}
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: theme.spacing.sm,
                                padding: theme.spacing.sm,
                                backgroundColor: theme.colors.background.tertiary,
                                borderRadius: theme.borderRadius.md,
                                border: `1px solid ${theme.colors.border.primary}`,
                                flexShrink: 0,
                              }}
                            >
                              {/* Initial avatar */}
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  backgroundColor: theme.colors.border.primary,
                                  color: theme.colors.text.primary,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: theme.typography.fontSize.xs,
                                  fontWeight: theme.typography.fontWeight.bold,
                                  textTransform: 'uppercase',
                                  flexShrink: 0,
                                }}
                              >
                                {initials}
                              </div>
                              {/* Text container */}
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                  gap: '2px',
                                }}
                              >
                                {/* Player name */}
                                <span
                                  style={{
                                    fontSize: theme.typography.fontSize.sm,
                                    color: theme.colors.text.primary,
                                    fontWeight: theme.typography.fontWeight.medium,
                                    whiteSpace: 'nowrap',
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {player.name}
                                </span>
                                {/* Urgency label */}
                                <span
                                  style={{
                                    fontSize: theme.typography.fontSize.xs,
                                    color: getUrgencyColor(player.urgency_label),
                                    fontWeight: theme.typography.fontWeight.medium,
                                    whiteSpace: 'nowrap',
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {player.urgency_label}
                                </span>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <span
                          style={{
                            fontSize: theme.typography.fontSize.xs,
                            color: theme.colors.text.muted,
                          }}
                        >
                          No players assigned
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
