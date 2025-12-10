'use client';

import React from 'react';
import { Rect, Group, Text } from 'react-konva';
import { theme } from '@/styles/theme';
import type { ZoneElementProps } from './zoneTypes';

export const ZoneElement: React.FC<ZoneElementProps> = ({
  zone,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onDragEnd,
  draggable = false,
  scale,
  pitchWidth,
  pitchHeight,
}) => {
  // Convert percentage coordinates to pixel coordinates
  const x = (zone.x / 100) * pitchWidth;
  const y = (zone.y / 100) * pitchHeight;
  const width = (zone.width / 100) * pitchWidth;
  const height = (zone.height / 100) * pitchHeight;

  // Get fill color (default to gold if not set)
  const fillColor = zone.color || 'rgba(239, 191, 4, 0.3)';

  // Border color based on state
  const getBorderColor = () => {
    if (isSelected) return theme.colors.gold.main;
    if (isHovered) return theme.colors.gold.light;
    return 'rgba(255, 255, 255, 0.5)';
  };

  const getBorderWidth = () => {
    if (isSelected) return 3;
    if (isHovered) return 2;
    return 1;
  };

  // Handle drag end - convert back to percentage
  const handleDragEnd = (e: { target: { x: () => number; y: () => number } }) => {
    if (onDragEnd) {
      const newX = (e.target.x() / pitchWidth) * 100;
      const newY = (e.target.y() / pitchHeight) * 100;
      onDragEnd(newX, newY);
    }
  };

  // Constrain drag within pitch boundaries
  const dragBoundFunc = (pos: { x: number; y: number }) => {
    const minX = 0;
    const maxX = pitchWidth - width;
    const minY = 0;
    const maxY = pitchHeight - height;

    return {
      x: Math.max(minX, Math.min(maxX, pos.x)),
      y: Math.max(minY, Math.min(maxY, pos.y)),
    };
  };

  // Calculate font size based on zone size
  const fontSize = Math.min(width, height) * 0.15;
  const minFontSize = 10;
  const maxFontSize = 16;
  const actualFontSize = Math.max(minFontSize, Math.min(maxFontSize, fontSize));

  return (
    <Group
      x={x}
      y={y}
      draggable={draggable}
      onDragEnd={handleDragEnd}
      dragBoundFunc={dragBoundFunc}
      onClick={onSelect}
      onTap={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Zone rectangle */}
      <Rect
        width={width}
        height={height}
        fill={fillColor}
        stroke={getBorderColor()}
        strokeWidth={getBorderWidth()}
        cornerRadius={4}
        shadowColor="rgba(0, 0, 0, 0.3)"
        shadowBlur={isSelected ? 8 : 4}
        shadowOffset={{ x: 2, y: 2 }}
        shadowOpacity={0.3}
      />

      {/* Zone title */}
      <Text
        text={zone.title || 'Untitled Zone'}
        x={4}
        y={4}
        width={width - 8}
        height={height - 8}
        fontSize={actualFontSize}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontStyle="bold"
        fill="white"
        align="center"
        verticalAlign="middle"
        wrap="word"
        ellipsis={true}
        shadowColor="rgba(0, 0, 0, 0.8)"
        shadowBlur={2}
        shadowOffset={{ x: 1, y: 1 }}
      />

      {/* Selection indicator */}
      {isSelected && (
        <>
          {/* Corner handles for potential resizing (visual only for now) */}
          <Rect
            x={-4}
            y={-4}
            width={8}
            height={8}
            fill={theme.colors.gold.main}
            cornerRadius={2}
          />
          <Rect
            x={width - 4}
            y={-4}
            width={8}
            height={8}
            fill={theme.colors.gold.main}
            cornerRadius={2}
          />
          <Rect
            x={-4}
            y={height - 4}
            width={8}
            height={8}
            fill={theme.colors.gold.main}
            cornerRadius={2}
          />
          <Rect
            x={width - 4}
            y={height - 4}
            width={8}
            height={8}
            fill={theme.colors.gold.main}
            cornerRadius={2}
          />
        </>
      )}
    </Group>
  );
};
