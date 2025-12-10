'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CgSpinnerAlt } from 'react-icons/cg'
import { FaUpload } from 'react-icons/fa'
import { IoChevronBack } from 'react-icons/io5'
import { theme } from '@/styles/theme'
import { useAuth } from '@/contexts/AuthContext'
import { updateCoachProfile } from '@/lib/settings'
import { replaceProfilePicture, getProfilePictureUrl } from '@/lib/storage'

export default function ProfileSettingsPage() {
  const { coach, clubMembership, isAdmin, refreshAuth } = useAuth()

  const [name, setName] = useState(coach?.name || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    if (!coach?.id || !name.trim()) return

    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    const { error } = await updateCoachProfile(coach.id, { name: name.trim() })

    if (error) {
      setErrorMessage(error)
    } else {
      setSuccessMessage('Profile updated successfully')
      await refreshAuth()
    }

    setIsSaving(false)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !coach?.id) return

    setIsUploadingPhoto(true)
    setErrorMessage('')

    const { data: newPath, error } = await replaceProfilePicture(
      file,
      coach.id,
      coach.profile_picture
    )

    if (error) {
      setErrorMessage(error)
    } else if (newPath) {
      await updateCoachProfile(coach.id, { profile_picture: newPath })
      await refreshAuth()
      setSuccessMessage('Photo updated')
      setTimeout(() => setSuccessMessage(''), 3000)
    }

    setIsUploadingPhoto(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const hasChanges = name.trim() !== coach?.name

  return (
    <div style={{ padding: theme.spacing.xl }}>
      {/* Header with Title and Back Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.lg,
        }}
      >
        <h1
          style={{
            fontSize: theme.typography.fontSize['3xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            margin: 0,
          }}
        >
          Coach Profile
        </h1>
        <Link
          href="/settings"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            color: theme.colors.text.secondary,
            fontSize: theme.typography.fontSize.sm,
            textDecoration: 'none',
          }}
        >
<IoChevronBack size={16} />
          Back to Settings
        </Link>
      </div>

      {/* Messages */}
      {successMessage && (
        <div
          style={{
            padding: theme.spacing.md,
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            border: `1px solid ${theme.colors.status.success}`,
            borderRadius: theme.borderRadius.md,
            color: theme.colors.status.success,
            marginBottom: theme.spacing.lg,
          }}
        >
          {successMessage}
        </div>
      )}

      {errorMessage && (
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
          {errorMessage}
        </div>
      )}

      {/* Profile Section */}
      <div
        style={{
          backgroundColor: theme.colors.background.primary,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.xl,
        }}
      >
        {/* Profile Photo */}
        <div style={{ marginBottom: theme.spacing.xl }}>
          <label
            style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.md,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              width: '150px',
              textAlign: 'center',
            }}
          >
            Profile Photo
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            disabled={isUploadingPhoto}
            style={{ display: 'none' }}
          />

          <div
            onClick={() => !isUploadingPhoto && fileInputRef.current?.click()}
            style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              backgroundColor: theme.colors.background.tertiary,
              border: coach?.profile_picture ? `3px solid ${theme.colors.gold.main}` : `3px dashed ${theme.colors.border.primary}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
              cursor: isUploadingPhoto ? 'not-allowed' : 'pointer',
              transition: theme.transitions.fast,
            }}
            onMouseEnter={(e) => {
              if (!isUploadingPhoto) {
                const overlay = e.currentTarget.querySelector('[data-hover-overlay]') as HTMLElement
                if (overlay) overlay.style.opacity = '1'
              }
            }}
            onMouseLeave={(e) => {
              const overlay = e.currentTarget.querySelector('[data-hover-overlay]') as HTMLElement
              if (overlay) overlay.style.opacity = '0'
            }}
          >
            {isUploadingPhoto ? (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <CgSpinnerAlt size={32} color={theme.colors.gold.main} />
                </motion.div>
              </div>
            ) : null}

            {coach?.profile_picture ? (
              <img
                src={getProfilePictureUrl(coach.profile_picture)}
                alt={coach.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: theme.spacing.md,
                }}
              >
                <FaUpload
                  size={32}
                  style={{ color: theme.colors.text.secondary, marginBottom: theme.spacing.sm }}
                />
                <span
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                    textAlign: 'center',
                  }}
                >
                  Click to upload
                </span>
              </div>
            )}

            {/* Hover Overlay */}
            {coach?.profile_picture && (
              <div
                data-hover-overlay
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                  pointerEvents: 'none',
                }}
              >
                <FaUpload size={24} style={{ marginBottom: theme.spacing.xs }} />
                Change Photo
              </div>
            )}
          </div>
        </div>

        {/* Name Field */}
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
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
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

        {/* Email (read-only) */}
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
            Email
          </label>
          <div
            style={{
              padding: theme.spacing.md,
              backgroundColor: theme.colors.background.tertiary,
              color: theme.colors.text.secondary,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.base,
              maxWidth: '400px',
            }}
          >
            {coach?.email}
          </div>
        </div>

        {/* Role (read-only) */}
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
            Role
          </label>
          <div
            style={{
              padding: theme.spacing.md,
              backgroundColor: theme.colors.background.tertiary,
              color: theme.colors.text.secondary,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.base,
              maxWidth: '400px',
            }}
          >
            {isAdmin ? 'Admin' : clubMembership?.role || 'Coach'}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          style={{
            padding: `${theme.spacing.md} ${theme.spacing.xl}`,
            backgroundColor: hasChanges ? theme.colors.gold.main : theme.colors.text.disabled,
            color: theme.colors.background.primary,
            border: 'none',
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            cursor: hasChanges && !isSaving ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            opacity: hasChanges ? 1 : 0.5,
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
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
