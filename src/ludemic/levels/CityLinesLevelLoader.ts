import type { GameConfig } from "../config/types";
import { UI_CONFIG } from "../config/ui-config";

/**
 * Level data structure from our level JSON files
 */
export interface LevelData {
  name: string;
  description: string;
  difficulty: string;
  gridDimensions: {
    rows: number;
    cols: number;
  };
  turnpike: {
    row: number;
    col: number;
    rotation: number;
  };
  landmarks: Array<{
    row: number;
    col: number;
    landmarkType: string;
    rotation: number;
  }>;
  tiles: Array<{
    row: number;
    col: number;
    tileType: string;
    roadType: string;
    solutionRotation: number;
    initialRotation: number;
    rotatable: boolean;
    landmarkType?: string;
    comment?: string;
  }>;
  headlines?: string[]; // Optional array of headlines to reveal on level complete
}

/**
 * CityLinesLevelLoader
 *
 * Loads level JSON files and converts them into GameConfig format
 * that GameBuilder can consume.
 */
export class CityLinesLevelLoader {
  private static levelPaths: string[] = [
    "config/levels/level-1.json",
    "config/levels/level-2.json",
    "config/levels/level-3.json",
    "config/levels/level-4.json",
  ];

  /**
   * Load a specific level by index (0-based)
   */
  static async loadLevel(levelIndex: number): Promise<GameConfig> {
    if (levelIndex < 0 || levelIndex >= this.levelPaths.length) {
      throw new Error(
        `Level ${levelIndex + 1} does not exist. Available levels: 1-${this.levelPaths.length}`,
      );
    }

    const levelPath = this.levelPaths[levelIndex];
    console.log(
      `[CityLinesLevelLoader] Loading level ${levelIndex + 1} from ${levelPath}`,
    );

    const response = await fetch(levelPath);
    if (!response.ok) {
      throw new Error(`Failed to load level: ${response.statusText}`);
    }

    const levelData: LevelData = await response.json();
    return this.convertToGameConfig(levelData, levelIndex + 1);
  }

  /**
   * Get total number of levels
   */
  static getLevelCount(): number {
    return this.levelPaths.length;
  }

  /**
   * Convert level data to GameConfig format
   */
  private static convertToGameConfig(
    levelData: LevelData,
    levelNumber: number,
  ): GameConfig {
    const { gridDimensions, tiles } = levelData;

    // Build gridTiles array from level tiles
    const gridTiles = tiles.map((tile) => ({
      row: tile.row,
      col: tile.col,
      tileType: tile.tileType,
      roadType: tile.roadType,
      rotation: tile.initialRotation, // Start with scrambled rotation
      rotatable: tile.rotatable,
      solutionRotation: tile.solutionRotation,
      landmarkType: tile.landmarkType,
      comment: tile.comment,
    }));

    // Create full game config
    const gameConfig: GameConfig = {
      viewport: {
        width: 800,
        height: 600,
      },
      entities: [
        {
          id: "city_grid",
          type: "CityGrid",
          position: { x: 0, y: 0 },
          config: {
            rows: gridDimensions.rows,
            cols: gridDimensions.cols,
            backgroundColor: `0x${UI_CONFIG.COLORS.gridBackground.toString(16)}`,
            uiConfig: {
              position: { x: 50, y: 50 },
              size: { width: 60, height: 60 },
              tileCount: {
                rows: gridDimensions.rows,
                cols: gridDimensions.cols,
              },
              padding: { all: 2 },
            },
          },
        },
        {
          id: "headline_manager",
          type: "GameManager",
          position: { x: 0, y: 0 },
          config: {},
          primitives: [
            {
              type: "HeadlineReveal",
              config: {
                triggerOn: "path_complete",
                headlines: levelData.headlines || [
                  `🏗️ LEVEL ${levelNumber} COMPLETE: ${levelData.name}`,
                  "🚦 City Roads Successfully Connected!",
                  "🏘️ All Landmarks Now Accessible",
                ],
              },
            },
          ],
        },
      ],
      ui: [
        {
          type: "HeadlineDisplay",
          position: { x: 0, y: 0 },
          config: {},
        },
      ],
    } as any; // Cast to any to allow gridTiles property

    // Add gridTiles to the config (needed by GameBuilder)
    (gameConfig as any).gridTiles = gridTiles;

    console.log(
      `[CityLinesLevelLoader] Converted level ${levelNumber}: ${gridDimensions.rows}x${gridDimensions.cols} grid, ${gridTiles.length} tiles`,
    );

    return gameConfig;
  }
}
