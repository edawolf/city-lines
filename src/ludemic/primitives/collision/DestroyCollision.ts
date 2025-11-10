import type { Container } from "pixi.js";

import { Primitive, type PrimitiveConfig } from "../Primitive";
import type { GameContainer } from "../../GameBuilder";

/**
 * DestroyCollision Primitive
 *
 * LISA Instructions: COLLIDE + KILL
 *
 * Implements entity destruction on collision.
 * Detects collision with specified entity types and destroys either
 * this entity, the target, or both based on configuration.
 *
 * Mechanical Layer:
 * - COLLIDE: Detect intersection with other entities
 * - KILL: Remove entity from game (destroy)
 *
 * Strategic Layer (implicit):
 * - REWARD: Clearing blocks gives satisfaction
 * - TEST: Requires accurate aiming
 * - LAYER: Adds complexity to gameplay
 *
 * Configuration Options:
 * - destroyOnHit: Destroy THIS entity when hit
 * - destroyTarget: Also destroy the target entity
 * - triggerOnEntityTypes: Only trigger on these entity types
 * - onDestroy: Event name to emit when destroyed
 */

export interface DestroyCollisionConfig extends PrimitiveConfig {
  destroyOnHit?: boolean;
  destroyTarget?: boolean;
  triggerOnEntityTypes?: string[]; // Legacy naming
  entityTypes?: string[]; // New naming (preferred)
  onDestroy?: string; // Legacy naming
  destroyEvent?: string; // New naming (preferred)
}

export class DestroyCollision extends Primitive {
  private entity!: Container;
  private config!: DestroyCollisionConfig;
  private game!: GameContainer;
  private destroyed = false;

  init(entity: Container, config: DestroyCollisionConfig): void {
    this.entity = entity;
    // Normalize config to support both naming conventions
    this.config = {
      ...config,
      triggerOnEntityTypes:
        config.entityTypes ?? config.triggerOnEntityTypes ?? [],
      onDestroy: config.destroyEvent ?? config.onDestroy,
      destroyOnHit: config.destroyOnHit ?? true, // Default to true
    };
    // Game container will be set lazily in update
  }

  update(deltaTime: number): void {
    // Skip if already destroyed
    if (this.destroyed) return;

    // Lazily get game container
    if (!this.game && this.entity.parent) {
      this.game = this.entity.parent as GameContainer;
    }

    if (!this.game) return;

    // Check collision with specified entity types
    const entityTypes = this.config.triggerOnEntityTypes ?? [];
    entityTypes.forEach((entityType) => {
      const entities = this.game.getEntitiesByType(entityType);

      entities.forEach((other) => {
        if (other !== this.entity && this.checkCollision(other)) {
          this.handleCollision(other);
        }
      });
    });
  }

  /**
   * Check AABB collision with another entity
   */
  private checkCollision(other: Container): boolean {
    const bounds = this.entity.getBounds();
    const otherBounds = other.getBounds();

    return (
      bounds.x < otherBounds.x + otherBounds.width &&
      bounds.x + bounds.width > otherBounds.x &&
      bounds.y < otherBounds.y + otherBounds.height &&
      bounds.y + bounds.height > otherBounds.y
    );
  }

  /**
   * Handle collision - destroy entities and emit events
   */
  private handleCollision(target: Container): void {
    // Emit event BEFORE destroying (so other systems can react)
    if (this.config.onDestroy) {
      this.game.emit(this.config.onDestroy, this.entity);
    }

    // Destroy this entity
    if (this.config.destroyOnHit) {
      this.destroyed = true;
      // Defer removal to avoid modifying array during iteration
      setTimeout(() => {
        if (this.game) {
          this.game.removeEntity(this.entity);
        }
      }, 0);
    }

    // Destroy target entity
    if (this.config.destroyTarget) {
      setTimeout(() => {
        if (this.game) {
          this.game.removeEntity(target);
        }
      }, 0);
    }
  }

  destroy(): void {
    this.destroyed = true;
  }
}
