import type { Container } from "pixi.js";

/**
 * Base configuration interface for all primitives
 * Each primitive extends this with their specific config properties
 */
export interface PrimitiveConfig {
  [key: string]: any;
}

/**
 * Base Primitive class - implements a single LISA instruction or small set of related instructions
 *
 * Design Philosophy:
 * - Each primitive does ONE thing (single responsibility)
 * - Primitives are composable (multiple primitives on one entity)
 * - Configuration-driven (behavior controlled via JSON config)
 * - LISA-mapped (each primitive implements specific LISA instructions)
 *
 * Example LISA mappings:
 * - InputMovement: INPUT + MOVE
 * - BounceCollision: COLLIDE + MOD (velocity)
 * - PointsOnDestroy: REWARD
 * - ParticleEmitter: JUICE + DISPLAY
 */
export abstract class Primitive {
  /**
   * Initialize the primitive with its parent entity and configuration
   * Called once when the entity is created
   */
  abstract init(entity: Container, config: PrimitiveConfig): void;

  /**
   * Update the primitive's behavior each frame
   * @param deltaTime - Time elapsed since last frame (in seconds)
   */
  abstract update(deltaTime: number): void;

  /**
   * Clean up resources when the primitive is destroyed
   * Remove event listeners, clear intervals, etc.
   */
  abstract destroy(): void;
}
