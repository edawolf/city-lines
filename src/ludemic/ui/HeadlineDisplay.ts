import { Container, Text, Graphics } from "pixi.js";
import type { TextUIConfig } from "../config/UIConfig";
import {
  percentToPx,
  responsiveFontSize,
  responsiveSpacing,
  getSafeViewport,
} from "../config/UIConfig";

/**
 * HeadlineDisplay
 *
 * Displays news headlines with typewriter animation effect
 * when player completes a puzzle.
 *
 * Features:
 * - Percentage-based responsive positioning
 * - Typewriter text animation
 * - Background panel with padding
 * - Fade in/out animations
 * - Multiple headline support
 *
 * LISA: DISPLAY + REVEAL
 */

export interface HeadlineDisplayConfig {
  uiConfig: TextUIConfig; // Percentage-based positioning
  backgroundAlpha?: number; // Background opacity (default: 0.9)
  padding?: number; // Padding as % of viewport (default: 2)
  typewriterSpeed?: number; // Characters per second (default: 30)
  displayDuration?: number; // Seconds to show headline (default: 5)
  fadeInDuration?: number; // Fade in time (default: 0.5)
  fadeOutDuration?: number; // Fade out time (default: 0.5)
}

export class HeadlineDisplay extends Container {
  private config: HeadlineDisplayConfig;
  private headlineText: Text;
  private backgroundPanel: Graphics;
  private viewportWidth = 800;
  private viewportHeight = 600;

  // Animation state
  private currentHeadline = "";
  private displayedChars = 0;
  private typewriterTimer = 0;
  private displayTimer = 0;
  private state: "hidden" | "typing" | "displaying" | "fading" = "hidden";

  constructor(config: HeadlineDisplayConfig) {
    super();
    this.config = config;

    // Create background panel
    this.backgroundPanel = new Graphics();
    this.addChild(this.backgroundPanel);

    // Create headline text
    this.headlineText = new Text({
      text: "",
      style: {
        fontSize: 24, // Will be updated in resize()
        fill: parseInt(this.config.uiConfig.color || "0xFFFFFF", 16),
        fontFamily: "Arial, sans-serif",
        fontWeight: "bold",
        align: this.config.uiConfig.align || "center",
        wordWrap: true,
        wordWrapWidth: 700, // Will be updated in resize()
      },
    });

    // Set anchor point
    if (this.config.uiConfig.anchor) {
      this.headlineText.anchor.set(
        this.config.uiConfig.anchor.x,
        this.config.uiConfig.anchor.y,
      );
    } else {
      this.headlineText.anchor.set(0.5, 0.5); // Default: center
    }

    this.addChild(this.headlineText);

    // Start hidden
    this.visible = false;
    this.alpha = 0;
  }

  /**
   * Show a new headline with typewriter animation
   */
  public show(headline: string): void {
    this.currentHeadline = headline;
    this.displayedChars = 0;
    this.typewriterTimer = 0;
    this.displayTimer = 0;
    this.state = "typing";
    this.visible = true;

    // Fade in
    this.alpha = 0;
  }

  /**
   * Hide the headline
   */
  public hide(): void {
    this.state = "fading";
  }

  /**
   * Update animation
   */
  public update(deltaTime: number): void {
    if (this.state === "hidden") return;

    switch (this.state) {
      case "typing":
        this.updateTypewriter(deltaTime);
        break;
      case "displaying":
        this.updateDisplay(deltaTime);
        break;
      case "fading":
        this.updateFadeOut(deltaTime);
        break;
    }
  }

  /**
   * Typewriter animation
   */
  private updateTypewriter(deltaTime: number): void {
    const fadeInDuration = this.config.fadeInDuration ?? 0.5;
    const typewriterSpeed = this.config.typewriterSpeed ?? 30;

    // Fade in
    if (this.alpha < 1) {
      this.alpha = Math.min(1, this.alpha + deltaTime / fadeInDuration);
    }

    // Type characters
    this.typewriterTimer += deltaTime;
    const charsToShow = Math.floor(this.typewriterTimer * typewriterSpeed);

    if (charsToShow > this.displayedChars) {
      this.displayedChars = Math.min(charsToShow, this.currentHeadline.length);
      this.headlineText.text = this.currentHeadline.substring(
        0,
        this.displayedChars,
      );

      // Redraw background to match text size
      this.drawBackground();
    }

    // Transition to displaying state when done typing
    if (this.displayedChars >= this.currentHeadline.length) {
      this.state = "displaying";
      this.displayTimer = 0;
    }
  }

