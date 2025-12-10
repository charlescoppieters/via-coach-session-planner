'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CgSpinnerAlt } from 'react-icons/cg'
import { FaTrash, FaCrown, FaPlus, FaCheck, FaChevronDown } from 'react-icons/fa'
import { IoChevronBack } from 'react-icons/io5'
import { theme } from '@/styles/theme'
import { useAuth } from '@/contexts/AuthContext'
import {
  getClubCoaches,
  updateCoachRole,
  removeCoachFromClub,
  getCoachTeams,
  getClubTeams,
  assignCoachToTeam,
  unassignCoachFromTeam,
  createInvite,
  getPendingInvites,
  revokeInvite,
  ClubInvite,
} from '@/lib/settings'
import { getProfilePictureUrl } from '@/lib/storage'
import type { Coach, ClubMembership } from '@/types/database'

type CoachWithMembership = ClubMembership & { coach: Coach }

// Multi-select dropdown component for teams
function TeamMultiSelect({
  coachId,
  assignedTeams,
  allTeams,
  onAssign,
  onUnassign,
}: {
  coachId: string
  assignedTeams: { team_id: string; team_name: string }[]
  allTeams: { id: string; name: string }[]
  onAssign: (coachId: string, teamId: string) => Promise<void>
  onUnassign: (coachId: string, teamId: string) => Promise<void>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const assignedIds = assignedTeams.map(t => t.team_id)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggleTeam = async (teamId: string) => {
    if (assignedIds.includes(teamId)) {
      await onUnassign(coachId, teamId)
    } else {
      await onAssign(coachId, teamId)
    }
  }

  const displayText = assignedTeams.length === 0
    ? 'No teams'
    : assignedTeams.length === 1
      ? assignedTeams[0].team_name
      : `${assignedTeams.length} teams`

  return (
    <div ref={dropdownRef} style={{ position: 'relative', minWidth: '140px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.spacing.sm,
          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
          backgroundColor: theme.colors.background.secondary,
          color: assignedTeams.length === 0 ? theme.colors.text.disabled : theme.colors.text.primary,
          border: `1px solid ${theme.colors.border.primary}`,
          borderRadius: theme.borderRadius.sm,
          fontSize: theme.typography.fontSize.sm,
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayText}
        </span>
        <FaChevronDown size={10} style={{ flexShrink: 0, opacity: 0.6 }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            backgroundColor: theme.colors.background.secondary,
            border: `1px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.sm,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 100,
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {allTeams.length === 0 ? (
            <div
              style={{
                padding: theme.spacing.sm,
                color: theme.colors.text.disabled,
                fontSize: theme.typography.fontSize.sm,
                textAlign: 'center',
              }}
            >
              No teams available
            </div>
          ) : (
            allTeams.map((team) => {
              const isAssigned = assignedIds.includes(team.id)
              return (
                <button
                  key={team.id}
                  onClick={() => handleToggleTeam(team.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    width: '100%',
                    padding: theme.spacing.sm,
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: theme.colors.text.primary,
                    fontSize: theme.typography.fontSize.sm,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.background.tertiary
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '3px',
                      border: `1px solid ${isAssigned ? theme.colors.gold.main : theme.colors.border.primary}`,
                      backgroundColor: isAssigned ? theme.colors.gold.main : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isAssigned && <FaCheck size={10} color={theme.colors.background.primary} />}
                  </div>
                  <span>{team.name}</span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default function CoachesSettingsPage() {
  const router = useRouter()
  const { coach: currentCoach, club, isAdmin, refreshAuth } = useAuth()

  const [coaches, setCoaches] = useState<CoachWithMembership[]>([])
  const [coachTeams, setCoachTeams] = useState<Record<string, { team_id: string; team_name: string }[]>>({})
  const [allTeams, setAllTeams] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  // Modal states
  const [removingCoachId, setRemovingCoachId] = useState<string | null>(null)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [coachToRemove, setCoachToRemove] = useState<CoachWithMembership | null>(null)

  // Invite modal states
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isCreatingInvite, setIsCreatingInvite] = useState(false)
  const [inviteSentTo, setInviteSentTo] = useState('')
  const [pendingInvites, setPendingInvites] = useState<ClubInvite[]>([])
  const [loadingInvites, setLoadingInvites] = useState(false)
  const [inviteError, setInviteError] = useState('')

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      router.replace('/settings')
    }
  }, [isAdmin, router])

  // Fetch coaches and teams
  useEffect(() => {
    const fetchData = async () => {
      if (!club?.id) return

      setIsLoading(true)

      const { data: coachesData, error: coachesError } = await getClubCoaches(club.id)
      if (coachesError) {
        setErrorMessage(coachesError)
      } else if (coachesData) {
        setCoaches(coachesData)

        const teamsMap: Record<string, { team_id: string; team_name: string }[]> = {}
        for (const membership of coachesData) {
          const { data: teams } = await getCoachTeams(membership.coach_id, club.id)
          if (teams) {
            teamsMap[membership.coach_id] = teams
          }
        }
        setCoachTeams(teamsMap)
      }

      const { data: teamsData } = await getClubTeams(club.id)
      if (teamsData) {
        setAllTeams(teamsData)
      }

      setIsLoading(false)
    }

    fetchData()
  }, [club?.id])

  if (!isAdmin || !club) {
    return null
  }

  const handleUpdateRole = async (membershipId: string, coachId: string, newRole: 'admin' | 'coach') => {
    setErrorMessage('')

    // Prevent removing the last admin
    if (newRole === 'coach') {
      const adminCount = coaches.filter(c => c.role === 'admin').length
      if (adminCount <= 1 && coaches.find(c => c.id === membershipId)?.role === 'admin') {
        setErrorMessage('Cannot remove the last admin. Promote another coach first.')
        return
      }
    }

    const { error } = await updateCoachRole(membershipId, newRole)

    if (error) {
      setErrorMessage(error)
    } else {
      setCoaches((prev) =>
        prev.map((c) => (c.id === membershipId ? { ...c, role: newRole } : c))
      )

      if (coachId === currentCoach?.id) {
        await refreshAuth()
      }
    }
  }

  const handleRemoveCoach = async () => {
    if (!coachToRemove) return

    setRemovingCoachId(coachToRemove.id)
    setErrorMessage('')

    const { error } = await removeCoachFromClub(coachToRemove.id)

    if (error) {
      setErrorMessage(error)
    } else {
      setCoaches((prev) => prev.filter((c) => c.id !== coachToRemove.id))
      setCoachTeams((prev) => {
        const updated = { ...prev }
        delete updated[coachToRemove.coach_id]
        return updated
      })
    }

    setRemovingCoachId(null)
    setShowRemoveConfirm(false)
    setCoachToRemove(null)
  }

  const handleAssignTeam = async (coachId: string, teamId: string) => {
    setErrorMessage('')
    const { error } = await assignCoachToTeam(coachId, teamId)

    if (error) {
      setErrorMessage(error)
    } else {
      const teamName = allTeams.find(t => t.id === teamId)?.name || 'Unknown Team'
      setCoachTeams((prev) => ({
        ...prev,
        [coachId]: [...(prev[coachId] || []), { team_id: teamId, team_name: teamName }]
      }))
    }
  }

  const handleUnassignTeam = async (coachId: string, teamId: string) => {
    setErrorMessage('')
    const { error } = await unassignCoachFromTeam(coachId, teamId)

    if (error) {
      setErrorMessage(error)
    } else {
      setCoachTeams((prev) => ({
        ...prev,
        [coachId]: (prev[coachId] || []).filter(t => t.team_id !== teamId)
      }))
    }
  }

  // Invite handlers
  const openInviteModal = async () => {
    setShowInviteModal(true)
    setInviteEmail('')
    setInviteSentTo('')
    setInviteError('')

    // Load pending invites
    if (club?.id) {
      setLoadingInvites(true)
      const { data } = await getPendingInvites(club.id)
      setPendingInvites(data || [])
      setLoadingInvites(false)
    }
  }

  const closeInviteModal = () => {
    setShowInviteModal(false)
    setInviteEmail('')
    setInviteSentTo('')
    setInviteError('')
  }

  const handleCreateInvite = async () => {
    if (!inviteEmail.trim() || !club?.id || !currentCoach?.id) return

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail.trim())) {
      setInviteError('Please enter a valid email address')
      return
    }

    setIsCreatingInvite(true)
    setInviteError('')
    setInviteSentTo('')

    const { data, error } = await createInvite(club.id, inviteEmail.trim(), currentCoach.id)

    if (error) {
      setInviteError(error)
    } else if (data) {
      setInviteSentTo(inviteEmail.trim())
      // Refresh pending invites
      const { data: invites } = await getPendingInvites(club.id)
      setPendingInvites(invites || [])
      setInviteEmail('')
    }

    setIsCreatingInvite(false)
  }

  const handleRevokeInvite = async (inviteId: string) => {
    const { error } = await revokeInvite(inviteId)

    if (error) {
      setInviteError(error)
    } else {
      setPendingInvites(prev => prev.filter(i => i.id !== inviteId))
    }
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
          Manage Coaches
        </h1>
        <div style={{ display: 'flex', gap: theme.spacing.md, alignItems: 'center' }}>
          <button
            onClick={openInviteModal}
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
            Invite Coach
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
        Manage coaches in your club, update roles, and assign teams.
      </p>

      {/* Error Message */}
      {errorMessage && (
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

      {/* Coaches List */}
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
            <span style={{ color: theme.colors.text.secondary }}>Loading coaches...</span>
          </div>
        ) : coaches.length === 0 ? (
          <div
            style={{
              padding: theme.spacing.xl,
              textAlign: 'center',
              color: theme.colors.text.secondary,
            }}
          >
            No coaches in this club yet.
          </div>
        ) : (
          coaches.map((membership, index) => {
            const isCurrentUser = membership.coach_id === currentCoach?.id
            const teams = coachTeams[membership.coach_id] || []

            return (
              <div
                key={membership.id}
                style={{
                  padding: theme.spacing.lg,
                  borderBottom:
                    index < coaches.length - 1
                      ? `1px solid ${theme.colors.border.secondary}`
                      : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.lg,
                }}
              >
                {/* Avatar */}
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
                    overflow: 'hidden',
                  }}
                >
                  {membership.coach.profile_picture ? (
                    <img
                      src={getProfilePictureUrl(membership.coach.profile_picture)}
                      alt={membership.coach.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: theme.typography.fontSize.base,
                        fontWeight: theme.typography.fontWeight.bold,
                        color: theme.colors.text.secondary,
                      }}
                    >
                      {membership.coach.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  )}
                </div>

                {/* Name & Email */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <span
                      style={{
                        fontSize: theme.typography.fontSize.base,
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: theme.colors.text.primary,
                      }}
                    >
                      {membership.coach.name}
                    </span>
                    {isCurrentUser && (
                      <span
                        style={{
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.text.disabled,
                        }}
                      >
                        (You)
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text.secondary,
                    }}
                  >
                    {membership.coach.email}
                  </div>
                </div>

                {/* Role Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <span
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text.secondary,
                    }}
                  >
                    Role:
                  </span>
                  {isCurrentUser ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        padding: '6px 8px',
                        minWidth: '80px',
                        boxSizing: 'border-box',
                        backgroundColor: membership.role === 'admin' ? 'rgba(239, 191, 4, 0.1)' : theme.colors.background.tertiary,
                        border: membership.role === 'admin' ? `1px solid ${theme.colors.gold.main}` : `1px solid ${theme.colors.border.primary}`,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.sm,
                        color: membership.role === 'admin' ? theme.colors.gold.main : theme.colors.text.primary,
                      }}
                    >
                      {membership.role === 'admin' && <FaCrown size={10} />}
                      {membership.role === 'admin' ? 'Admin' : 'Coach'}
                    </div>
                  ) : (
                    <select
                      value={membership.role}
                      onChange={(e) => handleUpdateRole(membership.id, membership.coach_id, e.target.value as 'admin' | 'coach')}
                      style={{
                        padding: '6px 8px',
                        paddingRight: '28px',
                        minWidth: '80px',
                        backgroundColor: theme.colors.background.secondary,
                        color: theme.colors.text.primary,
                        border: `1px solid ${theme.colors.border.primary}`,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.sm,
                        cursor: 'pointer',
                        outline: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%23888' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 8px center',
                      }}
                    >
                      <option value="admin">Admin</option>
                      <option value="coach">Coach</option>
                    </select>
                  )}
                </div>

                {/* Teams Multi-Select */}
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <span
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text.secondary,
                    }}
                  >
                    Teams:
                  </span>
                  <TeamMultiSelect
                    coachId={membership.coach_id}
                    assignedTeams={teams}
                    allTeams={allTeams}
                    onAssign={handleAssignTeam}
                    onUnassign={handleUnassignTeam}
                  />
                </div>

                {/* Remove Button */}
                {isCurrentUser ? (
                  <div style={{ width: '32px', height: '32px', flexShrink: 0 }} />
                ) : (
                  <button
                    onClick={() => {
                      setCoachToRemove(membership)
                      setShowRemoveConfirm(true)
                    }}
                    title="Remove from club"
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
                      flexShrink: 0,
                      width: '32px',
                      height: '32px',
                    }}
                  >
                    <FaTrash size={14} />
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && coachToRemove && (
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
            setShowRemoveConfirm(false)
            setCoachToRemove(null)
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
              Remove Coach
            </h3>
            <p
              style={{
                color: theme.colors.text.secondary,
                fontSize: theme.typography.fontSize.base,
                marginBottom: theme.spacing.lg,
              }}
            >
              Are you sure you want to remove{' '}
              <strong style={{ color: theme.colors.text.primary }}>
                {coachToRemove.coach.name}
              </strong>{' '}
              from the club? They will lose access to all club data.
            </p>
            <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowRemoveConfirm(false)
                  setCoachToRemove(null)
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
                onClick={handleRemoveCoach}
                disabled={removingCoachId === coachToRemove.id}
                style={{
                  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                  backgroundColor: theme.colors.status.error,
                  color: theme.colors.text.primary,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  cursor: removingCoachId ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                }}
              >
                {removingCoachId === coachToRemove.id && (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-flex' }}
                  >
                    <CgSpinnerAlt size={16} />
                  </motion.span>
                )}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Coach Modal */}
      {showInviteModal && (
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
          onClick={closeInviteModal}
        >
          <div
            style={{
              backgroundColor: theme.colors.background.primary,
              borderRadius: theme.borderRadius.lg,
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: theme.spacing.xl, paddingBottom: theme.spacing.lg }}>
              <h3
                style={{
                  fontSize: theme.typography.fontSize.xl,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text.primary,
                  margin: 0,
                }}
              >
                Invite Coach
              </h3>
              <p
                style={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.fontSize.sm,
                  marginTop: theme.spacing.sm,
                  marginBottom: 0,
                }}
              >
                Send an invite email to a new coach to join your club.
              </p>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: theme.spacing.xl, paddingTop: 0 }}>
              {/* Error */}
              {inviteError && (
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
                  {inviteError}
                </div>
              )}

              {/* Email Input */}
              <div style={{ marginBottom: theme.spacing.lg }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Email Address
                </label>
                <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="coach@example.com"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && inviteEmail.trim()) {
                        handleCreateInvite()
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: theme.spacing.sm,
                      backgroundColor: theme.colors.background.secondary,
                      color: theme.colors.text.primary,
                      border: `1px solid ${theme.colors.border.primary}`,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: theme.typography.fontSize.base,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleCreateInvite}
                    disabled={!inviteEmail.trim() || isCreatingInvite}
                    style={{
                      padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                      backgroundColor: inviteEmail.trim() ? theme.colors.gold.main : theme.colors.background.secondary,
                      color: inviteEmail.trim() ? theme.colors.background.primary : theme.colors.text.secondary,
                      border: `1px solid ${inviteEmail.trim() ? theme.colors.gold.main : theme.colors.border.primary}`,
                      borderRadius: theme.borderRadius.sm,
                      cursor: inviteEmail.trim() && !isCreatingInvite ? 'pointer' : 'not-allowed',
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.xs,
                      opacity: inviteEmail.trim() ? 1 : 0.7,
                    }}
                  >
                    {isCreatingInvite && (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{ display: 'inline-flex' }}
                      >
                        <CgSpinnerAlt size={14} />
                      </motion.span>
                    )}
                    Send Invite
                  </button>
                </div>
              </div>

              {/* Invite Sent Success */}
              {inviteSentTo && (
                <div
                  style={{
                    padding: theme.spacing.md,
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    border: `1px solid ${theme.colors.status.success}`,
                    borderRadius: theme.borderRadius.md,
                    marginBottom: theme.spacing.lg,
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                  }}
                >
                  <FaCheck size={14} color={theme.colors.status.success} />
                  <span
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.status.success,
                    }}
                  >
                    Invite sent to <strong>{inviteSentTo}</strong>
                  </span>
                </div>
              )}

              {/* Pending Invites */}
              <div>
                <h4
                  style={{
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text.primary,
                    marginBottom: theme.spacing.md,
                  }}
                >
                  Pending Invites
                </h4>

                {loadingInvites ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <CgSpinnerAlt size={16} color={theme.colors.gold.main} />
                    </motion.div>
                    <span style={{ color: theme.colors.text.secondary, fontSize: theme.typography.fontSize.sm }}>
                      Loading...
                    </span>
                  </div>
                ) : pendingInvites.length === 0 ? (
                  <p style={{ color: theme.colors.text.secondary, fontSize: theme.typography.fontSize.sm }}>
                    No pending invites.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                    {pendingInvites.map((invite) => (
                      <div
                        key={invite.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: theme.spacing.md,
                          padding: theme.spacing.md,
                          backgroundColor: theme.colors.background.secondary,
                          borderRadius: theme.borderRadius.md,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: theme.typography.fontSize.sm,
                              color: theme.colors.text.primary,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {invite.email}
                          </div>
                          <div style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.text.secondary }}>
                            Sent {new Date(invite.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRevokeInvite(invite.id)}
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
                          title="Revoke invite"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: theme.spacing.xl,
                paddingTop: theme.spacing.lg,
                borderTop: `1px solid ${theme.colors.border.primary}`,
              }}
            >
              <button
                onClick={closeInviteModal}
                style={{
                  width: '100%',
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
          </div>
        </div>
      )}
    </div>
  )
}
