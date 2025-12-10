'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
import {
  getCoachClubMembership,
  createClub as createClubFn,
} from '@/lib/auth'
import type { Coach, Club, ClubMembership } from '@/types/database'

interface AuthContextType {
  // Existing
  user: User | null
  coach: Coach | null
  session: Session | null
  loading: boolean

  // Club
  club: Club | null
  clubMembership: ClubMembership | null
  isAdmin: boolean

  // Methods
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
  createClub: (name: string, logoUrl?: string) => Promise<{ success: boolean; error: string | null }>
  refreshClubData: () => Promise<void>
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
  const [club, setClub] = useState<Club | null>(null)
  const [clubMembership, setClubMembership] = useState<ClubMembership | null>(null)
  const [loading, setLoading] = useState(true)

  // Computed property for admin status
  const isAdmin = clubMembership?.role === 'admin'

  const refreshClubData = async () => {
    if (!coach?.id) return

    try {
      const { club: clubData, membership } = await getCoachClubMembership(coach.id)
      setClub(clubData)
      setClubMembership(membership)
    } catch (error) {
      console.error('Error refreshing club data:', error)
    }
  }

  const refreshAuth = async () => {
    setLoading(true)
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

          // Fetch club membership
          const { club: clubData, membership } = await getCoachClubMembership(coachData.id)
          setClub(clubData)
          setClubMembership(membership)
        }
      } else {
        setUser(null)
        setCoach(null)
        setSession(null)
        setClub(null)
        setClubMembership(null)
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {

        // Handle INITIAL_SESSION - let refreshAuth handle the full flow
        // Don't set loading=false here if we have a session, as refreshAuth will do it
        if (event === 'INITIAL_SESSION') {
          if (session) {
            setSession(session)
            setUser(session.user)
            // Don't set loading=false - let refreshAuth complete and set it
          } else {
            setUser(null)
            setCoach(null)
            setSession(null)
            setClub(null)
            setClubMembership(null)
            setLoading(false)
          }
          return
        }

        // For other events, handle normally
        if (session) {
          setSession(session)
          setUser(session.user)
        } else {
          setUser(null)
          setCoach(null)
          setSession(null)
          setClub(null)
          setClubMembership(null)
        }

        setLoading(false)
      }
    )

    // Only refresh on network reconnection
    const handleOnline = () => {
      refreshAuth()
    }

    window.addEventListener('online', handleOnline)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  // Separate effect for coach and club profile fetching
  useEffect(() => {
    const fetchProfiles = async () => {
      if (user && !coach && !loading) {
        try {
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Profile fetch timeout after 10 seconds')), 10000)
          })

          const fetchPromise = supabase
            .from('coaches')
            .select('*')
            .eq('auth_user_id', user.id)
            .single()

          const { data: coachData } = await Promise.race([fetchPromise, timeoutPromise])

          if (coachData) {
            setCoach(coachData)

            // Also fetch club membership
            const { club: clubData, membership } = await getCoachClubMembership(coachData.id)
            setClub(clubData)
            setClubMembership(membership)
          }
        } catch (error) {
          console.error('Profile fetch failed:', error)
        }
      }
    }

    const timeoutId = setTimeout(fetchProfiles, 500)
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
      setClub(null)
      setClubMembership(null)
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClub = async (name: string, logoUrl?: string): Promise<{ success: boolean; error: string | null }> => {
    if (!coach?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const { club: newClub, membership, error } = await createClubFn(name, coach.id, logoUrl)

    if (error || !newClub || !membership) {
      return { success: false, error: error || 'Failed to create club' }
    }

    setClub(newClub)
    setClubMembership(membership)
    return { success: true, error: null }
  }

  const value = {
    user,
    coach,
    session,
    loading,
    club,
    clubMembership,
    isAdmin,
    signOut: handleSignOut,
    refreshAuth,
    createClub: handleCreateClub,
    refreshClubData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
