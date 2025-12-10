'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CgSpinnerAlt } from 'react-icons/cg'
import { FaTrash, FaPlus, FaUsers } from 'react-icons/fa'
import { IoChevronBack } from 'react-icons/io5'
import { theme } from '@/styles/theme'
import { useAuth } from '@/contexts/AuthContext'
import { getClubTeams, getTeamCoaches, getClubCoaches, assignCoachToTeam, unassignCoachFromTeam } from '@/lib/settings'
import { getPlayers, createPlayer, deletePlayer } from '@/lib/players'
import { createTeam, updateTeam, deleteTeam } from '@/lib/teams'
import { getProfilePictureUrl } from '@/lib/storage'
import {
  getSpaceOptions,
  getEquipmentOptions,
  getTeamFacilities,
  saveTeamFacilities,
  type EquipmentItem,
} from '@/lib/facilities'
import type { Team, Coach, Player, SystemDefault } from '@/types/database'

interface TeamFormData {
  name: string
  age_group: string
  skill_level: string
  gender: string
  player_count: number
  sessions_per_week: number
  session_duration: number
}

type ModalTab = 'info' | 'coaches' | 'facilities'
type CreateStep = 'details' | 'coaches' | 'facilities'

const OTHER_SPACE = 'other'

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Elite']
const GENDERS = ['Male', 'Female', 'Mixed']

const emptyFormData: TeamFormData = {
  name: '',
  age_group: '',
  skill_level: '',
  gender: '',
  player_count: 0,
  sessions_per_week: 0,
  session_duration: 0,
}

