'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { theme } from '@/styles/theme'
import { useAuth } from '@/contexts/AuthContext'
import { WelcomeStep } from '@/components/onboarding/WelcomeStep'
import { ClubSetupStep } from '@/components/onboarding/ClubSetupStep'
import { ProfileSetupStep } from '@/components/onboarding/ProfileSetupStep'
import { PlayingMethodologyStep } from '@/components/onboarding/PlayingMethodologyStep'
import { TrainingMethodologyStep } from '@/components/onboarding/TrainingMethodologyStep'
import { PositionalProfilingStep } from '@/components/onboarding/PositionalProfilingStep'
import { TeamCreationStep } from '@/components/onboarding/TeamCreationStep'
import { TeamFacilitiesStep } from '@/components/onboarding/TeamFacilitiesStep'
import { CompletionStep } from '@/components/onboarding/CompletionStep'
import { saveTeamFacilities, type EquipmentItem } from '@/lib/facilities'
import { createTeam } from '@/lib/teams'
import { assignCoachToTeam } from '@/lib/settings'

type Step =
  | 'welcome'
  | 'club'
  | 'profile'
  | 'playing_methodology'
  | 'training_methodology'
  | 'positional_profiling'
  | 'team_details'
  | 'team_facilities'
  | 'completion'

interface TeamFormData {
  name: string
  age_group: string
  skill_level: string
  player_count: number
  sessions_per_week: number
  session_duration: number
  gender: string | null
}

