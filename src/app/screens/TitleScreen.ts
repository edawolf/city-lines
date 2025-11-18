import { Container, Graphics, Text } from "pixi.js";
import type { Ticker } from "pixi.js";
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion/react";

import { engine } from "../getEngine";
import { UI_CONFIG } from "../../ludemic/config/ui-config";
import { audioManager } from "../../ludemic/AudioManager";

/**
 * TitleScreen
 *
 * Initial screen shown when game launches.
 * Shows game title, tagline, and prompts user to start playing.
 */
export class TitleScreen extends Container {
  public static assetBundles = ["main"];

  private background!: Graphics;
  private titleText!: Text;
  private taglineText!: Text;
  private promptText!: Text;
  private screenWidth = 0;
  private screenHeight = 0;
  private keydownListener?: (e: KeyboardEvent) => void;
  private clickListener?: () => void;

  constructor() {
    super();
  }

  /**
   * Called when screen is shown
   */
  async show(): Promise<void> {
    console.log("[TitleScreen] show() called");

    // Start background music
    audioManager.playBGMusic(0.15);
    audioManager.playBGLayer(0.3);

    // Create dark background
    this.background = new Graphics();
    this.addChild(this.background);

    // Create title text
    this.titleText = new Text({
      text: "CITY LINES",
      style: {
        fontSize: 72,
        fill: 0xffffff,
        fontFamily: "Arial, sans-serif",
        fontWeight: "bold",
        align: "center",
      },
    });
    this.titleText.anchor.set(0.5);
    this.titleText.alpha = 0; // Start invisible for animation
    this.addChild(this.titleText);

    // Create tagline text
    this.taglineText = new Text({
      text: "Build New Jersey roads and reveal top news from the week!",
      style: {
        fontSize: 20,
        fill: 0xcccccc,
        fontFamily: "Arial, sans-serif",
        align: "center",
        wordWrap: true,
        wordWrapWidth: 600,
      },
    });
    this.taglineText.anchor.set(0.5);
    this.taglineText.alpha = 0; // Start invisible for animation
    this.addChild(this.taglineText);

    // Create prompt text (press any key / click to start)
    this.promptText = new Text({
      text: "Press any key or click to start",
      style: {
        fontSize: 18,
        fill: 0x888888,
        fontFamily: "Arial, sans-serif",
        align: "center",
      },
    });
    this.promptText.anchor.set(0.5);
    this.promptText.alpha = 0; // Start invisible for animation
    this.addChild(this.promptText);

    // Setup input listeners
    this.setupInputListeners();

    // Trigger initial resize to position elements
    if (this.screenWidth > 0 && this.screenHeight > 0) {
      this.resize(this.screenWidth, this.screenHeight);
    }

    // Animate elements in sequence
    await this.animateIn();

    // Start pulsing animation on prompt
    this.startPromptPulse();
  }

  /**
   * Animate elements in
   */
  private async animateIn(): Promise<void> {
    // Fade in title
    const titleAnim = animate(
      this.titleText,
      { alpha: 1 },
      { duration: 1.0, ease: "easeOut" },
    );
    await titleAnim;

    // Fade in tagline
    const taglineAnim = animate(
      this.taglineText,
      { alpha: 1 },
      { duration: 0.8, ease: "easeOut" },
    );
    await taglineAnim;

    // Fade in prompt
    const promptAnim = animate(
      this.promptText,
      { alpha: 1 },
      { duration: 0.6, ease: "easeOut" },
    );
    await promptAnim;
  }

  /**
   * Start pulsing animation on prompt text
   */
  private startPromptPulse(): void {
    const pulse = () => {
      animate(
        this.promptText,
        { alpha: [1, 0.3, 1] },
        { duration: 2.0, ease: "easeInOut" },
      ).finished.then(() => {
        // Loop pulse animation
        if (this.promptText && this.promptText.parent) {
          pulse();
        }
      });
    };
    pulse();
  }

  /**
   * Setup keyboard and mouse input listeners
   */
  private setupInputListeners(): void {
    // Keyboard listener
    this.keydownListener = (_e: KeyboardEvent) => {
      this.startGame();
    };
    document.addEventListener("keydown", this.keydownListener);

    // Click listener
    this.background.eventMode = "static";
    this.background.cursor = "pointer";
    this.clickListener = () => {
      this.startGame();
    };
    this.background.on("pointerdown", this.clickListener);
  }

  /**
   * Start the game (transition to level 1)
   */
  private async startGame(): Promise<void> {
    console.log("[TitleScreen] Starting game...");

    // Play a sound effect if available
    // audioManager.playRotateSound(); // Optional: add a "start" sound

    // Hide this screen
    await this.hide();

    // Navigate to game screen (PrimitiveTestScreen)
    const { PrimitiveTestScreen } = await import("./PrimitiveTestScreen");
    await engine().navigation.showScreen(PrimitiveTestScreen);
  }

  /**
   * Resize the screen
   */
  resize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;

    // Update background
    if (this.background) {
      this.background.clear();
      this.background
        .rect(0, 0, width, height)
        .fill(UI_CONFIG.COLORS.gridBackground);
    }

    // Position title in center
    if (this.titleText) {
      this.titleText.x = width / 2;
      this.titleText.y = height / 2 - 60; // Slightly above center
    }

    // Position tagline below title
    if (this.taglineText) {
      this.taglineText.x = width / 2;
      this.taglineText.y = height / 2 + 40; // Below title
    }

    // Position prompt at bottom
    if (this.promptText) {
      this.promptText.x = width / 2;
      this.promptText.y = height - 80; // 80px from bottom
    }
  }

  /**
   * Hide screen with animations
   */
  async hide(): Promise<void> {
    console.log("[TitleScreen] hide() called");

    // Fade out all elements
    const fadeOutPromises: AnimationPlaybackControls[] = [];

    if (this.titleText) {
      fadeOutPromises.push(
        animate(this.titleText, { alpha: 0 }, { duration: 0.3 }),
      );
    }
    if (this.taglineText) {
      fadeOutPromises.push(
        animate(this.taglineText, { alpha: 0 }, { duration: 0.3 }),
      );
    }
    if (this.promptText) {
      fadeOutPromises.push(
        animate(this.promptText, { alpha: 0 }, { duration: 0.3 }),
      );
    }

    // Wait for all animations to complete
    await Promise.all(fadeOutPromises.map((anim) => anim.finished));
  }

  /**
   * Update loop (not used for title screen)
   */
  update(_time: Ticker): void {
    // No update logic needed
  }

  /**
   * Cleanup when screen is destroyed
   */
  destroy(): void {
    // Remove event listeners
    if (this.keydownListener) {
      document.removeEventListener("keydown", this.keydownListener);
    }
    if (this.clickListener && this.background) {
      this.background.off("pointerdown", this.clickListener);
    }

    super.destroy();
  }
}
