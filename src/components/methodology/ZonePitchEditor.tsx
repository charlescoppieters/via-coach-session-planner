'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { theme } from '@/styles/theme';
import { PitchBackground } from '@/components/tactics/PitchBackground';
import { ZoneElement } from './ZoneElement';
import { ZoneDescriptionModal } from './ZoneDescriptionModal';
import { ZoneTooltip } from './ZoneTooltip';
import {
  type PitchZone,
  type ZonePitchEditorProps,
  canPlaceZone,
  generateZoneId,
  getNextZoneColor,
} from './zoneTypes';
import type Konva from 'konva';

// Pitch dimensions (same as TacticsBoard)
const PITCH_ASPECT_RATIO = 16 / 9;
const DEFAULT_PITCH_WIDTH = 800;

// Minimum zone size (in percentage)
const MIN_ZONE_SIZE = 5;

export const ZonePitchEditor: React.FC<ZonePitchEditorProps> = ({
  initialZones = [],
  onZonesChange,
  readOnly = false,
}) => {
  // Responsive sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width: DEFAULT_PITCH_WIDTH, height: DEFAULT_PITCH_WIDTH / PITCH_ASPECT_RATIO });

  // Zone state
  const [zones, setZones] = useState<PitchZone[]>(initialZones);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [editingZone, setEditingZone] = useState<PitchZone | null>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDrawing, setCurrentDrawing] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isValidPlacement, setIsValidPlacement] = useState(true);

  // Tooltip state
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  // Responsive sizing
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

  // Sync with initialZones
  useEffect(() => {
    setZones(initialZones);
  }, [initialZones]);

  // Notify parent of changes
  useEffect(() => {
    onZonesChange?.(zones);
  }, [zones, onZonesChange]);

  // Convert pixel coordinates to percentage
  const pixelToPercent = useCallback((x: number, y: number) => {
    return {
      x: (x / dimensions.width) * 100,
      y: (y / dimensions.height) * 100,
    };
  }, [dimensions]);

  // Handle mouse down to start drawing
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (readOnly) return;

    const stage = e.target.getStage();
    if (!stage) return;

    // Only start drawing if clicking on empty area (stage background)
    if (e.target !== stage) return;

    const point = stage.getPointerPosition();
    if (!point) return;

    setIsDrawing(true);
    setDrawingStart({ x: point.x, y: point.y });
    setSelectedZoneId(null);
  }, [readOnly]);

  // Handle mouse move while drawing
  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const point = stage.getPointerPosition();
    if (!point) return;

    // Update tooltip position for hovered zone
    if (hoveredZoneId && !isDrawing) {
      setTooltipPosition({ x: point.x, y: point.y });
    }

    if (!isDrawing || !drawingStart) return;

    // Calculate rectangle dimensions
    const x = Math.min(drawingStart.x, point.x);
    const y = Math.min(drawingStart.y, point.y);
    const width = Math.abs(point.x - drawingStart.x);
    const height = Math.abs(point.y - drawingStart.y);

    // Convert to percentage for overlap check
    const percentCoords = pixelToPercent(x, y);
    const percentWidth = (width / dimensions.width) * 100;
    const percentHeight = (height / dimensions.height) * 100;

    // Create temporary zone for overlap check
    const tempZone: PitchZone = {
      id: 'temp',
      x: percentCoords.x,
      y: percentCoords.y,
      width: percentWidth,
      height: percentHeight,
      title: '',
      description: '',
    };

    // Check if valid placement
    const valid = canPlaceZone(tempZone, zones);
    setIsValidPlacement(valid);

    setCurrentDrawing({ x, y, width, height });
  }, [isDrawing, drawingStart, hoveredZoneId, zones, pixelToPercent, dimensions]);

  // Handle mouse up to finish drawing
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentDrawing) {
      setIsDrawing(false);
      setDrawingStart(null);
      setCurrentDrawing(null);
      return;
    }

    // Convert to percentage
    const percentCoords = pixelToPercent(currentDrawing.x, currentDrawing.y);
    const percentWidth = (currentDrawing.width / dimensions.width) * 100;
    const percentHeight = (currentDrawing.height / dimensions.height) * 100;

    // Check minimum size
    if (percentWidth < MIN_ZONE_SIZE || percentHeight < MIN_ZONE_SIZE) {
      setIsDrawing(false);
      setDrawingStart(null);
      setCurrentDrawing(null);
      return;
    }

    // Create new zone
    const newZone: PitchZone = {
      id: generateZoneId(),
      x: percentCoords.x,
      y: percentCoords.y,
      width: percentWidth,
      height: percentHeight,
      title: 'New Zone',
      description: '',
      color: getNextZoneColor(zones),
    };

    // Check if valid placement
    if (canPlaceZone(newZone, zones)) {
      setZones(prev => [...prev, newZone]);
      // Open modal to edit the new zone
      setEditingZone(newZone);
    }

    setIsDrawing(false);
    setDrawingStart(null);
    setCurrentDrawing(null);
    setIsValidPlacement(true);
  }, [isDrawing, currentDrawing, zones, pixelToPercent, dimensions]);

  // Handle zone selection
  const handleZoneSelect = useCallback((zoneId: string) => {
    if (readOnly) {
      // In read-only mode, clicking does nothing (hover shows tooltip)
      return;
    }
    setSelectedZoneId(zoneId);
    const zone = zones.find(z => z.id === zoneId);
    if (zone) {
      setEditingZone(zone);
    }
  }, [zones, readOnly]);

  // Handle zone hover
  const handleZoneHover = useCallback((zoneId: string | null) => {
    setHoveredZoneId(zoneId);
    if (!zoneId) {
      setTooltipPosition(null);
    }
  }, []);

  // Handle zone drag end
  const handleZoneDragEnd = useCallback((zoneId: string, newX: number, newY: number) => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;

    // Create updated zone
    const updatedZone: PitchZone = {
      ...zone,
      x: Math.max(0, Math.min(100 - zone.width, newX)),
      y: Math.max(0, Math.min(100 - zone.height, newY)),
    };

    // Check if valid placement
    if (canPlaceZone(updatedZone, zones)) {
      setZones(prev => prev.map(z => z.id === zoneId ? updatedZone : z));
    }
  }, [zones]);

  // Handle save zone from modal
  const handleSaveZone = useCallback((updatedZone: PitchZone) => {
    setZones(prev => {
      const exists = prev.some(z => z.id === updatedZone.id);
      if (exists) {
        return prev.map(z => z.id === updatedZone.id ? updatedZone : z);
      } else {
        return [...prev, updatedZone];
      }
    });
    setEditingZone(null);
    setSelectedZoneId(null);
  }, []);

  // Handle delete zone
  const handleDeleteZone = useCallback(() => {
    if (editingZone) {
      setZones(prev => prev.filter(z => z.id !== editingZone.id));
      setEditingZone(null);
      setSelectedZoneId(null);
    }
  }, [editingZone]);

  // Handle cancel modal
  const handleCancelModal = useCallback(() => {
    setEditingZone(null);
    setSelectedZoneId(null);
  }, []);

  // Handle stage click (deselect)
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = e.target.getStage();
    if (e.target === stage) {
      setSelectedZoneId(null);
    }
  }, []);

  // Get hovered zone for tooltip
  const hoveredZone = hoveredZoneId ? zones.find(z => z.id === hoveredZoneId) : null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
      }}
    >
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
          style={{ cursor: readOnly ? 'default' : 'crosshair' }}
        >
          {/* Pitch background */}
          <Layer>
            <PitchBackground width={dimensions.width} height={dimensions.height} />
          </Layer>

          {/* Zones layer */}
          <Layer>
            {zones.map(zone => (
              <ZoneElement
                key={zone.id}
                zone={zone}
                isSelected={selectedZoneId === zone.id}
                isHovered={hoveredZoneId === zone.id}
                onSelect={() => handleZoneSelect(zone.id)}
                onHover={(hovered) => handleZoneHover(hovered ? zone.id : null)}
                onDragEnd={(x, y) => handleZoneDragEnd(zone.id, x, y)}
                draggable={!readOnly && selectedZoneId === zone.id}
                scale={1}
                pitchWidth={dimensions.width}
                pitchHeight={dimensions.height}
              />
            ))}

            {/* Current drawing preview */}
            {currentDrawing && (
              <Rect
                x={currentDrawing.x}
                y={currentDrawing.y}
                width={currentDrawing.width}
                height={currentDrawing.height}
                fill={isValidPlacement ? 'rgba(239, 191, 4, 0.3)' : 'rgba(239, 68, 68, 0.3)'}
                stroke={isValidPlacement ? theme.colors.gold.main : '#EF4444'}
                strokeWidth={2}
                dash={[5, 5]}
                cornerRadius={4}
              />
            )}
          </Layer>
        </Stage>
      </div>

      {/* Tooltip */}
      {hoveredZone && tooltipPosition && !isDrawing && !editingZone && (
        <ZoneTooltip
          zone={hoveredZone}
          x={tooltipPosition.x}
          y={tooltipPosition.y}
          readOnly={readOnly}
        />
      )}

      {/* Zone Description Modal */}
      {editingZone && (
        <ZoneDescriptionModal
          zone={editingZone}
          onSave={handleSaveZone}
          onDelete={readOnly ? undefined : handleDeleteZone}
          onCancel={handleCancelModal}
        />
      )}
    </div>
  );
};

export default ZonePitchEditor;
