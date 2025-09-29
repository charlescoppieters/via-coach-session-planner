'use client'

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { AnimatePresence, motion } from 'framer-motion';
import { theme } from "@/styles/theme";
import { useAuth } from "@/contexts/AuthContext";
import { signInWithOTP, verifyOTP } from "@/lib/auth";
import { isValidEmail } from "@/utils/validation";
import { logoVariants, mainVariants, settingsVariants } from "@/constants/animations";

// Components
import { AuthLoading } from "@/components/auth/AuthLoading";
import { EmailScreen } from "@/components/auth/EmailScreen";
import { OTPScreen } from "@/components/auth/OTPScreen";
import { Sidebar } from "@/components/layout/Sidebar";
import { MainScreen } from "@/components/MainScreen";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { TeamList } from "@/components/teams/TeamList";
import { TeamDetails } from "@/components/settings/TeamDetails";
import { GlobalRules } from "@/components/rules/GlobalRules";


export default function LoginPage() {
  // Get auth state from AuthContext
  const { user, coach, loading, signOut, refreshAuth } = useAuth();

  // Local UI state
  const [currentScreen, setCurrentScreen] = useState<'email' | 'otp' | 'main' | 'settings'>('email');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedSettingsTeamId, setSelectedSettingsTeamId] = useState<string | null>(null);
  const [triggerNewTeam, setTriggerNewTeam] = useState(0);
  const [deletedTeamId, setDeletedTeamId] = useState<string | null>(null);

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

  // Teams data for AI context
  const [teamsData, setTeamsData] = useState<any[]>([]);

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
      setOtpScreenFading(true);

      setTimeout(() => {
        setAuthSuccess(true);
        setIsLoading(true);
      }, 400);

      setTimeout(async () => {
        // Refresh auth context to ensure coach data is loaded
        await refreshAuth();
        setCurrentScreen('main');
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
    setSelectedSettingsTeamId(null);
    setTriggerNewTeam(0);
    setDeletedTeamId(null);
    // AuthContext signOut handles the rest
    await signOut();
    setIsLoading(false);
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

  // ============================================
  // Team Handlers (simplified)
  // ============================================
  const handleAddNewTeam = () => {
    // Trigger the TeamList to create a new team
    setTriggerNewTeam(prev => prev + 1);
  };

  const handleTeamsLoad = (teams: any[]) => {
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

      {/* Logo for auth screens */}
      {currentScreen !== 'main' && currentScreen !== 'settings' && (
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

      {/* Sidebar for main and settings screens */}
      {(currentScreen === 'main' || currentScreen === 'settings') && (
        <Sidebar
          currentScreen={currentScreen}
          selectedTeamId={selectedTeamId || ''}
          setSelectedTeamId={setSelectedTeamId}
          currentSessionId={currentSessionId}
          onNewSession={handleNewSession}
          onAddNewTeam={handleAddNewTeam}
          onSessionClick={handleSessionClick}
          onSettingsClick={() => setCurrentScreen(currentScreen === 'settings' ? 'main' : 'settings')}
          onLogout={handleLogout}
          setCurrentScreen={setCurrentScreen}
          sidebarExpanded={sidebarExpanded}
          setSidebarExpanded={setSidebarExpanded}
          onTeamsLoad={handleTeamsLoad}
        />
      )}

      {/* Content - centered vertically for auth screens */}
      <div style={{
        position: (currentScreen === 'main' || currentScreen === 'settings') ? 'static' : 'absolute',
        top: (currentScreen === 'main' || currentScreen === 'settings') ? 'auto' : '50%',
        left: (currentScreen === 'main' || currentScreen === 'settings') ? 'auto' : '50%',
        transform: (currentScreen === 'main' || currentScreen === 'settings') ? 'none' : 'translate(-50%, -50%)',
        width: '100%',
        maxWidth: (currentScreen === 'main' || currentScreen === 'settings') ? '100%' : '400px',
        paddingLeft: (currentScreen === 'main' || currentScreen === 'settings') ? 0 : theme.spacing.xl,
        paddingRight: (currentScreen === 'main' || currentScreen === 'settings') ? 0 : theme.spacing.xl,
        height: (currentScreen === 'main' || currentScreen === 'settings') ? '100vh' : 'auto',
      }}>
        {/* Screen routing */}
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

          {currentScreen === 'main' && (
            <motion.div
              key="main-content"
              variants={mainVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{
                marginLeft: sidebarExpanded ? '25%' : '60px',
                width: sidebarExpanded ? '75%' : 'calc(100% - 60px)',
                height: '100vh',
                backgroundColor: theme.colors.background.primary,
                display: 'flex',
                flexDirection: 'column',
                transition: theme.transitions.normal,
              }}
            >
              {/* Header with Logo */}
              <div
                style={{
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.background.primary,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: '0 0 16px 16px',
                }}
              >
                <Image
                  src="/logo.png"
                  alt="Via Logo"
                  width={40}
                  height={40}
                  priority
                />
              </div>

              <MainScreen
                sessionId={currentSessionId}
                coachId={coach?.id || null}
                teamId={selectedTeamId}
                teams={teamsData}
              />
            </motion.div>
          )}

          {currentScreen === 'settings' && (
            <motion.div
              key="settings-content"
              variants={settingsVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{
                marginLeft: sidebarExpanded ? '25%' : '60px',
                width: sidebarExpanded ? '75%' : 'calc(100% - 60px)',
                height: '100vh',
                backgroundColor: theme.colors.background.primary,
                display: 'flex',
                flexDirection: 'column',
                transition: theme.transitions.normal,
              }}
            >
              {/* Header with Logo */}
              <div
                style={{
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.background.primary,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: '0 0 16px 16px',
                }}
              >
                <Image
                  src="/logo.png"
                  alt="Via Logo"
                  width={40}
                  height={40}
                  priority
                />
              </div>

              <SettingsPanel>
                <TeamList
                  coachId={coach?.id || null}
                  selectedTeamId={selectedSettingsTeamId}
                  onTeamSelect={setSelectedSettingsTeamId}
                  triggerNewTeam={triggerNewTeam}
                  deletedTeamId={deletedTeamId}
                  onTeamCreated={() => {
                    // Team was created - TeamList already updated its own state
                    // We could do additional logic here if needed
                  }}
                />

                {/* Right Panel - Team Details or Global Settings */}
                <div
                  style={{
                    width: '60%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: theme.colors.background.secondary,
                    borderRadius: theme.borderRadius.lg,
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                    overflow: 'hidden',
                  }}
                >
                  {selectedSettingsTeamId === 'global' ? (
                    <GlobalRules
                      coachId={coach?.id || null}
                    />
                  ) : selectedSettingsTeamId ? (
                    <TeamDetails
                      teamId={selectedSettingsTeamId}
                      coachId={coach?.id || null}
                      onTeamDeleted={() => {
                        // Trigger TeamList to remove team immediately
                        setDeletedTeamId(selectedSettingsTeamId);
                        // Clear selection
                        setSelectedSettingsTeamId(null);
                        // Reset deleted team id after a brief delay
                        setTimeout(() => setDeletedTeamId(null), 100);
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: theme.colors.text.muted,
                        fontSize: theme.typography.fontSize.lg,
                        padding: theme.spacing.xl,
                      }}
                    >
                      Select a team or coaching methodology to manage
                    </div>
                  )}
                </div>
              </SettingsPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}