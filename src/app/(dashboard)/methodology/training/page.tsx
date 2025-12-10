'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaTrash, FaChevronDown } from 'react-icons/fa'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import { useAuth } from '@/contexts/AuthContext'
import { useTeam } from '@/contexts/TeamContext'
import {
  getClubTrainingMethodology,
  getTeamTrainingMethodology,
  getTeamTrainingRuleToggles,
  toggleClubTrainingRule,
  createTrainingMethodology,
  updateTrainingMethodology,
  deleteTrainingMethodology,
  subscribeToTrainingMethodology,
  type TrainingMethodology,
} from '@/lib/methodology'

export default function MyTrainingMethodologyPage() {
  const { club, coach } = useAuth()
  const { selectedTeam, selectedTeamId } = useTeam()

  const [clubRules, setClubRules] = useState<TrainingMethodology[]>([])
  const [teamRules, setTeamRules] = useState<TrainingMethodology[]>([])
  const [toggles, setToggles] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Edit state
  const [editingRule, setEditingRule] = useState<TrainingMethodology | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Delete confirmation
  const [deleteConfirmRule, setDeleteConfirmRule] = useState<TrainingMethodology | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Collapsible state for club rules and team rules
  const [isClubRulesExpanded, setIsClubRulesExpanded] = useState(false)
  const [isTeamRulesExpanded, setIsTeamRulesExpanded] = useState(false)

  const fetchRules = useCallback(async () => {
    if (!club?.id || !selectedTeamId) return

    setIsLoading(true)

    // Fetch club rules
    const { data: clubData, error: clubError } = await getClubTrainingMethodology(club.id)
    if (clubError) {
      setError(clubError)
    } else if (clubData) {
      setClubRules(clubData)
    }

    // Fetch team rules
    const { data: teamData, error: teamError } = await getTeamTrainingMethodology(club.id, selectedTeamId)
    if (teamError) {
      setError(teamError)
    } else if (teamData) {
      setTeamRules(teamData)
    }

    // Fetch toggles
    const { data: toggleData } = await getTeamTrainingRuleToggles(selectedTeamId)
    const toggleMap: Record<string, boolean> = {}

    // Default all club rules to enabled
    clubData?.forEach((rule) => {
      toggleMap[rule.id] = true
    })

    // Override with actual toggle values
    toggleData?.forEach((toggle) => {
      toggleMap[toggle.training_rule_id] = toggle.is_enabled
    })

    setToggles(toggleMap)

    setIsLoading(false)
  }, [club?.id, selectedTeamId])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  // Realtime subscriptions
  useEffect(() => {
    if (!club?.id || !selectedTeamId) return

    // Subscribe to club rules
    const unsubscribeClub = subscribeToTrainingMethodology(club.id, null, () => {
      fetchRules()
    })

    // Subscribe to team rules
    const unsubscribeTeam = subscribeToTrainingMethodology(club.id, selectedTeamId, () => {
      fetchRules()
    })

    return () => {
      unsubscribeClub()
      unsubscribeTeam()
    }
  }, [club?.id, selectedTeamId, fetchRules])

  const handleAddRule = () => {
    setEditingRule(null)
    setEditTitle('')
    setEditDescription('')
    setIsEditModalOpen(true)
  }

  const handleEditRule = (rule: TrainingMethodology) => {
    setEditingRule(rule)
    setEditTitle(rule.title)
    setEditDescription(rule.description || '')
    setIsEditModalOpen(true)
  }

  const handleSaveRule = async () => {
    if (!club?.id || !coach?.id || !selectedTeamId || !editTitle.trim()) return

    setIsSaving(true)
    setError('')

    if (editingRule) {
      // Update existing rule
      const { error } = await updateTrainingMethodology(editingRule.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      })

      if (error) {
        setError(error)
      } else {
        await fetchRules()
        setIsEditModalOpen(false)
      }
    } else {
      // Create new team rule
      const { error } = await createTrainingMethodology(
        club.id,
        coach.id,
        editTitle.trim(),
        editDescription.trim(),
        selectedTeamId // Pass team ID for team-specific rules
      )

      if (error) {
        setError(error)
      } else {
        await fetchRules()
        setIsEditModalOpen(false)
      }
    }

    setIsSaving(false)
  }

  const handleDeleteRule = async () => {
    if (!deleteConfirmRule) return

    setIsDeleting(true)
    const { error } = await deleteTrainingMethodology(deleteConfirmRule.id)

    if (error) {
      setError(error)
    } else {
      await fetchRules()
    }

    setIsDeleting(false)
    setDeleteConfirmRule(null)
  }

  const handleToggleRule = async (ruleId: string) => {
    if (!selectedTeamId) return

    const newValue = !toggles[ruleId]

    // Optimistically update UI
    setToggles((prev) => ({ ...prev, [ruleId]: newValue }))

    const { error } = await toggleClubTrainingRule(selectedTeamId, ruleId, newValue)

    if (error) {
      // Revert on error
      setToggles((prev) => ({ ...prev, [ruleId]: !newValue }))
      setError(error)
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
          Training Methodology
        </h1>
        <p
          style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.secondary,
          }}
        >
          How you plan to train your players, including practice design, coaching style, and key themes
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

      {/* Rules List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
        {/* Club Rules Section (Collapsible) */}
        {clubRules.length > 0 && (
          <div
            style={{
              backgroundColor: theme.colors.background.secondary,
              border: '1px solid rgba(68, 68, 68, 0.3)',
              borderRadius: theme.borderRadius.lg,
              overflow: 'hidden',
            }}
          >
            {/* Collapsible Header */}
            <button
              onClick={() => setIsClubRulesExpanded(!isClubRulesExpanded)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: theme.spacing.lg,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderBottom: isClubRulesExpanded ? `1px solid rgba(68, 68, 68, 0.3)` : 'none',
              }}
            >
              <h3
                style={{
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text.primary,
                  margin: 0,
                  flex: 1,
                  textAlign: 'left',
                }}
              >
                Club Methodology
              </h3>
              <motion.div
                animate={{ rotate: isClubRulesExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: theme.colors.background.tertiary,
                }}
              >
                <FaChevronDown size={12} color={theme.colors.text.secondary} />
              </motion.div>
            </button>

            {/* Collapsible Content */}
            <AnimatePresence initial={false}>
              {isClubRulesExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {clubRules.map((rule, index) => {
                      const isEnabled = toggles[rule.id] !== false
                      return (
                        <div
                          key={rule.id}
                          style={{
                            padding: theme.spacing.lg,
                            display: 'flex',
                            alignItems: 'center',
                            gap: theme.spacing.lg,
                            opacity: isEnabled ? 1 : 0.5,
                            transition: theme.transitions.fast,
                            borderBottom: index < clubRules.length - 1 ? `1px solid rgba(68, 68, 68, 0.2)` : 'none',
                          }}
                        >
                          {/* Content */}
                          <div style={{ flex: 1 }}>
                            <h4
                              style={{
                                fontSize: theme.typography.fontSize.base,
                                fontWeight: theme.typography.fontWeight.medium,
                                color: theme.colors.text.primary,
                                marginBottom: rule.description ? theme.spacing.xs : 0,
                              }}
                            >
                              {rule.title}
                            </h4>
                            {rule.description && (
                              <p
                                style={{
                                  fontSize: theme.typography.fontSize.sm,
                                  color: theme.colors.text.secondary,
                                  lineHeight: 1.5,
                                  margin: 0,
                                }}
                              >
                                {rule.description}
                              </p>
                            )}
                          </div>

                          {/* Toggle Switch */}
                          <div
                            onClick={() => handleToggleRule(rule.id)}
                            style={{
                              width: '44px',
                              height: '24px',
                              backgroundColor: isEnabled
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
                                left: isEnabled ? '22px' : '2px',
                                transition: theme.transitions.fast,
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Team Rules Section (Collapsible) */}
        <div
          style={{
            backgroundColor: theme.colors.background.secondary,
            border: '1px solid rgba(68, 68, 68, 0.3)',
            borderRadius: theme.borderRadius.lg,
            overflow: 'hidden',
          }}
        >
          {/* Collapsible Header */}
          <button
            onClick={() => setIsTeamRulesExpanded(!isTeamRulesExpanded)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: theme.spacing.lg,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderBottom: isTeamRulesExpanded ? `1px solid rgba(68, 68, 68, 0.3)` : 'none',
            }}
          >
            <h3
              style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                margin: 0,
                flex: 1,
                textAlign: 'left',
              }}
            >
              Team Methodology
            </h3>
            <motion.div
              animate={{ rotate: isTeamRulesExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.background.tertiary,
              }}
            >
              <FaChevronDown size={12} color={theme.colors.text.secondary} />
            </motion.div>
          </button>

          {/* Collapsible Content */}
          <AnimatePresence initial={false}>
            {isTeamRulesExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {teamRules.map((rule, index) => (
                    <div
                      key={rule.id}
                      style={{
                        padding: theme.spacing.lg,
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.lg,
                        borderBottom: index < teamRules.length - 1 ? `1px solid rgba(68, 68, 68, 0.2)` : 'none',
                      }}
                    >
                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <h4
                          style={{
                            fontSize: theme.typography.fontSize.base,
                            fontWeight: theme.typography.fontWeight.medium,
                            color: theme.colors.text.primary,
                            marginBottom: rule.description ? theme.spacing.xs : 0,
                          }}
                        >
                          {rule.title}
                        </h4>
                        {rule.description && (
                          <p
                            style={{
                              fontSize: theme.typography.fontSize.sm,
                              color: theme.colors.text.secondary,
                              lineHeight: 1.5,
                              margin: 0,
                            }}
                          >
                            {rule.description}
                          </p>
                        )}
                      </div>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditRule(rule)}
                        style={{
                          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                          backgroundColor: theme.colors.background.tertiary,
                          color: theme.colors.text.primary,
                          border: `1px solid ${theme.colors.border.primary}`,
                          borderRadius: theme.borderRadius.md,
                          fontSize: theme.typography.fontSize.sm,
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  ))}

                  {/* Add Rule Button inside the collapsible */}
                  <button
                    onClick={handleAddRule}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: theme.spacing.sm,
                      padding: theme.spacing.lg,
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderTop: teamRules.length > 0 ? `1px solid rgba(68, 68, 68, 0.2)` : 'none',
                      color: theme.colors.text.secondary,
                      fontSize: theme.typography.fontSize.sm,
                      cursor: 'pointer',
                      transition: theme.transitions.fast,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = theme.colors.gold.main
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = theme.colors.text.secondary
                    }}
                  >
                    <FaPlus size={12} />
                    Add Team Rule
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
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
          onClick={() => setIsEditModalOpen(false)}
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
              {editingRule ? 'Edit Rule' : 'Add Team Rule'}
            </h2>

            <div style={{ marginBottom: theme.spacing.lg }}>
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
                Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g., Warm-up Protocol"
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.background.secondary,
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

            <div style={{ marginBottom: theme.spacing.xl }}>
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
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe this training principle or methodology..."
                rows={5}
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.background.secondary,
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
            </div>

            <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'space-between' }}>
              {editingRule ? (
                <button
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setDeleteConfirmRule(editingRule)
                  }}
                  disabled={isSaving}
                  style={{
                    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                    backgroundColor: 'transparent',
                    color: theme.colors.status.error,
                    border: `1px solid ${theme.colors.status.error}`,
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.typography.fontSize.base,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                  }}
                >
                  <FaTrash size={14} />
                  Delete
                </button>
              ) : (
                <div />
              )}
              <div style={{ display: 'flex', gap: theme.spacing.md }}>
                <button
                  onClick={() => setIsEditModalOpen(false)}
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
                  onClick={handleSaveRule}
                  disabled={!editTitle.trim() || isSaving}
                  style={{
                    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                    backgroundColor:
                      editTitle.trim() && !isSaving
                        ? theme.colors.gold.main
                        : theme.colors.text.disabled,
                    color: theme.colors.background.primary,
                    border: 'none',
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.semibold,
                    cursor: editTitle.trim() && !isSaving ? 'pointer' : 'not-allowed',
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
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmRule && (
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
          onClick={() => setDeleteConfirmRule(null)}
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
              Delete Rule
            </h2>
            <p
              style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.xl,
              }}
            >
              Are you sure you want to delete &quot;{deleteConfirmRule.title}&quot;? This action
              cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  const ruleToEdit = deleteConfirmRule
                  setDeleteConfirmRule(null)
                  if (ruleToEdit) {
                    setEditingRule(ruleToEdit)
                    setEditTitle(ruleToEdit.title)
                    setEditDescription(ruleToEdit.description || '')
                    setIsEditModalOpen(true)
                  }
                }}
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
                onClick={handleDeleteRule}
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
