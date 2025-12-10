'use client'

import React, { useState } from 'react';
import { theme } from '@/styles/theme';
import { ImageUploader } from './ImageUploader';
import { uploadClubLogo } from '@/lib/storage';

interface ClubSetupStepProps {
  coachId: string;
  onNext: (data: { name: string; logoUrl: string }) => void;
  onBack: () => void;
}

export const ClubSetupStep: React.FC<ClubSetupStepProps> = ({
  coachId,
  onNext,
  onBack,
}) => {
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageSelect = async (file: File) => {
    setUploadError(null);
    setUploading(true);

    // Use coach ID as identifier since club doesn't exist yet
    const result = await uploadClubLogo(file, coachId);
    setUploading(false);

    if (result.error) {
      setUploadError(result.error);
    } else if (result.data) {
      setLogoUrl(result.data);
    }
  };

  const handleImageRemove = () => {
    setLogoUrl(null);
    setUploadError(null);
  };

  const handleNext = () => {
    if (!name.trim()) {
      alert('Please enter your club name');
      return;
    }

    if (!logoUrl) {
      alert('Please upload your club badge');
      return;
    }

    onNext({
      name: name.trim(),
      logoUrl,
    });
  };

  const isValid = name.trim() && logoUrl && !uploading;

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
        Create Your Club
      </h2>
      <p style={{
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xl,
        textAlign: 'center',
        lineHeight: '1.6',
      }}>
        Set up your club to get started
      </p>

      {/* Club Badge */}
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
          Club Badge *
        </label>
        <ImageUploader
          currentImage={logoUrl}
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

      {/* Club Name Input */}
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
          Club Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your club name"
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
          Next
        </button>
      </div>
    </div>
  );
};
