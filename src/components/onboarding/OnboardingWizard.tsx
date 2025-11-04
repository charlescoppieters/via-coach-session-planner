'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '@/styles/theme';
import { WelcomeStep } from './WelcomeStep';
import { ProfileSetupStep } from './ProfileSetupStep';
import { TeamCreationStep } from './TeamCreationStep';
import { CompletionStep } from './CompletionStep';
import { completeOnboardingWithTeam } from '@/lib/onboarding';

type Step = 'welcome' | 'profile' | 'team' | 'completion';

interface OnboardingWizardProps {
  coachId: string;
  initialName: string;
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  coachId,
  initialName,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile data
  const [profileData, setProfileData] = useState({
    name: initialName,
    position: '',
    profilePicturePath: null as string | null,
  });

  // Team data
  const [teamData, setTeamData] = useState({
    name: '',
    age_group: '',
    skill_level: '',
    player_count: 0,
    sessions_per_week: 0,
    session_duration: 0,
    gender: null as string | null,
  });

  const stepOrder: Step[] = ['welcome', 'profile', 'team', 'completion'];
  const currentStepIndex = stepOrder.indexOf(currentStep);

  const handleProfileNext = (data: {
    name: string;
    position: string;
    profilePicturePath: string | null;
  }) => {
    setProfileData(data);
    setCurrentStep('team');
  };

  const handleTeamNext = async (data: {
    name: string;
    age_group: string;
    skill_level: string;
    player_count: number;
    sessions_per_week: number;
    session_duration: number;
    gender: string | null;
  }) => {
    setTeamData(data);
    setError(null);
    setIsSubmitting(true);

    try {
      // Submit profile and team data to complete onboarding
      const result = await completeOnboardingWithTeam(
        coachId,
        {
          name: profileData.name,
          position: profileData.position,
          profile_picture: profileData.profilePicturePath || undefined,
        },
        data
      );

      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // Success - move to completion step
      setCurrentStep('completion');
      setIsSubmitting(false);
    } catch (err) {
      console.error('Onboarding error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
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
    }}>
      {/* Progress Indicator */}
      {currentStep !== 'welcome' && currentStep !== 'completion' && (
        <div style={{
          position: 'absolute',
          top: theme.spacing.xl,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
        }}>
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor:
                  currentStepIndex >= step
                    ? theme.colors.gold.main
                    : theme.colors.background.tertiary,
                border: `2px solid ${
                  currentStepIndex >= step
                    ? theme.colors.gold.main
                    : theme.colors.border.primary
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color:
                  currentStepIndex >= step
                    ? theme.colors.background.primary
                    : theme.colors.text.secondary,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.bold,
                transition: theme.transitions.fast,
              }}>
                {step}
              </div>
              {step < 3 && (
                <div style={{
                  width: '60px',
                  height: '2px',
                  backgroundColor:
                    currentStepIndex > step
                      ? theme.colors.gold.main
                      : theme.colors.border.primary,
                  transition: theme.transitions.fast,
                }} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
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
        }}>
          {error}
        </div>
      )}

      {/* Step Content */}
      <motion.div
        layout
        initial={false}
        animate={{
          width: '90%',
          maxWidth: '1000px',
        }}
        transition={{
          layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
        }}
        style={{
          maxHeight: '85vh',
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.lg,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          overflowY: 'auto',
          overflow: 'hidden',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {currentStep === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              layout
            >
              <WelcomeStep onNext={() => setCurrentStep('profile')} />
            </motion.div>
          )}

          {currentStep === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              layout
            >
              <ProfileSetupStep
                initialName={initialName}
                coachId={coachId}
                onNext={handleProfileNext}
                onBack={() => setCurrentStep('welcome')}
              />
            </motion.div>
          )}

          {currentStep === 'team' && (
            <motion.div
              key="team"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              layout
            >
              <TeamCreationStep
                onNext={handleTeamNext}
                onBack={() => setCurrentStep('profile')}
              />
            </motion.div>
          )}

          {currentStep === 'completion' && (
            <motion.div
              key="completion"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              layout
            >
              <CompletionStep
                onComplete={onComplete}
                teamName={teamData.name}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
