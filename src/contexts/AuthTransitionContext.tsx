'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

interface AuthTransitionContextType {
  isFadingOut: boolean
  triggerFadeOut: () => Promise<void>
}

const AuthTransitionContext = createContext<AuthTransitionContextType>({
  isFadingOut: false,
  triggerFadeOut: async () => {},
})

export const useAuthTransition = () => useContext(AuthTransitionContext)

export const AuthTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFadingOut, setIsFadingOut] = useState(false)

  const triggerFadeOut = useCallback(async () => {
    setIsFadingOut(true)
    // Wait for fade animation to complete
    await new Promise(resolve => setTimeout(resolve, 300))
  }, [])

  return (
    <AuthTransitionContext.Provider value={{ isFadingOut, triggerFadeOut }}>
      {children}
    </AuthTransitionContext.Provider>
  )
}
