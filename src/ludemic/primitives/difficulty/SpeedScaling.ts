import { Container } from "pixi.js";
import { Primitive } from "../Primitive";
import type { PrimitiveConfig } from "../Primitive";

/**
 * SpeedScaling Primitive (LISA: ESCALATE)
 *
 * Gradually increases entity speed over time or in response to events.
 * Creates escalating difficulty curve as game progresses.
 *
 * LISA Mapping:
 * - ESCALATE: Increase difficulty/intensity over time
 */
export interface SpeedScalingConfig extends PrimitiveConfig {
  targetEntityTypes: string[]; // Entity types to affect (e.g., ["Ball"])
  startSpeed?: number; // Initial speed multiplier (default: 1.0)
  maxSpeed: number; // Maximum speed cap
  increaseRate: number; // Speed increase per trigger event
  triggerOn: string; // Event that triggers scaling (e.g., "block_destroyed", "level_complete")
  scaleMode?: "multiply" | "add"; // How to apply speed increase (default: multiply)
}

export class SpeedScaling extends Primitive {
  private entity!: Container;
  private config!: SpeedScalingConfig;
  private game!: Container & {
    onGame: (event: string, fn: (...args: unknown[]) => void) => void;
    offGame: (event: string, fn: (...args: unknown[]) => void) => void;
    getEntitiesByType: (type: string) => Container[];
  };
  private currentSpeedMultiplier = 1.0;

  init(entity: Container, config: SpeedScalingConfig): void {
    this.entity = entity;
    this.config = config;
    this.game = entity.parent as Container & {
      onGame: (event: string, fn: (...args: unknown[]) => void) => void;
      offGame: (event: string, fn: (...args: unknown[]) => void) => void;
      getEntitiesByType: (type: string) => Container[];
    };

    // Initialize speed multiplier
    this.currentSpeedMultiplier = this.config.startSpeed ?? 1.0;

    // Listen for trigger event
    this.game.onGame(this.config.triggerOn, this.escalate);
  }

  update(): void {
    // No per-frame update needed - scaling happens on events
  }

  /**
   * Escalate speed when trigger event fires
   */
  private escalate = () => {
    // Increase speed multiplier
    if (this.config.scaleMode === "add") {
      this.currentSpeedMultiplier += this.config.increaseRate;
    } else {
      // Default: multiply
      this.currentSpeedMultiplier *= 1 + this.config.increaseRate;
    }

    // Cap at max speed
    if (this.currentSpeedMultiplier > this.config.maxSpeed) {
      this.currentSpeedMultiplier = this.config.maxSpeed;
    }

    // Apply speed to target entities
    this.config.targetEntityTypes.forEach((entityType) => {
      const entities = this.game.getEntitiesByType(entityType);

      entities.forEach((targetEntity) => {
        this.applySpeedToEntity(targetEntity);
      });
    });
  };

  /**
   * Apply current speed multiplier to an entity
   */
  private applySpeedToEntity(targetEntity: Container): void {
    // Look for LinearMovement primitive on the entity
    const movement = (
      targetEntity as Container & {
        getPrimitive?: (type: string) => {
          getVelocity?: () => { x: number; y: number };
          setVelocity?: (vx: number, vy: number) => void;
        };
      }
    ).getPrimitive?.("LinearMovement");

    if (movement && movement.getVelocity && movement.setVelocity) {
      const currentVel = movement.getVelocity();

      // Calculate current speed magnitude
      const currentSpeed = Math.sqrt(
        currentVel.x * currentVel.x + currentVel.y * currentVel.y,
      );

      // Calculate direction
      const angle = Math.atan2(currentVel.y, currentVel.x);

      // Apply multiplier
      const newSpeed = currentSpeed * this.currentSpeedMultiplier;

      // Cap at max speed if needed
      const cappedSpeed = Math.min(newSpeed, this.config.maxSpeed * 100); // Assume base speed ~100

      // Set new velocity
      movement.setVelocity(
        Math.cos(angle) * cappedSpeed,
        Math.sin(angle) * cappedSpeed,
      );
    }
  }

  /**
   * Get current speed multiplier (for debugging)
   */
  getSpeedMultiplier(): number {
    return this.currentSpeedMultiplier;
  }

  destroy(): void {
    this.game.offGame(this.config.triggerOn, this.escalate);
  }
}
