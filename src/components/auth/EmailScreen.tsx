'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { CgSpinnerAlt } from "react-icons/cg";
import { Input } from "@/components/ui/Input";
import { theme } from "@/styles/theme";

interface EmailScreenProps {
  email: string;
  setEmail: (email: string) => void;
  showEmailError: boolean;
  setShowEmailError: (show: boolean) => void;
  isLoading: boolean;
  onSubmit: () => void;
}

export const EmailScreen: React.FC<EmailScreenProps> = ({
  email,
  setEmail,
  showEmailError,
  setShowEmailError,
  isLoading,
  onSubmit
}) => {
  return (
    <div>
      {/* Email Input */}
      <div style={{ position: 'relative' }}>
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (showEmailError) setShowEmailError(false);
          }}
          onSubmit={onSubmit}
          error={showEmailError}
          style={{
            fontSize: theme.typography.fontSize.base,
            padding: theme.spacing.md,
            textAlign: 'left',
          }}
        />

        {/* Email validation error */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: showEmailError ? 1 : 0,
            transition: { duration: 0.3, ease: "easeOut" }
          }}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: theme.spacing.md,
            pointerEvents: 'none',
          }}
        >
          <p
            style={{
              color: '#EF5350',
              fontSize: theme.typography.fontSize.sm,
              margin: 0,
              textAlign: 'center',
            }}
          >
            Please enter a valid email address
          </p>
        </motion.div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            marginTop: theme.spacing.md,
            pointerEvents: 'none',
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
              transformOrigin: 'center center',
              willChange: 'transform',
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
            Sending code...
          </p>
        </motion.div>
      )}
    </div>
  );
};
