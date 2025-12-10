'use client';

import React from 'react';
import { Circle, Text, Group } from 'react-konva';
import { PLAYER_RADIUS, TEAM_COLORS, type PlayerElement as PlayerElementType } from '../types';

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
  const fillColor = TEAM_COLORS[element.team];

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
        fill={fillColor}
        stroke="#FFFFFF"
        strokeWidth={2}
        shadowColor="black"
        shadowBlur={4}
        shadowOpacity={0.3}
        shadowOffsetY={2}
      />

      {/* Player number */}
      <Text
        text={String(element.number)}
        fontSize={element.number >= 10 ? 14 : 16}
        fontStyle="bold"
        fill="#FFFFFF"
        align="center"
        verticalAlign="middle"
        offsetX={element.number >= 10 ? 8 : 5}
        offsetY={element.number >= 10 ? 6 : 7}
      />
    </Group>
  );
};
