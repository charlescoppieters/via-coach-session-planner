'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import { useTeam } from '@/contexts/TeamContext'
import {
  getTeamFacilities,
  saveTeamFacilities,
  getSpaceOptions,
  getEquipmentOptions,
  type EquipmentItem,
} from '@/lib/facilities'
import type { TeamFacility, SystemDefault } from '@/types/database'

const OTHER_SPACE = 'other'

export default function FacilitiesEquipmentPage() {
  const { selectedTeam } = useTeam()

  const [facilities, setFacilities] = useState<TeamFacility | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // System options
  const [spaceOptions, setSpaceOptions] = useState<SystemDefault[]>([])
  const [equipmentOptions, setEquipmentOptions] = useState<SystemDefault[]>([])

  // Form state
  const [spaceType, setSpaceType] = useState('')
  const [customSpace, setCustomSpace] = useState('')
  const [equipment, setEquipment] = useState<EquipmentItem[]>([])
  const [otherFactors, setOtherFactors] = useState('')

  // Load system options on mount
  useEffect(() => {
    const loadOptions = async () => {
      const [spaceRes, equipRes] = await Promise.all([
        getSpaceOptions(),
        getEquipmentOptions(),
      ])

      if (spaceRes.data) setSpaceOptions(spaceRes.data)
      if (equipRes.data) setEquipmentOptions(equipRes.data)
    }

    loadOptions()
  }, [])

  // Fetch facilities when team changes
  const fetchFacilities = useCallback(async () => {
    if (!selectedTeam?.id) return

    setIsLoading(true)
    setError('')

    const { data, error } = await getTeamFacilities(selectedTeam.id)

    if (error) {
      setError('Failed to load facilities')
      console.error('Error fetching facilities:', error)
    } else if (data) {
      setFacilities(data)
      setSpaceType(data.space_type || '')
      setCustomSpace(data.custom_space || '')
      setEquipment((data.equipment as unknown as EquipmentItem[]) || [])
      setOtherFactors(data.other_factors || '')
    } else {
      // No facilities record yet - start fresh
      setFacilities(null)
      setSpaceType('')
      setCustomSpace('')
      setEquipment([])
      setOtherFactors('')
    }

    setIsLoading(false)
  }, [selectedTeam?.id])

  useEffect(() => {
    fetchFacilities()
  }, [fetchFacilities])

  // Track changes
  useEffect(() => {
    const originalSpaceType = facilities?.space_type || ''
    const originalCustomSpace = facilities?.custom_space || ''
    const originalEquipment = (facilities?.equipment as unknown as EquipmentItem[]) || []
    const originalOtherFactors = facilities?.other_factors || ''

    const equipmentChanged =
      JSON.stringify(equipment) !== JSON.stringify(originalEquipment)

    const changed =
      spaceType !== originalSpaceType ||
      customSpace !== originalCustomSpace ||
      equipmentChanged ||
      otherFactors !== originalOtherFactors

    setHasChanges(changed)
  }, [facilities, spaceType, customSpace, equipment, otherFactors])

  const handleSave = async () => {
    if (!selectedTeam?.id) return

    setIsSaving(true)
    setError('')

    // Filter out equipment items without a type selected
    const validEquipment = equipment.filter((item) => item.type.trim() !== '')

    const { error } = await saveTeamFacilities(selectedTeam.id, {
      space_type: spaceType || null,
      custom_space: spaceType === OTHER_SPACE ? customSpace || null : null,
      equipment: validEquipment.length > 0 ? validEquipment : null,
      other_factors: otherFactors || null,
    })

    if (error) {
      setError('Failed to save facilities')
      console.error('Error saving facilities:', error)
    } else {
      await fetchFacilities()
      setIsEditing(false)
    }

    setIsSaving(false)
  }

  const handleCancelEdit = () => {
    // Reset form to original values
    setSpaceType(facilities?.space_type || '')
    setCustomSpace(facilities?.custom_space || '')
    setEquipment((facilities?.equipment as unknown as EquipmentItem[]) || [])
    setOtherFactors(facilities?.other_factors || '')
    setIsEditing(false)
    setHasChanges(false)
  }

  // Equipment management
  const handleAddEquipment = () => {
    setEquipment([...equipment, { type: '', quantity: 1 }])
  }

  const handleUpdateEquipment = (
    index: number,
    field: 'type' | 'quantity',
    value: string | number
  ) => {
    const updated = [...equipment]
    if (field === 'type') {
      updated[index].type = value as string
    } else {
      updated[index].quantity = Math.max(1, value as number)
    }
    setEquipment(updated)
  }

  const handleRemoveEquipment = (index: number) => {
    setEquipment(equipment.filter((_, i) => i !== index))
  }

  // Helper to get equipment display name
  const getEquipmentName = (key: string): string => {
    const equip = equipmentOptions.find((e) => e.key === key)
    const value = equip?.value as { name?: string } | undefined
    return value?.name || key
  }

  // Helper to get space display name
  const getSpaceName = (key: string): string => {
    if (!key) return '—'
    const space = spaceOptions.find((s) => s.key === key)
    const value = space?.value as { name?: string } | undefined
    return value?.name || key
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
          alignItems: 'center',
          justifyContent: 'space-between',
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
            Facilities & Equipment
          </h1>
          <p
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
            }}
          >
            Configure training facilities and available equipment for{' '}
            {selectedTeam?.name || 'your team'}
          </p>
        </div>

        {/* Edit / Save / Cancel Buttons */}
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              backgroundColor: theme.colors.gold.main,
              color: theme.colors.background.primary,
              border: `1px solid ${theme.colors.gold.main}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              cursor: 'pointer',
            }}
          >
            <FaEdit size={14} />
            Edit
          </button>
        ) : (
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <button
              onClick={handleCancelEdit}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                backgroundColor: 'transparent',
                color: theme.colors.text.secondary,
                border: `1px solid ${theme.colors.border.primary}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.sm,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                backgroundColor:
                  hasChanges && !isSaving
                    ? theme.colors.gold.main
                    : theme.colors.background.tertiary,
                color:
                  hasChanges && !isSaving
                    ? theme.colors.background.primary
                    : theme.colors.text.muted,
                border: 'none',
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                cursor: hasChanges && !isSaving ? 'pointer' : 'not-allowed',
              }}
            >
              {isSaving ? (
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
                'Save'
              )}
            </button>
          </div>
        )}
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

      {/* Training Space Section */}
      <div style={{ marginBottom: theme.spacing.xl }}>
        <h2
          style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.lg,
          }}
        >
          Training Space
        </h2>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.sm,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Space Type
          </label>
          {isEditing ? (
            <>
              <select
                value={spaceType}
                onChange={(e) => {
                  setSpaceType(e.target.value)
                  if (e.target.value !== OTHER_SPACE) setCustomSpace('')
                }}
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  padding: theme.spacing.md,
                  paddingRight: '2.5rem',
                  backgroundColor: theme.colors.background.primary,
                  color: theme.colors.text.primary,
                  border: `2px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.7rem center',
                  backgroundSize: '1.2em',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.colors.gold.main
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.colors.border.primary
                }}
              >
                <option value="">Select space type...</option>
                {spaceOptions.map((space) => (
                  <option key={space.key} value={space.key}>
                    {(space.value as { name?: string })?.name}
                  </option>
                ))}
              </select>
              {spaceType === OTHER_SPACE && (
                <input
                  type="text"
                  value={customSpace}
                  onChange={(e) => setCustomSpace(e.target.value)}
                  placeholder="Describe your space..."
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: theme.spacing.md,
                    marginTop: theme.spacing.md,
                    marginLeft: theme.spacing.lg,
                    backgroundColor: theme.colors.background.primary,
                    color: theme.colors.text.primary,
                    border: `2px solid ${theme.colors.border.primary}`,
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.typography.fontSize.base,
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = theme.colors.gold.main
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = theme.colors.border.primary
                  }}
                />
              )}
            </>
          ) : (
            <div
              style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.primary,
              }}
            >
              {spaceType === OTHER_SPACE && customSpace
                ? customSpace
                : getSpaceName(spaceType)}
            </div>
          )}
        </div>
      </div>

      {/* Equipment Section */}
      <div style={{ marginBottom: theme.spacing.xl }}>
        <h2
          style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.lg,
          }}
        >
          Available Equipment
        </h2>

        {isEditing && (
          <p
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.lg,
            }}
          >
            Add equipment available for training sessions
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          {equipment.length === 0 && !isEditing ? (
            <div
              style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.muted,
              }}
            >
              No equipment configured
            </div>
          ) : (
            equipment.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                }}
              >
                {isEditing ? (
                  <>
                    <select
                      value={item.type}
                      onChange={(e) =>
                        handleUpdateEquipment(index, 'type', e.target.value)
                      }
                      style={{
                        flex: 1,
                        maxWidth: '280px',
                        padding: theme.spacing.md,
                        paddingRight: '2.5rem',
                        backgroundColor: theme.colors.background.primary,
                        color: theme.colors.text.primary,
                        border: `2px solid ${theme.colors.border.primary}`,
                        borderRadius: theme.borderRadius.md,
                        fontSize: theme.typography.fontSize.base,
                        outline: 'none',
                        cursor: 'pointer',
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.7rem center',
                        backgroundSize: '1.2em',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = theme.colors.gold.main
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = theme.colors.border.primary
                      }}
                    >
                      <option value="">Select equipment...</option>
                      {equipmentOptions.map((equip) => (
                        <option key={equip.key} value={equip.key}>
                          {(equip.value as { name?: string })?.name}
                        </option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                      <label
                        style={{
                          fontSize: theme.typography.fontSize.sm,
                          color: theme.colors.text.secondary,
                        }}
                      >
                        Qty:
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateEquipment(
                            index,
                            'quantity',
                            parseInt(e.target.value) || 1
                          )
                        }
                        min="1"
                        style={{
                          width: '80px',
                          padding: theme.spacing.md,
                          backgroundColor: theme.colors.background.primary,
                          color: theme.colors.text.primary,
                          border: `2px solid ${theme.colors.border.primary}`,
                          borderRadius: theme.borderRadius.md,
                          fontSize: theme.typography.fontSize.base,
                          outline: 'none',
                          textAlign: 'center',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = theme.colors.gold.main
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = theme.colors.border.primary
                        }}
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveEquipment(index)}
                      style={{
                        padding: theme.spacing.sm,
                        backgroundColor: 'transparent',
                        color: theme.colors.status.error,
                        border: 'none',
                        borderRadius: theme.borderRadius.md,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FaTrash size={14} />
                    </button>
                  </>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.md,
                      padding: `${theme.spacing.sm} 0`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: theme.typography.fontSize.base,
                        color: theme.colors.text.primary,
                      }}
                    >
                      {getEquipmentName(item.type)}
                    </span>
                    <span
                      style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.text.secondary,
                        backgroundColor: theme.colors.background.tertiary,
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        borderRadius: theme.borderRadius.sm,
                      }}
                    >
                      x{item.quantity}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}

          {isEditing && (
            <button
              onClick={handleAddEquipment}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                backgroundColor: 'transparent',
                color: theme.colors.gold.main,
                border: `1px dashed ${theme.colors.border.primary}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.sm,
                cursor: 'pointer',
                width: 'fit-content',
                marginTop: theme.spacing.sm,
              }}
            >
              <FaPlus size={12} />
              Add Equipment
            </button>
          )}
        </div>
      </div>

      {/* Other Factors Section */}
      <div style={{ marginBottom: theme.spacing.xl }}>
        <h2
          style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.lg,
          }}
        >
          Other Factors
        </h2>

        {isEditing && (
          <p
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.lg,
            }}
          >
            Note any other relevant factors about your training environment
          </p>
        )}

        <div>
          {isEditing ? (
            <textarea
              value={otherFactors}
              onChange={(e) => setOtherFactors(e.target.value)}
              placeholder="e.g., Limited lighting after 6pm, shared space with other teams on Tuesdays..."
              rows={4}
              style={{
                width: '100%',
                maxWidth: '600px',
                padding: theme.spacing.md,
                backgroundColor: theme.colors.background.primary,
                color: theme.colors.text.primary,
                border: `2px solid ${theme.colors.border.primary}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.base,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.colors.gold.main
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme.colors.border.primary
              }}
            />
          ) : (
            <div
              style={{
                fontSize: theme.typography.fontSize.base,
                color: otherFactors
                  ? theme.colors.text.primary
                  : theme.colors.text.muted,
                whiteSpace: 'pre-wrap',
              }}
            >
              {otherFactors || 'No other factors specified'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
