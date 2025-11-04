'use client'

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { AnimatePresence, motion } from 'framer-motion';
import { theme } from "@/styles/theme";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { signInWithOTP, verifyOTP } from "@/lib/auth";
import { isValidEmail } from "@/utils/validation";
import { logoVariants, mainVariants, settingsVariants, onboardingVariants } from "@/constants/animations";

// Components
import { AuthLoading } from "@/components/auth/AuthLoading";
import { EmailScreen } from "@/components/auth/EmailScreen";
import { OTPScreen } from "@/components/auth/OTPScreen";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { Sidebar } from "@/components/layout/Sidebar";
import { MainScreen } from "@/components/MainScreen";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { PlayersView } from "@/components/players/PlayersView";
import { MethodologyView } from "@/components/methodology/MethodologyView";
import { SettingsView } from "@/components/settings/SettingsView";


export default function LoginPage() {
  // Get auth state from AuthContext
  const { user, coach, loading, signOut, refreshAuth } = useAuth();

  // Local UI state
  const [currentScreen, setCurrentScreen] = useState<'email' | 'otp' | 'onboarding' | 'main' | 'settings'>('email');
  const [currentView, setCurrentView] = useState<'sessions' | 'settings' | 'dashboard' | 'methodology' | 'players'>('dashboard');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Local auth form state (only for the auth flow)
  const [email, setEmail] = useState('');
  const [showEmailError, setShowEmailError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [authSuccess, setAuthSuccess] = useState(false);
  const [allowAuthRedirect, setAllowAuthRedirect] = useState(false);
  const [otpScreenFading, setOtpScreenFading] = useState(false);

  // Current session selection state
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionMode, setSessionMode] = useState<'view' | 'edit'>('view');

  // Teams data for AI context
  const [teamsData, setTeamsData] = useState<Array<{
    id: string;
    name: string;
    age_group: string;
    skill_level: string;
    player_count: number;
    session_duration: number;
  }>>([]);

  // Auto-redirect authenticated users
  useEffect(() => {
    if (allowAuthRedirect && user && coach && currentScreen === 'email') {
      setCurrentScreen('main');
    }
  }, [allowAuthRedirect, user, coach, currentScreen]);

  useEffect(() => {
    if (!loading && user && currentScreen === 'email' && !isLoading && !authSuccess) {
      setAllowAuthRedirect(true);
    }
  }, [loading, user, currentScreen, isLoading, authSuccess]);

  // ============================================
  // Auth Handlers
  // ============================================
  const handleEmailSubmit = async () => {
    if (email.trim() && isValidEmail(email)) {
      setIsLoading(true);
      setShowEmailError(false);

      const { error } = await signInWithOTP(email);

      if (error) {
        setShowEmailError(true);
        setIsLoading(false);
        console.error('Error sending OTP:', error);
      } else {
        setTimeout(() => {
          setIsLoading(false);
          setCurrentScreen('otp');
        }, 1500);
      }
    } else {
      setShowEmailError(true);
    }
  };

  const handleOTPComplete = async (otp: string) => {
    setIsLoading(true);
    setOtpError('');

    const { data, error } = await verifyOTP(email, otp);

    if (error) {
      setOtpError(error);
      setIsLoading(false);
    } else if (data?.user) {
      const userId = data.user.id; // Store user ID for use in callback
      setOtpScreenFading(true);

      setTimeout(() => {
        setAuthSuccess(true);
        setIsLoading(true);
      }, 400);

      setTimeout(async () => {
        // Refresh auth context to ensure coach data is loaded
        await refreshAuth();

        // Check if onboarding is completed
        const { data: coachData } = await supabase
          .from('coaches')
          .select('onboarding_completed')
          .eq('auth_user_id', userId)
          .single();

        if (coachData && !coachData.onboarding_completed) {
          // Show onboarding wizard
          setCurrentScreen('onboarding');
        } else {
          // Go to main app
          setCurrentScreen('main');
        }

        setIsLoading(false);
      }, 3400);
    }
  };

  const handleOTPSubmit = () => {
    // OTP verification submitted
  };

  const handleLogout = async () => {
    setIsLoading(true);
    // Clear local auth state
    setEmail('');
    setOtpError('');
    setShowEmailError(false);
    setAuthSuccess(false);
    setAllowAuthRedirect(false);
    // Reset screens
    setCurrentScreen('email');
    // Clear session and team state to prevent cross-account contamination
    setCurrentSessionId(null);
    setSelectedTeamId(null);
    // AuthContext signOut handles the rest
    await signOut();
    setIsLoading(false);
  };

  // ============================================
  // Onboarding Handler
  // ============================================
  const handleOnboardingComplete = async () => {
    // Refresh auth to get updated coach data
    await refreshAuth();
    // Redirect to main app
    setCurrentScreen('main');
  };

  // ============================================
  // Session Handlers
  // ============================================
  const handleNewSession = () => {
    // This will be handled by Sidebar directly
    setCurrentScreen('main');
  };

  const handleSessionClick = (sessionId: string | null) => {
    setCurrentSessionId(sessionId);
    setCurrentScreen('main');
  };

  const handleNavigateToSession = (sessionId: string, mode: 'view' | 'edit') => {
    setCurrentSessionId(sessionId);
    setSessionMode(mode);
    setCurrentView('sessions');
  };

  const handleClearSession = () => {
    setCurrentSessionId(null);
    setSessionMode('view');
  };

  // Clear session state when switching away from sessions view
  useEffect(() => {
    if (currentView !== 'sessions') {
      handleClearSession();
    }
  }, [currentView]);

  // ============================================
  // Team Handlers (simplified)
  // ============================================
  const handleTeamsLoad = (teams: Array<{
    id: string;
    name: string;
    age_group: string;
    skill_level: string;
    player_count: number;
    session_duration: number;
  }>) => {
    setTeamsData(teams);
  };


  // ============================================
  // Render
  // ============================================
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.colors.background.primary,
      position: 'relative',
      padding: (currentScreen === 'main' || currentScreen === 'settings') ? 0 : theme.spacing.xl,
    }}>
      {/* Show loading during auth check */}
      {loading && <AuthLoading type="initial" />}

      {/* Show auth success loading */}
      {authSuccess && isLoading && <AuthLoading type="success" />}

      {/* Logo for auth screens (not onboarding) */}
      {currentScreen !== 'main' && currentScreen !== 'settings' && currentScreen !== 'onboarding' && (
        <motion.div
          variants={logoVariants}
          initial="initial"
          animate="animate"
          style={{
            position: 'absolute',
            top: '25vh',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Image src="/logo.png" alt="Via Logo" width={120} height={120} priority />
        </motion.div>
      )}

      {/* Onboarding Wizard */}
      {currentScreen === 'onboarding' && coach && (
        <motion.div
          key="onboarding"
          variants={onboardingVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <OnboardingWizard
            coachId={coach.id}
            initialName={coach.name}
            onComplete={handleOnboardingComplete}
          />
        </motion.div>
      )}

      {/* Main screen layout: sidebar + content */}
      {currentScreen === 'main' ? (
        <div style={{
          display: 'flex',
          height: '100vh',
          width: '100%',
        }}>
          <Sidebar
            currentScreen={currentScreen}
            selectedTeamId={selectedTeamId || ''}
            setSelectedTeamId={setSelectedTeamId}
            currentView={currentView}
            setCurrentView={setCurrentView}
            onLogout={handleLogout}
            onTeamsLoad={handleTeamsLoad}
          />

          {/* Content area */}
          <div style={{
            flex: 1,
            height: '100vh',
            overflow: 'auto',
            backgroundColor: theme.colors.background.primary,
          }}>
            <AnimatePresence mode="wait">
              {currentView === 'sessions' && (
                <MainScreen
                  sessionId={currentSessionId}
                  sessionMode={sessionMode}
                  coachId={coach?.id || null}
                  teamId={selectedTeamId}
                  teams={teamsData}
                  onClearSession={handleClearSession}
                />
              )}

              {currentView === 'dashboard' && selectedTeamId && coach?.id && (
                <DashboardView
                  coachId={coach.id}
                  teamId={selectedTeamId}
                  onNavigateToSession={handleNavigateToSession}
                />
              )}

              {currentView === 'settings' && coach?.id && (
                <SettingsView
                  coachId={coach.id}
                  coach={coach}
                  refreshAuth={refreshAuth}
                />
              )}

              {currentView === 'players' && selectedTeamId && coach?.id && (
                <PlayersView
                  coachId={coach.id}
                  teamId={selectedTeamId}
                />
              )}

              {currentView === 'methodology' && selectedTeamId && coach?.id && (
                <MethodologyView
                  coachId={coach.id}
                  teamId={selectedTeamId}
                />
              )}

              {!['sessions', 'dashboard', 'settings', 'players', 'methodology'].includes(currentView) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    color: theme.colors.text.primary,
                    fontSize: theme.typography.fontSize['2xl'],
                    fontWeight: theme.typography.fontWeight.semibold,
                  }}
                >
                  {currentView.charAt(0).toUpperCase() + currentView.slice(1).replace('-', ' ')} - Coming Soon
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* Auth screens - centered layout */
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: '400px',
          paddingLeft: theme.spacing.xl,
          paddingRight: theme.spacing.xl,
        }}>
          <AnimatePresence mode="wait">
            {currentScreen === 'email' && (
              <EmailScreen
                email={email}
                setEmail={setEmail}
                showEmailError={showEmailError}
                setShowEmailError={setShowEmailError}
                isLoading={isLoading}
                onSubmit={handleEmailSubmit}
              />
            )}

            {currentScreen === 'otp' && (
              <OTPScreen
                email={email}
                otpError={otpError}
                otpScreenFading={otpScreenFading}
                onComplete={handleOTPComplete}
                onSubmit={handleOTPSubmit}
                onBack={() => {
                  setCurrentScreen('email');
                  setOtpError('');
                }}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}