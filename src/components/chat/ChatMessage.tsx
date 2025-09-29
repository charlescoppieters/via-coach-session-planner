'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { BsThreeDots } from "react-icons/bs";
import { theme } from "@/styles/theme";

export type ChatMessageType = {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isThinking = message.id === 'thinking' && message.content === '...';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.xl,
        background: message.type === 'user'
          ? theme.colors.gold.main
          : theme.colors.background.tertiary,
        color: message.type === 'user'
          ? theme.colors.text.secondary
          : theme.colors.text.primary,
        alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
        maxWidth: '75%',
        boxShadow: 'none',
        fontSize: theme.typography.fontSize.base,
        lineHeight: 1.6,
        minHeight: isThinking ? '24px' : 'auto',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'pre-wrap', // Preserve newlines and wrap text
      }}
    >
      {isThinking ? (
        <BsThreeDots
          style={{
            fontSize: '24px',
            color: theme.colors.text.muted,
          }}
        />
      ) : (
        message.content
      )}
    </motion.div>
  );
};