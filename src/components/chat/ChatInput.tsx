'use client'

import React from 'react';
import { theme } from "@/styles/theme";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div
      style={{
        padding: theme.spacing.lg,
        background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          gap: theme.spacing.md,
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the AI coach for help..."
          style={{
            flex: 1,
            padding: theme.spacing.md,
            backgroundColor: theme.colors.background.tertiary,
            border: '2px solid transparent',
            borderRadius: theme.borderRadius.xl,
            color: theme.colors.text.primary,
            fontSize: theme.typography.fontSize.base,
            fontFamily: theme.typography.fontFamily.primary,
            outline: 'none',
            boxShadow: 'none',
            transition: theme.transitions.normal,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = theme.colors.gold.main;
            e.target.style.boxShadow = 'none';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'transparent';
            e.target.style.boxShadow = 'none';
          }}
        />
        <button
          type="submit"
          style={{
            padding: `${theme.spacing.md} ${theme.spacing.lg}`,
            background: theme.colors.gold.main,
            border: 'none',
            borderRadius: theme.borderRadius.xl,
            color: theme.colors.text.primary,
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            cursor: 'pointer',
            transition: theme.transitions.fast,
            boxShadow: 'none',
            letterSpacing: '-0.025em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};