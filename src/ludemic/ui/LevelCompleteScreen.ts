import { Container, Graphics, Text } from "pixi.js";
import { UI_CONFIG } from "../config/ui-config";

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
      text: "We broke down the best and worst highways in New Jersey.",
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
      .fill({
        color: 0x000000,
        alpha: UI_CONFIG.LEVEL_COMPLETE_SCREEN.backgroundAlpha,
      });

    // Update texts
    this.levelText.text = `Level ${level} Complete!`;
    this.scoreText.text = `Current Score: ${score}`;

    // Responsive font sizes from UI_CONFIG
    const titleConfig = UI_CONFIG.LEVEL_COMPLETE_SCREEN.title;
    const levelConfig = UI_CONFIG.LEVEL_COMPLETE_SCREEN.levelText;
    const scoreConfig = UI_CONFIG.LEVEL_COMPLETE_SCREEN.scoreText;
    const instructionConfig = UI_CONFIG.LEVEL_COMPLETE_SCREEN.instructionText;

    this.titleText.style.fontSize = Math.max(
      titleConfig.minFontSize,
      Math.min(titleConfig.maxFontSize, width * titleConfig.fontSizePercent),
    );
    this.levelText.style.fontSize = Math.max(
      levelConfig.minFontSize,
      Math.min(levelConfig.maxFontSize, width * levelConfig.fontSizePercent),
    );
    this.scoreText.style.fontSize = Math.max(
      scoreConfig.minFontSize,
      Math.min(scoreConfig.maxFontSize, width * scoreConfig.fontSizePercent),
    );
    this.instructionText.style.fontSize = Math.max(
      instructionConfig.minFontSize,
      Math.min(
        instructionConfig.maxFontSize,
        width * instructionConfig.fontSizePercent,
      ),
    );

    // Position elements
    const centerX = width / 2;
    const centerY = height / 2;

    // Use offsets from UI_CONFIG
    const titleOffset = height * titleConfig.offsetFromCenterPercent;
    const levelOffset = height * levelConfig.offsetFromCenterPercent;
    const scoreOffset = height * scoreConfig.offsetFromCenterPercent;
    const instructionOffset =
      height * instructionConfig.offsetFromCenterPercent;

    this.titleText.position.set(centerX, centerY - titleOffset);
    this.levelText.position.set(centerX, centerY - levelOffset);
    this.scoreText.position.set(centerX, centerY + scoreOffset);
    this.instructionText.position.set(centerX, centerY + instructionOffset);

    this.visible = true;

    // Auto-hide after configured duration
    setTimeout(() => {
      this.hide();
    }, UI_CONFIG.LEVEL_COMPLETE_SCREEN.displayDuration * 1000);

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
   * Resize level complete screen (responsive layout)
   */
  resize(width: number, height: number): void {
    if (!this.visible) return; // Only resize if currently visible

    // Redraw background with new dimensions
    this.background
      .clear()
      .rect(0, 0, width, height)
      .fill({
        color: 0x000000,
        alpha: UI_CONFIG.LEVEL_COMPLETE_SCREEN.backgroundAlpha,
      });

    // Responsive font sizes from UI_CONFIG
    const titleConfig = UI_CONFIG.LEVEL_COMPLETE_SCREEN.title;
    const levelConfig = UI_CONFIG.LEVEL_COMPLETE_SCREEN.levelText;
    const scoreConfig = UI_CONFIG.LEVEL_COMPLETE_SCREEN.scoreText;
    const instructionConfig = UI_CONFIG.LEVEL_COMPLETE_SCREEN.instructionText;

    this.titleText.style.fontSize = Math.max(
      titleConfig.minFontSize,
      Math.min(titleConfig.maxFontSize, width * titleConfig.fontSizePercent),
    );
    this.levelText.style.fontSize = Math.max(
      levelConfig.minFontSize,
      Math.min(levelConfig.maxFontSize, width * levelConfig.fontSizePercent),
    );
    this.scoreText.style.fontSize = Math.max(
      scoreConfig.minFontSize,
      Math.min(scoreConfig.maxFontSize, width * scoreConfig.fontSizePercent),
    );
    this.instructionText.style.fontSize = Math.max(
      instructionConfig.minFontSize,
      Math.min(
        instructionConfig.maxFontSize,
        width * instructionConfig.fontSizePercent,
      ),
    );

    // Reposition elements at new center with offsets from UI_CONFIG
    const centerX = width / 2;
    const centerY = height / 2;

    const titleOffset = height * titleConfig.offsetFromCenterPercent;
    const levelOffset = height * levelConfig.offsetFromCenterPercent;
    const scoreOffset = height * scoreConfig.offsetFromCenterPercent;
    const instructionOffset =
      height * instructionConfig.offsetFromCenterPercent;

    this.titleText.position.set(centerX, centerY - titleOffset);
    this.levelText.position.set(centerX, centerY - levelOffset);
    this.scoreText.position.set(centerX, centerY + scoreOffset);
    this.instructionText.position.set(centerX, centerY + instructionOffset);
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
