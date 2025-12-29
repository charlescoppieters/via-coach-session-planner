'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FaUndo } from 'react-icons/fa'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import { useAuth } from '@/contexts/AuthContext'
import { useTeam } from '@/contexts/TeamContext'
import {
  getTeamTrainingSyllabus,
  getClubTrainingSyllabus,
  saveTeamTrainingSyllabus,
  revertTeamTrainingSyllabus,
  createDefaultSyllabus,
  getTeamGameModelZones,
  getClubGameModelZones,
  type TrainingSyllabus,
  type SyllabusDay,
  type SyllabusWeek,
} from '@/lib/methodology'
import type { GameModelZones } from '@/types/database'
import { WeeklyCalendar } from '@/components/methodology/syllabus/WeeklyCalendar'
import { DayEditModal } from '@/components/methodology/syllabus/DayEditModal'

export default function TeamTrainingSyllabusPage() {
  const { club, coach } = useAuth()
  const { selectedTeamId } = useTeam()
  const [syllabus, setSyllabus] = useState<TrainingSyllabus | null>(null)
  const [zones, setZones] = useState<GameModelZones | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // Day edit state
  const [editingDay, setEditingDay] = useState<{ weekId: string; dayOfWeek: number } | null>(null)

  // Revert confirmation
  const [showRevertConfirm, setShowRevertConfirm] = useState(false)

  // Fetch syllabus and zones
  const fetchData = useCallback(async () => {
    if (!club?.id || !selectedTeamId || !coach?.id) return

    setIsLoading(true)
    setError('')

    // Fetch team syllabus and zones
    const [syllabusResult, zonesResult] = await Promise.all([
      getTeamTrainingSyllabus(club.id, selectedTeamId),
      getTeamGameModelZones(club.id, selectedTeamId),
    ])

    // Handle zones - fall back to club zones if no team zones
    let currentZones: GameModelZones | null = null
    if (zonesResult.error) {
      console.error('Error fetching team zones:', zonesResult.error)
      const clubZonesResult = await getClubGameModelZones(club.id)
      if (!clubZonesResult.error) {
        currentZones = clubZonesResult.data
      }
    } else if (!zonesResult.data) {
      const clubZonesResult = await getClubGameModelZones(club.id)
      if (!clubZonesResult.error) {
        currentZones = clubZonesResult.data
      }
    } else {
      currentZones = zonesResult.data
    }
    setZones(currentZones)

    // Handle syllabus - auto-create if none exists and zones are configured
    if (syllabusResult.error) {
      setError(syllabusResult.error)
    } else if (!syllabusResult.data && currentZones && currentZones.zones.length > 0) {
      // Auto-create syllabus (inherit from club or create default)
      const { data: clubSyllabus } = await getClubTrainingSyllabus(club.id)
      const newSyllabus = clubSyllabus || createDefaultSyllabus()
      const { error: saveError } = await saveTeamTrainingSyllabus(club.id, selectedTeamId, coach.id, newSyllabus)
      if (saveError) {
        setError(saveError)
      } else {
        setSyllabus(newSyllabus)
      }
    } else {
      setSyllabus(syllabusResult.data)
    }

    setIsLoading(false)
  }, [club?.id, selectedTeamId, coach?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Revert to club syllabus
  const handleRevertToClub = async () => {
    if (!club?.id || !selectedTeamId) return

    setIsSaving(true)
    setError('')
    setShowRevertConfirm(false)

    const { error } = await revertTeamTrainingSyllabus(selectedTeamId, club.id)

    if (error) {
      setError(error)
    } else {
      // Refresh data
      await fetchData()
    }

    setIsSaving(false)
  }

  // Add a week
  const handleAddWeek = async () => {
    if (!club?.id || !coach?.id || !selectedTeamId || !syllabus) return

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

    const { error } = await saveTeamTrainingSyllabus(
      club.id,
      selectedTeamId,
      coach.id,
      updatedSyllabus
    )

    if (error) {
      setError(error)
    } else {
      setSyllabus(updatedSyllabus)
    }

    setIsSaving(false)
  }

  // Remove a week
  const handleRemoveWeek = async (weekId: string) => {
    if (!club?.id || !coach?.id || !selectedTeamId || !syllabus || syllabus.weeks.length <= 1)
      return

    setIsSaving(true)
    setError('')

    const updatedWeeks = syllabus.weeks
      .filter((w) => w.id !== weekId)
      .map((w, index) => ({ ...w, order: index + 1 }))

    const updatedSyllabus: TrainingSyllabus = {
      ...syllabus,
      weeks: updatedWeeks,
    }

    const { error } = await saveTeamTrainingSyllabus(
      club.id,
      selectedTeamId,
      coach.id,
      updatedSyllabus
    )

    if (error) {
      setError(error)
    } else {
      setSyllabus(updatedSyllabus)
    }

    setIsSaving(false)
  }

  // Reorder weeks
  const handleReorderWeeks = async (reorderedWeeks: SyllabusWeek[]) => {
    if (!club?.id || !coach?.id || !selectedTeamId || !syllabus) return

    const previousSyllabus = syllabus
    const updatedSyllabus: TrainingSyllabus = {
      ...syllabus,
      weeks: reorderedWeeks,
    }

    // Optimistic update
    setSyllabus(updatedSyllabus)
    setIsSaving(true)
    setError('')

    const { error } = await saveTeamTrainingSyllabus(
      club.id,
      selectedTeamId,
      coach.id,
      updatedSyllabus
    )

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
    if (!club?.id || !coach?.id || !selectedTeamId || !syllabus || !editingDay) return

    setIsSaving(true)
    setError('')

    const updatedSyllabus: TrainingSyllabus = {
      ...syllabus,
      weeks: syllabus.weeks.map((week) => {
        if (week.id !== editingDay.weekId) return week

        const existingDayIndex = week.days.findIndex((d) => d.dayOfWeek === updatedDay.dayOfWeek)
        const updatedDays =
          existingDayIndex >= 0
            ? week.days.map((d, i) => (i === existingDayIndex ? updatedDay : d))
            : [...week.days, updatedDay]

        return { ...week, days: updatedDays }
      }),
    }

    const { error } = await saveTeamTrainingSyllabus(
      club.id,
      selectedTeamId,
      coach.id,
      updatedSyllabus
    )

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
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: theme.spacing.xl,
        }}
      >
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

        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.lg }}>
          {/* Saving indicator */}
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

          {/* Revert to Club button */}
          <button
            onClick={() => setShowRevertConfirm(true)}
            disabled={isSaving}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              backgroundColor: 'transparent',
              color: theme.colors.gold.main,
              border: `1px solid ${theme.colors.gold.main}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.sm,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              opacity: isSaving ? 0.5 : 1,
            }}
          >
            <FaUndo size={12} />
            Revert to Club
          </button>
        </div>
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

      {/* Revert Confirmation Modal */}
      {showRevertConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: theme.spacing.lg,
          }}
          onClick={() => !isSaving && setShowRevertConfirm(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              backgroundColor: theme.colors.background.primary,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.xl,
              width: '100%',
              maxWidth: '450px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                marginTop: 0,
                marginBottom: theme.spacing.md,
              }}
            >
              Revert to Club Syllabus
            </h2>
            <p
              style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.xl,
                lineHeight: 1.6,
              }}
            >
              This will replace your team&apos;s training syllabus with the current club syllabus.
              Any team-specific changes will be lost. This cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowRevertConfirm(false)}
                disabled={isSaving}
                style={{
                  padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                  backgroundColor: theme.colors.background.tertiary,
                  color: theme.colors.text.primary,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRevertToClub}
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                }}
              >
                {isSaving && (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-flex' }}
                  >
                    <CgSpinnerAlt size={16} />
                  </motion.span>
                )}
                {isSaving ? 'Reverting...' : 'Revert to Club'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
