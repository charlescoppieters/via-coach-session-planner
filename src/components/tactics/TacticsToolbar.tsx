'use client';

import React, { useState } from 'react';
import { FiMousePointer, FiUser, FiTriangle, FiArrowRight, FiMinus, FiTrash2, FiTrash, FiX, FiRotateCw } from 'react-icons/fi';
import { theme } from '@/styles/theme';
import { type ToolType, type PitchView } from './types';

// Standard color palette
const COLOR_PALETTE = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#22C55E', // Green
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#A855F7', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#FFFFFF', // White
  '#000000', // Black
];

interface TacticsToolbarProps {
  selectedTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  isDashed: boolean;
  onDashedChange: (dashed: boolean) => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  hasSelection: boolean;
  hasMinigoalSelected: boolean;
  onRotateSelected: () => void;
  pitchView: PitchView;
  onPitchViewChange: (view: PitchView) => void;
}

// Custom minigoal icon (U-shape rotated 90° to match default placement)
const MinigoalIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3 L11 3 L11 11 L3 11" />
  </svg>
);

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, label, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 32,
      height: 32,
      borderRadius: theme.borderRadius.sm,
      border: 'none',
      backgroundColor: isActive ? theme.colors.gold.main : theme.colors.background.tertiary,
      color: isActive ? theme.colors.background.primary : theme.colors.text.primary,
      cursor: 'pointer',
      transition: theme.transitions.fast,
    }}
  >
    {icon}
  </button>
);

const PITCH_VIEW_OPTIONS: { value: PitchView; label: string }[] = [
  { value: 'full', label: 'Full Pitch' },
  { value: 'attacking', label: 'Attacking Third' },
  { value: 'defending', label: 'Defending Third' },
  { value: 'blank', label: 'Blank' },
];

