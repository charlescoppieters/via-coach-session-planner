'use client';

import React from 'react';
import { Line, Group, Circle } from 'react-konva';
import { MINIGOAL_WIDTH, MINIGOAL_HEIGHT, type MinigoalElement as MinigoalElementType } from '../types';

interface MinigoalElementProps {
  element: MinigoalElementType;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  draggable: boolean;
}

export const MinigoalElement: React.FC<MinigoalElementProps> = ({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  draggable,
}) => {
  // U-shape points: left post, back bar, right post (open at top/front)
  const halfWidth = MINIGOAL_WIDTH / 2;
  const halfHeight = MINIGOAL_HEIGHT / 2;

  // Points for U-shape (opens upward by default, can be rotated)
  const uShapePoints = [
    -halfWidth, -halfHeight,  // Top-left (end of left post)
    -halfWidth, halfHeight,   // Bottom-left (corner)
    halfWidth, halfHeight,    // Bottom-right (corner)
    halfWidth, -halfHeight,   // Top-right (end of right post)
  ];

  return (
    <Group
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onDragEnd(e.target.x(), e.target.y());
      }}
    >
      {/* Selection ring */}
      {isSelected && (
        <Circle
          radius={Math.max(MINIGOAL_WIDTH, MINIGOAL_HEIGHT) / 2 + 8}
          stroke="#EFBF04"
          strokeWidth={2}
          dash={[4, 4]}
        />
      )}

      {/* U-shape minigoal frame */}
      <Line
        points={uShapePoints}
        stroke={element.color}
        strokeWidth={4}
        lineCap="round"
        lineJoin="round"
        shadowColor="black"
        shadowBlur={3}
        shadowOpacity={0.3}
        shadowOffsetY={1}
      />
    </Group>
  );
};
