'use client';

import React from 'react';
import { Arrow, Group, Circle } from 'react-konva';
import { LINE_STROKE_WIDTH, ARROW_POINTER_LENGTH, ARROW_POINTER_WIDTH, type ArrowElement as ArrowElementType } from '../types';

interface ArrowElementProps {
  element: ArrowElementType;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (deltaX: number, deltaY: number) => void;
  draggable: boolean;
}

export const ArrowElement: React.FC<ArrowElementProps> = ({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  draggable,
}) => {
  const [x1, y1, x2, y2] = element.points;

  return (
    <Group
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        const node = e.target;
        const deltaX = node.x();
        const deltaY = node.y();
        // Reset position and pass delta to handler
        node.position({ x: 0, y: 0 });
        onDragEnd(deltaX, deltaY);
      }}
    >
      {/* Selection indicators at endpoints */}
      {isSelected && (
        <>
          <Circle
            x={x1}
            y={y1}
            radius={6}
            fill="#EFBF04"
            stroke="#FFFFFF"
            strokeWidth={1}
          />
          <Circle
            x={x2}
            y={y2}
            radius={6}
            fill="#EFBF04"
            stroke="#FFFFFF"
            strokeWidth={1}
          />
        </>
      )}

      {/* Arrow */}
      <Arrow
        points={[x1, y1, x2, y2]}
        stroke="#FFFFFF"
        strokeWidth={LINE_STROKE_WIDTH}
        pointerLength={ARROW_POINTER_LENGTH}
        pointerWidth={ARROW_POINTER_WIDTH}
        fill="#FFFFFF"
        dash={element.dashed ? [10, 5] : undefined}
        lineCap="round"
        lineJoin="round"
        shadowColor="black"
        shadowBlur={2}
        shadowOpacity={0.3}
      />
    </Group>
  );
};
