import { Container } from "pixi.js";
import { Primitive } from "../Primitive";
import type { PrimitiveConfig } from "../Primitive";

/**
 * HealthSystem Primitive (LISA: STATE + MANAGE)
 *
 * Tracks entity health/lives and responds to damage events.
 * Emits events when health changes or entity dies.
 *
 * LISA Mapping:
 * - STATE: Track health state
 * - MANAGE: Handle health changes and death
 */
export interface HealthSystemConfig extends PrimitiveConfig {
  maxHealth: number; // Maximum health/lives
  startHealth?: number; // Starting health (defaults to maxHealth)
  damageEvent: string; // Event that causes damage (e.g., "player_hit")
  deathEvent: string; // Event to emit on death (e.g., "player_died")
}

export class HealthSystem extends Primitive {
  private entity!: Container;
  private config!: HealthSystemConfig;
  private game!: Container & {
    onGame: (event: string, fn: (...args: unknown[]) => void) => void;
    offGame: (event: string, fn: (...args: unknown[]) => void) => void;
    emitGame: (event: string, ...args: unknown[]) => void;
  };

  private currentHealth: number;

  init(entity: Container, config: HealthSystemConfig): void {
    this.entity = entity;
    this.config = config;
    this.game = entity.parent as Container & {
      onGame: (event: string, fn: (...args: unknown[]) => void) => void;
      offGame: (event: string, fn: (...args: unknown[]) => void) => void;
      emitGame: (event: string, ...args: unknown[]) => void;
    };

    // Initialize health
    this.currentHealth = this.config.startHealth ?? this.config.maxHealth;

    // Listen for damage events
    this.game.onGame(this.config.damageEvent, this.takeDamage);

  }

  update(): void {
    // No per-frame update needed
  }

  /**
   * Take damage and emit health changed event
   */
  private takeDamage = (amount: number = 1) => {
    const previousHealth = this.currentHealth;
    this.currentHealth = Math.max(0, this.currentHealth - amount);

    // Emit health changed event
    this.game.emitGame("health_changed", {
      current: this.currentHealth,
      max: this.config.maxHealth,
      delta: previousHealth - this.currentHealth,
    });

    // Check for death
    if (this.currentHealth <= 0 && previousHealth > 0) {

      this.game.emitGame(this.config.deathEvent);
    }
  };

  /**
   * Get current health (for debugging)
   */
  getHealth(): number {
    return this.currentHealth;
  }

  /**
   * Get max health (for debugging)
   */
  getMaxHealth(): number {
    return this.config.maxHealth;
  }

  /**
   * Heal (add health)
   */
  heal(amount: number): void {
    const previousHealth = this.currentHealth;
    this.currentHealth = Math.min(
      this.config.maxHealth,
      this.currentHealth + amount,
    );

    if (this.currentHealth !== previousHealth) {
      this.game.emitGame("health_changed", {
        current: this.currentHealth,
        max: this.config.maxHealth,
        delta: this.currentHealth - previousHealth,
      });
    }
  }

  /**
   * Reset health to starting value
   */
  reset(): void {
    this.currentHealth = this.config.startHealth ?? this.config.maxHealth;
    this.game.emitGame("health_changed", {
      current: this.currentHealth,
      max: this.config.maxHealth,
      delta: 0,
    });
  }

  destroy(): void {
    this.game.offGame(this.config.damageEvent, this.takeDamage);
  }
}
