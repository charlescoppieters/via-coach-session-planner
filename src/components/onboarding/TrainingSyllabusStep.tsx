'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import {
  getClubTrainingSyllabus,
  saveClubTrainingSyllabus,
  createDefaultSyllabus,
  getClubGameModelZones,
  type TrainingSyllabus,
  type SyllabusDay,
  type SyllabusWeek,
} from '@/lib/methodology'
import type { GameModelZones } from '@/types/database'
import { WeeklyCalendar } from '@/components/methodology/syllabus/WeeklyCalendar'
import { DayEditModal } from '@/components/methodology/syllabus/DayEditModal'

interface TrainingSyllabusStepProps {
  clubId: string
  coachId: string
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

export const TrainingSyllabusStep: React.FC<TrainingSyllabusStepProps> = ({
  clubId,
  coachId,
  onNext,
  onBack,
  onSkip,
}) => {
  const [syllabus, setSyllabus] = useState<TrainingSyllabus | null>(null)
  const [zones, setZones] = useState<GameModelZones | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // Day edit state
  const [editingDay, setEditingDay] = useState<{ weekId: string; dayOfWeek: number } | null>(null)

  // Fetch syllabus and zones
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError('')

    const [syllabusResult, zonesResult] = await Promise.all([
      getClubTrainingSyllabus(clubId),
      getClubGameModelZones(clubId),
    ])

    // Handle zones
    let currentZones: GameModelZones | null = null
    if (zonesResult.error) {
      console.error('Error fetching zones:', zonesResult.error)
    } else {
      currentZones = zonesResult.data
    }
    setZones(currentZones)

    // Handle syllabus - auto-create if none exists and zones are configured
    if (syllabusResult.error) {
      setError(syllabusResult.error)
    } else if (!syllabusResult.data && currentZones && currentZones.zones.length > 0) {
      // Create default syllabus in state only (NOT saved to DB yet)
      // Will be saved when user clicks "Next"
      const newSyllabus = createDefaultSyllabus()
      setSyllabus(newSyllabus)
    } else {
      setSyllabus(syllabusResult.data)
    }

    setIsLoading(false)
  }, [clubId, coachId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Add a week
  const handleAddWeek = async () => {
    if (!syllabus) return

    setIsSaving(true)
    setError('')

    const newWeek: SyllabusWeek = {
      id: crypto.randomUUID(),
      order: syllabus.weeks.length + 1,
      days: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        dayOfWeek: dayOfWeek as SyllabusDay['dayOfWeek'],
        theme: null,
        comments: null,
      })),
    }

    const updatedSyllabus: TrainingSyllabus = {
      ...syllabus,
      weeks: [...syllabus.weeks, newWeek],
    }

    const { error } = await saveClubTrainingSyllabus(clubId, coachId, updatedSyllabus)

    if (error) {
      setError(error)
    } else {
      setSyllabus(updatedSyllabus)
    }

    setIsSaving(false)
  }

  // Remove a week
  const handleRemoveWeek = async (weekId: string) => {
    if (!syllabus || syllabus.weeks.length <= 1) return

    setIsSaving(true)
    setError('')

    const updatedWeeks = syllabus.weeks
      .filter((w) => w.id !== weekId)
      .map((w, index) => ({ ...w, order: index + 1 }))

    const updatedSyllabus: TrainingSyllabus = {
      ...syllabus,
      weeks: updatedWeeks,
    }

    const { error } = await saveClubTrainingSyllabus(clubId, coachId, updatedSyllabus)

    if (error) {
      setError(error)
    } else {
      setSyllabus(updatedSyllabus)
    }

    setIsSaving(false)
  }

  // Reorder weeks
  const handleReorderWeeks = async (reorderedWeeks: SyllabusWeek[]) => {
    if (!syllabus) return

    const previousSyllabus = syllabus
    const updatedSyllabus: TrainingSyllabus = {
      ...syllabus,
      weeks: reorderedWeeks,
    }

    // Optimistic update
    setSyllabus(updatedSyllabus)
    setIsSaving(true)
    setError('')

    const { error } = await saveClubTrainingSyllabus(clubId, coachId, updatedSyllabus)

    if (error) {
      setError(error)
      setSyllabus(previousSyllabus) // Revert on error
    }

    setIsSaving(false)
  }

  // Handle day click
  const handleDayClick = (weekId: string, dayOfWeek: number) => {
    setEditingDay({ weekId, dayOfWeek })
  }

  // Get day data for editing
  const getEditingDayData = (): SyllabusDay | null => {
    if (!editingDay || !syllabus) return null

    const week = syllabus.weeks.find((w) => w.id === editingDay.weekId)
    if (!week) return null

    return (
      week.days.find((d) => d.dayOfWeek === editingDay.dayOfWeek) || {
        dayOfWeek: editingDay.dayOfWeek as SyllabusDay['dayOfWeek'],
        theme: null,
        comments: null,
      }
    )
  }

  // Get week number for editing
  const getEditingWeekNumber = (): number => {
    if (!editingDay || !syllabus) return 1

    const week = syllabus.weeks.find((w) => w.id === editingDay.weekId)
    return week?.order || 1
  }

  // Handle Next button - save syllabus to DB before proceeding
  const handleNext = async () => {
    if (!syllabus) {
      onNext()
      return
    }

    setIsSaving(true)
    setError('')

    const { error } = await saveClubTrainingSyllabus(clubId, coachId, syllabus)

    if (error) {
      setError(error)
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    onNext()
  }

  // Save day changes
  const handleSaveDay = async (updatedDay: SyllabusDay) => {
    if (!syllabus || !editingDay) return

    setIsSaving(true)
    setError('')

    const updatedSyllabus: TrainingSyllabus = {
      ...syllabus,
      weeks: syllabus.weeks.map((week) => {
        if (week.id !== editingDay.weekId) return week

        // Update or add the day
        const existingDayIndex = week.days.findIndex((d) => d.dayOfWeek === updatedDay.dayOfWeek)
        const updatedDays =
          existingDayIndex >= 0
            ? week.days.map((d, i) => (i === existingDayIndex ? updatedDay : d))
            : [...week.days, updatedDay]

        return { ...week, days: updatedDays }
      }),
    }

    const { error } = await saveClubTrainingSyllabus(clubId, coachId, updatedSyllabus)

    if (error) {
      setError(error)
    } else {
      setSyllabus(updatedSyllabus)
      setEditingDay(null)
    }

    setIsSaving(false)
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
          minHeight: '400px',
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

  // No zones configured - show message to go back or skip
  if (!zones || !zones.zones || zones.zones.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: theme.spacing.xl,
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <h2
          style={{
            fontSize: theme.typography.fontSize['3xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.sm,
            textAlign: 'center',
          }}
        >
          Training Syllabus
        </h2>
        <p
          style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.xl,
            textAlign: 'center',
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto',
            marginTop: theme.spacing.sm,
          }}
        >
          Plan your weekly training themes based on your Game Model zones.
        </p>

        {/* No zones message */}
        <div
          style={{
            padding: theme.spacing.xl,
            backgroundColor: theme.colors.background.primary,
            borderRadius: theme.borderRadius.lg,
            textAlign: 'center',
            marginTop: theme.spacing.xl,
          }}
        >
          <p
            style={{
              fontSize: theme.typography.fontSize.lg,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md,
            }}
          >
            Game Model Required
          </p>
          <p
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
            }}
          >
            The Training Syllabus uses themes from your Game Model zones. Go back to configure your
            Game Model first, or skip this step for now.
          </p>
        </div>

        {/* Navigation Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: theme.spacing.md,
            marginTop: theme.spacing.xl,
          }}
        >
          <button
            onClick={onBack}
            style={{
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              backgroundColor: theme.colors.background.primary,
              color: theme.colors.text.primary,
              border: `2px solid ${theme.colors.border.primary}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              cursor: 'pointer',
              transition: theme.transitions.fast,
            }}
          >
            Back
          </button>

          <button
            onClick={onSkip}
            style={{
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              backgroundColor: 'transparent',
              color: theme.colors.text.secondary,
              border: `1px solid ${theme.colors.border.primary}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.base,
              cursor: 'pointer',
              transition: theme.transitions.fast,
            }}
          >
            Skip for now
          </button>
        </div>

        {/* Skip note */}
        <p
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.muted,
            textAlign: 'center',
            marginTop: theme.spacing.lg,
            fontStyle: 'italic',
          }}
        >
          You can configure this later in Club Methodology
        </p>
      </div>
    )
  }

  // Syllabus view with calendar
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: theme.spacing.xl,
        height: '600px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: theme.spacing.lg,
          flexShrink: 0,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.xs,
            }}
          >
            Training Syllabus
          </h2>
          <p
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
            }}
          >
            Click any day to assign a training theme from your Game Model
          </p>
        </div>
        {isSaving && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              color: theme.colors.text.muted,
              fontSize: theme.typography.fontSize.sm,
            }}
          >
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'inline-flex' }}
            >
              <CgSpinnerAlt size={14} />
            </motion.span>
            Saving...
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: theme.spacing.md,
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            border: `1px solid ${theme.colors.status.error}`,
            borderRadius: theme.borderRadius.md,
            color: theme.colors.status.error,
            marginBottom: theme.spacing.lg,
            flexShrink: 0,
          }}
        >
          {error}
        </div>
      )}

      {/* Weekly Calendar - Scrollable */}
      {syllabus && (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            marginBottom: theme.spacing.lg,
            minHeight: 0,
          }}
        >
          <WeeklyCalendar
            syllabus={syllabus}
            onDayClick={handleDayClick}
            onAddWeek={handleAddWeek}
            onRemoveWeek={handleRemoveWeek}
            onReorderWeeks={handleReorderWeeks}
          />
        </div>
      )}

      {/* Navigation Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: theme.spacing.md,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          disabled={isSaving}
          style={{
            padding: `${theme.spacing.md} ${theme.spacing.xl}`,
            backgroundColor: theme.colors.background.primary,
            color: theme.colors.text.primary,
            border: `2px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            transition: theme.transitions.fast,
            opacity: isSaving ? 0.5 : 1,
          }}
        >
          Back
        </button>

        <button
          onClick={onSkip}
          disabled={isSaving}
          style={{
            padding: `${theme.spacing.md} ${theme.spacing.xl}`,
            backgroundColor: 'transparent',
            color: theme.colors.text.secondary,
            border: `1px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.base,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            transition: theme.transitions.fast,
            opacity: isSaving ? 0.5 : 1,
          }}
        >
          Skip for now
        </button>

        <button
          onClick={handleNext}
          disabled={isSaving}
          style={{
            padding: `${theme.spacing.md} ${theme.spacing.xl}`,
            backgroundColor: theme.colors.gold.main,
            color: theme.colors.background.primary,
            border: 'none',
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            transition: theme.transitions.fast,
          }}
        >
          Next
        </button>
      </div>

      {/* Skip note */}
      <p
        style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.muted,
          textAlign: 'center',
          marginTop: theme.spacing.md,
          flexShrink: 0,
        }}
      >
        You can configure this later in Club Methodology
      </p>

      {/* Day Edit Modal */}
      {editingDay && zones && (
        <DayEditModal
          day={getEditingDayData()!}
          weekNumber={getEditingWeekNumber()}
          zones={zones.zones}
          onSave={handleSaveDay}
          onClose={() => setEditingDay(null)}
          isSaving={isSaving}
        />
      )}
    </div>
  )
}
