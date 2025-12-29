'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaTimes, FaSave, FaPlus } from 'react-icons/fa'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import type { GameZone, ZoneBlock } from '@/types/database'

interface ZoneEditModalProps {
  zone: GameZone
  zoneNumber: number
  totalZones: number
  onSave: (updatedZone: GameZone) => void
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
  const [inPossessionBlocks, setInPossessionBlocks] = useState<ZoneBlock[]>(zone.in_possession)
  const [outOfPossessionBlocks, setOutOfPossessionBlocks] = useState<ZoneBlock[]>(zone.out_of_possession)
  const [errors, setErrors] = useState<{ zoneName?: string }>({})

  // Reset state when zone changes
  useEffect(() => {
    setZoneName(zone.name)
    setInPossessionBlocks(zone.in_possession)
    setOutOfPossessionBlocks(zone.out_of_possession)
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

    // Clean up blocks - trim and filter out empty blocks
    const cleanedInBlocks = inPossessionBlocks
      .map((b) => ({ ...b, name: b.name.trim(), details: b.details.trim() }))
      .filter((b) => b.name !== '' || b.details !== '')

    const cleanedOutBlocks = outOfPossessionBlocks
      .map((b) => ({ ...b, name: b.name.trim(), details: b.details.trim() }))
      .filter((b) => b.name !== '' || b.details !== '')

    const updatedZone: GameZone = {
      ...zone,
      name: zoneName.trim(),
      in_possession: cleanedInBlocks,
      out_of_possession: cleanedOutBlocks,
    }

    onSave(updatedZone)
  }

  const addBlock = (type: 'in' | 'out') => {
    const newBlock: ZoneBlock = {
      id: `${zone.id}-${type}-${Date.now()}`,
      name: '',
      details: '',
    }

    if (type === 'in') {
      setInPossessionBlocks([...inPossessionBlocks, newBlock])
    } else {
      setOutOfPossessionBlocks([...outOfPossessionBlocks, newBlock])
    }
  }

  const removeBlock = (type: 'in' | 'out', blockId: string) => {
    if (type === 'in') {
      setInPossessionBlocks(inPossessionBlocks.filter((b) => b.id !== blockId))
    } else {
      setOutOfPossessionBlocks(outOfPossessionBlocks.filter((b) => b.id !== blockId))
    }
  }

  const updateBlock = (type: 'in' | 'out', blockId: string, field: 'name' | 'details', value: string) => {
    if (type === 'in') {
      setInPossessionBlocks(
        inPossessionBlocks.map((b) => (b.id === blockId ? { ...b, [field]: value } : b))
      )
    } else {
      setOutOfPossessionBlocks(
        outOfPossessionBlocks.map((b) => (b.id === blockId ? { ...b, [field]: value } : b))
      )
    }
  }

  const renderBlockList = (
    type: 'in' | 'out',
    title: string,
    blocks: ZoneBlock[],
    accentColor: string,
    placeholder: string
  ) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          marginBottom: theme.spacing.md,
        }}
      >
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: accentColor,
          }}
        />
        <span
          style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            color: accentColor,
          }}
        >
          {title}
        </span>
      </div>

      {/* Block List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.md,
        }}
      >
        {blocks.length === 0 ? (
          <p
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.muted,
              fontStyle: 'italic',
              textAlign: 'center',
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.background.secondary,
              borderRadius: theme.borderRadius.md,
              border: `1px dashed ${theme.colors.border.primary}`,
            }}
          >
            No themes added yet
          </p>
        ) : (
          blocks.map((block) => (
            <div
              key={block.id}
              style={{
                backgroundColor: theme.colors.background.secondary,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                border: `1px solid ${theme.colors.border.primary}`,
              }}
            >
              {/* Theme Name Row */}
              <div
                style={{
                  display: 'flex',
                  gap: theme.spacing.sm,
                  marginBottom: theme.spacing.sm,
                }}
              >
                <input
                  type="text"
                  value={block.name}
                  onChange={(e) => updateBlock(type, block.id, 'name', e.target.value)}
                  placeholder={placeholder}
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    padding: theme.spacing.sm,
                    backgroundColor: theme.colors.background.tertiary,
                    border: `1px solid ${theme.colors.border.primary}`,
                    borderRadius: theme.borderRadius.md,
                    color: theme.colors.text.primary,
                    fontSize: theme.typography.fontSize.sm,
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeBlock(type, block.id)}
                  disabled={isSaving}
                  style={{
                    padding: theme.spacing.sm,
                    backgroundColor: 'transparent',
                    border: `1px solid ${theme.colors.border.primary}`,
                    borderRadius: theme.borderRadius.md,
                    color: theme.colors.text.muted,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <FaTimes size={12} />
                </button>
              </div>

              {/* Theme Details */}
              <textarea
                value={block.details}
                onChange={(e) => updateBlock(type, block.id, 'details', e.target.value)}
                placeholder="Describe the tactical objectives..."
                disabled={isSaving}
                rows={2}
                style={{
                  width: '100%',
                  padding: theme.spacing.sm,
                  backgroundColor: theme.colors.background.tertiary,
                  border: `1px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.fontSize.sm,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          ))
        )}

        {/* Add Theme Button */}
        <button
          type="button"
          onClick={() => addBlock(type)}
          disabled={isSaving}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.sm,
            padding: theme.spacing.sm,
            backgroundColor: 'transparent',
            border: `1px dashed ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.md,
            color: theme.colors.text.secondary,
            fontSize: theme.typography.fontSize.sm,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.5 : 1,
          }}
        >
          <FaPlus size={10} />
          Add Theme
        </button>
      </div>
    </div>
  )

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
          maxWidth: '900px',
          height: '90vh',
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
              Configure zone name and training themes
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

          {/* Two Column Layout for In/Out Possession */}
          <div
            style={{
              display: 'flex',
              gap: theme.spacing.xl,
            }}
          >
            {renderBlockList(
              'in',
              'In Possession',
              inPossessionBlocks,
              theme.colors.gold.main,
              'e.g., Build Up Play, Final Third Entry'
            )}
            {renderBlockList(
              'out',
              'Out of Possession',
              outOfPossessionBlocks,
              theme.colors.status.error,
              'e.g., High Press, Recovery Run'
            )}
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
