import type { Container } from "pixi.js";

import { Primitive, type PrimitiveConfig } from "../Primitive";

/**
 * LinearMovement Primitive
 *
 * LISA Instructions: MOVE
 *
 * Implements constant velocity movement - object moves in a straight line
 * at a fixed speed until velocity is changed by another primitive (e.g., collision).
 *
 * Mechanical Layer:
 * - MOVE: Apply velocity to entity position every frame
 *
 * Use Cases:
 * - Ball/projectile movement (Breakout, Space Invaders)
 * - Enemy patrol paths
 * - Scrolling backgrounds
 * - Constant-speed objects
 *
 * Configuration Options:
 * - velocity: { x, y } - Movement speed and direction
 * - maxSpeed: Optional speed cap to prevent runaway acceleration
 */

export interface LinearMovementConfig extends PrimitiveConfig {
  velocity: { x: number; y: number };
  maxSpeed?: number;
}

export class LinearMovement extends Primitive {
  private entity!: Container;
  private config!: LinearMovementConfig;
  private tuningUnsubscribe?: () => void;
  private initialSpeed: number = 0;

  init(entity: Container, config: LinearMovementConfig): void {
    this.entity = entity;
    this.config = config;

    // Store initial speed for tuning adjustments
    this.initialSpeed = Math.sqrt(
      this.config.velocity.x ** 2 + this.config.velocity.y ** 2,
    );

    this.setupTuning();
  }

  private setupTuning(): void {
    // Listen for tuning system parameter changes
    const game = this.entity.parent as any;
    if (game?.tuningSystem) {
      const handleParameterChange = ({
        key,
        value,
      }: {
        key: string;
        value: any;
      }) => {
        if (key === "ball_initial_speed") {
          // Recalculate velocity maintaining direction but changing magnitude
          const currentSpeed = Math.sqrt(
            this.config.velocity.x ** 2 + this.config.velocity.y ** 2,
          );
          if (currentSpeed > 0) {
            const scale = value / currentSpeed;
            this.config.velocity.x *= scale;
            this.config.velocity.y *= scale;
          }
          this.initialSpeed = value;

        } else if (key === "ball_max_speed_multiplier") {
          if (this.config.maxSpeed) {
            this.config.maxSpeed = this.initialSpeed * value;

          }
        }
      };

      game.tuningSystem.on("parameterChanged", handleParameterChange);

      // Store unsubscribe function
      this.tuningUnsubscribe = () => {
        game.tuningSystem.off("parameterChanged", handleParameterChange);
      };
    }
  }

  update(deltaTime: number): void {
    // Apply velocity (deltaTime is in seconds, velocity is in pixels/second)
    this.entity.x += this.config.velocity.x * deltaTime;
    this.entity.y += this.config.velocity.y * deltaTime;

    // Apply max speed constraint if set
    if (this.config.maxSpeed) {
      const speed = Math.sqrt(
        this.config.velocity.x ** 2 + this.config.velocity.y ** 2,
      );

      if (speed > this.config.maxSpeed) {
        const scale = this.config.maxSpeed / speed;
        this.config.velocity.x *= scale;
        this.config.velocity.y *= scale;
      }
    }
  }

  /**
   * Get current velocity (for collision/other primitives to read)
   */
  getVelocity(): { x: number; y: number } {
    return { ...this.config.velocity };
  }

  /**
   * Set new velocity (for collision/other primitives to modify)
   */
  setVelocity(x: number, y: number): void {
    this.config.velocity.x = x;
    this.config.velocity.y = y;
  }

  /**
   * Add to velocity (for acceleration effects)
   */
  addVelocity(dx: number, dy: number): void {
    this.config.velocity.x += dx;
    this.config.velocity.y += dy;
  }

  destroy(): void {
    // Unsubscribe from tuning changes
    if (this.tuningUnsubscribe) {
      this.tuningUnsubscribe();
    }
  }
}
