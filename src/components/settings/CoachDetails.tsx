import React, { useState, useEffect } from 'react';
import { theme } from '@/styles/theme';
import { ImageUploader } from '@/components/onboarding/ImageUploader';
import { uploadProfilePicture, getProfilePictureUrl } from '@/lib/storage';
import type { Coach } from '@/types/database';

const POSITION_OPTIONS = [
  'Head Coach',
  'Assistant Coach',
  'Director of Coaching',
  'Technical Director',
  'Goalkeeper Coach',
  'Fitness Coach',
  'Academy Coach',
  'Youth Coach',
  'Other',
];

interface CoachDetailsProps {
  coach: Coach | null;
  onUpdate: (coachId: string, updates: {
    name?: string;
    position?: string;
    profile_picture?: string;
  }) => Promise<void>;
}

export const CoachDetails: React.FC<CoachDetailsProps> = ({ coach, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCoach, setEditedCoach] = useState<{
    name: string;
    position: string;
    profile_picture: string | null;
  }>({
    name: '',
    position: '',
    profile_picture: null,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Update editedCoach when coach prop changes
  useEffect(() => {
    if (coach) {
      setEditedCoach({
        name: coach.name || '',
        position: coach.position || '',
        profile_picture: coach.profile_picture || null,
      });
    }
    setIsEditing(false);
  }, [coach]);

  const handleImageSelect = async (file: File) => {
    if (!coach) return;

    setUploadError(null);
    setUploading(true);

    const result = await uploadProfilePicture(file, coach.id);
    setUploading(false);

    if (result.error) {
      setUploadError(result.error);
    } else if (result.data) {
      setEditedCoach({ ...editedCoach, profile_picture: result.data });
    }
  };

  const handleImageRemove = () => {
    setEditedCoach({ ...editedCoach, profile_picture: null });
    setUploadError(null);
  };

  const handleSave = async () => {
    if (!coach) return;

    setIsSaving(true);
    try {
      await onUpdate(coach.id, {
        name: editedCoach.name,
        position: editedCoach.position,
        profile_picture: editedCoach.profile_picture || undefined,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving coach details:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (coach) {
      setEditedCoach({
        name: coach.name || '',
        position: coach.position || '',
        profile_picture: coach.profile_picture || null,
      });
    }
    setIsEditing(false);
    setUploadError(null);
  };

  if (!coach) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
      }}>
        <div style={{
          textAlign: 'center',
          color: theme.colors.text.secondary,
          fontSize: theme.typography.fontSize.lg,
        }}>
          Loading coach details...
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
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.xl,
          paddingBottom: theme.spacing.lg,
          borderBottom: `1px solid ${theme.colors.border.primary}`,
        }}>
          <h1 style={{
            fontSize: theme.typography.fontSize['3xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            margin: 0,
          }}>
            Coach Profile
          </h1>

          {/* Edit/Save/Cancel Buttons */}
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            {isEditing && (
              <button
                onClick={handleCancel}
                disabled={isSaving}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  backgroundColor: theme.colors.background.primary,
                  color: theme.colors.text.primary,
                  border: `2px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  transition: theme.transitions.fast,
                  opacity: isSaving ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.background.primary;
                }}
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={isSaving || uploading}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                backgroundColor: isEditing ? theme.colors.gold.main : theme.colors.background.primary,
                color: isEditing ? theme.colors.background.primary : theme.colors.text.primary,
                border: isEditing ? 'none' : `2px solid ${theme.colors.border.primary}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                cursor: (isSaving || uploading) ? 'not-allowed' : 'pointer',
                transition: theme.transitions.fast,
                opacity: (isSaving || uploading) ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSaving && !uploading) {
                  if (isEditing) {
                    e.currentTarget.style.backgroundColor = theme.colors.gold.light;
                  } else {
                    e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
                  }
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving && !uploading) {
                  if (isEditing) {
                    e.currentTarget.style.backgroundColor = theme.colors.gold.main;
                  } else {
                    e.currentTarget.style.backgroundColor = theme.colors.background.primary;
                  }
                }
              }}
            >
              {isSaving ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
            </button>
          </div>
        </div>

        {/* Profile Picture */}
        <div style={{ marginBottom: theme.spacing.xl }}>
          <label style={{
            display: 'block',
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.md,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textAlign: 'center',
          }}>
            Club Badge
          </label>
          {isEditing ? (
            <>
              <ImageUploader
                currentImage={editedCoach.profile_picture ? getProfilePictureUrl(editedCoach.profile_picture) : null}
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
                uploading={uploading}
              />
              {uploadError && (
                <div style={{
                  marginTop: theme.spacing.sm,
                  padding: theme.spacing.sm,
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  border: `1px solid ${theme.colors.status.error}`,
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.status.error,
                  fontSize: theme.typography.fontSize.sm,
                  textAlign: 'center',
                }}>
                  {uploadError}
                </div>
              )}
            </>
          ) : (
            <div style={{
              width: '200px',
              height: '200px',
              margin: '0 auto',
              borderRadius: '50%',
              overflow: 'hidden',
              backgroundColor: theme.colors.background.tertiary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: theme.typography.fontSize['4xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.muted,
            }}>
              {coach.profile_picture ? (
                <img
                  src={getProfilePictureUrl(coach.profile_picture)}
                  alt={coach.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                coach.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'C'
              )}
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.lg,
        }}>
          {/* Name Field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedCoach.name}
                onChange={(e) => setEditedCoach({ ...editedCoach, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.text.primary,
                  backgroundColor: theme.colors.background.primary,
                  border: `2px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  outline: 'none',
                  boxSizing: 'border-box',
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
                paddingTop: theme.spacing.sm,
              }}>
                {coach.name}
              </div>
            )}
          </div>

          {/* Email Field (Read-only) */}
          <div>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Email
            </label>
            <div style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
              paddingTop: theme.spacing.sm,
              fontStyle: 'italic',
            }}>
              {coach.email}
            </div>
          </div>

          {/* Position Field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Position
            </label>
            {isEditing ? (
              <select
                value={editedCoach.position}
                onChange={(e) => setEditedCoach({ ...editedCoach, position: e.target.value })}
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  fontSize: theme.typography.fontSize.base,
                  color: editedCoach.position ? theme.colors.text.primary : theme.colors.text.secondary,
                  backgroundColor: theme.colors.background.primary,
                  border: `2px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  outline: 'none',
                  boxSizing: 'border-box',
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
                <option value="" disabled>
                  Select your position
                </option>
                {POSITION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <div style={{
                fontSize: theme.typography.fontSize.base,
                color: coach.position ? theme.colors.text.primary : theme.colors.text.secondary,
                paddingTop: theme.spacing.sm,
                fontStyle: !coach.position ? 'italic' : 'normal',
              }}>
                {coach.position || 'Not set'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
