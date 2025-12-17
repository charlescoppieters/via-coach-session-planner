'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaTimes, FaSave } from 'react-icons/fa'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import type { PlayingZone, ZoneState } from '@/types/database'

interface ZoneEditModalProps {
  zone: PlayingZone
  zoneNumber: number
  totalZones: number
  onSave: (updatedZone: PlayingZone) => void
  onClose: () => void
  isSaving?: boolean
}

export function ZoneEditModal({
  zone,
  zoneNumber,
  totalZones,
  onSave,
  onClose,
  isSaving = false,
}: ZoneEditModalProps) {
  const [zoneName, setZoneName] = useState(zone.name)
  const [inPossession, setInPossession] = useState<ZoneState>(zone.in_possession)
  const [outOfPossession, setOutOfPossession] = useState<ZoneState>(zone.out_of_possession)
  const [errors, setErrors] = useState<{ zoneName?: string }>({})

  // Reset state when zone changes
  useEffect(() => {
    setZoneName(zone.name)
    setInPossession(zone.in_possession)
    setOutOfPossession(zone.out_of_possession)
    setErrors({})
  }, [zone])

  const handleSave = () => {
    // Validate - only zone name is required
    const newErrors: { zoneName?: string } = {}
    if (!zoneName.trim()) {
      newErrors.zoneName = 'Zone name is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const updatedZone: PlayingZone = {
      ...zone,
      name: zoneName.trim(),
      in_possession: {
        name: inPossession.name.trim(),
        details: inPossession.details.trim(),
      },
      out_of_possession: {
        name: outOfPossession.name.trim(),
        details: outOfPossession.details.trim(),
      },
    }

    onSave(updatedZone)
  }

  return (
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
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          onClose()
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          backgroundColor: theme.colors.background.primary,
          borderRadius: theme.borderRadius.lg,
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: theme.spacing.lg,
            borderBottom: `1px solid ${theme.colors.border.primary}`,
            flexShrink: 0,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                margin: 0,
              }}
            >
              Edit Zone {zoneNumber}
            </h2>
            <p
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                margin: 0,
                marginTop: theme.spacing.xs,
              }}
            >
              Configure zone name and tactics
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              padding: theme.spacing.sm,
              backgroundColor: 'transparent',
              border: 'none',
              color: theme.colors.text.secondary,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              borderRadius: theme.borderRadius.md,
            }}
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div style={{ padding: theme.spacing.lg, flex: 1, overflowY: 'auto' }}>
          {/* Zone Name Section */}
          <div style={{ marginBottom: theme.spacing.xl }}>
            <label
              style={{
                display: 'block',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.sm,
              }}
            >
              Zone Name *
            </label>
            <input
              type="text"
              value={zoneName}
              onChange={(e) => {
                setZoneName(e.target.value)
                if (errors.zoneName) setErrors({ ...errors, zoneName: undefined })
              }}
              placeholder="e.g., Defensive Third, Build-Up Zone, Attacking Quarter"
              disabled={isSaving}
              style={{
                width: '100%',
                padding: theme.spacing.md,
                backgroundColor: theme.colors.background.secondary,
                border: `1px solid ${errors.zoneName ? theme.colors.status.error : theme.colors.border.primary}`,
                borderRadius: theme.borderRadius.md,
                color: theme.colors.text.primary,
                fontSize: theme.typography.fontSize.base,
              }}
            />
            {errors.zoneName && (
              <span
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.status.error,
                  marginTop: theme.spacing.xs,
                  display: 'block',
                }}
              >
                {errors.zoneName}
              </span>
            )}
          </div>

          {/* In Possession Section */}
          <div
            style={{
              marginBottom: theme.spacing.xl,
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.background.secondary,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border.primary}`,
            }}
          >
            <h3
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.gold.main,
                marginTop: 0,
                marginBottom: theme.spacing.md,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: theme.colors.gold.main,
                }}
              />
              In Possession
            </h3>

            <div style={{ marginBottom: theme.spacing.md }}>
              <label
                style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.xs,
                }}
              >
                Name
              </label>
              <input
                type="text"
                value={inPossession.name}
                onChange={(e) => setInPossession({ ...inPossession, name: e.target.value })}
                placeholder="e.g., Build Up, Progression, Final Third Entry"
                disabled={isSaving}
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.background.primary,
                  border: `1px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.fontSize.base,
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.xs,
                }}
              >
                Details
              </label>
              <textarea
                value={inPossession.details}
                onChange={(e) => setInPossession({ ...inPossession, details: e.target.value })}
                placeholder="Describe the tactical approach, player roles, and objectives when in possession in this zone..."
                disabled={isSaving}
                rows={4}
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.background.primary,
                  border: `1px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.fontSize.base,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Out of Possession Section */}
          <div
            style={{
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.background.secondary,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border.primary}`,
            }}
          >
            <h3
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.status.error,
                marginTop: 0,
                marginBottom: theme.spacing.md,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: theme.colors.status.error,
                }}
              />
              Out of Possession
            </h3>

            <div style={{ marginBottom: theme.spacing.md }}>
              <label
                style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.xs,
                }}
              >
                Name
              </label>
              <input
                type="text"
                value={outOfPossession.name}
                onChange={(e) => setOutOfPossession({ ...outOfPossession, name: e.target.value })}
                placeholder="e.g., High Press, Mid Block, Low Block"
                disabled={isSaving}
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.background.primary,
                  border: `1px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.fontSize.base,
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.xs,
                }}
              >
                Details
              </label>
              <textarea
                value={outOfPossession.details}
                onChange={(e) => setOutOfPossession({ ...outOfPossession, details: e.target.value })}
                placeholder="Describe the defensive approach, pressing triggers, and objectives when out of possession in this zone..."
                disabled={isSaving}
                rows={4}
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.background.primary,
                  border: `1px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.fontSize.base,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: theme.spacing.md,
            padding: theme.spacing.lg,
            borderTop: `1px solid ${theme.colors.border.primary}`,
            flexShrink: 0,
            backgroundColor: theme.colors.background.primary,
          }}
        >
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              backgroundColor: 'transparent',
              color: theme.colors.text.secondary,
              border: `1px solid ${theme.colors.border.primary}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.base,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
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
              <>
                <FaSave size={14} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
