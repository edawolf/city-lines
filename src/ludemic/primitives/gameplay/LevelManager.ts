import { Container } from "pixi.js";
import { Primitive } from "../Primitive";
import type { PrimitiveConfig } from "../Primitive";

/**
 * LevelManager Primitive (LISA: MANAGE + PROGRESS)
 *
 * Manages level progression and block tracking.
 * Detects when all blocks are cleared and triggers level complete.
 *
 * LISA Mapping:
 * - MANAGE: Track game state and progression
 * - PROGRESS: Advance through levels
 */
export interface LevelManagerConfig extends PrimitiveConfig {
  blockEntityType: string; // Entity type to track (e.g., "Block")
  levelCompleteEvent: string; // Event to emit when level cleared
  blockDestroyedEvent: string; // Event to listen for block destruction
  startLevel?: number; // Starting level number (default: 1)
}

export class LevelManager extends Primitive {
  private entity!: Container;
  private config!: LevelManagerConfig;
  private game!: Container & {
    onGame: (event: string, fn: (...args: unknown[]) => void) => void;
    offGame: (event: string, fn: (...args: unknown[]) => void) => void;
    emitGame: (event: string, ...args: unknown[]) => void;
    getEntitiesByType: (type: string) => Container[];
  };

  private currentLevel: number;
  private blocksCleared = 0;

  init(entity: Container, config: LevelManagerConfig): void {
    this.entity = entity;
    this.config = config;
    this.game = entity.parent as Container & {
      onGame: (event: string, fn: (...args: unknown[]) => void) => void;
      offGame: (event: string, fn: (...args: unknown[]) => void) => void;
      emitGame: (event: string, ...args: unknown[]) => void;
      getEntitiesByType: (type: string) => Container[];
    };

    this.currentLevel = this.config.startLevel ?? 1;

    // Listen for block destruction
    this.game.onGame(this.config.blockDestroyedEvent, this.onBlockDestroyed);

    console.log(`[LevelManager] Initialized at level ${this.currentLevel}`);
  }

  update(): void {
    // Check if level is complete
    const blocks = this.game.getEntitiesByType(this.config.blockEntityType);

    if (blocks.length === 0 && this.blocksCleared > 0) {
      console.log(
        `[LevelManager] Level ${this.currentLevel} complete! ${this.blocksCleared} blocks cleared`,
      );

      this.game.emitGame(this.config.levelCompleteEvent, {
        level: this.currentLevel,
        blocksCleared: this.blocksCleared,
      });

      // Advance to next level
      this.currentLevel++;
      this.blocksCleared = 0;

      console.log(`[LevelManager] Advanced to level ${this.currentLevel}`);
    }
  }

  /**
   * Track block destruction
   */
  private onBlockDestroyed = () => {
    this.blocksCleared++;
  };

  /**
   * Get current level (for debugging)
   */
  getLevel(): number {
    return this.currentLevel;
  }

  /**
   * Get blocks cleared this level
   */
  getBlocksCleared(): number {
    return this.blocksCleared;
  }

  /**
   * Reset to starting level
   */
  reset(): void {
    this.currentLevel = this.config.startLevel ?? 1;
    this.blocksCleared = 0;
    console.log(`[LevelManager] Reset to level ${this.currentLevel}`);
  }

  destroy(): void {
    this.game.offGame(this.config.blockDestroyedEvent, this.onBlockDestroyed);
  }
}
