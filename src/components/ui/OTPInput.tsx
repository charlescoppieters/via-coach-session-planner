'use client'

import React, { useState, useRef, useEffect } from 'react'
import { theme } from '@/styles/theme'

interface OTPInputProps {
  length?: number
  onComplete?: (otp: string) => void
  onSubmit?: (otp?: string) => void
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  onComplete,
  onSubmit
}) => {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>(new Array(length).fill(null))

  useEffect(() => {
    // Auto-focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleChange = (value: string, index: number) => {
    if (value.length > 1) return // Prevent multiple characters

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Call onComplete and onSubmit when all digits are filled
    if (newOtp.every(digit => digit !== '')) {
      const code = newOtp.join('')
      if (onComplete) {
        onComplete(code)
      }
      if (onSubmit) {
        onSubmit(code)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'Enter' && onSubmit) {
      onSubmit()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').slice(0, length)
    const pastedArray = pastedData.split('').slice(0, length)

    const newOtp = [...otp]
    pastedArray.forEach((char, index) => {
      if (/\d/.test(char)) { // Only allow digits
        newOtp[index] = char
      }
    })

    setOtp(newOtp)

    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex(digit => digit === '')
    const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex
    inputRefs.current[focusIndex]?.focus()

    if (newOtp.every(digit => digit !== '')) {
      const code = newOtp.join('')
      if (onComplete) {
        onComplete(code)
      }
      if (onSubmit) {
        onSubmit(code)
      }
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: theme.spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={el => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(e.target.value.replace(/[^0-9]/g, ''), index)}
          onKeyDown={e => handleKeyDown(e, index)}
          onPaste={handlePaste}
          style={{
            width: '3rem',
            height: '3rem',
            textAlign: 'center',
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.medium,
            backgroundColor: theme.components.input.background,
            border: `1px solid ${theme.components.input.border}`,
            borderRadius: theme.borderRadius.md,
            color: theme.components.input.text,
            fontFamily: theme.typography.fontFamily.primary,
            outline: 'none',
            transition: theme.transitions.normal,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = theme.components.input.borderFocus
            e.target.style.backgroundColor = theme.components.input.backgroundFocus
            e.target.style.boxShadow = theme.shadows.gold
            e.target.select() // Select all text on focus for easy replacement
          }}
          onBlur={(e) => {
            e.target.style.borderColor = theme.components.input.border
            e.target.style.backgroundColor = theme.components.input.background
            e.target.style.boxShadow = 'none'
          }}
        />
      ))}
    </div>
  )
}