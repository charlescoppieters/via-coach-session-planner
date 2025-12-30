'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import { useAuth } from '@/contexts/AuthContext'
import type { Team, SyllabusSlot, SessionThemeSnapshot, TrainingSyllabus } from '@/types/database'
import { SyllabusSlotSelector } from './SyllabusSlotSelector'
import {
  getTeamTrainingSyllabus,
  getSyllabusSlots,
  getNextSyllabusSlot,
  getFirstSyllabusSlot,
  getNextDayOfWeek,
} from '@/lib/methodology'
import { getLatestSyllabusSession } from '@/lib/sessions'

type TabType = 'syllabus' | 'manual'

interface CreateSessionModalProps {
  team: Team
  coachId: string
  onCancel: () => void
  onCreate: (sessionData: {
    coach_id: string
    team_id: string
    title: string
    session_date: string
    player_count: number
    duration: number
    age_group: string
    skill_level: string
    content: string
    // Syllabus fields (optional)
    syllabus_week_index?: number | null
    syllabus_day_of_week?: number | null
    theme_block_id?: string | null
    theme_snapshot?: SessionThemeSnapshot | null
  }) => Promise<void>
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  team,
  coachId,
  onCancel,
  onCreate,
}) => {
  const { club } = useAuth()

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('syllabus')

  // Syllabus data
  const [syllabus, setSyllabus] = useState<TrainingSyllabus | null>(null)
  const [syllabusSlots, setSyllabusSlots] = useState<SyllabusSlot[]>([])
  const [defaultSlotIndex, setDefaultSlotIndex] = useState(0)
  const [isLoadingSyllabus, setIsLoadingSyllabus] = useState(true)

  // Selected slot for syllabus tab
  const [selectedSlot, setSelectedSlot] = useState<SyllabusSlot | null>(null)

  // Form data for syllabus tab
  const [syllabusFormData, setSyllabusFormData] = useState({
    title: '',
    session_date: '', // Date part only (YYYY-MM-DD)
    session_time: '18:00', // Time part only (HH:MM)
    player_count: team.player_count,
    duration: team.session_duration,
  })

  // Form data for manual tab
  const [manualFormData, setManualFormData] = useState({
    title: '',
    session_date: getDefaultDateTime(),
    player_count: team.player_count,
    duration: team.session_duration,
    selectedThemeId: '', // Optional theme selection
  })

  // Get unique themes from syllabus slots for manual tab dropdown
  const availableThemes = React.useMemo(() => {
    const themeMap = new Map<string, SyllabusSlot['theme']>()
    syllabusSlots.forEach((slot) => {
      if (!themeMap.has(slot.theme.blockId)) {
        themeMap.set(slot.theme.blockId, slot.theme)
      }
    })
    return Array.from(themeMap.values())
  }, [syllabusSlots])

  const [isCreating, setIsCreating] = useState(false)

  // Get default datetime for manual tab
  function getDefaultDateTime() {
    const now = new Date()
    now.setHours(18, 0, 0, 0)
    return now.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:MM
  }

  // Format date for input (YYYY-MM-DD)
  function formatDateForInput(date: Date): string {
    return date.toISOString().slice(0, 10)
  }

  // Fetch syllabus and determine default slot
  const fetchSyllabusData = useCallback(async () => {
    if (!club?.id) return

    setIsLoadingSyllabus(true)

    try {
      // Fetch syllabus and latest session in parallel
      const [syllabusResult, latestSessionResult] = await Promise.all([
        getTeamTrainingSyllabus(club.id, team.id),
        getLatestSyllabusSession(team.id),
      ])

      if (syllabusResult.error || !syllabusResult.data) {
        // No syllabus - switch to manual tab
        setActiveTab('manual')
        setIsLoadingSyllabus(false)
        return
      }

      const fetchedSyllabus = syllabusResult.data
      setSyllabus(fetchedSyllabus)

      const slots = getSyllabusSlots(fetchedSyllabus)
      setSyllabusSlots(slots)

      if (slots.length === 0) {
        // No slots with themes - switch to manual tab
        setActiveTab('manual')
        setIsLoadingSyllabus(false)
        return
      }

      // Determine the default slot
      let nextSlot: SyllabusSlot | null = null
      let afterDate: Date = new Date()

      if (latestSessionResult.data) {
        // Found a previous syllabus session
        const latestSession = latestSessionResult.data
        afterDate = new Date(latestSession.session_date)

        if (
          latestSession.syllabus_week_index !== null &&
          latestSession.syllabus_day_of_week !== null
        ) {
          nextSlot = getNextSyllabusSlot(
            fetchedSyllabus,
            latestSession.syllabus_week_index,
            latestSession.syllabus_day_of_week
          )
        }
      }

      // If no next slot found, start from the first slot
      if (!nextSlot) {
        nextSlot = getFirstSyllabusSlot(fetchedSyllabus)
      }

      if (nextSlot) {
        // Find the index of this slot in the slots array
        const slotIndex = slots.findIndex(
          (s) => s.weekIndex === nextSlot!.weekIndex && s.dayOfWeek === nextSlot!.dayOfWeek
        )
        setDefaultSlotIndex(slotIndex >= 0 ? slotIndex : 0)

        // Set the selected slot and form data
        setSelectedSlot(nextSlot)

        // Calculate suggested date
        const suggestedDate = getNextDayOfWeek(afterDate, nextSlot.dayOfWeek)

        setSyllabusFormData((prev) => ({
          ...prev,
          title: nextSlot!.theme.blockName,
          session_date: formatDateForInput(suggestedDate),
        }))
      }
    } catch (error) {
      console.error('Error fetching syllabus data:', error)
      setActiveTab('manual')
    }

    setIsLoadingSyllabus(false)
  }, [club?.id, team.id])

  useEffect(() => {
    fetchSyllabusData()
  }, [fetchSyllabusData])

  // Handle slot selection
  const handleSlotSelect = (slot: SyllabusSlot) => {
    setSelectedSlot(slot)

    // Update title with theme name
    setSyllabusFormData((prev) => ({
      ...prev,
      title: slot.theme.blockName,
    }))

    // Recalculate suggested date based on this slot's day of week
    // Use the current session_date as the "after" date, or today if empty
    const afterDate = syllabusFormData.session_date
      ? new Date(syllabusFormData.session_date)
      : new Date()

    // Go back a day so getNextDayOfWeek can find the correct next occurrence
    afterDate.setDate(afterDate.getDate() - 1)

    const suggestedDate = getNextDayOfWeek(afterDate, slot.dayOfWeek)

    setSyllabusFormData((prev) => ({
      ...prev,
      session_date: formatDateForInput(suggestedDate),
    }))
  }

  // Handle syllabus form submit
  const handleSyllabusSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSlot) {
      alert('Please select a training slot')
      return
    }

    if (!syllabusFormData.session_date || !syllabusFormData.session_time) {
      alert('Please enter date and time')
      return
    }

    setIsCreating(true)
    try {
      // Combine date and time
      const sessionDateTime = `${syllabusFormData.session_date}T${syllabusFormData.session_time}`

      // Create theme snapshot
      const themeSnapshot: SessionThemeSnapshot = {
        zoneName: selectedSlot.theme.zoneName,
        blockType: selectedSlot.theme.blockType,
        blockName: selectedSlot.theme.blockName,
      }

      await onCreate({
        coach_id: coachId,
        team_id: team.id,
        title: syllabusFormData.title,
        session_date: sessionDateTime,
        player_count: syllabusFormData.player_count,
        duration: syllabusFormData.duration,
        age_group: team.age_group,
        skill_level: team.skill_level,
        content: '',
        // Syllabus fields
        syllabus_week_index: selectedSlot.weekIndex,
        syllabus_day_of_week: selectedSlot.dayOfWeek,
        theme_block_id: selectedSlot.theme.blockId,
        theme_snapshot: themeSnapshot,
      })
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Failed to create session')
      setIsCreating(false)
    }
  }

  // Handle manual form submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!manualFormData.title.trim()) {
      alert('Please enter a session title')
      return
    }

    setIsCreating(true)
    try {
      // Find selected theme if any
      const selectedTheme = manualFormData.selectedThemeId
        ? availableThemes.find((t) => t.blockId === manualFormData.selectedThemeId)
        : null

      // Create theme snapshot if theme selected (but no syllabus position)
      const themeSnapshot: SessionThemeSnapshot | null = selectedTheme
        ? {
            zoneName: selectedTheme.zoneName,
            blockType: selectedTheme.blockType,
            blockName: selectedTheme.blockName,
          }
        : null

      await onCreate({
        coach_id: coachId,
        team_id: team.id,
        title: manualFormData.title,
        session_date: manualFormData.session_date,
        player_count: manualFormData.player_count,
        duration: manualFormData.duration,
        age_group: team.age_group,
        skill_level: team.skill_level,
        content: '',
        // No syllabus position for manual sessions (even with theme)
        syllabus_week_index: null,
        syllabus_day_of_week: null,
        // Theme data if selected
        theme_block_id: selectedTheme?.blockId || null,
        theme_snapshot: themeSnapshot,
      })
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Failed to create session')
      setIsCreating(false)
    }
  }

  // Input styles
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.primary,
    border: `2px solid ${theme.colors.border.primary}`,
    borderRadius: theme.borderRadius.md,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
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
        }}
      >
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: theme.colors.background.secondary,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.xl,
            width: '90%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <h2
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              margin: 0,
              marginBottom: theme.spacing.lg,
            }}
          >
            Create Session
          </h2>

          {/* Tab Navigation */}
          <div
            style={{
              display: 'flex',
              gap: theme.spacing.lg,
              marginBottom: theme.spacing.lg,
              borderBottom: `1px solid ${theme.colors.border.primary}`,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('syllabus')}
              disabled={syllabusSlots.length === 0}
              style={{
                padding: `${theme.spacing.sm} 0`,
                paddingBottom: theme.spacing.md,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'syllabus'
                  ? `2px solid ${theme.colors.gold.main}`
                  : '2px solid transparent',
                marginBottom: '-1px',
                color: activeTab === 'syllabus'
                  ? theme.colors.gold.main
                  : theme.colors.text.muted,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                cursor: syllabusSlots.length === 0 ? 'not-allowed' : 'pointer',
                opacity: syllabusSlots.length === 0 ? 0.5 : 1,
                transition: 'all 0.15s ease',
              }}
            >
              From Syllabus
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              style={{
                padding: `${theme.spacing.sm} 0`,
                paddingBottom: theme.spacing.md,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'manual'
                  ? `2px solid ${theme.colors.gold.main}`
                  : '2px solid transparent',
                marginBottom: '-1px',
                color: activeTab === 'manual'
                  ? theme.colors.gold.main
                  : theme.colors.text.muted,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Manual Entry
            </button>
          </div>

          {/* Loading State */}
          {isLoadingSyllabus && activeTab === 'syllabus' && (
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
          )}

          {/* Syllabus Tab Content */}
          {!isLoadingSyllabus && activeTab === 'syllabus' && (
            <form onSubmit={handleSyllabusSubmit}>
              {/* Syllabus Slot Selector */}
              <div style={{ marginBottom: theme.spacing.lg }}>
                <label style={labelStyle}>Select Training Slot</label>
                <SyllabusSlotSelector
                  slots={syllabusSlots}
                  selectedSlot={selectedSlot}
                  onSelectSlot={handleSlotSelect}
                  defaultSlotIndex={defaultSlotIndex}
                />
              </div>

              {/* Selected Theme Info */}
              {selectedSlot && (
                <div
                  style={{
                    padding: theme.spacing.md,
                    backgroundColor: theme.colors.background.tertiary,
                    borderRadius: theme.borderRadius.md,
                    marginBottom: theme.spacing.lg,
                    border: `1px solid ${theme.colors.border.primary}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text.muted,
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    Theme
                  </div>
                  <div
                    style={{
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.text.primary,
                    }}
                  >
                    {selectedSlot.theme.blockName}
                  </div>
                  <div
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      color:
                        selectedSlot.theme.blockType === 'in_possession'
                          ? theme.colors.gold.main
                          : theme.colors.status.error,
                      marginTop: theme.spacing.xs,
                    }}
                  >
                    {selectedSlot.theme.zoneName} •{' '}
                    {selectedSlot.theme.blockType === 'in_possession'
                      ? 'In Possession'
                      : 'Out of Possession'}
                  </div>
                </div>
              )}

              {/* Title Field (auto-filled, editable) */}
              <div style={{ marginBottom: theme.spacing.lg }}>
                <label style={labelStyle}>Session Title</label>
                <input
                  type="text"
                  value={syllabusFormData.title}
                  onChange={(e) =>
                    setSyllabusFormData({ ...syllabusFormData, title: e.target.value })
                  }
                  placeholder="Session title"
                  style={inputStyle}
                />
              </div>

              {/* Date and Time (side by side) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: theme.spacing.md,
                  marginBottom: theme.spacing.lg,
                }}
              >
                <div>
                  <label style={labelStyle}>Date *</label>
                  <input
                    type="date"
                    value={syllabusFormData.session_date}
                    onChange={(e) =>
                      setSyllabusFormData({ ...syllabusFormData, session_date: e.target.value })
                    }
                    required
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Time *</label>
                  <input
                    type="time"
                    value={syllabusFormData.session_time}
                    onChange={(e) =>
                      setSyllabusFormData({ ...syllabusFormData, session_time: e.target.value })
                    }
                    required
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                  />
                </div>
              </div>

              {/* Player Count and Duration (side by side) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: theme.spacing.md,
                  marginBottom: theme.spacing.xl,
                }}
              >
                <div>
                  <label style={labelStyle}>Players *</label>
                  <input
                    type="number"
                    value={syllabusFormData.player_count}
                    onChange={(e) =>
                      setSyllabusFormData({
                        ...syllabusFormData,
                        player_count: parseInt(e.target.value) || 0,
                      })
                    }
                    min="1"
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Duration (min) *</label>
                  <input
                    type="number"
                    value={syllabusFormData.duration}
                    onChange={(e) =>
                      setSyllabusFormData({
                        ...syllabusFormData,
                        duration: parseInt(e.target.value) || 0,
                      })
                    }
                    min="1"
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: theme.spacing.sm,
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isCreating}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                    backgroundColor: theme.colors.background.primary,
                    color: theme.colors.text.primary,
                    border: 'none',
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.semibold,
                    cursor: isCreating ? 'not-allowed' : 'pointer',
                    opacity: isCreating ? 0.6 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !selectedSlot}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                    backgroundColor: theme.colors.gold.main,
                    color: theme.colors.background.primary,
                    border: 'none',
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.semibold,
                    cursor: isCreating || !selectedSlot ? 'not-allowed' : 'pointer',
                    opacity: isCreating || !selectedSlot ? 0.6 : 1,
                  }}
                >
                  {isCreating ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </form>
          )}

          {/* Manual Tab Content */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit}>
              {/* Title Field */}
              <div style={{ marginBottom: theme.spacing.lg }}>
                <label style={labelStyle}>Session Title *</label>
                <input
                  type="text"
                  value={manualFormData.title}
                  onChange={(e) =>
                    setManualFormData({ ...manualFormData, title: e.target.value })
                  }
                  placeholder="e.g., Strength Training Exercise"
                  required
                  autoFocus={activeTab === 'manual'}
                  style={inputStyle}
                />
              </div>

              {/* Theme Selector (optional) */}
              {availableThemes.length > 0 && (
                <div style={{ marginBottom: theme.spacing.lg }}>
                  <label style={labelStyle}>Theme (Optional)</label>
                  <select
                    value={manualFormData.selectedThemeId}
                    onChange={(e) =>
                      setManualFormData({ ...manualFormData, selectedThemeId: e.target.value })
                    }
                    style={{
                      ...inputStyle,
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      paddingRight: '36px',
                    }}
                  >
                    <option value="">No theme</option>
                    {availableThemes.map((t) => (
                      <option key={t.blockId} value={t.blockId}>
                        {t.blockName} ({t.zoneName} - {t.blockType === 'in_possession' ? 'In Poss' : 'Out Poss'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date & Time Field */}
              <div style={{ marginBottom: theme.spacing.lg }}>
                <label style={labelStyle}>Date & Time *</label>
                <input
                  type="datetime-local"
                  value={manualFormData.session_date}
                  onChange={(e) =>
                    setManualFormData({ ...manualFormData, session_date: e.target.value })
                  }
                  required
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                />
              </div>

              {/* Player Count and Duration (side by side) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: theme.spacing.md,
                  marginBottom: theme.spacing.xl,
                }}
              >
                <div>
                  <label style={labelStyle}>Players *</label>
                  <input
                    type="number"
                    value={manualFormData.player_count}
                    onChange={(e) =>
                      setManualFormData({
                        ...manualFormData,
                        player_count: parseInt(e.target.value) || 0,
                      })
                    }
                    min="1"
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Duration (min) *</label>
                  <input
                    type="number"
                    value={manualFormData.duration}
                    onChange={(e) =>
                      setManualFormData({
                        ...manualFormData,
                        duration: parseInt(e.target.value) || 0,
                      })
                    }
                    min="1"
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: theme.spacing.sm,
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isCreating}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                    backgroundColor: theme.colors.background.primary,
                    color: theme.colors.text.primary,
                    border: 'none',
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.semibold,
                    cursor: isCreating ? 'not-allowed' : 'pointer',
                    opacity: isCreating ? 0.6 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                    backgroundColor: theme.colors.gold.main,
                    color: theme.colors.background.primary,
                    border: 'none',
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.semibold,
                    cursor: isCreating ? 'not-allowed' : 'pointer',
                    opacity: isCreating ? 0.6 : 1,
                  }}
                >
                  {isCreating ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </>
  )
}
