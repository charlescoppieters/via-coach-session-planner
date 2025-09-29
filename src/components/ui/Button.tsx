'use client'

import React from 'react'
import { theme } from '@/styles/theme'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', children, className = '', ...props }, ref) => {
    const styles = variant === 'primary' ? theme.components.button.primary : theme.components.button.secondary

    return (
      <button
        ref={ref}
        className={`button ${className}`}
        {...props}
        style={{
          padding: `${theme.spacing.md} ${theme.spacing.lg}`,
          backgroundColor: styles.background,
          border: `1px solid ${styles.border}`,
          borderRadius: theme.borderRadius.md,
          color: styles.text,
          fontSize: theme.typography.fontSize.base,
          fontFamily: theme.typography.fontFamily.primary,
          fontWeight: theme.typography.fontWeight.medium,
          cursor: 'pointer',
          outline: 'none',
          transition: theme.transitions.normal,
          ...props.style
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = styles.backgroundHover
          props.onMouseEnter?.(e)
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = styles.background
          props.onMouseLeave?.(e)
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.backgroundColor = styles.backgroundPressed
          props.onMouseDown?.(e)
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.backgroundColor = styles.backgroundHover
          props.onMouseUp?.(e)
        }}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'