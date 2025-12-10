'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { FaTrash, FaQuestionCircle, FaEdit } from 'react-icons/fa'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import { useAuth } from '@/contexts/AuthContext'
import { getPlayer, updatePlayer, deletePlayer } from '@/lib/players'
import { getClubPositionalProfiles, getSystemDefaults, type PositionalProfile, type SystemDefault } from '@/lib/methodology'
import type { Player } from '@/types/database'

interface PositionOption {
  key: string
  name: string
  attributes: string[]
}

const OTHER_OPTION = '__other__'

export default function PlayerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const playerId = params.id as string
  const { isAdmin, club } = useAuth()

  const [player, setPlayer] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Positions from positional profiles
  const [positions, setPositions] = useState<PositionOption[]>([])
  // System defaults for attributes (to map keys to display names)
  const [systemAttributes, setSystemAttributes] = useState<SystemDefault[]>([])

  // Form state
  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [target1, setTarget1] = useState('')
  const [target2, setTarget2] = useState('')
  const [target3, setTarget3] = useState('')
  const [customTarget1, setCustomTarget1] = useState('')
  const [customTarget2, setCustomTarget2] = useState('')
  const [customTarget3, setCustomTarget3] = useState('')

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // IDP info tooltip
  const [showIdpInfo, setShowIdpInfo] = useState(false)

  const fetchPlayer = useCallback(async () => {
    if (!playerId) return

    setIsLoading(true)
    setError('')

    const { data, error } = await getPlayer(playerId)

    if (error) {
      setError('Failed to load player')
      console.error('Error fetching player:', error)
    } else if (data) {
      setPlayer(data)
      setName(data.name)
      setPosition(data.position || '')
      setAge(data.age?.toString() || '')
      setGender(data.gender || '')
      setTarget1(data.target_1 || '')
      setTarget2(data.target_2 || '')
      setTarget3(data.target_3 || '')
    }

    setIsLoading(false)
  }, [playerId])

  useEffect(() => {
    fetchPlayer()
  }, [fetchPlayer])

  // Helper to get attribute display name from key
  const getAttributeName = (key: string): string => {
    const attr = systemAttributes.find((a) => a.key === key)
    return attr?.value?.name || key
  }

  // Helper to get attribute key from display name (reverse lookup)
  const getAttributeKey = (displayName: string): string | null => {
    const attr = systemAttributes.find((a) => a.value?.name === displayName)
    return attr?.key || null
  }

  // Get attributes for selected position
  const selectedPositionAttributes = positions.find(p => p.name === position)?.attributes || []

  // Helper to get final IDP value (handles "Other" option)
  const getTargetValue = (selected: string, custom: string): string | null => {
    if (selected === OTHER_OPTION) {
      return custom.trim() || null
    }
    if (!selected) return null
    return getAttributeName(selected)
  }

  // Convert stored display names to attribute keys for dropdown selection
  // Runs when player data and system attributes are both loaded
  useEffect(() => {
    if (!player || systemAttributes.length === 0) return

    const convertTargetToKey = (targetValue: string | null): { key: string; custom: string } => {
      if (!targetValue) return { key: '', custom: '' }

      // Try to find the attribute key for this display name
      const attrKey = getAttributeKey(targetValue)
      if (attrKey && selectedPositionAttributes.includes(attrKey)) {
        return { key: attrKey, custom: '' }
      }

      // If not found in position's attributes, it's a custom value
      return { key: OTHER_OPTION, custom: targetValue }
    }

    const t1 = convertTargetToKey(player.target_1)
    const t2 = convertTargetToKey(player.target_2)
    const t3 = convertTargetToKey(player.target_3)

    setTarget1(t1.key)
    setCustomTarget1(t1.custom)
    setTarget2(t2.key)
    setCustomTarget2(t2.custom)
    setTarget3(t3.key)
    setCustomTarget3(t3.custom)
  }, [player, systemAttributes, selectedPositionAttributes])

  // Fetch positions from positional profiles
  const fetchPositions = useCallback(async () => {
    if (!club?.id) return

    // Get club positional profiles and system defaults in parallel
    const [profilesRes, positionsRes, attributesRes] = await Promise.all([
      getClubPositionalProfiles(club.id),
      getSystemDefaults('positions'),
      getSystemDefaults('attributes'),
    ])

    const profiles = profilesRes.data
    const systemPositions = positionsRes.data
    const sysAttributes = attributesRes.data

    // Store system attributes for display name lookups
    if (sysAttributes) {
      setSystemAttributes(sysAttributes)
    }

    if (profiles && systemPositions) {
      // Create a map of position key to name
      const positionMap = new Map<string, string>()
      systemPositions.forEach((pos: SystemDefault) => {
        positionMap.set(pos.key, pos.value.name)
      })

      // Map profiles to position options (including attributes)
      const positionOptions: PositionOption[] = profiles
        .filter((profile: PositionalProfile) => profile.is_active)
        .map((profile: PositionalProfile) => ({
          key: profile.position_key,
          name: profile.custom_position_name || positionMap.get(profile.position_key) || profile.position_key,
          attributes: profile.attributes || [],
        }))

      setPositions(positionOptions)
    }
  }, [club?.id])

  useEffect(() => {
    fetchPositions()
  }, [fetchPositions])

  // Track changes - compare what would be saved with stored values
  useEffect(() => {
    if (!player) return

    // Get what would be saved for each target
    const newTarget1 = getTargetValue(target1, customTarget1)
    const newTarget2 = getTargetValue(target2, customTarget2)
    const newTarget3 = getTargetValue(target3, customTarget3)

    const changed =
      name !== player.name ||
      position !== (player.position || '') ||
      age !== (player.age?.toString() || '') ||
      gender !== (player.gender || '') ||
      newTarget1 !== (player.target_1 || null) ||
      newTarget2 !== (player.target_2 || null) ||
      newTarget3 !== (player.target_3 || null)

    setHasChanges(changed)
  }, [player, name, position, age, gender, target1, target2, target3, customTarget1, customTarget2, customTarget3, systemAttributes])

  const handleSave = async () => {
    if (!player || !name.trim()) return

    setIsSaving(true)
    setError('')

    const { error } = await updatePlayer(player.id, {
      name: name.trim(),
      position: position.trim() || null,
      age: age ? parseInt(age) : null,
      gender: gender.trim() || null,
      target_1: getTargetValue(target1, customTarget1),
      target_2: getTargetValue(target2, customTarget2),
      target_3: getTargetValue(target3, customTarget3),
    })

    if (error) {
      setError('Failed to save changes')
      console.error('Error updating player:', error)
    } else {
      await fetchPlayer()
      setIsEditing(false)
      // Reset custom targets after save
      setCustomTarget1('')
      setCustomTarget2('')
      setCustomTarget3('')
    }

    setIsSaving(false)
  }

  // Helper to convert a target display name to key/custom for editing
  const convertTargetToKeyForEdit = (targetValue: string | null): { key: string; custom: string } => {
    if (!targetValue) return { key: '', custom: '' }

    // Try to find the attribute key for this display name
    const attrKey = getAttributeKey(targetValue)
    if (attrKey && selectedPositionAttributes.includes(attrKey)) {
      return { key: attrKey, custom: '' }
    }

    // If not found in position's attributes, it's a custom value
    return { key: OTHER_OPTION, custom: targetValue }
  }

  const handleCancelEdit = () => {
    // Reset form to original values
    if (player) {
      setName(player.name)
      setPosition(player.position || '')
      setAge(player.age?.toString() || '')
      setGender(player.gender || '')

      // Re-convert targets back to keys
      const t1 = convertTargetToKeyForEdit(player.target_1)
      const t2 = convertTargetToKeyForEdit(player.target_2)
      const t3 = convertTargetToKeyForEdit(player.target_3)

      setTarget1(t1.key)
      setCustomTarget1(t1.custom)
      setTarget2(t2.key)
      setCustomTarget2(t2.custom)
      setTarget3(t3.key)
      setCustomTarget3(t3.custom)
    }
    setIsEditing(false)
    setHasChanges(false)
  }

  const handleDelete = async () => {
    if (!player) return

    setIsDeleting(true)

    const { error } = await deletePlayer(player.id)

    if (error) {
      setError('Failed to delete player')
      console.error('Error deleting player:', error)
      setIsDeleting(false)
    } else {
      router.push('/team/players')
    }
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

  if (!player) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: theme.spacing.lg,
        }}
      >
        <p style={{ color: theme.colors.text.secondary }}>Player not found</p>
        <button
          onClick={() => router.push('/team/players')}
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
            backgroundColor: theme.colors.background.tertiary,
            color: theme.colors.text.primary,
            border: 'none',
            borderRadius: theme.borderRadius.md,
            cursor: 'pointer',
          }}
        >
          Back to Players
        </button>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.lg }}>
          {/* Avatar */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: theme.colors.background.tertiary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.muted,
              flexShrink: 0,
            }}
          >
            {player.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <h1
              style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
              }}
            >
              {player.name}
            </h1>
            <p
              style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.secondary,
              }}
            >
              {player.position || 'No position set'}
            </p>
          </div>
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
            disabled={!hasChanges || !name.trim() || isSaving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              backgroundColor: hasChanges && name.trim() && !isSaving
                ? theme.colors.gold.main
                : theme.colors.background.tertiary,
              color: hasChanges && name.trim() && !isSaving
                ? theme.colors.background.primary
                : theme.colors.text.muted,
              border: 'none',
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              cursor: hasChanges && name.trim() && !isSaving ? 'pointer' : 'not-allowed',
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

      {/* Player Information Section */}
      <div style={{ marginBottom: theme.spacing.xl }}>
        <h2
          style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.lg,
          }}
        >
          Player Information
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: theme.spacing.lg,
          }}
        >
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
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditing}
              style={{
                width: '100%',
                padding: isEditing ? theme.spacing.md : 0,
                backgroundColor: isEditing ? theme.colors.background.primary : 'transparent',
                color: theme.colors.text.primary,
                border: isEditing ? `2px solid ${theme.colors.border.primary}` : 'none',
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.base,
                outline: 'none',
                cursor: isEditing ? 'text' : 'default',
              }}
              onFocus={(e) => {
                if (isEditing) e.target.style.borderColor = theme.colors.gold.main
              }}
              onBlur={(e) => {
                if (isEditing) e.target.style.borderColor = theme.colors.border.primary
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
                marginBottom: theme.spacing.sm,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Position
            </label>
            {isEditing ? (
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              style={{
                width: '100%',
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
              <option value="">Select position...</option>
              {positions.map((pos) => (
                <option key={pos.key} value={pos.name}>
                  {pos.name}
                </option>
              ))}
            </select>
            ) : (
              <div style={{ fontSize: theme.typography.fontSize.base, color: theme.colors.text.primary }}>
                {position || '—'}
              </div>
            )}
          </div>

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
              Age
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., 14"
              min="0"
              max="99"
              style={{
                width: '100%',
                padding: isEditing ? theme.spacing.md : 0,
                backgroundColor: isEditing ? theme.colors.background.primary : 'transparent',
                color: theme.colors.text.primary,
                border: isEditing ? `2px solid ${theme.colors.border.primary}` : 'none',
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.base,
                outline: 'none',
                cursor: isEditing ? 'text' : 'default',
              }}
              onFocus={(e) => {
                if (isEditing) e.target.style.borderColor = theme.colors.gold.main
              }}
              onBlur={(e) => {
                if (isEditing) e.target.style.borderColor = theme.colors.border.primary
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
                marginBottom: theme.spacing.sm,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Gender
            </label>
            {isEditing ? (
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              style={{
                width: '100%',
                padding: theme.spacing.md,
                backgroundColor: theme.colors.background.primary,
                color: theme.colors.text.primary,
                border: `2px solid ${theme.colors.border.primary}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.base,
                outline: 'none',
                cursor: 'pointer',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.colors.gold.main
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme.colors.border.primary
              }}
            >
              <option value="">Not specified</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            ) : (
              <div style={{ fontSize: theme.typography.fontSize.base, color: theme.colors.text.primary }}>
                {gender || '—'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* IDP Section */}
      <div style={{ marginBottom: theme.spacing.xl }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.lg,
          }}
        >
          <h2
            style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
            }}
          >
            Individual Development Plan (IDP)
          </h2>
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setShowIdpInfo(true)}
            onMouseLeave={() => setShowIdpInfo(false)}
          >
            <div
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'help',
                color: theme.colors.text.muted,
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.5,
              }}
            >
              <FaQuestionCircle size={16} />
            </div>
            {showIdpInfo && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  backgroundColor: theme.colors.background.primary,
                  border: `1px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.md,
                  width: '280px',
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
              >
                <p
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                    lineHeight: 1.5,
                  }}
                >
                  IDP targets are development focus areas for this player. These come from attributes defined in your Positional Profiling within Team Methodology. You can set up to 3 targets per player.
                </p>
              </div>
            )}
          </div>
        </div>

        {isEditing && (
        <p
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.lg,
          }}
        >
          Set up to 3 development targets for this player
        </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          {/* Target 1 */}
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
              Target 1
            </label>
            {isEditing ? (
              <>
                <select
                  value={target1}
                  onChange={(e) => {
                    setTarget1(e.target.value)
                    if (e.target.value !== OTHER_OPTION) setCustomTarget1('')
                  }}
                  style={{
                    width: '100%',
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
                  onFocus={(e) => { e.target.style.borderColor = theme.colors.gold.main }}
                  onBlur={(e) => { e.target.style.borderColor = theme.colors.border.primary }}
                >
                  <option value="">Select target...</option>
                  {selectedPositionAttributes.map((attr) => (
                    <option key={attr} value={attr}>{getAttributeName(attr)}</option>
                  ))}
                  <option value={OTHER_OPTION}>Other (custom)</option>
                </select>
                {target1 === OTHER_OPTION && (
                  <input
                    type="text"
                    value={customTarget1}
                    onChange={(e) => setCustomTarget1(e.target.value)}
                    placeholder="Enter custom target..."
                    style={{
                      width: '100%',
                      padding: theme.spacing.md,
                      marginTop: theme.spacing.sm,
                      backgroundColor: theme.colors.background.primary,
                      color: theme.colors.text.primary,
                      border: `2px solid ${theme.colors.border.primary}`,
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.typography.fontSize.base,
                      outline: 'none',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = theme.colors.gold.main }}
                    onBlur={(e) => { e.target.style.borderColor = theme.colors.border.primary }}
                  />
                )}
              </>
            ) : (
              <div style={{ fontSize: theme.typography.fontSize.base, color: theme.colors.text.primary }}>
                {player?.target_1 || '—'}
              </div>
            )}
          </div>

          {/* Target 2 */}
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
              Target 2
            </label>
            {isEditing ? (
              <>
                <select
                  value={target2}
                  onChange={(e) => {
                    setTarget2(e.target.value)
                    if (e.target.value !== OTHER_OPTION) setCustomTarget2('')
                  }}
                  style={{
                    width: '100%',
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
                  onFocus={(e) => { e.target.style.borderColor = theme.colors.gold.main }}
                  onBlur={(e) => { e.target.style.borderColor = theme.colors.border.primary }}
                >
                  <option value="">Select target...</option>
                  {selectedPositionAttributes.map((attr) => (
                    <option key={attr} value={attr}>{getAttributeName(attr)}</option>
                  ))}
                  <option value={OTHER_OPTION}>Other (custom)</option>
                </select>
                {target2 === OTHER_OPTION && (
                  <input
                    type="text"
                    value={customTarget2}
                    onChange={(e) => setCustomTarget2(e.target.value)}
                    placeholder="Enter custom target..."
                    style={{
                      width: '100%',
                      padding: theme.spacing.md,
                      marginTop: theme.spacing.sm,
                      backgroundColor: theme.colors.background.primary,
                      color: theme.colors.text.primary,
                      border: `2px solid ${theme.colors.border.primary}`,
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.typography.fontSize.base,
                      outline: 'none',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = theme.colors.gold.main }}
                    onBlur={(e) => { e.target.style.borderColor = theme.colors.border.primary }}
                  />
                )}
              </>
            ) : (
              <div style={{ fontSize: theme.typography.fontSize.base, color: theme.colors.text.primary }}>
                {player?.target_2 || '—'}
              </div>
            )}
          </div>

          {/* Target 3 */}
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
              Target 3
            </label>
            {isEditing ? (
              <>
                <select
                  value={target3}
                  onChange={(e) => {
                    setTarget3(e.target.value)
                    if (e.target.value !== OTHER_OPTION) setCustomTarget3('')
                  }}
                  style={{
                    width: '100%',
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
                  onFocus={(e) => { e.target.style.borderColor = theme.colors.gold.main }}
                  onBlur={(e) => { e.target.style.borderColor = theme.colors.border.primary }}
                >
                  <option value="">Select target...</option>
                  {selectedPositionAttributes.map((attr) => (
                    <option key={attr} value={attr}>{getAttributeName(attr)}</option>
                  ))}
                  <option value={OTHER_OPTION}>Other (custom)</option>
                </select>
                {target3 === OTHER_OPTION && (
                  <input
                    type="text"
                    value={customTarget3}
                    onChange={(e) => setCustomTarget3(e.target.value)}
                    placeholder="Enter custom target..."
                    style={{
                      width: '100%',
                      padding: theme.spacing.md,
                      marginTop: theme.spacing.sm,
                      backgroundColor: theme.colors.background.primary,
                      color: theme.colors.text.primary,
                      border: `2px solid ${theme.colors.border.primary}`,
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.typography.fontSize.base,
                      outline: 'none',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = theme.colors.gold.main }}
                    onBlur={(e) => { e.target.style.borderColor = theme.colors.border.primary }}
                  />
                )}
              </>
            ) : (
              <div style={{ fontSize: theme.typography.fontSize.base, color: theme.colors.text.primary }}>
                {player?.target_3 || '—'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Button - Only show when editing and head coach */}
      {isEditing && isAdmin && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: theme.spacing.xl,
            marginTop: theme.spacing.lg,
            borderTop: `1px solid ${theme.colors.border.primary}`,
          }}
        >
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              backgroundColor: 'transparent',
              color: theme.colors.status.error,
              border: `1px solid ${theme.colors.status.error}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.sm,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
            }}
          >
            <FaTrash size={14} />
            Delete Player
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
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
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              backgroundColor: theme.colors.background.primary,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.xl,
              width: '100%',
              maxWidth: '400px',
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
              Delete Player
            </h2>
            <p
              style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.xl,
              }}
            >
              Are you sure you want to delete {player.name}? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                style={{
                  padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                  backgroundColor: theme.colors.background.tertiary,
                  color: theme.colors.text.primary,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                  backgroundColor: theme.colors.status.error,
                  color: theme.colors.text.primary,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                }}
              >
                {isDeleting && (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-flex' }}
                  >
                    <CgSpinnerAlt size={16} />
                  </motion.span>
                )}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
