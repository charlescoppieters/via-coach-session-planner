'use client'

import { useState, useEffect, ReactNode } from 'react'
import Image from 'next/image'
import { theme } from '@/styles/theme'

interface ScreenSizeGuardProps {
  children: ReactNode
  minWidth?: number
}

export function ScreenSizeGuard({ children, minWidth = 1024 }: ScreenSizeGuardProps) {
  const [windowWidth, setWindowWidth] = useState<number | null>(null)

  useEffect(() => {
    setWindowWidth(window.innerWidth)
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Show nothing during SSR hydration
  if (windowWidth === null) return null

  if (windowWidth < minWidth) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: theme.spacing.xl,
          backgroundColor: theme.colors.background.primary,
          textAlign: 'center',
        }}
      >
        <Image
          src="/logo.png"
          alt="Via Logo"
          width={80}
          height={80}
          priority
        />
        <h2
          style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            marginTop: theme.spacing.xl,
            marginBottom: theme.spacing.md,
          }}
        >
          Screen Too Small
        </h2>
        <p
          style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.secondary,
            maxWidth: '300px',
            lineHeight: 1.6,
          }}
        >
          Please access Via Session Planner from a larger screen like a computer or tablet.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
