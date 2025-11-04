'use client'

import React from 'react';
import Image from 'next/image';
import { theme } from '@/styles/theme';

interface WelcomeStepProps {
  onNext: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
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
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '48px',
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
        Welcome to VIA
      </h1>

      {/* Subtitle */}
      <p style={{
        fontSize: theme.typography.fontSize.xl,
        color: theme.colors.text.secondary,
        marginBottom: '48px',
        lineHeight: '1.6',
        maxWidth: '900px',
      }}>
        Your AI-powered coaching assistant and session planner
      </p>

      {/* Description */}
      <p style={{
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        marginBottom: '48px',
        lineHeight: '1.8',
        maxWidth: '500px',
      }}>
        Let's get you set up in just a few steps. We'll help you create your profile
        and set up your first team so you can start planning amazing sessions.
      </p>

      {/* Get Started Button */}
      <button
        onClick={onNext}
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
          marginTop: '32px',
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
        Get Started
      </button>
    </div>
  );
};
