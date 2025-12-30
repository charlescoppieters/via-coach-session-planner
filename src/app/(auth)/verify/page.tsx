'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { OTPScreen } from '@/components/auth/OTPScreen'
import { verifyOTP } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthTransition } from '@/contexts/AuthTransitionContext'

export default function VerifyPage() {
  const router = useRouter()
  const { user, coach, club, loading, refreshAuth } = useAuth()
  const { triggerFadeOut } = useAuthTransition()

  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpScreenFading, setOtpScreenFading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  // Get email from session storage
  useEffect(() => {
    const storedEmail = sessionStorage.getItem('pendingEmail')

    if (storedEmail) {
      setEmail(storedEmail)
    } else {
      router.replace('/login')
    }
  }, [router])

  // Handle redirect after authentication
  useEffect(() => {
    if (!loading && user && coach && !isVerifying) {
      // If onboarding completed, go to dashboard
      if (coach.onboarding_completed) {
        router.replace('/')
        return
      }

      // If we have a club but onboarding not complete
      if (club) {
        // Go to onboarding to complete profile/team setup
        router.replace('/onboarding')
        return
      }

      // No club - go to join/onboarding to create one
      router.replace('/join')
    }
  }, [user, coach, club, loading, router, isVerifying])

  const handleOTPComplete = (code: string) => {
    setOtpCode(code)
  }

  const handleOTPSubmit = async (code?: string) => {
    const codeToVerify = code || otpCode
    if (codeToVerify.length !== 6) return

    setIsVerifying(true)
    setOtpError('')

    const { error } = await verifyOTP(email, codeToVerify)

    if (error) {
      setOtpError(error)
      setIsVerifying(false)
      return
    }

    // Start fade and refresh auth in parallel
    setOtpScreenFading(true)
    const [, ] = await Promise.all([
      triggerFadeOut(),
      refreshAuth()
    ])

    // Clear session storage
    sessionStorage.removeItem('pendingEmail')

    setIsVerifying(false)
  }

  const handleBack = () => {
    router.push('/login')
  }

  // Show nothing while loading or if no email
  if (!email) {
    return null
  }

  return (
    <OTPScreen
      email={email}
      otpError={otpError}
      otpScreenFading={otpScreenFading}
      isVerifying={isVerifying}
      onComplete={handleOTPComplete}
      onSubmit={handleOTPSubmit}
      onBack={handleBack}
    />
  )
}
