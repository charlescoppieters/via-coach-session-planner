'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FaPlus, FaSearch, FaUser } from 'react-icons/fa'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import { useAuth } from '@/contexts/AuthContext'
import { useTeam } from '@/contexts/TeamContext'
import { getPlayers, createPlayer } from '@/lib/players'
import { getClubPositionalProfiles, getSystemDefaults, type PositionalProfile, type SystemDefault } from '@/lib/methodology'
import type { Player } from '@/types/database'

interface PositionOption {
  key: string
  name: string
  attributes: string[]
}

const OTHER_OPTION = '__other__'

export default function PlayersPage() {
  const router = useRouter()
  const { club } = useAuth()
  const { selectedTeam, selectedTeamId } = useTeam()

  const [players, setPlayers] = useState<Player[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Positions from positional profiles (with attributes)
  const [positions, setPositions] = useState<PositionOption[]>([])
  // System defaults for attributes (to map keys to display names)
  const [systemAttributes, setSystemAttributes] = useState<SystemDefault[]>([])

  // Add player modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newPlayerPosition, setNewPlayerPosition] = useState('')
  const [newPlayerAge, setNewPlayerAge] = useState('')
  const [newPlayerGender, setNewPlayerGender] = useState('')
  const [newPlayerTarget1, setNewPlayerTarget1] = useState('')
  const [newPlayerTarget2, setNewPlayerTarget2] = useState('')
  const [newPlayerTarget3, setNewPlayerTarget3] = useState('')
  const [customTarget1, setCustomTarget1] = useState('')
  const [customTarget2, setCustomTarget2] = useState('')
  const [customTarget3, setCustomTarget3] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Get attributes for selected position
  const selectedPositionAttributes = positions.find(p => p.name === newPlayerPosition)?.attributes || []

  const fetchPlayers = useCallback(async () => {
    if (!club?.id || !selectedTeamId) return

    setIsLoading(true)
    setError('')

    const { data, error } = await getPlayers(club.id, selectedTeamId)

    if (error) {
      setError('Failed to load players')
      console.error('Error fetching players:', error)
    } else if (data) {
      setPlayers(data)
      setFilteredPlayers(data)
    }

    setIsLoading(false)
  }, [club?.id, selectedTeamId])

  useEffect(() => {
    fetchPlayers()
  }, [fetchPlayers])

  // Helper to parse age from age_group (e.g., "U13" -> 13)
  const parseAgeFromAgeGroup = (ageGroup: string): string => {
    const match = ageGroup.match(/U?(\d+)/i)
    return match ? match[1] : ''
  }

  // Helper to get attribute display name from key
  const getAttributeName = (key: string): string => {
    const attr = systemAttributes.find((a) => a.key === key)
    return attr?.value?.name || key
  }

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

      // Map profiles to position options (including attributes as keys)
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

  // Filter players based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPlayers(players)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredPlayers(
        players.filter(
          (player) =>
            player.name.toLowerCase().includes(query) ||
            player.position?.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, players])

  // Helper to get final IDP value (handles "Other" option)
  // Converts attribute keys to display names for storage
  const getTargetValue = (selected: string, custom: string): string | null => {
    if (selected === OTHER_OPTION) {
      return custom.trim() || null
    }
    if (!selected) return null
    // Convert key to display name for storage
    return getAttributeName(selected)
  }

  // Open modal with auto-filled values
  const openAddModal = () => {
    setNewPlayerName('')
    setNewPlayerPosition('')
    setNewPlayerAge(selectedTeam?.age_group ? parseAgeFromAgeGroup(selectedTeam.age_group) : '')
    // For Co-Ed teams, leave gender blank so coach can pick per player
    const teamGender = selectedTeam?.gender
    setNewPlayerGender(teamGender === 'Male' || teamGender === 'Female' ? teamGender : '')
    setNewPlayerTarget1('')
    setNewPlayerTarget2('')
    setNewPlayerTarget3('')
    setCustomTarget1('')
    setCustomTarget2('')
    setCustomTarget3('')
    setIsAddModalOpen(true)
  }

  // Reset IDPs when position changes
  const handlePositionChange = (newPosition: string) => {
    setNewPlayerPosition(newPosition)
    // Clear IDPs when position changes since attributes are different
    setNewPlayerTarget1('')
    setNewPlayerTarget2('')
    setNewPlayerTarget3('')
    setCustomTarget1('')
    setCustomTarget2('')
    setCustomTarget3('')
  }

  const handleAddPlayer = async () => {
    if (!club?.id || !selectedTeamId || !newPlayerName.trim()) return

    setIsSaving(true)
    setError('')

    const { data, error } = await createPlayer({
      club_id: club.id,
      team_id: selectedTeamId,
      name: newPlayerName.trim(),
      position: newPlayerPosition.trim() || null,
      age: newPlayerAge ? parseInt(newPlayerAge) : null,
      gender: newPlayerGender || null,
      target_1: getTargetValue(newPlayerTarget1, customTarget1),
      target_2: getTargetValue(newPlayerTarget2, customTarget2),
      target_3: getTargetValue(newPlayerTarget3, customTarget3),
    })

    if (error) {
      setError('Failed to add player')
      console.error('Error creating player:', error)
    } else if (data) {
      await fetchPlayers()
      setIsAddModalOpen(false)
      // Navigate to the new player's detail page
      router.push(`/team/players/${data.id}`)
    }

    setIsSaving(false)
  }

  const getIdpCount = (player: Player): number => {
    let count = 0
    if (player.target_1) count++
    if (player.target_2) count++
    if (player.target_3) count++
    return count
  }

  // Shared styles for modal form elements
  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    color: theme.colors.text.primary,
    border: `2px solid ${theme.colors.border.primary}`,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSize.base,
    outline: 'none',
  }

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: theme.spacing.md,
    paddingRight: '2.5rem',
    backgroundColor: theme.colors.background.primary,
    color: theme.colors.text.primary,
    border: `2px solid ${theme.colors.border.primary}`,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSize.base,
    outline: 'none',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23888888'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.7rem center',
    backgroundSize: '1.2em',
    cursor: 'pointer',
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
          marginBottom: theme.spacing.xl,
        }}
      >
        <h1
          style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.sm,
          }}
        >
          Players
        </h1>
        <p
          style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.secondary,
          }}
        >
          Manage your team&apos;s players and their individual development plans
        </p>
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

      {/* Search Bar */}
      <div
        style={{
          marginBottom: theme.spacing.lg,
          position: 'relative',
        }}
      >
        <FaSearch
          size={14}
          color={theme.colors.text.muted}
          style={{
            position: 'absolute',
            left: theme.spacing.md,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search players by name or position..."
          style={{
            width: '100%',
            padding: theme.spacing.md,
            paddingLeft: '40px',
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
      </div>

      {/* Players List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        {filteredPlayers.length === 0 && !searchQuery ? (
          <div
            style={{
              textAlign: 'center',
              padding: theme.spacing.xl,
              color: theme.colors.text.secondary,
            }}
          >
            <FaUser size={48} style={{ marginBottom: theme.spacing.md, opacity: 0.3 }} />
            <p>No players yet. Add your first player to get started.</p>
          </div>
        ) : filteredPlayers.length === 0 && searchQuery ? (
          <div
            style={{
              textAlign: 'center',
              padding: theme.spacing.xl,
              color: theme.colors.text.secondary,
            }}
          >
            <p>No players found matching &quot;{searchQuery}&quot;</p>
          </div>
        ) : (
          filteredPlayers.map((player) => {
            const idpCount = getIdpCount(player)
            return (
              <div
                key={player.id}
                onClick={() => router.push(`/team/players/${player.id}`)}
                style={{
                  backgroundColor: theme.colors.background.tertiary,
                  border: `1px solid rgba(255, 255, 255, 0.1)`,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing.lg,
                  cursor: 'pointer',
                  transition: theme.transitions.fast,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.gold.main
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: theme.colors.background.tertiary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.bold,
                    color: theme.colors.text.muted,
                    flexShrink: 0,
                  }}
                >
                  {player.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>

                {/* Player Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontSize: theme.typography.fontSize.lg,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.text.primary,
                      marginBottom: '2px',
                    }}
                  >
                    {player.name}
                  </h3>
                  <p
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text.secondary,
                    }}
                  >
                    {player.position || 'No position set'}
                  </p>
                </div>

                {/* IDP Status */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.xs,
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    backgroundColor: idpCount > 0
                      ? 'rgba(239, 191, 4, 0.1)'
                      : theme.colors.background.tertiary,
                    borderRadius: theme.borderRadius.md,
                    color: idpCount > 0
                      ? theme.colors.gold.main
                      : theme.colors.text.muted,
                    fontSize: theme.typography.fontSize.sm,
                  }}
                >
                  {idpCount}/3 IDP
                </div>
              </div>
            )
          })
        )}

        {/* Add Player Button */}
        <button
          onClick={openAddModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.sm,
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.background.secondary,
            border: `2px dashed ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.lg,
            color: theme.colors.text.secondary,
            fontSize: theme.typography.fontSize.base,
            cursor: 'pointer',
            transition: theme.transitions.fast,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = theme.colors.gold.main
            e.currentTarget.style.color = theme.colors.gold.main
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.colors.border.primary
            e.currentTarget.style.color = theme.colors.text.secondary
          }}
        >
          <FaPlus size={14} />
          Add Player
        </button>
      </div>

      {/* Add Player Modal */}
      {isAddModalOpen && (
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
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: theme.colors.background.primary,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.xl,
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.lg,
              }}
            >
              Add Player
            </h2>

            {/* Name */}
            <div style={{ marginBottom: theme.spacing.lg }}>
              <label style={labelStyle}>Name *</label>
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Enter player name"
                autoFocus
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = theme.colors.gold.main }}
                onBlur={(e) => { e.target.style.borderColor = theme.colors.border.primary }}
              />
            </div>

            {/* Position */}
            <div style={{ marginBottom: theme.spacing.lg }}>
              <label style={labelStyle}>Position</label>
              <select
                value={newPlayerPosition}
                onChange={(e) => handlePositionChange(e.target.value)}
                style={selectStyle}
                onFocus={(e) => { e.target.style.borderColor = theme.colors.gold.main }}
                onBlur={(e) => { e.target.style.borderColor = theme.colors.border.primary }}
              >
                <option value="">Select position...</option>
                {positions.map((pos) => (
                  <option key={pos.key} value={pos.name}>{pos.name}</option>
                ))}
              </select>
              {positions.length === 0 && (
                <p style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.text.muted, marginTop: theme.spacing.xs }}>
                  No positions defined. Add positions in Club Methodology &gt; Positional Profiling.
                </p>
              )}
            </div>

            {/* Age and Gender row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
              <div>
                <label style={labelStyle}>Age</label>
                <input
                  type="number"
                  value={newPlayerAge}
                  onChange={(e) => setNewPlayerAge(e.target.value)}
                  placeholder="Age"
                  min="0"
                  max="99"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = theme.colors.gold.main }}
                  onBlur={(e) => { e.target.style.borderColor = theme.colors.border.primary }}
                />
              </div>
              <div>
                <label style={labelStyle}>Gender</label>
                <select
                  value={newPlayerGender}
                  onChange={(e) => setNewPlayerGender(e.target.value)}
                  style={selectStyle}
                  onFocus={(e) => { e.target.style.borderColor = theme.colors.gold.main }}
                  onBlur={(e) => { e.target.style.borderColor = theme.colors.border.primary }}
                >
                  <option value="">Not specified</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            {/* IDP Section - only show when position is selected */}
            {newPlayerPosition && (
            <div style={{ marginBottom: theme.spacing.lg }}>
              <h3 style={{ fontSize: theme.typography.fontSize.base, fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.text.primary, marginBottom: theme.spacing.md }}>
                Individual Development Plan (IDP)
              </h3>

              {selectedPositionAttributes.length === 0 ? (
                <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.text.muted, fontStyle: 'italic' }}>
                  No attributes defined for this position. Add attributes in Club Methodology &gt; Positional Profiling.
                </p>
              ) : (
                <>
                  {/* Target 1 */}
                  <div style={{ marginBottom: theme.spacing.md }}>
                    <label style={labelStyle}>Target 1</label>
                    <select
                      value={newPlayerTarget1}
                      onChange={(e) => setNewPlayerTarget1(e.target.value)}
                      style={selectStyle}
                      onFocus={(e) => { e.target.style.borderColor = theme.colors.gold.main }}
                      onBlur={(e) => { e.target.style.borderColor = theme.colors.border.primary }}
                    >
                      <option value="">Select target...</option>
                      {selectedPositionAttributes.map((attr) => (
                        <option key={attr} value={attr}>{getAttributeName(attr)}</option>
                      ))}
                      <option value={OTHER_OPTION}>Other (custom)</option>
                    </select>
                    {newPlayerTarget1 === OTHER_OPTION && (
                      <input
                        type="text"
                        value={customTarget1}
                        onChange={(e) => setCustomTarget1(e.target.value)}
                        placeholder="Enter custom target..."
                        style={{ ...inputStyle, marginTop: theme.spacing.sm }}
                        onFocus={(e) => { e.target.style.borderColor = theme.colors.gold.main }}
                        onBlur={(e) => { e.target.style.borderColor = theme.colors.border.primary }}
                      />
                    )}
                  </div>

                  {/* Target 2 */}
                  <div style={{ marginBottom: theme.spacing.md }}>
                    <label style={labelStyle}>Target 2</label>
                    <select
                      value={newPlayerTarget2}
                      onChange={(e) => setNewPlayerTarget2(e.target.value)}
                      style={selectStyle}
                      onFocus={(e) => { e.target.style.borderColor = theme.colors.gold.main }}
                      onBlur={(e) => { e.target.style.borderColor = theme.colors.border.primary }}
                    >
                      <option value="">Select target...</option>
                      {selectedPositionAttributes.map((attr) => (
                        <option key={attr} value={attr}>{getAttributeName(attr)}</option>
                      ))}
                      <option value={OTHER_OPTION}>Other (custom)</option>
                    </select>
                    {newPlayerTarget2 === OTHER_OPTION && (
                      <input
                        type="text"
                        value={customTarget2}
                        onChange={(e) => setCustomTarget2(e.target.value)}
                        placeholder="Enter custom target..."
                        style={{ ...inputStyle, marginTop: theme.spacing.sm }}
                        onFocus={(e) => { e.target.style.borderColor = theme.colors.gold.main }}
                        onBlur={(e) => { e.target.style.borderColor = theme.colors.border.primary }}
                      />
                    )}
                  </div>

                  {/* Target 3 */}
                  <div style={{ marginBottom: theme.spacing.md }}>
                    <label style={labelStyle}>Target 3</label>
                    <select
                      value={newPlayerTarget3}
                      onChange={(e) => setNewPlayerTarget3(e.target.value)}
                      style={selectStyle}
                      onFocus={(e) => { e.target.style.borderColor = theme.colors.gold.main }}
                      onBlur={(e) => { e.target.style.borderColor = theme.colors.border.primary }}
                    >
                      <option value="">Select target...</option>
                      {selectedPositionAttributes.map((attr) => (
                        <option key={attr} value={attr}>{getAttributeName(attr)}</option>
                      ))}
                      <option value={OTHER_OPTION}>Other (custom)</option>
                    </select>
                    {newPlayerTarget3 === OTHER_OPTION && (
                      <input
                        type="text"
                        value={customTarget3}
                        onChange={(e) => setCustomTarget3(e.target.value)}
                        placeholder="Enter custom target..."
                        style={{ ...inputStyle, marginTop: theme.spacing.sm }}
                        onFocus={(e) => { e.target.style.borderColor = theme.colors.gold.main }}
                        onBlur={(e) => { e.target.style.borderColor = theme.colors.border.primary }}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
            )}

            <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsAddModalOpen(false)}
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
                onClick={handleAddPlayer}
                disabled={!newPlayerName.trim() || isSaving}
                style={{
                  padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                  backgroundColor:
                    newPlayerName.trim() && !isSaving
                      ? theme.colors.gold.main
                      : theme.colors.text.disabled,
                  color: theme.colors.background.primary,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  cursor: newPlayerName.trim() && !isSaving ? 'pointer' : 'not-allowed',
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
                {isSaving ? 'Adding...' : 'Add Player'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
