'use client';

import React, { useState, useRef, useCallback } from 'react';
import { FiUpload, FiX, FiTrash2, FiClock, FiEdit3, FiImage } from 'react-icons/fi';
import { CgSpinnerAlt } from 'react-icons/cg';
import { theme } from '@/styles/theme';
import { type SessionBlock, type AssignedBlock, uploadBlockImage } from '@/lib/sessionBlocks';
import dynamic from 'next/dynamic';
import type { TacticsState, TacticsElement } from '@/components/tactics/types';

// Dynamic import for TacticsBoard (uses canvas which needs client-side only)
const TacticsBoard = dynamic(
  () => import('@/components/tactics/TacticsBoard').then(mod => mod.TacticsBoard),
  { ssr: false, loading: () => <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.text.muted }}>Loading editor...</div> }
);

type DiagramMode = 'upload' | 'draw';

interface BlockEditorModalProps {
  block?: AssignedBlock | null; // If provided, we're editing; otherwise creating
  onSave: (data: { title: string; description: string | null; coaching_points: string | null; image_url: string | null; diagram_data: TacticsElement[] | null; duration: number | null }) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
}

export const BlockEditorModal: React.FC<BlockEditorModalProps> = ({
  block,
  onSave,
  onDelete,
  onCancel,
}) => {
  const isEditing = !!block;

  const [title, setTitle] = useState(block?.title || '');
  const [description, setDescription] = useState(block?.description || '');
  const [coachingPoints, setCoachingPoints] = useState(block?.coaching_points || '');
  const [imageUrl, setImageUrl] = useState(block?.image_url || '');
  const [duration, setDuration] = useState<number | null>(block?.duration ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Diagram mode: 'draw' for tactics board, 'upload' for image upload
  // Initialize based on existing block data
  const [diagramMode, setDiagramMode] = useState<DiagramMode>(
    block?.diagram_data && block.diagram_data.length > 0 ? 'draw' :
    block?.image_url ? 'upload' :
    'draw'
  );
  const [tacticsData, setTacticsData] = useState<TacticsState | null>(
    block?.diagram_data ? { elements: block.diagram_data, selectedTool: 'select', selectedElementId: null } : null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tacticsBoardRef = useRef<HTMLDivElement & { exportToImage?: () => Promise<Blob> }>(null);

  // Handle tactics board data change
  const handleTacticsDataChange = useCallback((data: TacticsState) => {
    setTacticsData(data);
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Use a temporary ID for new blocks
      const tempId = block?.id || `temp-${Date.now()}`;
      const { url, error } = await uploadBlockImage(file, tempId);

      if (error) {
        console.error('Upload error:', error);
        alert('Failed to upload image');
      } else if (url) {
        setImageUrl(url);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        coaching_points: coachingPoints.trim() || null,
        // Mutually exclusive: save based on active mode
        image_url: diagramMode === 'upload' ? (imageUrl || null) : null,
        diagram_data: diagramMode === 'draw' ? (tacticsData?.elements || []) : null,
        duration: duration,
      });
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save block');
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    if (!confirm('Are you sure you want to remove this block from the session?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete block');
      setIsDeleting(false);
    }
  };

  const isDisabled = isSaving || isDeleting || isUploading;

  return (
    <>
      {/* Hide number input spinners */}
      <style>{`
        .duration-input::-webkit-outer-spin-button,
        .duration-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: theme.colors.background.secondary,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.xl,
            width: '95%',
            maxWidth: '1400px',
            maxHeight: '90vh',
            overflow: 'auto',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: theme.spacing.lg,
            }}
          >
            <h2
              style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                margin: 0,
              }}
            >
              {isEditing ? 'Edit Training Block' : 'Create Training Block'}
            </h2>
            <button
              onClick={onCancel}
              disabled={isDisabled}
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.text.muted,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                padding: theme.spacing.xs,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FiX size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Title and Duration Row */}
            <div style={{ display: 'flex', gap: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
              {/* Title Field */}
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text.secondary,
                    marginBottom: theme.spacing.xs,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Passing Drill"
                  required
                  autoFocus
                  disabled={isDisabled}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    fontSize: theme.typography.fontSize.xl,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text.primary,
                    backgroundColor: theme.colors.background.primary,
                    border: `2px solid ${theme.colors.border.primary}`,
                    borderRadius: theme.borderRadius.md,
                    outline: 'none',
                    boxSizing: 'border-box',
                    opacity: isDisabled ? 0.6 : 1,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = theme.colors.gold.main;
                    e.target.style.boxShadow = theme.shadows.gold;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = theme.colors.border.primary;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Duration Field */}
              <div style={{ width: '160px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text.secondary,
                    marginBottom: theme.spacing.xs,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Duration
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    padding: theme.spacing.md,
                    backgroundColor: theme.colors.background.primary,
                    border: `2px solid ${theme.colors.border.primary}`,
                    borderRadius: theme.borderRadius.md,
                  }}
                >
                  <FiClock size={18} style={{ color: theme.colors.text.muted }} />
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={duration ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDuration(val === '' ? null : parseInt(val, 10));
                    }}
                    placeholder="--"
                    disabled={isDisabled}
                    className="duration-input"
                    style={{
                      width: '50px',
                      padding: 0,
                      fontSize: theme.typography.fontSize.lg,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.text.primary,
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      textAlign: 'center',
                      opacity: isDisabled ? 0.6 : 1,
                      MozAppearance: 'textfield',
                      WebkitAppearance: 'none',
                      appearance: 'textfield',
                    }}
                  />
                  <span style={{ color: theme.colors.text.muted, fontSize: theme.typography.fontSize.sm }}>
                    min
                  </span>
                </div>
              </div>
            </div>

            {/* Two-column layout: Pitch Diagram left, Description right */}
            <div
              style={{
                display: 'flex',
                gap: theme.spacing.xl,
                marginBottom: theme.spacing.xl,
              }}
            >
              {/* Left Column - Pitch Diagram (16:9 aspect ratio) */}
              <div style={{ flex: 1 }}>
                {/* Label with mode toggle */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.text.secondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Pitch Diagram
                  </label>

                  {/* Mode Toggle Tabs */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 0,
                      backgroundColor: theme.colors.background.primary,
                      borderRadius: theme.borderRadius.md,
                      padding: '2px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setDiagramMode('draw')}
                      disabled={isDisabled}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.xs,
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        backgroundColor: diagramMode === 'draw' ? theme.colors.gold.main : 'transparent',
                        color: diagramMode === 'draw' ? theme.colors.background.primary : theme.colors.text.secondary,
                        border: 'none',
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.xs,
                        fontWeight: theme.typography.fontWeight.semibold,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        transition: theme.transitions.fast,
                      }}
                    >
                      <FiEdit3 size={14} />
                      Draw
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiagramMode('upload')}
                      disabled={isDisabled}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.xs,
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        backgroundColor: diagramMode === 'upload' ? theme.colors.gold.main : 'transparent',
                        color: diagramMode === 'upload' ? theme.colors.background.primary : theme.colors.text.secondary,
                        border: 'none',
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.xs,
                        fontWeight: theme.typography.fontWeight.semibold,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        transition: theme.transitions.fast,
                      }}
                    >
                      <FiImage size={14} />
                      Upload
                    </button>
                  </div>
                </div>

                {/* Shared container for both modes - uses CSS Grid so they occupy same space */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gridTemplateRows: '1fr' }}>
                  {/* Draw Mode (Tactics Board) - always rendered to set container size */}
                  <div
                    ref={tacticsBoardRef}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    style={{
                      gridArea: '1 / 1',
                      visibility: diagramMode === 'draw' ? 'visible' : 'hidden',
                      border: `2px solid ${theme.colors.border.primary}`,
                      borderRadius: theme.borderRadius.md,
                      overflow: 'hidden',
                    }}
                  >
                    <TacticsBoard
                      initialData={tacticsData || (block?.diagram_data ? { elements: block.diagram_data, selectedTool: 'select', selectedElementId: null } : undefined)}
                      onDataChange={handleTacticsDataChange}
                      readOnly={isDisabled}
                    />
                  </div>

                  {/* Upload Mode - positioned in same grid cell */}
                  {diagramMode === 'upload' && (
                    <div
                      style={{
                        gridArea: '1 / 1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.colors.background.primary,
                        border: `2px dashed ${theme.colors.border.primary}`,
                        borderRadius: theme.borderRadius.md,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        transition: theme.transitions.fast,
                      }}
                      onClick={() => !isDisabled && fileInputRef.current?.click()}
                      onMouseEnter={(e) => {
                        if (!isDisabled) {
                          e.currentTarget.style.borderColor = theme.colors.gold.main;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDisabled) {
                          e.currentTarget.style.borderColor = theme.colors.border.primary;
                        }
                      }}
                    >
                      {imageUrl ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                          <img
                            src={imageUrl}
                            alt="Block image"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: theme.borderRadius.md,
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                            disabled={isDisabled}
                            style={{
                              position: 'absolute',
                              top: theme.spacing.sm,
                              right: theme.spacing.sm,
                              padding: theme.spacing.sm,
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                              border: 'none',
                              borderRadius: theme.borderRadius.md,
                              color: theme.colors.text.primary,
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <FiX size={18} />
                          </button>
                        </div>
                      ) : isUploading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, color: theme.colors.text.muted }}>
                          <CgSpinnerAlt style={{ animation: 'spin 1s linear infinite', fontSize: '24px' }} />
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        <>
                          <FiUpload size={48} style={{ color: theme.colors.text.muted, marginBottom: theme.spacing.md }} />
                          <p style={{ color: theme.colors.text.muted, margin: 0, fontSize: theme.typography.fontSize.base }}>
                            Click to upload pitch diagram
                          </p>
                          <p style={{ color: theme.colors.text.disabled, margin: 0, marginTop: theme.spacing.sm, fontSize: theme.typography.fontSize.sm }}>
                            PNG, JPG up to 5MB
                          </p>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              {/* Right Column - Description and Coaching Points */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                {/* Description Field */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.text.secondary,
                      marginBottom: theme.spacing.xs,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Description
                  </label>
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      flex: 1,
                      minHeight: '120px',
                      border: `2px solid ${theme.colors.border.primary}`,
                      borderRadius: theme.borderRadius.md,
                      overflow: 'hidden',
                    }}
                  >
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={"Add details about this training block...\n\n• Setup and equipment needed\n• Progressions and variations\n• Duration and reps"}
                      disabled={isDisabled}
                      style={{
                        width: '100%',
                        height: '100%',
                        minHeight: '120px',
                        padding: theme.spacing.md,
                        fontSize: theme.typography.fontSize.base,
                        lineHeight: 1.6,
                        color: theme.colors.text.primary,
                        backgroundColor: theme.colors.background.primary,
                        border: 'none',
                        borderRadius: 0,
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'none',
                        fontFamily: 'inherit',
                        opacity: isDisabled ? 0.6 : 1,
                      }}
                      onFocus={(e) => {
                        const container = e.target.parentElement;
                        if (container) {
                          container.style.borderColor = theme.colors.gold.main;
                          container.style.boxShadow = theme.shadows.gold;
                        }
                      }}
                      onBlur={(e) => {
                        const container = e.target.parentElement;
                        if (container) {
                          container.style.borderColor = theme.colors.border.primary;
                          container.style.boxShadow = 'none';
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Coaching Points Field */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.text.secondary,
                      marginBottom: theme.spacing.xs,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Coaching Points
                  </label>
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      flex: 1,
                      minHeight: '120px',
                      border: `2px solid ${theme.colors.border.primary}`,
                      borderRadius: theme.borderRadius.md,
                      overflow: 'hidden',
                    }}
                  >
                    <textarea
                      value={coachingPoints}
                      onChange={(e) => setCoachingPoints(e.target.value)}
                      placeholder={"Key coaching points to focus on...\n\n• What to watch for\n• Common mistakes to avoid\n• Success criteria"}
                      disabled={isDisabled}
                      style={{
                        width: '100%',
                        height: '100%',
                        minHeight: '120px',
                        padding: theme.spacing.md,
                        fontSize: theme.typography.fontSize.base,
                        lineHeight: 1.6,
                        color: theme.colors.text.primary,
                        backgroundColor: theme.colors.background.primary,
                        border: 'none',
                        borderRadius: 0,
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'none',
                        fontFamily: 'inherit',
                        opacity: isDisabled ? 0.6 : 1,
                      }}
                      onFocus={(e) => {
                        const container = e.target.parentElement;
                        if (container) {
                          container.style.borderColor = theme.colors.gold.main;
                          container.style.boxShadow = theme.shadows.gold;
                        }
                      }}
                      onBlur={(e) => {
                        const container = e.target.parentElement;
                        if (container) {
                          container.style.borderColor = theme.colors.border.primary;
                          container.style.boxShadow = 'none';
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: theme.spacing.sm,
                justifyContent: 'space-between',
              }}
            >
              {/* Delete Button (only for editing) */}
              <div>
                {isEditing && onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDisabled}
                    style={{
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      backgroundColor: 'transparent',
                      color: theme.colors.status.error,
                      border: `1px solid ${theme.colors.status.error}`,
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.semibold,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.6 : 1,
                      transition: theme.transitions.fast,
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.xs,
                    }}
                    onMouseEnter={(e) => {
                      if (!isDisabled) {
                        e.currentTarget.style.backgroundColor = theme.colors.status.error;
                        e.currentTarget.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isDisabled) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.colors.status.error;
                      }
                    }}
                  >
                    {isDeleting ? (
                      <>
                        <CgSpinnerAlt
                          style={{
                            animation: 'spin 1s linear infinite',
                            fontSize: '14px',
                          }}
                        />
                        <span>Removing...</span>
                      </>
                    ) : (
                      <>
                        <FiTrash2 size={16} />
                        <span>Remove</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Cancel and Save Buttons */}
              <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isDisabled}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                    backgroundColor: theme.colors.background.primary,
                    color: theme.colors.text.primary,
                    border: 'none',
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.semibold,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isDisabled ? 0.6 : 1,
                    transition: theme.transitions.fast,
                  }}
                  onMouseEnter={(e) => {
                    if (!isDisabled) {
                      e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDisabled) {
                      e.currentTarget.style.backgroundColor = theme.colors.background.primary;
                    }
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isDisabled}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                    backgroundColor: theme.colors.gold.main,
                    color: theme.colors.background.primary,
                    border: 'none',
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.semibold,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isDisabled ? 0.6 : 1,
                    transition: theme.transitions.fast,
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.xs,
                  }}
                  onMouseEnter={(e) => {
                    if (!isDisabled) {
                      e.currentTarget.style.backgroundColor = theme.colors.gold.light;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDisabled) {
                      e.currentTarget.style.backgroundColor = theme.colors.gold.main;
                    }
                  }}
                >
                  {isSaving ? (
                    <>
                      <CgSpinnerAlt
                        style={{
                          animation: 'spin 1s linear infinite',
                          fontSize: '14px',
                        }}
                      />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{isEditing ? 'Save Changes' : 'Create Block'}</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
