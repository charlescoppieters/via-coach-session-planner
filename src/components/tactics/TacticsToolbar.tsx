'use client';

import React from 'react';
import { FiMousePointer, FiUser, FiTriangle, FiArrowRight, FiMinus, FiTrash2, FiTrash } from 'react-icons/fi';
import { theme } from '@/styles/theme';
import { type ToolType, TEAM_COLORS, CONE_COLORS } from './types';

interface TacticsToolbarProps {
  selectedTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  selectedTeam: 'home' | 'away';
  onTeamChange: (team: 'home' | 'away') => void;
  selectedConeColor: string;
  onConeColorChange: (color: string) => void;
  isDashed: boolean;
  onDashedChange: (dashed: boolean) => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  hasSelection: boolean;
}

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
      width: 40,
      height: 40,
      borderRadius: theme.borderRadius.md,
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

interface ColorSwatchProps {
  color: string;
  isActive: boolean;
  onClick: () => void;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ color, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      width: 24,
      height: 24,
      borderRadius: theme.borderRadius.sm,
      border: isActive ? `2px solid ${theme.colors.gold.main}` : '2px solid transparent',
      backgroundColor: color,
      cursor: 'pointer',
      transition: theme.transitions.fast,
    }}
  />
);

export const TacticsToolbar: React.FC<TacticsToolbarProps> = ({
  selectedTool,
  onToolChange,
  selectedTeam,
  onTeamChange,
  selectedConeColor,
  onConeColorChange,
  isDashed,
  onDashedChange,
  onDeleteSelected,
  onClearAll,
  hasSelection,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.md,
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.md,
        flexWrap: 'wrap',
      }}
    >
      {/* Main tools */}
      <div style={{ display: 'flex', gap: theme.spacing.xs }}>
        <ToolButton
          icon={<FiMousePointer size={18} />}
          label="Select"
          isActive={selectedTool === 'select'}
          onClick={() => onToolChange('select')}
        />
        <ToolButton
          icon={<FiUser size={18} />}
          label="Add Player"
          isActive={selectedTool === 'player'}
          onClick={() => onToolChange('player')}
        />
        <ToolButton
          icon={<FiTriangle size={18} />}
          label="Add Cone"
          isActive={selectedTool === 'cone'}
          onClick={() => onToolChange('cone')}
        />
        <ToolButton
          icon={<FiArrowRight size={18} />}
          label="Draw Arrow"
          isActive={selectedTool === 'arrow'}
          onClick={() => onToolChange('arrow')}
        />
        <ToolButton
          icon={<FiMinus size={18} />}
          label="Draw Line"
          isActive={selectedTool === 'line'}
          onClick={() => onToolChange('line')}
        />
      </div>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 32,
          backgroundColor: theme.colors.border.primary,
        }}
      />

      {/* Team selector (for player tool) */}
      {selectedTool === 'player' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
          <span style={{ color: theme.colors.text.secondary, fontSize: theme.typography.fontSize.sm }}>
            Team:
          </span>
          <ColorSwatch
            color={TEAM_COLORS.home}
            isActive={selectedTeam === 'home'}
            onClick={() => onTeamChange('home')}
          />
          <ColorSwatch
            color={TEAM_COLORS.away}
            isActive={selectedTeam === 'away'}
            onClick={() => onTeamChange('away')}
          />
        </div>
      )}

      {/* Cone color selector */}
      {selectedTool === 'cone' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
          <span style={{ color: theme.colors.text.secondary, fontSize: theme.typography.fontSize.sm }}>
            Color:
          </span>
          {Object.entries(CONE_COLORS).map(([name, color]) => (
            <ColorSwatch
              key={name}
              color={color}
              isActive={selectedConeColor === color}
              onClick={() => onConeColorChange(color)}
            />
          ))}
        </div>
      )}

      {/* Dashed toggle (for arrow/line tools) */}
      {(selectedTool === 'arrow' || selectedTool === 'line') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
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
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Delete actions */}
      <div style={{ display: 'flex', gap: theme.spacing.xs }}>
        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={!hasSelection}
          title="Delete Selected"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: theme.borderRadius.md,
            border: 'none',
            backgroundColor: hasSelection ? theme.colors.status.error : theme.colors.background.tertiary,
            color: hasSelection ? '#FFFFFF' : theme.colors.text.disabled,
            cursor: hasSelection ? 'pointer' : 'not-allowed',
            transition: theme.transitions.fast,
            opacity: hasSelection ? 1 : 0.5,
          }}
        >
          <FiTrash2 size={18} />
        </button>
        <button
          type="button"
          onClick={onClearAll}
          title="Clear All"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.xs,
            padding: `0 ${theme.spacing.sm}`,
            height: 40,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.border.primary}`,
            backgroundColor: 'transparent',
            color: theme.colors.text.secondary,
            cursor: 'pointer',
            transition: theme.transitions.fast,
            fontSize: theme.typography.fontSize.sm,
          }}
        >
          <FiTrash size={16} />
          Clear
        </button>
      </div>
    </div>
  );
};
