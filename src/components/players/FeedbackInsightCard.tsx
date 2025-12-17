'use client'

import React from 'react'
import { FaQuoteLeft, FaExternalLinkAlt } from 'react-icons/fa'
import { theme } from '@/styles/theme'
import type { PlayerFeedbackInsight } from '@/types/database'
import { getSentimentColor } from '@/lib/playerAnalytics'

interface FeedbackInsightCardProps {
  insight: PlayerFeedbackInsight
  showSessionLink?: boolean
}

function SentimentBadge({ sentiment }: { sentiment: string | null }) {
  const color = getSentimentColor(sentiment)
  const label = sentiment
    ? sentiment.charAt(0).toUpperCase() + sentiment.slice(1)
    : 'Unknown'

  return (
    <span
      style={{
        fontSize: theme.typography.fontSize.xs,
        color: color,
        backgroundColor: `${color}20`,
        padding: `2px ${theme.spacing.sm}`,
        borderRadius: theme.borderRadius.full,
        fontWeight: theme.typography.fontWeight.medium,
      }}
    >
      {label}
    </span>
  )
}

export function FeedbackInsightCard({
  insight,
  showSessionLink = true,
}: FeedbackInsightCardProps) {
  const sessionDate = new Date(insight.session_date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      style={{
        backgroundColor: theme.colors.background.secondary,
        border: `1px solid ${theme.colors.border.primary}`,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.sm,
      }}
    >
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: theme.spacing.sm,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          {/* Session Date */}
          <span
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
            }}
          >
            {sessionDate}
          </span>

          {/* Session Link */}
          {showSessionLink && (
            <a
              href={`/sessions/${insight.session_id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.gold.main,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none'
              }}
            >
              {insight.session_title}
              <FaExternalLinkAlt size={10} />
            </a>
          )}
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          {/* Attribute Badge */}
          {insight.attribute_name && (
            <span
              style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.primary,
                backgroundColor: theme.colors.background.tertiary,
                padding: `2px ${theme.spacing.sm}`,
                borderRadius: theme.borderRadius.full,
              }}
            >
              {insight.attribute_name}
            </span>
          )}

          {/* Sentiment Badge */}
          <SentimentBadge sentiment={insight.sentiment} />
        </div>
      </div>

      {/* Quote */}
      {insight.extracted_text && (
        <div
          style={{
            display: 'flex',
            gap: theme.spacing.sm,
            padding: theme.spacing.sm,
            backgroundColor: theme.colors.background.tertiary,
            borderRadius: theme.borderRadius.sm,
            borderLeft: `3px solid ${getSentimentColor(insight.sentiment)}`,
          }}
        >
          <FaQuoteLeft
            size={12}
            style={{
              color: theme.colors.text.secondary,
              opacity: 0.4,
              flexShrink: 0,
              marginTop: '2px',
            }}
          />
          <p
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.primary,
              fontStyle: 'italic',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {insight.extracted_text}
          </p>
        </div>
      )}

      {/* Confidence indicator (subtle) */}
      {insight.confidence !== null && insight.confidence < 0.7 && (
        <span
          style={{
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.text.secondary,
            opacity: 0.6,
          }}
        >
          AI confidence: {Math.round(insight.confidence * 100)}%
        </span>
      )}
    </div>
  )
}
