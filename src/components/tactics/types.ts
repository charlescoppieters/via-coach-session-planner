// Tactics Board Types

export type ToolType = 'select' | 'player' | 'cone' | 'arrow' | 'line';

export type TeamType = 'home' | 'away';

export interface PlayerElement {
  type: 'player';
  id: string;
  x: number;
  y: number;
  number: number;
  team: TeamType;
}

export interface ConeElement {
  type: 'cone';
  id: string;
  x: number;
  y: number;
  color: string;
}

export interface ArrowElement {
  type: 'arrow';
  id: string;
  points: [number, number, number, number]; // [x1, y1, x2, y2]
  dashed: boolean;
}

export interface LineElement {
  type: 'line';
  id: string;
  points: [number, number, number, number]; // [x1, y1, x2, y2]
  dashed: boolean;
}

export type TacticsElement = PlayerElement | ConeElement | ArrowElement | LineElement;

export interface TacticsState {
  elements: TacticsElement[];
  selectedTool: ToolType;
  selectedElementId: string | null;
}

export interface TacticsBoardProps {
  initialData?: TacticsState | null;
  onDataChange?: (data: TacticsState) => void;
  width?: number;
  height?: number;
  readOnly?: boolean;
}

// Pitch dimensions (16:9 aspect ratio)
export const PITCH_ASPECT_RATIO = 16 / 9;
export const DEFAULT_PITCH_WIDTH = 800;
export const DEFAULT_PITCH_HEIGHT = DEFAULT_PITCH_WIDTH / PITCH_ASPECT_RATIO;

// Element sizes (relative to pitch width)
export const PLAYER_RADIUS = 20;
export const CONE_SIZE = 16;
export const LINE_STROKE_WIDTH = 3;
export const ARROW_POINTER_LENGTH = 12;
export const ARROW_POINTER_WIDTH = 10;

// Colors for elements
export const TEAM_COLORS = {
  home: '#3B82F6', // Blue
  away: '#EF4444', // Red
} as const;

export const CONE_COLORS = {
  orange: '#F97316',
  yellow: '#EAB308',
  blue: '#3B82F6',
  red: '#EF4444',
  white: '#FFFFFF',
} as const;

export const DEFAULT_CONE_COLOR = CONE_COLORS.orange;
