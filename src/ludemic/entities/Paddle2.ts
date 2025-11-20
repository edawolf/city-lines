import { Container, Graphics } from "pixi.js";

import type { Primitive } from "../primitives/Primitive";
import type { EntityConfig } from "../config/types";

/**
 * Paddle2 - Exact copy of Ball.ts to test rendering
 */

export interface Paddle2Config {
  radius?: number;
  color?: number;
}

export class Paddle2 extends Container {
  private primitives: Map<string, Primitive> = new Map();
  private graphics: Graphics;

  constructor(config: EntityConfig) {
    super();

    // Extract config with defaults
    const paddle2Config = (config.config as Paddle2Config) ?? {};
    const radius = paddle2Config.radius ?? 50; // Big circle
    const color = paddle2Config.color ?? 0x00ff00; // Green

    // Create visual representation (circle) - EXACT same as Ball
    this.graphics = new Graphics()
      .circle(0, 0, radius)
      .fill(color)
      .stroke({ width: 3, color: 0xffff00 }); // Yellow stroke

    this.addChild(this.graphics);
  }

  addPrimitive(type: string, primitive: Primitive, config: unknown): void {
    primitive.init(this, config);
    this.primitives.set(type, primitive);
  }

  getPrimitive(type: string): Primitive | null {
    return this.primitives.get(type) ?? null;
  }

  update(deltaTime: number): void {
    this.primitives.forEach((primitive) => primitive.update(deltaTime));
  }

  override destroy(): void {
    this.primitives.forEach((primitive) => primitive.destroy());
    this.primitives.clear();
    super.destroy();
  }
}
