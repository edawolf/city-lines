import { Container, Text, Graphics } from "pixi.js";
import { responsiveFontSize, responsiveSpacing } from "../config/UIConfig";
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
  private headlineText: Text; // Headline text that appears below level text
  private backgroundPanel: Graphics;
  private modalOverlay: Graphics; // Semi-transparent fullscreen overlay (DEPRECATED - not used)
  private modalContainer: Graphics; // White modal box (DEPRECATED - not used)
  private buttonBackground: Graphics; // "READ HERE" button background (DEPRECATED - not used)
  private buttonText: Text; // "READ HERE" button text (DEPRECATED - not used)
  private continueButtonBackground: Graphics; // "Continue" button background (DEPRECATED - not used)
  private continueButtonText: Text; // "Continue" button text (DEPRECATED - not used)
  private levelText: Text; // "Level: X" display at top center (always visible)
  private levelContainer: Container; // Persistent container for level text (always visible)
  private headlineContainer: Container; // Container for inline headline text (below level text)
  private viewportWidth = 0; // Will be set by resize() - no hardcoded default
  private viewportHeight = 0; // Will be set by resize() - no hardcoded default
  private currentLevel = 1; // Track current level number
  private game: any; // Reference to game container for emitting events

  // Animation state
  private currentHeadline = "";
  private displayedChars = 0;
  private typewriterTimer = 0;
  private displayTimer = 0;
  private state: "hidden" | "typing" | "displaying" | "fading" = "hidden";
  private hasEmittedContinue = false; // Track if continue event already emitted

  constructor(config: HeadlineDisplayConfig = {}) {
    super();
    this.config = config;

    // Create persistent level container (always visible at top center)
    this.levelContainer = new Container();
    this.levelContainer.visible = true; // Always visible
    this.addChild(this.levelContainer);

    // Create headline container (below level text, no modal)
    this.headlineContainer = new Container();
    this.headlineContainer.visible = false; // Hidden until headline shown
    this.addChild(this.headlineContainer);

    // DEPRECATED: Modal overlay (kept for compatibility but not used)
    this.modalOverlay = new Graphics();
    this.modalOverlay.visible = false;
    this.addChild(this.modalOverlay);

    // DEPRECATED: Modal container (kept for compatibility but not used)
    this.modalContainer = new Graphics();
    this.modalContainer.visible = false;
    this.addChild(this.modalContainer);

    // Create background panel for headline text (rounded rectangle)
    this.backgroundPanel = new Graphics();
    this.headlineContainer.addChild(this.backgroundPanel);

    // Create headline text (appears below level text with typewriter animation)
    this.headlineText = new Text({
      text: "",
      style: {
        fontSize: 20, // Will be updated in resize()
        fill: 0xffffff, // White text (same as level text)
        fontFamily: "Arial, sans-serif",
        fontWeight: "bold",
        align: "center",
        wordWrap: true,
        wordWrapWidth: 700, // Will be updated in resize()
        breakWords: false,
      },
    });
    this.headlineText.anchor.set(0.5, 0); // Center horizontally, top anchor vertically
    this.headlineContainer.addChild(this.headlineText);

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

    // Emit event so PrimitiveTestScreen can advance to next level
    if (!this.hasEmittedContinue) {
      this.hasEmittedContinue = true;
      this.emit("continue_clicked");

      // Also emit on game container if available
      if (this.game && typeof this.game.emitGame === "function") {

        this.game.emitGame("continue_clicked");
      }
    }
    // Hide the modal immediately when button is clicked
    this.hide();
  }

  /**
   * Set the game container reference (for emitting events)
   */
  setGame(game: any): void {
    this.game = game;
  }

  /**
   * Show a new headline with typewriter animation (inline below level text, no modal)
   */
  public show(headline: string): void {
    console.log(
      `[HeadlineDisplay] 🎬 show() called with headline: "${headline}"`,
    );

    this.currentHeadline = headline;
    this.displayedChars = 0;
    this.typewriterTimer = 0;
    this.displayTimer = 0;
    this.state = "typing";
    this.hasEmittedContinue = false; // Reset flag for new headline

    // Show headline container (inline, no modal)
    this.headlineContainer.visible = true;
    this.headlineContainer.alpha = 1; // Fully visible immediately

    // Modal elements stay hidden
    this.modalOverlay.visible = false;
    this.modalContainer.visible = false;

    console.log(
      `[HeadlineDisplay] Headline container shown (inline mode, no modal)`,
    );

    // If viewport dimensions haven't been set yet (still 0x0), try to get them from the parent
    if (this.viewportWidth === 0 || this.viewportHeight === 0) {
      // Try to get dimensions from parent GameContainer
      const parent = this.parent;
      if (parent && "viewportWidth" in parent && "viewportHeight" in parent) {
        this.viewportWidth = (parent as any).viewportWidth;
        this.viewportHeight = (parent as any).viewportHeight;

      } else {

        this.viewportWidth = 800;
        this.viewportHeight = 600;
      }
    }

    // Recalculate position with actual headline text
    this.resize(this.viewportWidth, this.viewportHeight);

    console.log(`[HeadlineDisplay] ✅ show() complete, state: ${this.state}`);
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
   * Typewriter animation (inline mode - no modal fade-in)
   */
  private updateTypewriter(deltaTime: number): void {
    const typewriterSpeed = UI_CONFIG.HEADLINE_MODAL.typewriterSpeed;

    // Type characters (no modal fade-in needed)
    this.typewriterTimer += deltaTime;
    const charsToShow = Math.floor(this.typewriterTimer * typewriterSpeed);

    if (charsToShow > this.displayedChars) {
      this.displayedChars = Math.min(charsToShow, this.currentHeadline.length);
      this.headlineText.text = this.currentHeadline.substring(
        0,
        this.displayedChars,
      );

      // Redraw background panel to match text size
      this.drawHeadlineBackground();
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
   * Fade out animation (fade out inline headline text)
   */
  private updateFadeOut(deltaTime: number): void {
    const fadeOutDuration = UI_CONFIG.HEADLINE_MODAL.fadeOutDuration;

    // Fade out headline container (not modal - level text stays visible)
    const newAlpha = Math.max(
      0,
      this.headlineContainer.alpha - deltaTime / fadeOutDuration,
    );
    this.headlineContainer.alpha = newAlpha;

    if (newAlpha <= 0) {
      this.headlineContainer.visible = false;
      this.state = "hidden";
      this.headlineText.text = "";

      // Emit continue event when headline finishes fading out
      // This allows the game to proceed to next level automatically
      // Only emit if user didn't already click Continue button
      if (!this.hasEmittedContinue) {

        this.hasEmittedContinue = true;
        this.emit("continue_clicked");
      }
    }
  }

  /**
   * Draw background panel for inline headline text
   */
  private drawHeadlineBackground(): void {
    this.backgroundPanel.clear();

    if (this.headlineText.text.length === 0) {
      return;
    }

    // Get padding from config (convert percentage to pixels)
    const padding =
      this.viewportWidth * UI_CONFIG.HEADLINE_MODAL.paddingPercent;

    // Background width from config
    const bgWidth = this.viewportWidth * UI_CONFIG.HEADLINE_MODAL.widthPercent;

    // Get text bounds for height (local bounds to avoid global position issues)
    const textBounds = this.headlineText.getLocalBounds();
    const bgHeight = textBounds.height + padding * 2;

    // Draw rounded rectangle background (semi-transparent dark)
    // Position from top-left since text anchor is (0.5, 0)
    this.backgroundPanel
      .roundRect(-bgWidth / 2, -padding, bgWidth, bgHeight, 10)
      .fill({ color: 0x000000, alpha: 0.7 })
      .stroke({ width: 2, color: 0xffffff, alpha: 0.5 });

    // Position text at top, centered horizontally
    this.headlineText.position.set(0, 0);
  }

  /**
   * Draw modal layout (overlay + white container + buttons) - DEPRECATED
   */
  private drawBackground(): void {
    console.log(
      `[HeadlineDisplay] 🎨 drawBackground() called, text length: ${this.headlineText.text.length}`,
    );

    this.modalOverlay.clear();
    this.modalContainer.clear();
    this.backgroundPanel.clear();
    this.buttonBackground.clear();
    this.continueButtonBackground.clear();

    if (this.headlineText.text.length === 0) {
      console.log(`[HeadlineDisplay] ⚠️ drawBackground() skipped - no text`);
      return;
    }

    // Draw fullscreen semi-transparent overlay
    this.modalOverlay
      .rect(0, 0, this.viewportWidth, this.viewportHeight)
      .fill({ color: 0x000000, alpha: 0.7 });

    const padding = responsiveSpacing(
      UI_CONFIG.HEADLINE_MODAL.paddingPercent * 100,
      this.viewportWidth,
    );

    // Calculate modal dimensions with viewport constraints
    // Modal width from config (70% of screen width)
    const modalWidth =
      this.viewportWidth * UI_CONFIG.HEADLINE_MODAL.widthPercent;
    const modalPadding = padding * 4; // More padding for modal

    // Maximum modal height from config (80% of screen height)
    const maxModalHeight =
      this.viewportHeight * UI_CONFIG.HEADLINE_MODAL.heightPercent;

    // Update text wrap width to fit modal
    const maxTextWidth = modalWidth * UI_CONFIG.HEADLINE_MODAL.textWrapPercent;
    this.headlineText.style.wordWrapWidth = maxTextWidth;

    // Get text bounds AFTER setting word wrap
    const textBounds = this.headlineText.getBounds();

    // Button dimensions - READ HERE is smaller
    const readButtonWidth = modalWidth * 0.5; // Smaller button (50% instead of 80%)
    const continueButtonWidth = modalWidth * 0.8; // Continue button full width
    const buttonHeight = 50; // Fixed button height
    const buttonSpacing = padding * 2; // Spacing between buttons

    // Calculate required space for buttons and padding
    const buttonsAndPadding =
      buttonHeight * 2 + buttonSpacing * 2 + modalPadding * 2;

    // Calculate ideal modal height (text + buttons + padding)
    const idealModalHeight = textBounds.height + buttonsAndPadding;

    // Constrain modal height to fit viewport (use smaller of ideal or max)
    const constrainedModalHeight = Math.min(idealModalHeight, maxModalHeight);

    // Calculate available height for text after reserving space for buttons
    const availableTextHeight = constrainedModalHeight - buttonsAndPadding;

    // Draw white modal container (centered) - use constrained height
    const modalX = -modalWidth / 2;
    const modalY = -constrainedModalHeight / 2;

    // Get actual screen bounds
    const actualBounds = this.getBounds();
    const modalContainerBounds = this.modalContainer.getBounds();

    // Debug logging
    console.log(`[HeadlineDisplay] Modal sizing:
      Viewport: ${this.viewportWidth}x${this.viewportHeight}
      Modal width: ${Math.round(modalWidth)}px (${UI_CONFIG.HEADLINE_MODAL.widthPercent * 100}%)
      Modal X range (calculated): ${Math.round(this.viewportWidth / 2 + modalX)} to ${Math.round(this.viewportWidth / 2 + modalX + modalWidth)}
      HeadlineDisplay position: (${Math.round(this.x)}, ${Math.round(this.y)})
      HeadlineDisplay bounds: X ${Math.round(actualBounds.x)} to ${Math.round(actualBounds.x + actualBounds.width)}, Y ${Math.round(actualBounds.y)} to ${Math.round(actualBounds.y + actualBounds.height)}
      ModalContainer actual bounds: X ${Math.round(modalContainerBounds.x)} to ${Math.round(modalContainerBounds.x + modalContainerBounds.width)}
      Max modal height: ${Math.round(maxModalHeight)}px (${UI_CONFIG.HEADLINE_MODAL.heightPercent * 100}%)
      Text bounds: ${Math.round(textBounds.width)}x${Math.round(textBounds.height)}px
      Text wrap width: ${Math.round(maxTextWidth)}px
      Buttons+padding: ${Math.round(buttonsAndPadding)}px
      Ideal height: ${Math.round(idealModalHeight)}px
      Constrained height: ${Math.round(constrainedModalHeight)}px
      Available text height: ${Math.round(availableTextHeight)}px
      Modal container position: (${Math.round(this.viewportWidth / 2)}, ${Math.round(this.viewportHeight / 2)})
      Modal local bounds: X ${Math.round(modalX)} to ${Math.round(modalX + modalWidth)}, Y ${Math.round(modalY)} to ${Math.round(modalY + constrainedModalHeight)}
    `);

    this.modalContainer
      .roundRect(modalX, modalY, modalWidth, constrainedModalHeight, 10)
      .fill({ color: 0xf5f5f5, alpha: 1.0 })
      .stroke({ width: 2, color: 0xcccccc });

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
   * Level text at top center, headline text below it
   */
  public resize(width: number, height: number): void {
    console.log(
      `[HeadlineDisplay] 📏 resize() called with: ${width}x${height} (previous: ${this.viewportWidth}x${this.viewportHeight})`,
    );
    this.viewportWidth = width;
    this.viewportHeight = height;

    // Detect mobile for potential future responsive adjustments
    const _isMobile = width < 768;

    // Calculate headline font size from UI_CONFIG (slightly smaller than level text)
    const headlineFontSize = responsiveFontSize(
      UI_CONFIG.HEADLINE_MODAL.fontSizePercent * 100,
      width,
      UI_CONFIG.HEADLINE_MODAL.minFontSize,
      UI_CONFIG.HEADLINE_MODAL.maxFontSize,
    );
    this.headlineText.style.fontSize = headlineFontSize;

    // Update level text font size and position at top-center (from config)
    const levelFontSize = responsiveFontSize(
      UI_CONFIG.HEADLINE_MODAL.levelFontSizePercent * 100,
      width,
      UI_CONFIG.HEADLINE_MODAL.levelMinFontSize,
      UI_CONFIG.HEADLINE_MODAL.levelMaxFontSize,
    );
    this.levelText.style.fontSize = levelFontSize;
    this.levelText.anchor.set(0.5, 0); // Center horizontally, top anchor vertically
    const levelPaddingTop =
      height * UI_CONFIG.HEADLINE_MODAL.levelPaddingTopPercent;

    // Position the levelContainer (which contains levelText)
    this.levelContainer.position.set(width / 2, levelPaddingTop);
    // levelText is at (0,0) within its container
    this.levelText.position.set(0, 0);

    // Position headline container (from config)
    const headlinePaddingTop =
      height * UI_CONFIG.HEADLINE_MODAL.headlinePaddingTopPercent;
    this.headlineContainer.position.set(width / 2, headlinePaddingTop);

    // Calculate word wrap width for headline text (from config)
    const padding = width * UI_CONFIG.HEADLINE_MODAL.paddingPercent;
    const maxBgWidth = width * UI_CONFIG.HEADLINE_MODAL.widthPercent;
    const maxTextWidth = maxBgWidth - padding * 2; // Account for padding inside background

    // Store current text and clear it to force recalculation
    const currentText = this.headlineText.text;
    if (currentText.length > 0) {
      this.headlineText.text = "";
    }

    // Update word wrap width
    this.headlineText.style.wordWrapWidth = maxTextWidth;

    // Restore text (this forces PixiJS to recalculate with new wrap width)
    if (currentText.length > 0) {
      this.headlineText.text = currentText;
    }

    // Redraw background if text is visible
    if (this.headlineText.text.length > 0) {
      this.drawHeadlineBackground();
    }
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
