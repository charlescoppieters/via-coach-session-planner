'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ClubMethodologyPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/club-methodology/game-model')
  }, [router])

  return null
}
