import { Container, Graphics } from "pixi.js";

import type { Primitive } from "../primitives/Primitive";
import type { EntityConfig } from "../config/types";

/**
 * Ball Entity
 *
 * A circular projectile that serves as a primitive container.
 * Visual representation is a simple circle with configurable size/color.
 * Behavior is entirely driven by attached primitives.
 *
 * Common primitive compositions:
 * - LinearMovement: Constant velocity movement
 * - BounceCollision: Reflects off walls and paddle
 * - ParticleEmitter: Trail effect (Phase 4)
 * - SoundTrigger: Bounce sound (Phase 4)
 *
 * Demonstrates primitive reusability:
 * The same LinearMovement used here could be used for:
 * - Bullets in a shooter
 * - Enemy projectiles
 * - Moving platforms
 */

export interface BallConfig {
  radius?: number;
  color?: number;
}

export class Ball extends Container {
  private primitives: Map<string, Primitive> = new Map();
  private graphics: Graphics;

  constructor(config: EntityConfig) {
    super();

    // Extract ball-specific config with defaults
    const ballConfig = (config.config as BallConfig) ?? {};
    const radius = ballConfig.radius ?? 10;
    const color = ballConfig.color ?? 0xffffff;

    // Create visual representation (circle)
    this.graphics = new Graphics()
      .circle(0, 0, radius)
      .fill(color)
      .stroke({ width: 3, color: 0xff0000 }); // Bright red stroke for visibility

    this.addChild(this.graphics);
  }

  /**
   * Attach a primitive to this entity
   */
  addPrimitive(type: string, primitive: Primitive, config: any): void {
    primitive.init(this, config);
    this.primitives.set(type, primitive);
  }

  /**
   * Get a primitive by type name
   * Used for cross-primitive communication
   */
  getPrimitive(type: string): Primitive | null {
    return this.primitives.get(type) ?? null;
  }

  /**
   * Update all attached primitives
   */
  update(deltaTime: number): void {
    this.primitives.forEach((primitive) => primitive.update(deltaTime));
  }

  /**
   * Clean up all primitives
   */
  override destroy(): void {
    this.primitives.forEach((primitive) => primitive.destroy());
    this.primitives.clear();
    super.destroy();
  }
}
