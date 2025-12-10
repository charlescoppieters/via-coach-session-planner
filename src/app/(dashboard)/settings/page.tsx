'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { IoChevronForward } from 'react-icons/io5'
import { theme } from '@/styles/theme'
import { useAuth } from '@/contexts/AuthContext'
import { getProfilePictureUrl } from '@/lib/storage'

export default function SettingsPage() {
  const { coach, club, clubMembership, isAdmin } = useAuth()

  return (
    <div style={{ padding: theme.spacing.xl }}>
      <h1
        style={{
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.lg,
        }}
      >
        {isAdmin ? 'Club Settings' : 'Settings'}
      </h1>

      {/* Club Information Section */}
      <div
        style={{
          backgroundColor: theme.colors.background.primary,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.xl,
          marginBottom: theme.spacing.lg,
        }}
      >
        <h2
          style={{
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.lg,
          }}
        >
          Club Information
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          {/* Club Logo */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: theme.colors.background.tertiary,
              border: club?.logo_url ? `2px solid ${theme.colors.gold.main}` : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {club?.logo_url ? (
              <Image
                src={club.logo_url}
                alt={club.name}
                width={80}
                height={80}
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <span
                style={{
                  fontSize: theme.typography.fontSize['2xl'],
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.text.secondary,
                }}
              >
                {club?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'C'}
              </span>
            )}
          </div>

          {/* Info */}
          <div>
            <div
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.xs,
              }}
            >
              {club?.name}
            </div>
          </div>
        </div>

        {isAdmin && (
          <Link
            href="/settings/club"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              color: theme.colors.gold.main,
              fontSize: theme.typography.fontSize.base,
              textDecoration: 'none',
            }}
          >
            Manage Club Info
            <IoChevronForward size={16} />
          </Link>
        )}
      </div>

      {/* Coach Profile Section */}
      <div
        style={{
          backgroundColor: theme.colors.background.primary,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.xl,
          marginBottom: theme.spacing.lg,
        }}
      >
        <h2
          style={{
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.lg,
          }}
        >
          Coach Profile
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          {/* Avatar */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: theme.colors.background.tertiary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {coach?.profile_picture ? (
              <img
                src={getProfilePictureUrl(coach.profile_picture)}
                alt={coach.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span
                style={{
                  fontSize: theme.typography.fontSize['2xl'],
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.text.secondary,
                }}
              >
                {coach?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'C'}
              </span>
            )}
          </div>

          {/* Info */}
          <div>
            <div
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.xs,
              }}
            >
              {coach?.name}
            </div>
            <div
              style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.xs,
              }}
            >
              {coach?.email}
            </div>
            <div
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
              }}
            >
              {isAdmin ? 'Admin' : clubMembership?.role || 'Coach'}
            </div>
          </div>
        </div>

        <Link
          href="/settings/profile"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            color: theme.colors.gold.main,
            fontSize: theme.typography.fontSize.base,
            textDecoration: 'none',
          }}
        >
          Manage Coach Profile
          <IoChevronForward size={16} />
        </Link>
      </div>

      {/* Coach Management Section (admin only) */}
      {isAdmin && (
        <div
          style={{
            backgroundColor: theme.colors.background.primary,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.xl,
            marginBottom: theme.spacing.lg,
          }}
        >
          <h2
            style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md,
            }}
          >
            Coach Management
          </h2>
          <p
            style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.base,
              marginBottom: theme.spacing.md,
            }}
          >
            Manage coaches in your club, update roles, and assign teams.
          </p>
          <Link
            href="/settings/coaches"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              color: theme.colors.gold.main,
              fontSize: theme.typography.fontSize.base,
              textDecoration: 'none',
            }}
          >
            Manage Coaches
            <IoChevronForward size={16} />
          </Link>
        </div>
      )}

      {/* Team Management Section (admin only) */}
      {isAdmin && (
        <div
          style={{
            backgroundColor: theme.colors.background.primary,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.xl,
          }}
        >
          <h2
            style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md,
            }}
          >
            Team Management
          </h2>
          <p
            style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.base,
              marginBottom: theme.spacing.md,
            }}
          >
            Create and manage teams in your club.
          </p>
          <Link
            href="/settings/teams"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              color: theme.colors.gold.main,
              fontSize: theme.typography.fontSize.base,
              textDecoration: 'none',
            }}
          >
            Manage Teams
            <IoChevronForward size={16} />
          </Link>
        </div>
      )}
    </div>
  )
}
