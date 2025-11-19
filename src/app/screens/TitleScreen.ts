import { Container, Graphics, Text } from "pixi.js";
import type { Ticker } from "pixi.js";
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion/react";
import { FancyButton } from "@pixi/ui";

import { engine } from "../getEngine";
import { UI_CONFIG } from "../../ludemic/config/ui-config";
import { responsiveFontSize } from "../../ludemic/config/UIConfig";
import {
  RoadTile,
  RoadType,
  LandmarkType,
} from "../../ludemic/entities/RoadTile";
import { ParticleManager } from "../../ludemic/effects/ParticleManager";
import { PathValidator } from "../../ludemic/grid/PathValidator";

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
  private startButton!: FancyButton;
  private screenWidth = 0;
  private screenHeight = 0;
  private miniPuzzle!: Container;
  private puzzleTiles: RoadTile[] = [];
  private particleContainer!: Container;
  private particleManager!: ParticleManager;
  private handHint?: Text;

  constructor() {
    super();
  }

  /**
   * Called when screen is shown
   */
  async show(): Promise<void> {
    // Load the custom fonts before creating text
    await Promise.all([
      document.fonts.load('400 72px "Protest Guerrilla"'),
      document.fonts.load('400 20px "Zain"'),
      document.fonts.load('700 24px "Zain"')
    ]);

    // Create dark background
    this.background = new Graphics();
    this.addChild(this.background);

    // Create particle container (behind other elements)
    this.particleContainer = new Container();
    // CRITICAL: Make particle container non-interactive so it doesn't block button clicks
    this.particleContainer.eventMode = "none";
    this.particleContainer.interactiveChildren = false;
    this.addChild(this.particleContainer);

    // Initialize ParticleManager for title screen
    this.particleManager = new ParticleManager(this.particleContainer);

    // Create title text (will be sized in resize())
    this.titleText = new Text({
      text: "CITY LINES",
      style: {
        fontSize: 72, // Placeholder, will be updated in resize()
        fill: 0xffffff,
        fontFamily: '"Protest Guerrilla", sans-serif',
        fontWeight: 400,
        align: "center",
      },
    });
    this.titleText.anchor.set(0.5);
    this.titleText.alpha = 0; // Start invisible for animation
    this.addChild(this.titleText);

    // Create tagline text (will be sized in resize())
    this.taglineText = new Text({
      text: "Tap to rotate and connect New Jersey Roads!",
      style: {
        fontSize: 20, // Placeholder, will be updated in resize()
        fill: 0xffffff,
        fontFamily: '"Zain", sans-serif',
        fontWeight: 400,
        align: "center",
        wordWrap: true,
        wordWrapWidth: 600, // Placeholder, will be updated in resize()
      },
    });
    this.taglineText.anchor.set(0.5);
    this.taglineText.alpha = 0; // Start invisible for animation
    this.addChild(this.taglineText);

    // Create start button (will be sized in resize())
    const buttonText = new Text({
      text: "Click to Start",
      style: {
        fontSize: 24,
        fill: 0xffffff,
        fontFamily: '"Zain", sans-serif',
        fontWeight: 700,
      },
    });

    this.startButton = new FancyButton({
      defaultView: new Graphics().rect(0, 0, 200, 60).fill(0x4caf50),
      hoverView: new Graphics().rect(0, 0, 200, 60).fill(0x66bb6a),
      pressedView: new Graphics().rect(0, 0, 200, 60).fill(0x388e3c),
      text: buttonText,
    });
    this.startButton.anchor.set(0.5);
    this.startButton.alpha = 0; // Start invisible for animation
    this.addChild(this.startButton);

    // Create mini puzzle (3x1 grid: House, Road, Turnpike)
    this.miniPuzzle = new Container();

    // Add getTileParticleManager method so tiles can access particles
    (this.miniPuzzle as any).getTileParticleManager = () => this.particleManager;
    console.log("[TitleScreen] 🎯 Added getTileParticleManager to miniPuzzle:", {
      hasMethod: !!(this.miniPuzzle as any).getTileParticleManager,
      particleManager: this.particleManager
    });

    await this.createMiniPuzzle();
    this.addChild(this.miniPuzzle);

    // Move particle container ABOVE tiles so particles render on top
    this.setChildIndex(this.particleContainer, this.children.length - 1);

    // Listen for tile rotations to update highlights
    this.puzzleTiles.forEach((tile) => {
      tile.on("tile_rotated", () => {
        this.updateTileHighlights();
        this.hideHandHint(); // Hide hint after first interaction
      });
    });

    // Initial highlight check
    this.updateTileHighlights();

    // Create animated hand hint pointing at middle tile
    this.createHandHint();

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

    // Fade in start button
    const buttonAnim = animate(
      this.startButton,
      { alpha: 1 },
      { duration: 0.6, ease: "easeOut" },
    );
    await buttonAnim;
  }

  /**
   * Start pulsing animation on start button
   */
  private startPromptPulse(): void {
    const pulse = () => {
      animate(
        this.startButton.scale,
        { x: [1, 1.05, 1], y: [1, 1.05, 1] },
        { duration: 2.0, ease: "easeInOut" },
      ).finished.then(() => {
        // Loop pulse animation
        if (this.startButton && this.startButton.parent) {
          pulse();
        }
      });
    };
    pulse();
  }

  /**
   * Create mini puzzle (3x1 grid: House, Road, Turnpike)
   */
  private async createMiniPuzzle(): Promise<void> {
    const tileSize = 160; // Fixed tile size for title screen

    // Create House tile (left) - rotation 90 for horizontal (East-West)
    const houseTile = new RoadTile({
      type: "RoadTile",
      position: { x: 0, y: 0 },
      config: {
        tileType: "straight",
        roadType: RoadType.House,
        rotation: 90,
        rotatable: true,
        size: tileSize,
        gridPos: { row: 0, col: 0 },
        landmarkType: LandmarkType.Home,
      },
    });
    this.puzzleTiles.push(houseTile);
    this.miniPuzzle.addChild(houseTile);

    // Create Road tile (middle) - rotation 0 (vertical, disconnected)
    const roadTile = new RoadTile({
      type: "RoadTile",
      position: { x: 0, y: 0 },
      config: {
        tileType: "straight",
        roadType: RoadType.LocalRoad,
        rotation: 0,
        rotatable: true,
        size: tileSize,
        gridPos: { row: 0, col: 1 },
      },
    });
    this.puzzleTiles.push(roadTile);
    this.miniPuzzle.addChild(roadTile);

    // Create Turnpike tile (right) - rotation 90 for horizontal (East-West)
    const turnpikeTile = new RoadTile({
      type: "RoadTile",
      position: { x: 0, y: 0 },
      config: {
        tileType: "straight",
        roadType: RoadType.Turnpike,
        rotation: 90,
        rotatable: true,
        size: tileSize,
        gridPos: { row: 0, col: 2 },
      },
    });
    this.puzzleTiles.push(turnpikeTile);
    this.miniPuzzle.addChild(turnpikeTile);

    // Wait a frame for tiles to initialize their sprites
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  /**
   * Setup button click listener
   */
  private setupInputListeners(): void {
    // Button click listener
    this.startButton.onPress.connect(() => {
      this.startGame();
    });
  }

  /**
   * Start the game (transition to level 1)
   */
  private async startGame(): Promise<void> {
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

    const config = UI_CONFIG.TITLE_SCREEN;

    const centerX = width / 2;
    const centerY = height / 2;

    // Safe area padding (5% on each side)
    const safeAreaPadding = width * 0.05;
    const minX = safeAreaPadding;
    const maxX = width - safeAreaPadding;
    const minY = safeAreaPadding;
    const maxY = height - safeAreaPadding;

    // Update background
    if (this.background) {
      this.background.clear();
      this.background
        .rect(0, 0, width, height)
        .fill(UI_CONFIG.COLORS.gridBackground);
    }

    // Update and position title text
    if (this.titleText) {
      const titleFontSize = responsiveFontSize(
        config.title.fontSizePercent * 100,
        width,
        config.title.minFontSize,
        config.title.maxFontSize,
      );
      this.titleText.style.fontSize = titleFontSize;
      this.titleText.style.wordWrap = true;
      this.titleText.style.wordWrapWidth = maxX - minX;
      this.titleText.x = centerX;

      // Calculate desired Y position
      let titleY = centerY + height * config.title.offsetFromCenterPercent;
      // Clamp to safe area
      const titleHalfHeight = this.titleText.height / 2;
      titleY = Math.max(
        minY + titleHalfHeight,
        Math.min(maxY - titleHalfHeight, titleY),
      );
      this.titleText.y = titleY;
    }

    // Update and position tagline text
    if (this.taglineText) {
      const taglineFontSize = responsiveFontSize(
        config.tagline.fontSizePercent * 100,
        width,
        config.tagline.minFontSize,
        config.tagline.maxFontSize,
      );
      const wrapWidth = width * config.tagline.wordWrapPercent;

      this.taglineText.style.fontSize = taglineFontSize;
      this.taglineText.style.wordWrap = true;
      this.taglineText.style.wordWrapWidth = wrapWidth;
      this.taglineText.text = this.taglineText.text; // Force text update
      this.taglineText.x = centerX;

      // Calculate desired Y position
      let taglineY = centerY + height * config.tagline.offsetFromCenterPercent;
      // Clamp to safe area
      const taglineHalfHeight = this.taglineText.height / 2;
      taglineY = Math.max(
        minY + taglineHalfHeight,
        Math.min(maxY - taglineHalfHeight, taglineY),
      );
      this.taglineText.y = taglineY;
    }

    // Update and position start button
    if (this.startButton) {
      this.startButton.x = centerX;

      // Calculate desired Y position
      let buttonY = height - height * config.prompt.offsetFromBottomPercent;
      // Clamp to safe area
      const buttonHalfHeight = this.startButton.height / 2;
      buttonY = Math.max(
        minY + buttonHalfHeight,
        Math.min(maxY - buttonHalfHeight, buttonY),
      );
      this.startButton.y = buttonY;
    }

    // Update and position intro puzzle (horizontal grid layout)
    if (this.miniPuzzle && this.puzzleTiles.length > 0) {
      const puzzleConfig = config.introPuzzle;
      const tileSize = 160; // Base tile size (unscaled)

      // Calculate responsive scale for the entire puzzle
      const desiredTileSize = Math.max(
        puzzleConfig.minTileSize,
        Math.min(
          puzzleConfig.maxTileSize,
          width * puzzleConfig.tileSizePercent,
        ),
      );
      const scale = desiredTileSize / tileSize;

      // Position tiles horizontally centered around origin
      // Tiles are drawn centered at their position, so offset by half tile to center the group
      this.puzzleTiles.forEach((tile, index) => {
        tile.position.set((index - 1) * tileSize, 0);
      });

      // Apply scale to entire puzzle
      this.miniPuzzle.scale.set(scale);

      // Position the puzzle container at screen center
      this.miniPuzzle.x = centerX;
      this.miniPuzzle.y =
        centerY + height * puzzleConfig.offsetFromCenterPercent;
    }

    // Position hand hint below middle tile
    if (this.handHint && this.puzzleTiles.length > 1) {
      const middleTile = this.puzzleTiles[1]; // Middle road tile
      const tileWorldPos = this.miniPuzzle.toGlobal(middleTile.position);
      this.handHint.x = tileWorldPos.x + 20;
      this.handHint.y = tileWorldPos.y + 30; // 100px below the tile
    }
  }

  /**
   * Hide screen with animations
   */
  async hide(): Promise<void> {
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
    if (this.startButton) {
      fadeOutPromises.push(
        animate(this.startButton, { alpha: 0 }, { duration: 0.3 }),
      );
    }

    // Wait for all animations to complete
    await Promise.all(fadeOutPromises.map((anim) => anim.finished));
  }

  /**
   * Create animated hand hint pointing at middle tile
   */
  private createHandHint(): void {
    // Create hand emoji text
    this.handHint = new Text({
      text: "👆",
      style: {
        fontSize: 80,
        fill: 0xffffff,
      },
    });
    this.handHint.anchor.set(0.5);
    this.handHint.alpha = 0;
    this.addChild(this.handHint);

    // Start animation immediately
    this.startHandHintAnimation();
  }

  /**
   * Animate hand hint - rotate left and back
   */
  private startHandHintAnimation(): void {
    if (!this.handHint) return;

    // Fade in
    animate(this.handHint, { alpha: 1 }, { duration: 0.5 });

    // Rotation animation loop - center to left, then left to center
    const rotateLoop = () => {
      if (!this.handHint || !this.handHint.parent) return;

      // Start at center (0), rotate to left (-0.52 radians / -30 degrees)
      animate(
        this.handHint,
        {
          rotation: -0.52, // Rotate from center to left
          alpha: 0.8
        },
        { duration: 0.75, ease: "easeInOut" }
      ).finished.then(() => {
        if (!this.handHint || !this.handHint.parent) return;

        // Rotate back from left to center
        animate(
          this.handHint,
          {
            rotation: 0, // Rotate from left back to center
            alpha: 1
          },
          { duration: 0.75, ease: "easeInOut" }
        ).finished.then(() => {
          if (this.handHint && this.handHint.parent) {
            setTimeout(rotateLoop, 500); // Pause at center before next loop
          }
        });
      });
    };
    rotateLoop();
  }

  /**
   * Hide hand hint (called when user clicks a tile)
   */
  private hideHandHint(): void {
    if (this.handHint) {
      animate(this.handHint, { alpha: 0 }, { duration: 0.3 }).finished.then(() => {
        if (this.handHint) {
          this.removeChild(this.handHint);
          this.handHint.destroy();
          this.handHint = undefined;
        }
      });
    }
  }

  /**
   * Update tile highlights based on connections
   */
  private updateTileHighlights(): void {
    // Build connection graph - tiles are in ONE ROW (horizontal)
    const grid: (RoadTile | null)[][] = [[this.puzzleTiles[0], this.puzzleTiles[1], this.puzzleTiles[2]]];
    const connectionGraph = PathValidator.buildConnectionGraph(grid);

    // Find turnpike (last tile)
    const turnpike = this.puzzleTiles[2];

    // BFS from turnpike to find all connected tiles
    const connectedTiles = new Set<RoadTile>();
    const visited = new Set<RoadTile>();
    const queue: RoadTile[] = [turnpike];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;

      visited.add(current);
      connectedTiles.add(current);

      const neighbors = connectionGraph.get(current) || [];
      neighbors.forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      });
    }

    // Update highlights for all tiles
    this.puzzleTiles.forEach((tile) => {
      tile.setHighlighted(connectedTiles.has(tile));
    });
  }

  /**
   * Update loop - needed for particle animations
   */
  update(time: Ticker): void {
    // Update particle manager (which handles ParticleSystem updates properly)
    if (this.particleManager) {
      this.particleManager.update(time.deltaTime / 60); // Convert from frame delta to seconds
    }
  }

  /**
   * Cleanup when screen is destroyed
   */
  destroy(): void {
    super.destroy();
  }
}
