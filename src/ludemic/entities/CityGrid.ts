import { Container, Graphics, Text } from "pixi.js";

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
  private connectionGraph?: Map<RoadTile, RoadTile[]>;
  private titleText?: Text;
  private viewportWidth = 800;
  private viewportHeight = 600;
  private calculatedTileSize = 80;
  private game?: any; // Reference to GameContainer for event emission

  constructor(config: EntityConfig) {
    super();

    // Extract grid config
    this.config = (config.config as CityGridConfig) ?? {
      rows: 4,
      cols: 4,
      tileSize: 80,
      padding: 10,
      backgroundColor: 0x1a1a2e,
    };

    // Initialize calculated tile size (will be updated in resize())
    this.calculatedTileSize = this.config.tileSize ?? 80;

    // Create background
    this.backgroundGraphics = new Graphics();
    this.addChild(this.backgroundGraphics);

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
      .fill(backgroundColor ?? 0x1a1a2e)
      .stroke({ width: 2, color: 0x0f3460 });
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
      console.warn(`[CityGrid] Invalid grid position: (${row}, ${col})`);
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

    // Track landmarks (service destinations: diner, gas station, market)
    if (tile.roadType === RoadType.Landmark) {
      this.landmarks.push(tile);
      console.log(
        `[CityGrid] 🏛️ Landmark added at (${row}, ${col}): ${tile.landmarkType || "unknown"}`,
      );
    }

    // Track turnpikes (highway gates - REQUIRED!)
    if (tile.roadType === RoadType.Turnpike) {
      this.turnpikes.push(tile);
      console.log(`[CityGrid] 🚧 Turnpike added at (${row}, ${col})`);
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
    console.log(
      `[CityGrid] 🔄 Tile rotated at (${data.gridPos.row}, ${data.gridPos.col})`,
    );

    // Rebuild connection graph
    this.rebuildConnectionGraph();

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
    console.log(`[CityGrid] 🗺️ Connection graph rebuilt`);

    // Debug: print graph
    if (this.connectionGraph) {
      PathValidator.debugPrintGraph(this.connectionGraph);
    }
  }

  /**
   * Validate if all landmarks connect to turnpikes (NEW RULE!)
   */
  private validateLandmarkConnections(): void {
    console.log(`[CityGrid] 🔍 Validating landmark → turnpike connections...`);
    console.log(`[CityGrid] 🏛️ Landmarks: ${this.landmarks.length}`);
    console.log(`[CityGrid] 🚧 Turnpikes: ${this.turnpikes.length}`);

    if (!this.connectionGraph) {
      console.log(`[CityGrid] ⚠️ Skipping validation - no connection graph`);
      return;
    }

    // RULE 1: Check if all landmarks connect to at least one turnpike
    const landmarkResult = PathValidator.validateLandmarksConnectToTurnpikes(
      this.landmarks,
      this.turnpikes,
      this.connectionGraph,
    );

    console.log(
      `[CityGrid] Landmark validation: ${landmarkResult.allConnected ? "CONNECTED ✅" : "NOT CONNECTED ❌"}`,
    );

    if (!landmarkResult.allConnected) {
      console.log("❌ [CityGrid] Some landmarks not connected to turnpikes");
      if (landmarkResult.disconnectedLandmarks) {
        landmarkResult.disconnectedLandmarks.forEach((landmark) => {
          console.log(
            `   ❌ Landmark at (${landmark.gridPos.row},${landmark.gridPos.col}) cannot reach any turnpike`,
          );
        });
      }
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

    console.log(
      `[CityGrid] Tiles validation: ${tilesResult.allConnected ? "ALL CONNECTED ✅" : "DISCONNECTED ROADS ❌"}`,
    );

    if (!tilesResult.allConnected && tilesResult.disconnectedTiles) {
      console.log(
        "❌ [CityGrid] Some road tiles are not part of any landmark-to-turnpike path:",
      );
      tilesResult.disconnectedTiles.forEach((tile) => {
        console.log(
          `   ❌ Dead-end road at (${tile.gridPos.row},${tile.gridPos.col}) - ${tile.roadType}`,
        );
      });
      return; // Level not complete if there are dead-end roads
    }

    // BOTH validations passed - level complete!
    console.log("✅ [CityGrid] All landmarks connected to turnpikes!");
    console.log("✅ [CityGrid] All road tiles are part of valid paths!");
    console.log("🎉 LEVEL COMPLETE!");

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
      console.log("📢 [CityGrid] Emitting path_complete on game container");
      this.game.emit("path_complete", {
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
    console.log("[CityGrid] 🔍 Performing initial validation...");
    this.rebuildConnectionGraph();
    this.validateLandmarkConnections();
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
   * Debug: Highlight a specific path
   */
  public highlightPath(path: RoadTile[], color: number = 0xffff00): void {
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

      console.log(
        `[CityGrid] 📐 Resized to ${width}x${height}, safe area: ${safeViewport.width}x${safeViewport.height}, tile size: ${this.calculatedTileSize}px`,
      );
    } else {
      // Fallback: center grid in viewport using old config
      const tileSize = this.config.tileSize ?? 80;
      const totalWidth = this.config.cols * tileSize;
      const totalHeight = this.config.rows * tileSize;

      this.position.set((width - totalWidth) / 2, (height - totalHeight) / 2);

      console.log(
        `[CityGrid] 📐 Resized to ${width}x${height} (fallback mode)`,
      );
    }
  }

  /**
   * Update - no per-frame logic needed yet
   */
  update(deltaTime: number): void {
    // Future: animate connections, update visual effects
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