// Color Picker Modal Component
const ColorPickerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
}> = ({ isOpen, onClose, selectedColor, onColorChange }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.lg,
          minWidth: '240px',
          boxShadow: theme.shadows.xl,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
          <span style={{ color: theme.colors.text.primary, fontWeight: theme.typography.fontWeight.semibold }}>
            Pick a Color
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: theme.colors.text.muted,
              cursor: 'pointer',
              padding: theme.spacing.xs,
            }}
          >
            <FiX size={18} />
          </button>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: theme.spacing.sm,
          }}
        >
          {COLOR_PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                onColorChange(color);
                onClose();
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: selectedColor === color
                  ? `3px solid ${theme.colors.gold.main}`
                  : `2px solid ${theme.colors.border.primary}`,
                backgroundColor: color,
                cursor: 'pointer',
                transition: theme.transitions.fast,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const TacticsToolbar: React.FC<TacticsToolbarProps> = ({
  selectedTool,
  onToolChange,
  selectedColor,
  onColorChange,
  isDashed,
  onDashedChange,
  onDeleteSelected,
  onClearAll,
  hasSelection,
  hasMinigoalSelected,
  onRotateSelected,
  pitchView,
  onPitchViewChange,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Show color picker for tools that use color
  const showColorOption = selectedTool === 'player' || selectedTool === 'cone' || selectedTool === 'minigoal' || selectedTool === 'arrow' || selectedTool === 'line';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.sm,
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.md,
        flexWrap: 'wrap',
      }}
    >
      {/* Pitch view dropdown */}
      <select
        value={pitchView}
        onChange={(e) => onPitchViewChange(e.target.value as PitchView)}
        style={{
          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
          paddingRight: '28px',
          backgroundColor: theme.colors.background.tertiary,
          color: theme.colors.text.primary,
          border: `1px solid ${theme.colors.border.primary}`,
          borderRadius: theme.borderRadius.sm,
          fontSize: theme.typography.fontSize.sm,
          cursor: 'pointer',
          outline: 'none',
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23717171' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 8px center',
        }}
      >
        {PITCH_VIEW_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Divider */}
      <div style={{ width: 1, height: 24, backgroundColor: theme.colors.border.primary }} />

      {/* Main tools */}
      <div style={{ display: 'flex', gap: 4 }}>
        <ToolButton
          icon={<FiMousePointer size={14} />}
          label="Select"
          isActive={selectedTool === 'select'}
          onClick={() => onToolChange('select')}
        />
        <ToolButton
          icon={<FiUser size={14} />}
          label="Add Player"
          isActive={selectedTool === 'player'}
          onClick={() => onToolChange('player')}
        />
        <ToolButton
          icon={<FiTriangle size={14} />}
          label="Add Cone"
          isActive={selectedTool === 'cone'}
          onClick={() => onToolChange('cone')}
        />
        <ToolButton
          icon={<MinigoalIcon size={14} />}
          label="Add Minigoal"
          isActive={selectedTool === 'minigoal'}
          onClick={() => onToolChange('minigoal')}
        />
        <ToolButton
          icon={<FiArrowRight size={14} />}
          label="Draw Arrow"
          isActive={selectedTool === 'arrow'}
          onClick={() => onToolChange('arrow')}
        />
        <ToolButton
          icon={<FiMinus size={14} />}
          label="Draw Line"
          isActive={selectedTool === 'line'}
          onClick={() => onToolChange('line')}
        />
      </div>

      {/* Color picker button (for player, cone, minigoal, arrow, line tools) */}
      {showColorOption && (
        <>
          <div style={{ width: 1, height: 24, backgroundColor: theme.colors.border.primary }} />
          <button
            type="button"
            onClick={() => setShowColorPicker(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              padding: 0,
              backgroundColor: selectedColor,
              border: `2px solid ${theme.colors.border.primary}`,
              borderRadius: '50%',
              cursor: 'pointer',
            }}
            title="Select Color"
          />
        </>
      )}

      {/* Dashed toggle (for arrow/line tools) */}
      {(selectedTool === 'arrow' || selectedTool === 'line') && (
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
            color: theme.colors.text.secondary,
            fontSize: theme.typography.fontSize.sm,
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={isDashed}
            onChange={(e) => onDashedChange(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Dashed
        </label>
      )}

      {/* Rotate button (for minigoals) */}
      {hasMinigoalSelected && (
        <>
          <div style={{ width: 1, height: 24, backgroundColor: theme.colors.border.primary }} />
          <button
            type="button"
            onClick={onRotateSelected}
            title="Rotate 90°"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: `0 ${theme.spacing.sm}`,
              height: 32,
              borderRadius: theme.borderRadius.sm,
              border: `1px solid ${theme.colors.border.primary}`,
              backgroundColor: theme.colors.background.tertiary,
              color: theme.colors.text.primary,
              cursor: 'pointer',
              transition: theme.transitions.fast,
              fontSize: theme.typography.fontSize.xs,
            }}
          >
            <FiRotateCw size={12} />
            Rotate
          </button>
        </>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Delete actions */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={!hasSelection}
          title="Delete Selected"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: theme.borderRadius.sm,
            border: 'none',
            backgroundColor: hasSelection ? theme.colors.status.error : theme.colors.background.tertiary,
            color: hasSelection ? '#FFFFFF' : theme.colors.text.disabled,
            cursor: hasSelection ? 'pointer' : 'not-allowed',
            transition: theme.transitions.fast,
            opacity: hasSelection ? 1 : 0.5,
          }}
        >
          <FiTrash2 size={14} />
        </button>
        <button
          type="button"
          onClick={onClearAll}
          title="Clear All"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: `0 ${theme.spacing.sm}`,
            height: 32,
            borderRadius: theme.borderRadius.sm,
            border: `1px solid ${theme.colors.border.primary}`,
            backgroundColor: 'transparent',
            color: theme.colors.text.secondary,
            cursor: 'pointer',
            transition: theme.transitions.fast,
            fontSize: theme.typography.fontSize.xs,
          }}
        >
          <FiTrash size={12} />
          Clear
        </button>
      </div>

      {/* Color Picker Modal */}
      <ColorPickerModal
        isOpen={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        selectedColor={selectedColor}
        onColorChange={onColorChange}
      />
    </div>
  );
};
