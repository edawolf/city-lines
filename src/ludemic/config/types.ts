/**
 * Configuration types for the Ludemic Game Builder system
 *
 * Games are defined via JSON configuration files that specify:
 * - Entities (visual objects with behavior)
 * - Primitives (LISA instructions attached to entities)
 * - Layouts (procedural entity generation)
 * - UI (non-game interface elements)
 */

export interface PrimitiveConfig {
  type: string; // Primitive class name (e.g., "InputMovement")
  config: Record<string, any>; // Primitive-specific configuration
}

export interface EntityConfig {
  id?: string; // Unique identifier for entity lookup
  type: string; // Entity class name (e.g., "Paddle", "Ball", "Block")
  position: { x: number; y: number };
  config: Record<string, any>; // Entity-specific visual/behavioral config
  primitives?: PrimitiveConfig[]; // LISA primitives attached to this entity
}

export interface LayoutConfig {
  type: string; // Layout generator name (e.g., "BlockGrid")
  config: Record<string, any>; // Layout-specific parameters
}

export interface UIConfig {
  type: string; // UI component name (e.g., "ScoreDisplay")
  position: { x: number; y: number };
  config?: Record<string, any>;
}

export interface GameConfig {
  entities: EntityConfig[]; // Manually placed entities
  layouts?: LayoutConfig[]; // Procedurally generated entities
  ui?: UIConfig[]; // UI elements
  viewport: {
    width: number;
    height: number;
  };
}
