import { Container, Graphics } from "pixi.js";

import type { Primitive } from "../primitives/Primitive";

import type { EntityConfig } from "../config/types";

/**
 * Paddle Entity
 *
 * A simple rectangular paddle that serves as a primitive container.
 * Visual representation is basic (rectangle with configurable size/color).
 * Behavior is entirely driven by attached primitives.
 *
 * Common primitive compositions:
 * - InputMovement: Player-controlled horizontal movement
 * - BounceCollision: Reflects balls on contact
 * - SoundTrigger: Plays sound on ball bounce
 *
 * This demonstrates the key architectural principle:
 * Entities are just visual shells + primitive containers.
 * All behavior comes from primitives, not the entity itself.
 */

export interface PaddleConfig {
  width?: number;
  height?: number;
  color?: number;
}

export class Paddle extends Container {
  private primitives: Map<string, Primitive> = new Map();
  private graphics: Graphics;

  constructor(config: EntityConfig) {
    super();

    // Extract paddle-specific config with defaults
    const paddleConfig = (config.config as PaddleConfig) ?? {};
    const width = paddleConfig.width ?? 100;
    const height = paddleConfig.height ?? 20;
    const color = paddleConfig.color ?? 0x4caf50;

    // Create visual representation (simple rectangle)
    this.graphics = new Graphics()
      .rect(0, 0, width, height)
      .fill(color)
      .stroke({ width: 3, color: 0xffffff });

    this.addChild(this.graphics);
  }

  /**
   * Attach a primitive to this entity
   * Primitives are stored by type name for easy lookup
   */
  addPrimitive(type: string, primitive: Primitive, config: any): void {
    primitive.init(this, config);
    this.primitives.set(type, primitive);
  }

  /**
   * Get a primitive by type name
   * Used for cross-primitive communication (e.g., collision accessing movement)
   */
  getPrimitive(type: string): Primitive | null {
    return this.primitives.get(type) ?? null;
  }

  /**
   * Update all attached primitives
   * Called every frame by the game container
   */
  update(deltaTime: number): void {
    this.primitives.forEach((primitive) => primitive.update(deltaTime));
  }

  /**
   * Clean up all primitives when entity is destroyed
   */
  override destroy(): void {
    this.primitives.forEach((primitive) => primitive.destroy());
    this.primitives.clear();
    super.destroy();
  }
}
