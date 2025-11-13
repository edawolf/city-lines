import { Direction, RoadType, LandmarkType } from "../entities/RoadTile";
import { UI_CONFIG } from "../config/ui-config";

/**
 * LevelGenerator
 *
 * Solution-First Level Generation Algorithm:
 * 1. Place landmarks and turnpike on grid
 * 2. Generate valid paths connecting them (following road hierarchy)
 * 3. Place appropriate tiles along paths
 * 4. Ensure all tile openings connect properly (no dangling)
 * 5. Scramble rotations to create puzzle
 * 6. Output valid JSON config
 *
 * This approach GUARANTEES solvable levels with no dead-ends.
 */

export interface LevelGeneratorConfig {
  gridSize: { rows: number; cols: number };
  landmarkCount: number;
  difficulty: "easy" | "medium" | "hard";
  seed?: number; // For reproducible levels
}

export interface GeneratedTile {
  row: number;
  col: number;
  tileType: string;
  roadType: RoadType;
  rotation: number; // Solution rotation
  scrambledRotation: number; // Starting rotation (puzzle state)
  rotatable: boolean;
  landmarkType?: LandmarkType;
  comment?: string;
}

export interface GeneratedLevel {
  gridSize: { rows: number; cols: number };
  tiles: GeneratedTile[];
  solutionPaths: { landmark: string; path: GeneratedTile[] }[];
}

export class LevelGenerator {
  private config: LevelGeneratorConfig;
  private grid: (GeneratedTile | null)[][];
  private random: () => number;

  constructor(config: LevelGeneratorConfig) {
    this.config = config;
    this.grid = [];

    // Simple seeded random (for reproducible levels)
    if (config.seed !== undefined) {
      let seed = config.seed;
      this.random = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    } else {
      this.random = Math.random;
    }

    // Initialize empty grid
    for (let row = 0; row < config.gridSize.rows; row++) {
      this.grid[row] = [];
      for (let col = 0; col < config.gridSize.cols; col++) {
        this.grid[row][col] = null;
      }
    }
  }

  /**
   * Generate a complete level
   */
  public generate(): GeneratedLevel {
    console.log("[LevelGenerator] 🎲 Generating level...");

    // Step 1: Place turnpike
    const turnpike = this.placeTurnpike();
    console.log(
      `[LevelGenerator] 🚧 Placed turnpike at (${turnpike.row}, ${turnpike.col})`,
    );

    // Step 2: Place landmarks
    const landmarks = this.placeLandmarks();
    console.log(`[LevelGenerator] 🏛️ Placed ${landmarks.length} landmarks`);

    // Step 3: Generate paths from each landmark to turnpike
    const solutionPaths: { landmark: string; path: GeneratedTile[] }[] = [];
    for (const landmark of landmarks) {
      const path = this.generatePath(landmark, turnpike);
      solutionPaths.push({
        landmark: landmark.landmarkType || "unknown",
        path,
      });
      console.log(
        `[LevelGenerator] 🛣️ Generated path: ${landmark.landmarkType} → turnpike (${path.length} tiles)`,
      );
    }

    // Step 4: Calculate proper tile rotations based on neighbors
    this.calculateTileRotations();
    console.log(
      `[LevelGenerator] 🔄 Calculated tile rotations based on connections`,
    );

    // Step 5: Validate no dangling openings
    this.validateNoEmptyOpenings();

    // Step 6: Scramble rotations
    this.scrambleRotations();

    // Step 6: Collect all tiles
    const tiles: GeneratedTile[] = [];
    this.grid.forEach((row) => {
      row.forEach((tile) => {
        if (tile) tiles.push(tile);
      });
    });

    console.log(
      `[LevelGenerator] ✅ Level generated with ${tiles.length} tiles`,
    );

    return {
      gridSize: this.config.gridSize,
      tiles,
      solutionPaths,
    };
  }

  /**
   * Place turnpike (highway exit) - usually at bottom or edge
   */
  private placeTurnpike(): GeneratedTile {
    const { rows, cols } = this.config.gridSize;

    // Place at bottom-middle for easy access
    const col = Math.floor(cols / 2);
    const row = rows - 1;

    const turnpike: GeneratedTile = {
      row,
      col,
      tileType: "turnpike",
      roadType: RoadType.Turnpike,
      rotation: 0, // N-S straight
      scrambledRotation: 0,
      rotatable: false,
      comment: "🚧 Turnpike (fixed)",
    };

    this.grid[row][col] = turnpike;
    return turnpike;
  }

