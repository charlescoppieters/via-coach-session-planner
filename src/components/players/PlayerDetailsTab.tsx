'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { FaTrash, FaQuestionCircle } from 'react-icons/fa'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import type { Player, PlayerIDP } from '@/types/database'

interface PositionOption {
  key: string
  name: string
  inPossessionAttrs: string[]
  outOfPossessionAttrs: string[]
}

interface SystemAttribute {
  key: string
  value: { name: string }
}

interface PlayerDetailsTabProps {
  player: Player
  isEditing: boolean
  isSaving: boolean
  hasChanges: boolean
  isAdmin: boolean
  // Form values
  name: string
  position: string
  age: string
  gender: string
  // IDPs
  playerIDPs: PlayerIDP[]
  editedIDPs: Array<{ attribute_key: string; priority: number }>
  // Options
  positions: PositionOption[]
  inPossessionAttributes: SystemAttribute[]
  outOfPossessionAttributes: SystemAttribute[]
  // Callbacks
  onNameChange: (value: string) => void
  onPositionChange: (value: string) => void
  onAgeChange: (value: string) => void
  onGenderChange: (value: string) => void
  onAddIDP: (attributeKey: string) => void
  onRemoveIDP: (attributeKey: string) => void
  onDeleteClick: () => void
  // Tooltip state
  showIdpInfo: boolean
  onIdpInfoEnter: () => void
  onIdpInfoLeave: () => void
}

