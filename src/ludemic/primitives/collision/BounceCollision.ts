import type { Container } from "pixi.js";

import { Primitive, type PrimitiveConfig } from "../Primitive";
import type { GameContainer } from "../../GameBuilder";
import type { LinearMovement } from "../movement/LinearMovement";

/**
 * BounceCollision Primitive
 *
 * LISA Instructions: COLLIDE + MOD (velocity)
 *
 * Implements physics-based collision detection with velocity reflection.
 * Detects collisions with screen bounds and other entities, then modifies
 * velocity to simulate bouncing.
 *
 * Mechanical Layer:
 * - COLLIDE: Detect intersection with bounds/targets
 * - MOD: Reverse velocity component on collision
 *
 * Strategic Layer (implicit):
 * - RISK: Missing paddle = ball lost (game over threat)
 * - TEST: Player must position paddle correctly
 *
 * Configuration Options:
 * - bounds: Screen boundaries for wall collision
 * - bounceDamping: Energy loss on bounce (0.0-1.0, default 1.0 = perfect)
 * - targets: Entity IDs to check collision with (e.g., ["paddle"])
 * - radius: Collision radius (default: estimate from entity size)
 */

export interface BounceCollisionConfig extends PrimitiveConfig {
  bounds: { left: number; right: number; top: number; bottom: number };
  bounceDamping?: number;
  targets?: string[];
  radius?: number;
}

export class BounceCollision extends Primitive {
  private entity!: Container;
  private config!: BounceCollisionConfig;
  private game!: GameContainer;
  private radius: number = 10;

  init(entity: Container, config: BounceCollisionConfig): void {
    this.entity = entity;
    this.config = config;
    // Note: entity.parent is null during init, we'll get it lazily in update()

    // Calculate radius from entity bounds if not specified
    if (config.radius) {
      this.radius = config.radius;
    } else {
      const bounds = entity.getBounds();
      this.radius = Math.max(bounds.width, bounds.height) / 2;
    }
  }

  update(_deltaTime: number): void {
    // Lazily get game container (parent is set after init)
    if (!this.game && this.entity.parent) {
      this.game = this.entity.parent as unknown as GameContainer;

    }

    // Get movement primitive to access/modify velocity
    const movement = this.getMovementPrimitive();
    if (!movement) {

      return;
    }

    const vel = movement.getVelocity();
    const pos = { x: this.entity.x, y: this.entity.y };
    const damping = this.config.bounceDamping ?? 1.0;

    // Check wall collisions
    let bounced = false;

    // Left/right walls
    if (pos.x - this.radius < this.config.bounds.left) {
      movement.setVelocity(Math.abs(vel.x) * damping, vel.y);
      this.entity.x = this.config.bounds.left + this.radius;
      bounced = true;
    } else if (pos.x + this.radius > this.config.bounds.right) {
      movement.setVelocity(-Math.abs(vel.x) * damping, vel.y);
      this.entity.x = this.config.bounds.right - this.radius;
      bounced = true;
    }

    // Top/bottom walls
    if (pos.y - this.radius < this.config.bounds.top) {
      movement.setVelocity(vel.x, Math.abs(vel.y) * damping);
      this.entity.y = this.config.bounds.top + this.radius;
      bounced = true;
    } else if (pos.y + this.radius > this.config.bounds.bottom) {
      movement.setVelocity(vel.x, -Math.abs(vel.y) * damping);
      this.entity.y = this.config.bounds.bottom - this.radius;
      bounced = true;
    }

    // Check collision with target entities (e.g., paddle)
    if (this.config.targets && this.game) {
      this.config.targets.forEach((targetId) => {
        const target = this.game.getEntityById(targetId);
        if (target) {
          const collision = this.checkCollision(target);
          if (collision) {
            console.log(`[BounceCollision] Ball hit ${targetId}!`, {
              ballPos: { x: this.entity.x, y: this.entity.y },
              targetBounds: target.getBounds(),
            });
            this.bounceOffTarget(target, movement);
            bounced = true;
          }
        } else {

        }
      });
    }

    // Emit bounce event for other systems (juice, sound, etc.)
    if (bounced && this.game) {
      this.game.emitGame("ball_bounce", this.entity);
    }
  }

  /**
   * Get the LinearMovement primitive from same entity
   */
  private getMovementPrimitive(): LinearMovement | null {
    // Access sibling primitive via entity
    return (this.entity as any).getPrimitive?.("LinearMovement") ?? null;
  }

  /**
   * Check AABB collision with another entity
   */
  private checkCollision(target: Container): boolean {
    const bounds = this.entity.getBounds();
    const targetBounds = target.getBounds();

    return (
      bounds.x < targetBounds.x + targetBounds.width &&
      bounds.x + bounds.width > targetBounds.x &&
      bounds.y < targetBounds.y + targetBounds.height &&
      bounds.y + bounds.height > targetBounds.y
    );
  }

  /**
   * Calculate bounce angle based on hit position on target
   */
  private bounceOffTarget(target: Container, movement: LinearMovement): void {
    const vel = movement.getVelocity();
    const damping = this.config.bounceDamping ?? 1.0;

    // Get relative hit position (-1 to 1, where 0 is center)
    const targetBounds = target.getBounds();
    const targetCenterX = targetBounds.x + targetBounds.width / 2;
    const relativeHitX =
      (this.entity.x - targetCenterX) / (targetBounds.width / 2);

    // Calculate bounce angle based on where ball hit paddle
    // Center hit = straight up, edge hits = angled
    const maxBounceAngle = Math.PI / 3; // 60 degrees max
    const bounceAngle = relativeHitX * maxBounceAngle;

    // Calculate new velocity maintaining speed but changing direction
    const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2);
    const newVelX = Math.sin(bounceAngle) * speed;
    const newVelY = -Math.abs(Math.cos(bounceAngle) * speed); // Always bounce up

    movement.setVelocity(newVelX * damping, newVelY * damping);

    // Push ball away from paddle to prevent stuck
    const targetTop = targetBounds.y;
    this.entity.y = targetTop - this.radius - 2;
  }

  destroy(): void {
    // No cleanup needed
  }
}
