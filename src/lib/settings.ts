import { createClient } from '@/lib/supabase/client'
import type { Coach, Club, ClubMembership } from '@/types/database'

const supabase = createClient()

// ========================================
// Coach Profile Operations
// ========================================

export async function updateCoachProfile(
  coachId: string,
  updates: { name?: string; profile_picture?: string | null }
): Promise<{ data: Coach | null; error: string | null }> {
  const { data, error } = await supabase
    .from('coaches')
    .update(updates)
    .eq('id', coachId)
    .select()
    .single()

  if (error) {
    console.error('Error updating coach:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

// ========================================
// Club Operations (Head Coach Only)
// ========================================

export async function updateClub(
  clubId: string,
  updates: { name?: string; logo_url?: string | null }
): Promise<{ data: Club | null; error: string | null }> {
  const { data, error } = await supabase
    .from('clubs')
    .update(updates)
    .eq('id', clubId)
    .select()
    .single()

  if (error) {
    console.error('Error updating club:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function deleteClub(clubId: string): Promise<{ error: string | null }> {
  // This will cascade delete all related data due to FK constraints
  const { error } = await supabase
    .from('clubs')
    .delete()
    .eq('id', clubId)

  if (error) {
    console.error('Error deleting club:', error)
    return { error: error.message }
  }

  return { error: null }
}

// ========================================
// Club Membership Operations (Head Coach Only)
// ========================================

export async function getClubCoaches(
  clubId: string
): Promise<{ data: (ClubMembership & { coach: Coach })[] | null; error: string | null }> {
  const { data, error } = await supabase
    .rpc('get_club_coaches', { target_club_id: clubId })

  if (error) {
    console.error('Error fetching club coaches:', error)
    return { data: null, error: error.message }
  }

  // RPC returns JSON array, cast to proper type
  return { data: data as (ClubMembership & { coach: Coach })[], error: null }
}

export async function updateCoachRole(
  membershipId: string,
  role: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .rpc('update_coach_role', {
      target_membership_id: membershipId,
      new_role: role
    })

  if (error) {
    console.error('Error updating coach role:', error)
    return { error: error.message }
  }

  return { error: null }
}

export async function removeCoachFromClub(
  membershipId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .rpc('remove_coach_from_club', {
      target_membership_id: membershipId
    })

  if (error) {
    console.error('Error removing coach:', error)
    return { error: error.message }
  }

  return { error: null }
}

export async function transferHeadCoach(
  clubId: string,
  currentHeadCoachMembershipId: string,
  newHeadCoachMembershipId: string
): Promise<{ error: string | null }> {
  // Remove head coach from current
  const { error: removeError } = await supabase
    .from('club_memberships')
    .update({ is_head_coach: false, role: 'Assistant Coach' })
    .eq('id', currentHeadCoachMembershipId)

  if (removeError) {
    console.error('Error removing head coach status:', removeError)
    return { error: removeError.message }
  }

  // Set new head coach
  const { error: setError } = await supabase
    .from('club_memberships')
    .update({ is_head_coach: true, role: 'Head Coach' })
    .eq('id', newHeadCoachMembershipId)

  if (setError) {
    console.error('Error setting new head coach:', setError)
    // Try to rollback
    await supabase
      .from('club_memberships')
      .update({ is_head_coach: true, role: 'Head Coach' })
      .eq('id', currentHeadCoachMembershipId)
    return { error: setError.message }
  }

  return { error: null }
}

// ========================================
// Team Assignment Operations
// ========================================

export async function getCoachTeams(
  coachId: string,
  clubId: string
): Promise<{ data: { team_id: string; team_name: string }[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('team_coaches')
    .select(`
      team_id,
      team:teams(name)
    `)
    .eq('coach_id', coachId)

  if (error) {
    console.error('Error fetching coach teams:', error)
    return { data: null, error: error.message }
  }

  const teams = data?.map(tc => ({
    team_id: tc.team_id,
    team_name: (tc.team as any)?.name || 'Unknown Team'
  })) || []

  return { data: teams, error: null }
}

// ========================================
// Team Coaches Operations
// ========================================

export async function getTeamCoaches(
  teamId: string
): Promise<{ data: Coach[] | null; error: string | null }> {
  console.log('getTeamCoaches called with teamId:', teamId)

  const { data, error } = await supabase
    .from('team_coaches')
    .select(`
      coach_id,
      coaches (
        id,
        auth_user_id,
        email,
        name,
        profile_picture,
        position,
        onboarding_completed,
        created_at,
        updated_at
      )
    `)
    .eq('team_id', teamId)

  console.log('getTeamCoaches raw result:', { data, error })

  if (error) {
    console.error('Error fetching team coaches:', error)
    return { data: null, error: error.message }
  }

  // Extract coach objects from the join result
  const coaches = data?.map(tc => tc.coaches as unknown as Coach).filter(Boolean) || []
  console.log('getTeamCoaches extracted coaches:', coaches)

  return { data: coaches, error: null }
}

// ========================================
// Club Teams Operations
// ========================================

export async function getClubTeams(
  clubId: string
): Promise<{ data: { id: string; name: string }[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('teams')
    .select('id, name')
    .eq('club_id', clubId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching club teams:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function assignCoachToTeam(
  coachId: string,
  teamId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('team_coaches')
    .insert({ coach_id: coachId, team_id: teamId })

  if (error) {
    // Check for duplicate
    if (error.code === '23505') {
      return { error: 'Coach is already assigned to this team' }
    }
    console.error('Error assigning coach to team:', error)
    return { error: error.message }
  }

  return { error: null }
}

export async function unassignCoachFromTeam(
  coachId: string,
  teamId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('team_coaches')
    .delete()
    .eq('coach_id', coachId)
    .eq('team_id', teamId)

  if (error) {
    console.error('Error unassigning coach from team:', error)
    return { error: error.message }
  }

  return { error: null }
}

// ========================================
// Club Invite Operations (Admin Only)
// ========================================

export interface ClubInvite {
  id: string
  club_id: string
  email: string
  token: string
  created_by: string
  used_at: string | null
  created_at: string
}

export async function createInvite(
  clubId: string,
  email: string,
  createdBy: string
): Promise<{ data: { sent: boolean } | null; error: string | null }> {
  try {
    const response = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, clubId, createdBy }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { data: null, error: result.error || 'Failed to send invite' }
    }

    return { data: { sent: true }, error: null }
  } catch (error) {
    console.error('Error creating invite:', error)
    return { data: null, error: 'Failed to send invite. Please try again.' }
  }
}

export async function getPendingInvites(
  clubId: string
): Promise<{ data: ClubInvite[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('club_invites')
    .select('*')
    .eq('club_id', clubId)
    .is('used_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching pending invites:', error)
    return { data: null, error: error.message }
  }

  return { data: data as ClubInvite[], error: null }
}

export async function revokeInvite(
  inviteId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('club_invites')
    .delete()
    .eq('id', inviteId)

  if (error) {
    console.error('Error revoking invite:', error)
    return { error: error.message }
  }

  return { error: null }
}
