'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import { createClient } from '@/lib/supabase/client'

interface PlayerFeedbackNote {
  id: string
  note: string
  session_id: string
  session_title: string
  session_date: string
  created_at: string
}

interface PlayerFeedbackTabProps {
  playerId: string
  attributeNames: Record<string, string>
}

export function PlayerFeedbackTab({ playerId }: PlayerFeedbackTabProps) {
  const [feedbackNotes, setFeedbackNotes] = useState<PlayerFeedbackNote[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchFeedback = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

    // Fetch player feedback notes with session details
    const { data, error } = await supabase
      .from('player_feedback_notes')
      .select(`
        id,
        note,
        session_feedback:session_feedback_id (
          session_id,
          sessions:session_id (
            id,
            title,
            session_date
          )
        ),
        created_at
      `)
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching player feedback:', error)
    } else if (data) {
      // Transform the data to flatten the nested structure
      const notes: PlayerFeedbackNote[] = data
        .filter((item) => item.session_feedback && item.note)
        .map((item) => {
          const sessionFeedback = item.session_feedback as unknown as {
            session_id: string
            sessions: { id: string; title: string; session_date: string }
          }
          return {
            id: item.id,
            note: item.note,
            session_id: sessionFeedback?.sessions?.id || '',
            session_title: sessionFeedback?.sessions?.title || 'Unknown Session',
            session_date: sessionFeedback?.sessions?.session_date || '',
            created_at: item.created_at,
          }
        })
        .filter((note) => note.session_id) // Only include notes with valid sessions

      setFeedbackNotes(notes)
    }

    setIsLoading(false)
  }, [playerId])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.xl,
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <CgSpinnerAlt size={32} color={theme.colors.gold.main} />
        </motion.div>
      </div>
    )
  }

  if (feedbackNotes.length === 0) {
    return (
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
        <p style={{ marginBottom: theme.spacing.sm }}>
          No feedback recorded for this player yet.
        </p>
        <p style={{ fontSize: theme.typography.fontSize.sm }}>
          Player-specific feedback can be added after sessions via the session feedback form.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <div
        style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
        }}
      >
        Coach feedback specific to this player from {feedbackNotes.length} session{feedbackNotes.length !== 1 ? 's' : ''}
      </div>

      {/* Feedback List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        {feedbackNotes.map((feedback) => (
          <div
            key={feedback.id}
            style={{
              backgroundColor: theme.colors.background.secondary,
              border: `1px solid ${theme.colors.border.primary}`,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.lg,
              borderLeft: `3px solid ${theme.colors.gold.main}`,
            }}
          >
            {/* Session Info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: theme.spacing.md,
              }}
            >
              <div
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text.primary,
                }}
              >
                {feedback.session_title}
              </div>
              <div
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.secondary,
                }}
              >
                {formatDate(feedback.session_date)}
              </div>
            </div>

            {/* Feedback Note */}
            <div
              style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.secondary,
                lineHeight: 1.6,
                fontStyle: 'italic',
              }}
            >
              "{feedback.note}"
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
