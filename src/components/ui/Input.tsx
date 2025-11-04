'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { TbSquareRoundedArrowRightFilled } from "react-icons/tb";
import { theme } from '@/styles/theme'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string
  onSubmit?: () => void
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', onSubmit, ...props }, ref) => {
    const inputId = React.useId();

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{ position: 'relative', width: '100%' }}
      >
        <style>
          {`
            #${inputId}::placeholder {
              color: ${theme.colors.text.secondary};
              opacity: 1;
            }
          `}
        </style>
        <input
          id={inputId}
          ref={ref}
          className={`input ${className}`}
          {...props}
          style={{
            width: '100%',
            padding: theme.spacing.md,
            paddingRight: '3rem', // Make space for the icon
            backgroundColor: theme.components.input.background,
            border: `1px solid ${theme.components.input.border}`,
            borderRadius: theme.borderRadius.md,
            color: theme.components.input.text,
            fontSize: theme.typography.fontSize.base,
            fontFamily: theme.typography.fontFamily.primary,
            outline: 'none',
            transition: theme.transitions.normal,
            ...props.style
          }}
          onFocus={(e) => {
            e.target.style.borderColor = theme.components.input.borderFocus
            e.target.style.backgroundColor = theme.components.input.backgroundFocus
            e.target.style.boxShadow = theme.shadows.gold
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            e.target.style.borderColor = theme.components.input.border
            e.target.style.backgroundColor = theme.components.input.background
            e.target.style.boxShadow = 'none'
            props.onBlur?.(e)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onSubmit) {
              onSubmit()
            }
            props.onKeyDown?.(e)
          }}
        />
        <button
          type="button"
          onClick={onSubmit}
          style={{
            position: 'absolute',
            right: theme.spacing.md,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TbSquareRoundedArrowRightFilled
            size={32}
            color={theme.colors.gold.main}
          />
        </button>
      </motion.div>
    )
  }
)

Input.displayName = 'Input'