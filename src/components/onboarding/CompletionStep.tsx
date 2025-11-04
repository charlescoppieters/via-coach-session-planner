'use client'

import React from 'react';
import Image from 'next/image';
import { theme } from '@/styles/theme';

interface CompletionStepProps {
  onComplete: () => void;
  teamName: string;
}

export const CompletionStep: React.FC<CompletionStepProps> = ({ onComplete, teamName }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: theme.spacing.xl,
      maxWidth: '900px',
      margin: '0 auto',
    }}>
      {/* Via Logo */}
      <div style={{
        marginBottom: theme.spacing.xl,
      }}>
        <Image
          src="/logo.png"
          alt="Via Logo"
          width={120}
          height={120}
          priority
        />
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: theme.typography.fontSize['4xl'],
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        margin: 0,
        marginBottom: '48px',
      }}>
        All Set!
      </h1>

      {/* Success Message */}
      <p style={{
        fontSize: theme.typography.fontSize.xl,
        color: theme.colors.text.secondary,
        marginBottom: '48px',
        lineHeight: '1.6',
        maxWidth: '450px',
      }}>
        Your profile and team "{teamName}" have been created successfully.
      </p>

      {/* Description */}
      <p style={{
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xl,
        lineHeight: '1.8',
        maxWidth: '500px',
      }}>
        Let's get started!
      </p>

      {/* Go to Dashboard Button */}
      <button
        onClick={onComplete}
        style={{
          padding: `${theme.spacing.md} ${theme.spacing.xl}`,
          backgroundColor: theme.colors.gold.main,
          color: theme.colors.background.primary,
          border: 'none',
          borderRadius: theme.borderRadius.lg,
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.bold,
          cursor: 'pointer',
          transition: theme.transitions.fast,
          marginTop: theme.spacing.lg,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.gold.light;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.gold.main;
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        Go to Dashboard
      </button>
    </div>
  );
};
