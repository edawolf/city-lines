import { Container } from "pixi.js";
import type { Primitive } from "../Primitive";
import type { PrimitiveConfig } from "../../config/types";
import type { GameContainer } from "../../GameBuilder";
import type { HeadlineDisplay } from "../../ui/HeadlineDisplay";

/**
 * HeadlineReveal Primitive
 *
 * LISA: REVEAL + REWARD
 *
 * Reveals news headlines when player completes puzzle connections.
 * This adds narrative meaning to the mechanical puzzle-solving.
 *
 * Mechanical Layer:
 * - REVEAL: Shows headline via HeadlineDisplay
 * - REWARD: Player sees story progress
 *
 * Narrative Layer:
 * - Each completed connection reveals infrastructure news
 * - Headlines tell story of city restoration
 * - Multiple headlines can be chained for progression
 *
 * Strategic Layer:
 * - Motivates player to complete connections
 * - Provides feedback for puzzle completion
 * - Creates sense of impact and purpose
 */

export interface HeadlineRevealConfig extends PrimitiveConfig {
  /**
   * Event to listen for (e.g., "path_complete")
   */
  triggerOn: string;

  /**
   * Array of headlines to reveal (cycles through them)
   */
  headlines: string[];

  /**
   * Index tracking which headline to show next
   * (internal state, not configured in JSON)
   */
  currentHeadlineIndex?: number;

  /**
   * Optional: Only trigger if specific landmarks connected
   */
  requiredLandmarks?: string[]; // Array of landmark IDs

  /**
   * Optional: Play sound on reveal
   */
  soundId?: string;

  /**
   * Optional: Enable/disable headline reveals (default: true)
   */
  enabled?: boolean;
}

export class HeadlineReveal implements Primitive {
  private entity!: Container;
  private config!: HeadlineRevealConfig;
  private game!: GameContainer;
  private headlineDisplay?: HeadlineDisplay;
  private currentHeadlineIndex = 0;

  init(entity: Container, config: HeadlineRevealConfig): void {
    this.entity = entity;
    this.config = config;
    this.game = entity.parent as unknown as GameContainer;
    this.currentHeadlineIndex = config.currentHeadlineIndex ?? 0;

    // Listen for completion event
    this.game.onGame(this.config.triggerOn, this.handleCompletion);

  }

  /**
   * Handle puzzle completion - reveal next headline
   */
  private handleCompletion = (data?: any) => {
    // Check if headline reveals are disabled
    if (this.config.enabled === false) {

      return;
    }

    // Validate landmark requirements if specified
    if (this.config.requiredLandmarks) {
      const valid = this.validateLandmarks(data);
      if (!valid) {

        return;
      }
    }

    // Get headline display from game
    this.headlineDisplay = this.game.getHeadlineDisplay();
    if (!this.headlineDisplay) {

      return;
    }

    // Get next headline
    const headline = this.getNextHeadline();
    if (!headline) {

      return;
    }

    // Show headline
    this.headlineDisplay.show(headline);

    // Play sound if configured
    if (this.config.soundId) {
      // TODO: Integrate with audio system

    }

    // Emit reveal event for other systems (e.g., particles)
    this.game.emitGame("headline_revealed", {
      headline,
      index: this.currentHeadlineIndex - 1,
    });
  };

  /**
   * Get next headline in sequence
   */
  private getNextHeadline(): string | null {
    if (this.currentHeadlineIndex >= this.config.headlines.length) {
      return null; // All headlines revealed
    }

    const headline = this.config.headlines[this.currentHeadlineIndex];
    this.currentHeadlineIndex++;
    return headline;
  }

  /**
   * Validate that required landmarks are connected
   */
  private validateLandmarks(data: any): boolean {
    if (!this.config.requiredLandmarks) return true;

    // Check if all required landmarks are in the completion data
    const connectedLandmarks = data?.landmarks || [];
    const connectedIds = connectedLandmarks.map((l: any) => l.id || "");

    return this.config.requiredLandmarks.every((id) =>
      connectedIds.includes(id),
    );
  }

  /**
   * Reset headline progression
   */
  public reset(): void {
    this.currentHeadlineIndex = 0;

  }

  /**
   * Get current headline index (for save/load)
   */
  public getCurrentIndex(): number {
    return this.currentHeadlineIndex;
  }

  /**
   * Set headline index (for save/load)
   */
  public setCurrentIndex(index: number): void {
    this.currentHeadlineIndex = Math.max(
      0,
      Math.min(index, this.config.headlines.length),
    );
  }

  update(deltaTime: number): void {
    // Update headline display animation if it exists
    if (this.headlineDisplay && this.headlineDisplay.isVisible()) {
      this.headlineDisplay.update(deltaTime);
    }
  }

  destroy(): void {
    // Clean up event listener
    if (this.game) {
      this.game.offGame(this.config.triggerOn, this.handleCompletion);
    }

  }
}
