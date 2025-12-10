'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

// This page just redirects to onboarding
export default function JoinPage() {
  const router = useRouter()
  const { user, coach, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!user || !coach) {
        router.replace('/login')
      } else {
        router.replace('/onboarding')
      }
    }
  }, [user, coach, loading, router])

  return null
}
