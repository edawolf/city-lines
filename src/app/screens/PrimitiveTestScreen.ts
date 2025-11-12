import { Container, Graphics, Text } from "pixi.js";
import type { Ticker } from "pixi.js";

import { GameBuilder, type GameContainer } from "../../ludemic/GameBuilder";
import { LayoutIntentCompiler } from "../layout/LayoutIntent";
import { TuningSystem } from "../../ludemic/tuning/TuningSystem";
import { TuningControls } from "../../ludemic/tuning/TuningControls";

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
  private game!: GameContainer;
  private background!: Graphics;
  private instructions!: Text;
  private layoutEngine: LayoutIntentCompiler;
  private screenWidth = 800;
  private screenHeight = 600;
  private keydownListener?: (e: KeyboardEvent) => void;
  private tuningSystem: TuningSystem;
  private tuningControls!: TuningControls;

  constructor() {
    super();
    this.layoutEngine = new LayoutIntentCompiler();
    this.tuningSystem = new TuningSystem();
  }

  /**
   * Called when screen is shown
   */
  async show(): Promise<void> {
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

    // Load game from config
    try {
      this.game = await GameBuilder.fromFile(
        "config/city-lines-minimal.json",
        this.tuningSystem,
      );

      console.log("🏙️ CITY LINES GAME CREATED");
      this.addChild(this.game);

      // Initialize grid with current viewport size
      const cityGrid = this.game.getEntityById('city_grid');
      if (cityGrid && 'resize' in cityGrid && typeof cityGrid.resize === 'function') {
        (cityGrid as any).resize(this.screenWidth, this.screenHeight);
        console.log(`🏙️ Initial grid resize to ${this.screenWidth}x${this.screenHeight}`);
      }

      // Initialize HeadlineDisplay with current viewport size
      const headlineDisplay = this.game.getHeadlineDisplay();
      if (headlineDisplay && 'resize' in headlineDisplay && typeof headlineDisplay.resize === 'function') {
        (headlineDisplay as any).resize(this.screenWidth, this.screenHeight);
      }

      console.log("✅ Game loaded from config/city-lines-minimal.json");
      console.log("🔄 Click tiles to rotate them!");
      console.log("🗺️ Watch console for path validation");
      console.log("💥 Screen shake enabled");
      console.log("🔊 Sound triggers enabled (if audio assets loaded)");
      console.log("🚀 Speed scaling enabled (ball speeds up on destruction)");
      console.log("🔥 Combo multiplier enabled (2s window, max 5x multiplier)");
      console.log("❤️ Health system enabled (3 lives)");
      console.log("🎯 Boundary trigger enabled (lose life on ball out)");
      console.log("📊 Level manager enabled (progress through levels)");
      console.log("💾 High score tracking enabled (saved in localStorage)");
      console.log("🎮 Press ~ (tilde) to open Tuning Knobs menu");

      // Create HTML-based tuning controls
      this.tuningControls = new TuningControls(this.tuningSystem);
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

    // Add keyboard listener for restart and tuning menu
    this.keydownListener = (e: KeyboardEvent) => {
      // Space to restart on game over
      if (e.code === "Space" && this.game.getGameState() === "game_over") {
        this.game.restart(this.screenWidth, this.screenHeight);
      }

      // Tilde (~) or Backquote (`) to toggle tuning menu
      if (e.code === "Backquote") {
        e.preventDefault();
        if (this.tuningControls) {
          this.tuningControls.toggle();
        }
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
   * Handle window resize - responsive layout for City Lines
   */
  resize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;

    // Redraw full-screen background
    if (this.background) {
      this.background.clear().rect(0, 0, width, height).fill(0x1e1e1e);
    }

    if (this.game) {
      // City Lines uses responsive percentage-based layout
      // Tell CityGrid to resize based on viewport
      const cityGrid = this.game.getEntityById('city_grid');
      if (cityGrid && 'resize' in cityGrid && typeof cityGrid.resize === 'function') {
        (cityGrid as any).resize(width, height);
        console.log(`🏙️ City Lines resized to ${width}x${height}`);
      }

      // Resize HeadlineDisplay
      const headlineDisplay = this.game.getHeadlineDisplay();
      if (headlineDisplay && 'resize' in headlineDisplay && typeof headlineDisplay.resize === 'function') {
        (headlineDisplay as any).resize(width, height);
      }
    }

    // HTML tuning controls don't need resize handling (handled by CSS)
  }

  /**
   * Clean up when screen is hidden
   */
  async hide(): Promise<void> {
    // Remove keyboard listener
    if (this.keydownListener) {
      window.removeEventListener("keydown", this.keydownListener);
    }
    // Game cleanup happens in destroy()
  }
}
