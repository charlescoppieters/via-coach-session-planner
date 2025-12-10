'use client';

import React from 'react';
import { RegularPolygon, Group, Circle } from 'react-konva';
import { CONE_SIZE, type ConeElement as ConeElementType } from '../types';

interface ConeElementProps {
  element: ConeElementType;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  draggable: boolean;
}

export const ConeElement: React.FC<ConeElementProps> = ({
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
          radius={CONE_SIZE + 4}
          stroke="#EFBF04"
          strokeWidth={2}
          dash={[4, 4]}
        />
      )}

      {/* Cone triangle */}
      <RegularPolygon
        sides={3}
        radius={CONE_SIZE}
        fill={element.color}
        stroke="#FFFFFF"
        strokeWidth={1.5}
        shadowColor="black"
        shadowBlur={3}
        shadowOpacity={0.3}
        shadowOffsetY={1}
        rotation={180} // Point up
      />
    </Group>
  );
};