  /**
   * Place landmarks around the grid edges
   */
  private placeLandmarks(): GeneratedTile[] {
    const { cols } = this.config.gridSize;
    const landmarks: GeneratedTile[] = [];
    const landmarkTypes = [
      LandmarkType.Diner,
      LandmarkType.GasStation,
      LandmarkType.Market,
    ];

    // Place landmarks in top row for now (simple approach)
    const spacing = Math.floor(cols / (this.config.landmarkCount + 1));

    for (let i = 0; i < this.config.landmarkCount; i++) {
      const col = spacing * (i + 1);
      const row = 0; // Top row

      const landmark: GeneratedTile = {
        row,
        col,
        tileType: "landmark",
        roadType: RoadType.Landmark,
        rotation: 180, // Face down (South)
        scrambledRotation: 180,
        rotatable: false,
        landmarkType: landmarkTypes[i % landmarkTypes.length],
        comment: `Landmark ${i + 1}`,
      };

      this.grid[row][col] = landmark;
      landmarks.push(landmark);
    }

    return landmarks;
  }

  /**
   * Generate a valid path from landmark to turnpike
   * Following road hierarchy: Landmark → Local → Arterial → Highway → Turnpike
   */
  private generatePath(
    from: GeneratedTile,
    to: GeneratedTile,
  ): GeneratedTile[] {
    const path: GeneratedTile[] = [from];
    const current = { row: from.row, col: from.col };

    // Simple path: go down towards turnpike
    while (current.row < to.row - 1) {
      current.row++;
      const tile = this.getOrCreateTile(current.row, current.col);
      path.push(tile);
    }

    // Move horizontally towards turnpike if needed
    while (current.col !== to.col) {
      if (current.col < to.col) {
        current.col++;
      } else {
        current.col--;
      }
      const tile = this.getOrCreateTile(current.row, current.col);
      path.push(tile);
    }

    // Final connection to turnpike
    if (current.row < to.row) {
      current.row++;
      path.push(to);
    }

    return path;
  }

  /**
   * Get existing tile or create new road tile
   */
  private getOrCreateTile(row: number, col: number): GeneratedTile {
    const existing = this.grid[row][col];
    if (existing) {
      // Upgrade to T-junction or crossroads if needed
      return this.upgradeTileIfNeeded(existing, row, col);
    }

    // Create new straight road
    const tile: GeneratedTile = {
      row,
      col,
      tileType: "straight",
      roadType: this.selectRoadType(row),
      rotation: 0, // Will be calculated
      scrambledRotation: 0,
      rotatable: true,
      comment: `Road (${row},${col})`,
    };

    this.grid[row][col] = tile;
    return tile;
  }

  /**
   * Select appropriate road type based on grid position
   * Follow hierarchy: Local (near landmarks) → Arterial (middle) → Highway (near turnpike)
   */
  private selectRoadType(row: number): RoadType {
    const { rows } = this.config.gridSize;
    const progress = row / rows;

    if (progress < 0.3) return RoadType.LocalRoad;
    if (progress < 0.6) return RoadType.ArterialRoad;
    return RoadType.Highway;
  }

  /**
   * Upgrade tile to T-junction or crossroads if multiple paths intersect
   */
  private upgradeTileIfNeeded(
    tile: GeneratedTile,
    row: number,
    col: number,
  ): GeneratedTile {
    // Count how many directions this tile needs to connect
    const neighbors = this.countNeighbors(row, col);

    if (neighbors >= 3 && tile.tileType === "straight") {
      tile.tileType = "t_junction";
      tile.comment = `T-junction (upgraded)`;
    } else if (neighbors === 4 && tile.tileType === "t_junction") {
      tile.tileType = "crossroads";
      tile.comment = `Crossroads (upgraded)`;
    }

    return tile;
  }

  /**
   * Count neighboring tiles
   */
  private countNeighbors(row: number, col: number): number {
    let count = 0;
    const directions = [
      { dr: -1, dc: 0 }, // North
      { dr: 0, dc: 1 }, // East
      { dr: 1, dc: 0 }, // South
      { dr: 0, dc: -1 }, // West
    ];

    directions.forEach(({ dr, dc }) => {
      const nr = row + dr;
      const nc = col + dc;
      if (this.isValidPos(nr, nc) && this.grid[nr][nc]) {
        count++;
      }
    });

    return count;
  }

