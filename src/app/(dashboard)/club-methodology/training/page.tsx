'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import { useAuth } from '@/contexts/AuthContext'
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

export default function ClubTrainingSyllabusPage() {
  const { club, coach } = useAuth()
  const [syllabus, setSyllabus] = useState<TrainingSyllabus | null>(null)
  const [zones, setZones] = useState<GameModelZones | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // Day edit state
  const [editingDay, setEditingDay] = useState<{ weekId: string; dayOfWeek: number } | null>(null)

  // Fetch syllabus and zones
  const fetchData = useCallback(async () => {
    if (!club?.id || !coach?.id) return

    setIsLoading(true)
    setError('')

    const [syllabusResult, zonesResult] = await Promise.all([
      getClubTrainingSyllabus(club.id),
      getClubGameModelZones(club.id),
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
      // Auto-create syllabus
      const newSyllabus = createDefaultSyllabus()
      const { error: saveError } = await saveClubTrainingSyllabus(club.id, coach.id, newSyllabus)
      if (saveError) {
        setError(saveError)
      } else {
        setSyllabus(newSyllabus)
      }
    } else {
      setSyllabus(syllabusResult.data)
    }

    setIsLoading(false)
  }, [club?.id, coach?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Add a week
  const handleAddWeek = async () => {
    if (!club?.id || !coach?.id || !syllabus) return

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

    const { error } = await saveClubTrainingSyllabus(club.id, coach.id, updatedSyllabus)

    if (error) {
      setError(error)
    } else {
      setSyllabus(updatedSyllabus)
    }

    setIsSaving(false)
  }

  // Remove a week
  const handleRemoveWeek = async (weekId: string) => {
    if (!club?.id || !coach?.id || !syllabus || syllabus.weeks.length <= 1) return

    setIsSaving(true)
    setError('')

    const updatedWeeks = syllabus.weeks
      .filter((w) => w.id !== weekId)
      .map((w, index) => ({ ...w, order: index + 1 }))

    const updatedSyllabus: TrainingSyllabus = {
      ...syllabus,
      weeks: updatedWeeks,
    }

    const { error } = await saveClubTrainingSyllabus(club.id, coach.id, updatedSyllabus)

    if (error) {
      setError(error)
    } else {
      setSyllabus(updatedSyllabus)
    }

    setIsSaving(false)
  }

  // Reorder weeks
  const handleReorderWeeks = async (reorderedWeeks: SyllabusWeek[]) => {
    if (!club?.id || !coach?.id || !syllabus) return

    const previousSyllabus = syllabus
    const updatedSyllabus: TrainingSyllabus = {
      ...syllabus,
      weeks: reorderedWeeks,
    }

    // Optimistic update
    setSyllabus(updatedSyllabus)
    setIsSaving(true)
    setError('')

    const { error } = await saveClubTrainingSyllabus(club.id, coach.id, updatedSyllabus)

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

  // Save day changes
  const handleSaveDay = async (updatedDay: SyllabusDay) => {
    if (!club?.id || !coach?.id || !syllabus || !editingDay) return

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

    const { error } = await saveClubTrainingSyllabus(club.id, coach.id, updatedSyllabus)

    if (error) {
      setError(error)
    } else {
      setSyllabus(updatedSyllabus)
      setEditingDay(null)
    }

    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
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

  // No zones configured - show warning
  if (!zones || !zones.zones || zones.zones.length === 0) {
    return (
      <div>
        <h1
          style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.sm,
          }}
        >
          Training Syllabus
        </h1>
        <p
          style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.xl,
          }}
        >
          Plan your weekly training themes based on your Game Model
        </p>

        <div
          style={{
            padding: theme.spacing.xl,
            backgroundColor: theme.colors.background.tertiary,
            borderRadius: theme.borderRadius.lg,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: theme.typography.fontSize.lg,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md,
            }}
          >
            Configure your Game Model first
          </p>
          <p
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
            }}
          >
            The Training Syllabus uses themes from your Game Model zones. Please set up your Game
            Model with in-possession and out-of-possession blocks before creating your syllabus.
          </p>
        </div>
      </div>
    )
  }

  // No syllabus yet (zones not configured) - show message
  if (!syllabus) {
    return (
      <div>
        <h1
          style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.sm,
          }}
        >
          Training Syllabus
        </h1>
        <p
          style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.xl,
          }}
        >
          Plan your weekly training themes based on your Game Model
        </p>

        <div
          style={{
            padding: theme.spacing.xl,
            backgroundColor: theme.colors.background.tertiary,
            borderRadius: theme.borderRadius.lg,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
            }}
          >
            Configure your Game Model to get started with your training syllabus.
          </p>
        </div>
      </div>
    )
  }

  // Syllabus exists - show calendar
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Header - Fixed */}
      <div style={{ flexShrink: 0, marginBottom: theme.spacing.xl, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.sm,
            }}
          >
            Training Syllabus
          </h1>
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

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
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
            }}
          >
            {error}
          </div>
        )}

        {/* Weekly Calendar */}
        <WeeklyCalendar
          syllabus={syllabus}
          onDayClick={handleDayClick}
          onAddWeek={handleAddWeek}
          onRemoveWeek={handleRemoveWeek}
          onReorderWeeks={handleReorderWeeks}
        />
      </div>

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
