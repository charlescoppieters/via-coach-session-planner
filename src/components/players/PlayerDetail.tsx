import React, { useState, useEffect } from 'react';
import { FaEdit } from 'react-icons/fa';
import { theme } from '@/styles/theme';
import type { Player } from '@/types/database';

interface PlayerDetailProps {
  player: Player | null;
  onUpdate: (playerId: string, updates: {
    name?: string;
    age?: number | null;
    position?: string | null;
    gender?: string | null;
    target_1?: string | null;
    target_2?: string | null;
    target_3?: string | null;
  }) => Promise<void>;
  onDelete?: (playerId: string) => Promise<void>;
}

export const PlayerDetail: React.FC<PlayerDetailProps> = ({ player, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlayer, setEditedPlayer] = useState<{
    name: string;
    age: number | null;
    position: string;
    gender: string;
    target_1: string;
    target_2: string;
    target_3: string;
  }>({
    name: '',
    age: null,
    position: '',
    gender: '',
    target_1: '',
    target_2: '',
    target_3: '',
  });

  // Update editedPlayer when player prop changes
  useEffect(() => {
    if (player) {
      setEditedPlayer({
        name: player.name || '',
        age: player.age || null,
        position: player.position || '',
        gender: player.gender || '',
        target_1: player.target_1 || '',
        target_2: player.target_2 || '',
        target_3: player.target_3 || '',
      });
    }
    setIsEditing(false);
  }, [player]);

  const handleSave = async () => {
    if (!player) return;

    await onUpdate(player.id, {
      name: editedPlayer.name,
      age: editedPlayer.age,
      position: editedPlayer.position || null,
      gender: editedPlayer.gender || null,
      target_1: editedPlayer.target_1 || null,
      target_2: editedPlayer.target_2 || null,
      target_3: editedPlayer.target_3 || null,
    });

    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!player || !onDelete) return;
    if (!confirm(`Are you sure you want to delete ${player.name}?`)) return;

    await onDelete(player.id);
  };

  if (!player) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          textAlign: 'center',
          color: theme.colors.text.secondary,
          fontSize: theme.typography.fontSize.lg,
        }}>
          Select a player to view and edit details
        </div>
      </div>
    );
  }

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
        {/* Header: Player Name and Edit/Save Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.xl,
          paddingBottom: theme.spacing.lg,
          borderBottom: `1px solid ${theme.colors.border.primary}`,
        }}>
          {/* Player Name */}
          {isEditing ? (
            <input
              type="text"
              value={editedPlayer.name}
              onChange={(e) => setEditedPlayer({ ...editedPlayer, name: e.target.value })}
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
          ) : (
            <h1 style={{
              fontSize: theme.typography.fontSize['3xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              margin: 0,
              flex: 1,
            }}>
              {player.name}
            </h1>
          )}

          {/* Edit/Save Button */}
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              backgroundColor: isEditing ? theme.colors.gold.main : theme.colors.background.primary,
              color: isEditing ? theme.colors.background.primary : theme.colors.text.primary,
              border: 'none',
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              cursor: 'pointer',
              transition: theme.transitions.fast,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (isEditing) {
                e.currentTarget.style.backgroundColor = theme.colors.gold.light;
              }
            }}
            onMouseLeave={(e) => {
              if (isEditing) {
                e.currentTarget.style.backgroundColor = theme.colors.gold.main;
              }
            }}
          >
            {isEditing ? 'Save' : 'Edit'}
          </button>
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
            {isEditing ? (
              <input
                type="number"
                value={editedPlayer.age || ''}
                onChange={(e) => setEditedPlayer({ ...editedPlayer, age: e.target.value ? parseInt(e.target.value) : null })}
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
            ) : (
              <div style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
              }}>
                {player.age || '—'}
              </div>
            )}
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
            {isEditing ? (
              <select
                value={editedPlayer.gender}
                onChange={(e) => setEditedPlayer({ ...editedPlayer, gender: e.target.value })}
                style={{
                  width: '100%',
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: editedPlayer.gender ? theme.colors.text.primary : theme.colors.text.secondary,
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
            ) : (
              <div style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
              }}>
                {player.gender || '—'}
              </div>
            )}
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
            {isEditing ? (
              <select
                value={editedPlayer.position}
                onChange={(e) => setEditedPlayer({ ...editedPlayer, position: e.target.value })}
                style={{
                  width: '100%',
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: editedPlayer.position ? theme.colors.text.primary : theme.colors.text.secondary,
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
            ) : (
              <div style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
              }}>
                {player.position || '—'}
              </div>
            )}
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
            {isEditing ? (
              <textarea
                value={editedPlayer.target_1}
                onChange={(e) => setEditedPlayer({ ...editedPlayer, target_1: e.target.value })}
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
            ) : (
              <div style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.primary,
                lineHeight: '1.6',
              }}>
                {player.target_1 || '—'}
              </div>
            )}
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
            {isEditing ? (
              <textarea
                value={editedPlayer.target_2}
                onChange={(e) => setEditedPlayer({ ...editedPlayer, target_2: e.target.value })}
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
            ) : (
              <div style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.primary,
                lineHeight: '1.6',
              }}>
                {player.target_2 || '—'}
              </div>
            )}
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
            {isEditing ? (
              <textarea
                value={editedPlayer.target_3}
                onChange={(e) => setEditedPlayer({ ...editedPlayer, target_3: e.target.value })}
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
            ) : (
              <div style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.primary,
                lineHeight: '1.6',
              }}>
                {player.target_3 || '—'}
              </div>
            )}
          </div>
        </div>

        {/* Delete Button - Only visible when editing */}
        {isEditing && onDelete && (
          <div style={{
            marginTop: theme.spacing.xl,
            paddingTop: theme.spacing.xl,
            borderTop: `1px solid ${theme.colors.border.primary}`,
            display: 'flex',
            justifyContent: 'center',
          }}>
            <button
              onClick={handleDelete}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                backgroundColor: theme.colors.background.primary,
                color: theme.colors.status.error,
                border: 'none',
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                cursor: 'pointer',
                transition: theme.transitions.fast,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.background.primary;
              }}
            >
              Delete Player
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
