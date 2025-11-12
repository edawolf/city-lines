import { Container, Text, Graphics } from "pixi.js";
import {
  responsiveFontSize,
  responsiveSpacing,
  getSafeViewport,
} from "../config/UIConfig";
import { UI_CONFIG } from "../config/ui-config";

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
  showLevel?: boolean; // Show level number (default: true)
}

export class HeadlineDisplay extends Container {
  private config: HeadlineDisplayConfig;
  private headlineText: Text;
  private backgroundPanel: Graphics;
  private modalOverlay: Graphics; // Semi-transparent fullscreen overlay
  private modalContainer: Graphics; // White modal box
  private buttonBackground: Graphics; // "READ HERE" button background
  private buttonText: Text; // "READ HERE" button text
  private continueButtonBackground: Graphics; // "Continue" button background
  private continueButtonText: Text; // "Continue" button text
  private levelText: Text; // "Level: X" display at top of modal
  private levelContainer: Container; // Persistent container for level text (always visible)
  private viewportWidth = 800;
  private viewportHeight = 600;
  private currentLevel = 1; // Track current level number

  // Animation state
  private currentHeadline = "";
  private displayedChars = 0;
  private typewriterTimer = 0;
  private displayTimer = 0;
  private state: "hidden" | "typing" | "displaying" | "fading" = "hidden";

  constructor(config: HeadlineDisplayConfig = {}) {
    super();
    this.config = config;

    // Create persistent level container (always visible, independent of modal)
    this.levelContainer = new Container();
    this.levelContainer.visible = true; // Always visible
    this.addChild(this.levelContainer);

    // Create fullscreen modal overlay (semi-transparent background)
    this.modalOverlay = new Graphics();
    this.addChild(this.modalOverlay);

    // Create white modal container
    this.modalContainer = new Graphics();
    this.addChild(this.modalContainer);

    // Create background panel (deprecated, kept for compatibility)
    this.backgroundPanel = new Graphics();
    this.modalContainer.addChild(this.backgroundPanel);

    // Create headline text
    this.headlineText = new Text({
      text: "",
      style: {
        fontSize: 24, // Will be updated in resize()
        fill: 0x000000, // Black text for white modal
        fontFamily: "Arial, sans-serif",
        fontWeight: "bold",
        align: "center",
        wordWrap: true,
        wordWrapWidth: 700, // Will be updated in resize()
      },
    });
    this.headlineText.anchor.set(0.5, 0.5); // Center anchor
    this.modalContainer.addChild(this.headlineText);

    // Create "READ HERE" button background
    this.buttonBackground = new Graphics();
    this.modalContainer.addChild(this.buttonBackground);

    // Create "READ HERE" button text
    this.buttonText = new Text({
      text: "READ HERE",
      style: {
        fontSize: 24,
        fill: 0x9966ff, // Purple text
        fontFamily: "Arial, sans-serif",
        fontWeight: "bold",
        align: "center",
      },
    });
    this.buttonText.anchor.set(0.5, 0.5);
    this.modalContainer.addChild(this.buttonText);

    // Create "Continue" button background
    this.continueButtonBackground = new Graphics();
    this.modalContainer.addChild(this.continueButtonBackground);

    // Create "Continue" button text
    this.continueButtonText = new Text({
      text: "Continue",
      style: {
        fontSize: 24,
        fill: 0x9966ff, // Purple text (matching READ HERE button)
        fontFamily: "Arial, sans-serif",
        fontWeight: "bold",
        align: "center",
      },
    });
    this.continueButtonText.anchor.set(0.5, 0.5);
    this.modalContainer.addChild(this.continueButtonText);

    // Create level number text (displayed at top CENTER of screen, always visible)
    this.levelText = new Text({
      text: "Level: 1",
      style: {
        fontSize: 24,
        fill: 0xffffff, // White text
        fontFamily: "Arial, sans-serif",
        fontWeight: "bold",
        align: "center",
      },
    });
    this.levelText.anchor.set(0.5, 0); // Center horizontally, top anchor
    this.levelContainer.addChild(this.levelText); // Add to persistent container

    // Make READ HERE button interactive
    this.buttonBackground.eventMode = "static";
    this.buttonBackground.cursor = "pointer";
    this.buttonBackground.on("pointerdown", this.handleButtonClick.bind(this));

    // Make Continue button interactive
    this.continueButtonBackground.eventMode = "static";
    this.continueButtonBackground.cursor = "pointer";
    this.continueButtonBackground.on(
      "pointerdown",
      this.handleContinueClick.bind(this),
    );

    // Start with modal hidden, but level text visible
    this.modalOverlay.visible = false;
    this.modalContainer.visible = false;
    this.modalOverlay.alpha = 0;
    this.modalContainer.alpha = 0;
    // Level container stays visible
    this.levelContainer.visible = true;
    this.levelContainer.alpha = 1;
  }

