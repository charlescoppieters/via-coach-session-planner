'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { theme } from '@/styles/theme'

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: 'easeOut' }}
      style={{
        height: '100vh',
        width: '100vw',
        position: 'relative',
        backgroundColor: theme.colors.background.primary,
        overflow: 'hidden',
      }}
    >
      {/* Logo - positioned 1/3 down the screen */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(33vh - 60px)', // 1/3 down, offset by half logo height
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
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

      {/* Content container - input anchored at 50vh, content expands downward */}
      {/* Using left/right: 0 + margin: auto instead of transform to avoid breaking position: fixed in children */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(50% - 24px)', // Offset so input center is at 50%
          left: 0,
          right: 0,
          width: '100%',
          maxWidth: '400px',
          margin: '0 auto',
          padding: theme.spacing.lg,
        }}
      >
        {children}
      </div>
    </motion.div>
  )
}
