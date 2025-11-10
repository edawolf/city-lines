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
        "LUDEMIC PRIMITIVE TEST - COMPLETE GAME LIFECYCLE!\n\n" +
        "Controls:\n" +
        "  ← → : Move paddle left/right\n" +
        "  A D : Alternative movement\n" +
        "  SPACE : Restart game (on game over)\n\n" +
        "This demonstrates:\n" +
        "  • InputMovement primitive (LISA: INPUT + MOVE)\n" +
        "  • LinearMovement primitive (LISA: MOVE)\n" +
        "  • BounceCollision primitive (LISA: COLLIDE)\n" +
        "  • DestroyCollision primitive (LISA: COLLIDE + KILL)\n" +
        "  • PointsOnDestroy primitive (LISA: REWARD)\n" +
        "  🎆 ParticleEmitter primitive (LISA: JUICE + DISPLAY)\n" +
        "  💥 ScreenShake primitive (LISA: JUICE)\n" +
        "  🔊 SoundTrigger primitive (LISA: SOUND)\n" +
        "  🚀 SpeedScaling primitive (LISA: ESCALATE)\n" +
        "  🔥 ComboMultiplier primitive (LISA: EXTEND + ESCALATE)\n" +
        "  ❤️ HealthSystem primitive (LISA: STATE + MANAGE)\n" +
        "  🎯 BoundaryTrigger primitive (LISA: DETECT + TRIGGER)\n" +
        "  📊 LevelManager primitive (LISA: MANAGE + PROGRESS)\n\n" +
        "NEW! Complete Game Lifecycle:\n" +
        "  - 3 Lives shown as hearts in top-center\n" +
        "  - Lose a life when ball hits bottom\n" +
        "  - Clear all blocks to advance to next level\n" +
        "  - High score tracking across sessions\n" +
        "  - Game over screen with final stats\n" +
        "  - Level complete screen between levels\n\n" +
        "Try editing public/config/breakout-complete.json:\n" +
        "  - Adjust starting health\n" +
        "  - Change boundary triggers\n" +
        "  - Modify difficulty progression",
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
        "config/breakout-complete.json",
        this.tuningSystem, // Pass tuning system so primitives can register listeners during init()
      );

      console.log("🎮 GAME CONTAINER CREATED:", {
        scale: this.game.scale,
        position: { x: this.game.x, y: this.game.y },
        visible: this.game.visible,
        alpha: this.game.alpha,
      });

      this.addChild(this.game);

      console.log(
        "🔍 DEBUG: Game container children count:",
        this.game.children.length,
      );
      console.log(
        "🔍 DEBUG: Game container children:",
        this.game.children.map((c: any) => c.constructor.name),
      );

      // Debug paddle and ball specifically
      const paddle = this.game.children[0];
      const ball = this.game.children[1];
      console.log("🔍 DEBUG Paddle:", {
        position: { x: paddle.x, y: paddle.y },
        visible: paddle.visible,
        alpha: paddle.alpha,
        bounds: paddle.getBounds(),
        children: paddle.children.length,
      });
      console.log("🔍 DEBUG Ball:", {
        position: { x: ball.x, y: ball.y },
        visible: ball.visible,
        alpha: ball.alpha,
        bounds: ball.getBounds(),
        children: ball.children.length,
      });

      // Initialize lifecycle with dimensions
      this.game.initializeLifecycle(
        await (await fetch("config/breakout-complete.json")).json(),
        this.screenWidth,
        this.screenHeight,
      );

      console.log("✅ Game loaded from config/breakout-complete.json");
      console.log(
        "🎮 COMPLETE GAME: Full lifecycle with health, lives, and level progression!",
      );
      console.log("🎆 Particle effects enabled");
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
   * Handle window resize - center the game canvas
   */
  resize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;

    // Redraw full-screen background
    if (this.background) {
      this.background.clear().rect(0, 0, width, height).fill(0x1e1e1e);
    }

    if (this.game) {
      // Game is designed for 800x600
      const gameWidth = 800;
      const gameHeight = 600;

      // Scale game to fit screen while maintaining aspect ratio
      const scaleX = width / gameWidth;
      const scaleY = height / gameHeight;
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

      console.log(`🎮 GAME SCALE:`, {
        screenSize: { width, height },
        gameSize: { width: gameWidth, height: gameHeight },
        scaleX,
        scaleY,
        finalScale: scale,
        currentGameScale: this.game.scale.x,
      });

      this.game.scale.set(scale, scale);

      // Center the scaled game
      const scaledWidth = gameWidth * scale;
      const scaledHeight = gameHeight * scale;
      this.game.x = (width - scaledWidth) / 2;
      this.game.y = (height - scaledHeight) / 2;

      console.log(`🎮 GAME POSITION:`, {
        position: { x: this.game.x, y: this.game.y },
        scaledSize: { width: scaledWidth, height: scaledHeight },
      });
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
