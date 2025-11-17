import type { GameConfig } from "../config/types";
import { CityLinesLevelLoader } from "../levels/CityLinesLevelLoader";
import { LevelGenerator, type GeneratedLevel } from "./LevelGenerator";
import { UI_CONFIG } from "../config/ui-config";

/**
 * InfiniteLevelManager
 *
 * Manages level loading for the game:
 * - Levels 1-3: Hand-crafted (loaded from JSON files)
 * - Levels 4+: Procedurally generated (runtime generation)
 *
 * Uses deterministic seeds for consistent level generation.
 */
export class InfiniteLevelManager {
  private static readonly HAND_CRAFTED_LEVELS = 3;
  private static readonly MAX_GENERATION_ATTEMPTS = 50;

  /**
   * Load a level by number (1-based)
   * - Levels 1-3: Load from JSON
   * - Levels 4+: Generate procedurally
   */
  static async loadLevel(levelNumber: number): Promise<GameConfig> {
    console.log(`[InfiniteLevelManager] Loading level ${levelNumber}...`);

    // Levels 1-3: Hand-crafted
    if (levelNumber <= this.HAND_CRAFTED_LEVELS) {
      console.log(
        `[InfiniteLevelManager] Loading hand-crafted level ${levelNumber}`,
      );
      return CityLinesLevelLoader.loadLevel(levelNumber - 1); // 0-based index
    }

    // Levels 4+: Generated
    console.log(
      `[InfiniteLevelManager] Generating procedural level ${levelNumber}`,
    );
    try {
      return this.generateLevel(levelNumber);
    } catch (error) {
      console.error(
        `[InfiniteLevelManager] Generation failed for level ${levelNumber}:`,
        error,
      );
      // Fallback: Use a safe template level
      return this.getFallbackLevel(levelNumber);
    }
  }

  /**
   * Generate a procedural level with deterministic seed
   */
  private static generateLevel(levelNumber: number): GameConfig {
    console.log(`🚨🚨🚨 [InfiniteLevelManager] generateLevel() CALLED for level ${levelNumber} 🚨🚨🚨`);
    const seed = levelNumber * 12345; // Deterministic seed
    const params = this.getDifficultyParams(levelNumber);
    console.log(
      `[InfiniteLevelManager] Level ${levelNumber}: seed=${seed}, params=`,
      params,
    );

    let attempts = 0;
    while (attempts < this.MAX_GENERATION_ATTEMPTS) {
      attempts++;

      try {
        // Create a new generator instance for each attempt with fresh seed
        const generator = new LevelGenerator({
          ...params,
          seed: seed + attempts - 1,
        });
        const level = generator.generate();

        // TODO: Add validation here (Step 3)
        // const validator = new LevelValidator();
        // if (!validator.validate(level)) continue;

        console.log(
          `[InfiniteLevelManager] ✅ Generated level ${levelNumber} (attempt ${attempts})`,
        );
        return this.convertToGameConfig(level, levelNumber);
      } catch (error) {
        console.warn(
          `[InfiniteLevelManager] Attempt ${attempts} failed:`,
          error,
        );
        // Continue to next attempt with different seed (seed + attempts)
      }
    }

    throw new Error(
      `Failed to generate valid level after ${this.MAX_GENERATION_ATTEMPTS} attempts`,
    );
  }

