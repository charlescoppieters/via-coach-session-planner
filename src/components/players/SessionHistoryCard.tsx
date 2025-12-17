'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaChevronDown, FaCheck, FaTimes } from 'react-icons/fa'
import { theme } from '@/styles/theme'
import type { PlayerSessionDetail, SessionBlockAttribute } from '@/types/database'

interface SessionHistoryCardProps {
  session: PlayerSessionDetail
  attributeNames: Record<string, string> // Map of attribute_key to display name
}

export const SessionHistoryCard: React.FC<SessionHistoryCardProps> = ({
  session,
  attributeNames,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const isPresent = session.attendance_status === 'present'

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} mins`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) {
      return `${hours}h`
    }
    return `${hours}h ${mins}m`
  }

  const getAttributeName = (key: string) => {
    return attributeNames[key] || key
  }

  // Count first and second order IDP opportunities across all blocks
  const firstOrderCount = session.blocks.reduce(
    (sum, block) => sum + block.first_order_outcomes.filter((o) => o.is_player_idp).length,
    0
  )
  const secondOrderCount = session.blocks.reduce(
    (sum, block) => sum + block.second_order_outcomes.filter((o) => o.is_player_idp).length,
    0
  )
  const hasIdpOpportunities = firstOrderCount > 0 || secondOrderCount > 0

  const hasContent =
    session.team_feedback ||
    session.player_note ||
    hasIdpOpportunities

  // Render a single attribute badge
  const AttributeBadge: React.FC<{
    attr: SessionBlockAttribute
    orderType: 'first' | 'second'
  }> = ({ attr, orderType }) => {
    if (!attr.is_player_idp) return null

    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
          backgroundColor:
            orderType === 'first'
              ? 'rgba(34, 197, 94, 0.15)'
              : 'rgba(212, 175, 55, 0.15)',
          borderRadius: theme.borderRadius.sm,
          fontSize: theme.typography.fontSize.xs,
          color:
            orderType === 'first'
              ? theme.colors.status.success
              : theme.colors.gold.main,
          fontWeight: theme.typography.fontWeight.medium,
        }}
      >
        {attr.name}
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor: theme.colors.background.secondary,
        border: `1px solid ${theme.colors.border.primary}`,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
      }}
    >
      {/* Header - Clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: theme.spacing.md,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          {/* Attendance Icon */}
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: isPresent
                ? 'rgba(34, 197, 94, 0.2)'
                : 'rgba(239, 68, 68, 0.2)',
              color: isPresent
                ? theme.colors.status.success
                : theme.colors.status.error,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {isPresent ? <FaCheck size={12} /> : <FaTimes size={12} />}
          </div>

          <div>
            <div
              style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text.primary,
              }}
            >
              {session.title}
            </div>
            <div
              style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.secondary,
                marginTop: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
              }}
            >
              <span>{formatDate(session.session_date)}</span>
              <span>·</span>
              <span>{formatDuration(session.duration)}</span>
              {!isPresent && (
                <>
                  <span>·</span>
                  <span style={{ color: theme.colors.status.error }}>Missed</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          {/* IDP opportunities count */}
          {hasIdpOpportunities && isPresent && (
            <div
              style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.secondary,
                backgroundColor: theme.colors.background.tertiary,
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                borderRadius: theme.borderRadius.sm,
              }}
            >
              {firstOrderCount > 0 && (
                <span style={{ color: theme.colors.status.success }}>{firstOrderCount} first order</span>
              )}
              {firstOrderCount > 0 && secondOrderCount > 0 && ' & '}
              {secondOrderCount > 0 && (
                <span style={{ color: theme.colors.gold.main }}>{secondOrderCount} second order</span>
              )}
              {' '}IDP opportunities
            </div>
          )}

          {/* Chevron */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <FaChevronDown size={14} color={theme.colors.text.secondary} />
          </motion.div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: theme.spacing.md,
                paddingTop: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.md,
              }}
            >
              {/* Blocks Horizontal Scroll */}
              {session.blocks.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.text.primary,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    Training Blocks
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: theme.spacing.sm,
                      overflowX: 'auto',
                      paddingBottom: theme.spacing.sm,
                      WebkitOverflowScrolling: 'touch',
                    }}
                  >
                    {session.blocks.map((block) => {
                      const playerFirstOrder = block.first_order_outcomes.filter(
                        (o) => o.is_player_idp
                      )
                      const playerSecondOrder = block.second_order_outcomes.filter(
                        (o) => o.is_player_idp
                      )
                      const hasPlayerOutcomes =
                        playerFirstOrder.length > 0 || playerSecondOrder.length > 0

                      return (
                        <div
                          key={block.block_id}
                          style={{
                            minWidth: '200px',
                            maxWidth: '280px',
                            flexShrink: 0,
                            backgroundColor: hasPlayerOutcomes
                              ? theme.colors.background.primary
                              : theme.colors.background.tertiary,
                            borderRadius: theme.borderRadius.md,
                            padding: theme.spacing.md,
                            border: hasPlayerOutcomes
                              ? `1px solid ${theme.colors.gold.main}40`
                              : `1px solid ${theme.colors.border.primary}`,
                          }}
                        >
                          <div
                            style={{
                              fontSize: theme.typography.fontSize.sm,
                              fontWeight: theme.typography.fontWeight.medium,
                              color: theme.colors.text.primary,
                              marginBottom: theme.spacing.sm,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {block.block_title}
                          </div>

                          {/* First Order Outcomes */}
                          {playerFirstOrder.length > 0 && (
                            <div style={{ marginBottom: theme.spacing.xs }}>
                              <div
                                style={{
                                  fontSize: '10px',
                                  color: theme.colors.text.muted,
                                  marginBottom: '4px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  opacity: 0.6,
                                }}
                              >
                                First Order Outcome
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '4px',
                                }}
                              >
                                {playerFirstOrder.map((attr) => (
                                  <AttributeBadge
                                    key={attr.key}
                                    attr={attr}
                                    orderType="first"
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Second Order Outcomes */}
                          {playerSecondOrder.length > 0 && (
                            <div>
                              <div
                                style={{
                                  fontSize: '10px',
                                  color: theme.colors.text.muted,
                                  marginBottom: '4px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  opacity: 0.6,
                                }}
                              >
                                Second Order Outcome
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '4px',
                                }}
                              >
                                {playerSecondOrder.map((attr) => (
                                  <AttributeBadge
                                    key={attr.key}
                                    attr={attr}
                                    orderType="second"
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* No player outcomes */}
                          {!hasPlayerOutcomes && (
                            <div
                              style={{
                                fontSize: theme.typography.fontSize.xs,
                                color: theme.colors.text.muted,
                                fontStyle: 'italic',
                              }}
                            >
                              No IDP outcomes
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Team Feedback */}
              {session.team_feedback && (
                <div
                  style={{
                    backgroundColor: theme.colors.background.primary,
                    borderRadius: theme.borderRadius.md,
                    padding: theme.spacing.md,
                  }}
                >
                  <div
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.text.primary,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    Team Feedback
                  </div>
                  <div
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text.secondary,
                      lineHeight: 1.5,
                    }}
                  >
                    {session.team_feedback}
                  </div>
                </div>
              )}

              {/* Player Specific Feedback */}
              {session.player_note && (
                <div
                  style={{
                    backgroundColor: theme.colors.background.primary,
                    borderRadius: theme.borderRadius.md,
                    padding: theme.spacing.md,
                    borderLeft: `3px solid ${theme.colors.gold.main}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.text.primary,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    Player Specific Feedback
                  </div>
                  <div
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text.secondary,
                      fontStyle: 'italic',
                      lineHeight: 1.5,
                    }}
                  >
                    "{session.player_note}"
                  </div>
                </div>
              )}

              {/* No Content Message */}
              {!hasContent && session.blocks.length === 0 && (
                <div
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.muted,
                    fontStyle: 'italic',
                    padding: theme.spacing.md,
                    textAlign: 'center',
                  }}
                >
                  No feedback or training data for this session
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
