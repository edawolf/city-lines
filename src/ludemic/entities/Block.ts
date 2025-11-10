import { Container, Graphics } from "pixi.js";

import type { Primitive } from "../primitives/Primitive";
import type { EntityConfig } from "../config/types";

/**
 * Block Entity
 *
 * A rectangular destructible block that serves as a primitive container.
 * Visual representation is a rectangle with border.
 * Behavior is entirely driven by attached primitives.
 *
 * Common primitive compositions:
 * - DestroyCollision: Destroy when hit by ball
 * - PointsOnDestroy: Award points on destruction
 * - ParticleEmitter: Explosion effect (Phase 4)
 * - SoundTrigger: Break sound (Phase 4)
 * - HealthSystem: Multi-hit blocks (Phase 5+)
 *
 * Demonstrates reusability:
 * Same DestroyCollision primitive could be used for:
 * - Breakable walls
 * - Enemies
 * - Collectible items
 */

export interface BlockConfig {
  width?: number;
  height?: number;
  color?: number;
}

export class Block extends Container {
  private primitives: Map<string, Primitive> = new Map();
  private graphics: Graphics;

  constructor(config: EntityConfig) {
    super();

    // Extract block-specific config with defaults
    const blockConfig = (config.config as BlockConfig) ?? {};
    const width = blockConfig.width ?? 60;
    const height = blockConfig.height ?? 30;
    const color = blockConfig.color ?? 0xff5722;

    // Create visual representation (rectangle with border)
    this.graphics = new Graphics()
      .rect(0, 0, width, height)
      .fill(color)
      .stroke({ width: 2, color: 0xffffff, alpha: 0.5 });

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