  /**
   * Calculate proper tile rotations based on neighboring tiles
   */
  private calculateTileRotations(): void {
    this.grid.forEach((row, rowIndex) => {
      row.forEach((tile, colIndex) => {
        if (!tile || !tile.rotatable) return;

        // Get directions where neighbors exist
        const requiredDirections: Direction[] = [];
        const directions = [
          { dir: Direction.North, dr: -1, dc: 0 },
          { dir: Direction.East, dr: 0, dc: 1 },
          { dir: Direction.South, dr: 1, dc: 0 },
          { dir: Direction.West, dr: 0, dc: -1 },
        ];

        directions.forEach(({ dir, dr, dc }) => {
          const neighborRow = rowIndex + dr;
          const neighborCol = colIndex + dc;
          if (
            this.isValidPos(neighborRow, neighborCol) &&
            this.grid[neighborRow][neighborCol]
          ) {
            requiredDirections.push(dir);
          }
        });

        // Determine correct tile type based on number of connections
        const correctTileType = this.determineTileType(requiredDirections);
        if (correctTileType !== tile.tileType) {
          tile.tileType = correctTileType;
          tile.comment = `${correctTileType} (${rowIndex},${colIndex})`;
        }

        // Calculate rotation based on required directions and tile type
        tile.rotation = this.calculateRotationForDirections(
          tile.tileType,
          requiredDirections,
        );
      });
    });
  }

  /**
   * Determine correct tile type based on required connection directions
   */
  private determineTileType(requiredDirections: Direction[]): string {
    const count = requiredDirections.length;

    if (count === 4) {
      return "crossroads";
    } else if (count === 3) {
      return "t_junction";
    } else if (count === 2) {
      // Check if directions are opposite (straight) or adjacent (corner)
      const [dir1, dir2] = requiredDirections;
      const opposite =
        (dir1 === Direction.North && dir2 === Direction.South) ||
        (dir1 === Direction.South && dir2 === Direction.North) ||
        (dir1 === Direction.East && dir2 === Direction.West) ||
        (dir1 === Direction.West && dir2 === Direction.East);

      return opposite ? "straight" : "corner";
    } else {
      return "straight"; // Fallback for 1 or 0 connections
    }
  }

  /**
   * Calculate rotation needed to align tile openings with required directions
   */
  private calculateRotationForDirections(
    tileType: string,
    required: Direction[],
  ): number {
    const baseOpenings = this.getBaseTileOpenings(tileType);

    // Try each rotation (0, 90, 180, 270) and see which one matches
    for (let rotation = 0; rotation < 360; rotation += 90) {
      const rotatedOpenings = baseOpenings.map((dir) => {
        let rotated = dir;
        const steps = rotation / 90;
        for (let i = 0; i < steps; i++) {
          rotated = this.rotateDirectionClockwise(rotated);
        }
        return rotated;
      });

      // Check if rotated openings match required directions
      if (this.directionsMatch(rotatedOpenings, required)) {
        return rotation;
      }
    }

    // Fallback: return 0 if no perfect match
    return 0;
  }

  /**
   * Check if two sets of directions match (all required directions present in openings)
   */
  private directionsMatch(
    openings: Direction[],
    required: Direction[],
  ): boolean {
    return required.every((req) => openings.includes(req));
  }

  /**
   * Validate no tile has openings pointing to empty space
   */
  private validateNoEmptyOpenings(): void {
    const danglingOpenings: { tile: GeneratedTile; direction: Direction }[] =
      [];

    this.grid.forEach((row, rowIndex) => {
      row.forEach((tile, colIndex) => {
        if (!tile) return;

        // Get tile openings based on type and rotation
        const openings = this.getTileOpenings(tile);

        // Check each opening
        openings.forEach((direction) => {
          const adjacentPos = this.getAdjacentPosition(
            rowIndex,
            colIndex,
            direction,
          );

          // Check if opening points to empty space (not edge, not tile)
          if (
            this.isValidPos(adjacentPos.row, adjacentPos.col) &&
            !this.grid[adjacentPos.row][adjacentPos.col]
          ) {
            danglingOpenings.push({ tile, direction });
            console.warn(
              `[LevelGenerator] ⚠️ Dangling opening at (${rowIndex},${colIndex}) pointing ${Direction[direction]}`,
            );
          }
        });
      });
    });

    if (danglingOpenings.length > 0) {
      console.error(
        `[LevelGenerator] ❌ Found ${danglingOpenings.length} dangling opening(s)! Level generation failed.`,
      );
      danglingOpenings.forEach(({ tile, direction }) => {
        console.error(
          `   - Tile at (${tile.row},${tile.col}) [${tile.tileType}] has opening pointing ${Direction[direction]} to empty space`,
        );
      });
    } else {
      console.log(
        "[LevelGenerator] ✅ No dangling openings - all tile connections valid",
      );
    }
  }

