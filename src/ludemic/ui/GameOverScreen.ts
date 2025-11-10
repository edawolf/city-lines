import { Container, Graphics, Text } from "pixi.js";

/**
 * GameOverScreen UI Overlay
 *
 * Displays game over message with final score and high score.
 * Shows when player runs out of lives.
 */
export class GameOverScreen extends Container {
  private background: Graphics;
  private titleText: Text;
  private scoreText: Text;
  private highScoreText: Text;
  private levelText: Text;
  private instructionText: Text;

  constructor() {
    super();

    // Semi-transparent background
    this.background = new Graphics();
    this.addChild(this.background);

    // Title
    this.titleText = new Text({
      text: "GAME OVER",
      style: {
        fontSize: 64,
        fill: 0xff0000,
        fontFamily: "monospace",
        fontWeight: "bold",
      },
    });
    this.titleText.anchor.set(0.5);
    this.addChild(this.titleText);

    // Score
    this.scoreText = new Text({
      text: "Score: 0",
      style: {
        fontSize: 32,
        fill: 0xffffff,
        fontFamily: "monospace",
      },
    });
    this.scoreText.anchor.set(0.5);
    this.addChild(this.scoreText);

    // High Score
    this.highScoreText = new Text({
      text: "High Score: 0",
      style: {
        fontSize: 24,
        fill: 0xffff00,
        fontFamily: "monospace",
        fontWeight: "bold",
      },
    });
    this.highScoreText.anchor.set(0.5);
    this.addChild(this.highScoreText);

    // Level reached
    this.levelText = new Text({
      text: "Level Reached: 1",
      style: {
        fontSize: 24,
        fill: 0xffffff,
        fontFamily: "monospace",
      },
    });
    this.levelText.anchor.set(0.5);
    this.addChild(this.levelText);

    // Instructions
    this.instructionText = new Text({
      text: "Press SPACE to restart",
      style: {
        fontSize: 20,
        fill: 0xaaaaaa,
        fontFamily: "monospace",
      },
    });
    this.instructionText.anchor.set(0.5);
    this.addChild(this.instructionText);

    this.visible = false;
  }

  /**
   * Show game over screen
   */
  show(score: number, level: number, highScore: number, width: number, height: number): void {
    // Draw background
    this.background
      .clear()
      .rect(0, 0, width, height)
      .fill({ color: 0x000000, alpha: 0.8 });

    // Update texts
    this.scoreText.text = `Final Score: ${score}`;
    this.levelText.text = `Level Reached: ${level}`;
    this.highScoreText.text = `High Score: ${highScore}`;

    // Check if new high score
    if (score >= highScore) {
      this.highScoreText.text = `NEW HIGH SCORE: ${highScore}!`;
      this.highScoreText.style.fill = 0xffd700; // Gold
    } else {
      this.highScoreText.style.fill = 0xffff00; // Yellow
    }

    // Position elements
    const centerX = width / 2;
    const centerY = height / 2;

    this.titleText.position.set(centerX, centerY - 120);
    this.scoreText.position.set(centerX, centerY - 40);
    this.levelText.position.set(centerX, centerY + 10);
    this.highScoreText.position.set(centerX, centerY + 50);
    this.instructionText.position.set(centerX, centerY + 120);

    this.visible = true;

    // Pulse animation on title
    this.animateTitle();
  }

  /**
   * Hide game over screen
   */
  hide(): void {
    this.visible = false;
  }

  /**
   * Animate title with pulse effect
   */
  private animateTitle(): void {
    const pulse = () => {
      if (!this.visible) return;

      this.titleText.scale.x = 1 + Math.sin(Date.now() / 200) * 0.1;
      this.titleText.scale.y = 1 + Math.sin(Date.now() / 200) * 0.1;

      requestAnimationFrame(pulse);
    };
    pulse();
  }
}