  /**
   * Handle "READ HERE" button click
   */
  private handleButtonClick(): void {
    // Hide the modal immediately when button is clicked
    this.hide();
  }

  /**
   * Handle "Continue" button click
   */
  private handleContinueClick(): void {
    // Hide the modal immediately when button is clicked
    this.hide();
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

    // Show modal elements
    this.modalOverlay.visible = true;
    this.modalContainer.visible = true;

    // Fade in modal only (level text stays at full opacity)
    this.modalOverlay.alpha = 0;
    this.modalContainer.alpha = 0;

    // Recalculate position with actual headline text
    this.resize(this.viewportWidth, this.viewportHeight);
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
    const fadeInDuration = UI_CONFIG.HEADLINE_MODAL.fadeInDuration;
    const typewriterSpeed = UI_CONFIG.HEADLINE_MODAL.typewriterSpeed;

    // Fade in modal elements only (not level text)
    if (this.modalOverlay.alpha < 1) {
      const newAlpha = Math.min(
        1,
        this.modalOverlay.alpha + deltaTime / fadeInDuration,
      );
      this.modalOverlay.alpha = newAlpha;
      this.modalContainer.alpha = newAlpha;
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
    const displayDuration = UI_CONFIG.HEADLINE_MODAL.displayDuration;

    this.displayTimer += deltaTime;

    if (this.displayTimer >= displayDuration) {
      this.state = "fading";
    }
  }

  /**
   * Fade out animation
   */
  private updateFadeOut(deltaTime: number): void {
    const fadeOutDuration = UI_CONFIG.HEADLINE_MODAL.fadeOutDuration;

    // Fade out modal elements only (level text stays visible)
    const newAlpha = Math.max(
      0,
      this.modalOverlay.alpha - deltaTime / fadeOutDuration,
    );
    this.modalOverlay.alpha = newAlpha;
    this.modalContainer.alpha = newAlpha;

    if (newAlpha <= 0) {
      this.modalOverlay.visible = false;
      this.modalContainer.visible = false;
      this.state = "hidden";
      this.headlineText.text = "";
    }
  }

  /**
   * Draw modal layout (overlay + white container + buttons)
   */
  private drawBackground(): void {
    this.modalOverlay.clear();
    this.modalContainer.clear();
    this.backgroundPanel.clear();
    this.buttonBackground.clear();
    this.continueButtonBackground.clear();

    if (this.headlineText.text.length === 0) return;

    // Draw fullscreen semi-transparent overlay
    this.modalOverlay
      .rect(0, 0, this.viewportWidth, this.viewportHeight)
      .fill({ color: 0x000000, alpha: 0.7 });

    const padding = responsiveSpacing(
      UI_CONFIG.HEADLINE_MODAL.paddingPercent * 100,
      this.viewportWidth,
    );

    // Calculate modal dimensions with viewport constraints
    const isMobile = this.viewportWidth < 768;

    // Modal width from config (90% of screen width)
    const modalWidth =
      this.viewportWidth * UI_CONFIG.HEADLINE_MODAL.widthPercent;
    const modalPadding = padding * 4; // More padding for modal

    // Viewport margin for height calculations
    const viewportMargin = isMobile ? 20 : 40;

    // Update text wrap width to fit modal
    const maxTextWidth = modalWidth * UI_CONFIG.HEADLINE_MODAL.textWrapPercent;
    this.headlineText.style.wordWrapWidth = maxTextWidth;

    // Get text bounds AFTER setting word wrap
    const textBounds = this.headlineText.getBounds();

    // Button dimensions - READ HERE is smaller
    const readButtonWidth = modalWidth * 0.5; // Smaller button (50% instead of 80%)
    const continueButtonWidth = modalWidth * 0.8; // Continue button full width
    const buttonHeight = 50; // Reduced from 60 to 50
    const buttonSpacing = padding * 2; // Spacing between buttons

    // Total modal height: text + 2 buttons + spacing + padding
    const modalHeight =
      textBounds.height +
      buttonHeight * 2 +
      buttonSpacing * 2 +
      modalPadding * 2;

    // Ensure modal fits within viewport with margins
    const maxModalHeight = this.viewportHeight - viewportMargin * 2; // Leave margin top and bottom
    const constrainedModalHeight = Math.min(modalHeight, maxModalHeight);

    // Draw white modal container (centered) - use constrained height
    const modalX = -modalWidth / 2;
    const modalY = -constrainedModalHeight / 2;

    this.modalContainer
      .roundRect(modalX, modalY, modalWidth, constrainedModalHeight, 10)
      .fill({ color: 0xf5f5f5, alpha: 1.0 })
      .stroke({ width: 2, color: 0xcccccc });

    // Calculate available space for text (total height - buttons - padding)
    const buttonsAndPadding =
      buttonHeight * 2 + buttonSpacing * 2 + modalPadding * 2;
    const availableTextHeight = constrainedModalHeight - buttonsAndPadding;

    // Position headline text at top of modal, centered in available space
    const textY =
      modalY +
      modalPadding +
      Math.min(textBounds.height, availableTextHeight) / 2;
    this.headlineText.position.set(0, textY);

    // Draw "READ HERE" button (first button, smaller width)
    const readButtonY =
      modalY +
      constrainedModalHeight -
      modalPadding -
      buttonHeight * 1.5 -
      buttonSpacing;
    this.buttonBackground
      .roundRect(
        -readButtonWidth / 2,
        readButtonY - buttonHeight / 2,
        readButtonWidth,
        buttonHeight,
        8,
      )
      .fill({ color: 0xffffff, alpha: 1.0 })
      .stroke({ width: 3, color: 0xff0000 }); // Red border

    // Position "READ HERE" button text
    this.buttonText.position.set(0, readButtonY);

    // Draw "Continue" button (second button, below READ HERE, full width)
    const continueButtonY =
      modalY + constrainedModalHeight - modalPadding - buttonHeight / 2;
    this.continueButtonBackground
      .roundRect(
        -continueButtonWidth / 2,
        continueButtonY - buttonHeight / 2,
        continueButtonWidth,
        buttonHeight,
        8,
      )
      .fill({ color: 0xffffff, alpha: 1.0 })
      .stroke({ width: 3, color: 0xff0000 }); // Red border

    // Position "Continue" button text
    this.continueButtonText.position.set(0, continueButtonY);
  }

  /**
   * Resize for responsive layout
   * Modal is centered in viewport
   */
  public resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;

    const isMobile = width < 768;

    // Calculate font size from UI_CONFIG
    const fontSize = responsiveFontSize(
      UI_CONFIG.HEADLINE_MODAL.fontSizePercent * 100,
      width,
      UI_CONFIG.HEADLINE_MODAL.minFontSize,
      UI_CONFIG.HEADLINE_MODAL.maxFontSize,
    );
    this.headlineText.style.fontSize = fontSize;

    // Update button text font sizes
    this.buttonText.style.fontSize = isMobile ? 20 : 24;
    this.continueButtonText.style.fontSize = isMobile ? 20 : 24;

    // Update level text font size and position at top-center
    this.levelText.style.fontSize = isMobile ? 20 : 24;
    this.levelText.anchor.set(0.5, 0); // Center horizontally, top anchor vertically
    const levelPaddingTop = isMobile ? 20 : 40;
    this.levelText.position.set(width / 2, levelPaddingTop); // Center horizontally

    // Calculate word wrap width for modal (from UI_CONFIG)
    const modalWidth = width * UI_CONFIG.HEADLINE_MODAL.widthPercent;
    const maxTextWidth = modalWidth * UI_CONFIG.HEADLINE_MODAL.textWrapPercent;
    this.headlineText.style.wordWrapWidth = maxTextWidth;

    // Force text measurement by setting temporary text if needed
    const hasText = this.headlineText.text.length > 0;
    const originalText = this.headlineText.text;

    if (!hasText && this.currentHeadline.length > 0) {
      // Use the actual headline for measurement if available
      this.headlineText.text = this.currentHeadline;
    } else if (!hasText) {
      // Set sample text to measure bounds
      this.headlineText.text =
        "Breaking: Sample headline text for layout measurement";
    }

    // Restore original text
    this.headlineText.text = originalText;

    // Position modal container in CENTER of viewport
    // Modal overlay is at (0,0) and covers full viewport
    // Modal container is centered within the overlay
    this.modalOverlay.position.set(0, 0);
    this.modalContainer.position.set(width / 2, height / 2);

    // Redraw modal layout
    this.drawBackground();

    console.log(
      `[HeadlineDisplay] 📐 Modal resized: viewport ${width}x${height}, font ${fontSize}px, wrap ${Math.round(maxTextWidth)}px, centered at (${Math.round(width / 2)}, ${Math.round(height / 2)})`,
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
   * Set the current level number
   */
  public setLevel(level: number): void {
    this.currentLevel = level;
    this.levelText.text = `Level: ${level}`;
  }

  /**
   * Get the current level number
   */
  public getLevel(): number {
    return this.currentLevel;
  }

  /**
   * Cleanup
   */
  override destroy(): void {
    this.headlineText.destroy();
    this.backgroundPanel.destroy();
    this.modalOverlay.destroy();
    this.modalContainer.destroy();
    this.buttonBackground.destroy();
    this.buttonText.destroy();
    this.continueButtonBackground.destroy();
    this.continueButtonText.destroy();
    this.levelText.destroy();
    this.levelContainer.destroy();
    super.destroy();
  }
}
