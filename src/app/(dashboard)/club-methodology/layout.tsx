'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { HiOutlineClipboardDocumentList } from 'react-icons/hi2'
import { theme } from '@/styles/theme'
import { useAuth } from '@/contexts/AuthContext'

const methodologySections = [
  {
    id: 'playing',
    title: 'Playing Methodology',
    description: 'How you want your team to play during matches',
    href: '/club-methodology/playing',
  },
  {
    id: 'training',
    title: 'Training Methodology',
    description: 'How you plan to train your players, including practice design, coaching style, and key themes',
    href: '/club-methodology/training',
  },
  {
    id: 'profiling',
    title: 'Positional Profiling',
    description: 'Clear descriptions of each position that align with your playing style and team structure',
    href: '/club-methodology/profiling',
  },
]

export default function ClubMethodologyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAdmin, club } = useAuth()

  // Redirect non-head coaches
  useEffect(() => {
    if (!isAdmin) {
      router.replace('/')
    }
  }, [isAdmin, router])

  if (!isAdmin) {
    return null
  }

  const activeSection = methodologySections.find(section =>
    pathname.startsWith(section.href)
  )?.id || 'playing'

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: theme.spacing.xl,
      gap: theme.spacing.lg,
      backgroundColor: theme.colors.background.primary,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.md,
      }}>
        <HiOutlineClipboardDocumentList size={28} color={theme.colors.text.primary} />
        <div>
          <h1 style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
          }}>
            Club Methodology
          </h1>
          {club && (
            <p style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              marginTop: '2px',
            }}>
              {club.name}
            </p>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div style={{
        display: 'flex',
        flex: 1,
        gap: theme.spacing.lg,
        minHeight: 0,
      }}>
        {/* Sub-sidebar */}
        <div
          style={{
            width: '260px',
            minWidth: '260px',
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.sm,
          }}
        >
          {methodologySections.map((section) => {
            const isActive = activeSection === section.id
            return (
              <Link
                key={section.id}
                href={section.href}
                style={{
                  display: 'block',
                  padding: theme.spacing.md,
                  backgroundColor: isActive
                    ? theme.colors.background.secondary
                    : 'transparent',
                  borderRadius: theme.borderRadius.lg,
                  textDecoration: 'none',
                  transition: theme.transitions.fast,
                }}
              >
                <div
                  style={{
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text.primary,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  {section.title}
                </div>
                <div
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                    lineHeight: 1.4,
                  }}
                >
                  {section.description}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Main content card */}
        <div
          style={{
            flex: 1,
            backgroundColor: theme.colors.background.secondary,
            borderRadius: theme.borderRadius.xl,
            padding: theme.spacing.xl,
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
