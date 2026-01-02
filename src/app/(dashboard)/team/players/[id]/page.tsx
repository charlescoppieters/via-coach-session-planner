'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { FaEdit } from 'react-icons/fa'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import { useAuth } from '@/contexts/AuthContext'
import { getPlayer, updatePlayer, deletePlayer, getPlayerIDPs, updatePlayerIDPs } from '@/lib/players'
import {
  getPlayerIDPProgress,
  getPlayerAttendanceSummary,
  getPlayerIDPPriorities,
  getPlayerBlockRecommendations,
  getPlayerTrainingBalance,
  getRecentPlayerFeedbackNotes,
  type PlayerFeedbackNote,
} from '@/lib/playerAnalytics'
import type {
  PlayerIDP,
  PlayerIDPProgress,
  PlayerAttendanceSummary,
  PlayerIDPPriority,
  PlayerBlockRecommendation,
  PlayerTrainingBalance,
} from '@/types/database'
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

// Tab components
import { PlayerTabs, type PlayerTab } from '@/components/players/PlayerTabs'
import { PlayerDetailsTab } from '@/components/players/PlayerDetailsTab'
import { PlayerOverviewTab } from '@/components/players/PlayerOverviewTab'
import { PlayerDevelopmentTab } from '@/components/players/PlayerDevelopmentTab'
import { PlayerBalanceTab } from '@/components/players/PlayerBalanceTab'
import { PlayerFeedbackTab } from '@/components/players/PlayerFeedbackTab'
import { PlayerSessionsTab } from '@/components/players/PlayerSessionsTab'

interface PositionOption {
  key: string
  name: string
  inPossessionAttrs: string[]
  outOfPossessionAttrs: string[]
}

