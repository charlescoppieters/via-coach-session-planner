'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { OTPInput } from "@/components/ui/OTPInput";
import { theme } from "@/styles/theme";
import { otpVariants } from '@/constants/animations';

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
    <motion.div
      key="otp"
      variants={otpVariants}
      initial="initial"
      animate={otpScreenFading ? {
        opacity: 0,
        x: -100,
        scale: 0.95
      } : "animate"}
      exit={{
        opacity: 0,
        x: 100,
        scale: 0.95,
        transition: { duration: 0.4, ease: "easeInOut" }
      }}
      transition={otpScreenFading ? { duration: 0.4, ease: "easeInOut" } : undefined}
    >
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { delay: 0.2, duration: 0.4 }
        }}
        style={{
          textAlign: 'center',
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
      </motion.div>

      {/* OTP Input */}
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          transition: { delay: 0.4, duration: 0.4 }
        }}
        style={{
          textAlign: 'center',
          marginTop: theme.spacing['2xl'],
        }}
      >
        <motion.button
          onClick={onBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.gold.main,
            fontSize: theme.typography.fontSize.sm,
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: 0,
          }}
        >
          Back
        </motion.button>
      </motion.div>
    </motion.div>
  );
};