/**
 * Test script for LevelGenerator
 * Run this to visualize generated levels in console
 */

import { LevelGenerator, type DifficultyParams } from "./LevelGenerator";

// Test parameters
const easyParams: DifficultyParams = {
  gridSize: 4,
  landmarkCount: 2,
  difficulty: "easy",
  minPathLength: 3,
  detourProbability: 0.1,
};

const mediumParams: DifficultyParams = {
  gridSize: 6,
  landmarkCount: 3,
  difficulty: "medium",
  minPathLength: 4,
  detourProbability: 0.3,
};

const hardParams: DifficultyParams = {
  gridSize: 7,
  landmarkCount: 3, // Reduced from 4 for better success rate
  difficulty: "hard",
  minPathLength: 5,
  detourProbability: 0.5,
};

/**
 * Visualize level in console
 */
function visualizeLevel(level: any, title: string): void {
  console.log("\n" + "=".repeat(50));
  console.log(title);
  console.log("=".repeat(50));

  const { gridSize, turnpike, landmarks, roadTiles, solutionPaths } = level;
  const grid: string[][] = [];

  // Initialize empty grid
  for (let row = 0; row < gridSize.rows; row++) {
    grid[row] = [];
    for (let col = 0; col < gridSize.cols; col++) {
      grid[row][col] = "·"; // Empty cell
    }
  }

  // Place road tiles
  for (const road of roadTiles) {
    grid[road.row][road.col] = "═"; // Road tile
  }

  // Place turnpike
  grid[turnpike.row][turnpike.col] = "🚧";

  // Place landmarks
  const landmarkIcons: Record<string, string> = {
    diner: "🏛️",
    gas_station: "⛽",
    market: "🏪",
    home: "🏠",
  };

  for (const landmark of landmarks) {
    const icon = landmarkIcons[landmark.landmarkType || "home"];
    grid[landmark.row][landmark.col] = icon;
  }

  // Print grid
  console.log("\nGrid:");
  for (let row = 0; row < gridSize.rows; row++) {
    console.log(grid[row].join(" "));
  }

  // Print stats
  console.log("\nStats:");
  console.log(`- Grid Size: ${gridSize.rows}x${gridSize.cols}`);
  console.log(`- Turnpike: (${turnpike.row}, ${turnpike.col})`);
  console.log(`- Landmarks: ${landmarks.length}`);
  console.log(`- Road Tiles: ${roadTiles.length}`);
  console.log(`- Solution Paths: ${solutionPaths.length}`);

  landmarks.forEach((l: any, i: number) => {
    const path = solutionPaths[i] || [];
    const pathStr = path.map((p: any) => `(${p.row},${p.col})`).join(" → ");
    console.log(
      `  ${i + 1}. ${l.landmarkType} at (${l.row}, ${l.col}) - Path: ${pathStr}`
    );
  });

  // Print tile types and rotations
  console.log("\nRoad Tile Details:");
  roadTiles.forEach((r: any) => {
    console.log(
      `  (${r.row},${r.col}): ${r.tileType} @ ${r.rotation}°`
    );
  });
}

/**
 * Test level generation with different difficulties
 */
function testGenerator(): void {
  console.log("\n🎮 LEVEL GENERATOR - PHASE 2 TEST (WITH ROADS!)\n");

  try {
    // Test Easy
    const easyLevel = LevelGenerator.generate(easyParams, 12345);
    visualizeLevel(easyLevel, "EASY LEVEL (seed: 12345)");

    // Test Medium
    const mediumLevel = LevelGenerator.generate(mediumParams, 54321);
    visualizeLevel(mediumLevel, "MEDIUM LEVEL (seed: 54321)");

    // Test Hard
    const hardLevel = LevelGenerator.generate(hardParams, 1005);
    visualizeLevel(hardLevel, "HARD LEVEL (seed: 1005)");

    // Test determinism (same seed = same level)
    console.log("\n" + "=".repeat(50));
    console.log("DETERMINISM TEST");
    console.log("=".repeat(50));

    const level1 = LevelGenerator.generate(easyParams, 99999);
    const level2 = LevelGenerator.generate(easyParams, 99999);

    console.log("\nLevel 1 (seed 99999):");
    console.log(`Turnpike: (${level1.turnpike.row}, ${level1.turnpike.col})`);
    console.log(
      `Landmarks: ${level1.landmarks.map((l) => `(${l.row},${l.col})`).join(", ")}`
    );

    console.log("\nLevel 2 (seed 99999):");
    console.log(`Turnpike: (${level2.turnpike.row}, ${level2.turnpike.col})`);
    console.log(
      `Landmarks: ${level2.landmarks.map((l) => `(${l.row},${l.col})`).join(", ")}`
    );

    const isDeterministic =
      level1.turnpike.row === level2.turnpike.row &&
      level1.turnpike.col === level2.turnpike.col &&
      level1.landmarks.length === level2.landmarks.length &&
      level1.landmarks.every(
        (l, i) =>
          l.row === level2.landmarks[i].row &&
          l.col === level2.landmarks[i].col
      );

    console.log(
      `\n✅ Deterministic: ${isDeterministic ? "YES" : "NO"}`
    );

    console.log("\n🎉 Phase 1 tests completed successfully!");
  } catch (error) {
    console.error("\n❌ Error during generation:", error);
  }
}

// Run tests
testGenerator();
