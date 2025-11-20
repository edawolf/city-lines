/**
 * LevelGenerator - Selection-First Level Generation
 *
 * Algorithm:
 * 1. Place turnpike (based on difficulty)
 * 2. Place landmarks (with spacing constraints)
 * 3. Select road tiles (random walk paths)
 * 4. Assign tile types and rotations (solution state)
 * 5. Scramble rotations (create puzzle)
 * 6. Validate (ensure solvability)
 */

import { Direction, RoadType, LandmarkType } from "../entities/RoadTile";

// ============================================================================
// Types
// ============================================================================

export type Difficulty = "easy" | "medium" | "hard";

export interface TilePosition {
  row: number;
  col: number;
}

export interface DifficultyParams {
  gridSize: number; // NxN grid
  landmarkCount: number;
  difficulty: Difficulty;
  minPathLength: number;
  detourProbability: number;
}

export interface TileConfig {
  row: number;
  col: number;
  tileType: string; // 'straight', 'corner', 't_junction', 'landmark', 'turnpike'
  roadType: RoadType;
  rotation: number; // Solution rotation
  solutionRotation: number; // Correct rotation
  rotatable: boolean;
  landmarkType?: LandmarkType;
  decorationType?: string; // For decorative tiles (tree-1, tree-2, bush-1, etc.)
}

export interface GeneratedLevel {
  gridSize: { rows: number; cols: number };
  turnpike: TileConfig;
  landmarks: TileConfig[];
  roadTiles: TileConfig[];
  treeTiles: TileConfig[]; // Decorational trees
  solutionPaths: TilePosition[][]; // For debugging
}

// ============================================================================
// XORShift32 RNG - Deterministic Random Number Generator
// ============================================================================

export class XORShift32 {
  private state: number;

  constructor(seed: number) {
    // Ensure seed is non-zero
    this.state = seed === 0 ? 1 : seed;
  }

  /**
   * Generate next random number in range [0, 1)
   */
  next(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    this.state = x >>> 0; // Convert to unsigned 32-bit
    return this.state / 4294967296; // Normalize to [0, 1)
  }

