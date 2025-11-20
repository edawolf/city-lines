import { Container } from "pixi.js";
import { Primitive } from "../Primitive";
import type { PrimitiveConfig } from "../Primitive";

/**
 * ComboMultiplier Primitive (LISA: EXTEND + ESCALATE)
 *
 * Rewards consecutive actions with increasing score multipliers.
 * Combo expires if too much time passes between actions.
 *
 * LISA Mapping:
 * - EXTEND: Extend gameplay through combo chains
 * - ESCALATE: Increase rewards over time
 */
export interface ComboMultiplierConfig extends PrimitiveConfig {
  comboWindow: number; // Seconds between hits to maintain combo
  baseMultiplier: number; // Starting multiplier (e.g., 1.0 = 1x)
  maxMultiplier: number; // Maximum multiplier cap (e.g., 5.0 = 5x)
  incrementPerHit: number; // How much to increase per hit (e.g., 0.2 = +0.2x)
  listenForEvent: string; // Event to listen for (e.g., "block_destroyed")
}

export class ComboMultiplier extends Primitive {
  private entity!: Container;
  private config!: ComboMultiplierConfig;
  private game!: Container & {
    onGame: (event: string, fn: (...args: unknown[]) => void) => void;
    offGame: (event: string, fn: (...args: unknown[]) => void) => void;
    emitGame: (event: string, ...args: unknown[]) => void;
    setScoreMultiplier?: (multiplier: number) => void;
  };

  private currentCombo = 0;
  private currentMultiplier = 1.0;
  private lastHitTime = 0;

  init(entity: Container, config: ComboMultiplierConfig): void {
    this.entity = entity;
    this.config = config;
    this.game = entity.parent as Container & {
      onGame: (event: string, fn: (...args: unknown[]) => void) => void;
      offGame: (event: string, fn: (...args: unknown[]) => void) => void;
      emitGame: (event: string, ...args: unknown[]) => void;
      setScoreMultiplier?: (multiplier: number) => void;
    };

    // Initialize multiplier
    this.currentMultiplier = this.config.baseMultiplier;

    // Listen for hit events
    this.game.onGame(this.config.listenForEvent, this.handleHit);
  }

  update(): void {
    // Check if combo expired (using real time, not deltaTime)
    if (this.currentCombo > 0 && this.lastHitTime > 0) {
      const now = Date.now();
      const timeSinceLastHit = (now - this.lastHitTime) / 1000;

      if (timeSinceLastHit > this.config.comboWindow) {
        this.resetCombo();
      }
    }
  }

  /**
   * Handle hit event - increment combo and multiplier
   */
  private handleHit = () => {
    this.currentCombo++;
    this.lastHitTime = Date.now();

    // Calculate new multiplier
    this.currentMultiplier = Math.min(
      this.config.baseMultiplier +
        (this.currentCombo - 1) * this.config.incrementPerHit,
      this.config.maxMultiplier,
    );

    // Update game's score multiplier
    if (this.game.setScoreMultiplier) {
      this.game.setScoreMultiplier(this.currentMultiplier);
    }

    // Emit combo updated event
    this.game.emitGame("combo_updated", {
      combo: this.currentCombo,
      multiplier: this.currentMultiplier,
    });

    console.log(
      `[ComboMultiplier] Combo: ${this.currentCombo}x, Multiplier: ${this.currentMultiplier.toFixed(1)}x`,
    );
  };

  /**
   * Reset combo when window expires
   */
  private resetCombo(): void {
    if (this.currentCombo > 0) {
      // Combo is active - will be reset below
    }

    this.currentCombo = 0;
    this.currentMultiplier = this.config.baseMultiplier;
    this.lastHitTime = 0;

    // Reset game's score multiplier
    if (this.game.setScoreMultiplier) {
      this.game.setScoreMultiplier(this.config.baseMultiplier);
    }

    // Emit combo reset event
    this.game.emitGame("combo_reset");
  }

  /**
   * Get current combo count (for debugging)
   */
  getCombo(): number {
    return this.currentCombo;
  }

  /**
   * Get current multiplier (for debugging)
   */
  getMultiplier(): number {
    return this.currentMultiplier;
  }

  destroy(): void {
    this.game.offGame(this.config.listenForEvent, this.handleHit);
  }
}
