import { Container, Graphics, Text } from "pixi.js";
import { UI_CONFIG } from "../config/ui-config";

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
  show(
    score: number,
    level: number,
    highScore: number,
    width: number,
    height: number,
  ): void {
    // Draw background
    this.background.clear().rect(0, 0, width, height).fill({
      color: 0x000000,
      alpha: UI_CONFIG.GAME_OVER_SCREEN.backgroundAlpha,
    });

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

    // Responsive font sizes from UI_CONFIG
    const titleConfig = UI_CONFIG.GAME_OVER_SCREEN.title;
    const scoreConfig = UI_CONFIG.GAME_OVER_SCREEN.scoreText;
    const levelConfig = UI_CONFIG.GAME_OVER_SCREEN.levelText;
    const highScoreConfig = UI_CONFIG.GAME_OVER_SCREEN.highScoreText;
    const instructionConfig = UI_CONFIG.GAME_OVER_SCREEN.instructionText;

    this.titleText.style.fontSize = Math.max(
      titleConfig.minFontSize,
      Math.min(titleConfig.maxFontSize, width * titleConfig.fontSizePercent),
    );
    this.scoreText.style.fontSize = Math.max(
      scoreConfig.minFontSize,
      Math.min(scoreConfig.maxFontSize, width * scoreConfig.fontSizePercent),
    );
    this.levelText.style.fontSize = Math.max(
      levelConfig.minFontSize,
      Math.min(levelConfig.maxFontSize, width * levelConfig.fontSizePercent),
    );
    this.highScoreText.style.fontSize = Math.max(
      highScoreConfig.minFontSize,
      Math.min(
        highScoreConfig.maxFontSize,
        width * highScoreConfig.fontSizePercent,
      ),
    );
    this.instructionText.style.fontSize = Math.max(
      instructionConfig.minFontSize,
      Math.min(
        instructionConfig.maxFontSize,
        width * instructionConfig.fontSizePercent,
      ),
    );

    // Position elements with offsets from UI_CONFIG
    const centerX = width / 2;
    const centerY = height / 2;

    const titleOffset = height * titleConfig.offsetFromCenterPercent;
    const scoreOffset = height * scoreConfig.offsetFromCenterPercent;
    const levelOffset = height * levelConfig.offsetFromCenterPercent;
    const highScoreOffset = height * highScoreConfig.offsetFromCenterPercent;
    const instructionOffset =
      height * instructionConfig.offsetFromCenterPercent;

    this.titleText.position.set(centerX, centerY - titleOffset);
    this.scoreText.position.set(centerX, centerY - scoreOffset);
    this.levelText.position.set(centerX, centerY - levelOffset);
    this.highScoreText.position.set(centerX, centerY - highScoreOffset);
    this.instructionText.position.set(centerX, centerY - instructionOffset);

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
   * Resize game over screen (responsive layout)
   */
  resize(width: number, height: number): void {
    if (!this.visible) return; // Only resize if currently visible

    // Redraw background with new dimensions
    this.background.clear().rect(0, 0, width, height).fill({
      color: 0x000000,
      alpha: UI_CONFIG.GAME_OVER_SCREEN.backgroundAlpha,
    });

    // Responsive font sizes from UI_CONFIG
    const titleConfig = UI_CONFIG.GAME_OVER_SCREEN.title;
    const scoreConfig = UI_CONFIG.GAME_OVER_SCREEN.scoreText;
    const levelConfig = UI_CONFIG.GAME_OVER_SCREEN.levelText;
    const highScoreConfig = UI_CONFIG.GAME_OVER_SCREEN.highScoreText;
    const instructionConfig = UI_CONFIG.GAME_OVER_SCREEN.instructionText;

    this.titleText.style.fontSize = Math.max(
      titleConfig.minFontSize,
      Math.min(titleConfig.maxFontSize, width * titleConfig.fontSizePercent),
    );
    this.scoreText.style.fontSize = Math.max(
      scoreConfig.minFontSize,
      Math.min(scoreConfig.maxFontSize, width * scoreConfig.fontSizePercent),
    );
    this.levelText.style.fontSize = Math.max(
      levelConfig.minFontSize,
      Math.min(levelConfig.maxFontSize, width * levelConfig.fontSizePercent),
    );
    this.highScoreText.style.fontSize = Math.max(
      highScoreConfig.minFontSize,
      Math.min(
        highScoreConfig.maxFontSize,
        width * highScoreConfig.fontSizePercent,
      ),
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
    const scoreOffset = height * scoreConfig.offsetFromCenterPercent;
    const levelOffset = height * levelConfig.offsetFromCenterPercent;
    const highScoreOffset = height * highScoreConfig.offsetFromCenterPercent;
    const instructionOffset =
      height * instructionConfig.offsetFromCenterPercent;

    this.titleText.position.set(centerX, centerY - titleOffset);
    this.scoreText.position.set(centerX, centerY - scoreOffset);
    this.levelText.position.set(centerX, centerY - levelOffset);
    this.highScoreText.position.set(centerX, centerY - highScoreOffset);
    this.instructionText.position.set(centerX, centerY - instructionOffset);
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