  /**
   * Generate random integer in range [min, max)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /**
   * Pick random element from array
   */
  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  /**
   * Shuffle array in place (Fisher-Yates)
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

// ============================================================================
// LevelGenerator Class
// ============================================================================

export class LevelGenerator {
  // Track bad seeds for retry logic
  private static badSeeds = new Set<number>();

  private rng: XORShift32;
  private params: DifficultyParams;
  private gridSize: number;

  // Grid state
  private grid: Map<string, TileConfig>;
  private turnpike!: TileConfig;
  private landmarks: TileConfig[] = [];
  private roadTiles: TileConfig[] = [];
  private treeTiles: TileConfig[] = [];
  private solutionPaths: TilePosition[][] = [];

  constructor(params: DifficultyParams, seed: number) {
    this.params = params;
    this.gridSize = params.gridSize;
    this.rng = new XORShift32(seed);
    this.grid = new Map();
  }

  /**
   * Main generation entry point with retry logic
   */
  static generate(params: DifficultyParams, seed: number): GeneratedLevel {
    const MAX_ATTEMPTS = 10;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const attemptSeed = seed + attempt;

      // Skip known bad seeds
      if (this.badSeeds.has(attemptSeed)) {
        console.warn(`⚠️ Skipping known bad seed: ${attemptSeed}`);
        continue;
      }

      try {
        console.log(
          `🎲 Generating level with seed ${attemptSeed} (attempt ${attempt + 1}/${MAX_ATTEMPTS})`,
        );

        const generator = new LevelGenerator(params, attemptSeed);
        const level = generator.generateInternal();

        console.log(`✅ Level generated successfully with seed ${attemptSeed}`);
        return level;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`❌ Seed ${attemptSeed} failed: ${errorMessage}`);
        this.badSeeds.add(attemptSeed);
        continue;
      }
    }

    // All attempts exhausted
    throw new Error(
      `Failed to generate level after ${MAX_ATTEMPTS} attempts. ` +
        `Bad seeds: [${Array.from(this.badSeeds).slice(-MAX_ATTEMPTS).join(", ")}]`,
    );
  }

  private generateInternal(): GeneratedLevel {
    // Phase 1: Place turnpike and landmarks
    this.placeTurnpike();
    this.placeLandmarks();

    // Phase 2: Select road tiles (random walk)
    this.selectRoadTiles();

    // Phase 3: Assign tile types and rotations
    this.assignTileTypesAndRotations();

    // Validate: Check if any tile requires 4+ connections (unsolvable)
    this.validateNoFourWayIntersections();

    // Phase 4: Scramble rotations
    this.scrambleRotations();

    // Phase 5: Place decorational trees (FINAL STEP - after puzzle is complete)
    this.placeTreeDecorations();

    return {
      gridSize: { rows: this.gridSize, cols: this.gridSize },
      turnpike: this.turnpike,
      landmarks: this.landmarks,
      roadTiles: this.roadTiles,
      treeTiles: this.treeTiles,
      solutionPaths: this.solutionPaths,
    };
  }

  // ==========================================================================
  // Phase 1: Placement
  // ==========================================================================

  /**
   * Place turnpike based on difficulty
   */
  private placeTurnpike(): void {
    let position: TilePosition;

    switch (this.params.difficulty) {
      case "easy":
        // Place near center region
        position = this.getRandomCenterPosition();
        break;

      case "medium":
        // Place on random edge (not corner)
        position = this.getRandomEdgePosition(true);
        break;

      case "hard":
        // Place in corner
        position = this.getRandomCornerPosition();
        break;
    }

    this.turnpike = {
      row: position.row,
      col: position.col,
      tileType: "turnpike",
      roadType: RoadType.Turnpike,
      rotation: 0,
      solutionRotation: 0,
      rotatable: false,
    };

    this.setTile(position, this.turnpike);
  }

  /**
   * Get random position in center region
   */
  private getRandomCenterPosition(): TilePosition {
    const radius = Math.floor(this.gridSize / 4);
    const center = Math.floor(this.gridSize / 2);

    const row = this.rng.nextInt(center - radius, center + radius + 1);
    const col = this.rng.nextInt(center - radius, center + radius + 1);

    return { row, col };
  }

  /**
   * Get random edge position (optionally excluding corners)
   */
  private getRandomEdgePosition(excludeCorners: boolean): TilePosition {
    const edges: TilePosition[] = [];

    // Top edge
    for (
      let col = excludeCorners ? 1 : 0;
      col < (excludeCorners ? this.gridSize - 1 : this.gridSize);
      col++
    ) {
      edges.push({ row: 0, col });
    }

    // Bottom edge
    for (
      let col = excludeCorners ? 1 : 0;
      col < (excludeCorners ? this.gridSize - 1 : this.gridSize);
      col++
    ) {
      edges.push({ row: this.gridSize - 1, col });
    }

    // Left edge
    for (
      let row = excludeCorners ? 1 : 0;
      row < (excludeCorners ? this.gridSize - 1 : this.gridSize);
      row++
    ) {
      edges.push({ row, col: 0 });
    }

    // Right edge
    for (
      let row = excludeCorners ? 1 : 0;
      row < (excludeCorners ? this.gridSize - 1 : this.gridSize);
      row++
    ) {
      edges.push({ row, col: this.gridSize - 1 });
    }

    return this.rng.choice(edges);
  }

  /**
   * Get random corner position
   */
  private getRandomCornerPosition(): TilePosition {
    const corners: TilePosition[] = [
      { row: 0, col: 0 },
      { row: 0, col: this.gridSize - 1 },
      { row: this.gridSize - 1, col: 0 },
      { row: this.gridSize - 1, col: this.gridSize - 1 },
    ];

    return this.rng.choice(corners);
  }

  /**
   * Place landmarks with spacing constraints
   */
  private placeLandmarks(): void {
    const MIN_DISTANCE_FROM_TURNPIKE = 3;
    const MIN_SPACING_BETWEEN_LANDMARKS = 2;
    const MAX_ATTEMPTS = 100;

    const landmarkTypes: LandmarkType[] = [
      LandmarkType.Diner,
      LandmarkType.GasStation,
      LandmarkType.Market,
    ];

    for (let i = 0; i < this.params.landmarkCount; i++) {
      let attempts = 0;
      let placed = false;

      while (attempts < MAX_ATTEMPTS && !placed) {
        const candidate: TilePosition = {
          row: this.rng.nextInt(0, this.gridSize),
          col: this.rng.nextInt(0, this.gridSize),
        };

        // Check if position is occupied
        if (this.getTile(candidate)) {
          attempts++;
          continue;
        }

        // Check minimum distance from turnpike
        const distanceFromTurnpike = this.manhattanDistance(
          candidate,
          this.turnpike,
        );
        if (distanceFromTurnpike < MIN_DISTANCE_FROM_TURNPIKE) {
          attempts++;
          continue;
        }

        // Check minimum spacing between landmarks
        let tooClose = false;
        for (const landmark of this.landmarks) {
          const distance = this.manhattanDistance(candidate, landmark);
          if (distance < MIN_SPACING_BETWEEN_LANDMARKS) {
            tooClose = true;
            break;
          }
        }

        if (tooClose) {
          attempts++;
          continue;
        }

        // Valid position - place landmark
        const landmarkConfig: TileConfig = {
          row: candidate.row,
          col: candidate.col,
          tileType: "landmark",
          roadType: RoadType.Landmark,
          rotation: 0, // Will be calculated in Phase 3
          solutionRotation: 0,
          rotatable: false,
          landmarkType: landmarkTypes[i % landmarkTypes.length],
        };

        this.setTile(candidate, landmarkConfig);
        this.landmarks.push(landmarkConfig);
        placed = true;
      }

      if (!placed) {
        throw new Error(
          `Could not place landmark ${i + 1} after ${MAX_ATTEMPTS} attempts`,
        );
      }
    }
  }

  // ==========================================================================
  // Phase 2: Path Generation (Random Walk)
  // ==========================================================================

  /**
   * Select road tiles by generating paths from landmarks to turnpike
   */
  private selectRoadTiles(): void {
    // Generate path from each landmark to turnpike
    // existingRoads tracks tiles that can be reused by later paths
    const existingRoads = new Set<string>();

    for (const landmark of this.landmarks) {
      const path = this.generatePath(landmark, this.turnpike, existingRoads);
      this.solutionPaths.push(path);

      // Add all path tiles to existing roads (for path sharing)
      for (const pos of path) {
        existingRoads.add(this.posKey(pos));
      }
    }

    // Create road tiles ONLY from tiles in solution paths
    const tilesInSolutionPaths = new Set<string>();
    for (const path of this.solutionPaths) {
      for (const pos of path) {
        tilesInSolutionPaths.add(this.posKey(pos));
      }
    }

    // Convert tiles to road tile configs
    for (const key of tilesInSolutionPaths) {
      const [rowStr, colStr] = key.split(",");
      const pos: TilePosition = {
        row: parseInt(rowStr),
        col: parseInt(colStr),
      };

      // Skip if this is already a landmark or turnpike
      const existing = this.getTile(pos);
      if (existing) continue;

      // Create road tile placeholder (type will be assigned in Phase 3)
      const roadTile: TileConfig = {
        row: pos.row,
        col: pos.col,
        tileType: "straight", // Temporary placeholder
        roadType: RoadType.LocalRoad,
        rotation: 0,
        solutionRotation: 0,
        rotatable: true,
      };

      this.setTile(pos, roadTile);
      this.roadTiles.push(roadTile);
    }
  }

  /**
   * Generate path from start to target using constrained random walk
   */
  private generatePath(
    start: TilePosition,
    target: TilePosition,
    existingRoads: Set<string>,
  ): TilePosition[] {
    const _MAX_PATH_LENGTH = this.gridSize * this.gridSize; // Safety limit (intentionally unused)
    const MAX_ATTEMPTS = 50; // Increased for better success rate

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const path = this.attemptPath(start, target, existingRoads);
        // Accept any valid path (very relaxed constraint - minimum 1 tile)
        if (path.length >= 1) {
          return path;
        }
      } catch (_e) {
        // Path generation failed, try again
        continue;
      }
    }

    // If all attempts fail, throw error
    throw new Error(
      `Could not generate valid path from (${start.row},${start.col}) to (${target.row},${target.col})`,
    );
  }

  /**
   * Attempt to generate a single path
   */
  private attemptPath(
    start: TilePosition,
    target: TilePosition,
    existingRoads: Set<string>,
  ): TilePosition[] {
    const path: TilePosition[] = [];
    const visited = new Set<string>();
    let current = start;
    const MAX_STEPS = this.gridSize * this.gridSize;

    // Start from first step away from landmark
    const firstStep = this.getFirstStepFromLandmark(
      start,
      visited,
      existingRoads,
    );
    if (!firstStep) {
      throw new Error("Cannot find first step from landmark");
    }

    path.push(firstStep);
    visited.add(this.posKey(firstStep));
    current = firstStep;

    let steps = 0;
    while (steps < MAX_STEPS) {
      steps++;

      // Check if we're adjacent to turnpike
      if (this.isAdjacentTo(current, target)) {
        // Accept path if it meets min length OR if we've tried enough times
        if (path.length >= this.params.minPathLength || path.length >= 2) {
          return path; // Path complete!
        }
      }

      // Get valid next steps
      const candidates = this.getValidNextSteps(
        current,
        target,
        visited,
        existingRoads,
        path,
      );

      if (candidates.length === 0) {
        throw new Error("Path stuck - no valid candidates");
      }

      // Choose next step (with detour probability)
      const next =
        this.rng.next() < this.params.detourProbability
          ? this.rng.choice(candidates) // Random detour
          : this.closestToTarget(candidates, target); // Progress toward target

      path.push(next);
      visited.add(this.posKey(next));
      current = next;
    }

    throw new Error("Path exceeded max steps");
  }

  /**
   * Get first step from landmark (must be adjacent)
   */
  private getFirstStepFromLandmark(
    landmark: TilePosition,
    visited: Set<string>,
    existingRoads: Set<string>,
  ): TilePosition | null {
    const neighbors = this.getCardinalNeighbors(landmark);

    // Filter to valid starting positions
    const candidates = neighbors.filter((n) => {
      if (visited.has(this.posKey(n))) return false;
      if (this.isEndpoint(n)) return false; // Don't step into other landmarks/turnpike

      // IMPORTANT: Pass the landmark as part of "currentPath" so it's counted as a connection
      // when checking if this would create crossroads
      const tempCurrentPath = [landmark];
      if (this.wouldCreateCrossroads(n, existingRoads, tempCurrentPath))
        return false;
      return true;
    });

    return candidates.length > 0 ? this.rng.choice(candidates) : null;
  }

  /**
   * Get valid next steps from current position
   */
  private getValidNextSteps(
    current: TilePosition,
    target: TilePosition,
    visited: Set<string>,
    existingRoads: Set<string>,
    currentPath: TilePosition[],
  ): TilePosition[] {
    const neighbors = this.getCardinalNeighbors(current);

    return neighbors.filter((n) => {
      // Can't revisit in same path
      if (visited.has(this.posKey(n))) return false;

      // Can step into turnpike if we have a reasonable path (min 2 tiles)
      if (this.isTurnpike(n)) {
        return currentPath.length >= Math.min(this.params.minPathLength, 2);
      }

      // Can't step into landmarks
      if (this.isLandmark(n)) return false;

      // Check for crossroads (would create 4 neighbors)
      if (this.wouldCreateCrossroads(n, existingRoads, currentPath))
        return false;

      return true;
    });
  }

  /**
   * Check if position would create crossroads (4 connections)
   * This checks TWO things:
   * 1. Would THIS tile have 4 connections? (placing it here)
   * 2. Would any NEIGHBOR tiles end up with 4 connections? (if we connect to them)
   */
  private wouldCreateCrossroads(
    pos: TilePosition,
    existingRoads: Set<string>,
    currentPath: TilePosition[],
  ): boolean {
    const neighbors = this.getCardinalNeighbors(pos);

    // Count how many neighbors THIS tile would connect to
    let thisConnectionCount = 0;

    for (const n of neighbors) {
      const isRoad = existingRoads.has(this.posKey(n));
      const isInCurrentPath = currentPath.some(
        (p) => p.row === n.row && p.col === n.col,
      );
      const isEndpoint = this.isEndpoint(n);

      // Count ALL neighbors (including endpoints like landmarks/turnpike)
      if (isRoad || isInCurrentPath || isEndpoint) {
        thisConnectionCount++;

        // ALSO check if connecting to this neighbor would give IT 4 connections
        // (Only check road tiles, not endpoints, since endpoints can have unlimited connections)
        if (isRoad && !isEndpoint) {
          // Count how many connections this existing road tile already has
          const neighborConnectionCount = this.countExistingConnections(
            n,
            existingRoads,
          );

          // If it already has 3 connections, adding this would make 4!
          if (neighborConnectionCount >= 3) {
            return true; // Would create crossroads at neighbor
          }
        }
      }
    }

    // Would THIS tile have 4 or more connections?
    // We only have tiles with max 3 openings (T-junction), so prevent 4+
    return thisConnectionCount >= 4;
  }

  /**
   * Count how many connections an existing road tile has
   */
  private countExistingConnections(
    pos: TilePosition,
    existingRoads: Set<string>,
  ): number {
    const neighbors = this.getCardinalNeighbors(pos);
    let count = 0;

    for (const n of neighbors) {
      const isRoad = existingRoads.has(this.posKey(n));
      const isEndpoint = this.isEndpoint(n);

      if (isRoad || isEndpoint) {
        count++;
      }
    }

    return count;
  }

  /**
   * Check if current is adjacent to target
   */
  private isAdjacentTo(pos: TilePosition, target: TilePosition): boolean {
    const distance = this.manhattanDistance(pos, target);
    return distance === 1;
  }

  /**
   * Find candidate closest to target (Manhattan distance)
   */
  private closestToTarget(
    candidates: TilePosition[],
    target: TilePosition,
  ): TilePosition {
    let closest = candidates[0];
    let minDist = this.manhattanDistance(closest, target);

    for (const candidate of candidates) {
      const dist = this.manhattanDistance(candidate, target);
      if (dist < minDist) {
        minDist = dist;
        closest = candidate;
      }
    }

    return closest;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get tile at position
   */
  private getTile(pos: TilePosition): TileConfig | undefined {
    return this.grid.get(this.posKey(pos));
  }

  /**
   * Set tile at position
   */
  private setTile(pos: TilePosition, tile: TileConfig): void {
    this.grid.set(this.posKey(pos), tile);
  }

  /**
   * Convert position to string key
   */
  private posKey(pos: TilePosition): string {
    return `${pos.row},${pos.col}`;
  }

  /**
   * Check if position is within grid bounds
   */
  private inBounds(pos: TilePosition): boolean {
    return (
      pos.row >= 0 &&
      pos.row < this.gridSize &&
      pos.col >= 0 &&
      pos.col < this.gridSize
    );
  }

  /**
   * Calculate Manhattan distance between two positions
   */
  private manhattanDistance(a: TilePosition, b: TilePosition): number {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
  }

  /**
   * Get cardinal neighbor positions (N, E, S, W)
   */
  private getCardinalNeighbors(pos: TilePosition): TilePosition[] {
    const neighbors: TilePosition[] = [
      { row: pos.row - 1, col: pos.col }, // North
      { row: pos.row, col: pos.col + 1 }, // East
      { row: pos.row + 1, col: pos.col }, // South
      { row: pos.row, col: pos.col - 1 }, // West
    ];

    return neighbors.filter((n) => this.inBounds(n));
  }

  /**
   * Check if position is turnpike
   */
  private isTurnpike(pos: TilePosition): boolean {
    const tile = this.getTile(pos);
    return tile?.tileType === "turnpike";
  }

  /**
   * Check if position is landmark
   */
  private isLandmark(pos: TilePosition): boolean {
    const tile = this.getTile(pos);
    return tile?.tileType === "landmark";
  }

  /**
   * Check if position is an endpoint (landmark or turnpike)
   */
  private isEndpoint(pos: TilePosition): boolean {
    return this.isLandmark(pos) || this.isTurnpike(pos);
  }

  // ==========================================================================
  // Phase 3: Tile Assignment & Rotation
  // ==========================================================================

  /**
   * Assign tile types and rotations based on actual connections
   */
  private assignTileTypesAndRotations(): void {
    // Build a map of which landmarks connect to which tiles
    const landmarkConnections = new Map<string, Set<string>>();

    // Build a map of which tiles are actually adjacent in solution paths
    const pathConnections = new Map<string, Set<string>>();

    this.solutionPaths.forEach((path, landmarkIndex) => {
      const landmark = this.landmarks[landmarkIndex];
      const landmarkKey = this.posKey(landmark);
      const connections = new Set<string>();

      // Landmark connects to first tile in its path
      if (path.length > 0) {
        const firstTileKey = this.posKey(path[0]);
        connections.add(firstTileKey);

        // Add bidirectional connection between landmark and first tile
        if (!pathConnections.has(landmarkKey)) {
          pathConnections.set(landmarkKey, new Set());
        }
        pathConnections.get(landmarkKey)!.add(firstTileKey);

        if (!pathConnections.has(firstTileKey)) {
          pathConnections.set(firstTileKey, new Set());
        }
        pathConnections.get(firstTileKey)!.add(landmarkKey);
      }

      landmarkConnections.set(landmarkKey, connections);

      // Record connections between consecutive tiles in path
      for (let i = 0; i < path.length - 1; i++) {
        const currentKey = this.posKey(path[i]);
        const nextKey = this.posKey(path[i + 1]);

        if (!pathConnections.has(currentKey)) {
          pathConnections.set(currentKey, new Set());
        }
        pathConnections.get(currentKey)!.add(nextKey);

        if (!pathConnections.has(nextKey)) {
          pathConnections.set(nextKey, new Set());
        }
        pathConnections.get(nextKey)!.add(currentKey);
      }

      // Last tile in path connects to turnpike
      if (path.length > 0) {
        const lastTileKey = this.posKey(path[path.length - 1]);
        const turnpikeKey = this.posKey(this.turnpike);

        if (!pathConnections.has(lastTileKey)) {
          pathConnections.set(lastTileKey, new Set());
        }
        pathConnections.get(lastTileKey)!.add(turnpikeKey);

        if (!pathConnections.has(turnpikeKey)) {
          pathConnections.set(turnpikeKey, new Set());
        }
        pathConnections.get(turnpikeKey)!.add(lastTileKey);
      }
    });

    // Process all road tiles
    for (const roadTile of this.roadTiles) {
      this.assignTileTypeAndRotation(
        roadTile,
        landmarkConnections,
        pathConnections,
      );
    }

    // Orient landmarks to face their connected road tile
    for (const landmark of this.landmarks) {
      this.orientLandmark(landmark, landmarkConnections, pathConnections);
    }
  }

  /**
   * Assign type and rotation for a single road tile
   */
  private assignTileTypeAndRotation(
    tile: TileConfig,
    landmarkConnections: Map<string, Set<string>>,
    pathConnections: Map<string, Set<string>>,
  ): void {
    // Get all connected directions
    const connections = this.getConnectedDirections(
      tile,
      landmarkConnections,
      pathConnections,
    );
    const connectionCount = connections.length;

    if (connectionCount === 2) {
      // 2 connections: either straight or corner
      if (this.areOpposite(connections)) {
        // Straight road
        tile.tileType = "straight";
        tile.solutionRotation = this.getRotationForStraight(connections);
      } else {
        // Corner road
        tile.tileType = "corner";
        tile.solutionRotation = this.getRotationForCorner(connections);
      }
    } else if (connectionCount === 3) {
      // T-junction
      tile.tileType = "t_junction";
      tile.solutionRotation = this.getRotationForTJunction(connections);
    } else {
      // Invalid connection count (should not happen with our constraints)
      console.warn(
        `Invalid connection count ${connectionCount} at (${tile.row}, ${tile.col})`,
      );
      tile.tileType = "straight";
      tile.solutionRotation = 0;
    }

    // Solution rotation is the correct answer
    tile.rotation = tile.solutionRotation;
  }

  /**
   * Orient landmark to face its connected road tile
   */
  private orientLandmark(
    landmark: TileConfig,
    landmarkConnections: Map<string, Set<string>>,
    pathConnections: Map<string, Set<string>>,
  ): void {
    const connections = this.getConnectedDirections(
      landmark,
      landmarkConnections,
      pathConnections,
    );

    if (connections.length === 0) {
      console.warn(
        `Landmark at (${landmark.row}, ${landmark.col}) has no connections`,
      );
      landmark.rotation = 0;
      landmark.solutionRotation = 0;
      return;
    }

    // Landmark should face the direction of its single connection
    const connectionDir = connections[0];
    landmark.rotation = this.directionToRotation(connectionDir);
    landmark.solutionRotation = landmark.rotation;
  }

  /**
   * Get all connected directions for a tile
   * Only counts actual path connections (not just adjacency)
   */
  private getConnectedDirections(
    tile: TileConfig,
    landmarkConnections: Map<string, Set<string>>,
    pathConnections: Map<string, Set<string>>,
  ): Direction[] {
    const pos: TilePosition = { row: tile.row, col: tile.col };
    const tileKey = this.posKey(pos);
    const neighbors = [
      { dir: Direction.North, pos: { row: pos.row - 1, col: pos.col } },
      { dir: Direction.East, pos: { row: pos.row, col: pos.col + 1 } },
      { dir: Direction.South, pos: { row: pos.row + 1, col: pos.col } },
      { dir: Direction.West, pos: { row: pos.row, col: pos.col - 1 } },
    ];

    const connections: Direction[] = [];

    // Get tiles that are actually connected in solution paths
    const connectedTiles = pathConnections.get(tileKey) || new Set();

    for (const neighbor of neighbors) {
      if (!this.inBounds(neighbor.pos)) continue;

      const neighborKey = this.posKey(neighbor.pos);

      // Only connect if this neighbor is in the pathConnections map
      if (connectedTiles.has(neighborKey)) {
        connections.push(neighbor.dir);
      }
    }

    return connections;
  }

  /**
   * Check if two directions are opposite (180° apart)
   */
  private areOpposite(dirs: Direction[]): boolean {
    if (dirs.length !== 2) return false;

    const [d1, d2] = dirs;
    return (
      (d1 === Direction.North && d2 === Direction.South) ||
      (d1 === Direction.South && d2 === Direction.North) ||
      (d1 === Direction.East && d2 === Direction.West) ||
      (d1 === Direction.West && d2 === Direction.East)
    );
  }

  /**
   * Get rotation for straight road (N-S or E-W)
   */
  private getRotationForStraight(dirs: Direction[]): number {
    // Straight tiles: 0° = N-S, 90° = E-W
    if (dirs.includes(Direction.North) && dirs.includes(Direction.South)) {
      return 0; // Vertical
    } else {
      return 90; // Horizontal
    }
  }

  /**
   * Get rotation for corner road
   */
  private getRotationForCorner(dirs: Direction[]): number {
    // Corner tiles: 0° = N-E, 90° = E-S, 180° = S-W, 270° = W-N
    const hasNorth = dirs.includes(Direction.North);
    const hasEast = dirs.includes(Direction.East);
    const hasSouth = dirs.includes(Direction.South);
    const hasWest = dirs.includes(Direction.West);

    if (hasNorth && hasEast) return 0; // N-E corner
    if (hasEast && hasSouth) return 90; // E-S corner
    if (hasSouth && hasWest) return 180; // S-W corner
    if (hasWest && hasNorth) return 270; // W-N corner

    return 0; // Fallback
  }

  /**
   * Get rotation for T-junction
   */
  private getRotationForTJunction(dirs: Direction[]): number {
    // T-junction: 0° = N-E-S (missing West), 90° = E-S-W (missing North), etc.
    const hasNorth = dirs.includes(Direction.North);
    const hasEast = dirs.includes(Direction.East);
    const hasSouth = dirs.includes(Direction.South);
    const hasWest = dirs.includes(Direction.West);

    if (!hasWest) return 0; // N-E-S (stem points West)
    if (!hasNorth) return 90; // E-S-W (stem points North)
    if (!hasEast) return 180; // S-W-N (stem points East)
    if (!hasSouth) return 270; // W-N-E (stem points South)

    return 0; // Fallback
  }

  /**
   * Convert direction to rotation angle
   */
  private directionToRotation(dir: Direction): number {
    switch (dir) {
      case Direction.North:
        return 0;
      case Direction.East:
        return 90;
      case Direction.South:
        return 180;
      case Direction.West:
        return 270;
      default:
        return 0;
    }
  }

  // ==========================================================================
  // Phase 4: Scramble Rotations
  // ==========================================================================

  /**
   * Phase 4: Scramble rotations to create puzzle
   *
   * Randomly rotates each road tile to create the initial puzzle state.
   * The solution state (solutionRotation) is preserved for validation.
   * Landmarks and turnpike are not rotatable, so they keep their orientation.
   */
  private scrambleRotations(): void {
    const validRotations = [0, 90, 180, 270];

    if (this.roadTiles.length === 0) {
      return;
    }

    for (const tile of this.roadTiles) {
      if (!tile.rotatable) {
        console.warn(
          `[LevelGenerator] Non-rotatable road tile at (${tile.row},${tile.col})`,
        );
        continue;
      }

      tile.rotation = this.rng.choice(validRotations);
    }
  }

  // ==========================================================================
  // Phase 5: Tree Decorations
  // ==========================================================================

  /**
   * Phase 5: Place decorational trees on empty tiles
   *
   * IMPORTANT: This runs AFTER scrambling, as the final step.
   * Trees are placed only on completely empty grid positions (no roads, landmarks, or turnpikes).
   * Trees are purely decorational and not part of gameplay or validation.
   *
   * Max 2 trees per level for visual variety without clutter.
   */
  private placeTreeDecorations(): void {
    // Array of decoration options to randomly select from
    const DECORATION_OPTIONS = ["tree-1", "tree-2", "bush-1"];
    console.log(
      "[LevelGenerator] 🌳 Decoration options available:",
      DECORATION_OPTIONS,
    );

    // Find all empty tiles (positions with no road, landmark, or turnpike)
    const emptyTiles: TilePosition[] = [];

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const pos: TilePosition = { row, col };
        if (!this.getTile(pos)) {
          emptyTiles.push(pos);
        }
      }
    }

    console.log(
      `[LevelGenerator] Tree placement: ${emptyTiles.length} empty tiles available`,
    );

    if (emptyTiles.length === 0) {
      console.log("[LevelGenerator] No empty tiles for trees - grid is full");
      return; // No empty tiles to place trees
    }

    // Place max 2 trees randomly
    const treeCount = Math.min(2, emptyTiles.length);
    const shuffled = this.rng.shuffle([...emptyTiles]); // Shuffle copy

    console.log(`[LevelGenerator] Placing ${treeCount} trees`);

    for (let i = 0; i < treeCount; i++) {
      const pos = shuffled[i];

      // Use index-based cycling for variety (same pattern as landmarks)
      const decorationType = DECORATION_OPTIONS[i % DECORATION_OPTIONS.length];

      const treeConfig: TileConfig = {
        row: pos.row,
        col: pos.col,
        tileType: "tree",
        roadType: RoadType.Tree,
        rotation: 0,
        solutionRotation: 0,
        rotatable: false, // Trees cannot be rotated
        decorationType: decorationType, // Cycles through decoration types
      };

      this.setTile(pos, treeConfig);
      this.treeTiles.push(treeConfig);
      console.log(
        `[LevelGenerator] 🌳 ${decorationType} placed at (${pos.row}, ${pos.col})`,
      );
    }

    console.log(
      `[LevelGenerator] Total trees in level: ${this.treeTiles.length}`,
    );
  }

  // ==========================================================================
  // Phase 3 Validation
  // ==========================================================================

  /**
   * Validate that no tile requires 4+ connections (which would need a crossroad)
   * Throws error if validation fails (triggers seed retry)
   */
  private validateNoFourWayIntersections(): void {
    // Build connection map from solution paths
    const pathConnections = new Map<string, Set<string>>();

    this.solutionPaths.forEach((path, landmarkIndex) => {
      const landmark = this.landmarks[landmarkIndex];
      const landmarkKey = this.posKey(landmark);

      // Landmark connects to first tile
      if (path.length > 0) {
        const firstTileKey = this.posKey(path[0]);
        if (!pathConnections.has(landmarkKey)) {
          pathConnections.set(landmarkKey, new Set());
        }
        pathConnections.get(landmarkKey)!.add(firstTileKey);

        if (!pathConnections.has(firstTileKey)) {
          pathConnections.set(firstTileKey, new Set());
        }
        pathConnections.get(firstTileKey)!.add(landmarkKey);
      }

      // Connections between path tiles
      for (let i = 0; i < path.length - 1; i++) {
        const currentKey = this.posKey(path[i]);
        const nextKey = this.posKey(path[i + 1]);

        if (!pathConnections.has(currentKey)) {
          pathConnections.set(currentKey, new Set());
        }
        pathConnections.get(currentKey)!.add(nextKey);

        if (!pathConnections.has(nextKey)) {
          pathConnections.set(nextKey, new Set());
        }
        pathConnections.get(nextKey)!.add(currentKey);
      }

      // Last tile connects to turnpike
      if (path.length > 0) {
        const lastTileKey = this.posKey(path[path.length - 1]);
        const turnpikeKey = this.posKey(this.turnpike);

        if (!pathConnections.has(lastTileKey)) {
          pathConnections.set(lastTileKey, new Set());
        }
        pathConnections.get(lastTileKey)!.add(turnpikeKey);

        if (!pathConnections.has(turnpikeKey)) {
          pathConnections.set(turnpikeKey, new Set());
        }
        pathConnections.get(turnpikeKey)!.add(lastTileKey);
      }
    });

    // Check each tile's connection count
    for (const [tileKey, connections] of pathConnections.entries()) {
      if (connections.size >= 4) {
        const [rowStr, colStr] = tileKey.split(",");
        throw new Error(
          `Tile at (${rowStr},${colStr}) requires ${connections.size} connections (4-way crossroad), but max tile type is T-junction (3 connections)`
        );
      }
    }
  }

  /**
   * Debug: Log path validation issues without throwing errors
   */
  private debugValidatePaths(): void {
    console.log("🔍 [DEBUG] Validating solution paths...");

    for (let i = 0; i < this.solutionPaths.length; i++) {
      const path = this.solutionPaths[i];
      const landmark = this.landmarks[i];

      console.log(`  Path ${i}: Landmark at (${landmark.row},${landmark.col}) → Turnpike at (${this.turnpike.row},${this.turnpike.col})`);
      console.log(`    Path tiles: ${path.map(p => `(${p.row},${p.col})`).join(' → ')}`);

      if (path.length === 0) {
        console.warn(`    ⚠️  EMPTY PATH!`);
        continue;
      }

      // Check if last tile is adjacent to turnpike
      const lastTile = path[path.length - 1];
      const distToTurnpike = this.manhattanDistance(lastTile, this.turnpike);
      console.log(`    Last tile: (${lastTile.row},${lastTile.col}), distance to turnpike: ${distToTurnpike}`);

      if (distToTurnpike > 1) {
        console.warn(`    ⚠️  PATH DOESN'T REACH TURNPIKE! Last tile is ${distToTurnpike} tiles away`);
      }
    }
  }

  /**
   * Validate solution state after Phase 3
   * Throws error if validation fails (triggers seed retry)
   */
  private validateSolutionState(): void {
    console.log("🔍 Validating solution state...");

    const pathValidation = this.validateSolutionPaths();
    if (!pathValidation.valid) {
      throw new Error(`Path validation failed: ${pathValidation.error}`);
    }

    console.log("✅ Solution state validation passed");
  }

  /**
   * Validate that solution paths actually connect
   * Uses stored solutionPaths from Phase 2
   */
  private validateSolutionPaths(): { valid: boolean; error?: string } {
    for (let i = 0; i < this.solutionPaths.length; i++) {
      const path = this.solutionPaths[i];
      const landmark = this.landmarks[i];

      // Check landmark → first path tile
      if (path.length > 0) {
        const firstTile = this.getTile(path[0]);
        if (!firstTile) {
          return {
            valid: false,
            error: `Path ${i}: First tile at (${path[0].row},${path[0].col}) not found`,
          };
        }

        const direction = this.getDirection(landmark, path[0]);
        if (!this.tilesConnect(landmark, firstTile, direction)) {
          return {
            valid: false,
            error: `Path ${i}: Landmark at (${landmark.row},${landmark.col}) doesn't connect to first tile`,
          };
        }
      }

      // Check consecutive tiles in path
      for (let j = 0; j < path.length - 1; j++) {
        const currentTile = this.getTile(path[j]);
        const nextTile = this.getTile(path[j + 1]);

        if (!currentTile || !nextTile) {
          return {
            valid: false,
            error: `Path ${i}: Tile not found in path segment ${j}`,
          };
        }

        const direction = this.getDirection(path[j], path[j + 1]);
        if (!this.tilesConnect(currentTile, nextTile, direction)) {
          return {
            valid: false,
            error: `Path ${i}: Broken connection at (${path[j].row},${path[j].col}) → (${path[j + 1].row},${path[j + 1].col})`,
          };
        }
      }

      // Check last tile → turnpike
      if (path.length > 0) {
        const lastTile = this.getTile(path[path.length - 1]);
        const direction = this.getDirection(
          path[path.length - 1],
          this.turnpike,
        );

        if (!this.tilesConnect(lastTile!, this.turnpike, direction)) {
          return {
            valid: false,
            error: `Path ${i}: Last tile doesn't connect to turnpike`,
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Check if two tiles connect in the given direction
   * Uses solution rotations
   */
  private tilesConnect(
    tileA: TileConfig,
    tileB: TileConfig,
    direction: Direction,
  ): boolean {
    const openingsA = this.getOpeningsForTile(tileA);
    const openingsB = this.getOpeningsForTile(tileB);

    // Check if tileA has opening in direction
    if (!openingsA.includes(direction)) {
      return false;
    }

    // Check if tileB has opening in opposite direction
    const oppositeDir = this.getOppositeDirection(direction);
    if (!openingsB.includes(oppositeDir)) {
      return false;
    }

    return true;
  }

  /**
   * Get openings for a tile based on its type and solution rotation
   * Replicates RoadTile.getOpenings() logic without instantiating
   */
  private getOpeningsForTile(tile: TileConfig): Direction[] {
    const baseOpenings: { [key: string]: Direction[] } = {
      straight: [Direction.North, Direction.South],
      corner: [Direction.North, Direction.East],
      t_junction: [Direction.North, Direction.East, Direction.West],
      landmark: [
        Direction.North,
        Direction.East,
        Direction.South,
        Direction.West,
      ],
      turnpike: [
        Direction.North,
        Direction.East,
        Direction.South,
        Direction.West,
      ],
    };

    const base = baseOpenings[tile.tileType] || [];
    return base.map((dir) => this.rotateDirection(dir, tile.solutionRotation));
  }

  /**
   * Rotate a direction by given angle (0, 90, 180, 270)
   */
  private rotateDirection(dir: Direction, rotation: number): Direction {
    const rotationSteps = (rotation / 90) % 4;
    const dirMap = [
      Direction.North,
      Direction.East,
      Direction.South,
      Direction.West,
    ];
    const currentIndex = dirMap.indexOf(dir);
    const newIndex = (currentIndex + rotationSteps) % 4;
    return dirMap[newIndex];
  }

  /**
   * Get direction from posA to posB (must be adjacent)
   */
  private getDirection(posA: TilePosition, posB: TilePosition): Direction {
    if (posB.row < posA.row) return Direction.North;
    if (posB.row > posA.row) return Direction.South;
    if (posB.col > posA.col) return Direction.East;
    return Direction.West;
  }

  /**
   * Get opposite direction
   */
  private getOppositeDirection(dir: Direction): Direction {
    const opposites = {
      [Direction.North]: Direction.South,
      [Direction.South]: Direction.North,
      [Direction.East]: Direction.West,
      [Direction.West]: Direction.East,
    };
    return opposites[dir];
  }
}