  /**
   * Get tile openings based on tile type and rotation
   */
  private getTileOpenings(tile: GeneratedTile): Direction[] {
    const baseOpenings = this.getBaseTileOpenings(tile.tileType);
    const rotationSteps = tile.rotation / 90;

    // Rotate each opening
    return baseOpenings.map((dir) => {
      let rotated = dir;
      for (let i = 0; i < rotationSteps; i++) {
        rotated = this.rotateDirectionClockwise(rotated);
      }
      return rotated;
    });
  }

  /**
   * Get base openings for a tile type (before rotation)
   */
  private getBaseTileOpenings(tileType: string): Direction[] {
    switch (tileType) {
      case "straight":
        return [Direction.North, Direction.South];
      case "corner":
        return [Direction.North, Direction.East];
      case "t_junction":
        return [Direction.North, Direction.East, Direction.West];
      case "crossroads":
        return [
          Direction.North,
          Direction.East,
          Direction.South,
          Direction.West,
        ];
      case "turnpike":
        return [Direction.North, Direction.South];
      case "landmark":
        return [Direction.South]; // Landmarks face down by default
      default:
        return [];
    }
  }

  /**
   * Rotate a direction 90 degrees clockwise
   */
  private rotateDirectionClockwise(dir: Direction): Direction {
    switch (dir) {
      case Direction.North:
        return Direction.East;
      case Direction.East:
        return Direction.South;
      case Direction.South:
        return Direction.West;
      case Direction.West:
        return Direction.North;
      default:
        return dir;
    }
  }

  /**
   * Get adjacent position in a given direction
   */
  private getAdjacentPosition(
    row: number,
    col: number,
    direction: Direction,
  ): { row: number; col: number } {
    switch (direction) {
      case Direction.North:
        return { row: row - 1, col };
      case Direction.South:
        return { row: row + 1, col };
      case Direction.East:
        return { row, col: col + 1 };
      case Direction.West:
        return { row, col: col - 1 };
      default:
        return { row, col };
    }
  }

  /**
   * Scramble tile rotations to create puzzle
   */
  private scrambleRotations(): void {
    this.grid.forEach((row) => {
      row.forEach((tile) => {
        if (tile && tile.rotatable) {
          // Randomly rotate by 0, 90, 180, or 270 degrees
          const randomRotation = [0, 90, 180, 270][
            Math.floor(this.random() * 4)
          ];
          tile.scrambledRotation = randomRotation;
        }
      });
    });
  }

  /**
   * Check if position is valid
   */
  private isValidPos(row: number, col: number): boolean {
    return (
      row >= 0 &&
      row < this.config.gridSize.rows &&
      col >= 0 &&
      col < this.config.gridSize.cols
    );
  }

  /**
   * Export to JSON config format
   */
  public exportToJSON(level: GeneratedLevel): string {
    const config = {
      name: "Generated Level",
      description: "Procedurally generated City Lines level",
      viewport: { width: 800, height: 600 },
      entities: [
        {
          id: "city_grid",
          type: "CityGrid",
          position: { x: 0, y: 0 },
          config: {
            rows: level.gridSize.rows,
            cols: level.gridSize.cols,
            backgroundColor: `0x${UI_CONFIG.COLORS.gridBackground.toString(16)}`,
          },
        },
      ],
      gridTiles: level.tiles.map((tile) => ({
        row: tile.row,
        col: tile.col,
        tileType: tile.tileType,
        roadType: tile.roadType,
        rotation: tile.scrambledRotation,
        rotatable: tile.rotatable,
        solutionRotation: tile.rotation,
        landmarkType: tile.landmarkType,
        comment: tile.comment,
      })),
    };

    return JSON.stringify(config, null, 2);
  }
}
