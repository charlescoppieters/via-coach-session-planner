// Types for Playing Methodology Pitch Zones

export interface PitchZone {
  id: string;
  x: number;      // Top-left X (0-100 as percentage of pitch width)
  y: number;      // Top-left Y (0-100 as percentage of pitch height)
  width: number;  // Width as percentage of pitch width
  height: number; // Height as percentage of pitch height
  title: string;  // Zone name (e.g., "Left Wing Attack Zone")
  description: string; // Detailed description/goals for this zone
  color?: string; // Optional fill color (with transparency)
}

export interface ZonePitchEditorProps {
  initialZones?: PitchZone[];
  onZonesChange?: (zones: PitchZone[]) => void;
  readOnly?: boolean;
}

export interface ZoneElementProps {
  zone: PitchZone;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
  onDragEnd?: (x: number, y: number) => void;
  draggable?: boolean;
  scale: number;
  pitchWidth: number;
  pitchHeight: number;
}

export interface ZoneDescriptionModalProps {
  zone: PitchZone | null;
  onSave: (zone: PitchZone) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

export interface ZoneTooltipProps {
  zone: PitchZone;
  x: number;
  y: number;
  readOnly?: boolean;
}

// Default zone colors (semi-transparent)
export const ZONE_COLORS = [
  'rgba(239, 191, 4, 0.3)',   // Gold
  'rgba(59, 130, 246, 0.3)',  // Blue
  'rgba(34, 197, 94, 0.3)',   // Green
  'rgba(249, 115, 22, 0.3)',  // Orange
  'rgba(168, 85, 247, 0.3)',  // Purple
  'rgba(236, 72, 153, 0.3)',  // Pink
  'rgba(20, 184, 166, 0.3)',  // Teal
  'rgba(239, 68, 68, 0.3)',   // Red
];

// Get next available color
export function getNextZoneColor(existingZones: PitchZone[]): string {
  const usedColors = existingZones.map(z => z.color).filter(Boolean);
  for (const color of ZONE_COLORS) {
    if (!usedColors.includes(color)) {
      return color;
    }
  }
  // If all colors used, start over
  return ZONE_COLORS[existingZones.length % ZONE_COLORS.length];
}

// Overlap detection
export function doZonesOverlap(zone1: PitchZone, zone2: PitchZone): boolean {
  // Check if rectangles overlap
  return !(
    zone1.x + zone1.width <= zone2.x ||  // zone1 is left of zone2
    zone2.x + zone2.width <= zone1.x ||  // zone2 is left of zone1
    zone1.y + zone1.height <= zone2.y || // zone1 is above zone2
    zone2.y + zone2.height <= zone1.y    // zone2 is above zone1
  );
}

// Check if a new zone can be placed without overlapping existing zones
export function canPlaceZone(newZone: PitchZone, existingZones: PitchZone[]): boolean {
  return !existingZones.some(zone =>
    zone.id !== newZone.id && doZonesOverlap(newZone, zone)
  );
}

// Generate unique ID
export function generateZoneId(): string {
  return `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
