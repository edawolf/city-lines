import { Container, Graphics, Text, Sprite } from "pixi.js";

import type { RoadTile } from "./RoadTile";
import { RoadType } from "./RoadTile";
import { PathValidator } from "../grid/PathValidator";
import type { EntityConfig } from "../config/types";
import type { GridUIConfig } from "../config/UIConfig";
import {
  percentToPx,
  percentSizeToPx,
  getSafeViewport,
  applySafeArea,
} from "../config/UIConfig";
import { UI_CONFIG } from "../config/ui-config";
import { ParticleManager } from "../effects/ParticleManager";
import { audioManager } from "../AudioManager";

/**
 * CityGrid Configuration
 */
export interface CityGridConfig {
  rows: number;
  cols: number;
  tileSize?: number; // Optional: will be calculated from UI config if not provided
  padding?: number;
  backgroundColor?: number;
  uiConfig?: GridUIConfig; // NEW: Percentage-based responsive config
}

/**
 * CityGrid Entity
 *
 * LISA Instructions: LINK + DISPLAY + TRIG
 *
 * Container for the road tile grid. Manages:
 * - Grid layout and positioning
 * - Path validation on tile rotation
 * - Landmark connection detection
 * - Visual feedback for completed paths
 *
 * Mechanical Layer:
 * - LINK: Maintains grid structure and connections
 * - DISPLAY: Renders grid background and debug visuals
 * - TRIG: Emits events on path completion
 *
 * Strategic Layer:
 * - TEST: Validates player solutions
 * - REWARD: Detects successful connections
 *
 * Narrative Layer:
 * - REVEAL: Triggers headline reveals on completion
 * - INVEST: Shows city restoration progress
 */
export class CityGrid extends Container {
  private config: CityGridConfig;
  private grid: (RoadTile | null)[][] = [];
  private landmarks: RoadTile[] = [];
  private turnpikes: RoadTile[] = []; // Track turnpikes separately
  private backgroundGraphics: Graphics;
  private particleContainer: Container; // Container for tile rotation particles (LOCAL space)
  private tileParticleManager: ParticleManager; // Separate manager for tile effects
  private connectionGraph?: Map<RoadTile, RoadTile[]>;
  private titleText?: Text;
  private viewportWidth = 0; // Will be set by resize() - no hardcoded default
  private viewportHeight = 0; // Will be set by resize() - no hardcoded default
  private calculatedTileSize = 80;
  private game?: any; // Reference to GameContainer for event emission

  constructor(config: EntityConfig) {
    super();

    // Extract grid config
    const defaultTileSize = Math.round(160 * UI_CONFIG.GRID.tileSizePercent);
    this.config = (config.config as CityGridConfig) ?? {
      rows: 4,
      cols: 4,
      tileSize: defaultTileSize,
      padding: UI_CONFIG.GRID.padding,
      backgroundColor: UI_CONFIG.COLORS.gridBackground,
    };

    // Initialize calculated tile size (will be updated in resize())
    this.calculatedTileSize = this.config.tileSize ?? defaultTileSize;

    // Create background (bottom layer)
    this.backgroundGraphics = new Graphics();
    this.addChild(this.backgroundGraphics);

    // Create particle container for tile rotation effects (LOCAL space, behind tiles)
    this.particleContainer = new Container();
    this.addChild(this.particleContainer);

    // Initialize ParticleManager for tile effects (local coordinate space)
    this.tileParticleManager = new ParticleManager(this.particleContainer);

    // Initialize empty grid
    for (let row = 0; row < this.config.rows; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.config.cols; col++) {
        this.grid[row][col] = null;
      }
    }

