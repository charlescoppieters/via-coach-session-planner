'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { IoSettingsOutline } from 'react-icons/io5'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import {
  getClubPositionalProfiles,
  getSystemDefaults,
  getInPossessionAttributes,
  getOutOfPossessionAttributes,
  createPositionalProfile,
  updatePositionalProfile,
  normalizeProfileAttributes,
  type PositionalProfile,
  type SystemDefault,
  type PositionalProfileAttributes,
} from '@/lib/methodology'
import { PositionCard } from '@/components/methodology/PositionCard'
import { PositionEditModal } from '@/components/methodology/PositionEditModal'

// Position sort order: goalkeeper → defensive → midfield → attacking
const POSITION_SORT_ORDER: Record<string, number> = {
  // Default positions
  gk: 1,
  fullback: 10,
  centre_back: 11,
  midfielder: 20,
  winger: 30,
  striker: 40,
  // Advanced positions
  wide_attacker: 31,
  centre_forward: 41,
  inverted_fb: 12,
  attacking_fb: 13,
  defensive_fb: 14,
  number_6: 21,
  number_8: 22,
  number_10: 23,
  inside_forward: 32,
  poacher: 42,
  target_man: 43,
  complete_striker: 44,
}

interface PositionalProfilingStepProps {
  clubId: string
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

export const PositionalProfilingStep: React.FC<PositionalProfilingStepProps> = ({
  clubId,
  onNext,
  onBack,
  onSkip,
}) => {
  const [profiles, setProfiles] = useState<PositionalProfile[]>([])
  const [positions, setPositions] = useState<SystemDefault[]>([])
  const [inPossessionAttributes, setInPossessionAttributes] = useState<SystemDefault[]>([])
  const [outOfPossessionAttributes, setOutOfPossessionAttributes] = useState<SystemDefault[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Manage positions modal
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({})
  const [isSavingPositions, setIsSavingPositions] = useState(false)

  // Edit modal state
  const [editingProfile, setEditingProfile] = useState<PositionalProfile | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)

    const [positionsRes, inPossRes, outPossRes, profilesRes] = await Promise.all([
      getSystemDefaults('positions'),
      getInPossessionAttributes(),
      getOutOfPossessionAttributes(),
      getClubPositionalProfiles(clubId),
    ])

    if (positionsRes.error) setError(positionsRes.error)
    if (inPossRes.error) setError(inPossRes.error)
    if (outPossRes.error) setError(outPossRes.error)
    if (profilesRes.error) setError(profilesRes.error)

    if (positionsRes.data) setPositions(positionsRes.data)
    if (inPossRes.data) setInPossessionAttributes(inPossRes.data)
    if (outPossRes.data) setOutOfPossessionAttributes(outPossRes.data)
    if (profilesRes.data) setProfiles(profilesRes.data)

    setIsLoading(false)
  }, [clubId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleOpenManageModal = () => {
    const changes: Record<string, boolean> = {}
    positions.forEach(pos => {
      const profile = profiles.find(p => p.position_key === pos.key)
      changes[pos.key] = profile?.is_active ?? false
    })
    setPendingChanges(changes)
    setIsManageModalOpen(true)
  }

  const handleTogglePosition = (positionKey: string) => {
    setPendingChanges(prev => ({
      ...prev,
      [positionKey]: !prev[positionKey],
    }))
  }

  const handleSavePositions = async () => {
    setIsSavingPositions(true)
    setError('')

    for (const [positionKey, isActive] of Object.entries(pendingChanges)) {
      const existingProfile = profiles.find(p => p.position_key === positionKey)

      if (existingProfile) {
        if (existingProfile.is_active !== isActive) {
          await updatePositionalProfile(existingProfile.id, { is_active: isActive })
        }
      } else if (isActive) {
        // Create new profile with position-specific defaults (handled by createPositionalProfile)
        await createPositionalProfile(clubId, positionKey)
      }
    }

    await fetchData()
    setIsSavingPositions(false)
    setIsManageModalOpen(false)
  }

  const handleEditProfile = (profile: PositionalProfile) => {
    setEditingProfile(profile)
  }

  const handleSaveProfileAttributes = async (attributes: PositionalProfileAttributes) => {
    if (!editingProfile) return

    setIsSavingProfile(true)
    await updatePositionalProfile(editingProfile.id, { attributes })

    // Update local state
    setProfiles(prev =>
      prev.map(p => (p.id === editingProfile.id ? { ...p, attributes } : p))
    )

    setIsSavingProfile(false)
    setEditingProfile(null)
  }

  const getPositionName = (key: string) => {
    const position = positions.find(p => p.key === key)
    return position?.value?.name || key
  }

  const getPositionDescription = (key: string) => {
    const position = positions.find(p => p.key === key)
    return position?.value?.description || ''
  }

  const activeProfiles = profiles
    .filter(p => p.is_active)
    .sort((a, b) => {
      const orderA = POSITION_SORT_ORDER[a.position_key] ?? 999
      const orderB = POSITION_SORT_ORDER[b.position_key] ?? 999
      return orderA - orderB
    })

  const standardPositions = positions.filter(p => !p.value?.is_advanced)
  const advancedPositions = positions.filter(p => p.value?.is_advanced)

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: theme.spacing.xl,
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <h2
        style={{
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.sm,
          textAlign: 'center',
        }}
      >
        Positional Profiling
      </h2>
      <p
        style={{
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.lg,
          textAlign: 'center',
          lineHeight: '1.6',
          maxWidth: '600px',
          margin: '0 auto',
          marginTop: theme.spacing.sm,
        }}
      >
        Define key attributes for each position in your system. Each position has in-possession
        and out-of-possession attributes that guide player development.
      </p>

      {/* Manage Positions Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: theme.spacing.lg }}>
        <button
          onClick={handleOpenManageModal}
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
          <IoSettingsOutline size={16} />
          Manage Positions
        </button>
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
            marginTop: theme.spacing.lg,
          }}
        >
          {error}
        </div>
      )}

      {/* Positions List */}
      <div
        style={{
          marginTop: theme.spacing.xl,
          minHeight: '320px',
          maxHeight: '320px',
          overflowY: 'auto',
          paddingRight: theme.spacing.sm,
        }}
      >
        {activeProfiles.length === 0 ? (
          <div
            style={{
              backgroundColor: theme.colors.background.primary,
              border: `1px solid ${theme.colors.border.primary}`,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.xl,
              textAlign: 'center',
            }}
          >
            <p style={{ color: theme.colors.text.secondary }}>
              No positions configured. Click &quot;Manage Positions&quot; to add positions.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing.md,
            }}
          >
            {activeProfiles.map(profile => (
              <PositionCard
                key={profile.id}
                positionName={getPositionName(profile.position_key)}
                description={getPositionDescription(profile.position_key)}
                onEdit={() => handleEditProfile(profile)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: theme.spacing.md,
          marginTop: theme.spacing.xl,
        }}
      >
        <button
          onClick={onBack}
          style={{
            padding: `${theme.spacing.md} ${theme.spacing.xl}`,
            backgroundColor: theme.colors.background.primary,
            color: theme.colors.text.primary,
            border: `2px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            cursor: 'pointer',
            transition: theme.transitions.fast,
          }}
        >
          Back
        </button>

        <button
          onClick={onSkip}
          style={{
            padding: `${theme.spacing.md} ${theme.spacing.xl}`,
            backgroundColor: 'transparent',
            color: theme.colors.text.secondary,
            border: `1px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.base,
            cursor: 'pointer',
            transition: theme.transitions.fast,
          }}
        >
          Skip
        </button>

        <button
          onClick={onNext}
          style={{
            padding: `${theme.spacing.md} ${theme.spacing.xl}`,
            backgroundColor: theme.colors.gold.main,
            color: theme.colors.background.primary,
            border: 'none',
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            cursor: 'pointer',
            transition: theme.transitions.fast,
          }}
        >
          Next
        </button>
      </div>

      {/* Skip note */}
      <p
        style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.muted,
          textAlign: 'center',
          marginTop: theme.spacing.lg,
          fontStyle: 'italic',
        }}
      >
        You can configure this later in Club Methodology
      </p>

      {/* Manage Positions Modal */}
      {isManageModalOpen && (
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
          onClick={() => setIsManageModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: theme.colors.background.primary,
              borderRadius: theme.borderRadius.lg,
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: theme.spacing.xl,
                borderBottom: `1px solid ${theme.colors.border.primary}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2
                style={{
                  fontSize: theme.typography.fontSize.xl,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.text.primary,
                }}
              >
                Select Positions
              </h2>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                  }}
                >
                  Advanced
                </span>
                <div
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{
                    width: '44px',
                    height: '24px',
                    backgroundColor: showAdvanced
                      ? theme.colors.gold.main
                      : theme.colors.background.tertiary,
                    borderRadius: '12px',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: theme.transitions.fast,
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: theme.colors.text.primary,
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '2px',
                      left: showAdvanced ? '22px' : '2px',
                      transition: theme.transitions.fast,
                    }}
                  />
                </div>
              </label>
            </div>

            {/* Modal Content */}
            <div
              style={{
                padding: theme.spacing.xl,
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {/* Standard Positions */}
              {standardPositions.map(position => (
                <div
                  key={position.key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: `${theme.spacing.md} 0`,
                    borderBottom: `1px solid ${theme.colors.border.primary}`,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: theme.typography.fontSize.base,
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: theme.colors.text.primary,
                        marginBottom: theme.spacing.xs,
                      }}
                    >
                      {position.value?.name || position.key}
                    </div>
                    <div
                      style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.text.secondary,
                      }}
                    >
                      {position.value?.description || ''}
                    </div>
                  </div>
                  <div
                    onClick={() => handleTogglePosition(position.key)}
                    style={{
                      width: '44px',
                      height: '24px',
                      backgroundColor: pendingChanges[position.key]
                        ? theme.colors.gold.main
                        : theme.colors.background.tertiary,
                      borderRadius: '12px',
                      position: 'relative',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: theme.transitions.fast,
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: theme.colors.text.primary,
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: pendingChanges[position.key] ? '22px' : '2px',
                        transition: theme.transitions.fast,
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Advanced Positions */}
              {showAdvanced && advancedPositions.length > 0 && (
                <>
                  <div
                    style={{
                      marginTop: theme.spacing.xl,
                      marginBottom: theme.spacing.md,
                      paddingBottom: theme.spacing.md,
                      borderBottom: `1px solid ${theme.colors.border.primary}`,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: theme.typography.fontSize.lg,
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: theme.colors.gold.main,
                      }}
                    >
                      Advanced Positions
                    </h3>
                  </div>

                  {advancedPositions.map(position => (
                    <div
                      key={position.key}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        padding: `${theme.spacing.md} 0`,
                        borderBottom: `1px solid ${theme.colors.border.primary}`,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: theme.typography.fontSize.base,
                            fontWeight: theme.typography.fontWeight.semibold,
                            color: theme.colors.text.primary,
                            marginBottom: theme.spacing.xs,
                          }}
                        >
                          {position.value?.name || position.key}
                        </div>
                        <div
                          style={{
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.text.secondary,
                          }}
                        >
                          {position.value?.description || ''}
                        </div>
                      </div>
                      <div
                        onClick={() => handleTogglePosition(position.key)}
                        style={{
                          width: '44px',
                          height: '24px',
                          backgroundColor: pendingChanges[position.key]
                            ? theme.colors.gold.main
                            : theme.colors.background.tertiary,
                          borderRadius: '12px',
                          position: 'relative',
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: theme.transitions.fast,
                        }}
                      >
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: theme.colors.text.primary,
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '2px',
                            left: pendingChanges[position.key] ? '22px' : '2px',
                            transition: theme.transitions.fast,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: theme.spacing.xl,
                borderTop: `1px solid ${theme.colors.border.primary}`,
                display: 'flex',
                gap: theme.spacing.md,
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => setIsManageModalOpen(false)}
                disabled={isSavingPositions}
                style={{
                  padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                  backgroundColor: theme.colors.background.tertiary,
                  color: theme.colors.text.primary,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  cursor: isSavingPositions ? 'not-allowed' : 'pointer',
                  opacity: isSavingPositions ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePositions}
                disabled={isSavingPositions}
                style={{
                  padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                  backgroundColor: theme.colors.gold.main,
                  color: theme.colors.background.primary,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  cursor: isSavingPositions ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                }}
              >
                {isSavingPositions && (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-flex' }}
                  >
                    <CgSpinnerAlt size={16} />
                  </motion.span>
                )}
                {isSavingPositions ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Position Edit Modal */}
      {editingProfile && (
        <PositionEditModal
          positionName={getPositionName(editingProfile.position_key)}
          positionDescription={getPositionDescription(editingProfile.position_key)}
          attributes={normalizeProfileAttributes(editingProfile.attributes)}
          inPossessionOptions={inPossessionAttributes}
          outOfPossessionOptions={outOfPossessionAttributes}
          onSave={handleSaveProfileAttributes}
          onClose={() => setEditingProfile(null)}
          isSaving={isSavingProfile}
        />
      )}
    </div>
  )
}