  /**
   * Get difficulty parameters based on level number
   * Uses a wave pattern for dynamic difficulty: easy-medium-medium-hard-medium-easy...
   *
   * Board sizes: [4x4, 5x5, 5x6, 6x5, 6x6]
   * Landmark limits:
   * - 4x4 → up to 2 landmarks
   * - 5x5 → up to 3 landmarks
   * - 5x6/6x5/6x6 → up to 6 landmarks
   */
  private static getDifficultyParams(level: number): {
    gridSize: { rows: number; cols: number };
    landmarkCount: number;
    difficulty: "easy" | "medium" | "hard";
    minPathLength: number;
  } {
    // Create a wave pattern using modulo
    const pattern = [
      "easy",
      "easy",
      "medium",
      "medium",
      "hard",
      "medium",
      "easy",
      "medium",
      "hard",
      "hard",
    ];
    const cycleIndex = (level - 4) % pattern.length;
    const difficultyType = pattern[cycleIndex] as "easy" | "medium" | "hard";

    // Use level seed for deterministic randomness
    const seed = level * 12345;
    let rngState = seed;
    const rng = () => {
      rngState ^= rngState << 13;
      rngState ^= rngState >>> 17;
      rngState ^= rngState << 5;
      rngState = rngState >>> 0;
      return rngState / 4294967296;
    };

    // Map difficulty to parameters with random path lengths
    switch (difficultyType) {
      case "easy":
        return {
          gridSize: { rows: 4, cols: 4 },
          landmarkCount: 2, // 4x4 → up to 2 landmarks
          difficulty: "easy",
          minPathLength: 3 + Math.floor(rng() * 3), // 3-5
        };
      case "medium":
        return {
          gridSize: { rows: 5, cols: 5 },
          landmarkCount: 3, // 5x5 → up to 3 landmarks
          difficulty: "medium",
          minPathLength: 4 + Math.floor(rng() * 4), // 4-7
        };
      case "hard":
        return {
          gridSize: { rows: 6, cols: 6 },
          landmarkCount: 4, // 6x6 → up to 6 landmarks (using 4 for variety)
          difficulty: "hard",
          minPathLength: 5 + Math.floor(rng() * 5), // 5-9
        };
    }
  }

  /**
   * Convert generated level to GameConfig format
   */
  private static convertToGameConfig(
    level: GeneratedLevel,
    levelNumber: number,
  ): GameConfig {
    const { gridSize, tiles } = level;

    // Build gridTiles array
    const gridTiles = tiles.map((tile) => ({
      row: tile.row,
      col: tile.col,
      tileType: tile.tileType,
      roadType: tile.roadType,
      rotation: tile.scrambledRotation, // Start with scrambled
      rotatable: tile.rotatable,
      solutionRotation: tile.rotation, // Solution rotation
      landmarkType: tile.landmarkType,
      comment: tile.comment,
    }));

    // Create full game config
    const gameConfig: GameConfig = {
      name: `Generated Level ${levelNumber}`,
      description: `Procedurally generated City Lines level`,
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
                  `🏗️ LEVEL ${levelNumber} COMPLETE!`,
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
    } as any;

    // Add gridTiles to config
    (gameConfig as any).gridTiles = gridTiles;

    console.log(
      `[InfiniteLevelManager] Converted level ${levelNumber}: ${gridSize.rows}x${gridSize.cols} grid, ${gridTiles.length} tiles`,
    );

    return gameConfig;
  }

  /**
   * Fallback level if generation fails
   * Returns a simple 4x4 level
   */
  private static getFallbackLevel(levelNumber: number): GameConfig {
    console.warn(
      `[InfiniteLevelManager] Using fallback level for ${levelNumber}`,
    );

    // Simple safe level: straight path from top to bottom
    const gameConfig: GameConfig = {
      viewport: { width: 800, height: 600 },
      entities: [
        {
          id: "city_grid",
          type: "CityGrid",
          position: { x: 0, y: 0 },
          config: {
            rows: 4,
            cols: 4,
            backgroundColor: `0x${UI_CONFIG.COLORS.gridBackground.toString(16)}`,
            uiConfig: {
              position: { x: 50, y: 50 },
              size: { width: 60, height: 60 },
              tileCount: { rows: 4, cols: 4 },
              padding: { all: 2 },
            },
          },
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

    // Simple straight path fallback
    (gameConfig as any).gridTiles = [
      {
        row: 0,
        col: 1,
        tileType: "landmark",
        roadType: "landmark",
        rotation: 180,
        rotatable: false,
        solutionRotation: 180,
        landmarkType: "diner",
      },
      {
        row: 1,
        col: 1,
        tileType: "straight",
        roadType: "local_road",
        rotation: 90,
        rotatable: true,
        solutionRotation: 0,
      },
      {
        row: 2,
        col: 1,
        tileType: "straight",
        roadType: "local_road",
        rotation: 180,
        rotatable: true,
        solutionRotation: 0,
      },
      {
        row: 3,
        col: 1,
        tileType: "turnpike",
        roadType: "turnpike",
        rotation: 0,
        rotatable: false,
        solutionRotation: 0,
      },
    ];

    return gameConfig;
  }
}
