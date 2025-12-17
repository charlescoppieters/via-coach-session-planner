'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaTimes, FaSave, FaPlus, FaTrash } from 'react-icons/fa'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import type { PositionalProfileAttributes } from '@/types/database'
import type { SystemDefault } from '@/lib/methodology'

interface PositionEditModalProps {
  positionName: string
  positionDescription?: string
  attributes: PositionalProfileAttributes
  inPossessionOptions: SystemDefault[]
  outOfPossessionOptions: SystemDefault[]
  onSave: (attributes: PositionalProfileAttributes) => void
  onClose: () => void
  isSaving?: boolean
}

const MAX_ATTRIBUTES = 5

export function PositionEditModal({
  positionName,
  positionDescription,
  attributes,
  inPossessionOptions,
  outOfPossessionOptions,
  onSave,
  onClose,
  isSaving = false,
}: PositionEditModalProps) {
  // Filter out empty values on init
  const [inPossession, setInPossession] = useState<string[]>(
    (attributes.in_possession || []).filter(a => a && a !== '')
  )
  const [outOfPossession, setOutOfPossession] = useState<string[]>(
    (attributes.out_of_possession || []).filter(a => a && a !== '')
  )

  // Reset state when attributes change
  useEffect(() => {
    setInPossession((attributes.in_possession || []).filter(a => a && a !== ''))
    setOutOfPossession((attributes.out_of_possession || []).filter(a => a && a !== ''))
  }, [attributes])

  const handleSave = () => {
    // Filter out empty values before saving
    const filteredInPoss = inPossession.filter(a => a && a !== '')
    const filteredOutPoss = outOfPossession.filter(a => a && a !== '')

    onSave({
      in_possession: filteredInPoss,
      out_of_possession: filteredOutPoss,
    })
  }

  // In Possession handlers
  const handleAddInPossession = () => {
    if (inPossession.length < MAX_ATTRIBUTES) {
      setInPossession([...inPossession, ''])
    }
  }

  const handleUpdateInPossession = (index: number, value: string) => {
    const newAttrs = [...inPossession]
    newAttrs[index] = value
    setInPossession(newAttrs)
  }

  const handleRemoveInPossession = (index: number) => {
    setInPossession(inPossession.filter((_, i) => i !== index))
  }

  // Out of Possession handlers
  const handleAddOutOfPossession = () => {
    if (outOfPossession.length < MAX_ATTRIBUTES) {
      setOutOfPossession([...outOfPossession, ''])
    }
  }

  const handleUpdateOutOfPossession = (index: number, value: string) => {
    const newAttrs = [...outOfPossession]
    newAttrs[index] = value
    setOutOfPossession(newAttrs)
  }

  const handleRemoveOutOfPossession = (index: number) => {
    setOutOfPossession(outOfPossession.filter((_, i) => i !== index))
  }

  // Category display names
  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'attributes_in_possession':
        return 'In Possession'
      case 'attributes_out_of_possession':
        return 'Out of Possession'
      case 'attributes_physical':
        return 'Physical'
      case 'attributes_psychological':
        return 'Psychological'
      default:
        return category
    }
  }

  // Group options by category
  const groupOptionsByCategory = (options: SystemDefault[]) => {
    const groups: Record<string, SystemDefault[]> = {}

    // Define category order
    const categoryOrder = [
      'attributes_in_possession',
      'attributes_out_of_possession',
      'attributes_physical',
      'attributes_psychological',
    ]

    // Initialize groups in order
    categoryOrder.forEach(cat => {
      groups[cat] = []
    })

    // Group options
    options.forEach(opt => {
      const cat = opt.category
      if (groups[cat]) {
        groups[cat].push(opt)
      } else {
        // Fallback for any unexpected category
        if (!groups['other']) groups['other'] = []
        groups['other'].push(opt)
      }
    })

    // Return only non-empty groups in order
    return categoryOrder
      .filter(cat => groups[cat] && groups[cat].length > 0)
      .map(cat => ({
        category: cat,
        label: getCategoryLabel(cat),
        options: groups[cat],
      }))
  }

  const renderAttributeRow = (
    index: number,
    value: string,
    onChange: (index: number, value: string) => void,
    onRemove: (index: number) => void,
    options: SystemDefault[]
  ) => {
    const groupedOptions = groupOptionsByCategory(options)

    return (
      <div
        key={index}
        style={{
          display: 'flex',
          gap: theme.spacing.sm,
          alignItems: 'center',
        }}
      >
        <select
          value={value}
          onChange={(e) => onChange(index, e.target.value)}
          disabled={isSaving}
          style={{
            flex: 1,
            padding: theme.spacing.md,
            backgroundColor: theme.colors.background.primary,
            color: value ? theme.colors.text.primary : theme.colors.text.secondary,
            border: `1px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.sm,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: '2.5rem',
          }}
        >
          <option value="" disabled>
            Select attribute...
          </option>
          {groupedOptions.map((group) => (
            <optgroup key={group.category} label={group.label}>
              {group.options.map((attr) => (
                <option key={attr.key} value={attr.key}>
                  {attr.value?.name || attr.key}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          onClick={() => onRemove(index)}
          disabled={isSaving}
          style={{
            padding: theme.spacing.sm,
            backgroundColor: 'transparent',
            color: theme.colors.status.error,
            border: 'none',
            borderRadius: theme.borderRadius.md,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isSaving ? 0.5 : 1,
          }}
        >
          <FaTrash size={14} />
        </button>
      </div>
    )
  }

  const renderAddButton = (onClick: () => void, currentCount: number) => {
    if (currentCount >= MAX_ATTRIBUTES) return null

    return (
      <button
        onClick={onClick}
        disabled={isSaving}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.sm,
          padding: theme.spacing.md,
          backgroundColor: 'transparent',
          border: `2px dashed ${theme.colors.border.primary}`,
          borderRadius: theme.borderRadius.md,
          color: theme.colors.text.secondary,
          fontSize: theme.typography.fontSize.sm,
          cursor: isSaving ? 'not-allowed' : 'pointer',
          transition: theme.transitions.fast,
          width: '100%',
          opacity: isSaving ? 0.5 : 1,
        }}
        onMouseEnter={e => {
          if (!isSaving) {
            e.currentTarget.style.borderColor = theme.colors.gold.main
            e.currentTarget.style.color = theme.colors.gold.main
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = theme.colors.border.primary
          e.currentTarget.style.color = theme.colors.text.secondary
        }}
      >
        <FaPlus size={12} />
        Add Attribute ({currentCount}/{MAX_ATTRIBUTES})
      </button>
    )
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
          maxWidth: '700px',
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
              Edit {positionName}
            </h2>
            {positionDescription && (
              <p
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.secondary,
                  margin: 0,
                  marginTop: theme.spacing.xs,
                }}
              >
                {positionDescription}
              </p>
            )}
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
              In Possession Attributes
            </h3>
            <p
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.md,
              }}
            >
              Add up to {MAX_ATTRIBUTES} key attributes for this position when in possession
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.sm,
              }}
            >
              {inPossession.map((value, index) =>
                renderAttributeRow(
                  index,
                  value,
                  handleUpdateInPossession,
                  handleRemoveInPossession,
                  inPossessionOptions
                )
              )}
              {renderAddButton(handleAddInPossession, inPossession.length)}
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
              Out of Possession Attributes
            </h3>
            <p
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.md,
              }}
            >
              Add up to {MAX_ATTRIBUTES} key attributes for this position when out of possession
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.sm,
              }}
            >
              {outOfPossession.map((value, index) =>
                renderAttributeRow(
                  index,
                  value,
                  handleUpdateOutOfPossession,
                  handleRemoveOutOfPossession,
                  outOfPossessionOptions
                )
              )}
              {renderAddButton(handleAddOutOfPossession, outOfPossession.length)}
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
