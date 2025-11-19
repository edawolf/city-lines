import { Container } from "pixi.js";
import { Primitive } from "../Primitive";
import type { PrimitiveConfig } from "../Primitive";

/**
 * BoundaryTrigger Primitive (LISA: DETECT + TRIGGER)
 *
 * Detects when entity crosses a boundary and triggers events.
 * Used for out-of-bounds detection (e.g., ball falling off screen).
 *
 * LISA Mapping:
 * - DETECT: Monitor entity position
 * - TRIGGER: Emit event when boundary crossed
 */
export interface BoundaryTriggerConfig extends PrimitiveConfig {
  boundary: "top" | "bottom" | "left" | "right"; // Which boundary to check
  threshold: number; // Position threshold
  triggerEvent: string; // Event to emit when crossed
  resetPosition?: { x: number; y: number }; // Optional: reset entity to this position after trigger
  continuous?: boolean; // If true, triggers every frame while out of bounds (default: false)
}

export class BoundaryTrigger extends Primitive {
  private entity!: Container;
  private config!: BoundaryTriggerConfig;
  private game!: Container & {
    emitGame: (event: string, ...args: unknown[]) => void;
  };
  private hasTriggered = false;

  init(entity: Container, config: BoundaryTriggerConfig): void {
    this.entity = entity;
    this.config = config;
    this.game = entity.parent as Container & {
      emitGame: (event: string, ...args: unknown[]) => void;
    };

  }

  update(): void {
    // Check if entity crossed boundary
    const crossed = this.checkBoundary();

    if (crossed) {
      // Only trigger once unless continuous mode
      if (!this.hasTriggered || this.config.continuous) {

        this.game.emitGame(this.config.triggerEvent, this.entity);
        this.hasTriggered = true;

        // Reset position if configured
        if (this.config.resetPosition) {
          this.entity.position.set(
            this.config.resetPosition.x,
            this.config.resetPosition.y,
          );

          // Also reset velocity if entity has LinearMovement primitive
          const movement = (this.entity as any).getPrimitive?.(
            "LinearMovement",
          );
          if (movement && movement.setVelocity) {
            // Reset to initial upward velocity
            movement.setVelocity(200, -200);
          }

          console.log(
            `[BoundaryTrigger] Entity reset to (${this.config.resetPosition.x}, ${this.config.resetPosition.y})`,
          );
        }
      }
    } else {
      // Reset trigger flag when back in bounds
      this.hasTriggered = false;
    }
  }

  /**
   * Check if entity crossed the configured boundary
   */
  private checkBoundary(): boolean {
    const pos = this.entity.position;

    switch (this.config.boundary) {
      case "top":
        return pos.y < this.config.threshold;
      case "bottom":
        return pos.y > this.config.threshold;
      case "left":
        return pos.x < this.config.threshold;
      case "right":
        return pos.x > this.config.threshold;
      default:
        return false;
    }
  }

  /**
   * Manually reset the trigger flag
   */
  resetTrigger(): void {
    this.hasTriggered = false;
  }

  destroy(): void {
    // No cleanup needed
  }
}
