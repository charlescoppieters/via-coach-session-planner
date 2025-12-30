'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';
import { theme } from '@/styles/theme';
import { PitchBackground } from './PitchBackground';
import { TacticsToolbar } from './TacticsToolbar';
import { PlayerElement } from './elements/PlayerElement';
import { ConeElement } from './elements/ConeElement';
import { MinigoalElement } from './elements/MinigoalElement';
import { ArrowElement } from './elements/ArrowElement';
import { LineElement } from './elements/LineElement';
import {
  type TacticsState,
  type TacticsElement,
  type ToolType,
  type PitchView,
  type TacticsBoardProps,
  PITCH_ASPECT_RATIO,
  DEFAULT_PITCH_WIDTH,
  DEFAULT_PITCH_HEIGHT,
} from './types';

const DEFAULT_COLOR = '#3B82F6'; // Blue
import type Konva from 'konva';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const TacticsBoard: React.FC<TacticsBoardProps> = ({
  initialData,
  onDataChange,
  width: propWidth,
  height: propHeight,
  readOnly = false,
}) => {
  // Responsive sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width: propWidth || 800, height: propHeight || 450 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const calculatedHeight = containerWidth / PITCH_ASPECT_RATIO;
        setDimensions({
          width: containerWidth,
          height: calculatedHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Scale factor for rendering - always work with reference dimensions internally
  const scale = dimensions.width / DEFAULT_PITCH_WIDTH;

  // State
  const [elements, setElements] = useState<TacticsElement[]>(initialData?.elements || []);
  const [selectedTool, setSelectedTool] = useState<ToolType>('select');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [pitchView, setPitchView] = useState<PitchView>('full');

  // Track if we've initialized from initialData to avoid infinite loops
  const initializedRef = useRef(false);
  const lastInitialDataRef = useRef<string | null>(null);

  // Sync elements when initialData changes (for re-editing saved diagrams)
  // Only sync if the serialized data actually changed (not just reference)
  useEffect(() => {
    if (initialData?.elements) {
      const serialized = JSON.stringify(initialData.elements);
      if (serialized !== lastInitialDataRef.current) {
        lastInitialDataRef.current = serialized;
        if (initializedRef.current) {
          // Only update if this is a genuine external change (e.g., loading different diagram)
          setElements(initialData.elements);
        }
      }
    }
    initializedRef.current = true;
  }, [initialData?.elements]);
  // Track color per tool type so each tool remembers its color
  const [toolColors, setToolColors] = useState<Record<string, string>>({
    player: DEFAULT_COLOR,
    cone: '#F97316', // Orange
    minigoal: '#FFFFFF', // White
    arrow: '#FFFFFF',
    line: '#FFFFFF',
  });
  // Track dashed setting per tool (arrow/line)
  const [toolDashed, setToolDashed] = useState<Record<string, boolean>>({
    arrow: false,
    line: false,
  });
  const [playerCounter, setPlayerCounter] = useState(1);

  // Get current color for the selected tool
  const selectedColor = toolColors[selectedTool] || DEFAULT_COLOR;
  const setSelectedColor = (color: string) => {
    setToolColors(prev => ({ ...prev, [selectedTool]: color }));
  };

  // Get current dashed setting for the selected tool
  const isDashed = toolDashed[selectedTool] || false;
  const setIsDashed = (dashed: boolean) => {
    setToolDashed(prev => ({ ...prev, [selectedTool]: dashed }));
  };

  // Drawing state for arrows/lines
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDrawing, setCurrentDrawing] = useState<TacticsElement | null>(null);

  // Notify parent of changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        elements,
        selectedTool,
        selectedElementId,
      });
    }
  }, [elements, selectedTool, selectedElementId, onDataChange]);

  // Handle stage click for adding elements
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (readOnly) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const point = stage.getPointerPosition();
    if (!point) return;

    // Convert screen coordinates to reference coordinates
    const refX = point.x / scale;
    const refY = point.y / scale;

    // Clicked on empty area - deselect
    if (e.target === stage) {
      setSelectedElementId(null);
    }

    // Add new element based on selected tool
    if (selectedTool === 'player' && e.target === stage) {
      const newPlayer: TacticsElement = {
        type: 'player',
        id: generateId(),
        x: refX,
        y: refY,
        number: playerCounter,
        color: selectedColor,
      };
      setElements(prev => [...prev, newPlayer]);
      setPlayerCounter(prev => prev + 1);
    } else if (selectedTool === 'cone' && e.target === stage) {
      const newCone: TacticsElement = {
        type: 'cone',
        id: generateId(),
        x: refX,
        y: refY,
        color: selectedColor,
      };
      setElements(prev => [...prev, newCone]);
    } else if (selectedTool === 'minigoal' && e.target === stage) {
      const newMinigoal: TacticsElement = {
        type: 'minigoal',
        id: generateId(),
        x: refX,
        y: refY,
        rotation: 90, // Default to horizontal (facing up/down the pitch)
        color: selectedColor,
      };
      setElements(prev => [...prev, newMinigoal]);
    }
  }, [selectedTool, selectedColor, playerCounter, readOnly, scale]);

  // Handle mouse down for drawing arrows/lines
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (readOnly) return;
    if (selectedTool !== 'arrow' && selectedTool !== 'line') return;

    const stage = e.target.getStage();
    if (!stage || e.target !== stage) return;

    const point = stage.getPointerPosition();
    if (!point) return;

    // Convert to reference coordinates
    const refX = point.x / scale;
    const refY = point.y / scale;

    setIsDrawing(true);
    setDrawingStart({ x: refX, y: refY });

    const newElement: TacticsElement = selectedTool === 'arrow'
      ? {
          type: 'arrow',
          id: generateId(),
          points: [refX, refY, refX, refY],
          dashed: isDashed,
          color: selectedColor,
        }
      : {
          type: 'line',
          id: generateId(),
          points: [refX, refY, refX, refY],
          dashed: isDashed,
          color: selectedColor,
        };

    setCurrentDrawing(newElement);
  }, [selectedTool, isDashed, selectedColor, readOnly, scale]);

  // Handle mouse move for drawing
  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawing || !drawingStart || !currentDrawing) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const point = stage.getPointerPosition();
    if (!point) return;

    // Convert to reference coordinates
    const refX = point.x / scale;
    const refY = point.y / scale;

    setCurrentDrawing(prev => {
      if (!prev || (prev.type !== 'arrow' && prev.type !== 'line')) return prev;
      return {
        ...prev,
        points: [drawingStart.x, drawingStart.y, refX, refY],
      };
    });
  }, [isDrawing, drawingStart, currentDrawing, scale]);

  // Handle mouse up to finish drawing
  const handleMouseUp = useCallback(() => {
    if (isDrawing && currentDrawing) {
      // Only add if line has some length
      if (currentDrawing.type === 'arrow' || currentDrawing.type === 'line') {
        const [x1, y1, x2, y2] = currentDrawing.points;
        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        if (length > 10) {
          setElements(prev => [...prev, currentDrawing]);
        }
      }
    }
    setIsDrawing(false);
    setDrawingStart(null);
    setCurrentDrawing(null);
  }, [isDrawing, currentDrawing]);

  // Update element position after drag
  const handleElementDragEnd = useCallback((id: string, x: number, y: number) => {
    setElements(prev =>
      prev.map(el => {
        if (el.id !== id) return el;
        if (el.type === 'player' || el.type === 'cone' || el.type === 'minigoal') {
          return { ...el, x, y };
        }
        return el;
      })
    );
  }, []);

  // Rotate selected minigoal by 90 degrees
  const handleRotateSelected = useCallback(() => {
    if (!selectedElementId) return;
    setElements(prev =>
      prev.map(el => {
        if (el.id !== selectedElementId || el.type !== 'minigoal') return el;
        return { ...el, rotation: (el.rotation + 90) % 360 };
      })
    );
  }, [selectedElementId]);

  // Update arrow/line position after drag
  const handleLineDragEnd = useCallback((id: string, deltaX: number, deltaY: number) => {
    setElements(prev =>
      prev.map(el => {
        if (el.id !== id) return el;
        if (el.type === 'arrow' || el.type === 'line') {
          const [x1, y1, x2, y2] = el.points;
          return {
            ...el,
            points: [x1 + deltaX, y1 + deltaY, x2 + deltaX, y2 + deltaY] as [number, number, number, number],
          };
        }
        return el;
      })
    );
  }, []);

  // Delete selected element
  const handleDeleteSelected = useCallback(() => {
    if (selectedElementId) {
      setElements(prev => prev.filter(el => el.id !== selectedElementId));
      setSelectedElementId(null);
    }
  }, [selectedElementId]);

  // Clear all elements
  const handleClearAll = useCallback(() => {
    setElements([]);
    setSelectedElementId(null);
    setPlayerCounter(1);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      } else if (e.key === 'Escape') {
        setSelectedElementId(null);
        setSelectedTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteSelected, readOnly]);

  // Export canvas to image
  const exportToImage = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!stageRef.current) {
        reject(new Error('Stage not found'));
        return;
      }

      // Temporarily deselect for clean export
      const prevSelected = selectedElementId;
      setSelectedElementId(null);

      setTimeout(() => {
        stageRef.current?.toBlob({
          mimeType: 'image/png',
          quality: 1,
          pixelRatio: 2,
          callback: (blob) => {
            setSelectedElementId(prevSelected);
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to export image'));
            }
          },
        });
      }, 100);
    });
  }, [selectedElementId]);

  // Expose export function to parent
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as HTMLDivElement & { exportToImage?: () => Promise<Blob> }).exportToImage = exportToImage;
    }
  }, [exportToImage]);

  const isDraggable = !readOnly;

  // Check if selected element is a minigoal (for showing rotate button)
  const selectedElement = elements.find(el => el.id === selectedElementId);
  const hasMinigoalSelected = selectedElement?.type === 'minigoal';

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.md,
        width: '100%',
      }}
    >
      {/* Toolbar */}
      {!readOnly && (
        <TacticsToolbar
          selectedTool={selectedTool}
          onToolChange={setSelectedTool}
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
          isDashed={isDashed}
          onDashedChange={setIsDashed}
          onDeleteSelected={handleDeleteSelected}
          onClearAll={handleClearAll}
          hasSelection={!!selectedElementId}
          hasMinigoalSelected={hasMinigoalSelected}
          onRotateSelected={handleRotateSelected}
          pitchView={pitchView}
          onPitchViewChange={setPitchView}
        />
      )}

      {/* Canvas */}
      <div
        style={{
          borderRadius: theme.borderRadius.md,
          overflow: 'hidden',
          boxShadow: theme.shadows.lg,
        }}
      >
        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          onClick={handleStageClick}
          onTap={handleStageClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          onMouseMove={handleMouseMove}
          onTouchMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: selectedTool === 'select' ? 'default' : 'crosshair' }}
        >
          <Layer>
            {/* Pitch background */}
            <PitchBackground width={dimensions.width} height={dimensions.height} view={pitchView} />
          </Layer>

          <Layer scaleX={scale} scaleY={scale}>
            {/* Render elements - scaled from reference coordinates */}
            {elements.map(element => {
              switch (element.type) {
                case 'player':
                  return (
                    <PlayerElement
                      key={element.id}
                      element={element}
                      isSelected={selectedElementId === element.id}
                      onSelect={() => setSelectedElementId(element.id)}
                      onDragEnd={(x, y) => handleElementDragEnd(element.id, x, y)}
                      draggable={isDraggable}
                    />
                  );
                case 'cone':
                  return (
                    <ConeElement
                      key={element.id}
                      element={element}
                      isSelected={selectedElementId === element.id}
                      onSelect={() => setSelectedElementId(element.id)}
                      onDragEnd={(x, y) => handleElementDragEnd(element.id, x, y)}
                      draggable={isDraggable}
                    />
                  );
                case 'minigoal':
                  return (
                    <MinigoalElement
                      key={element.id}
                      element={element}
                      isSelected={selectedElementId === element.id}
                      onSelect={() => setSelectedElementId(element.id)}
                      onDragEnd={(x, y) => handleElementDragEnd(element.id, x, y)}
                      draggable={isDraggable}
                    />
                  );
                case 'arrow':
                  return (
                    <ArrowElement
                      key={element.id}
                      element={element}
                      isSelected={selectedElementId === element.id}
                      onSelect={() => setSelectedElementId(element.id)}
                      onDragEnd={(dx, dy) => handleLineDragEnd(element.id, dx, dy)}
                      draggable={isDraggable}
                    />
                  );
                case 'line':
                  return (
                    <LineElement
                      key={element.id}
                      element={element}
                      isSelected={selectedElementId === element.id}
                      onSelect={() => setSelectedElementId(element.id)}
                      onDragEnd={(dx, dy) => handleLineDragEnd(element.id, dx, dy)}
                      draggable={isDraggable}
                    />
                  );
                default:
                  return null;
              }
            })}

            {/* Current drawing preview */}
            {currentDrawing && (
              currentDrawing.type === 'arrow' ? (
                <ArrowElement
                  element={currentDrawing}
                  isSelected={false}
                  onSelect={() => {}}
                  onDragEnd={() => {}}
                  draggable={false}
                />
              ) : currentDrawing.type === 'line' ? (
                <LineElement
                  element={currentDrawing}
                  isSelected={false}
                  onSelect={() => {}}
                  onDragEnd={() => {}}
                  draggable={false}
                />
              ) : null
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default TacticsBoard;
