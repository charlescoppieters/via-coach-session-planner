'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FaExchangeAlt } from 'react-icons/fa'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import { useAuth } from '@/contexts/AuthContext'
import {
  getClubGameModelZones,
  saveClubGameModelZones,
  createDefaultZones,
  type GameModelZones,
  type GameZone,
  type MatchFormat,
} from '@/lib/methodology'
import { ZonePitchDisplay } from '@/components/methodology/ZonePitchDisplay'
import { ZoneCountSelector } from '@/components/methodology/ZoneCountSelector'
import { ZoneEditModal } from '@/components/methodology/ZoneEditModal'
import { ZoneCard } from '@/components/methodology/ZoneCard'
import { MatchFormatModal } from '@/components/methodology/MatchFormatModal'

export default function ClubGameModelPage() {
  const { club, coach } = useAuth()
  const [error, setError] = useState('')

  // Zone state
  const [zones, setZones] = useState<GameModelZones | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // UI state
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [editingZone, setEditingZone] = useState<GameZone | null>(null)
  const [showChangeZonesConfirm, setShowChangeZonesConfirm] = useState(false)
  const [showMatchFormatModal, setShowMatchFormatModal] = useState(false)

  // Fetch zones
  const fetchZones = useCallback(async () => {
    if (!club?.id) return

    setIsLoading(true)
    const { data, error } = await getClubGameModelZones(club.id)
    if (error) {
      console.error('Error fetching zones:', error)
      setError(error)
    } else {
      setZones(data)
    }
    setIsLoading(false)
  }, [club?.id])

  useEffect(() => {
    fetchZones()
  }, [fetchZones])

  // Handle zone count selection (initial setup)
  const handleZoneCountSelect = async (count: 3 | 4) => {
    if (!club?.id || !coach?.id) return

    setIsSaving(true)
    setError('')

    const newZones = createDefaultZones(count)
    const { error } = await saveClubGameModelZones(club.id, coach.id, newZones)

    if (error) {
      setError(error)
    } else {
      setZones(newZones)
    }

    setIsSaving(false)
  }

  // Handle zone click on pitch
  const handleZoneClick = (zone: GameZone) => {
    setSelectedZoneId(zone.id)
  }

  // Handle zone edit
  const handleEditZone = (zone: GameZone) => {
    setEditingZone(zone)
  }

  // Handle zone save
  const handleSaveZone = async (updatedZone: GameZone) => {
    if (!club?.id || !coach?.id || !zones) return

    setIsSaving(true)
    setError('')

    // Update zones with the edited zone
    const updatedZones: GameModelZones = {
      ...zones,
      zones: zones.zones.map((z) => (z.id === updatedZone.id ? updatedZone : z)),
    }

    const { error } = await saveClubGameModelZones(club.id, coach.id, updatedZones)

    if (error) {
      setError(error)
    } else {
      setZones(updatedZones)
      setEditingZone(null)
    }

    setIsSaving(false)
  }

  // Handle zone count change (with confirmation)
  const handleChangeZoneCount = async (newCount: 3 | 4) => {
    if (!club?.id || !coach?.id) return

    setIsSaving(true)
    setError('')
    setShowChangeZonesConfirm(false)

    const newZones = createDefaultZones(newCount)
    const { error } = await saveClubGameModelZones(club.id, coach.id, newZones)

    if (error) {
      setError(error)
    } else {
      setZones(newZones)
      setSelectedZoneId(null)
    }

    setIsSaving(false)
  }

  // Handle match format change
  const handleMatchFormatChange = async (format: MatchFormat) => {
    if (!club?.id || !coach?.id || !zones) return

    setIsSaving(true)
    setError('')

    const updatedZones: GameModelZones = { ...zones, match_format: format }
    const { error } = await saveClubGameModelZones(club.id, coach.id, updatedZones)

    if (error) {
      setError(error)
    } else {
      setZones(updatedZones)
    }

    setIsSaving(false)
  }

  // Get zone number from zone
  const getZoneNumber = (zone: GameZone): number => {
    return zone.order
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

  // Show zone count selector if no zones configured
  if (!zones) {
    return (
      <div>
        <h1
          style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.sm,
            textAlign: 'center',
          }}
        >
          Game Model
        </h1>
        <p
          style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.secondary,
            textAlign: 'center',
            marginBottom: theme.spacing.xl,
          }}
        >
          Define tactical zones on the pitch with in-possession and out-of-possession instructions
        </p>

        {error && (
          <div
            style={{
              padding: theme.spacing.md,
              backgroundColor: 'rgba(220, 53, 69, 0.1)',
              border: `1px solid ${theme.colors.status.error}`,
              borderRadius: theme.borderRadius.md,
              color: theme.colors.status.error,
              marginBottom: theme.spacing.lg,
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        <ZoneCountSelector onSelect={handleZoneCountSelect} disabled={isSaving} />

        {isSaving && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.sm,
              marginTop: theme.spacing.lg,
              color: theme.colors.text.secondary,
            }}
          >
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'inline-flex' }}
            >
              <CgSpinnerAlt size={16} />
            </motion.span>
            Setting up zones...
          </div>
        )}
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
            Game Model
          </h1>
          <p
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
            }}
          >
            Click a zone on the pitch or in the list below to view and edit details
          </p>
        </div>
        <div style={{ display: 'flex', gap: theme.spacing.md }}>
          <button
            onClick={() => setShowMatchFormatModal(true)}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              backgroundColor: 'transparent',
              color: theme.colors.gold.main,
              border: `1px solid ${theme.colors.gold.main}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.sm,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
            }}
          >
            {zones.match_format || '11v11'}
          </button>
          <button
            onClick={() => setShowChangeZonesConfirm(true)}
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
            }}
          >
            <FaExchangeAlt size={12} />
            Change to {zones.zone_count === 3 ? '4' : '3'} Zones
          </button>
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

      {/* Main content - Pitch and Zone Cards side by side */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: theme.spacing.xl,
          alignItems: 'start',
        }}
      >
        {/* Pitch Display */}
        <ZonePitchDisplay
          zones={zones}
          selectedZoneId={selectedZoneId}
          onZoneClick={handleZoneClick}
          height={450}
        />

        {/* Zone Cards List - aligned with pitch zones */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: 410, // Zone area height: pitchHeight (450) - 2 * SVG padding (20)
            marginTop: `calc(${theme.spacing.md} + 20px)`, // Align with zone start: wrapper padding + SVG padding
          }}
        >
          {[...zones.zones].reverse().map((zone, index) => (
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

      {/* Zone Edit Modal */}
      {editingZone && (
        <ZoneEditModal
          zone={editingZone}
          zoneNumber={getZoneNumber(editingZone)}
          totalZones={zones.zone_count}
          onSave={handleSaveZone}
          onClose={() => setEditingZone(null)}
          isSaving={isSaving}
        />
      )}

      {/* Change Zone Count Confirmation Modal */}
      {showChangeZonesConfirm && (
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
          onClick={() => !isSaving && setShowChangeZonesConfirm(false)}
        >
          <div
            style={{
              backgroundColor: theme.colors.background.primary,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.xl,
              width: '100%',
              maxWidth: '500px',
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
              Change Zone Configuration
            </h2>
            <p
              style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.md,
                lineHeight: 1.6,
              }}
            >
              Changing from {zones.zone_count} zones to {zones.zone_count === 3 ? 4 : 3} zones
              will <strong>erase all existing zone data</strong>. This cannot be undone.
            </p>

            <div
              style={{
                backgroundColor: theme.colors.background.secondary,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.xl,
              }}
            >
              <p
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.muted,
                  marginTop: 0,
                  marginBottom: theme.spacing.sm,
                }}
              >
                Your current zone configuration:
              </p>
              {zones.zones.map((zone) => (
                <div
                  key={zone.id}
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Zone {zone.order}: {zone.name} ({zone.in_possession.length} in / {zone.out_of_possession.length} out)
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowChangeZonesConfirm(false)}
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
                onClick={() => handleChangeZoneCount(zones.zone_count === 3 ? 4 : 3)}
                disabled={isSaving}
                style={{
                  padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                  backgroundColor: theme.colors.status.error,
                  color: theme.colors.text.primary,
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
                {isSaving ? 'Changing...' : `Change to ${zones.zone_count === 3 ? 4 : 3} Zones`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Format Modal */}
      {showMatchFormatModal && (
        <MatchFormatModal
          currentFormat={zones.match_format || '11v11'}
          onSelect={handleMatchFormatChange}
          onClose={() => setShowMatchFormatModal(false)}
        />
      )}
    </div>
  )
}
