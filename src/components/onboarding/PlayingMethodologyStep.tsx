'use client'

import React, { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import { savePlayingMethodologyZones, type PitchZone } from '@/lib/methodology'

// Dynamic import for ZonePitchEditor to prevent SSR issues with Konva
const ZonePitchEditor = dynamic(
  () => import('@/components/methodology/ZonePitchEditor').then(mod => mod.ZonePitchEditor),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background.primary,
          borderRadius: theme.borderRadius.lg,
        }}
      >
        <CgSpinnerAlt size={32} color={theme.colors.gold.main} className="animate-spin" />
      </div>
    ),
  }
)

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
  const [zones, setZones] = useState<PitchZone[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const handleZonesChange = useCallback((newZones: PitchZone[]) => {
    setZones(newZones)
  }, [])

  const handleNext = async () => {
    if (zones.length === 0) {
      // If no zones, just proceed (treat as skip)
      onNext()
      return
    }

    setIsSaving(true)
    setError('')

    const { error: saveError } = await savePlayingMethodologyZones(clubId, coachId, zones)

    if (saveError) {
      setError(saveError)
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    onNext()
  }

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
        AI uses these zones to generate sessions and analyze games aligned with your methodology.
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
          }}
        >
          {error}
        </div>
      )}

      {/* Instructions */}
      <p
        style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.muted,
          textAlign: 'center',
          marginTop: theme.spacing.xl,
          marginBottom: theme.spacing.md,
        }}
      >
        Click and drag on the pitch to draw zones. Click a zone to edit its name and description.
      </p>

      {/* Zone Editor */}
      <div style={{ marginTop: theme.spacing.md }}>
        <ZonePitchEditor
          initialZones={zones}
          onZonesChange={handleZonesChange}
          readOnly={false}
        />
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
          Skip
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