  /**
   * Display timer before auto-hiding
   */
  private updateDisplay(deltaTime: number): void {
    const displayDuration = this.config.displayDuration ?? 5;

    this.displayTimer += deltaTime;

    if (this.displayTimer >= displayDuration) {
      this.state = "fading";
    }
  }

  /**
   * Fade out animation
   */
  private updateFadeOut(deltaTime: number): void {
    const fadeOutDuration = this.config.fadeOutDuration ?? 0.5;

    this.alpha = Math.max(0, this.alpha - deltaTime / fadeOutDuration);

    if (this.alpha <= 0) {
      this.visible = false;
      this.state = "hidden";
      this.headlineText.text = "";
    }
  }

  /**
   * Draw background panel behind text
   */
  private drawBackground(): void {
    this.backgroundPanel.clear();

    if (this.headlineText.text.length === 0) return;

    const bounds = this.headlineText.getBounds();
    const padding = responsiveSpacing(
      this.config.padding ?? 2,
      this.viewportWidth,
    );

    // Draw rounded rectangle background
    this.backgroundPanel
      .roundRect(
        bounds.x - padding,
        bounds.y - padding,
        bounds.width + padding * 2,
        bounds.height + padding * 2,
        padding / 2,
      )
      .fill({ color: 0x000000, alpha: this.config.backgroundAlpha ?? 0.9 })
      .stroke({ width: 2, color: 0xffffff });
  }

  /**
   * Resize for responsive layout
   * Ensures headline stays within safe viewport bounds
   */
  public resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;

    // Get safe viewport area (10% margin on mobile for notches/status bars)
    const isMobile = width < 768;
    const safeMargin = isMobile ? 10 : 5; // Larger margin on mobile
    const safeViewport = getSafeViewport(width, height, { all: safeMargin });

    // Calculate font size first (needed for positioning)
    const fontSize = responsiveFontSize(
      this.config.uiConfig.fontSizePercent,
      width,
      isMobile ? 16 : 14, // Larger min font on mobile
      isMobile ? 32 : 48, // Smaller max font on mobile to prevent overflow
    );
    this.headlineText.style.fontSize = fontSize;

    // Update word wrap width (use safe viewport width)
    const maxTextWidth = safeViewport.width * (isMobile ? 0.9 : 0.85);
    this.headlineText.style.wordWrapWidth = Math.max(200, maxTextWidth);

    // Position based on percentage WITHIN safe viewport (not full viewport)
    const requestedPosPercent = this.config.uiConfig.position;

    // Convert percentage to position within SAFE viewport
    const posInSafeViewport = {
      x: safeViewport.x + (requestedPosPercent.x / 100) * safeViewport.width,
      y: safeViewport.y + (requestedPosPercent.y / 100) * safeViewport.height,
    };

    // Add extra buffer based on estimated text height
    const estimatedTextHeight = fontSize * 3; // Estimate 3 lines max
    const minY = safeViewport.y + estimatedTextHeight / 2 + 20; // 20px top buffer
    const maxY =
      safeViewport.y + safeViewport.height - estimatedTextHeight / 2 - 20;

    // Clamp position to safe viewport with text height consideration
    const clampedX = Math.max(
      safeViewport.x + 50,
      Math.min(safeViewport.x + safeViewport.width - 50, posInSafeViewport.x),
    );
    const clampedY = Math.max(minY, Math.min(maxY, posInSafeViewport.y));

    this.position.set(clampedX, clampedY);

    // Redraw background
    this.drawBackground();

    console.log(
      `[HeadlineDisplay] 📐 Resized: viewport ${width}x${height}, safe area ${safeViewport.width}x${safeViewport.height}, font ${fontSize}px, pos (${Math.round(clampedX)}, ${Math.round(clampedY)})`,
    );
  }

  /**
   * Check if currently displaying
   */
  public isVisible(): boolean {
    return this.state !== "hidden";
  }

  /**
   * Get current state
   */
  public getState(): string {
    return this.state;
  }

  /**
   * Cleanup
   */
  override destroy(): void {
    this.headlineText.destroy();
    this.backgroundPanel.destroy();
    super.destroy();
  }
}
