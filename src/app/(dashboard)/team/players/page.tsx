'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FaPlus, FaSearch, FaUser } from 'react-icons/fa'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import { useAuth } from '@/contexts/AuthContext'
import { useTeam } from '@/contexts/TeamContext'
import { getPlayers, createPlayer, createPlayerIDPs } from '@/lib/players'
import {
  getClubPositionalProfiles,
  getTeamPositionalProfiles,
  getSystemDefaults,
  getInPossessionAttributes,
  getOutOfPossessionAttributes,
  type PositionalProfile,
  type SystemDefault,
} from '@/lib/methodology'
import type { Player } from '@/types/database'
import { isPositionalProfileAttributesV2 } from '@/types/database'

interface PositionOption {
  key: string
  name: string
  inPossessionAttrs: string[]
  outOfPossessionAttrs: string[]
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
  // Attributes for IDP selection
  const [inPossessionAttributes, setInPossessionAttributes] = useState<SystemDefault[]>([])
  const [outOfPossessionAttributes, setOutOfPossessionAttributes] = useState<SystemDefault[]>([])

  // Add player modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newPlayerPosition, setNewPlayerPosition] = useState('')
  const [newPlayerAge, setNewPlayerAge] = useState('')
  const [newPlayerGender, setNewPlayerGender] = useState('')
  const [selectedIDPs, setSelectedIDPs] = useState<Array<{ attribute_key: string; priority: number }>>([])
  const [isSaving, setIsSaving] = useState(false)

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
    const inPossAttr = inPossessionAttributes.find((a) => a.key === key)
    if (inPossAttr) return inPossAttr.value?.name || key

    const outPossAttr = outOfPossessionAttributes.find((a) => a.key === key)
    if (outPossAttr) return outPossAttr.value?.name || key

