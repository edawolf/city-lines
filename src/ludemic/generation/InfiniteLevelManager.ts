import { CityLinesLevelLoader } from "../levels/CityLinesLevelLoader";
import type { GameConfig } from "../config/types";
import {
  LevelGenerator,
  type DifficultyParams,
  type GeneratedLevel,
} from "./LevelGenerator";
import { UI_CONFIG } from "../config/ui-config";

/**
 * InfiniteLevelManager - Loads levels 1-3 from JSON, generates 4+ procedurally
 */
export class InfiniteLevelManager {
  /**
   * Load level configuration
   * @param levelNumber 1-based level number
   */
  static async loadLevel(levelNumber: number): Promise<GameConfig> {
    // Levels 1-3: Load from hand-crafted JSON files
    if (levelNumber >= 1 && levelNumber <= 3) {
      return CityLinesLevelLoader.loadLevel(levelNumber - 1); // Convert to 0-based index
    }

    // Levels 4+: Generate procedurally
    return this.generateLevel(levelNumber);
  }

  /**
   * Generate a procedural level using LevelGenerator
   */
  private static generateLevel(levelNumber: number): GameConfig {
    // Determine difficulty based on level number
    const params = this.getDifficultyParams(levelNumber);

    // Use level number as seed for determinism
    const baseSeed = levelNumber * 12345;
    const MAX_ATTEMPTS = 10;

    // Try up to 10 times with different seeds
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const seed = baseSeed + attempt; // Different seed each attempt
        const generated = LevelGenerator.generate(params, seed);
        return this.convertToGameConfig(generated, levelNumber);
      } catch (error) {
        console.warn(
          `[InfiniteLevelManager] Level ${levelNumber} generation attempt ${attempt + 1} failed:`,
          (error as Error).message,
        );
        // Loop continues to next attempt
      }
    }

    // All attempts failed - throw error
    throw new Error(
      `Failed to generate level ${levelNumber} after ${MAX_ATTEMPTS} attempts`,
    );
  }

  /**
   * Get difficulty parameters based on level number
   */
  private static getDifficultyParams(levelNumber: number): DifficultyParams {
    if (levelNumber <= 5) {
      // Easy levels (4-5)
      return {
        gridSize: 4,
        landmarkCount: 2,
        difficulty: "easy",
        minPathLength: 3,
        detourProbability: 0.1,
      };
    } else if (levelNumber <= 8) {
      // Medium levels (6-8)
      return {
        gridSize: 5,
        landmarkCount: 3,
        difficulty: "medium",
        minPathLength: 4,
        detourProbability: 0.3,
      };
    } else {
      // Hard levels (9+)
      return {
        gridSize: 6,
        landmarkCount: 3,
        difficulty: "hard",
        minPathLength: 5,
        detourProbability: 0.5,
      };
    }
  }

  /**
   * Convert GeneratedLevel to GameConfig format
   */
  private static convertToGameConfig(
    generated: GeneratedLevel,
    levelNumber: number,
  ): GameConfig {
    const { gridSize, turnpike, landmarks, roadTiles, treeTiles } = generated;

    // Combine all tiles (turnpike, landmarks, roads, trees) into gridTiles array
    const gridTiles = [
      // Turnpike tile
      {
        row: turnpike.row,
        col: turnpike.col,
        tileType: turnpike.tileType,
        roadType: turnpike.roadType,
        rotation: turnpike.rotation,
        rotatable: turnpike.rotatable,
        solutionRotation: turnpike.solutionRotation,
      },
      // Landmark tiles
      ...landmarks.map((l) => ({
        row: l.row,
        col: l.col,
        tileType: l.tileType,
        roadType: l.roadType,
        rotation: l.rotation,
        rotatable: l.rotatable,
        solutionRotation: l.solutionRotation,
        landmarkType: l.landmarkType,
      })),
      // Road tiles
      ...roadTiles.map((r) => ({
        row: r.row,
        col: r.col,
        tileType: r.tileType,
        roadType: r.roadType,
        rotation: r.rotation,
        rotatable: r.rotatable,
        solutionRotation: r.solutionRotation,
      })),
      // Tree tiles (decorational)
      ...treeTiles.map((t) => ({
        row: t.row,
        col: t.col,
        tileType: t.tileType,
        roadType: t.roadType,
        rotation: t.rotation,
        rotatable: t.rotatable,
        solutionRotation: t.solutionRotation,
      })),
    ];

    // Create GameConfig (same structure as CityLinesLevelLoader)
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
            rows: gridSize.rows,
            cols: gridSize.cols,
            backgroundColor: `0x${UI_CONFIG.COLORS.gridBackground.toString(16)}`,
            uiConfig: {
              position: { x: 50, y: 50 },
              size: { width: 60, height: 60 },
              tileCount: {
                rows: gridSize.rows,
                cols: gridSize.cols,
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
                enabled: true,
                triggerOn: "path_complete",
                headlines: [
                  `🎉 LEVEL ${levelNumber} COMPLETE!`,
                  "🏗️ Procedurally Generated Road Network Restored",
                  "🚦 All Landmarks Successfully Connected",
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
    } as any;

    // Add gridTiles to config
    (gameConfig as any).gridTiles = gridTiles;

    return gameConfig;
  }
}
