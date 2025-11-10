import { Container, Text } from "pixi.js";

/**
 * ScoreDisplay UI Component
 *
 * Displays current score with text formatting.
 * Updates in real-time as score changes.
 *
 * This is a simple UI component (not an entity).
 * No primitives needed - just display logic.
 */

export class ScoreDisplay extends Container {
  private scoreText: Text;
  private currentScore = 0;

  constructor() {
    super();

    this.scoreText = new Text({
      text: "Score: 0",
      style: {
        fontSize: 24,
        fill: 0xffffff,
        fontWeight: "bold",
        fontFamily: "Arial, sans-serif",
      },
    });

    this.addChild(this.scoreText);
  }

  /**
   * Update displayed score
   */
  setScore(score: number): void {
    this.currentScore = score;
    this.scoreText.text = `Score: ${this.currentScore}`;
  }

  /**
   * Get current score
   */
  getScore(): number {
    return this.currentScore;
  }
}
