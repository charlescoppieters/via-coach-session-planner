'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { CgSpinnerAlt } from "react-icons/cg";
import { OTPInput } from "@/components/ui/OTPInput";
import { theme } from "@/styles/theme";

interface OTPScreenProps {
  email: string;
  otpError: string;
  otpScreenFading: boolean;
  isVerifying?: boolean;
  onComplete: (code: string) => void;
  onSubmit: (code?: string) => void;
  onBack: () => void;
}

export const OTPScreen: React.FC<OTPScreenProps> = ({
  email,
  otpError,
  otpScreenFading,
  isVerifying = false,
  onComplete,
  onSubmit,
  onBack
}) => {
  return (
    <div>
      {/* Title */}
      <div
        style={{
          textAlign: 'center',
          marginTop: '-5vh',
          marginBottom: theme.spacing.xl,
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

      {/* OTP Input */}
      <div>
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
              marginTop: theme.spacing.md,
              textAlign: 'center',
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

      {/* Loading indicator */}
      {isVerifying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            marginTop: theme.spacing.lg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.sm,
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{
              display: 'inline-block',
            }}
          >
            <CgSpinnerAlt
              size={16}
              color={theme.colors.gold.main}
            />
          </motion.div>
          <p
            style={{
              color: theme.colors.text.muted,
              fontSize: theme.typography.fontSize.sm,
              margin: 0,
            }}
          >
            Verifying...
          </p>
        </motion.div>
      )}

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