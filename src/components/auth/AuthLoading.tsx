'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { CgSpinnerAlt } from "react-icons/cg";
import { theme } from "@/styles/theme";

interface AuthLoadingProps {
  type?: 'initial' | 'success';
}

export const AuthLoading: React.FC<AuthLoadingProps> = ({ type = 'initial' }) => {
  const spinnerSize = type === 'success' ? 40 : 32;

  if (type === 'success') {
    // Auth success loading screen (no animations to prevent flash)
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: theme.colors.background.primary,
          position: 'relative',
        }}
      >

        {/* Spinner centered in screen */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
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
              size={spinnerSize}
              color={theme.colors.gold.main}
            />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Initial loading screen while checking auth status
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      style={{
        minHeight: '100vh',
        backgroundColor: theme.colors.background.primary,
        position: 'relative',
      }}
    >

      {/* Spinner centered in screen */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
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
            size={spinnerSize}
            color={theme.colors.gold.main}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};