export default function OnboardingPage() {
  const router = useRouter()
  const { user, coach, club, clubMembership, loading, refreshAuth, createClub, isAdmin } = useAuth()

  const [currentStep, setCurrentStep] = useState<Step>('welcome')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const hasRefreshed = useRef(false)

  // Track if user created club during this onboarding session
  const [createdClubThisSession, setCreatedClubThisSession] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)

  // Simple: fetch fresh data on mount, then we're ready
  useEffect(() => {
    if (!hasRefreshed.current) {
      hasRefreshed.current = true
      refreshAuth().finally(() => setIsReady(true))
    }
  }, [refreshAuth])

  // Club data (for users creating a club)
  const [clubData, setClubData] = useState({
    name: '',
    logoUrl: '',
  })

  // Profile data
  const [profileData, setProfileData] = useState({
    name: '',
    profilePicturePath: null as string | null,
  })

  // Team data
  const [teamData, setTeamData] = useState<TeamFormData | null>(null)

  // Initialize profile name from coach
  useEffect(() => {
    if (coach?.name) {
      setProfileData(prev => ({ ...prev, name: coach.name }))
    }
  }, [coach?.name])

  // Redirect checks - only after data is ready
  useEffect(() => {
    if (isReady && !loading) {
      if (!user || !coach) {
        router.replace('/login')
      } else if (coach.onboarding_completed) {
        router.replace('/')
      }
    }
  }, [user, coach, loading, router, isReady])

  // Determine if we need to show club step (admins creating new club)
  const needsClubStep = !club && !createdClubThisSession

  // Determine if this is an invited coach (has club, not admin)
  const isInvitedCoach = club && !isAdmin

  const handleWelcomeNext = () => {
    if (needsClubStep) {
      setCurrentStep('club')
    } else {
      setCurrentStep('profile')
    }
  }

  const handleClubNext = async (data: { name: string; logoUrl: string }) => {
    setClubData(data)
    setError(null)
    setIsSubmitting(true)

    const { success, error: createError } = await createClub(data.name, data.logoUrl)

    if (!success) {
      setError(createError || 'Failed to create club')
      setIsSubmitting(false)
      return
    }

    setCreatedClubThisSession(true)
    setIsSubmitting(false)

    // Refresh auth to get the new club data
    await refreshAuth()

    setCurrentStep('profile')
  }

  const handleProfileNext = async (data: {
    name: string
    profilePicturePath: string | null
  }) => {
    setProfileData(data)

    // Invited coaches skip all methodology and team steps - just save profile and complete
    if (isInvitedCoach) {
      if (!coach?.id) {
        setError('Coach not found. Please refresh and try again.')
        return
      }

      setError(null)
      setIsSubmitting(true)

      try {
        const { updateCoachProfile, completeOnboarding } = await import('@/lib/onboarding')

        const profileResult = await updateCoachProfile(coach.id, {
          name: data.name,
          profile_picture: data.profilePicturePath || undefined,
        })

        if (profileResult.error) {
          setError(profileResult.error)
          setIsSubmitting(false)
          return
        }

        const completeResult = await completeOnboarding(coach.id)

        if (completeResult.error) {
          setError(completeResult.error)
          setIsSubmitting(false)
          return
        }

        // Skip completion screen for invited coaches - go straight to dashboard
        setIsSubmitting(false)
        setIsNavigating(true)
        await refreshAuth()
        router.replace('/')
      } catch (err) {
        console.error('Onboarding error:', err)
        setError('An unexpected error occurred. Please try again.')
        setIsSubmitting(false)
      }
      return
    }

    // Admin coaches proceed to methodology steps
    setCurrentStep('playing_methodology')
  }

  // Playing methodology handlers
  const handlePlayingMethodologyNext = () => {
    setCurrentStep('training_methodology')
  }

  const handlePlayingMethodologySkip = () => {
    setCurrentStep('training_methodology')
  }

  // Training methodology handlers
  const handleTrainingMethodologyNext = () => {
    setCurrentStep('positional_profiling')
  }

  const handleTrainingMethodologySkip = () => {
    setCurrentStep('positional_profiling')
  }

  // Positional profiling handlers
  const handlePositionalProfilingNext = () => {
    setCurrentStep('team_details')
  }

  const handlePositionalProfilingSkip = () => {
    setCurrentStep('team_details')
  }

  // Team details handler
  const handleTeamDetailsNext = (data: TeamFormData) => {
    setTeamData(data)
    setCurrentStep('team_facilities')
  }

  // Team facilities handlers - these complete the onboarding
  const handleTeamFacilitiesNext = async (facilities: {
    spaceType: string
    customSpace: string
    equipment: EquipmentItem[]
    otherFactors: string
  }) => {
    await completeOnboardingWithTeam(facilities)
  }

  const handleTeamFacilitiesSkip = async () => {
    // Create team without facilities
    await completeOnboardingWithTeam(null)
  }

  const completeOnboardingWithTeam = async (
    facilities: {
      spaceType: string
      customSpace: string
      equipment: EquipmentItem[]
      otherFactors: string
    } | null
  ) => {
    const currentClub = club
    if (!coach?.id || !currentClub?.id || !teamData) {
      setError('Missing required data. Please refresh and try again.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const { updateCoachProfile, completeOnboarding } = await import('@/lib/onboarding')

      // 1. Update coach profile
      const position = clubMembership?.role || 'Head Coach'
      const profileResult = await updateCoachProfile(coach.id, {
        name: profileData.name,
        position,
        profile_picture: profileData.profilePicturePath || undefined,
      })

      if (profileResult.error) {
        setError(profileResult.error)
        setIsSubmitting(false)
        return
      }

      // 2. Create the team
      const teamResult = await createTeam({
        club_id: currentClub.id,
        created_by_coach_id: coach.id,
        name: teamData.name,
        age_group: teamData.age_group,
        skill_level: teamData.skill_level,
        gender: teamData.gender,
        player_count: teamData.player_count,
        sessions_per_week: teamData.sessions_per_week,
        session_duration: teamData.session_duration,
      })

      if (teamResult.error || !teamResult.data) {
        setError(teamResult.error || 'Failed to create team')
        setIsSubmitting(false)
        return
      }

      const createdTeamId = teamResult.data.id

      // 3. Auto-assign admin coach to the team
      await assignCoachToTeam(coach.id, createdTeamId)

      // 4. Save facilities if provided
      if (facilities && (facilities.spaceType || facilities.equipment.length > 0 || facilities.otherFactors)) {
        await saveTeamFacilities(createdTeamId, {
          space_type: facilities.spaceType || null,
          custom_space: facilities.customSpace || null,
          equipment: facilities.equipment.length > 0 ? facilities.equipment : null,
          other_factors: facilities.otherFactors || null,
        })
      }

      // 5. Mark onboarding as complete
      const completeResult = await completeOnboarding(coach.id)

      if (completeResult.error) {
        setError(completeResult.error)
        setIsSubmitting(false)
        return
      }

      setCurrentStep('completion')
      setIsSubmitting(false)
    } catch (err) {
      console.error('Onboarding error:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleComplete = async () => {
    setIsNavigating(true)
    await refreshAuth()
    router.replace('/')
  }

  // Show nothing while loading data
  if (!isReady || loading || !coach) {
    return null
  }

  // Show loading screen while navigating to dashboard
  if (isNavigating) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: theme.colors.background.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
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

      {/* Error Message */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '600px',
            padding: theme.spacing.md,
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            border: `2px solid ${theme.colors.status.error}`,
            borderRadius: theme.borderRadius.md,
            color: theme.colors.status.error,
            fontSize: theme.typography.fontSize.base,
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      {/* Step Content */}
      <div
        style={{
          width: '90%',
          maxWidth: '1000px',
          maxHeight: '85vh',
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.lg,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          overflowY: 'auto',
          overflow: 'hidden',
        }}
      >
        <AnimatePresence mode="wait">
          {currentStep === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <WelcomeStep onNext={handleWelcomeNext} />
            </motion.div>
          )}

          {currentStep === 'club' && (
            <motion.div
              key="club"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <ClubSetupStep
                coachId={coach.id}
                onNext={handleClubNext}
                onBack={() => setCurrentStep('welcome')}
              />
            </motion.div>
          )}

          {currentStep === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <ProfileSetupStep
                initialName={coach.name}
                coachId={coach.id}
                onNext={handleProfileNext}
                onBack={() => setCurrentStep(needsClubStep || createdClubThisSession ? 'club' : 'welcome')}
                nextButtonText={isInvitedCoach ? 'Done' : 'Next'}
              />
            </motion.div>
          )}

          {currentStep === 'playing_methodology' && club && (
            <motion.div
              key="playing_methodology"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <PlayingMethodologyStep
                clubId={club.id}
                coachId={coach.id}
                onNext={handlePlayingMethodologyNext}
                onBack={() => setCurrentStep('profile')}
                onSkip={handlePlayingMethodologySkip}
              />
            </motion.div>
          )}

          {currentStep === 'training_methodology' && club && (
            <motion.div
              key="training_methodology"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <TrainingMethodologyStep
                clubId={club.id}
                coachId={coach.id}
                onNext={handleTrainingMethodologyNext}
                onBack={() => setCurrentStep('playing_methodology')}
                onSkip={handleTrainingMethodologySkip}
              />
            </motion.div>
          )}

          {currentStep === 'positional_profiling' && club && (
            <motion.div
              key="positional_profiling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <PositionalProfilingStep
                clubId={club.id}
                onNext={handlePositionalProfilingNext}
                onBack={() => setCurrentStep('training_methodology')}
                onSkip={handlePositionalProfilingSkip}
              />
            </motion.div>
          )}

          {currentStep === 'team_details' && (
            <motion.div
              key="team_details"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <TeamCreationStep
                onNext={handleTeamDetailsNext}
                onBack={() => setCurrentStep('positional_profiling')}
              />
            </motion.div>
          )}

          {currentStep === 'team_facilities' && (
            <motion.div
              key="team_facilities"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <TeamFacilitiesStep
                onNext={handleTeamFacilitiesNext}
                onBack={() => setCurrentStep('team_details')}
                onSkip={handleTeamFacilitiesSkip}
                isSubmitting={isSubmitting}
              />
            </motion.div>
          )}

          {currentStep === 'completion' && (
            <motion.div
              key="completion"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <CompletionStep onComplete={handleComplete} teamName={teamData?.name || ''} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
