'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { IoSettingsOutline } from 'react-icons/io5'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import {
  getClubPositionalProfiles,
  getSystemDefaults,
  createPositionalProfile,
  updatePositionalProfile,
  type PositionalProfile,
  type SystemDefault,
} from '@/lib/methodology'

// Position sort order: goalkeeper → defensive → midfield → attacking
const POSITION_SORT_ORDER: Record<string, number> = {
  goalkeeper: 1,
  sweeper_keeper: 2,
  centre_back: 10,
  ball_playing_cb: 11,
  full_back: 12,
  inverted_fullback: 13,
  defensive_fullback: 14,
  wing_back: 15,
  defensive_midfielder: 20,
  regista: 21,
  central_midfielder: 30,
  box_to_box: 31,
  deep_lying_playmaker: 32,
  mezzala: 33,
  attacking_midfielder: 40,
  trequartista: 41,
  enganche: 42,
  winger: 50,
  inside_forward: 51,
  inverted_winger: 52,
  striker: 60,
  false_nine: 61,
  target_man: 62,
  poacher: 63,
  complete_forward: 64,
  second_striker: 65,
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
  const [attributes, setAttributes] = useState<SystemDefault[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Manage positions modal
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({})
  const [isSavingPositions, setIsSavingPositions] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)

    const [positionsRes, attributesRes, profilesRes] = await Promise.all([
      getSystemDefaults('positions'),
      getSystemDefaults('attributes'),
      getClubPositionalProfiles(clubId),
    ])

    if (positionsRes.error) setError(positionsRes.error)
    if (attributesRes.error) setError(attributesRes.error)
    if (profilesRes.error) setError(profilesRes.error)

    if (positionsRes.data) setPositions(positionsRes.data)
    if (attributesRes.data) setAttributes(attributesRes.data)
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
        const position = positions.find(p => p.key === positionKey)
        const defaultAttrs = position?.value?.default_attributes || []
        await createPositionalProfile(clubId, positionKey, defaultAttrs.slice(0, 5))
      }
    }

    await fetchData()
    setIsSavingPositions(false)
    setIsManageModalOpen(false)
  }

  const handleAttributeChange = async (profileId: string, index: number, newValue: string) => {
    const profile = profiles.find(p => p.id === profileId)
    if (!profile) return

    const newAttributes = [...(profile.attributes || [])]

    while (newAttributes.length <= index) {
      newAttributes.push('')
    }

    newAttributes[index] = newValue

    // Optimistically update local state
    setProfiles(prev =>
      prev.map(p => (p.id === profileId ? { ...p, attributes: newAttributes } : p))
    )

    const filteredAttrs = newAttributes.filter(a => a !== '')
    await updatePositionalProfile(profileId, { attributes: filteredAttrs })
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
        Define key attributes for each position in your system. AI uses these to understand
        player development priorities and provide personalized insights.
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
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.md,
          marginTop: theme.spacing.xl,
          minHeight: '320px',
          maxHeight: '320px',
          overflowY: 'auto',
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
          activeProfiles.map(profile => (
            <div
              key={profile.id}
              style={{
                backgroundColor: theme.colors.background.primary,
                border: `1px solid ${theme.colors.border.primary}`,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.lg,
              }}
            >
              <h3
                style={{
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.xs,
                }}
              >
                {getPositionName(profile.position_key)}
              </h3>
              <p
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.md,
                }}
              >
                {getPositionDescription(profile.position_key)}
              </p>

              <div
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text.muted,
                  marginBottom: theme.spacing.sm,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Priority Attributes
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: theme.spacing.sm,
                }}
              >
                {[0, 1, 2, 3, 4].map(index => {
                  const currentValue = profile.attributes?.[index] || ''
                  return (
                    <select
                      key={index}
                      value={currentValue}
                      onChange={e => handleAttributeChange(profile.id, index, e.target.value)}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: theme.colors.background.tertiary,
                        color: currentValue ? theme.colors.text.primary : theme.colors.text.secondary,
                        border: `1px solid ${theme.colors.border.primary}`,
                        borderRadius: theme.borderRadius.md,
                        fontSize: theme.typography.fontSize.sm,
                        cursor: 'pointer',
                        flex: 1,
                        minWidth: '120px',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 10px center',
                      }}
                    >
                      <option value="">Select</option>
                      {attributes.map(attr => (
                        <option key={attr.key} value={attr.key}>
                          {attr.value?.name || attr.key}
                        </option>
                      ))}
                    </select>
                  )
                })}
              </div>
            </div>
          ))
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
    </div>
  )
}
