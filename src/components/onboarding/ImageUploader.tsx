'use client'

import React, { useState, useRef } from 'react';
import { FaUpload } from 'react-icons/fa';
import { theme } from '@/styles/theme';

interface ImageUploaderProps {
  currentImage: string | null;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  uploading?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImage,
  onImageSelect,
  onImageRemove,
  uploading = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Pass file to parent
    onImageSelect(file);
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ width: '100%' }}>
      {!previewUrl ? (
        // Upload Area
        <div
          onClick={handleClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            width: '200px',
            height: '200px',
            margin: '0 auto',
            border: `3px dashed ${dragActive ? theme.colors.gold.main : theme.colors.border.primary}`,
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            backgroundColor: dragActive
              ? 'rgba(239, 191, 4, 0.1)'
              : theme.colors.background.tertiary,
            transition: theme.transitions.fast,
            opacity: uploading ? 0.6 : 1,
            padding: theme.spacing.lg,
          }}
        >
          <FaUpload
            size={40}
            style={{
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.sm,
            }}
          />
          <div style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.xs,
            lineHeight: '1.3',
          }}>
            {uploading ? 'Uploading...' : 'Click to upload'}
          </div>
          <div style={{
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.text.secondary,
            lineHeight: '1.3',
          }}>
            PNG, JPG, or WebP
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        // Image Preview
        <div style={{ position: 'relative' }}>
          <div
            onClick={!uploading ? handleClick : undefined}
            style={{
              width: '200px',
              height: '200px',
              margin: '0 auto',
              borderRadius: '50%',
              overflow: 'hidden',
              border: `3px solid ${theme.colors.gold.main}`,
              position: 'relative',
              cursor: uploading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                const overlay = e.currentTarget.querySelector('[data-hover-overlay]') as HTMLElement;
                if (overlay) overlay.style.opacity = '1';
              }
            }}
            onMouseLeave={(e) => {
              const overlay = e.currentTarget.querySelector('[data-hover-overlay]') as HTMLElement;
              if (overlay) overlay.style.opacity = '0';
            }}
          >
            <img
              src={previewUrl}
              alt="Profile preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {/* Hover Overlay */}
            <div
              data-hover-overlay
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.colors.text.primary,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                opacity: 0,
                transition: 'opacity 0.2s ease',
                pointerEvents: 'none',
              }}
            >
              <FaUpload size={24} style={{ marginBottom: theme.spacing.xs }} />
              Change Picture
            </div>
            {uploading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.colors.text.primary,
                fontSize: theme.typography.fontSize.sm,
              }}>
                Uploading...
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </div>
      )}
    </div>
  );
};
