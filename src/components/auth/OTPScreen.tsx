'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { OTPInput } from "@/components/ui/OTPInput";
import { theme } from "@/styles/theme";

interface OTPScreenProps {
  email: string;
  otpError: string;
  otpScreenFading: boolean;
  onComplete: (code: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export const OTPScreen: React.FC<OTPScreenProps> = ({
  email,
  otpError,
  otpScreenFading,
  onComplete,
  onSubmit,
  onBack
}) => {
  return (
    <div style={{ position: 'relative' }}>
      {/* Title - positioned above the input */}
      <div
        style={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          right: 0,
          marginBottom: theme.spacing.xl,
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            color: theme.colors.text.primary,
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.medium,
            margin: 0,
            marginBottom: theme.spacing.sm,
          }}
        >
          Check your email
        </h2>
        <p
          style={{
            color: theme.colors.text.muted,
            fontSize: theme.typography.fontSize.sm,
            margin: 0,
          }}
        >
          Enter the 6-digit code sent to {email}
        </p>
      </div>

      {/* OTP Input - this is the anchor element */}
      <div style={{ position: 'relative' }}>
        <OTPInput
          length={6}
          onComplete={onComplete}
          onSubmit={onSubmit}
        />

        {/* Error message */}
        {otpError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: theme.spacing.md,
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <p
              style={{
                color: theme.colors.status.error,
                fontSize: theme.typography.fontSize.sm,
                margin: 0,
              }}
            >
              {otpError}
            </p>
          </motion.div>
        )}
      </div>

      {/* Back to email link */}
      <div
        style={{
          textAlign: 'center',
          marginTop: theme.spacing.lg,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.text.secondary,
            fontSize: theme.typography.fontSize.sm,
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: 0,
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
};