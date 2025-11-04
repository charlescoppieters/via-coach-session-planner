'use client'

import React, { useState } from 'react';
import { theme } from '@/styles/theme';
import { ImageUploader } from './ImageUploader';
import { uploadProfilePicture } from '@/lib/storage';

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

interface ProfileSetupStepProps {
  initialName: string;
  coachId: string;
  onNext: (data: { name: string; position: string; profilePicturePath: string | null }) => void;
  onBack: () => void;
}

export const ProfileSetupStep: React.FC<ProfileSetupStepProps> = ({
  initialName,
  coachId,
  onNext,
  onBack,
}) => {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
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

    if (!position) {
      alert('Please select your position');
      return;
    }

    onNext({
      name: name.trim(),
      position,
      profilePicturePath,
    });
  };

  const isValid = name.trim() && position && !uploading;

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
        Set Up Your Profile
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
          Club Badge (Optional)
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
      <div style={{ marginBottom: theme.spacing.lg }}>
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

      {/* Position Dropdown */}
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
          Position *
        </label>
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          style={{
            width: '100%',
            padding: theme.spacing.md,
            fontSize: theme.typography.fontSize.base,
            color: position ? theme.colors.text.primary : theme.colors.text.secondary,
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
          Next
        </button>
      </div>
    </div>
  );
};
