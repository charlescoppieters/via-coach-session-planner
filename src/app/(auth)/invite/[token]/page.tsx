'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { HiOfficeBuilding } from 'react-icons/hi'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import { ImageUploader } from '@/components/onboarding/ImageUploader'
import { validateInviteToken, redeemInvite } from '@/lib/invites'
import { updateCoachProfile, completeOnboarding } from '@/lib/onboarding'
import { uploadProfilePicture } from '@/lib/storage'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

type Step = 'loading' | 'invalid' | 'not_authenticated' | 'join' | 'profile'

interface ClubData {
  id: string
  name: string
  logo_url: string | null
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  const token = resolvedParams.token
  const router = useRouter()
  const { refreshAuth, user, coach, club: userClub, loading: authLoading, isAdmin } = useAuth()

  // State
  const [step, setStep] = useState<Step>('loading')
  const [club, setClub] = useState<ClubData | null>(null)

  // Join step state
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  // Profile step state
  const [coachId, setCoachId] = useState<string | null>(null)
  const [profileName, setProfileName] = useState('')
  const [profilePicturePath, setProfilePicturePath] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle hash fragment from magic link (implicit flow)
  useEffect(() => {
    async function handleHashToken() {
      // Check if there's an access_token in the hash (from magic link)
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          const supabase = createClient()

          // Set the session from the hash tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (!error && data.user) {
            // Create coach profile if it doesn't exist
            const { data: existingCoach } = await supabase
              .from('coaches')
              .select('*')
              .eq('auth_user_id', data.user.id)
              .single()

            if (!existingCoach) {
              await supabase.from('coaches').insert({
                auth_user_id: data.user.id,
                email: data.user.email || '',
                name: (data.user.email || '').split('@')[0],
                onboarding_completed: false,
              })
            }

            // Clear the hash and refresh auth
            window.history.replaceState(null, '', window.location.pathname)
            await refreshAuth()
          }
        }
      }
    }

    handleHashToken()
  }, [refreshAuth])

  // Validate token and check auth state on mount
  useEffect(() => {
    async function initialize() {
      // Wait for auth to finish loading
      if (authLoading) return

      // If user already has a club and completed onboarding, redirect to dashboard
      if (user && coach && coach.onboarding_completed && userClub) {
        router.replace('/')
        return
      }

      // If user has club but hasn't completed onboarding (invited coach mid-flow)
      if (user && coach && !coach.onboarding_completed && userClub && !isAdmin) {
        setCoachId(coach.id)
        setClub({
          id: userClub.id,
          name: userClub.name,
          logo_url: userClub.logo_url,
        })
        setStep('profile')
        return
      }

      // Validate the invite token
      const result = await validateInviteToken(token)

      if (result.error || !result.invite || !result.club) {
        setStep('invalid')
        return
      }

      setClub(result.club)

      // If user is authenticated (via magic link) but doesn't have a club yet
      if (user && coach && !userClub) {
        setCoachId(coach.id)
        setStep('join')
        return
      }

      // Not authenticated - show message to check email
      setStep('not_authenticated')
    }

    initialize()
  }, [token, authLoading, user, coach, userClub, router, isAdmin])

  // Handle Join Club button click
  const handleJoinClub = async () => {
    setIsJoining(true)
    setJoinError('')

    const redeemResult = await redeemInvite(token)

    if (redeemResult.error) {
      setJoinError(redeemResult.error)
      setIsJoining(false)
      return
    }

    // Refresh auth to get the new club membership
    await refreshAuth()

    // Move to profile step
    setStep('profile')
    setIsJoining(false)
  }

  // Handle profile image select
  const handleImageSelect = async (file: File) => {
    if (!coachId) return

    setUploadError(null)
    setUploading(true)

    const result = await uploadProfilePicture(file, coachId)
    setUploading(false)

    if (result.error) {
      setUploadError(result.error)
    } else if (result.data) {
      setProfilePicturePath(result.data)
    }
  }

  // Handle profile image remove
  const handleImageRemove = () => {
    setProfilePicturePath(null)
    setUploadError(null)
  }

  // Handle profile completion
  const handleProfileComplete = async () => {
    if (!coachId || !profileName.trim()) return

    setIsSubmitting(true)

    const updateResult = await updateCoachProfile(coachId, {
      name: profileName.trim(),
      profile_picture: profilePicturePath || undefined,
    })

    if (updateResult.error) {
      setUploadError(updateResult.error)
      setIsSubmitting(false)
      return
    }

    await completeOnboarding(coachId)
    await refreshAuth()
    router.replace('/')
  }

  // Loading state
  if (step === 'loading') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: theme.colors.background.primary
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <CgSpinnerAlt size={32} color={theme.colors.gold.main} />
        </motion.div>
      </div>
    )
  }

  // Invalid invite
  if (step === 'invalid') {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.background.primary,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.lg,
        }}
      >
        <Image
          src="/logo.png"
          alt="VIA Logo"
          width={120}
          height={120}
          priority
          style={{ marginBottom: theme.spacing.xl }}
        />
        <div
          style={{
            backgroundColor: theme.colors.background.secondary,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.xl,
            border: `1px solid ${theme.colors.border.primary}`,
            textAlign: 'center',
            maxWidth: '400px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              marginBottom: theme.spacing.lg,
              color: theme.colors.status.error,
              fontSize: '32px',
            }}
          >
            !
          </div>
          <h2
            style={{
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.sm,
            }}
          >
            Invalid Invite
          </h2>
          <p style={{ color: theme.colors.text.secondary, margin: 0 }}>
            This invite link is invalid or has expired. Please ask a club admin for a new one.
          </p>
        </div>
      </div>
    )
  }

  // Not authenticated - tell them to check email
  if (step === 'not_authenticated' && club) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.background.primary,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.lg,
        }}
      >
        <Image
          src="/logo.png"
          alt="VIA Logo"
          width={120}
          height={120}
          priority
          style={{ marginBottom: theme.spacing.xl }}
        />
        <div
          style={{
            backgroundColor: theme.colors.background.secondary,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.xl,
            border: `1px solid ${theme.colors.border.primary}`,
            textAlign: 'center',
            maxWidth: '400px',
          }}
        >
          {/* Club Badge */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: club.logo_url ? 'transparent' : 'rgba(239, 191, 4, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              marginBottom: theme.spacing.lg,
              overflow: 'hidden',
            }}
          >
            {club.logo_url ? (
              <img
                src={club.logo_url}
                alt={club.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <HiOfficeBuilding size={40} color={theme.colors.gold.main} />
            )}
          </div>

          <h2
            style={{
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.sm,
            }}
          >
            {club.name}
          </h2>
          <p
            style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.base,
              marginBottom: theme.spacing.lg,
            }}
          >
            You&apos;ve been invited to join this club
          </p>
          <div
            style={{
              padding: theme.spacing.md,
              backgroundColor: theme.colors.background.primary,
              borderRadius: theme.borderRadius.md,
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.sm,
            }}
          >
            Please check your email and click the magic link to continue.
          </div>
        </div>
      </div>
    )
  }

  // Join club step (authenticated, ready to join)
  if (step === 'join' && club && coach) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.background.primary,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.lg,
        }}
      >
        <Image
          src="/logo.png"
          alt="VIA Logo"
          width={120}
          height={120}
          priority
          style={{ marginBottom: theme.spacing.xl }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundColor: theme.colors.background.secondary,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.xl,
            border: `1px solid ${theme.colors.border.primary}`,
            textAlign: 'center',
            maxWidth: '400px',
            width: '100%',
          }}
        >
          {/* Club Badge */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: club.logo_url ? 'transparent' : 'rgba(239, 191, 4, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              marginBottom: theme.spacing.lg,
              overflow: 'hidden',
            }}
          >
            {club.logo_url ? (
              <img
                src={club.logo_url}
                alt={club.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <HiOfficeBuilding size={40} color={theme.colors.gold.main} />
            )}
          </div>

          <h2
            style={{
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.sm,
            }}
          >
            {club.name}
          </h2>

          <p
            style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.base,
              marginBottom: theme.spacing.lg,
            }}
          >
            You&apos;ve been invited to join this club
          </p>

          {/* Email display */}
          <div
            style={{
              backgroundColor: theme.colors.background.primary,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.lg,
            }}
          >
            <div
              style={{
                color: theme.colors.text.primary,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium,
                marginBottom: theme.spacing.xs,
              }}
            >
              {coach.email}
            </div>
            <div
              style={{
                color: theme.colors.text.secondary,
                fontSize: theme.typography.fontSize.sm,
              }}
            >
              This is the email you&apos;ll use to log in
            </div>
          </div>

          {/* Error message */}
          {joinError && (
            <div
              style={{
                padding: theme.spacing.sm,
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                border: `1px solid ${theme.colors.status.error}`,
                borderRadius: theme.borderRadius.md,
                color: theme.colors.status.error,
                fontSize: theme.typography.fontSize.sm,
                marginBottom: theme.spacing.lg,
              }}
            >
              {joinError}
            </div>
          )}

          {/* Join Button */}
          <button
            onClick={handleJoinClub}
            disabled={isJoining}
            style={{
              width: '100%',
              padding: theme.spacing.md,
              backgroundColor: theme.colors.gold.main,
              color: theme.colors.background.primary,
              border: 'none',
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              cursor: isJoining ? 'not-allowed' : 'pointer',
              transition: theme.transitions.fast,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.sm,
            }}
            onMouseEnter={(e) => {
              if (!isJoining) e.currentTarget.style.backgroundColor = theme.colors.gold.light
            }}
            onMouseLeave={(e) => {
              if (!isJoining) e.currentTarget.style.backgroundColor = theme.colors.gold.main
            }}
          >
            {isJoining ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <CgSpinnerAlt size={18} />
                </motion.div>
                Joining...
              </>
            ) : (
              `Join ${club.name}`
            )}
          </button>
        </motion.div>
      </div>
    )
  }

  // Profile setup step
  if (step === 'profile' && club) {
    const isValid = profileName.trim() && !uploading && !isSubmitting

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: theme.colors.background.primary,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '90%',
            maxWidth: '600px',
            backgroundColor: theme.colors.background.secondary,
            borderRadius: theme.borderRadius.lg,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            padding: theme.spacing.xl,
          }}
        >
          <h2
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.sm,
              textAlign: 'center',
            }}
          >
            Set Up Your Coach Profile
          </h2>
          <p
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xl,
              textAlign: 'center',
            }}
          >
            Welcome to {club.name}!
          </p>

          {/* Profile Picture */}
          <div style={{ marginBottom: theme.spacing.xl }}>
            <label
              style={{
                display: 'block',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.md,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                textAlign: 'center',
              }}
            >
              Profile Picture (Optional)
            </label>
            <ImageUploader
              currentImage={profilePicturePath}
              onImageSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
              uploading={uploading}
            />
            {uploadError && (
              <div
                style={{
                  marginTop: theme.spacing.sm,
                  padding: theme.spacing.sm,
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  border: `1px solid ${theme.colors.status.error}`,
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.status.error,
                  fontSize: theme.typography.fontSize.sm,
                  textAlign: 'center',
                }}
              >
                {uploadError}
              </div>
            )}
          </div>

          {/* Name Input */}
          <div style={{ marginBottom: theme.spacing.xl }}>
            <label
              style={{
                display: 'block',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.xs,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Full Name *
            </label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Enter your full name"
              style={{
                width: '100%',
                padding: theme.spacing.md,
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.primary,
                backgroundColor: theme.colors.background.primary,
                border: `2px solid ${theme.colors.border.primary}`,
                borderRadius: theme.borderRadius.md,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.colors.gold.main
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme.colors.border.primary
              }}
            />
          </div>

          {/* Complete Button */}
          <button
            onClick={handleProfileComplete}
            disabled={!isValid}
            style={{
              width: '100%',
              padding: theme.spacing.md,
              backgroundColor: isValid ? theme.colors.gold.main : theme.colors.text.disabled,
              color: theme.colors.background.primary,
              border: 'none',
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              cursor: isValid ? 'pointer' : 'not-allowed',
              transition: theme.transitions.fast,
              opacity: isValid ? 1 : 0.6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.sm,
            }}
            onMouseEnter={(e) => {
              if (isValid) e.currentTarget.style.backgroundColor = theme.colors.gold.light
            }}
            onMouseLeave={(e) => {
              if (isValid) e.currentTarget.style.backgroundColor = theme.colors.gold.main
            }}
          >
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <CgSpinnerAlt size={18} />
                </motion.div>
                Completing...
              </>
            ) : (
              'Complete Setup'
            )}
          </button>
        </div>
      </motion.div>
    )
  }

  return null
}