export const PlayerDetailsTab: React.FC<PlayerDetailsTabProps> = ({
  player,
  isEditing,
  isSaving,
  isAdmin,
  name,
  position,
  age,
  gender,
  playerIDPs,
  editedIDPs,
  positions,
  inPossessionAttributes,
  outOfPossessionAttributes,
  onNameChange,
  onPositionChange,
  onAgeChange,
  onGenderChange,
  onAddIDP,
  onRemoveIDP,
  onDeleteClick,
  showIdpInfo,
  onIdpInfoEnter,
  onIdpInfoLeave,
}) => {
  const getAttributeName = (key: string): string => {
    const inPossAttr = inPossessionAttributes.find((a) => a.key === key)
    if (inPossAttr) return inPossAttr.value?.name || key

    const outPossAttr = outOfPossessionAttributes.find((a) => a.key === key)
    if (outPossAttr) return outPossAttr.value?.name || key

    return key
  }

  return (
    <div>
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
              onChange={(e) => onNameChange(e.target.value)}
              disabled={!isEditing}
              style={{
                width: '100%',
                padding: isEditing ? theme.spacing.md : 0,
                backgroundColor: isEditing
                  ? theme.colors.background.primary
                  : 'transparent',
                color: theme.colors.text.primary,
                border: isEditing
                  ? `2px solid ${theme.colors.border.primary}`
                  : 'none',
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.base,
                outline: 'none',
                cursor: isEditing ? 'text' : 'default',
              }}
              onFocus={(e) => {
                if (isEditing)
                  e.target.style.borderColor = theme.colors.gold.main
              }}
              onBlur={(e) => {
                if (isEditing)
                  e.target.style.borderColor = theme.colors.border.primary
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
                onChange={(e) => onPositionChange(e.target.value)}
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
              <div
                style={{
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.text.primary,
                }}
              >
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
              onChange={(e) => onAgeChange(e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., 14"
              min="0"
              max="99"
              style={{
                width: '100%',
                padding: isEditing ? theme.spacing.md : 0,
                backgroundColor: isEditing
                  ? theme.colors.background.primary
                  : 'transparent',
                color: theme.colors.text.primary,
                border: isEditing
                  ? `2px solid ${theme.colors.border.primary}`
                  : 'none',
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.base,
                outline: 'none',
                cursor: isEditing ? 'text' : 'default',
              }}
              onFocus={(e) => {
                if (isEditing)
                  e.target.style.borderColor = theme.colors.gold.main
              }}
              onBlur={(e) => {
                if (isEditing)
                  e.target.style.borderColor = theme.colors.border.primary
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
                onChange={(e) => onGenderChange(e.target.value)}
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
              <div
                style={{
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.text.primary,
                }}
              >
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
            onMouseEnter={onIdpInfoEnter}
            onMouseLeave={onIdpInfoLeave}
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
                  IDP targets are development focus areas for this player. These
                  come from attributes defined in your Positional Profiling
                  within Team Methodology. You can set up to 3 targets per
                  player.
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

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.md,
          }}
        >
          {isEditing ? (
            (() => {
              const selectedPosition = positions.find((p) => p.name === position)
              const positionInPossAttrs = selectedPosition?.inPossessionAttrs || []
              const positionOutPossAttrs = selectedPosition?.outOfPossessionAttrs || []
              const totalAttrs = positionInPossAttrs.length + positionOutPossAttrs.length

              if (!position) {
                return (
                  <div
                    style={{
                      color: theme.colors.text.secondary,
                      fontSize: theme.typography.fontSize.sm,
                      fontStyle: 'italic',
                    }}
                  >
                    Select a position first to set development targets
                  </div>
                )
              }
              if (totalAttrs === 0) {
                return (
                  <div
                    style={{
                      color: theme.colors.text.secondary,
                      fontSize: theme.typography.fontSize.sm,
                      fontStyle: 'italic',
                    }}
                  >
                    No attributes defined for this position. Add attributes in
                    Club Methodology &gt; Positional Profiling.
                  </div>
                )
              }
              return (
                <>
                  {/* Editable IDPs */}
                  {editedIDPs.map((idp, index) => (
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
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: theme.colors.gold.main,
                          color: theme.colors.background.primary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: theme.typography.fontWeight.bold,
                          fontSize: theme.typography.fontSize.sm,
                          flexShrink: 0,
                        }}
                      >
                        {index + 1}
                      </div>
                      <div
                        style={{ flex: 1, color: theme.colors.text.primary }}
                      >
                        {getAttributeName(idp.attribute_key)}
                      </div>
                      <button
                        onClick={() => onRemoveIDP(idp.attribute_key)}
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
                  {editedIDPs.length < 3 && (
                    <div>
                      {(() => {
                        // Get available in-possession attributes for this position
                        const availableInPoss = inPossessionAttributes
                          .filter((attr) => positionInPossAttrs.includes(attr.key))
                          .filter((attr) => !editedIDPs.find((idp) => idp.attribute_key === attr.key))

                        // Get available out-of-possession attributes for this position
                        const availableOutPoss = outOfPossessionAttributes
                          .filter((attr) => positionOutPossAttrs.includes(attr.key))
                          .filter((attr) => !editedIDPs.find((idp) => idp.attribute_key === attr.key))

                        const totalAvailable = availableInPoss.length + availableOutPoss.length

                        return (
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                onAddIDP(e.target.value)
                              }
                            }}
                            disabled={totalAvailable === 0}
                            style={{
                              width: '100%',
                              padding: theme.spacing.md,
                              paddingRight: '2.5rem',
                              backgroundColor: theme.colors.background.primary,
                              color: theme.colors.text.secondary,
                              border: `2px solid ${theme.colors.border.primary}`,
                              borderRadius: theme.borderRadius.md,
                              fontSize: theme.typography.fontSize.base,
                              outline: 'none',
                              cursor:
                                totalAvailable === 0
                                  ? 'not-allowed'
                                  : 'pointer',
                              appearance: 'none',
                              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 0.7rem center',
                              backgroundSize: '1.2em',
                              opacity: totalAvailable === 0 ? 0.5 : 1,
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = theme.colors.gold.main
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor =
                                theme.colors.border.primary
                            }}
                          >
                            <option value="">
                              {totalAvailable === 0
                                ? 'All position attributes selected'
                                : `+ Add Development Target (${3 - editedIDPs.length} remaining)`}
                            </option>
                            {availableInPoss.length > 0 && (
                              <optgroup label="In Possession">
                                {availableInPoss.map((attr) => (
                                  <option key={attr.key} value={attr.key}>
                                    {attr.value?.name || attr.key}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {availableOutPoss.length > 0 && (
                              <optgroup label="Out of Possession">
                                {availableOutPoss.map((attr) => (
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

                  {editedIDPs.length === 0 && (
                    <div
                      style={{
                        color: theme.colors.text.secondary,
                        fontSize: theme.typography.fontSize.sm,
                        fontStyle: 'italic',
                      }}
                    >
                      Select up to 3 development targets for this player
                    </div>
                  )}
                </>
              )
            })()
          ) : (
            <>
              {/* Display IDPs (read-only) */}
              {playerIDPs.length > 0 ? (
                playerIDPs.map((idp, index) => (
                  <div
                    key={idp.id}
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
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: theme.colors.gold.main,
                        color: theme.colors.background.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: theme.typography.fontWeight.bold,
                        fontSize: theme.typography.fontSize.sm,
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </div>
                    <div style={{ flex: 1, color: theme.colors.text.primary }}>
                      {getAttributeName(idp.attribute_key)}
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    color: theme.colors.text.secondary,
                    fontSize: theme.typography.fontSize.base,
                  }}
                >
                  No development targets set
                </div>
              )}
            </>
          )}
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
            onClick={onDeleteClick}
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
    </div>
  )
}
