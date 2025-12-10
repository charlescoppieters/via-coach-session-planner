'use client'

import React from 'react'
import { HiOfficeBuilding } from 'react-icons/hi'
import { theme } from '@/styles/theme'

interface ClubBadgeProps {
  logoUrl?: string | null
}

export const ClubBadge: React.FC<ClubBadgeProps> = ({ logoUrl }) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        backgroundColor: logoUrl ? 'transparent' : 'rgba(239, 191, 4, 0.15)',
        color: theme.colors.gold.main,
        borderRadius: '50%',
        flexShrink: 0,
        overflow: 'hidden',
      }}
      title="Club-wide rule"
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="Club"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <HiOfficeBuilding size={20} />
      )}
    </span>
  )
}
