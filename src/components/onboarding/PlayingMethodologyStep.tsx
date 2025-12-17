'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import {
  saveClubPlayingMethodologyZones,
  createDefaultZones,
  type PlayingMethodologyZones,
  type PlayingZone,
} from '@/lib/methodology'
import { ZonePitchDisplay } from '@/components/methodology/ZonePitchDisplay'
import { ZoneCountSelector } from '@/components/methodology/ZoneCountSelector'
import { ZoneEditModal } from '@/components/methodology/ZoneEditModal'
import { ZoneCard } from '@/components/methodology/ZoneCard'

interface PlayingMethodologyStepProps {
  clubId: string
  coachId: string
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

export const PlayingMethodologyStep: React.FC<PlayingMethodologyStepProps> = ({
  clubId,
  coachId,
  onNext,
  onBack,
  onSkip,
}) => {
  const [zones, setZones] = useState<PlayingMethodologyZones | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [editingZone, setEditingZone] = useState<PlayingZone | null>(null)

  // Handle zone count selection
  const handleZoneCountSelect = (count: 3 | 4) => {
    const newZones = createDefaultZones(count)
    setZones(newZones)
  }

  // Handle zone click on pitch
  const handleZoneClick = (zone: PlayingZone) => {
    setSelectedZoneId(zone.id)
  }

  // Handle zone edit
  const handleEditZone = (zone: PlayingZone) => {
    setEditingZone(zone)
  }

  // Handle zone save (local update)
  const handleSaveZone = (updatedZone: PlayingZone) => {
    if (!zones) return

    const updatedZones: PlayingMethodologyZones = {
      ...zones,
      zones: zones.zones.map((z) => (z.id === updatedZone.id ? updatedZone : z)),
    }

    setZones(updatedZones)
    setEditingZone(null)
  }

  // Handle change zone count
  const handleChangeZoneCount = () => {
    setZones(null)
    setSelectedZoneId(null)
  }

  // Handle next (save and proceed)
  const handleNext = async () => {
    if (!zones) {
      // If no zones configured, just proceed (treat as skip)
      onNext()
      return
    }

    setIsSaving(true)
    setError('')

    const { error: saveError } = await saveClubPlayingMethodologyZones(clubId, coachId, zones)

    if (saveError) {
      setError(saveError)
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    onNext()
  }

  // Get zone number from zone
  const getZoneNumber = (zone: PlayingZone): number => {
    return zone.order
  }

  // Show zone count selector if no zones configured yet
  if (!zones) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: theme.spacing.xl,
          maxWidth: '900px',
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
          Playing Methodology
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
          Define tactical zones on the pitch that represent your club&apos;s style of play.
          Each zone has in-possession and out-of-possession instructions.
        </p>

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
              marginTop: theme.spacing.lg,
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        {/* Zone Count Selector */}
        <div style={{ marginTop: theme.spacing.lg }}>
          <ZoneCountSelector onSelect={handleZoneCountSelect} disabled={isSaving} />
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

  // Zones configured - show pitch and zone cards
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: theme.spacing.xl,
        maxWidth: '1100px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: theme.spacing.lg,
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
            Playing Methodology ({zones.zone_count} Zones)
          </h2>
          <p
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
            }}
          >
            Click a zone to edit its in-possession and out-of-possession details
          </p>
        </div>
        <button
          onClick={handleChangeZoneCount}
          disabled={isSaving}
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            backgroundColor: 'transparent',
            color: theme.colors.text.secondary,
            border: `1px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.sm,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Change Zone Count
        </button>
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
          }}
        >
          {error}
        </div>
      )}

      {/* Main content */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: theme.spacing.lg,
          alignItems: 'start',
        }}
      >
        {/* Pitch Display */}
        <ZonePitchDisplay
          zones={zones}
          selectedZoneId={selectedZoneId}
          onZoneClick={handleZoneClick}
          height={400}
        />

        {/* Zone Cards - aligned with pitch zones */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: 360, // Zone area height: pitchHeight (400) - 2 * SVG padding (20)
            marginTop: `calc(${theme.spacing.md} + 20px)`, // Align with zone start: wrapper padding + SVG padding
          }}
        >
          {[...zones.zones].reverse().map((zone) => (
            <div
              key={zone.id}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div style={{ width: '100%' }}>
                <ZoneCard
                  zone={zone}
                  zoneNumber={getZoneNumber(zone)}
                  totalZones={zones.zone_count}
                  isSelected={zone.id === selectedZoneId}
                  onSelect={() => setSelectedZoneId(zone.id)}
                  onEdit={() => handleEditZone(zone)}
                />
              </div>
            </div>
          ))}
        </div>
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
          onClick={handleChangeZoneCount}
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
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
          }}
        >
          {isSaving ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-flex' }}
              >
                <CgSpinnerAlt size={16} />
              </motion.span>
              Saving...
            </>
          ) : (
            'Next'
          )}
        </button>
      </div>

      {/* Zone Edit Modal */}
      {editingZone && (
        <ZoneEditModal
          zone={editingZone}
          zoneNumber={getZoneNumber(editingZone)}
          totalZones={zones.zone_count}
          onSave={handleSaveZone}
          onClose={() => setEditingZone(null)}
          isSaving={false}
        />
      )}
    </div>
  )
}
