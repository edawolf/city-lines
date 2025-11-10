import { Container, Graphics, Text } from "pixi.js";

/**
 * LevelCompleteScreen UI Overlay
 *
 * Displays level complete message with congratulations.
 * Shows briefly between levels.
 */
export class LevelCompleteScreen extends Container {
  private background: Graphics;
  private titleText: Text;
  private levelText: Text;
  private scoreText: Text;
  private instructionText: Text;

  constructor() {
    super();

    // Semi-transparent background
    this.background = new Graphics();
    this.addChild(this.background);

    // Title
    this.titleText = new Text({
      text: "LEVEL COMPLETE!",
      style: {
        fontSize: 56,
        fill: 0x4caf50,
        fontFamily: "monospace",
        fontWeight: "bold",
      },
    });
    this.titleText.anchor.set(0.5);
    this.addChild(this.titleText);

    // Level info
    this.levelText = new Text({
      text: "Level 1 Complete",
      style: {
        fontSize: 32,
        fill: 0xffffff,
        fontFamily: "monospace",
      },
    });
    this.levelText.anchor.set(0.5);
    this.addChild(this.levelText);

    // Score
    this.scoreText = new Text({
      text: "Current Score: 0",
      style: {
        fontSize: 24,
        fill: 0xffff00,
        fontFamily: "monospace",
      },
    });
    this.scoreText.anchor.set(0.5);
    this.addChild(this.scoreText);

    // Instructions
    this.instructionText = new Text({
      text: "Get ready for the next level!",
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
   * Show level complete screen
   */
  show(level: number, score: number, width: number, height: number): void {
    // Draw background
    this.background
      .clear()
      .rect(0, 0, width, height)
      .fill({ color: 0x000000, alpha: 0.7 });

    // Update texts
    this.levelText.text = `Level ${level} Complete!`;
    this.scoreText.text = `Current Score: ${score}`;

    // Position elements
    const centerX = width / 2;
    const centerY = height / 2;

    this.titleText.position.set(centerX, centerY - 80);
    this.levelText.position.set(centerX, centerY - 10);
    this.scoreText.position.set(centerX, centerY + 40);
    this.instructionText.position.set(centerX, centerY + 100);

    this.visible = true;

    // Auto-hide after 2 seconds
    setTimeout(() => {
      this.hide();
    }, 2000);

    // Animate title
    this.animateTitle();
  }

  /**
   * Hide level complete screen
   */
  hide(): void {
    this.visible = false;
  }

  /**
   * Animate title with bounce effect
   */
  private animateTitle(): void {
    const startTime = Date.now();
    const animate = () => {
      if (!this.visible) return;

      const elapsed = Date.now() - startTime;
      if (elapsed > 2000) return; // Stop after 2 seconds

      this.titleText.scale.x = 1 + Math.sin(elapsed / 100) * 0.1;
      this.titleText.scale.y = 1 + Math.sin(elapsed / 100) * 0.1;

      requestAnimationFrame(animate);
    };
    animate();
  }
}
