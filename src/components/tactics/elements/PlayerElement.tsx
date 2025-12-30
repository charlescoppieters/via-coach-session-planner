'use client';

import React from 'react';
import { Circle, Group } from 'react-konva';
import { PLAYER_RADIUS, type PlayerElement as PlayerElementType } from '../types';

interface PlayerElementProps {
  element: PlayerElementType;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  draggable: boolean;
}

export const PlayerElement: React.FC<PlayerElementProps> = ({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  draggable,
}) => {

  return (
    <Group
      x={element.x}
      y={element.y}
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
          radius={PLAYER_RADIUS + 4}
          stroke="#EFBF04"
          strokeWidth={2}
          dash={[4, 4]}
        />
      )}

      {/* Player circle */}
      <Circle
        radius={PLAYER_RADIUS}
        fill={element.color}
        stroke="#FFFFFF"
        strokeWidth={2}
        shadowColor="black"
        shadowBlur={4}
        shadowOpacity={0.3}
        shadowOffsetY={2}
      />
    </Group>
  );
};
