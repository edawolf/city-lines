import type { Container } from "pixi.js";

import { Primitive, type PrimitiveConfig } from "../Primitive";
import type { GameContainer } from "../../GameBuilder";

/**
 * PointsOnDestroy Primitive
 *
 * LISA Instructions: REWARD
 *
 * Awards points when a specific event is emitted (typically entity destruction).
 * Listens for game events and adds score to the game state.
 *
 * Mechanical Layer:
 * - Listen for events
 * - Modify score state
 *
 * Strategic Layer:
 * - REWARD: Positive reinforcement for player action
 * - TEACH: Shows which actions are valued
 * - INVEST: Building score creates investment in session
 *
 * Configuration Options:
 * - points: Amount of points to award
 * - listenForEvent: Event name to listen for (e.g., "block_destroyed")
 */

export interface PointsOnDestroyConfig extends PrimitiveConfig {
  points: number;
  listenForEvent?: string; // Legacy naming
  destroyEvent?: string; // New naming (preferred)
}

export class PointsOnDestroy extends Primitive {
  private entity!: Container;
  private config!: PointsOnDestroyConfig;
  private game!: GameContainer;
  private boundHandler!: (entity: Container) => void;

  init(entity: Container, config: PointsOnDestroyConfig): void {
    this.entity = entity;
    // Normalize config to support both naming conventions
    this.config = {
      ...config,
      listenForEvent:
        config.destroyEvent ?? config.listenForEvent ?? "destroyed",
    };

    // Create bound handler for cleanup
    this.boundHandler = this.handleDestroy.bind(this);
  }

  update(_deltaTime: number): void {
    // Lazily get game container and register event listener
    if (!this.game && this.entity.parent) {
      this.game = this.entity.parent as unknown as GameContainer;

      // Register event listener once we have the game container
      if (this.game) {
        this.game.onGame(this.config.listenForEvent, this.boundHandler);
      }
    }
  }

  /**
   * Handle destroy event - check if it's this entity and award points
   */
  private handleDestroy(destroyedEntity: Container): void {
    // Only award points if the destroyed entity is THIS entity
    if (destroyedEntity === this.entity && this.game) {
      this.game.addScore(this.config.points);
    }
  }

  destroy(): void {
    // Unregister event listener
    if (this.game && this.boundHandler) {
      this.game.offGame(this.config.listenForEvent, this.boundHandler);
    }
  }
}
