'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EmailScreen } from '@/components/auth/EmailScreen'
import { signInWithOTP } from '@/lib/auth'
import { isValidEmail } from '@/utils/validation'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [showEmailError, setShowEmailError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Middleware handles redirect if already authenticated

  const handleSubmit = async () => {
    // Validate email
    if (!isValidEmail(email)) {
      setShowEmailError(true)
      return
    }

    setIsLoading(true)
    const { error } = await signInWithOTP(email)
    setIsLoading(false)

    if (error) {
      setShowEmailError(true)
      return
    }

    // Store email for verify page
    sessionStorage.setItem('pendingEmail', email)

    router.push('/verify')
  }

  return (
    <EmailScreen
      email={email}
      setEmail={setEmail}
      showEmailError={showEmailError}
      setShowEmailError={setShowEmailError}
      isLoading={isLoading}
      onSubmit={handleSubmit}
    />
  )
}
