'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { theme } from '@/styles/theme'
import { useAuth } from '@/contexts/AuthContext'
import { TeamProvider } from '@/contexts/TeamContext'
import { SidebarV2 } from '@/components/layout/SidebarV2'
import { AuthLoading } from '@/components/auth/AuthLoading'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, coach, club, loading } = useAuth()

  // Only redirect for onboarding - middleware handles login protection
  useEffect(() => {
    if (!loading && coach && !coach.onboarding_completed) {
      router.replace('/onboarding')
    }
  }, [coach, loading, router])

  // Show loading while context is loading or data is incomplete
  if (loading || !coach || !club) {
    return <AuthLoading type="initial" />
  }

  return (
    <TeamProvider>
      <div
        style={{
          display: 'flex',
          height: '100vh',
          width: '100%',
          backgroundColor: theme.colors.background.primary,
        }}
      >
        <SidebarV2 />
        <main
          style={{
            flex: 1,
            height: '100vh',
            overflow: 'auto',
            backgroundColor: theme.colors.background.secondary,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ height: '100%' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </TeamProvider>
  )
}
