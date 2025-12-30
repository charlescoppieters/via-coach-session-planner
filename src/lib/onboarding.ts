import { createClient } from '@/lib/supabase/client';
import { copyClubMethodologyToTeam } from '@/lib/methodology';

const supabase = createClient();
import type { CoachUpdate, TeamInsert, TeamCoachInsert } from '@/types/database';

/**
 * Check onboarding progress to determine which step to resume at
 */
export async function getOnboardingProgress(coachId: string, clubId: string): Promise<{
  hasProfile: boolean
  hasGameModel: boolean
  hasTrainingSyllabus: boolean
  hasPositionalProfiles: boolean
  hasTeam: boolean
}> {
  // Run all queries in parallel for efficiency
  const [coachResult, gameModelResult, syllabusResult, profilesResult, teamsResult] = await Promise.all([
    // Check coach profile - has name set (not just email-derived default)
    supabase
      .from('coaches')
      .select('name, email')
      .eq('id', coachId)
      .single(),

    // Check if game model exists for club
    supabase
      .from('game_model')
      .select('id')
      .eq('club_id', clubId)
      .limit(1),

    // Check if training syllabus exists for club
    supabase
      .from('training_methodology')
      .select('id')
      .eq('club_id', clubId)
      .limit(1),

    // Check if positional profiles exist for club
    supabase
      .from('positional_profiles')
      .select('id')
      .eq('club_id', clubId)
      .limit(1),

    // Check if any team exists for club
    supabase
      .from('teams')
      .select('id')
      .eq('club_id', clubId)
      .limit(1),
  ]);

  // Determine if profile is complete
  // Profile is complete if name exists and is different from email prefix
  let hasProfile = false;
  if (coachResult.data?.name) {
    const email = coachResult.data.email || '';
    const emailPrefix = email.split('@')[0];
    // Consider profile complete if name is set and not just the email prefix
    hasProfile = coachResult.data.name !== emailPrefix && coachResult.data.name.trim() !== '';
  }

  return {
    hasProfile,
    hasGameModel: (gameModelResult.data?.length ?? 0) > 0,
    hasTrainingSyllabus: (syllabusResult.data?.length ?? 0) > 0,
    hasPositionalProfiles: (profilesResult.data?.length ?? 0) > 0,
    hasTeam: (teamsResult.data?.length ?? 0) > 0,
  };
}

/**
 * Updates coach profile during onboarding
 */
export const updateCoachProfile = async (
  coachId: string,
  updates: {
    name?: string;
    position?: string;
    profile_picture?: string;
  }
): Promise<{ error: string | null }> => {
  try {
    const updateData: CoachUpdate = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.position !== undefined) updateData.position = updates.position;
    if (updates.profile_picture !== undefined) updateData.profile_picture = updates.profile_picture;

    const { error } = await supabase
      .from('coaches')
      .update(updateData)
      .eq('id', coachId);

    if (error) {
      console.error('Error updating coach profile:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Unexpected error updating coach profile:', error);
    return { error: 'Failed to update profile' };
  }
};

/**
 * Marks onboarding as completed for a coach
 */
export const completeOnboarding = async (
  coachId: string
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('coaches')
      .update({ onboarding_completed: true })
      .eq('id', coachId);

    if (error) {
      console.error('Error completing onboarding:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Unexpected error completing onboarding:', error);
    return { error: 'Failed to complete onboarding' };
  }
};

/**
 * Creates a team for v2 (club-based ownership)
 */
export const createTeamV2 = async (
  clubId: string,
  coachId: string,
  teamData: {
    name: string;
    age_group: string;
    skill_level: string;
    player_count: number;
    sessions_per_week: number;
    session_duration: number;
    gender?: string | null;
  }
): Promise<{ data: any; error: string | null }> => {
  try {
    // Create the team
    const teamInsert: TeamInsert = {
      club_id: clubId,
      name: teamData.name,
      age_group: teamData.age_group,
      skill_level: teamData.skill_level,
      player_count: teamData.player_count,
      sessions_per_week: teamData.sessions_per_week,
      session_duration: teamData.session_duration,
      gender: teamData.gender || null,
      created_by_coach_id: coachId,
    };

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert(teamInsert)
      .select()
      .single();

    if (teamError) {
      console.error('Error creating team:', teamError);
      return { data: null, error: teamError.message };
    }

    // Assign the coach to the team
    const coachAssignment: TeamCoachInsert = {
      team_id: team.id,
      coach_id: coachId,
    };

    const { error: assignError } = await supabase
      .from('team_coaches')
      .insert(coachAssignment);

    if (assignError) {
      console.error('Error assigning coach to team:', assignError);
      // Rollback team creation
      await supabase.from('teams').delete().eq('id', team.id);
      return { data: null, error: assignError.message };
    }

    // Copy club methodology to the new team
    const { error: methodologyError } = await copyClubMethodologyToTeam(
      team.id,
      clubId,
      coachId
    );

    if (methodologyError) {
      // Log warning but don't fail team creation - methodology can be set up later
      console.warn('Warning: Failed to copy methodology to team:', methodologyError);
    }

    return { data: team, error: null };
  } catch (error) {
    console.error('Unexpected error creating team:', error);
    return { data: null, error: 'Failed to create team' };
  }
};

/**
 * Complete onboarding with team creation for v2
 */
export const completeOnboardingV2 = async (
  coachId: string,
  clubId: string,
  profileData: {
    name: string;
    position: string;
    profile_picture?: string;
  },
  teamData?: {
    name: string;
    age_group: string;
    skill_level: string;
    player_count: number;
    sessions_per_week: number;
    session_duration: number;
    gender?: string | null;
  }
): Promise<{ teamData: any; error: string | null }> => {
  try {
    // Update coach profile
    const profileResult = await updateCoachProfile(coachId, profileData);
    if (profileResult.error) {
      return { teamData: null, error: profileResult.error };
    }

    // Create team if data provided
    let team = null;
    if (teamData) {
      const teamResult = await createTeamV2(clubId, coachId, teamData);
      if (teamResult.error) {
        return { teamData: null, error: teamResult.error };
      }
      team = teamResult.data;
    }

    // Mark onboarding as completed
    const completeResult = await completeOnboarding(coachId);
    if (completeResult.error) {
      return { teamData: null, error: completeResult.error };
    }

    return { teamData: team, error: null };
  } catch (error) {
    console.error('Unexpected error completing onboarding:', error);
    return { teamData: null, error: 'Failed to complete onboarding' };
  }
};
