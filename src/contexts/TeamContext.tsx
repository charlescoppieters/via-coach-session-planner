'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { Team } from '@/types/database'

const supabase = createClient()

interface TeamContextType {
  teams: Team[]
  selectedTeam: Team | null
  selectedTeamId: string
  setSelectedTeamId: (id: string) => void
  isLoadingTeams: boolean
}

const TeamContext = createContext<TeamContextType | undefined>(undefined)

export function useTeam() {
  const context = useContext(TeamContext)
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider')
  }
  return context
}

interface TeamProviderProps {
  children: React.ReactNode
}

export function TeamProvider({ children }: TeamProviderProps) {
  const { coach, club } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [isLoadingTeams, setIsLoadingTeams] = useState(true)

  // Fetch teams for this coach in this club
  useEffect(() => {
    const fetchTeams = async () => {
      if (!coach?.id || !club?.id) {
        setIsLoadingTeams(false)
        return
      }

      setIsLoadingTeams(true)

      // Get teams where this coach is assigned via team_coaches
      const { data: teamCoaches, error: tcError } = await supabase
        .from('team_coaches')
        .select('team_id')
        .eq('coach_id', coach.id)

      if (tcError) {
        console.error('Error fetching team_coaches:', tcError)
        setIsLoadingTeams(false)
        return
      }

      if (!teamCoaches || teamCoaches.length === 0) {
        setTeams([])
        setIsLoadingTeams(false)
        return
      }

      const teamIds = teamCoaches.map((tc) => tc.team_id)

      // Get the actual team data
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('club_id', club.id)
        .in('id', teamIds)
        .order('name')

      if (teamsError) {
        console.error('Error fetching teams:', teamsError)
        setIsLoadingTeams(false)
        return
      }

      setTeams(teamsData || [])

      // Auto-select first team if none selected
      if (!selectedTeamId && teamsData && teamsData.length > 0) {
        setSelectedTeamId(teamsData[0].id)
      }

      setIsLoadingTeams(false)
    }

    fetchTeams()
  }, [coach?.id, club?.id])

  // Subscribe to team changes
  useEffect(() => {
    if (!club?.id || !coach?.id) return

    const channel = supabase
      .channel(`team-context-${club.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'teams',
        filter: `club_id=eq.${club.id}`,
      }, async () => {
        // Refetch teams on any change
        const { data: teamCoaches } = await supabase
          .from('team_coaches')
          .select('team_id')
          .eq('coach_id', coach.id)

        if (!teamCoaches) return

        const teamIds = teamCoaches.map((tc) => tc.team_id)

        const { data } = await supabase
          .from('teams')
          .select('*')
          .eq('club_id', club.id)
          .in('id', teamIds)
          .order('name')

        if (data) setTeams(data)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [club?.id, coach?.id])

  // Get the currently selected team object
  const selectedTeam = teams.find(t => t.id === selectedTeamId) || null

  const value = {
    teams,
    selectedTeam,
    selectedTeamId,
    setSelectedTeamId,
    isLoadingTeams,
  }

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>
}
