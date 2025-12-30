'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { theme } from '@/styles/theme'
import { AuthTransitionProvider, useAuthTransition } from '@/contexts/AuthTransitionContext'

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  const { isFadingOut } = useAuthTransition()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isFadingOut ? 0 : 1 }}
      transition={{ duration: isFadingOut ? 0.3 : 1, ease: 'easeOut' }}
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: theme.colors.background.primary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: '25vh',
        paddingLeft: theme.spacing.lg,
        paddingRight: theme.spacing.lg,
        paddingBottom: theme.spacing.xl,
        boxSizing: 'border-box',
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: '10vh' }}>
        <Image
          src="/logo.png"
          alt="VIA Logo"
          width={120}
          height={120}
          priority
          style={{
            width: 'auto',
            height: 'auto',
            maxWidth: '120px',
          }}
        />
      </div>

      {/* Content container */}
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
        }}
      >
        {children}
      </div>
    </motion.div>
  )
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Onboarding has its own full-screen layout - just pass through
  if (pathname === '/onboarding') {
    return <>{children}</>
  }

  return (
    <AuthTransitionProvider>
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </AuthTransitionProvider>
  )
}
