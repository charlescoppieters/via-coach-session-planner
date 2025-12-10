import React, { useState, useEffect } from 'react';
import { theme } from '@/styles/theme';
import type { Team } from '@/types/database';

interface PlayerFormProps {
  team: Team;
  onCreate: (playerData: {
    club_id: string;
    team_id: string;
    name: string;
    age?: number | null;
    position?: string | null;
    gender?: string | null;
    target_1?: string | null;
    target_2?: string | null;
    target_3?: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

// Helper function to extract age from age_group (e.g., "U12" → 12)
function extractAgeFromAgeGroup(ageGroup: string): number | null {
  const match = ageGroup.match(/\d+/);
  return match ? parseInt(match[0]) : null;
}

export const PlayerForm: React.FC<PlayerFormProps> = ({ team, onCreate, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: extractAgeFromAgeGroup(team.age_group),
    position: '',
    gender: team.gender || '',
    target_1: '',
    target_2: '',
    target_3: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  // Update age and gender when team changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      age: extractAgeFromAgeGroup(team.age_group),
      gender: team.gender || '',
    }));
  }, [team.age_group, team.gender]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a player name');
      return;
    }

    setIsSaving(true);
    console.log('Creating player with data:', {
      club_id: team.club_id,
      team_id: team.id,
      name: formData.name,
      age: formData.age,
      position: formData.position || null,
      gender: formData.gender || null,
      target_1: formData.target_1 || null,
      target_2: formData.target_2 || null,
      target_3: formData.target_3 || null,
    });
    try {
      await onCreate({
        club_id: team.club_id,
        team_id: team.id,
        name: formData.name,
        age: formData.age,
        position: formData.position || null,
        gender: formData.gender || null,
        target_1: formData.target_1 || null,
        target_2: formData.target_2 || null,
        target_3: formData.target_3 || null,
      });
    } catch (error) {
      console.error('Error creating player:', error);
      alert('Failed to create player. Check console for details.');
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      padding: theme.spacing.xl,
    }}>
      <div style={{
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.xl,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      }}>
        {/* Header: Player Name and Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.xl,
          paddingBottom: theme.spacing.lg,
          borderBottom: `1px solid ${theme.colors.border.primary}`,
        }}>
          {/* Player Name */}
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Player Name"
            style={{
              flex: 1,
              fontSize: theme.typography.fontSize['3xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              padding: theme.spacing.sm,
              border: `2px solid ${theme.colors.border.primary}`,
              borderRadius: theme.borderRadius.md,
              outline: 'none',
              backgroundColor: theme.colors.background.primary,
              marginRight: theme.spacing.lg,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = theme.colors.gold.main;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme.colors.border.primary;
            }}
          />

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: theme.spacing.md,
            flexShrink: 0,
          }}>
            <button
              onClick={onCancel}
              disabled={isSaving}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                backgroundColor: 'transparent',
                color: '#666666',
                border: `2px solid ${theme.colors.border.primary}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                transition: theme.transitions.fast,
                opacity: isSaving ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.borderColor = '#666666';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.borderColor = theme.colors.border.primary;
                }
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                backgroundColor: theme.colors.gold.main,
                color: theme.colors.background.primary,
                border: 'none',
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                transition: theme.transitions.fast,
                opacity: isSaving ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.backgroundColor = theme.colors.gold.light;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.backgroundColor = theme.colors.gold.main;
                }
              }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: theme.spacing.lg,
          marginBottom: theme.spacing.xl,
          paddingBottom: theme.spacing.xl,
          borderBottom: `1px solid ${theme.colors.border.primary}`,
        }}>
          {/* Age */}
          <div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: '#666666',
              marginBottom: theme.spacing.xs,
            }}>
              Age
            </div>
            <input
              type="number"
              value={formData.age || ''}
              onChange={(e) => setFormData({ ...formData, age: e.target.value ? parseInt(e.target.value) : null })}
              style={{
                width: '100%',
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                padding: theme.spacing.sm,
                border: `2px solid ${theme.colors.border.primary}`,
                borderRadius: theme.borderRadius.md,
                outline: 'none',
                backgroundColor: theme.colors.background.primary,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.colors.gold.main;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme.colors.border.primary;
              }}
            />
          </div>

          {/* Gender */}
          <div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: '#666666',
              marginBottom: theme.spacing.xs,
            }}>
              Gender
            </div>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              style={{
                width: '100%',
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: formData.gender ? theme.colors.text.primary : theme.colors.text.secondary,
                padding: theme.spacing.sm,
                border: `2px solid ${theme.colors.border.primary}`,
                borderRadius: theme.borderRadius.md,
                outline: 'none',
                backgroundColor: theme.colors.background.primary,
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.7rem center',
                backgroundSize: '1.2em',
                paddingRight: '2.5rem',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.colors.gold.main;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme.colors.border.primary;
              }}
            >
              <option value="" style={{ color: theme.colors.text.secondary }}>Select...</option>
              <option value="Male" style={{ color: theme.colors.text.primary }}>Male</option>
              <option value="Female" style={{ color: theme.colors.text.primary }}>Female</option>
              <option value="Mixed" style={{ color: theme.colors.text.primary }}>Mixed</option>
            </select>
          </div>

          {/* Position */}
          <div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: '#666666',
              marginBottom: theme.spacing.xs,
            }}>
              Position
            </div>
            <select
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              style={{
                width: '100%',
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: formData.position ? theme.colors.text.primary : theme.colors.text.secondary,
                padding: theme.spacing.sm,
                border: `2px solid ${theme.colors.border.primary}`,
                borderRadius: theme.borderRadius.md,
                outline: 'none',
                backgroundColor: theme.colors.background.primary,
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.7rem center',
                backgroundSize: '1.2em',
                paddingRight: '2.5rem',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.colors.gold.main;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme.colors.border.primary;
              }}
            >
              <option value="" style={{ color: theme.colors.text.secondary }}>Select...</option>
              <optgroup label="Goalkeeper" style={{ color: theme.colors.text.primary }}>
                <option value="GK" style={{ color: theme.colors.text.primary }}>GK - Goalkeeper</option>
              </optgroup>
              <optgroup label="Defenders" style={{ color: theme.colors.text.primary }}>
                <option value="CB" style={{ color: theme.colors.text.primary }}>CB - Center Back</option>
                <option value="LB" style={{ color: theme.colors.text.primary }}>LB - Left Back</option>
                <option value="RB" style={{ color: theme.colors.text.primary }}>RB - Right Back</option>
                <option value="LWB" style={{ color: theme.colors.text.primary }}>LWB - Left Wing Back</option>
                <option value="RWB" style={{ color: theme.colors.text.primary }}>RWB - Right Wing Back</option>
                <option value="SW" style={{ color: theme.colors.text.primary }}>SW - Sweeper</option>
              </optgroup>
              <optgroup label="Midfielders" style={{ color: theme.colors.text.primary }}>
                <option value="CDM" style={{ color: theme.colors.text.primary }}>CDM - Defensive Midfielder</option>
                <option value="CM" style={{ color: theme.colors.text.primary }}>CM - Central Midfielder</option>
                <option value="CAM" style={{ color: theme.colors.text.primary }}>CAM - Attacking Midfielder</option>
                <option value="LM" style={{ color: theme.colors.text.primary }}>LM - Left Midfielder</option>
                <option value="RM" style={{ color: theme.colors.text.primary }}>RM - Right Midfielder</option>
                <option value="DM" style={{ color: theme.colors.text.primary }}>DM - Defensive Midfielder</option>
                <option value="AM" style={{ color: theme.colors.text.primary }}>AM - Attacking Midfielder</option>
              </optgroup>
              <optgroup label="Forwards" style={{ color: theme.colors.text.primary }}>
                <option value="ST" style={{ color: theme.colors.text.primary }}>ST - Striker</option>
                <option value="CF" style={{ color: theme.colors.text.primary }}>CF - Center Forward</option>
                <option value="LW" style={{ color: theme.colors.text.primary }}>LW - Left Winger</option>
                <option value="RW" style={{ color: theme.colors.text.primary }}>RW - Right Winger</option>
                <option value="SS" style={{ color: theme.colors.text.primary }}>SS - Second Striker</option>
                <option value="F" style={{ color: theme.colors.text.primary }}>F - Forward</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Individual Development Plan */}
        <h2 style={{
          fontSize: theme.typography.fontSize['2xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.lg,
          marginTop: 0,
        }}>
          Individual Development Plan
        </h2>

        {/* IDP Targets */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.lg,
        }}>
          {/* Target 1 */}
          <div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: '#666666',
              marginBottom: theme.spacing.xs,
            }}>
              Target 1
            </div>
            <textarea
              value={formData.target_1}
              onChange={(e) => setFormData({ ...formData, target_1: e.target.value })}
              placeholder="What is the player working to improve?"
              rows={3}
              style={{
                width: '100%',
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.primary,
                padding: theme.spacing.md,
                border: `2px solid ${theme.colors.border.primary}`,
                borderRadius: theme.borderRadius.md,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                backgroundColor: theme.colors.background.primary,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.colors.gold.main;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme.colors.border.primary;
              }}
            />
          </div>

          {/* Target 2 */}
          <div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: '#666666',
              marginBottom: theme.spacing.xs,
            }}>
              Target 2
            </div>
            <textarea
              value={formData.target_2}
              onChange={(e) => setFormData({ ...formData, target_2: e.target.value })}
              placeholder="What is the player working to improve?"
              rows={3}
              style={{
                width: '100%',
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.primary,
                padding: theme.spacing.md,
                border: `2px solid ${theme.colors.border.primary}`,
                borderRadius: theme.borderRadius.md,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                backgroundColor: theme.colors.background.primary,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.colors.gold.main;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme.colors.border.primary;
              }}
            />
          </div>

          {/* Target 3 */}
          <div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: '#666666',
              marginBottom: theme.spacing.xs,
            }}>
              Target 3
            </div>
            <textarea
              value={formData.target_3}
              onChange={(e) => setFormData({ ...formData, target_3: e.target.value })}
              placeholder="What is the player working to improve?"
              rows={3}
              style={{
                width: '100%',
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.primary,
                padding: theme.spacing.md,
                border: `2px solid ${theme.colors.border.primary}`,
                borderRadius: theme.borderRadius.md,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                backgroundColor: theme.colors.background.primary,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.colors.gold.main;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme.colors.border.primary;
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
