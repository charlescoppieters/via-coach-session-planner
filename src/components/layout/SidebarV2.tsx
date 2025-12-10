'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { MdDashboard, MdGroup } from 'react-icons/md'
import { GiSoccerBall } from 'react-icons/gi'
import { IoSettingsSharp, IoLogOut } from 'react-icons/io5'
import { FaGraduationCap, FaBuilding } from 'react-icons/fa'
import { HiOfficeBuilding } from 'react-icons/hi'
import { theme } from '@/styles/theme'
import { getProfilePictureUrl } from '@/lib/storage'
import { useAuth } from '@/contexts/AuthContext'
import { useTeam } from '@/contexts/TeamContext'

export const SidebarV2: React.FC = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { coach, club, isAdmin, signOut } = useAuth()
  const { teams, selectedTeamId, setSelectedTeamId, isLoadingTeams } = useTeam()

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

  // Track window width for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Calculate responsive sizes
  const getResponsiveSizes = () => {
    if (windowWidth >= 1200) {
      return {
        sidebarWidth: '260px',
        logoSize: 60,
        avatarSize: '80px',
        spacing: theme.spacing,
        fontSize: theme.typography.fontSize,
      }
    } else if (windowWidth >= 900) {
      return {
        sidebarWidth: '220px',
        logoSize: 50,
        avatarSize: '70px',
        spacing: {
          ...theme.spacing,
          lg: '14px',
          md: '10px',
        },
        fontSize: {
          ...theme.typography.fontSize,
          base: '14px',
          sm: '12px',
        },
      }
    } else {
      return {
        sidebarWidth: '180px',
        logoSize: 45,
        avatarSize: '60px',
        spacing: {
          ...theme.spacing,
          lg: '12px',
          md: '8px',
          sm: '6px',
        },
        fontSize: {
          ...theme.typography.fontSize,
          base: '13px',
          sm: '11px',
          '2xl': '18px',
        },
      }
    }
  }

  const responsive = getResponsiveSizes()

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  const NavItem = ({
    icon: Icon,
    label,
    href,
    isSelected,
  }: {
    icon: React.ComponentType<{ size: number }>
    label: string
    href: string
    isSelected: boolean
  }) => (
    <Link
      href={href}
      style={{
        padding: `${responsive.spacing.md} ${responsive.spacing.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: responsive.spacing.md,
        cursor: 'pointer',
        borderRadius: theme.borderRadius.md,
        border: isSelected ? `2px solid ${theme.colors.gold.main}` : '2px solid transparent',
        backgroundColor: isSelected ? 'rgba(239, 191, 4, 0.1)' : 'transparent',
        transition: theme.transitions.fast,
        color: theme.colors.text.primary,
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
    >
      <Icon size={windowWidth >= 900 ? 20 : 18} />
      <span
        style={{
          fontSize: responsive.fontSize.base,
          fontWeight: theme.typography.fontWeight.medium,
        }}
      >
        {label}
      </span>
    </Link>
  )

  const Divider = () => (
    <div
      style={{
        height: '1px',
        backgroundColor: theme.colors.border.secondary,
        margin: `${theme.spacing.md} 0`,
      }}
    />
  )

  return (
    <div
      style={{
        width: responsive.sidebarWidth,
        height: '100%',
        backgroundColor: theme.colors.background.primary,
        display: 'flex',
        flexDirection: 'column',
        padding: responsive.spacing.lg,
        gap: responsive.spacing.lg,
        borderRight: `1px solid ${theme.colors.border.primary}`,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 0,
        }}
      >
        <Image
          src="/logo.png"
          alt="Via Logo"
          width={responsive.logoSize}
          height={responsive.logoSize}
          priority
        />
      </div>

      <Divider />

      {/* Profile Section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: responsive.avatarSize,
            height: responsive.avatarSize,
            borderRadius: '50%',
            backgroundColor: theme.colors.background.tertiary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: responsive.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.muted,
            overflow: 'hidden',
            border: 'none',
          }}
        >
          {coach?.profile_picture ? (
            <img
              src={getProfilePictureUrl(coach.profile_picture)}
              alt={coach.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            coach?.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'C'
          )}
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: responsive.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            textAlign: 'center',
            marginTop: responsive.spacing.sm,
          }}
        >
          {coach?.name || 'Coach'}
        </div>

        {/* Club Name */}
        {club?.name && (
          <div
            style={{
              fontSize: responsive.fontSize.sm,
              color: theme.colors.gold.main,
              textAlign: 'center',
              marginTop: responsive.spacing.xs,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <HiOfficeBuilding size={12} />
            {club.name}
          </div>
        )}

        {/* Role */}
        {isAdmin && (
          <div
            style={{
              fontSize: responsive.fontSize.sm,
              color: theme.colors.text.secondary,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginTop: responsive.spacing.xs,
            }}
          >
            Head Coach
          </div>
        )}
      </div>

      {/* Team Selector */}
      <div style={{ marginTop: 0 }}>
        <select
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
          disabled={isLoadingTeams || teams.length === 0}
          style={{
            width: '100%',
            paddingTop: responsive.spacing.sm,
            paddingBottom: responsive.spacing.sm,
            paddingLeft: responsive.spacing.md,
            paddingRight: '2.5rem',
            backgroundColor: theme.colors.background.primary,
            color: theme.colors.text.primary,
            border: `2px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.md,
            fontSize: responsive.fontSize.base,
            fontWeight: theme.typography.fontWeight.medium,
            cursor: isLoadingTeams ? 'not-allowed' : 'pointer',
            outline: 'none',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.7rem center',
            backgroundSize: '1.2em',
          }}
        >
          {isLoadingTeams ? (
            <option>Loading teams...</option>
          ) : teams.length === 0 ? (
            <option>No teams yet</option>
          ) : (
            teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Main Navigation */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.xs,
          marginTop: 0,
        }}
      >
        <NavItem
          icon={MdDashboard}
          label="Dashboard"
          href="/"
          isSelected={pathname === '/'}
        />

        <NavItem
          icon={FaGraduationCap}
          label="Team Methodology"
          href="/methodology"
          isSelected={pathname.startsWith('/methodology')}
        />

        <NavItem
          icon={GiSoccerBall}
          label="Session Planning"
          href="/session-planning"
          isSelected={pathname.startsWith('/session-planning')}
        />

        <NavItem
          icon={MdGroup}
          label="Team & Players"
          href="/team"
          isSelected={pathname.startsWith('/team')}
        />
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      <Divider />

      {/* Bottom Navigation */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.xs,
        }}
      >
        {/* Club Methodology - Head Coach Only */}
        {isAdmin && (
          <NavItem
            icon={FaBuilding}
            label="Club Methodology"
            href="/club-methodology"
            isSelected={pathname.startsWith('/club-methodology')}
          />
        )}

        <NavItem
          icon={IoSettingsSharp}
          label={isAdmin ? 'Club Settings' : 'Settings'}
          href="/settings"
          isSelected={pathname.startsWith('/settings')}
        />

        <div
          onClick={handleLogout}
          style={{
            padding: `${responsive.spacing.md} ${responsive.spacing.lg}`,
            display: 'flex',
            alignItems: 'center',
            gap: responsive.spacing.md,
            cursor: 'pointer',
            borderRadius: theme.borderRadius.md,
            border: '2px solid transparent',
            backgroundColor: 'transparent',
            transition: theme.transitions.fast,
            color: theme.colors.text.primary,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <IoLogOut size={windowWidth >= 900 ? 20 : 18} />
          <span
            style={{
              fontSize: responsive.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
            }}
          >
            Log Out
          </span>
        </div>
      </div>
    </div>
  )
}