export default function TeamsSettingsPage() {
  const router = useRouter()
  const { coach, club, isAdmin } = useAuth()

  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [formData, setFormData] = useState<TeamFormData>(emptyFormData)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<ModalTab>('info')

  // Coaches tab state
  const [teamCoaches, setTeamCoaches] = useState<Coach[]>([])
  const [allClubCoaches, setAllClubCoaches] = useState<Coach[]>([])
  const [loadingCoaches, setLoadingCoaches] = useState(false)
  const [selectedCoachToAdd, setSelectedCoachToAdd] = useState('')

  // Players tab state
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [addingPlayer, setAddingPlayer] = useState(false)

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Create wizard state
  const [createStep, setCreateStep] = useState<CreateStep>('details')
  const [createdTeamId, setCreatedTeamId] = useState<string | null>(null)

  // Facilities state (for create wizard step 3)
  const [spaceOptions, setSpaceOptions] = useState<SystemDefault[]>([])
  const [equipmentOptions, setEquipmentOptions] = useState<SystemDefault[]>([])
  const [spaceType, setSpaceType] = useState('')
  const [customSpace, setCustomSpace] = useState('')
  const [equipment, setEquipment] = useState<EquipmentItem[]>([])
  const [otherFactors, setOtherFactors] = useState('')
  const [isSavingFacilities, setIsSavingFacilities] = useState(false)
  const [loadingFacilities, setLoadingFacilities] = useState(false)
  const [originalFacilities, setOriginalFacilities] = useState<{
    spaceType: string
    customSpace: string
    equipment: EquipmentItem[]
    otherFactors: string
  } | null>(null)

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      router.replace('/settings')
    }
  }, [isAdmin, router])

  // Load facilities options on mount
  useEffect(() => {
    const loadFacilitiesOptions = async () => {
      const [spaceRes, equipRes] = await Promise.all([
        getSpaceOptions(),
        getEquipmentOptions(),
      ])
      if (spaceRes.data) setSpaceOptions(spaceRes.data)
      if (equipRes.data) setEquipmentOptions(equipRes.data)
    }
    loadFacilitiesOptions()
  }, [])

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      if (!club?.id) return

      setIsLoading(true)
      const { data, error } = await getClubTeams(club.id)

      if (error) {
        setErrorMessage(error)
      } else if (data) {
        // getClubTeams returns { id, name }, but we need full team data
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: fullTeams, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .eq('club_id', club.id)
          .order('name', { ascending: true })

        if (teamsError) {
          setErrorMessage(teamsError.message)
        } else {
          setTeams(fullTeams || [])
        }
      }

      setIsLoading(false)
    }

    fetchTeams()
  }, [club?.id])

  // Fetch coaches and players when editing a team
  useEffect(() => {
    const fetchTeamData = async () => {
      if (!editingTeam || !club?.id) return

      setLoadingCoaches(true)

      // Fetch all club coaches (via RPC which bypasses RLS)
      const { data: clubCoaches } = await getClubCoaches(club.id)
      const allCoaches = clubCoaches?.map(m => m.coach) || []
      setAllClubCoaches(allCoaches)

      // Fetch team coach IDs from team_coaches table
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: teamCoachLinks } = await supabase
        .from('team_coaches')
        .select('coach_id')
        .eq('team_id', editingTeam.id)

      // Filter club coaches to get team coaches
      const teamCoachIds = new Set(teamCoachLinks?.map(tc => tc.coach_id) || [])
      const teamCoachesFiltered = allCoaches.filter(c => teamCoachIds.has(c.id))
      setTeamCoaches(teamCoachesFiltered)

      setLoadingCoaches(false)

      // Fetch team players
      setLoadingPlayers(true)
      const { data: players } = await getPlayers(club.id, editingTeam.id)
      setTeamPlayers(players || [])
      setLoadingPlayers(false)

      // Fetch team facilities
      setLoadingFacilities(true)
      const { data: facilitiesData } = await getTeamFacilities(editingTeam.id)
      if (facilitiesData) {
        const fetchedSpaceType = facilitiesData.space_type || ''
        const fetchedCustomSpace = facilitiesData.custom_space || ''
        const fetchedEquipment = (facilitiesData.equipment as unknown as EquipmentItem[]) || []
        const fetchedOtherFactors = facilitiesData.other_factors || ''

        setSpaceType(fetchedSpaceType)
        setCustomSpace(fetchedCustomSpace)
        setEquipment(fetchedEquipment)
        setOtherFactors(fetchedOtherFactors)
        setOriginalFacilities({
          spaceType: fetchedSpaceType,
          customSpace: fetchedCustomSpace,
          equipment: fetchedEquipment,
          otherFactors: fetchedOtherFactors,
        })
      } else {
        setSpaceType('')
        setCustomSpace('')
        setEquipment([])
        setOtherFactors('')
        setOriginalFacilities({
          spaceType: '',
          customSpace: '',
          equipment: [],
          otherFactors: '',
        })
      }
      setLoadingFacilities(false)
    }

    if (showModal && editingTeam) {
      fetchTeamData()
    }
  }, [editingTeam, club?.id, showModal])

  if (!isAdmin || !club) {
    return null
  }

  const openCreateModal = async () => {
    setEditingTeam(null)
    setFormData(emptyFormData)
    setActiveTab('info')
    setTeamCoaches([])
    setTeamPlayers([])
    setCreateStep('details')
    setCreatedTeamId(null)
    // Reset facilities state
    setSpaceType('')
    setCustomSpace('')
    setEquipment([])
    setOtherFactors('')
    setShowModal(true)

    // Pre-load club coaches for step 2
    if (club?.id) {
      const { data: clubCoaches } = await getClubCoaches(club.id)
      setAllClubCoaches(clubCoaches?.map(m => m.coach) || [])
    }
  }

  const openEditModal = (team: Team) => {
    setEditingTeam(team)
    setFormData({
      name: team.name,
      age_group: team.age_group,
      skill_level: team.skill_level,
      gender: team.gender || '',
      player_count: team.player_count,
      sessions_per_week: team.sessions_per_week,
      session_duration: team.session_duration,
    })
    setActiveTab('info')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTeam(null)
    setFormData(emptyFormData)
    setErrorMessage('')
    setActiveTab('info')
    setTeamCoaches([])
    setTeamPlayers([])
    setSelectedCoachToAdd('')
    setNewPlayerName('')
    // Reset wizard state
    setCreateStep('details')
    setCreatedTeamId(null)
    // Reset facilities state
    setSpaceType('')
    setCustomSpace('')
    setEquipment([])
    setOtherFactors('')
  }

  const handleSave = async () => {
    setErrorMessage('')

    if (!formData.name.trim()) {
      setErrorMessage('Team name is required')
      return
    }
    if (!formData.age_group.trim()) {
      setErrorMessage('Age group is required')
      return
    }
    if (!formData.skill_level) {
      setErrorMessage('Skill level is required')
      return
    }

    setIsSaving(true)

    if (editingTeam) {
      // Update existing team
      const { error } = await updateTeam(editingTeam.id, {
        name: formData.name.trim(),
        age_group: formData.age_group.trim(),
        skill_level: formData.skill_level,
        gender: formData.gender || null,
        player_count: formData.player_count,
        sessions_per_week: formData.sessions_per_week,
        session_duration: formData.session_duration,
      })

      if (error) {
        setErrorMessage(error)
        setIsSaving(false)
        return
      }

      setTeams((prev) =>
        prev.map((t) =>
          t.id === editingTeam.id
            ? {
                ...t,
                name: formData.name.trim(),
                age_group: formData.age_group.trim(),
                skill_level: formData.skill_level,
                gender: formData.gender || null,
                player_count: formData.player_count,
                sessions_per_week: formData.sessions_per_week,
                session_duration: formData.session_duration,
              }
            : t
        )
      )
    } else {
      // Create new team
      const { data, error } = await createTeam({
        club_id: club.id,
        created_by_coach_id: coach!.id,
        name: formData.name.trim(),
        age_group: formData.age_group.trim(),
        skill_level: formData.skill_level,
        gender: formData.gender || null,
        player_count: formData.player_count,
        sessions_per_week: formData.sessions_per_week,
        session_duration: formData.session_duration,
      })

      if (error) {
        setErrorMessage(error)
        setIsSaving(false)
        return
      }

      if (data) {
        setTeams((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      }
    }

    setIsSaving(false)
    closeModal()
  }

  const handleDelete = async () => {
    if (!teamToDelete) return

    setIsDeleting(true)
    setErrorMessage('')

    const { error } = await deleteTeam(teamToDelete.id)

    if (error) {
      setErrorMessage(error)
    } else {
      setTeams((prev) => prev.filter((t) => t.id !== teamToDelete.id))
    }

    setIsDeleting(false)
    setShowDeleteConfirm(false)
    setTeamToDelete(null)
  }

  // Coach management
  const handleAddCoach = async () => {
    if (!selectedCoachToAdd || !editingTeam) return

    setLoadingCoaches(true)
    const { error } = await assignCoachToTeam(selectedCoachToAdd, editingTeam.id)

    if (error) {
      setErrorMessage(error)
    } else {
      const addedCoach = allClubCoaches.find(c => c.id === selectedCoachToAdd)
      if (addedCoach) {
        setTeamCoaches(prev => [...prev, addedCoach])
      }
      setSelectedCoachToAdd('')
    }
    setLoadingCoaches(false)
  }

  const handleRemoveCoach = async (coachId: string) => {
    if (!editingTeam) return

    setLoadingCoaches(true)
    const { error } = await unassignCoachFromTeam(coachId, editingTeam.id)

    if (error) {
      setErrorMessage(error)
    } else {
      setTeamCoaches(prev => prev.filter(c => c.id !== coachId))
    }
    setLoadingCoaches(false)
  }

  // Player management
  const handleAddPlayer = async () => {
    if (!newPlayerName.trim() || !editingTeam || !club) return

    setAddingPlayer(true)
    const { data, error } = await createPlayer({
      club_id: club.id,
      team_id: editingTeam.id,
      name: newPlayerName.trim(),
    })

    if (error) {
      setErrorMessage((error as { message?: string })?.message || 'Failed to add player')
    } else if (data) {
      setTeamPlayers(prev => [...prev, data])
      setNewPlayerName('')
    }
    setAddingPlayer(false)
  }

  const handleRemovePlayer = async (playerId: string) => {
    setLoadingPlayers(true)
    const { error } = await deletePlayer(playerId)

    if (error) {
      setErrorMessage((error as { message?: string })?.message || 'Failed to remove player')
    } else {
      setTeamPlayers(prev => prev.filter(p => p.id !== playerId))
    }
    setLoadingPlayers(false)
  }

  // Get coaches not already assigned to the team
  const availableCoaches = allClubCoaches.filter(
    c => !teamCoaches.some(tc => tc.id === c.id)
  )

  // Wizard: Create team and move to step 2
  const handleCreateAndContinue = async () => {
    setErrorMessage('')

    if (!formData.name.trim()) {
      setErrorMessage('Team name is required')
      return
    }
    if (!formData.age_group.trim()) {
      setErrorMessage('Age group is required')
      return
    }
    if (!formData.skill_level) {
      setErrorMessage('Skill level is required')
      return
    }

    setIsSaving(true)

    const { data, error } = await createTeam({
      club_id: club.id,
      created_by_coach_id: coach!.id,
      name: formData.name.trim(),
      age_group: formData.age_group.trim(),
      skill_level: formData.skill_level,
      gender: formData.gender || null,
      player_count: formData.player_count,
      sessions_per_week: formData.sessions_per_week,
      session_duration: formData.session_duration,
    })

    if (error) {
      setErrorMessage(error)
      setIsSaving(false)
      return
    }

    if (data) {
      setTeams((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setCreatedTeamId(data.id)
      setCreateStep('coaches')
    }

    setIsSaving(false)
  }

  // Wizard: Add coach to newly created team
  const handleAddCoachToNewTeam = async () => {
    if (!selectedCoachToAdd || !createdTeamId) return

    setLoadingCoaches(true)
    const { error } = await assignCoachToTeam(selectedCoachToAdd, createdTeamId)

    if (error) {
      setErrorMessage(error)
    } else {
      const addedCoach = allClubCoaches.find(c => c.id === selectedCoachToAdd)
      if (addedCoach) {
        setTeamCoaches(prev => [...prev, addedCoach])
      }
      setSelectedCoachToAdd('')
    }
    setLoadingCoaches(false)
  }

  // Wizard: Remove coach from newly created team
  const handleRemoveCoachFromNewTeam = async (coachId: string) => {
    if (!createdTeamId) return

    setLoadingCoaches(true)
    const { error } = await unassignCoachFromTeam(coachId, createdTeamId)

    if (error) {
      setErrorMessage(error)
    } else {
      setTeamCoaches(prev => prev.filter(c => c.id !== coachId))
    }
    setLoadingCoaches(false)
  }

  // Wizard: Save facilities and close
  const handleWizardDone = async () => {
    if (!createdTeamId) {
      closeModal()
      return
    }

    // Only save facilities if something was filled out
    const hasAnyFacilitiesData = spaceType || equipment.length > 0 || otherFactors.trim()

    if (hasAnyFacilitiesData) {
      setIsSavingFacilities(true)
      setErrorMessage('')

      const validEquipment = equipment.filter((item) => item.type.trim() !== '')

      const { error } = await saveTeamFacilities(createdTeamId, {
        space_type: spaceType || null,
        custom_space: spaceType === OTHER_SPACE ? customSpace || null : null,
        equipment: validEquipment.length > 0 ? validEquipment : null,
        other_factors: otherFactors || null,
      })

      if (error) {
        setErrorMessage('Failed to save facilities')
        setIsSavingFacilities(false)
        return
      }

      setIsSavingFacilities(false)
    }

    closeModal()
  }

  // Equipment management for wizard
  const handleAddEquipment = () => {
    setEquipment([...equipment, { type: '', quantity: 1 }])
  }

  const handleUpdateEquipment = (
    index: number,
    field: 'type' | 'quantity',
    value: string | number
  ) => {
    const updated = [...equipment]
    if (field === 'type') {
      updated[index].type = value as string
    } else {
      updated[index].quantity = Math.max(1, value as number)
    }
    setEquipment(updated)
  }

  const handleRemoveEquipment = (index: number) => {
    setEquipment(equipment.filter((_, i) => i !== index))
  }

  // Helper to get equipment display name
  const getEquipmentName = (key: string): string => {
    const equip = equipmentOptions.find((e) => e.key === key)
    const value = equip?.value as { name?: string } | undefined
    return value?.name || key
  }

  // Check if facilities have changed (for edit mode)
  const hasFacilitiesChanges = originalFacilities ? (
    spaceType !== originalFacilities.spaceType ||
    customSpace !== originalFacilities.customSpace ||
    otherFactors !== originalFacilities.otherFactors ||
    JSON.stringify(equipment) !== JSON.stringify(originalFacilities.equipment)
  ) : false

  // Save facilities for edit mode
  const handleSaveFacilities = async () => {
    if (!editingTeam) return

    setIsSavingFacilities(true)
    setErrorMessage('')

    const validEquipment = equipment.filter((item) => item.type.trim() !== '')

    const { error } = await saveTeamFacilities(editingTeam.id, {
      space_type: spaceType || null,
      custom_space: spaceType === OTHER_SPACE ? customSpace || null : null,
      equipment: validEquipment.length > 0 ? validEquipment : null,
      other_factors: otherFactors || null,
    })

    if (error) {
      setErrorMessage('Failed to save facilities')
    } else {
      // Update original state to reflect saved values
      setOriginalFacilities({
        spaceType,
        customSpace,
        equipment,
        otherFactors,
      })
    }

    setIsSavingFacilities(false)
  }

  return (
    <div style={{ padding: theme.spacing.xl }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.md,
        }}
      >
        <h1
          style={{
            fontSize: theme.typography.fontSize['3xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            margin: 0,
          }}
        >
          Manage Teams
        </h1>
        <div style={{ display: 'flex', gap: theme.spacing.md, alignItems: 'center' }}>
          <button
            onClick={openCreateModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              backgroundColor: theme.colors.gold.main,
              color: theme.colors.background.primary,
              border: 'none',
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              cursor: 'pointer',
            }}
          >
            <FaPlus size={12} />
            Create Team
          </button>
          <Link
            href="/settings"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.sm,
              textDecoration: 'none',
            }}
          >
            <IoChevronBack size={16} />
            Back to Settings
          </Link>
        </div>
      </div>

      <p
        style={{
          color: theme.colors.text.secondary,
          fontSize: theme.typography.fontSize.base,
          marginBottom: theme.spacing.lg,
        }}
      >
        Create and manage teams in your club.
      </p>

      {/* Error Message */}
      {errorMessage && !showModal && (
        <div
          style={{
            padding: theme.spacing.md,
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            border: `1px solid ${theme.colors.status.error}`,
            borderRadius: theme.borderRadius.md,
            color: theme.colors.status.error,
            marginBottom: theme.spacing.lg,
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Teams List */}
      <div
        style={{
          backgroundColor: theme.colors.background.primary,
          borderRadius: theme.borderRadius.lg,
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div
            style={{
              padding: theme.spacing.xl,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.md,
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <CgSpinnerAlt size={24} color={theme.colors.gold.main} />
            </motion.div>
            <span style={{ color: theme.colors.text.secondary }}>Loading teams...</span>
          </div>
        ) : teams.length === 0 ? (
          <div
            style={{
              padding: theme.spacing.xl,
              textAlign: 'center',
              color: theme.colors.text.secondary,
            }}
          >
            No teams yet. Create your first team to get started.
          </div>
        ) : (
          teams.map((team, index) => (
            <div
              key={team.id}
              style={{
                padding: theme.spacing.lg,
                borderBottom:
                  index < teams.length - 1
                    ? `1px solid ${theme.colors.border.secondary}`
                    : undefined,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.lg,
              }}
            >
              {/* Team Icon */}
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: theme.colors.background.tertiary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FaUsers size={18} color={theme.colors.text.secondary} />
              </div>

              {/* Team Name & Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text.primary,
                  }}
                >
                  {team.name}
                </div>
                <div
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                  }}
                >
                  {team.age_group} · {team.skill_level}
                  {team.gender && ` · ${team.gender}`}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                <button
                  onClick={() => openEditModal(team)}
                  style={{
                    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                    backgroundColor: 'transparent',
                    color: theme.colors.gold.main,
                    border: `1px solid ${theme.colors.gold.main}`,
                    borderRadius: theme.borderRadius.sm,
                    cursor: 'pointer',
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setTeamToDelete(team)
                    setShowDeleteConfirm(true)
                  }}
                  title="Delete team"
                  style={{
                    padding: theme.spacing.sm,
                    backgroundColor: 'transparent',
                    color: theme.colors.status.error,
                    border: `1px solid ${theme.colors.status.error}`,
                    borderRadius: theme.borderRadius.sm,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                  }}
                >
                  <FaTrash size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal with Tabs */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: theme.zIndex.modal,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: theme.colors.background.primary,
              borderRadius: theme.borderRadius.lg,
              maxWidth: '600px',
              width: '90%',
              height: '600px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div style={{ padding: theme.spacing.xl, paddingBottom: 0, flexShrink: 0 }}>
              {/* Title and Step Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.lg }}>
                <h3
                  style={{
                    fontSize: theme.typography.fontSize.xl,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text.primary,
                    margin: 0,
                  }}
                >
                  {editingTeam ? 'Edit Team' : (
                    createStep === 'details' ? 'Team Details' :
                    createStep === 'coaches' ? 'Assign Coaches' :
                    'Facilities & Equipment'
                  )}
                </h3>
                {!editingTeam && (
                  <span
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text.secondary,
                      backgroundColor: theme.colors.background.tertiary,
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      borderRadius: theme.borderRadius.sm,
                    }}
                  >
                    Step {createStep === 'details' ? 1 : createStep === 'coaches' ? 2 : 3} of 3
                  </span>
                )}
              </div>

              {/* Subtitle for create wizard steps */}
              {!editingTeam && (
                <p
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                    margin: 0,
                    marginBottom: theme.spacing.md,
                  }}
                >
                  {createStep === 'details' && 'Enter the basic information for your new team'}
                  {createStep === 'coaches' && 'Optionally assign coaches to this team'}
                  {createStep === 'facilities' && 'Optionally configure training facilities and equipment'}
                </p>
              )}

              {/* Tabs - only show for editing */}
              {editingTeam && (
                <div
                  style={{
                    display: 'flex',
                    gap: theme.spacing.md,
                    borderBottom: `1px solid ${theme.colors.border.primary}`,
                  }}
                >
                  {(['info', 'coaches', 'facilities'] as ModalTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                        backgroundColor: 'transparent',
                        color: activeTab === tab ? theme.colors.gold.main : theme.colors.text.secondary,
                        border: 'none',
                        borderBottom: activeTab === tab ? `2px solid ${theme.colors.gold.main}` : '2px solid transparent',
                        cursor: 'pointer',
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.medium,
                        marginBottom: '-1px',
                      }}
                    >
                      {tab === 'info' ? 'Team Info' : tab === 'coaches' ? 'Coaches' : 'Facilities'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: theme.spacing.xl, paddingTop: theme.spacing.lg }}>
              {/* Error in modal */}
              {errorMessage && (
                <div
                  style={{
                    padding: theme.spacing.md,
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    border: `1px solid ${theme.colors.status.error}`,
                    borderRadius: theme.borderRadius.md,
                    color: theme.colors.status.error,
                    marginBottom: theme.spacing.lg,
                    fontSize: theme.typography.fontSize.sm,
                  }}
                >
                  {errorMessage}
                </div>
              )}

            {/* Team Info Tab / Create Step 1 */}
            {(editingTeam ? activeTab === 'info' : createStep === 'details') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                {/* Team Name */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text.secondary,
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. U12 Boys A"
                    style={{
                      width: '100%',
                      padding: theme.spacing.sm,
                      backgroundColor: theme.colors.background.secondary,
                      color: theme.colors.text.primary,
                      border: `1px solid ${theme.colors.border.primary}`,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: theme.typography.fontSize.base,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Age Group & Skill Level */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.text.secondary,
                        marginBottom: theme.spacing.xs,
                      }}
                    >
                      Age Group *
                    </label>
                    <input
                      type="text"
                      value={formData.age_group}
                      onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
                      placeholder="e.g. U12"
                      style={{
                        width: '100%',
                        padding: theme.spacing.sm,
                        backgroundColor: theme.colors.background.secondary,
                        color: theme.colors.text.primary,
                        border: `1px solid ${theme.colors.border.primary}`,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.base,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.text.secondary,
                        marginBottom: theme.spacing.xs,
                      }}
                    >
                      Skill Level *
                    </label>
                    <select
                      value={formData.skill_level}
                      onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
                      style={{
                        width: '100%',
                        padding: theme.spacing.sm,
                        paddingRight: '28px',
                        backgroundColor: theme.colors.background.secondary,
                        color: theme.colors.text.primary,
                        border: `1px solid ${theme.colors.border.primary}`,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.base,
                        outline: 'none',
                        boxSizing: 'border-box',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 8px center',
                      }}
                    >
                      <option value="">Select...</option>
                      {SKILL_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text.secondary,
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    style={{
                      width: '100%',
                      padding: theme.spacing.sm,
                      paddingRight: '28px',
                      backgroundColor: theme.colors.background.secondary,
                      color: theme.colors.text.primary,
                      border: `1px solid ${theme.colors.border.primary}`,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: theme.typography.fontSize.base,
                      outline: 'none',
                      boxSizing: 'border-box',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 8px center',
                    }}
                  >
                    <option value="">Select...</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Player Count & Sessions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: theme.spacing.md }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.text.secondary,
                        marginBottom: theme.spacing.xs,
                      }}
                    >
                      Players
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.player_count || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, player_count: parseInt(e.target.value) || 0 })
                      }
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: theme.spacing.sm,
                        backgroundColor: theme.colors.background.secondary,
                        color: theme.colors.text.primary,
                        border: `1px solid ${theme.colors.border.primary}`,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.base,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.text.secondary,
                        marginBottom: theme.spacing.xs,
                      }}
                    >
                      Sessions/Week
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.sessions_per_week || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, sessions_per_week: parseInt(e.target.value) || 0 })
                      }
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: theme.spacing.sm,
                        backgroundColor: theme.colors.background.secondary,
                        color: theme.colors.text.primary,
                        border: `1px solid ${theme.colors.border.primary}`,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.base,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.text.secondary,
                        marginBottom: theme.spacing.xs,
                      }}
                    >
                      Duration (min)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.session_duration || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, session_duration: parseInt(e.target.value) || 0 })
                      }
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: theme.spacing.sm,
                        backgroundColor: theme.colors.background.secondary,
                        color: theme.colors.text.primary,
                        border: `1px solid ${theme.colors.border.primary}`,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.base,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Coaches Tab (Edit mode) */}
            {activeTab === 'coaches' && editingTeam && (
              <div>
                {loadingCoaches ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.md }}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <CgSpinnerAlt size={16} color={theme.colors.gold.main} />
                    </motion.div>
                    <span style={{ color: theme.colors.text.secondary, fontSize: theme.typography.fontSize.sm }}>Loading coaches...</span>
                  </div>
                ) : (
                  <>
                    {/* List of assigned coaches */}
                    <div style={{ marginBottom: theme.spacing.lg }}>
                      {teamCoaches.length === 0 ? (
                        <p style={{ color: theme.colors.text.secondary, fontSize: theme.typography.fontSize.sm }}>
                          No coaches assigned to this team yet.
                        </p>
                      ) : (
                        teamCoaches.map((coachItem) => (
                          <div
                            key={coachItem.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: theme.spacing.md,
                              padding: theme.spacing.md,
                              backgroundColor: theme.colors.background.secondary,
                              borderRadius: theme.borderRadius.md,
                              marginBottom: theme.spacing.sm,
                            }}
                          >
                            {/* Avatar */}
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                backgroundColor: theme.colors.background.tertiary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                flexShrink: 0,
                              }}
                            >
                              {coachItem.profile_picture ? (
                                <img
                                  src={getProfilePictureUrl(coachItem.profile_picture)}
                                  alt={coachItem.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.text.secondary }}>
                                  {coachItem.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </span>
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.text.primary }}>
                                {coachItem.name}
                              </div>
                              <div style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.text.secondary }}>
                                {coachItem.email}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveCoach(coachItem.id)}
                              style={{
                                padding: theme.spacing.xs,
                                backgroundColor: 'transparent',
                                color: theme.colors.text.secondary,
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: theme.typography.fontSize.lg,
                                lineHeight: 1,
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add coach dropdown */}
                    {availableCoaches.length > 0 && (
                      <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                        <select
                          value={selectedCoachToAdd}
                          onChange={(e) => setSelectedCoachToAdd(e.target.value)}
                          style={{
                            flex: 1,
                            padding: theme.spacing.sm,
                            paddingRight: '28px',
                            backgroundColor: theme.colors.background.secondary,
                            color: theme.colors.text.primary,
                            border: `1px solid ${theme.colors.border.primary}`,
                            borderRadius: theme.borderRadius.sm,
                            fontSize: theme.typography.fontSize.sm,
                            outline: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 8px center',
                          }}
                        >
                          <option value="">Select coach to add...</option>
                          {availableCoaches.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleAddCoach}
                          disabled={!selectedCoachToAdd}
                          style={{
                            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                            backgroundColor: selectedCoachToAdd ? theme.colors.gold.main : theme.colors.background.secondary,
                            color: selectedCoachToAdd ? theme.colors.background.primary : theme.colors.text.secondary,
                            border: `1px solid ${selectedCoachToAdd ? theme.colors.gold.main : theme.colors.border.primary}`,
                            borderRadius: theme.borderRadius.sm,
                            cursor: selectedCoachToAdd ? 'pointer' : 'not-allowed',
                            fontSize: theme.typography.fontSize.sm,
                            fontWeight: theme.typography.fontWeight.medium,
                            opacity: selectedCoachToAdd ? 1 : 0.7,
                          }}
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Coaches Step (Create wizard step 2) */}
            {!editingTeam && createStep === 'coaches' && (
              <div>
                {loadingCoaches ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.md }}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <CgSpinnerAlt size={16} color={theme.colors.gold.main} />
                    </motion.div>
                    <span style={{ color: theme.colors.text.secondary, fontSize: theme.typography.fontSize.sm }}>Loading coaches...</span>
                  </div>
                ) : (
                  <>
                    {/* List of assigned coaches */}
                    <div style={{ marginBottom: theme.spacing.lg }}>
                      {teamCoaches.length === 0 ? (
                        <p style={{ color: theme.colors.text.secondary, fontSize: theme.typography.fontSize.sm }}>
                          No coaches assigned to this team yet.
                        </p>
                      ) : (
                        teamCoaches.map((coachItem) => (
                          <div
                            key={coachItem.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: theme.spacing.md,
                              padding: theme.spacing.md,
                              backgroundColor: theme.colors.background.secondary,
                              borderRadius: theme.borderRadius.md,
                              marginBottom: theme.spacing.sm,
                            }}
                          >
                            {/* Avatar */}
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                backgroundColor: theme.colors.background.tertiary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                flexShrink: 0,
                              }}
                            >
                              {coachItem.profile_picture ? (
                                <img
                                  src={getProfilePictureUrl(coachItem.profile_picture)}
                                  alt={coachItem.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.text.secondary }}>
                                  {coachItem.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </span>
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.text.primary }}>
                                {coachItem.name}
                              </div>
                              <div style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.text.secondary }}>
                                {coachItem.email}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveCoachFromNewTeam(coachItem.id)}
                              style={{
                                padding: theme.spacing.xs,
                                backgroundColor: 'transparent',
                                color: theme.colors.text.secondary,
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: theme.typography.fontSize.lg,
                                lineHeight: 1,
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add coach dropdown */}
                    {availableCoaches.length > 0 ? (
                      <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                        <select
                          value={selectedCoachToAdd}
                          onChange={(e) => setSelectedCoachToAdd(e.target.value)}
                          style={{
                            flex: 1,
                            padding: theme.spacing.sm,
                            paddingRight: '28px',
                            backgroundColor: theme.colors.background.secondary,
                            color: theme.colors.text.primary,
                            border: `1px solid ${theme.colors.border.primary}`,
                            borderRadius: theme.borderRadius.sm,
                            fontSize: theme.typography.fontSize.sm,
                            outline: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 8px center',
                          }}
                        >
                          <option value="">Select coach to add...</option>
                          {availableCoaches.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleAddCoachToNewTeam}
                          disabled={!selectedCoachToAdd}
                          style={{
                            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                            backgroundColor: selectedCoachToAdd ? theme.colors.gold.main : theme.colors.background.secondary,
                            color: selectedCoachToAdd ? theme.colors.background.primary : theme.colors.text.secondary,
                            border: `1px solid ${selectedCoachToAdd ? theme.colors.gold.main : theme.colors.border.primary}`,
                            borderRadius: theme.borderRadius.sm,
                            cursor: selectedCoachToAdd ? 'pointer' : 'not-allowed',
                            fontSize: theme.typography.fontSize.sm,
                            fontWeight: theme.typography.fontWeight.medium,
                            opacity: selectedCoachToAdd ? 1 : 0.7,
                          }}
                        >
                          Add
                        </button>
                      </div>
                    ) : allClubCoaches.length === 0 ? (
                      <p style={{ color: theme.colors.text.muted, fontSize: theme.typography.fontSize.sm }}>
                        No coaches available in your club. You can invite coaches from the Settings page.
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            )}

            {/* Facilities Tab (Edit mode) */}
            {activeTab === 'facilities' && editingTeam && (
              <div>
                {loadingFacilities ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.md }}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <CgSpinnerAlt size={16} color={theme.colors.gold.main} />
                    </motion.div>
                    <span style={{ color: theme.colors.text.secondary, fontSize: theme.typography.fontSize.sm }}>Loading facilities...</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xl }}>
                    {/* Training Space Section */}
                    <div>
                      <h4
                        style={{
                          fontSize: theme.typography.fontSize.base,
                          fontWeight: theme.typography.fontWeight.semibold,
                          color: theme.colors.text.primary,
                          marginBottom: theme.spacing.md,
                        }}
                      >
                        Training Space
                      </h4>
                      <select
                        value={spaceType}
                        onChange={(e) => {
                          setSpaceType(e.target.value)
                          if (e.target.value !== OTHER_SPACE) setCustomSpace('')
                        }}
                        style={{
                          width: '100%',
                          padding: theme.spacing.sm,
                          paddingRight: '28px',
                          backgroundColor: theme.colors.background.secondary,
                          color: theme.colors.text.primary,
                          border: `1px solid ${theme.colors.border.primary}`,
                          borderRadius: theme.borderRadius.sm,
                          fontSize: theme.typography.fontSize.sm,
                          outline: 'none',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 8px center',
                        }}
                      >
                        <option value="">Select space type...</option>
                        {spaceOptions.map((space) => (
                          <option key={space.key} value={space.key}>
                            {(space.value as { name?: string })?.name}
                          </option>
                        ))}
                      </select>
                      {spaceType === OTHER_SPACE && (
                        <input
                          type="text"
                          value={customSpace}
                          onChange={(e) => setCustomSpace(e.target.value)}
                          placeholder="Describe your space..."
                          style={{
                            width: '100%',
                            marginTop: theme.spacing.sm,
                            padding: theme.spacing.sm,
                            backgroundColor: theme.colors.background.secondary,
                            color: theme.colors.text.primary,
                            border: `1px solid ${theme.colors.border.primary}`,
                            borderRadius: theme.borderRadius.sm,
                            fontSize: theme.typography.fontSize.sm,
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      )}
                    </div>

                    {/* Equipment Section */}
                    <div>
                      <h4
                        style={{
                          fontSize: theme.typography.fontSize.base,
                          fontWeight: theme.typography.fontWeight.semibold,
                          color: theme.colors.text.primary,
                          marginBottom: theme.spacing.md,
                        }}
                      >
                        Available Equipment
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                        {equipment.map((item, index) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: theme.spacing.sm,
                            }}
                          >
                            <select
                              value={item.type}
                              onChange={(e) => handleUpdateEquipment(index, 'type', e.target.value)}
                              style={{
                                flex: 1,
                                padding: theme.spacing.sm,
                                paddingRight: '28px',
                                backgroundColor: theme.colors.background.secondary,
                                color: theme.colors.text.primary,
                                border: `1px solid ${theme.colors.border.primary}`,
                                borderRadius: theme.borderRadius.sm,
                                fontSize: theme.typography.fontSize.sm,
                                outline: 'none',
                                WebkitAppearance: 'none',
                                MozAppearance: 'none',
                                appearance: 'none',
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 8px center',
                              }}
                            >
                              <option value="">Select equipment...</option>
                              {equipmentOptions.map((equip) => (
                                <option key={equip.key} value={equip.key}>
                                  {(equip.value as { name?: string })?.name}
                                </option>
                              ))}
                            </select>
                            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                              <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.text.secondary }}>
                                Qty:
                              </span>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleUpdateEquipment(index, 'quantity', parseInt(e.target.value) || 1)}
                                min="1"
                                style={{
                                  width: '60px',
                                  padding: theme.spacing.sm,
                                  backgroundColor: theme.colors.background.secondary,
                                  color: theme.colors.text.primary,
                                  border: `1px solid ${theme.colors.border.primary}`,
                                  borderRadius: theme.borderRadius.sm,
                                  fontSize: theme.typography.fontSize.sm,
                                  outline: 'none',
                                  textAlign: 'center',
                                }}
                              />
                            </div>
                            <button
                              onClick={() => handleRemoveEquipment(index)}
                              style={{
                                padding: theme.spacing.sm,
                                backgroundColor: 'transparent',
                                color: theme.colors.status.error,
                                border: 'none',
                                borderRadius: theme.borderRadius.sm,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={handleAddEquipment}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: theme.spacing.sm,
                            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                            backgroundColor: 'transparent',
                            color: theme.colors.gold.main,
                            border: `1px dashed ${theme.colors.border.primary}`,
                            borderRadius: theme.borderRadius.sm,
                            fontSize: theme.typography.fontSize.sm,
                            cursor: 'pointer',
                            width: 'fit-content',
                          }}
                        >
                          <FaPlus size={10} />
                          Add Equipment
                        </button>
                      </div>
                    </div>

                    {/* Other Factors Section */}
                    <div>
                      <h4
                        style={{
                          fontSize: theme.typography.fontSize.base,
                          fontWeight: theme.typography.fontWeight.semibold,
                          color: theme.colors.text.primary,
                          marginBottom: theme.spacing.md,
                        }}
                      >
                        Other Factors
                      </h4>
                      <textarea
                        value={otherFactors}
                        onChange={(e) => setOtherFactors(e.target.value)}
                        placeholder="e.g., Limited lighting after 6pm, shared space with other teams..."
                        rows={3}
                        style={{
                          width: '100%',
                          padding: theme.spacing.sm,
                          backgroundColor: theme.colors.background.secondary,
                          color: theme.colors.text.primary,
                          border: `1px solid ${theme.colors.border.primary}`,
                          borderRadius: theme.borderRadius.sm,
                          fontSize: theme.typography.fontSize.sm,
                          outline: 'none',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Facilities Step (Create wizard step 3) */}
            {!editingTeam && createStep === 'facilities' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xl }}>
                {/* Training Space Section */}
                <div>
                  <h4
                    style={{
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.text.primary,
                      marginBottom: theme.spacing.md,
                    }}
                  >
                    Training Space
                  </h4>
                  <select
                    value={spaceType}
                    onChange={(e) => {
                      setSpaceType(e.target.value)
                      if (e.target.value !== OTHER_SPACE) setCustomSpace('')
                    }}
                    style={{
                      width: '100%',
                      padding: theme.spacing.sm,
                      paddingRight: '28px',
                      backgroundColor: theme.colors.background.secondary,
                      color: theme.colors.text.primary,
                      border: `1px solid ${theme.colors.border.primary}`,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: theme.typography.fontSize.sm,
                      outline: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 8px center',
                    }}
                  >
                    <option value="">Select space type...</option>
                    {spaceOptions.map((space) => (
                      <option key={space.key} value={space.key}>
                        {(space.value as { name?: string })?.name}
                      </option>
                    ))}
                  </select>
                  {spaceType === OTHER_SPACE && (
                    <input
                      type="text"
                      value={customSpace}
                      onChange={(e) => setCustomSpace(e.target.value)}
                      placeholder="Describe your space..."
                      style={{
                        width: '100%',
                        marginTop: theme.spacing.sm,
                        padding: theme.spacing.sm,
                        backgroundColor: theme.colors.background.secondary,
                        color: theme.colors.text.primary,
                        border: `1px solid ${theme.colors.border.primary}`,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.sm,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  )}
                </div>

                {/* Equipment Section */}
                <div>
                  <h4
                    style={{
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.text.primary,
                      marginBottom: theme.spacing.md,
                    }}
                  >
                    Available Equipment
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                    {equipment.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: theme.spacing.sm,
                        }}
                      >
                        <select
                          value={item.type}
                          onChange={(e) => handleUpdateEquipment(index, 'type', e.target.value)}
                          style={{
                            flex: 1,
                            padding: theme.spacing.sm,
                            paddingRight: '28px',
                            backgroundColor: theme.colors.background.secondary,
                            color: theme.colors.text.primary,
                            border: `1px solid ${theme.colors.border.primary}`,
                            borderRadius: theme.borderRadius.sm,
                            fontSize: theme.typography.fontSize.sm,
                            outline: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 8px center',
                          }}
                        >
                          <option value="">Select equipment...</option>
                          {equipmentOptions.map((equip) => (
                            <option key={equip.key} value={equip.key}>
                              {(equip.value as { name?: string })?.name}
                            </option>
                          ))}
                        </select>
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                          <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.text.secondary }}>
                            Qty:
                          </span>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateEquipment(index, 'quantity', parseInt(e.target.value) || 1)}
                            min="1"
                            style={{
                              width: '60px',
                              padding: theme.spacing.sm,
                              backgroundColor: theme.colors.background.secondary,
                              color: theme.colors.text.primary,
                              border: `1px solid ${theme.colors.border.primary}`,
                              borderRadius: theme.borderRadius.sm,
                              fontSize: theme.typography.fontSize.sm,
                              outline: 'none',
                              textAlign: 'center',
                            }}
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveEquipment(index)}
                          style={{
                            padding: theme.spacing.sm,
                            backgroundColor: 'transparent',
                            color: theme.colors.status.error,
                            border: 'none',
                            borderRadius: theme.borderRadius.sm,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleAddEquipment}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.sm,
                        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                        backgroundColor: 'transparent',
                        color: theme.colors.gold.main,
                        border: `1px dashed ${theme.colors.border.primary}`,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.sm,
                        cursor: 'pointer',
                        width: 'fit-content',
                      }}
                    >
                      <FaPlus size={10} />
                      Add Equipment
                    </button>
                  </div>
                </div>

                {/* Other Factors Section */}
                <div>
                  <h4
                    style={{
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.text.primary,
                      marginBottom: theme.spacing.md,
                    }}
                  >
                    Other Factors
                  </h4>
                  <textarea
                    value={otherFactors}
                    onChange={(e) => setOtherFactors(e.target.value)}
                    placeholder="e.g., Limited lighting after 6pm, shared space with other teams..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: theme.spacing.sm,
                      backgroundColor: theme.colors.background.secondary,
                      color: theme.colors.text.primary,
                      border: `1px solid ${theme.colors.border.primary}`,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: theme.typography.fontSize.sm,
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            )}

            </div>

            {/* Fixed Footer */}
            <div style={{ padding: theme.spacing.xl, paddingTop: theme.spacing.lg, flexShrink: 0, borderTop: `1px solid ${theme.colors.border.primary}` }}>
              {/* EDIT MODE: Info tab - Cancel | Save Changes */}
              {editingTeam && activeTab === 'info' && (
                <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' }}>
                  <button
                    onClick={closeModal}
                    style={{
                      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                      backgroundColor: 'transparent',
                      color: theme.colors.text.secondary,
                      border: `1px solid ${theme.colors.border.primary}`,
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.typography.fontSize.base,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                      backgroundColor: theme.colors.gold.main,
                      color: theme.colors.background.primary,
                      border: 'none',
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.semibold,
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                    }}
                  >
                    {isSaving && (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{ display: 'inline-flex' }}
                      >
                        <CgSpinnerAlt size={16} />
                      </motion.span>
                    )}
                    Save Changes
                  </button>
                </div>
              )}

              {/* EDIT MODE: Coaches tab - Done */}
              {editingTeam && activeTab === 'coaches' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={closeModal}
                    style={{
                      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                      backgroundColor: theme.colors.gold.main,
                      color: theme.colors.background.primary,
                      border: 'none',
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.semibold,
                      cursor: 'pointer',
                    }}
                  >
                    Done
                  </button>
                </div>
              )}

              {/* EDIT MODE: Facilities tab - Cancel | Save */}
              {editingTeam && activeTab === 'facilities' && (
                <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' }}>
                  <button
                    onClick={closeModal}
                    style={{
                      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                      backgroundColor: 'transparent',
                      color: theme.colors.text.secondary,
                      border: `1px solid ${theme.colors.border.primary}`,
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.typography.fontSize.base,
                      cursor: 'pointer',
                    }}
                  >
                    {hasFacilitiesChanges ? 'Cancel' : 'Done'}
                  </button>
                  {hasFacilitiesChanges && (
                    <button
                      onClick={handleSaveFacilities}
                      disabled={isSavingFacilities}
                      style={{
                        padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                        backgroundColor: theme.colors.gold.main,
                        color: theme.colors.background.primary,
                        border: 'none',
                        borderRadius: theme.borderRadius.md,
                        fontSize: theme.typography.fontSize.base,
                        fontWeight: theme.typography.fontWeight.semibold,
                        cursor: isSavingFacilities ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.sm,
                      }}
                    >
                      {isSavingFacilities && (
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          style={{ display: 'inline-flex' }}
                        >
                          <CgSpinnerAlt size={16} />
                        </motion.span>
                      )}
                      Save Changes
                    </button>
                  )}
                </div>
              )}

              {/* CREATE MODE: Step 1 (Details) - Cancel | Next */}
              {!editingTeam && createStep === 'details' && (
                <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' }}>
                  <button
                    onClick={closeModal}
                    style={{
                      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                      backgroundColor: 'transparent',
                      color: theme.colors.text.secondary,
                      border: `1px solid ${theme.colors.border.primary}`,
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.typography.fontSize.base,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAndContinue}
                    disabled={isSaving}
                    style={{
                      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                      backgroundColor: theme.colors.gold.main,
                      color: theme.colors.background.primary,
                      border: 'none',
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.semibold,
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                    }}
                  >
                    {isSaving && (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{ display: 'inline-flex' }}
                      >
                        <CgSpinnerAlt size={16} />
                      </motion.span>
                    )}
                    Next
                  </button>
                </div>
              )}

              {/* CREATE MODE: Step 2 (Coaches) - Back | Skip | Next */}
              {!editingTeam && createStep === 'coaches' && (
                <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'space-between' }}>
                  <button
                    onClick={() => setCreateStep('details')}
                    style={{
                      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                      backgroundColor: 'transparent',
                      color: theme.colors.text.secondary,
                      border: `1px solid ${theme.colors.border.primary}`,
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.typography.fontSize.base,
                      cursor: 'pointer',
                    }}
                  >
                    Back
                  </button>
                  <div style={{ display: 'flex', gap: theme.spacing.md }}>
                    <button
                      onClick={() => setCreateStep('facilities')}
                      style={{
                        padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                        backgroundColor: 'transparent',
                        color: theme.colors.text.secondary,
                        border: `1px solid ${theme.colors.border.primary}`,
                        borderRadius: theme.borderRadius.md,
                        fontSize: theme.typography.fontSize.base,
                        cursor: 'pointer',
                      }}
                    >
                      Skip
                    </button>
                    <button
                      onClick={() => setCreateStep('facilities')}
                      style={{
                        padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                        backgroundColor: theme.colors.gold.main,
                        color: theme.colors.background.primary,
                        border: 'none',
                        borderRadius: theme.borderRadius.md,
                        fontSize: theme.typography.fontSize.base,
                        fontWeight: theme.typography.fontWeight.semibold,
                        cursor: 'pointer',
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* CREATE MODE: Step 3 (Facilities) - Back | Done */}
              {!editingTeam && createStep === 'facilities' && (
                <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'space-between' }}>
                  <button
                    onClick={() => setCreateStep('coaches')}
                    style={{
                      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                      backgroundColor: 'transparent',
                      color: theme.colors.text.secondary,
                      border: `1px solid ${theme.colors.border.primary}`,
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.typography.fontSize.base,
                      cursor: 'pointer',
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleWizardDone}
                    disabled={isSavingFacilities}
                    style={{
                      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                      backgroundColor: theme.colors.gold.main,
                      color: theme.colors.background.primary,
                      border: 'none',
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.semibold,
                      cursor: isSavingFacilities ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                    }}
                  >
                    {isSavingFacilities && (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{ display: 'inline-flex' }}
                      >
                        <CgSpinnerAlt size={16} />
                      </motion.span>
                    )}
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && teamToDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: theme.zIndex.modal,
          }}
          onClick={() => {
            setShowDeleteConfirm(false)
            setTeamToDelete(null)
          }}
        >
          <div
            style={{
              backgroundColor: theme.colors.background.primary,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.xl,
              maxWidth: '400px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.md,
              }}
            >
              Delete Team
            </h3>
            <p
              style={{
                color: theme.colors.text.secondary,
                fontSize: theme.typography.fontSize.base,
                marginBottom: theme.spacing.lg,
              }}
            >
              Are you sure you want to delete{' '}
              <strong style={{ color: theme.colors.text.primary }}>{teamToDelete.name}</strong>?
              This will also delete all sessions and players associated with this team.
            </p>
            <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setTeamToDelete(null)
                }}
                style={{
                  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                  backgroundColor: 'transparent',
                  color: theme.colors.text.secondary,
                  border: `1px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                  backgroundColor: theme.colors.status.error,
                  color: theme.colors.text.primary,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                }}
              >
                {isDeleting && (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-flex' }}
                  >
                    <CgSpinnerAlt size={16} />
                  </motion.span>
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