    // Title will be created in resize() based on viewport
  }

  /**
   * Draw grid background
   */
  private drawBackground(): void {
    this.backgroundGraphics.clear();

    const { rows, cols, backgroundColor } = this.config;
    const tileSize = this.calculatedTileSize || this.config.tileSize || 80;
    const padding = this.config.padding ?? 0;
    const width = cols * tileSize + padding * 2;
    const height = rows * tileSize + padding * 2;

    // Background rectangle
    this.backgroundGraphics
      .rect(-padding, -padding, width, height)
      .fill(backgroundColor ?? UI_CONFIG.COLORS.gridBackground)
      .stroke({ width: 2, color: UI_CONFIG.COLORS.gridStroke });
  }

  /**
   * Add a tile to the grid
   */
  public addTile(tile: RoadTile, row: number, col: number): void {
    if (
      row < 0 ||
      row >= this.config.rows ||
      col < 0 ||
      col >= this.config.cols
    ) {
      return;
    }

    // Position tile in grid (use calculated tile size or fallback)
    const tileSize = this.calculatedTileSize || this.config.tileSize || 80;
    const x = col * tileSize + tileSize / 2;
    const y = row * tileSize + tileSize / 2;
    tile.position.set(x, y);

    // Update grid position in tile
    tile.gridPos.row = row;
    tile.gridPos.col = col;

    // Add to grid
    this.grid[row][col] = tile;
    this.addChild(tile);

    // CRITICAL: Keep particle container BEHIND tiles (at index 1, after background)
    // This ensures tile rotation particles render behind the tiles
    this.setChildIndex(this.particleContainer, 1);

    // Track landmarks (service destinations: diner, gas station, market)
    if (tile.roadType === RoadType.Landmark) {
      this.landmarks.push(tile);
    }

    // Track turnpikes (highway gates - REQUIRED!)
    if (tile.roadType === RoadType.Turnpike) {
      this.turnpikes.push(tile);
    }

    // Listen for tile rotation events
    tile.on("tile_rotated", this.handleTileRotated.bind(this));
  }

  /**
   * Get tile at grid position
   */
  public getTile(row: number, col: number): RoadTile | null {
    if (
      row < 0 ||
      row >= this.config.rows ||
      col < 0 ||
      col >= this.config.cols
    ) {
      return null;
    }
    return this.grid[row][col];
  }

  /**
   * Handle tile rotation - rebuild graph and validate paths
   */
  private handleTileRotated(data: any): void {
    // Rebuild connection graph
    this.rebuildConnectionGraph();

    // Highlight connected roads in real-time (as soon as they connect)
    this.highlightConnectedRoads();

    // Validate all landmark connections
    this.validateLandmarkConnections();
  }

  /**
   * Rebuild the connection graph from current grid state
   */
  private rebuildConnectionGraph(): void {
    this.connectionGraph = PathValidator.buildConnectionGraph(
      this.grid as RoadTile[][],
    );
  }

  /**
   * Validate if all landmarks connect to turnpikes (NEW RULE!)
   */
  private validateLandmarkConnections(): void {
    if (!this.connectionGraph) {
      return;
    }

    // RULE 1: Check if all landmarks connect to at least one turnpike
    const landmarkResult = PathValidator.validateLandmarksConnectToTurnpikes(
      this.landmarks,
      this.turnpikes,
      this.connectionGraph,
    );

    if (!landmarkResult.allConnected) {
      return; // Don't check tiles if landmarks aren't connected
    }

    // RULE 2: Check if all road tiles are part of the landmark-to-turnpike network
    const allTiles = this.getAllTiles();
    const tilesResult = PathValidator.validateAllTilesConnected(
      allTiles,
      this.landmarks,
      this.turnpikes,
      this.connectionGraph,
    );

    if (!tilesResult.allConnected && tilesResult.disconnectedTiles) {
      return; // Level not complete if there are dead-end roads
    }

    // BOTH validations passed - level complete!

    // Play level complete sound
    audioManager.playLevelCompleteSound();

    // Highlight all connected roads
    this.highlightConnectedRoads();

    // Create confetti celebration effect
    this.createConfettiCelebration();

    // Celebrate with landmark animation
    this.celebratePuzzleSolved();

    // Emit on both self and game container for compatibility
    this.emit("path_complete", {
      landmarks: this.landmarks,
      turnpikes: this.turnpikes,
      graph: this.connectionGraph,
    });

    // Also emit on game container if available (for HeadlineReveal)
    if (!this.game && this.parent) {
      this.game = this.parent;
    }

    if (this.game && typeof this.game.emit === "function") {
      this.game.emitGame("path_complete", {
        landmarks: this.landmarks,
        turnpikes: this.turnpikes,
        graph: this.connectionGraph,
      });
    }
  }

  /**
   * Initial validation (call after all tiles added)
   */
  public performInitialValidation(): void {
    this.rebuildConnectionGraph();
    this.highlightConnectedRoads(); // Highlight any initially connected roads
    this.validateLandmarkConnections();

    // Add decorative trees to empty tiles
    this.placeTreeDecorations();
  }

  /**
   * Place decorative trees on empty grid tiles (max 2 per level)
   */
  private placeTreeDecorations(): void {
    // Find empty tiles (positions with no road tile)
    const emptyTiles: { row: number; col: number }[] = [];

    for (let row = 0; row < this.config.rows; row++) {
      for (let col = 0; col < this.config.cols; col++) {
        if (!this.grid[row][col]) {
          emptyTiles.push({ row, col });
        }
      }
    }

    if (emptyTiles.length === 0) {
      return;
    }

    // Place max 2 trees randomly
    const treeCount = Math.min(2, emptyTiles.length);
    const shuffled = emptyTiles.sort(() => Math.random() - 0.5);

    for (let i = 0; i < treeCount; i++) {
      const pos = shuffled[i];
      this.addTreeAt(pos.row, pos.col);
    }
  }

  /**
   * Add a tree decoration sprite at the specified grid position
   */
  private addTreeAt(row: number, col: number): void {
    try {
      const tree = Sprite.from("tree-1.png");

      // Calculate world position from grid coordinates
      const tileSize = this.calculatedTileSize || this.config.tileSize || 80;
      const x = col * tileSize + tileSize / 2;
      const y = row * tileSize + tileSize / 2;

      tree.position.set(x, y);
      tree.anchor.set(0.5);

      // Scale to fit tile (80% of tile size for breathing room)
      const scale = (tileSize * 0.8) / tree.width;
      tree.scale.set(scale);

      // Slight transparency and random rotation for variety
      tree.alpha = 0.9;
      tree.angle = Math.random() * 10 - 5; // ±5 degrees

      // Add to background layer (behind road tiles)
      this.backgroundGraphics.addChild(tree);
    } catch (error) {
      // Tree decoration not available - silently fail
    }
  }

  /**
   * Get all tiles in the grid
   */
  public getAllTiles(): RoadTile[] {
    const tiles: RoadTile[] = [];
    this.grid.forEach((row) => {
      row.forEach((tile) => {
        if (tile) tiles.push(tile);
      });
    });
    return tiles;
  }

  /**
   * Get all landmarks
   */
  public getLandmarks(): RoadTile[] {
    return [...this.landmarks];
  }

  /**
   * Get the tile particle manager (for tile rotation effects in LOCAL space)
   */
  public getTileParticleManager(): ParticleManager {
    return this.tileParticleManager;
  }

  /**
   * Highlight all roads connected to turnpikes (updates in real-time)
   * Changes road color to show successful connections as player rotates tiles
   */
  private highlightConnectedRoads(): void {
    if (!this.connectionGraph) {
      return;
    }

    // Find all tiles reachable from turnpikes using the connection graph
    const connectedTiles = new Set<RoadTile>();

    // Start from turnpikes and traverse the graph
    const visited = new Set<RoadTile>();
    const queue: RoadTile[] = [...this.turnpikes];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;

      visited.add(current);
      connectedTiles.add(current);

      // Get neighbors from connection graph
      const neighbors = this.connectionGraph.get(current) || [];
      neighbors.forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      });
    }

    // Get all tiles in the grid
    const allTiles = this.getAllTiles();

    // Update highlight state for all tiles
    allTiles.forEach((tile) => {
      const shouldBeHighlighted = connectedTiles.has(tile);
      tile.setHighlighted(shouldBeHighlighted);
    });
  }

  /**
   * Create confetti particle effect for level completion
   */
  private createConfettiCelebration(): void {
    try {
      // Get confetti particle manager from game container (screen-level particles)
      if (this.game && this.game.particleManager) {
        const particleManager = this.game.particleManager;

        // Pass screen dimensions (not grid dimensions)
        // Particle spawn positions are configured in particle-config.ts as percentages
        particleManager.createConfetti(this.viewportWidth, this.viewportHeight);
      }
    } catch (_error) {
      // ParticleManager not available - silently fail
    }
  }

  /**
   * Celebrate puzzle completion with landmark animation
   * Each landmark (except turnpike) scales up sequentially with 0.3s delay
   */
  public celebratePuzzleSolved(): void {
    // Filter out turnpikes - only animate landmarks
    const landmarksToAnimate = this.landmarks.filter((landmark) => {
      return landmark.roadType === RoadType.Landmark;
    });

    // Animate each landmark with 0.3s delay between them
    landmarksToAnimate.forEach((landmark, index) => {
      const delay = index * 300; // 300ms = 0.3s delay between landmarks

      setTimeout(() => {
        this.animateLandmarkCelebration(landmark);
      }, delay);
    });
  }

  /**
   * Animate a single landmark: scale up then back to original
   */
  private animateLandmarkCelebration(landmark: RoadTile): void {
    // Get the landmark sprite (home, diner, gas station, etc.)
    const sprite = landmark.getLandmarkImageSprite();

    if (!sprite) {
      return;
    }

    // Get original scale of the sprite
    const originalScale = sprite.scale.x;
    const scaleUpAmount = 0.25; // Scale up by 0.25 (e.g., 1.0 -> 1.25) - more exaggerated!
    const targetScale = originalScale + scaleUpAmount;

    // Scale up duration: 200ms
    const scaleUpDuration = 200;
    // Scale down duration: 200ms
    const scaleDownDuration = 200;

    const startTime = Date.now();
    let phase: "up" | "down" = "up";

    const animate = () => {
      const elapsed = Date.now() - startTime;

      if (phase === "up") {
        // Scale up phase
        const progress = Math.min(1, elapsed / scaleUpDuration);
        const currentScale =
          originalScale + (targetScale - originalScale) * progress;
        sprite.scale.set(currentScale);

        if (progress >= 1) {
          // Switch to scale down phase
          phase = "down";
        }
        requestAnimationFrame(animate);
      } else {
        // Scale down phase
        const downElapsed = elapsed - scaleUpDuration;
        const progress = Math.min(1, downElapsed / scaleDownDuration);
        const currentScale =
          targetScale - (targetScale - originalScale) * progress;
        sprite.scale.set(currentScale);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Ensure we end at exactly the original scale
          sprite.scale.set(originalScale);
        }
      }
    };

    animate();
  }

  /**
   * Debug: Highlight a specific path
   */
  public highlightPath(path: RoadTile[], _color: number = 0xffff00): void {
    path.forEach((tile) => {
      tile.alpha = 0.8;
      // Could add glow effect here
    });
  }

  /**
   * Reset all tile highlights
   */
  public clearHighlights(): void {
    this.getAllTiles().forEach((tile) => {
      tile.alpha = 1.0;
    });
  }

  /**
   * Resize grid based on viewport (responsive layout)
   * Ensures grid always fits within safe viewport bounds
   */
  resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;

    if (this.config.uiConfig) {
      // Get safe viewport area (respects notches, status bars, etc.)
      const safeArea = this.config.uiConfig.padding
        ? {
            all:
              typeof this.config.uiConfig.padding === "number"
                ? this.config.uiConfig.padding
                : this.config.uiConfig.padding.all,
          }
        : { all: 5 }; // Default 5% safe margin

      const safeViewport = getSafeViewport(width, height, safeArea);

      // Use percentage-based UI config within safe viewport
      const gridPos = percentToPx(this.config.uiConfig.position, width, height);
      const gridSize = percentSizeToPx(
        this.config.uiConfig.size,
        width,
        height,
      );

      // Calculate tile size based on grid size
      // Use safe viewport dimensions to ensure it fits
      const maxGridWidth = safeViewport.width * 0.9; // Use 90% of safe area
      const maxGridHeight = safeViewport.height * 0.9;

      this.calculatedTileSize = Math.min(
        gridSize.width / this.config.cols,
        gridSize.height / this.config.rows,
        maxGridWidth / this.config.cols,
        maxGridHeight / this.config.rows,
      );

      // Calculate actual grid dimensions
      const totalGridWidth = this.calculatedTileSize * this.config.cols;
      const totalGridHeight = this.calculatedTileSize * this.config.rows;

      // Apply safe area constraints to keep grid fully visible
      const constrained = applySafeArea(
        gridPos,
        { width: totalGridWidth, height: totalGridHeight },
        width,
        height,
        safeArea,
      );

      // Position grid (constrained position is already centered)
      this.position.set(
        constrained.x - totalGridWidth / 2,
        constrained.y - totalGridHeight / 2,
      );

      // Reposition all tiles
      this.grid.forEach((row, rowIndex) => {
        row.forEach((tile, colIndex) => {
          if (tile) {
            const x =
              colIndex * this.calculatedTileSize + this.calculatedTileSize / 2;
            const y =
              rowIndex * this.calculatedTileSize + this.calculatedTileSize / 2;
            tile.position.set(x, y);
            // Update tile size if it has a resize method
            if ("resize" in tile && typeof tile.resize === "function") {
              (tile as any).resize(this.calculatedTileSize);
            }
          }
        });
      });

      this.drawBackground();
    } else {
      // Fallback: center grid in viewport using old config
      const tileSize = this.config.tileSize ?? 80;
      const totalWidth = this.config.cols * tileSize;
      const totalHeight = this.config.rows * tileSize;

      this.position.set((width - totalWidth) / 2, (height - totalHeight) / 2);
    }
  }

  /**
   * Update - particle system and visual effects
   */
  update(deltaTime: number): void {
    // Update tile particle system (local effects)
    try {
      this.tileParticleManager.update(deltaTime);
    } catch (error) {
      // ParticleManager not initialized yet - silently ignore
    }
  }

  /**
   * Clean up
   */
  override destroy(): void {
    this.grid.forEach((row) => {
      row.forEach((tile) => {
        tile?.destroy();
      });
    });
    this.grid = [];
    this.landmarks = [];
    super.destroy();
  }
}
