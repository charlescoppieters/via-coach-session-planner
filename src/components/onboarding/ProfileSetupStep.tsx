'use client'

import React, { useState } from 'react';
import { theme } from '@/styles/theme';
import { ImageUploader } from './ImageUploader';
import { uploadProfilePicture } from '@/lib/storage';

interface ProfileSetupStepProps {
  initialName: string;
  coachId: string;
  onNext: (data: { name: string; profilePicturePath: string | null }) => void;
  onBack: () => void;
  nextButtonText?: string;
}

export const ProfileSetupStep: React.FC<ProfileSetupStepProps> = ({
  initialName,
  coachId,
  onNext,
  onBack,
  nextButtonText = 'Next',
}) => {
  const [name, setName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profilePicturePath, setProfilePicturePath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageSelect = async (file: File) => {
    setSelectedFile(file);
    setUploadError(null);

    // Upload immediately when file is selected
    setUploading(true);
    const result = await uploadProfilePicture(file, coachId);
    setUploading(false);

    if (result.error) {
      setUploadError(result.error);
      setSelectedFile(null);
    } else if (result.data) {
      setProfilePicturePath(result.data);
    }
  };

  const handleImageRemove = () => {
    setSelectedFile(null);
    setProfilePicturePath(null);
    setUploadError(null);
  };

  const handleNext = () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }

    onNext({
      name: name.trim(),
      profilePicturePath,
    });
  };

  const isValid = name.trim() && !uploading;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '600px',
      margin: '0 auto',
      padding: theme.spacing.xl,
    }}>
      {/* Header */}
      <h2 style={{
        fontSize: theme.typography.fontSize['3xl'],
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
      }}>
        Set Up Your Coach Profile
      </h2>
      <p style={{
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xl,
        textAlign: 'center',
        lineHeight: '1.6',
      }}>
        Tell us a bit about yourself
      </p>

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
          Profile Picture (Optional)
        </label>
        <ImageUploader
          currentImage={profilePicturePath}
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
      </div>

      {/* Name Input */}
      <div style={{ marginBottom: theme.spacing.xl }}>
        <label style={{
          display: 'block',
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.xs,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Full Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
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
      </div>

      {/* Navigation Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: theme.spacing.md,
        marginTop: theme.spacing.xl,
      }}>
        <button
          onClick={onBack}
          style={{
            padding: `${theme.spacing.md} ${theme.spacing.xl}`,
            backgroundColor: theme.colors.background.primary,
            color: theme.colors.text.primary,
            border: `2px solid ${theme.colors.border.primary}`,
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
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={!isValid}
          style={{
            padding: `${theme.spacing.md} ${theme.spacing.xl}`,
            backgroundColor: isValid ? theme.colors.gold.main : theme.colors.text.disabled,
            color: theme.colors.background.primary,
            border: 'none',
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            cursor: isValid ? 'pointer' : 'not-allowed',
            transition: theme.transitions.fast,
            opacity: isValid ? 1 : 0.6,
          }}
          onMouseEnter={(e) => {
            if (isValid) {
              e.currentTarget.style.backgroundColor = theme.colors.gold.light;
            }
          }}
          onMouseLeave={(e) => {
            if (isValid) {
              e.currentTarget.style.backgroundColor = theme.colors.gold.main;
            }
          }}
        >
          {nextButtonText}
        </button>
      </div>
    </div>
  );
};
