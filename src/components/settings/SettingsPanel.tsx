'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { theme } from "@/styles/theme";
import { settingsVariants } from '@/constants/animations';

interface SettingsPanelProps {
  children: React.ReactNode;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ children }) => {
  return (
    <motion.div
      key="settings"
      variants={settingsVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        flex: 1,
        height: '100vh',
        backgroundColor: theme.colors.background.primary,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: theme.spacing.lg,
          padding: theme.spacing.md,
          height: '100%',
        }}
      >
        {children}
      </div>
    </motion.div>
  );
};