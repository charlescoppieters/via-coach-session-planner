import type { Team } from '@/types/database';

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTeamData = (team: Team): { isValid: boolean; missingFields: string[] } => {
  const missingFields: string[] = [];

  if (!team.name.trim()) missingFields.push('Team Name');
  if (!team.age_group.trim()) missingFields.push('Age Group');
  // Skill Level is optional - not included in validation
  if (team.player_count <= 0) missingFields.push('Player Count');
  if (team.sessions_per_week <= 0) missingFields.push('Sessions Per Week');
  if (team.session_duration <= 0) missingFields.push('Session Duration');

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

export const canSaveTeam = (team: Team): boolean => {
  return validateTeamData(team).isValid;
};