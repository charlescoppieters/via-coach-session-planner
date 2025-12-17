import React, { useState, useEffect } from 'react';
import { theme } from '@/styles/theme';
import type { Player, PlayerIDP } from '@/types/database';
import { isPositionalProfileAttributesV2 } from '@/types/database';
import {
  getSystemDefaults,
  getClubPositionalProfiles,
  getInPossessionAttributes,
  getOutOfPossessionAttributes,
  SystemDefault,
  PositionalProfile,
} from '@/lib/methodology';
import { getPlayerIDPs, updatePlayerIDPs } from '@/lib/players';

interface PositionOption {
  key: string;
  name: string;
  inPossessionAttrs: string[];
  outOfPossessionAttrs: string[];
}

interface PlayerDetailProps {
  player: Player | null;
  clubId: string;
  onUpdate: (playerId: string, updates: {
    name?: string;
    age?: number | null;
    position?: string | null;
    gender?: string | null;
  }) => Promise<void>;
  onDelete?: (playerId: string) => Promise<void>;
}

export const PlayerDetail: React.FC<PlayerDetailProps> = ({ player, clubId, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlayer, setEditedPlayer] = useState<{
    name: string;
    age: number | null;
    position: string;
    gender: string;
  }>({
    name: '',
    age: null,
    position: '',
    gender: '',
  });

  const [playerIDPs, setPlayerIDPs] = useState<PlayerIDP[]>([]);
  const [editedIDPs, setEditedIDPs] = useState<Array<{ attribute_key: string; priority: number; notes?: string }>>([]);
  const [inPossessionAttributes, setInPossessionAttributes] = useState<SystemDefault[]>([]);
  const [outOfPossessionAttributes, setOutOfPossessionAttributes] = useState<SystemDefault[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [isLoadingIDPs, setIsLoadingIDPs] = useState(false);

  // Fetch attributes and positions on mount
  useEffect(() => {
    const fetchData = async () => {
      const [inPossRes, outPossRes, profilesRes, positionsRes] = await Promise.all([
        getInPossessionAttributes(),
        getOutOfPossessionAttributes(),
        getClubPositionalProfiles(clubId),
        getSystemDefaults('positions'),
      ]);

      if (inPossRes.data) {
        setInPossessionAttributes(inPossRes.data);
      }
      if (outPossRes.data) {
        setOutOfPossessionAttributes(outPossRes.data);
      }

      // Build position options with their attributes
      if (profilesRes.data && positionsRes.data) {
        const positionMap = new Map<string, string>();
        positionsRes.data.forEach((pos: SystemDefault) => {
          positionMap.set(pos.key, pos.value.name);
        });

        const positionOptions: PositionOption[] = profilesRes.data
          .filter((profile: PositionalProfile) => profile.is_active)
          .map((profile: PositionalProfile) => {
            // Handle v2 attribute structure
            let inPoss: string[] = [];
            let outPoss: string[] = [];

            if (isPositionalProfileAttributesV2(profile.attributes)) {
              inPoss = profile.attributes.in_possession || [];
              outPoss = profile.attributes.out_of_possession || [];
            } else if (Array.isArray(profile.attributes)) {
              // Legacy v1: put all in in_possession
              inPoss = profile.attributes;
            }

            return {
              key: profile.position_key,
              name: profile.custom_position_name || positionMap.get(profile.position_key) || profile.position_key,
              inPossessionAttrs: inPoss,
              outOfPossessionAttrs: outPoss,
            };
          });

        setPositions(positionOptions);
      }
    };
    fetchData();
  }, [clubId]);

  // Fetch IDPs when player changes
  useEffect(() => {
    const fetchIDPs = async () => {
      if (!player) {
        setPlayerIDPs([]);
        return;
      }
      setIsLoadingIDPs(true);
      const { data } = await getPlayerIDPs(player.id);
      if (data) {
        setPlayerIDPs(data);
        setEditedIDPs(data.map(idp => ({
          attribute_key: idp.attribute_key,
          priority: idp.priority,
          notes: idp.notes || undefined
        })));
      }
      setIsLoadingIDPs(false);
    };
    fetchIDPs();
  }, [player?.id]);

  // Update editedPlayer when player prop changes
  useEffect(() => {
    if (player) {
      setEditedPlayer({
        name: player.name || '',
        age: player.age || null,
        position: player.position || '',
        gender: player.gender || '',
      });
    }
    setIsEditing(false);
  }, [player]);

  const handleSave = async () => {
    if (!player) return;

    // Update player basic info
    await onUpdate(player.id, {
      name: editedPlayer.name,
      age: editedPlayer.age,
      position: editedPlayer.position || null,
      gender: editedPlayer.gender || null,
    });

    // Update IDPs if changed
    const idpsChanged = JSON.stringify(editedIDPs) !== JSON.stringify(
      playerIDPs.map(idp => ({ attribute_key: idp.attribute_key, priority: idp.priority, notes: idp.notes || undefined }))
    );

    if (idpsChanged && editedIDPs.length > 0) {
      await updatePlayerIDPs(player.id, editedIDPs);
      // Refetch IDPs
      const { data } = await getPlayerIDPs(player.id);
      if (data) {
        setPlayerIDPs(data);
      }
    }

    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!player || !onDelete) return;
    if (!confirm(`Are you sure you want to delete ${player.name}?`)) return;

    await onDelete(player.id);
  };

  const handleAddIDP = (attributeKey: string) => {
    if (editedIDPs.length >= 3) {
      alert('Maximum 3 IDPs allowed');
      return;
    }
    if (editedIDPs.find(idp => idp.attribute_key === attributeKey)) {
      alert('This attribute is already selected');
      return;
    }
    setEditedIDPs([...editedIDPs, {
      attribute_key: attributeKey,
      priority: editedIDPs.length + 1
    }]);
  };

  const handleRemoveIDP = (attributeKey: string) => {
    const newIDPs = editedIDPs
      .filter(idp => idp.attribute_key !== attributeKey)
      .map((idp, idx) => ({ ...idp, priority: idx + 1 }));
    setEditedIDPs(newIDPs);
  };

  const getAttributeName = (key: string) => {
    // Check in both attribute lists
    const inPossAttr = inPossessionAttributes.find(a => a.key === key);
    if (inPossAttr) return inPossAttr.value?.name || key;

    const outPossAttr = outOfPossessionAttributes.find(a => a.key === key);
    if (outPossAttr) return outPossAttr.value?.name || key;

    return key;
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
                onChange={(e) => {
                  setEditedPlayer({ ...editedPlayer, position: e.target.value });
                  // Clear IDPs when position changes since attributes are position-specific
                  setEditedIDPs([]);
                }}
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
                <option value="" disabled style={{ color: theme.colors.text.secondary }}>Select...</option>
                {positions.length === 0 ? (
                  <option value="" disabled style={{ color: theme.colors.text.secondary }}>
                    No positions configured
                  </option>
                ) : (
                  positions.map(pos => (
                    <option key={pos.key} value={pos.key} style={{ color: theme.colors.text.primary }}>
                      {pos.name}
                    </option>
                  ))
                )}
              </select>
            ) : (
              <div style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
              }}>
                {positions.find(p => p.key === player.position)?.name || player.position || '—'}
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
          gap: theme.spacing.md,
        }}>
          {isLoadingIDPs ? (
            <div style={{ color: theme.colors.text.secondary }}>Loading development targets...</div>
          ) : isEditing ? (
            <>
              {/* Editable IDPs */}
              {editedIDPs.map((idp, index) => (
                <div
                  key={idp.attribute_key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.md,
                    padding: theme.spacing.md,
                    backgroundColor: theme.colors.background.primary,
                    borderRadius: theme.borderRadius.md,
                    border: `1px solid ${theme.colors.border.primary}`,
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: theme.colors.gold.main,
                    color: theme.colors.background.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: theme.typography.fontWeight.bold,
                    fontSize: theme.typography.fontSize.sm,
                    flexShrink: 0,
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1, color: theme.colors.text.primary }}>
                    {getAttributeName(idp.attribute_key)}
                  </div>
                  <button
                    onClick={() => handleRemoveIDP(idp.attribute_key)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: theme.colors.status.error,
                      cursor: 'pointer',
                      fontSize: theme.typography.fontSize.lg,
                      padding: theme.spacing.xs,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Add IDP Dropdown */}
              {editedIDPs.length < 3 && (
                <div>
                  {(() => {
                    // Check if position is selected
                    if (!editedPlayer.position) {
                      return (
                        <div style={{
                          padding: theme.spacing.md,
                          backgroundColor: theme.colors.background.primary,
                          border: `2px dashed ${theme.colors.border.primary}`,
                          borderRadius: theme.borderRadius.md,
                          color: theme.colors.text.secondary,
                          fontSize: theme.typography.fontSize.sm,
                          textAlign: 'center',
                        }}>
                          Select a position above to add development targets
                        </div>
                      );
                    }

                    // Get attributes for the selected position (match by key)
                    const selectedPosition = positions.find(p => p.key === editedPlayer.position);
                    const inPossAttrKeys = selectedPosition?.inPossessionAttrs || [];
                    const outPossAttrKeys = selectedPosition?.outOfPossessionAttrs || [];

                    if (inPossAttrKeys.length === 0 && outPossAttrKeys.length === 0) {
                      return (
                        <div style={{
                          padding: theme.spacing.md,
                          backgroundColor: theme.colors.background.primary,
                          border: `2px dashed ${theme.colors.border.primary}`,
                          borderRadius: theme.borderRadius.md,
                          color: theme.colors.text.secondary,
                          fontSize: theme.typography.fontSize.sm,
                          textAlign: 'center',
                        }}>
                          No attributes defined for this position. Configure positional profiles in Club Methodology.
                        </div>
                      );
                    }

                    // Get available in-possession attributes (not already selected)
                    const availableInPossAttrs = inPossessionAttributes
                      .filter(attr => inPossAttrKeys.includes(attr.key))
                      .filter(attr => !editedIDPs.find(idp => idp.attribute_key === attr.key));

                    // Get available out-of-possession attributes (not already selected)
                    const availableOutPossAttrs = outOfPossessionAttributes
                      .filter(attr => outPossAttrKeys.includes(attr.key))
                      .filter(attr => !editedIDPs.find(idp => idp.attribute_key === attr.key));

                    const totalAvailable = availableInPossAttrs.length + availableOutPossAttrs.length;

                    return (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddIDP(e.target.value);
                          }
                        }}
                        disabled={totalAvailable === 0}
                        style={{
                          width: '100%',
                          fontSize: theme.typography.fontSize.base,
                          color: theme.colors.text.secondary,
                          padding: theme.spacing.md,
                          border: `2px solid ${theme.colors.border.primary}`,
                          borderRadius: theme.borderRadius.md,
                          outline: 'none',
                          backgroundColor: theme.colors.background.primary,
                          cursor: totalAvailable === 0 ? 'not-allowed' : 'pointer',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.7rem center',
                          backgroundSize: '1.2em',
                          paddingRight: '2.5rem',
                          opacity: totalAvailable === 0 ? 0.5 : 1,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = theme.colors.gold.main;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = theme.colors.border.primary;
                        }}
                      >
                        <option value="" disabled style={{ color: theme.colors.text.secondary }}>
                          {totalAvailable === 0
                            ? 'All position attributes selected'
                            : `+ Add Development Target (${3 - editedIDPs.length} remaining)`}
                        </option>
                        {availableInPossAttrs.length > 0 && (
                          <optgroup label="In Possession">
                            {availableInPossAttrs.map(attr => (
                              <option key={attr.key} value={attr.key} style={{ color: theme.colors.text.primary }}>
                                {attr.value?.name || attr.key}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {availableOutPossAttrs.length > 0 && (
                          <optgroup label="Out of Possession">
                            {availableOutPossAttrs.map(attr => (
                              <option key={attr.key} value={attr.key} style={{ color: theme.colors.text.primary }}>
                                {attr.value?.name || attr.key}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    );
                  })()}
                </div>
              )}

              {editedIDPs.length === 0 && (
                <div style={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.fontSize.sm,
                  fontStyle: 'italic',
                }}>
                  Select up to 3 development targets for this player
                </div>
              )}
            </>
          ) : (
            <>
              {/* Display IDPs (read-only) */}
              {playerIDPs.length > 0 ? (
                playerIDPs.map((idp, index) => (
                  <div
                    key={idp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.md,
                      padding: theme.spacing.md,
                      backgroundColor: theme.colors.background.primary,
                      borderRadius: theme.borderRadius.md,
                      border: `1px solid ${theme.colors.border.primary}`,
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: theme.colors.gold.main,
                      color: theme.colors.background.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: theme.typography.fontWeight.bold,
                      fontSize: theme.typography.fontSize.sm,
                      flexShrink: 0,
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1, color: theme.colors.text.primary }}>
                      {getAttributeName(idp.attribute_key)}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.fontSize.base,
                }}>
                  No development targets set
                </div>
              )}
            </>
          )}
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
