'use client'

import React, { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { FaEdit, FaSave } from 'react-icons/fa'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import { useAuth } from '@/contexts/AuthContext'
import {
  getPlayingMethodologyWithZones,
  savePlayingMethodologyZones,
  type PitchZone,
} from '@/lib/methodology'

// Dynamic import for ZonePitchEditor to prevent SSR issues with Konva
const ZonePitchEditor = dynamic(
  () => import('@/components/methodology/ZonePitchEditor').then(mod => mod.ZonePitchEditor),
  { ssr: false, loading: () => (
    <div style={{
      height: '400px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.lg,
    }}>
      <CgSpinnerAlt size={32} color={theme.colors.gold.main} className="animate-spin" />
    </div>
  )}
)

export default function PlayingMethodologyPage() {
  const { club, coach } = useAuth()
  const [error, setError] = useState('')

  // Zone state
  const [zones, setZones] = useState<PitchZone[]>([])
  const [isEditingZones, setIsEditingZones] = useState(false)
  const [isSavingZones, setIsSavingZones] = useState(false)
  const [pendingZones, setPendingZones] = useState<PitchZone[]>([])
  const [isLoadingZones, setIsLoadingZones] = useState(true)

  // Fetch zones
  const fetchZones = useCallback(async () => {
    if (!club?.id) return

    setIsLoadingZones(true)
    const { data, error } = await getPlayingMethodologyWithZones(club.id)
    if (error) {
      console.error('Error fetching zones:', error)
    } else if (data?.zones) {
      setZones(data.zones)
      setPendingZones(data.zones)
    }
    setIsLoadingZones(false)
  }, [club?.id])

  useEffect(() => {
    fetchZones()
  }, [fetchZones])

  // Handle zones change from editor
  const handleZonesChange = useCallback((newZones: PitchZone[]) => {
    setPendingZones(newZones)
  }, [])

  // Save zones
  const handleSaveZones = async () => {
    if (!club?.id || !coach?.id) return

    setIsSavingZones(true)
    const { error } = await savePlayingMethodologyZones(club.id, coach.id, pendingZones)

    if (error) {
      setError(error)
    } else {
      setZones(pendingZones)
      setIsEditingZones(false)
    }
    setIsSavingZones(false)
  }

  // Cancel zone editing
  const handleCancelZoneEdit = () => {
    setPendingZones(zones)
    setIsEditingZones(false)
  }

  if (isLoadingZones) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
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

  return (
    <div>
      {/* Header */}
      <div
        style={{
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
            Playing Methodology
          </h1>
          <p
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
            }}
          >
            {isEditingZones
              ? 'Click and drag to draw zones. Click a zone to edit it.'
              : 'Define tactical zones on the pitch with descriptions and objectives'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: theme.spacing.sm }}>
          {isEditingZones ? (
            <>
              <button
                onClick={handleCancelZoneEdit}
                disabled={isSavingZones}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  backgroundColor: 'transparent',
                  color: theme.colors.text.secondary,
                  border: `1px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.sm,
                  cursor: isSavingZones ? 'not-allowed' : 'pointer',
                  opacity: isSavingZones ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveZones}
                disabled={isSavingZones}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  backgroundColor: theme.colors.gold.main,
                  color: theme.colors.background.primary,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                  cursor: isSavingZones ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                }}
              >
                {isSavingZones ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      style={{ display: 'inline-flex' }}
                    >
                      <CgSpinnerAlt size={14} />
                    </motion.span>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave size={12} />
                    Save Zones
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditingZones(true)}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                backgroundColor: theme.colors.gold.main,
                color: theme.colors.background.primary,
                border: `1px solid ${theme.colors.gold.main}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.semibold,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
              }}
            >
              <FaEdit size={12} />
              Edit Zones
            </button>
          )}
        </div>
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

      {/* Zone Pitch Editor */}
      <ZonePitchEditor
        initialZones={isEditingZones ? pendingZones : zones}
        onZonesChange={handleZonesChange}
        readOnly={!isEditingZones}
      />

      {/* Empty state hint */}
      {zones.length === 0 && !isEditingZones && (
        <p
          style={{
            textAlign: 'center',
            color: theme.colors.text.muted,
            fontSize: theme.typography.fontSize.sm,
            marginTop: theme.spacing.md,
          }}
        >
          Click &quot;Edit Zones&quot; to start drawing tactical zones on the pitch.
        </p>
      )}
    </div>
  )
}
