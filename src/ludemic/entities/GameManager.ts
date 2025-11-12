import { Container } from "pixi.js";
import type { EntityConfig } from "../config/types";
import type { Primitive } from "../primitives/Primitive";

/**
 * GameManager Entity
 *
 * An invisible entity that serves as a container for global game logic primitives.
 * Useful for attaching primitives that don't need a visual representation:
 * - Juice effects (ParticleEmitter, ScreenShake, SoundTrigger)
 * - Difficulty scaling
 * - Combo systems
 * - Level management
 *
 * This entity has no visual representation - it's purely a primitive container.
 */
export class GameManager extends Container {
  private primitives: Primitive[] = [];
  private primitiveMap = new Map<string, Primitive>();

  constructor(_config: EntityConfig) {
    super();

    // GameManager is invisible
    this.visible = false;

    // Will be positioned at (0, 0) typically
    // Primitives attached will still function even though entity is invisible
  }

  /**
   * Add a primitive to this entity
   */
  addPrimitive(name: string, primitive: Primitive, config: any): void {
    primitive.init(this, config);
    this.primitives.push(primitive);
    this.primitiveMap.set(name, primitive);
  }

  /**
   * Get a primitive by name
   */
  getPrimitive(name: string): Primitive | undefined {
    return this.primitiveMap.get(name);
  }

  /**
   * Update all primitives
   */
  update(deltaTime: number): void {
    this.primitives.forEach((primitive) => {
      primitive.update(deltaTime);
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.primitives.forEach((primitive) => {
      primitive.destroy();
    });
    this.primitives = [];
    this.primitiveMap.clear();
    super.destroy();
  }
}
