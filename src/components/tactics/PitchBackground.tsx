'use client';

import React, { useMemo } from 'react';
import { Rect, Line, Circle, Arc, Group } from 'react-konva';
import { theme } from '@/styles/theme';
import type { PitchView } from './types';

interface PitchBackgroundProps {
  width: number;
  height: number;
  view?: PitchView;
}

// Helper to generate arc points for the penalty arc (just the curved line, no radial lines)
function generateArcPoints(
  centerX: number,
  centerY: number,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number,
  steps: number = 30
): number[] {
  const points: number[] = [];
  const startAngle = (startAngleDeg * Math.PI) / 180;
  const endAngle = (endAngleDeg * Math.PI) / 180;

  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / steps);
    points.push(centerX + radius * Math.cos(angle));
    points.push(centerY + radius * Math.sin(angle));
  }

  return points;
}

export const PitchBackground: React.FC<PitchBackgroundProps> = ({ width, height, view = 'full' }) => {
  const bgColor = theme.colors.background.secondary;
  const lineColor = theme.colors.gold.main;
  const lineWidth = 2;
  const padding = 20;

  // Blank view - just outer rectangle
  if (view === 'blank') {
    const pitchX = padding;
    const pitchY = padding;
    const pitchWidth = width - padding * 2;
    const pitchHeight = height - padding * 2;

    return (
      <Group listening={false}>
        <Rect x={0} y={0} width={width} height={height} fill={bgColor} />
        <Rect x={pitchX} y={pitchY} width={pitchWidth} height={pitchHeight} stroke={lineColor} strokeWidth={lineWidth} />
      </Group>
    );
  }

  // For third views, we show approximately the final third of the pitch (roughly 35m)
  // This includes the penalty area (16.5m) plus some extra space
  const thirdDepthM = 35; // meters of pitch to show in third view

  // FIFA standard dimensions
  const fullPitchLengthM = 105;
  const fullPitchWidthM = 68;

  if (view === 'full') {
    // Full pitch - horizontal layout
    const pitchX = padding;
    const pitchY = padding;
    const pitchWidth = width - padding * 2;
    const pitchHeight = height - padding * 2;

    const scaleX = pitchWidth / fullPitchLengthM;
    const scaleY = pitchHeight / fullPitchWidthM;

    const goalAreaDepth = 5.5 * scaleX;
    const goalAreaWidth = 18.32 * scaleY;
    const penaltyAreaDepth = 16.5 * scaleX;
    const penaltyAreaWidth = 40.32 * scaleY;
    const penaltySpotDistance = 11 * scaleX;
    const arcRadius = 9.15 * Math.min(scaleX, scaleY);
    const cornerArcRadius = 1 * Math.min(scaleX, scaleY);

    const distToBoxLine = (16.5 - 11) * scaleX;
    const arcAngleRad = Math.acos(Math.min(1, distToBoxLine / arcRadius));
    const arcAngleDeg = (arcAngleRad * 180) / Math.PI;

    const leftPenaltyArcPoints = generateArcPoints(
      pitchX + penaltySpotDistance,
      pitchY + pitchHeight / 2,
      arcRadius,
      -arcAngleDeg,
      arcAngleDeg
    );

    const rightPenaltyArcPoints = generateArcPoints(
      pitchX + pitchWidth - penaltySpotDistance,
      pitchY + pitchHeight / 2,
      arcRadius,
      180 - arcAngleDeg,
      180 + arcAngleDeg
    );

    return (
      <Group listening={false}>
        <Rect x={0} y={0} width={width} height={height} fill={bgColor} />
        <Rect x={pitchX} y={pitchY} width={pitchWidth} height={pitchHeight} stroke={lineColor} strokeWidth={lineWidth} />

        {/* Center line */}
        <Line points={[pitchX + pitchWidth / 2, pitchY, pitchX + pitchWidth / 2, pitchY + pitchHeight]} stroke={lineColor} strokeWidth={lineWidth} />

        {/* Center circle and spot */}
        <Circle x={pitchX + pitchWidth / 2} y={pitchY + pitchHeight / 2} radius={arcRadius} stroke={lineColor} strokeWidth={lineWidth} />
        <Circle x={pitchX + pitchWidth / 2} y={pitchY + pitchHeight / 2} radius={3} fill={lineColor} />

        {/* Left side */}
        <Rect x={pitchX} y={pitchY + (pitchHeight - penaltyAreaWidth) / 2} width={penaltyAreaDepth} height={penaltyAreaWidth} stroke={lineColor} strokeWidth={lineWidth} />
        <Rect x={pitchX} y={pitchY + (pitchHeight - goalAreaWidth) / 2} width={goalAreaDepth} height={goalAreaWidth} stroke={lineColor} strokeWidth={lineWidth} />
        <Circle x={pitchX + penaltySpotDistance} y={pitchY + pitchHeight / 2} radius={3} fill={lineColor} />
        <Line points={leftPenaltyArcPoints} stroke={lineColor} strokeWidth={lineWidth} lineCap="round" />

        {/* Right side */}
        <Rect x={pitchX + pitchWidth - penaltyAreaDepth} y={pitchY + (pitchHeight - penaltyAreaWidth) / 2} width={penaltyAreaDepth} height={penaltyAreaWidth} stroke={lineColor} strokeWidth={lineWidth} />
        <Rect x={pitchX + pitchWidth - goalAreaDepth} y={pitchY + (pitchHeight - goalAreaWidth) / 2} width={goalAreaDepth} height={goalAreaWidth} stroke={lineColor} strokeWidth={lineWidth} />
        <Circle x={pitchX + pitchWidth - penaltySpotDistance} y={pitchY + pitchHeight / 2} radius={3} fill={lineColor} />
        <Line points={rightPenaltyArcPoints} stroke={lineColor} strokeWidth={lineWidth} lineCap="round" />

        {/* Corner arcs */}
        <Arc x={pitchX} y={pitchY} innerRadius={0} outerRadius={cornerArcRadius} angle={90} rotation={0} stroke={lineColor} strokeWidth={lineWidth} />
        <Arc x={pitchX + pitchWidth} y={pitchY} innerRadius={0} outerRadius={cornerArcRadius} angle={90} rotation={90} stroke={lineColor} strokeWidth={lineWidth} />
        <Arc x={pitchX + pitchWidth} y={pitchY + pitchHeight} innerRadius={0} outerRadius={cornerArcRadius} angle={90} rotation={180} stroke={lineColor} strokeWidth={lineWidth} />
        <Arc x={pitchX} y={pitchY + pitchHeight} innerRadius={0} outerRadius={cornerArcRadius} angle={90} rotation={270} stroke={lineColor} strokeWidth={lineWidth} />
      </Group>
    );
  }

  // Third views - vertical layout (goal at top for attacking, bottom for defending)
  const pitchX = padding;
  const pitchY = padding;
  const pitchWidth = width - padding * 2;
  const pitchHeight = height - padding * 2;

  // Scale based on showing thirdDepthM length and full width
  const scaleX = pitchWidth / fullPitchWidthM; // Width of canvas maps to pitch width (68m)
  const scaleY = pitchHeight / thirdDepthM; // Height of canvas maps to third depth (35m)

  const goalAreaDepth = 5.5 * scaleY;
  const goalAreaWidth = 18.32 * scaleX;
  const penaltyAreaDepth = 16.5 * scaleY;
  const penaltyAreaWidth = 40.32 * scaleX;
  const penaltySpotDistance = 11 * scaleY;
  const arcRadius = 9.15 * Math.min(scaleX, scaleY);
  const cornerArcRadius = 1 * Math.min(scaleX, scaleY);

  const distToBoxLine = (16.5 - 11) * scaleY;
  const arcAngleRad = Math.acos(Math.min(1, distToBoxLine / arcRadius));
  const arcAngleDeg = (arcAngleRad * 180) / Math.PI;

  // For attacking view: goal at top (y=pitchY)
  // For defending view: goal at bottom (y=pitchY+pitchHeight)
  const goalAtTop = view === 'attacking';

  const goalLineY = goalAtTop ? pitchY : pitchY + pitchHeight;
  const penaltyAreaY = goalAtTop ? pitchY : pitchY + pitchHeight - penaltyAreaDepth;
  const goalAreaY = goalAtTop ? pitchY : pitchY + pitchHeight - goalAreaDepth;
  const penaltySpotY = goalAtTop ? pitchY + penaltySpotDistance : pitchY + pitchHeight - penaltySpotDistance;

  // Penalty arc - curved part outside the box
  const penaltyArcPoints = useMemo(() => {
    const centerX = pitchX + pitchWidth / 2;
    const centerY = penaltySpotY;
    // For attacking (goal at top): arc opens downward (90-angle to 90+angle)
    // For defending (goal at bottom): arc opens upward (270-angle to 270+angle, or -90-angle to -90+angle)
    if (goalAtTop) {
      return generateArcPoints(centerX, centerY, arcRadius, 90 - arcAngleDeg, 90 + arcAngleDeg);
    } else {
      return generateArcPoints(centerX, centerY, arcRadius, -90 - arcAngleDeg, -90 + arcAngleDeg);
    }
  }, [pitchX, pitchWidth, penaltySpotY, arcRadius, arcAngleDeg, goalAtTop]);

  return (
    <Group listening={false}>
      <Rect x={0} y={0} width={width} height={height} fill={bgColor} />

      {/* Outer boundary */}
      <Rect x={pitchX} y={pitchY} width={pitchWidth} height={pitchHeight} stroke={lineColor} strokeWidth={lineWidth} />

      {/* Penalty area */}
      <Rect
        x={pitchX + (pitchWidth - penaltyAreaWidth) / 2}
        y={penaltyAreaY}
        width={penaltyAreaWidth}
        height={penaltyAreaDepth}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />

      {/* Goal area */}
      <Rect
        x={pitchX + (pitchWidth - goalAreaWidth) / 2}
        y={goalAreaY}
        width={goalAreaWidth}
        height={goalAreaDepth}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />

      {/* Penalty spot */}
      <Circle
        x={pitchX + pitchWidth / 2}
        y={penaltySpotY}
        radius={3}
        fill={lineColor}
      />

      {/* Penalty arc (D) */}
      <Line
        points={penaltyArcPoints}
        stroke={lineColor}
        strokeWidth={lineWidth}
        lineCap="round"
      />

      {/* Corner arcs - only the two at the goal end */}
      {goalAtTop ? (
        <>
          <Arc x={pitchX} y={pitchY} innerRadius={0} outerRadius={cornerArcRadius} angle={90} rotation={0} stroke={lineColor} strokeWidth={lineWidth} />
          <Arc x={pitchX + pitchWidth} y={pitchY} innerRadius={0} outerRadius={cornerArcRadius} angle={90} rotation={90} stroke={lineColor} strokeWidth={lineWidth} />
        </>
      ) : (
        <>
          <Arc x={pitchX + pitchWidth} y={pitchY + pitchHeight} innerRadius={0} outerRadius={cornerArcRadius} angle={90} rotation={180} stroke={lineColor} strokeWidth={lineWidth} />
          <Arc x={pitchX} y={pitchY + pitchHeight} innerRadius={0} outerRadius={cornerArcRadius} angle={90} rotation={270} stroke={lineColor} strokeWidth={lineWidth} />
        </>
      )}
    </Group>
  );
};
