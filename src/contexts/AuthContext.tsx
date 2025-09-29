'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
// Auth utils removed - no longer needed
import type { Coach } from '@/types/database'

interface AuthContextType {
  user: User | null
  coach: Coach | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [coach, setCoach] = useState<Coach | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setSession(session)
        setUser(session.user)

        // Fetch coach profile
        const { data: coachData } = await supabase
          .from('coaches')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .single()

        if (coachData) {
          setCoach(coachData)
        }
      } else {
        setUser(null)
        setCoach(null)
        setSession(null)
      }
    } catch (error) {
      console.error('Error refreshing auth:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check active session on mount
    refreshAuth()

    // Listen for auth changes - FIX: Don't include supabase as dependency
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {

        // FIX: Handle INITIAL_SESSION differently to prevent hanging
        if (event === 'INITIAL_SESSION') {
          if (session) {
            setSession(session)
            setUser(session.user)
            // For initial session, use the existing coach from refreshAuth()
            // Don't refetch to avoid hanging
          } else {
            setUser(null)
            setCoach(null)
            setSession(null)
          }
          setLoading(false)
          return
        }

        // For other events, handle normally - ONLY synchronous operations
        if (session) {
          setSession(session)
          setUser(session.user)
          // Coach profile will be fetched by separate effect - NO async operations here
        } else {
          setUser(null)
          setCoach(null)
          setSession(null)
        }

        setLoading(false)
      }
    )

    // Only refresh on network reconnection, not tab visibility
    // Tab switching should NOT break auth
    const handleOnline = () => {
      refreshAuth()
    }

    window.addEventListener('online', handleOnline)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  // Separate effect for coach profile fetching - prevents client lockup
  useEffect(() => {
    const fetchCoachProfile = async () => {
      // Only fetch if we have a user but no coach profile
      if (user && !coach && !loading) {
        try {
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Coach profile fetch timeout after 10 seconds')), 10000)
          })

          const fetchPromise = supabase
            .from('coaches')
            .select('*')
            .eq('auth_user_id', user.id)
            .single()

          const { data: coachData } = await Promise.race([fetchPromise, timeoutPromise])

          if (coachData) {
            setCoach(coachData)
          }
        } catch (error) {
          console.error('Coach profile fetch failed:', error)
          // Don't block the auth flow - app can work without coach profile
        }
      }
    }

    // Debounce the fetch to prevent rapid repeated calls
    const timeoutId = setTimeout(fetchCoachProfile, 500)
    return () => clearTimeout(timeoutId)
  }, [user, coach, loading])

  const handleSignOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setCoach(null)
      setSession(null)
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    coach,
    session,
    loading,
    signOut: handleSignOut,
    refreshAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}