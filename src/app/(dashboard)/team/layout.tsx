'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { MdGroup } from 'react-icons/md'
import { IoChevronBack } from 'react-icons/io5'
import { theme } from '@/styles/theme'
import { useTeam } from '@/contexts/TeamContext'

const myTeamSections = [
  {
    id: 'players',
    title: 'Players',
    description: 'Manage players and their individual development plans',
    href: '/team/players',
  },
  {
    id: 'settings',
    title: 'Facilities & Equipment',
    description: 'Configure team facilities and equipment',
    href: '/team/settings',
  },
  {
    id: 'analysis',
    title: 'Analysis',
    description: 'View team performance data and development insights',
    href: '/team/analysis',
  },
]

export default function MyTeamLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { selectedTeam, isLoadingTeams } = useTeam()

  const activeSection = myTeamSections.find(section =>
    pathname.startsWith(section.href)
  )?.id || 'players'

  // Check if we're on a player detail page
  const isPlayerDetailPage = /^\/team\/players\/[^/]+$/.test(pathname)

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
        justifyContent: 'space-between',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
        }}>
          <MdGroup size={28} color={theme.colors.text.primary} />
          <div>
            <h1 style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
            }}>
              Team & Players
            </h1>
            {selectedTeam && (
              <p style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                marginTop: '2px',
              }}>
                {selectedTeam.name}
              </p>
            )}
          </div>
        </div>
        {isPlayerDetailPage && (
          <Link
            href="/team/players"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.sm,
              textDecoration: 'none',
              marginRight: theme.spacing.md,
            }}
          >
            <IoChevronBack size={16} />
            Back to Players
          </Link>
        )}
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
          {myTeamSections.map((section) => {
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
          {!selectedTeam && !isLoadingTeams ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: theme.colors.text.secondary,
            }}>
              Please select a team to view players
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  )
}