export default function PlayerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const playerId = params.id as string
  const { isAdmin, club } = useAuth()

  // Tab state - default to overview
  const [activeTab, setActiveTab] = useState<PlayerTab>('overview')

  const [player, setPlayer] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Positions from positional profiles
  const [positions, setPositions] = useState<PositionOption[]>([])
  // Attributes for IDP selection and display
  const [inPossessionAttributes, setInPossessionAttributes] = useState<SystemDefault[]>([])
  const [outOfPossessionAttributes, setOutOfPossessionAttributes] = useState<SystemDefault[]>([])

  // Form state
  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')

  // IDP state (using player_idps table)
  const [playerIDPs, setPlayerIDPs] = useState<PlayerIDP[]>([])
  const [editedIDPs, setEditedIDPs] = useState<Array<{ attribute_key: string; priority: number }>>([])

  // Analytics state
  const [idpProgress, setIdpProgress] = useState<PlayerIDPProgress[]>([])
  const [attendanceSummary, setAttendanceSummary] = useState<PlayerAttendanceSummary | null>(null)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)

  // Enhanced analytics state
  const [idpPriorities, setIdpPriorities] = useState<PlayerIDPPriority[] | null>(null)
  const [recentFeedback, setRecentFeedback] = useState<PlayerFeedbackNote[] | null>(null)
  const [blockRecommendations, setBlockRecommendations] = useState<PlayerBlockRecommendation[] | null>(null)
  const [trainingBalance, setTrainingBalance] = useState<PlayerTrainingBalance[] | null>(null)

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // IDP info tooltip
  const [showIdpInfo, setShowIdpInfo] = useState(false)

  // Attribute names map for display
  const attributeNames: Record<string, string> = {}
  inPossessionAttributes.forEach((attr) => {
    attributeNames[attr.key] = attr.value?.name || attr.key
  })
  outOfPossessionAttributes.forEach((attr) => {
    attributeNames[attr.key] = attr.value?.name || attr.key
  })

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

      // Fetch IDPs
      const { data: idpsData } = await getPlayerIDPs(playerId)
      if (idpsData) {
        setPlayerIDPs(idpsData)
        setEditedIDPs(idpsData.map(idp => ({
          attribute_key: idp.attribute_key,
          priority: idp.priority
        })))
      }
    }

    setIsLoading(false)
  }, [playerId])

  const fetchAnalytics = useCallback(async () => {
    if (!playerId) return

    setIsLoadingAnalytics(true)

    const [
      progressResult,
      attendanceResult,
      prioritiesResult,
      feedbackResult,
      recommendationsResult,
      balanceResult,
    ] = await Promise.all([
      getPlayerIDPProgress(playerId),
      getPlayerAttendanceSummary(playerId),
      getPlayerIDPPriorities(playerId),
      getRecentPlayerFeedbackNotes(playerId, 5), // Get recent 5 for overview
      getPlayerBlockRecommendations(playerId, 10),
      getPlayerTrainingBalance(playerId),
    ])

    if (progressResult.data) {
      setIdpProgress(progressResult.data)
    }

    if (attendanceResult.data) {
      setAttendanceSummary(attendanceResult.data)
    }

    if (prioritiesResult.data) {
      setIdpPriorities(prioritiesResult.data)
    }

    if (feedbackResult.data) {
      setRecentFeedback(feedbackResult.data)
    }

    if (recommendationsResult.data) {
      setBlockRecommendations(recommendationsResult.data)
    }

    if (balanceResult.data) {
      setTrainingBalance(balanceResult.data)
    }

    setIsLoadingAnalytics(false)
  }, [playerId])

  useEffect(() => {
    fetchPlayer()
  }, [fetchPlayer])

  // Fetch analytics when Overview, Development, Balance, or Sessions tab is selected
  useEffect(() => {
    const needsAnalytics = ['overview', 'development', 'balance', 'sessions'].includes(activeTab)
    if (needsAnalytics && idpProgress.length === 0) {
      fetchAnalytics()
    }
  }, [activeTab, fetchAnalytics, idpProgress.length])

  // IDP management functions
  const handleAddIDP = (attributeKey: string) => {
    if (editedIDPs.length >= 3) return
    if (editedIDPs.find(idp => idp.attribute_key === attributeKey)) return

    setEditedIDPs([...editedIDPs, {
      attribute_key: attributeKey,
      priority: editedIDPs.length + 1
    }])
  }

  const handleRemoveIDP = (attributeKey: string) => {
    const newIDPs = editedIDPs
      .filter(idp => idp.attribute_key !== attributeKey)
      .map((idp, idx) => ({ ...idp, priority: idx + 1 }))
    setEditedIDPs(newIDPs)
  }

  // Fetch positions from positional profiles
  const fetchPositions = useCallback(async () => {
    if (!club?.id || !player?.team_id) return

    // Get system defaults and attributes in parallel
    const [positionsRes, inPossRes, outPossRes] = await Promise.all([
      getSystemDefaults('positions'),
      getInPossessionAttributes(),
      getOutOfPossessionAttributes(),
    ])

    // First try to get team-level positional profiles
    let profilesRes = await getTeamPositionalProfiles(club.id, player.team_id)

    // Fall back to club-level profiles if team has none
    if (!profilesRes.data || profilesRes.data.length === 0) {
      profilesRes = await getClubPositionalProfiles(club.id)
    }

    const profiles = profilesRes.data
    const systemPositions = positionsRes.data

    // Store attributes for display name lookups
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

      // Map profiles to position options (including attributes)
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
  }, [club?.id, player?.team_id])

  useEffect(() => {
    fetchPositions()
  }, [fetchPositions])

  // Track changes - compare what would be saved with stored values
  useEffect(() => {
    if (!player) return

    // Compare basic fields
    const basicFieldsChanged =
      name !== player.name ||
      position !== (player.position || '') ||
      age !== (player.age?.toString() || '') ||
      gender !== (player.gender || '')

    // Compare IDPs
    const idpsChanged = JSON.stringify(editedIDPs.map(i => i.attribute_key).sort()) !==
      JSON.stringify(playerIDPs.map(i => i.attribute_key).sort())

    setHasChanges(basicFieldsChanged || idpsChanged)
  }, [player, name, position, age, gender, editedIDPs, playerIDPs])

  const handleSave = async () => {
    if (!player || !name.trim()) return

    setIsSaving(true)
    setError('')

    // Update basic player info
    const { error } = await updatePlayer(player.id, {
      name: name.trim(),
      position: position.trim() || null,
      age: age ? parseInt(age) : null,
      gender: gender.trim() || null,
    })

    if (error) {
      setError('Failed to save changes')
      console.error('Error updating player:', error)
    } else {
      // Update IDPs if changed
      const idpsChanged = JSON.stringify(editedIDPs.map(i => i.attribute_key).sort()) !==
        JSON.stringify(playerIDPs.map(i => i.attribute_key).sort())

      if (idpsChanged && editedIDPs.length > 0) {
        await updatePlayerIDPs(player.id, editedIDPs)
      }

      await fetchPlayer()
      // Refresh analytics if IDPs changed
      if (idpsChanged) {
        setIdpProgress([])
        setIdpPriorities(null)
        setRecentFeedback(null)
        setBlockRecommendations(null)
        setTrainingBalance(null)
        fetchAnalytics()
      }
      setIsEditing(false)
    }

    setIsSaving(false)
  }

  const handleCancelEdit = () => {
    // Reset form to original values
    if (player) {
      setName(player.name)
      setPosition(player.position || '')
      setAge(player.age?.toString() || '')
      setGender(player.gender || '')

      // Reset IDPs to original values
      setEditedIDPs(playerIDPs.map(idp => ({
        attribute_key: idp.attribute_key,
        priority: idp.priority
      })))
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Fixed Header Section */}
      <div
        style={{
          flexShrink: 0,
          backgroundColor: theme.colors.background.secondary,
          paddingTop: theme.spacing.lg,
          paddingLeft: theme.spacing.xl,
          paddingRight: theme.spacing.xl,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: theme.spacing.lg,
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
        {/* Edit / Save / Cancel Buttons - Only show on Details tab */}
        {activeTab === 'details' && !isEditing ? (
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
        ) : activeTab === 'details' && isEditing ? (
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
        ) : null}
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
              marginBottom: theme.spacing.md,
            }}
          >
            {error}
          </div>
        )}

        {/* Tabs */}
        <PlayerTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Scrollable Tab Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: theme.spacing.xl,
        }}
      >
        {activeTab === 'details' && (
          <PlayerDetailsTab
            player={player}
            isEditing={isEditing}
            isSaving={isSaving}
            hasChanges={hasChanges}
            isAdmin={isAdmin}
            name={name}
            position={position}
            age={age}
            gender={gender}
            playerIDPs={playerIDPs}
            editedIDPs={editedIDPs}
            positions={positions}
            inPossessionAttributes={inPossessionAttributes.map(attr => ({
              key: attr.key,
              value: { name: attr.value?.name || attr.key }
            }))}
            outOfPossessionAttributes={outOfPossessionAttributes.map(attr => ({
              key: attr.key,
              value: { name: attr.value?.name || attr.key }
            }))}
            onNameChange={setName}
            onPositionChange={setPosition}
            onAgeChange={setAge}
            onGenderChange={setGender}
            onAddIDP={handleAddIDP}
            onRemoveIDP={handleRemoveIDP}
            onDeleteClick={() => setShowDeleteConfirm(true)}
            showIdpInfo={showIdpInfo}
            onIdpInfoEnter={() => setShowIdpInfo(true)}
            onIdpInfoLeave={() => setShowIdpInfo(false)}
          />
        )}

        {activeTab === 'overview' && (
          <PlayerOverviewTab
            attendanceSummary={attendanceSummary}
            idpPriorities={idpPriorities}
            blockRecommendations={blockRecommendations}
            recentFeedback={recentFeedback}
            attributeNames={attributeNames}
            isLoading={isLoadingAnalytics}
          />
        )}

        {activeTab === 'development' && (
          <PlayerDevelopmentTab
            idpProgress={idpProgress}
            attributeNames={attributeNames}
            isLoading={isLoadingAnalytics}
            playerId={playerId}
            idpPriorities={idpPriorities}
          />
        )}

        {activeTab === 'balance' && (
          <PlayerBalanceTab
            trainingBalance={trainingBalance}
            isLoading={isLoadingAnalytics}
          />
        )}

        {activeTab === 'feedback' && (
          <PlayerFeedbackTab
            playerId={playerId}
            attributeNames={attributeNames}
          />
        )}

        {activeTab === 'sessions' && (
          <PlayerSessionsTab
            playerId={playerId}
            attendanceSummary={attendanceSummary}
            attributeNames={attributeNames}
          />
        )}
      </div>

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
