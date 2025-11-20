import { Container, Graphics, Text } from "pixi.js";
import type { Ticker } from "pixi.js";
import { FancyButton } from "@pixi/ui";
import { animate } from "motion";

import { GameBuilder, type GameContainer } from "../../ludemic/GameBuilder";
import { LayoutIntentCompiler } from "../layout/LayoutIntent";
import { TuningSystem } from "../../ludemic/tuning/TuningSystem";
import { TuningControls } from "../../ludemic/tuning/TuningControls";
import { InfiniteLevelManager } from "../../ludemic/generation/InfiniteLevelManager";
import { UI_CONFIG } from "../../ludemic/config/ui-config";
import { audioManager } from "../../ludemic/AudioManager";

/**
 * PrimitiveTestScreen
 *
 * Test harness for the Ludemic Primitive system.
 * Loads a game from JSON config and runs it.
 *
 * Phase 1: Tests InputMovement primitive with Paddle entity
 * - Arrow keys to move paddle left/right
 * - Paddle stays within bounds
 * - Edit config/paddle-test.json to change behavior
 *
 * Instructions displayed on screen for user testing.
 */
export class PrimitiveTestScreen extends Container {
  public static assetBundles = ["main"];
  private game!: GameContainer;
  private background!: Graphics;
  private instructions!: Text;
  private layoutEngine: LayoutIntentCompiler;
  private screenWidth = 0; // Will be set by resize() - no hardcoded default
  private screenHeight = 0; // Will be set by resize() - no hardcoded default
  private keydownListener?: (e: KeyboardEvent) => void;
  private tuningSystem: TuningSystem;
  private tuningControls!: TuningControls;
  private currentLevelIndex = 0; // Track current level (0-based)
  private readonly MAX_LEVEL = 999; // Infinite levels (show 999+ for display)
  private nextLevelButton?: FancyButton;

  constructor() {
    super();
    this.layoutEngine = new LayoutIntentCompiler();
    this.tuningSystem = new TuningSystem();
  }

