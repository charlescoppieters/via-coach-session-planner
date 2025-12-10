'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MethodologyPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/methodology/playing')
  }, [router])

  return null
}
