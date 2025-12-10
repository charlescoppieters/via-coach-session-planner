'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FaPlus, FaTrash } from 'react-icons/fa'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import {
  createTrainingMethodology,
  updateTrainingMethodology,
  deleteTrainingMethodology,
  type TrainingMethodology,
} from '@/lib/methodology'

interface TrainingMethodologyStepProps {
  clubId: string
  coachId: string
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

export const TrainingMethodologyStep: React.FC<TrainingMethodologyStepProps> = ({
  clubId,
  coachId,
  onNext,
  onBack,
  onSkip,
}) => {
  const [rules, setRules] = useState<TrainingMethodology[]>([])
  const [error, setError] = useState('')

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<TrainingMethodology | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Delete confirmation
  const [deleteConfirmRule, setDeleteConfirmRule] = useState<TrainingMethodology | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
    if (!editTitle.trim()) return

    setIsSaving(true)
    setError('')

    if (editingRule) {
      // Update existing rule
      const { error: updateError } = await updateTrainingMethodology(editingRule.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      })

      if (updateError) {
        setError(updateError)
      } else {
        // Update local state
        setRules(prev =>
          prev.map(r =>
            r.id === editingRule.id
              ? { ...r, title: editTitle.trim(), description: editDescription.trim() }
              : r
          )
        )
        setIsEditModalOpen(false)
      }
    } else {
      // Create new rule
      const { data, error: createError } = await createTrainingMethodology(
        clubId,
        coachId,
        editTitle.trim(),
        editDescription.trim()
      )

      if (createError) {
        setError(createError)
      } else if (data) {
        setRules(prev => [...prev, data])
        setIsEditModalOpen(false)
      }
    }

    setIsSaving(false)
  }

  const handleDeleteRule = async () => {
    if (!deleteConfirmRule) return

    setIsDeleting(true)
    const { error: deleteError } = await deleteTrainingMethodology(deleteConfirmRule.id)

    if (deleteError) {
      setError(deleteError)
    } else {
      setRules(prev => prev.filter(r => r.id !== deleteConfirmRule.id))
    }

    setIsDeleting(false)
    setDeleteConfirmRule(null)
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
        Training Methodology
      </h2>
      <p
        style={{
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.xl,
          textAlign: 'center',
          lineHeight: '1.6',
          maxWidth: '600px',
          margin: '0 auto',
          marginTop: theme.spacing.sm,
        }}
      >
        Define your training principles and rules. AI uses these to create sessions
        that align with your coaching philosophy.
      </p>

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
            marginTop: theme.spacing.lg,
          }}
        >
          {error}
        </div>
      )}

      {/* Rules List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.md,
          marginTop: theme.spacing.xl,
          minHeight: '350px',
          maxHeight: '350px',
          overflowY: 'auto',
        }}
      >
        {rules.map(rule => (
          <div
            key={rule.id}
            style={{
              backgroundColor: theme.colors.background.primary,
              border: `1px solid ${theme.colors.border.primary}`,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.lg,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: theme.spacing.md,
              }}
            >
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text.primary,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  {rule.title}
                </h3>
                {rule.description && (
                  <p
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text.secondary,
                      lineHeight: 1.5,
                    }}
                  >
                    {rule.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleEditRule(rule)}
                style={{
                  padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                  backgroundColor: theme.colors.background.tertiary,
                  color: theme.colors.text.primary,
                  border: `1px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.sm,
                  cursor: 'pointer',
                }}
              >
                Edit
              </button>
            </div>
          </div>
        ))}

        {/* Add Rule Button */}
        <button
          onClick={handleAddRule}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.sm,
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.background.primary,
            border: `2px dashed ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.lg,
            color: theme.colors.text.secondary,
            fontSize: theme.typography.fontSize.base,
            cursor: 'pointer',
            transition: theme.transitions.fast,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = theme.colors.gold.main
            e.currentTarget.style.color = theme.colors.gold.main
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = theme.colors.border.primary
            e.currentTarget.style.color = theme.colors.text.secondary
          }}
        >
          <FaPlus size={14} />
          Add Training Principle
        </button>
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
            onClick={e => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.lg,
              }}
            >
              {editingRule ? 'Edit Training Principle' : 'Add Training Principle'}
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
                Title *
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="e.g., High-Intensity Pressing"
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.background.secondary,
                  color: theme.colors.text.primary,
                  border: `2px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => {
                  e.target.style.borderColor = theme.colors.gold.main
                }}
                onBlur={e => {
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
                onChange={e => setEditDescription(e.target.value)}
                placeholder="Describe this training principle..."
                rows={4}
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
                  boxSizing: 'border-box',
                }}
                onFocus={e => {
                  e.target.style.borderColor = theme.colors.gold.main
                }}
                onBlur={e => {
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
            onClick={e => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.md,
              }}
            >
              Delete Training Principle
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
                onClick={() => setDeleteConfirmRule(null)}
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
