'use client';

import React from 'react';
import { Rect, Line, Circle, Arc, Group } from 'react-konva';
import { theme } from '@/styles/theme';

interface PitchBackgroundProps {
  width: number;
  height: number;
}

export const PitchBackground: React.FC<PitchBackgroundProps> = ({ width, height }) => {
  const bgColor = theme.colors.background.secondary; // #081111
  const lineColor = theme.colors.gold.main; // #EFBF04
  const lineWidth = 2;

  // Pitch dimensions (proportional)
  const padding = 20;
  const pitchX = padding;
  const pitchY = padding;
  const pitchWidth = width - padding * 2;
  const pitchHeight = height - padding * 2;

  // Goal area dimensions (proportional to real pitch)
  const goalAreaWidth = pitchWidth * 0.16; // ~18 yards / 110 yards
  const goalAreaHeight = pitchHeight * 0.36; // ~20 yards / 55 yards

  // Penalty area dimensions
  const penaltyAreaWidth = pitchWidth * 0.16; // ~18 yards
  const penaltyAreaHeight = pitchHeight * 0.73; // ~40 yards

  // Center circle
  const centerCircleRadius = pitchHeight * 0.17;

  // Penalty spot distance from goal line
  const penaltySpotDistance = pitchWidth * 0.1;

  // Corner arc radius
  const cornerArcRadius = pitchWidth * 0.02;

  return (
    <Group listening={false}>
      {/* Background */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={bgColor}
      />

      {/* Outer boundary */}
      <Rect
        x={pitchX}
        y={pitchY}
        width={pitchWidth}
        height={pitchHeight}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />

      {/* Center line */}
      <Line
        points={[
          pitchX + pitchWidth / 2,
          pitchY,
          pitchX + pitchWidth / 2,
          pitchY + pitchHeight,
        ]}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />

      {/* Center circle */}
      <Circle
        x={pitchX + pitchWidth / 2}
        y={pitchY + pitchHeight / 2}
        radius={centerCircleRadius}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />

      {/* Center spot */}
      <Circle
        x={pitchX + pitchWidth / 2}
        y={pitchY + pitchHeight / 2}
        radius={4}
        fill={lineColor}
      />

      {/* Left penalty area */}
      <Rect
        x={pitchX}
        y={pitchY + (pitchHeight - penaltyAreaHeight) / 2}
        width={penaltyAreaWidth}
        height={penaltyAreaHeight}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />

      {/* Left goal area */}
      <Rect
        x={pitchX}
        y={pitchY + (pitchHeight - goalAreaHeight) / 2}
        width={goalAreaWidth}
        height={goalAreaHeight}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />

      {/* Left penalty spot */}
      <Circle
        x={pitchX + penaltySpotDistance}
        y={pitchY + pitchHeight / 2}
        radius={4}
        fill={lineColor}
      />

      {/* Left penalty arc */}
      <Arc
        x={pitchX + penaltySpotDistance}
        y={pitchY + pitchHeight / 2}
        innerRadius={0}
        outerRadius={centerCircleRadius}
        angle={106}
        rotation={-53}
        stroke={lineColor}
        strokeWidth={lineWidth}
        clockwise={false}
      />

      {/* Right penalty area */}
      <Rect
        x={pitchX + pitchWidth - penaltyAreaWidth}
        y={pitchY + (pitchHeight - penaltyAreaHeight) / 2}
        width={penaltyAreaWidth}
        height={penaltyAreaHeight}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />

      {/* Right goal area */}
      <Rect
        x={pitchX + pitchWidth - goalAreaWidth}
        y={pitchY + (pitchHeight - goalAreaHeight) / 2}
        width={goalAreaWidth}
        height={goalAreaHeight}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />

      {/* Right penalty spot */}
      <Circle
        x={pitchX + pitchWidth - penaltySpotDistance}
        y={pitchY + pitchHeight / 2}
        radius={4}
        fill={lineColor}
      />

      {/* Right penalty arc */}
      <Arc
        x={pitchX + pitchWidth - penaltySpotDistance}
        y={pitchY + pitchHeight / 2}
        innerRadius={0}
        outerRadius={centerCircleRadius}
        angle={106}
        rotation={127}
        stroke={lineColor}
        strokeWidth={lineWidth}
        clockwise={false}
      />

      {/* Corner arcs */}
      {/* Top-left */}
      <Arc
        x={pitchX}
        y={pitchY}
        innerRadius={0}
        outerRadius={cornerArcRadius}
        angle={90}
        rotation={0}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />

      {/* Top-right */}
      <Arc
        x={pitchX + pitchWidth}
        y={pitchY}
        innerRadius={0}
        outerRadius={cornerArcRadius}
        angle={90}
        rotation={90}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />

      {/* Bottom-right */}
      <Arc
        x={pitchX + pitchWidth}
        y={pitchY + pitchHeight}
        innerRadius={0}
        outerRadius={cornerArcRadius}
        angle={90}
        rotation={180}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />

      {/* Bottom-left */}
      <Arc
        x={pitchX}
        y={pitchY + pitchHeight}
        innerRadius={0}
        outerRadius={cornerArcRadius}
        angle={90}
        rotation={270}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />
    </Group>
  );
};
