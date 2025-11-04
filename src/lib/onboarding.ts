import { supabase } from './supabase';
import type { CoachUpdate } from '@/types/database';

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
 * Creates the first team for a coach during onboarding
 */
export const createFirstTeam = async (
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
    const { data, error } = await supabase
      .from('teams')
      .insert({
        coach_id: coachId,
        name: teamData.name,
        age_group: teamData.age_group,
        skill_level: teamData.skill_level,
        player_count: teamData.player_count,
        sessions_per_week: teamData.sessions_per_week,
        session_duration: teamData.session_duration,
        gender: teamData.gender || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating first team:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error creating first team:', error);
    return { data: null, error: 'Failed to create team' };
  }
};

/**
 * Combined function to complete onboarding with profile and team creation
 */
export const completeOnboardingWithTeam = async (
  coachId: string,
  profileData: {
    name: string;
    position: string;
    profile_picture?: string;
  },
  teamData: {
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

    // Create first team
    const teamResult = await createFirstTeam(coachId, teamData);
    if (teamResult.error) {
      return { teamData: null, error: teamResult.error };
    }

    // Mark onboarding as completed
    const completeResult = await completeOnboarding(coachId);
    if (completeResult.error) {
      return { teamData: null, error: completeResult.error };
    }

    return { teamData: teamResult.data, error: null };
  } catch (error) {
    console.error('Unexpected error completing onboarding:', error);
    return { teamData: null, error: 'Failed to complete onboarding' };
  }
};