  /**
   * Called when screen is shown
   */
  async show(): Promise<void> {
    // Reset to level 1 when screen is shown
    this.currentLevelIndex = 0;

    // Start background music (loop)
    audioManager.playBGMusic(0.15);
    // Start secondary background layer on top
    audioManager.playBGLayer(0.3);

    // Create full-screen dark background
    this.background = new Graphics();
    this.addChild(this.background);

    // Show instructions
    this.instructions = new Text({
      text:
        "🏙️ CITY LINES - Ludemic Primitive Test\n\n" +
        "Controls:\n" +
        "  Click/Tap tiles to rotate them 90°\n\n" +
        "Goal:\n" +
        "  Connect the house (red) to the landmark (green)\n" +
        "  using road tiles\n\n" +
        "This demonstrates:\n" +
        "  🔄 RotateOnClick primitive (LISA: INPUT + ROT)\n" +
        "  🗺️ PathValidator (LISA: COLLIDE + CMP + LINK)\n" +
        "  🏗️ CityGrid container (LISA: LINK + DISPLAY + TRIG)\n" +
        "  🛣️ Road type hierarchy validation\n\n" +
        "Watch the console for:\n" +
        "  - Connection graph updates\n" +
        "  - Path validation results\n" +
        "  - Success when all landmarks connect!\n\n" +
        "Try editing public/config/city-lines-minimal.json:\n" +
        "  - Add more tiles\n" +
        "  - Change grid size\n" +
        "  - Add turnpikes and highways",
      style: {
        fontSize: 13,
        fill: 0xffffff,
        fontFamily: "monospace",
        lineHeight: 18,
      },
    });
    this.instructions.position.set(20, 20);
    this.instructions.visible = false; // Hide instructions - game is self-explanatory
    this.addChild(this.instructions);

    // Load first level
    try {
      await this.loadLevel(this.currentLevelIndex);
    } catch (error) {
      console.error("❌ Failed to load game config:", error);

      const errorText = new Text({
        text:
          "ERROR: Failed to load config/breakout-complete.json\n\n" +
          String(error),
        style: {
          fontSize: 16,
          fill: 0xff0000,
          fontFamily: "monospace",
        },
      });
      errorText.position.set(20, 300);
      this.addChild(errorText);
    }

    // Add keyboard listener for level navigation
    this.keydownListener = (e: KeyboardEvent) => {
      // Left arrow: Previous level
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        this.previousLevel();
      }

      // Right arrow: Next level
      if (e.code === "ArrowRight") {
        e.preventDefault();
        this.nextLevel();
      }

      // R key: Reload current level
      if (e.code === "KeyR") {
        e.preventDefault();
        this.reloadLevel();
      }

      // Number keys 1-4: Jump to specific level
      if (e.code === "Digit1") {
        e.preventDefault();
        this.jumpToLevel(0);
      }
      if (e.code === "Digit2") {
        e.preventDefault();
        this.jumpToLevel(1);
      }
      if (e.code === "Digit3") {
        e.preventDefault();
        this.jumpToLevel(2);
      }
      if (e.code === "Digit4") {
        e.preventDefault();
        this.jumpToLevel(3);
      }

      // Number key 6: Jump to level 16
      if (e.code === "Digit6") {
        e.preventDefault();
        this.jumpToLevel(15); // Level 16 is index 15 (0-based)
      }
    };
    window.addEventListener("keydown", this.keydownListener);
  }

  /**
   * Update game every frame
   */
  update(ticker: Ticker): void {
    if (this.game) {
      // ticker.deltaTime is already normalized to 1.0 at 60fps
      // We want deltaTime in seconds: ticker.deltaMS / 1000
      this.game.update(ticker.deltaMS / 1000); // Convert milliseconds to seconds
    }
  }

  /**
   * Create "Next Level" button (reads from UI_CONFIG)
   */
  private createNextLevelButton(): void {
    const config = UI_CONFIG.NEXT_LEVEL_BUTTON;

    // Create button text (green color from config)
    const buttonText = new Text({
      text: "Next",
      style: {
        fontSize: 24, // Will be updated in resize()
        fill: config.colors.text,
        fontFamily: '"Zain", sans-serif',
        fontWeight: "bold",
      },
    });

    // Create FancyButton with three states (colors from config)
    this.nextLevelButton = new FancyButton({
      defaultView: new Graphics()
        .rect(0, 0, config.width, config.height)
        .fill(config.colors.default),
      hoverView: new Graphics()
        .rect(0, 0, config.width, config.height)
        .fill(config.colors.hover),
      pressedView: new Graphics()
        .rect(0, 0, config.width, config.height)
        .fill(config.colors.pressed),
      text: buttonText,
    });
    this.nextLevelButton.anchor.set(0.5);
    this.nextLevelButton.alpha = 0; // Start invisible
    this.nextLevelButton.eventMode = "static"; // Make it clickable
    this.addChild(this.nextLevelButton);

    // Setup click listener
    this.nextLevelButton.onPress.connect(() => {
      this.hideNextLevelButton();
      this.nextLevel();
    });

    // Position will be set in resize()
  }

  /**
   * Show next level button with fade-in animation (reads from UI_CONFIG)
   */
  private showNextLevelButton(): void {
    const config = UI_CONFIG.NEXT_LEVEL_BUTTON;

    if (!this.nextLevelButton) {
      this.createNextLevelButton();
    }

    if (this.nextLevelButton) {
      // Position at bottom center (using config)
      this.nextLevelButton.x = this.screenWidth / 2;
      this.nextLevelButton.y =
        this.screenHeight - this.screenHeight * config.offsetFromBottomPercent;

      // Fade in (duration from config)
      animate(
        this.nextLevelButton,
        { alpha: 1 },
        { duration: config.fadeInDuration },
      );

      // Start pulsing animation
      this.startButtonPulse();
    }
  }

  /**
   * Hide next level button with fade-out animation (reads from UI_CONFIG)
   */
  private hideNextLevelButton(): void {
    if (this.nextLevelButton) {
      const config = UI_CONFIG.NEXT_LEVEL_BUTTON;
      animate(
        this.nextLevelButton,
        { alpha: 0 },
        { duration: config.fadeOutDuration },
      );
    }
  }

  /**
   * Start pulsing animation on next level button (reads from UI_CONFIG)
   */
  private startButtonPulse(): void {
    if (!this.nextLevelButton) return;

    const config = UI_CONFIG.NEXT_LEVEL_BUTTON;

    const pulse = () => {
      if (!this.nextLevelButton || !this.nextLevelButton.parent) return;

      animate(
        this.nextLevelButton.scale,
        { x: [1, 1.05, 1], y: [1, 1.05, 1] },
        { duration: config.pulseDuration, ease: "easeInOut" },
      ).finished.then(() => {
        // Loop pulse animation
        if (this.nextLevelButton && this.nextLevelButton.parent) {
          pulse();
        }
      });
    };
    pulse();
  }

  /**
   * Handle window resize - responsive layout for City Lines
   */
  resize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;

    // Redraw full-screen background
    if (this.background) {
      this.background
        .clear()
        .rect(0, 0, width, height)
        .fill(UI_CONFIG.COLORS.screenBackground);
    }

    // Reposition next level button if it exists (using config)
    if (this.nextLevelButton && this.nextLevelButton.alpha > 0) {
      const buttonConfig = UI_CONFIG.NEXT_LEVEL_BUTTON;
      this.nextLevelButton.x = width / 2;
      this.nextLevelButton.y =
        height - height * buttonConfig.offsetFromBottomPercent;
    }

    if (this.game) {
      // Update game container viewport dimensions (for modals)
      this.game.updateViewport(width, height);

      // City Lines uses responsive percentage-based layout
      // Tell CityGrid to resize based on viewport
      const cityGrid = this.game.getEntityById("city_grid");
      if (
        cityGrid &&
        "resize" in cityGrid &&
        typeof cityGrid.resize === "function"
      ) {
        (cityGrid as any).resize(width, height);
      }

      // Resize HeadlineDisplay
      const headlineDisplay = this.game.getHeadlineDisplay();
      if (
        headlineDisplay &&
        "resize" in headlineDisplay &&
        typeof headlineDisplay.resize === "function"
      ) {
        (headlineDisplay as any).resize(width, height);
      }
    }
  }

  /**
   * Load a specific level
   */
  private async loadLevel(levelIndex: number): Promise<void> {
    // Hide next level button when loading new level
    this.hideNextLevelButton();

    // Remove existing game
    if (this.game) {
      this.removeChild(this.game);
      this.game.destroy();
    }

    try {
      // Load level config (uses InfiniteLevelManager for levels 1-3 + generated 4+)
      const levelConfig = await InfiniteLevelManager.loadLevel(levelIndex + 1);

      // Create game from config
      this.game = await GameBuilder.fromConfig(levelConfig, this.tuningSystem);
      this.addChild(this.game);

      // Initialize grid with current viewport size
      const cityGrid = this.game.getEntityById("city_grid");
      if (
        cityGrid &&
        "resize" in cityGrid &&
        typeof cityGrid.resize === "function"
      ) {
        (cityGrid as any).resize(this.screenWidth, this.screenHeight);
      }

      // Initialize HeadlineDisplay with current viewport size
      const headlineDisplay = this.game.getHeadlineDisplay();
      if (
        headlineDisplay &&
        "resize" in headlineDisplay &&
        typeof headlineDisplay.resize === "function"
      ) {
        (headlineDisplay as any).resize(this.screenWidth, this.screenHeight);
      }

      // Update HeadlineDisplay level number
      if (
        headlineDisplay &&
        "setLevel" in headlineDisplay &&
        typeof headlineDisplay.setLevel === "function"
      ) {
        (headlineDisplay as any).setLevel(levelIndex + 1);
      }

      // Listen for path complete event to show Next Level button

      // Create one-time handler for path_complete
      const pathCompleteHandler = () => {
        const buttonConfig = UI_CONFIG.NEXT_LEVEL_BUTTON;
        // Wait (config delay) after completion, then show Next Level button
        setTimeout(() => {
          const maxLevel = this.MAX_LEVEL - 1;
          if (this.currentLevelIndex < maxLevel) {
            this.showNextLevelButton();
          }
        }, buttonConfig.delayAfterComplete * 1000); // Convert seconds to milliseconds
      };

      // Use onGame() to listen to GameContainer's internal event emitter
      this.game.onGame("path_complete", pathCompleteHandler);
    } catch (error) {
      console.error(`❌ Failed to load level ${levelIndex + 1}:`, error);
    }
  }

  /**
   * Load next level
   */
  private nextLevel(): void {
    const maxLevel = this.MAX_LEVEL - 1;
    if (this.currentLevelIndex < maxLevel) {
      this.currentLevelIndex++;
      this.loadLevel(this.currentLevelIndex);
    }
    // Already at max level - do nothing
  }

  /**
   * Load previous level
   */
  private previousLevel(): void {
    if (this.currentLevelIndex > 0) {
      this.currentLevelIndex--;
      this.loadLevel(this.currentLevelIndex);
    }
    // Already at min level - do nothing
  }

  /**
   * Reload current level
   */
  private reloadLevel(): void {
    this.loadLevel(this.currentLevelIndex);
  }

  /**
   * Jump to specific level (0-indexed)
   */
  private jumpToLevel(levelIndex: number): void {
    const maxLevel = this.MAX_LEVEL - 1;
    if (levelIndex >= 0 && levelIndex <= maxLevel) {
      this.currentLevelIndex = levelIndex;
      this.loadLevel(this.currentLevelIndex);
    }
    // Invalid level index - do nothing
  }

  /**
   * Clean up when screen is hidden
   */
  async hide(): Promise<void> {
    // Stop background music
    audioManager.stopBGM();

    // Remove keyboard listener
    if (this.keydownListener) {
      window.removeEventListener("keydown", this.keydownListener);
    }
    // Game cleanup happens in destroy()
  }
}
