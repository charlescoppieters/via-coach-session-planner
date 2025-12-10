'use client'

import React, { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { FaEdit, FaSave, FaUndo } from 'react-icons/fa'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import { useAuth } from '@/contexts/AuthContext'
import { useTeam } from '@/contexts/TeamContext'
import {
  getTeamPlayingMethodologyWithZones,
  saveTeamPlayingMethodologyZones,
  revertTeamPlayingMethodology,
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

export default function MyPlayingMethodologyPage() {
  const { club, coach } = useAuth()
  const { selectedTeamId } = useTeam()
  const [error, setError] = useState('')

  // Zone state
  const [zones, setZones] = useState<PitchZone[]>([])
  const [isEditingZones, setIsEditingZones] = useState(false)
  const [isSavingZones, setIsSavingZones] = useState(false)
  const [pendingZones, setPendingZones] = useState<PitchZone[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Revert modal state
  const [showRevertConfirm, setShowRevertConfirm] = useState(false)
  const [isReverting, setIsReverting] = useState(false)

  // Fetch zones
  const fetchZones = useCallback(async () => {
    if (!club?.id || !selectedTeamId) return

    setIsLoading(true)
    const { data, error } = await getTeamPlayingMethodologyWithZones(club.id, selectedTeamId)
    if (error) {
      console.error('Error fetching zones:', error)
    } else if (data?.zones) {
      setZones(data.zones)
      setPendingZones(data.zones)
    } else {
      setZones([])
      setPendingZones([])
    }
    setIsLoading(false)
  }, [club?.id, selectedTeamId])

  useEffect(() => {
    fetchZones()
  }, [fetchZones])

  // Handle zones change from editor
  const handleZonesChange = useCallback((newZones: PitchZone[]) => {
    setPendingZones(newZones)
  }, [])

  // Save zones
  const handleSaveZones = async () => {
    if (!club?.id || !coach?.id || !selectedTeamId) return

    setIsSavingZones(true)
    setError('')
    const { error } = await saveTeamPlayingMethodologyZones(club.id, selectedTeamId, coach.id, pendingZones)

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

  // Handle revert
  const handleRevert = async () => {
    if (!club?.id || !selectedTeamId) return

    setIsReverting(true)
    setError('')
    const { error } = await revertTeamPlayingMethodology(selectedTeamId, club.id)

    if (error) {
      setError(error)
    } else {
      await fetchZones() // Refresh data
    }

    setIsReverting(false)
    setShowRevertConfirm(false)
  }

  if (isLoading) {
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
            <>
              <button
                onClick={() => setShowRevertConfirm(true)}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  backgroundColor: 'transparent',
                  color: theme.colors.text.primary,
                  border: `1px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.sm,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  whiteSpace: 'nowrap',
                }}
              >
                <FaUndo size={12} />
                Revert to Club Default
              </button>
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
                  whiteSpace: 'nowrap',
                }}
              >
                <FaEdit size={12} />
                Edit Zones
              </button>
            </>
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
          No zones have been defined yet. Click &quot;Edit Zones&quot; to start drawing tactical zones on the pitch.
        </p>
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
          onClick={() => !isReverting && setShowRevertConfirm(false)}
        >
          <div
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
                marginBottom: theme.spacing.md,
              }}
            >
              Revert to Club Playing Methodology
            </h2>
            <p
              style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.xl,
                lineHeight: 1.6,
              }}
            >
              This will replace all team customizations with the current club methodology.
              This cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowRevertConfirm(false)}
                disabled={isReverting}
                style={{
                  padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                  backgroundColor: theme.colors.background.tertiary,
                  color: theme.colors.text.primary,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  cursor: isReverting ? 'not-allowed' : 'pointer',
                  opacity: isReverting ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRevert}
                disabled={isReverting}
                style={{
                  padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                  backgroundColor: theme.colors.status.error,
                  color: theme.colors.text.primary,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  cursor: isReverting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                }}
              >
                {isReverting && (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-flex' }}
                  >
                    <CgSpinnerAlt size={16} />
                  </motion.span>
                )}
                {isReverting ? 'Reverting...' : 'Revert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