    return key
  }

  // Fetch positions from positional profiles
  const fetchPositions = useCallback(async () => {
    if (!club?.id || !selectedTeamId) return

    // Get system defaults and attributes in parallel
    const [positionsRes, inPossRes, outPossRes] = await Promise.all([
      getSystemDefaults('positions'),
      getInPossessionAttributes(),
      getOutOfPossessionAttributes(),
    ])

    // First try to get team-level positional profiles
    let profilesRes = await getTeamPositionalProfiles(club.id, selectedTeamId)

    // Fall back to club-level profiles if team has none
    if (!profilesRes.data || profilesRes.data.length === 0) {
      profilesRes = await getClubPositionalProfiles(club.id)
    }

    const profiles = profilesRes.data
    const systemPositions = positionsRes.data

    // Store attributes for IDP selection
    if (inPossRes.data) {
      setInPossessionAttributes(inPossRes.data)
    }
    if (outPossRes.data) {
      setOutOfPossessionAttributes(outPossRes.data)
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
        .map((profile: PositionalProfile) => {
          // Handle v2 attribute structure
          let inPoss: string[] = []
          let outPoss: string[] = []

          if (isPositionalProfileAttributesV2(profile.attributes)) {
            inPoss = profile.attributes.in_possession || []
            outPoss = profile.attributes.out_of_possession || []
          } else if (Array.isArray(profile.attributes)) {
            // Legacy v1: put all in in_possession
            inPoss = profile.attributes
          }

          return {
            key: profile.position_key,
            name: profile.custom_position_name || positionMap.get(profile.position_key) || profile.position_key,
            inPossessionAttrs: inPoss,
            outOfPossessionAttrs: outPoss,
          }
        })

      setPositions(positionOptions)
    }
  }, [club?.id, selectedTeamId])

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

  // IDP management functions
  const handleAddIDP = (attributeKey: string) => {
    if (selectedIDPs.length >= 3) return
    if (selectedIDPs.find(idp => idp.attribute_key === attributeKey)) return

    setSelectedIDPs([...selectedIDPs, {
      attribute_key: attributeKey,
      priority: selectedIDPs.length + 1
    }])
  }

  const handleRemoveIDP = (attributeKey: string) => {
    const newIDPs = selectedIDPs
      .filter(idp => idp.attribute_key !== attributeKey)
      .map((idp, idx) => ({ ...idp, priority: idx + 1 }))
    setSelectedIDPs(newIDPs)
  }

  // Open modal with auto-filled values
  const openAddModal = () => {
    setNewPlayerName('')
    setNewPlayerPosition('')
    setNewPlayerAge(selectedTeam?.age_group ? parseAgeFromAgeGroup(selectedTeam.age_group) : '')
    // For Co-Ed teams, leave gender blank so coach can pick per player
    const teamGender = selectedTeam?.gender
    setNewPlayerGender(teamGender === 'Male' || teamGender === 'Female' ? teamGender : '')
    setSelectedIDPs([])
    setIsAddModalOpen(true)
  }

  // Reset IDPs when position changes
  const handlePositionChange = (newPosition: string) => {
    setNewPlayerPosition(newPosition)
    // Clear IDPs when position changes since attributes are different
    setSelectedIDPs([])
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
    })

    if (error) {
      setError('Failed to add player')
      console.error('Error creating player:', error)
    } else if (data) {
      // Create IDPs for the new player
      if (selectedIDPs.length > 0) {
        await createPlayerIDPs(data.id, selectedIDPs)
      }

      await fetchPlayers()
      setIsAddModalOpen(false)
      // Navigate to the new player's detail page
      router.push(`/team/players/${data.id}`)
    }

    setIsSaving(false)
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
            // Note: IDP count now requires separate fetch from player_idps table
            // For list view, we'll show "View" to encourage clicking for full details
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
                    backgroundColor: theme.colors.background.tertiary,
                    borderRadius: theme.borderRadius.md,
                    color: theme.colors.text.muted,
                    fontSize: theme.typography.fontSize.sm,
                  }}
                >
                  View IDPs →
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

              {(() => {
                // Find the selected position and get its attributes
                const selectedPosition = positions.find(p => p.name === newPlayerPosition)
                const positionInPossAttrs = selectedPosition?.inPossessionAttrs || []
                const positionOutPossAttrs = selectedPosition?.outOfPossessionAttrs || []
                const totalAttrs = positionInPossAttrs.length + positionOutPossAttrs.length

                if (totalAttrs === 0) {
                  return (
                    <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.text.muted, fontStyle: 'italic' }}>
                      No attributes defined for this position. Add attributes in Club Methodology &gt; Positional Profiling.
                    </p>
                  )
                }
                return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                {/* Selected IDPs */}
                {selectedIDPs.map((idp, index) => (
                  <div
                    key={idp.attribute_key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.md,
                      padding: theme.spacing.md,
                      backgroundColor: theme.colors.background.primary,
                      borderRadius: theme.borderRadius.md,
                      border: `1px solid ${theme.colors.border.primary}`,
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: theme.colors.gold.main,
                      color: theme.colors.background.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: theme.typography.fontWeight.bold,
                      fontSize: theme.typography.fontSize.sm,
                      flexShrink: 0,
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1, color: theme.colors.text.primary }}>
                      {getAttributeName(idp.attribute_key)}
                    </div>
                    <button
                      onClick={() => handleRemoveIDP(idp.attribute_key)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: theme.colors.status.error,
                        cursor: 'pointer',
                        fontSize: theme.typography.fontSize.lg,
                        padding: theme.spacing.xs,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}

                {/* Add IDP Dropdown */}
                {selectedIDPs.length < 3 && (
                  <div>
                    {(() => {
                      // Get available in-possession attributes for this position
                      const availableInPoss = inPossessionAttributes
                        .filter(attr => positionInPossAttrs.includes(attr.key))
                        .filter(attr => !selectedIDPs.find(idp => idp.attribute_key === attr.key))

                      // Get available out-of-possession attributes for this position
                      const availableOutPoss = outOfPossessionAttributes
                        .filter(attr => positionOutPossAttrs.includes(attr.key))
                        .filter(attr => !selectedIDPs.find(idp => idp.attribute_key === attr.key))

                      const totalAvailable = availableInPoss.length + availableOutPoss.length

                      return (
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddIDP(e.target.value)
                            }
                          }}
                          disabled={totalAvailable === 0}
                          style={{
                            ...selectStyle,
                            opacity: totalAvailable === 0 ? 0.5 : 1,
                            cursor: totalAvailable === 0 ? 'not-allowed' : 'pointer',
                          }}
                          onFocus={(e) => { e.target.style.borderColor = theme.colors.gold.main }}
                          onBlur={(e) => { e.target.style.borderColor = theme.colors.border.primary }}
                        >
                          <option value="">
                            {totalAvailable === 0
                              ? 'All position attributes selected'
                              : `+ Add Development Target (${3 - selectedIDPs.length} remaining)`}
                          </option>
                          {availableInPoss.length > 0 && (
                            <optgroup label="In Possession">
                              {availableInPoss.map(attr => (
                                <option key={attr.key} value={attr.key}>
                                  {attr.value?.name || attr.key}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {availableOutPoss.length > 0 && (
                            <optgroup label="Out of Possession">
                              {availableOutPoss.map(attr => (
                                <option key={attr.key} value={attr.key}>
                                  {attr.value?.name || attr.key}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      )
                    })()}
                  </div>
                )}

                {selectedIDPs.length === 0 && (
                  <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.text.muted, fontStyle: 'italic' }}>
                    Select up to 3 development targets for this player
                  </p>
                )}
              </div>
                )
              })()}
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
