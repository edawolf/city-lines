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
}

export interface GeneratedLevel {
  gridSize: { rows: number; cols: number };
  turnpike: TileConfig;
  landmarks: TileConfig[];
  roadTiles: TileConfig[];
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
  private rng: XORShift32;
  private params: DifficultyParams;
  private gridSize: number;

  // Grid state
  private grid: Map<string, TileConfig>;
  private turnpike!: TileConfig;
  private landmarks: TileConfig[] = [];
  private roadTiles: TileConfig[] = [];
  private solutionPaths: TilePosition[][] = [];

  constructor(params: DifficultyParams, seed: number) {
    this.params = params;
    this.gridSize = params.gridSize;
    this.rng = new XORShift32(seed);
    this.grid = new Map();
  }

  /**
   * Main generation entry point
   */
  static generate(params: DifficultyParams, seed: number): GeneratedLevel {
    const generator = new LevelGenerator(params, seed);
    return generator.generateInternal();
  }

  private generateInternal(): GeneratedLevel {
    // Phase 1: Place turnpike and landmarks
    this.placeTurnpike();
    this.placeLandmarks();

    // Phase 2: Select road tiles (random walk)
    this.selectRoadTiles();

    // Phase 3: Assign tile types and rotations
    this.assignTileTypesAndRotations();

    // TODO: Phase 4: Scramble rotations
    // TODO: Phase 5: Validate

    return {
      gridSize: { rows: this.gridSize, cols: this.gridSize },
      turnpike: this.turnpike,
      landmarks: this.landmarks,
      roadTiles: this.roadTiles,
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
    for (let col = excludeCorners ? 1 : 0; col < (excludeCorners ? this.gridSize - 1 : this.gridSize); col++) {
      edges.push({ row: 0, col });
    }

    // Bottom edge
    for (let col = excludeCorners ? 1 : 0; col < (excludeCorners ? this.gridSize - 1 : this.gridSize); col++) {
      edges.push({ row: this.gridSize - 1, col });
    }

    // Left edge
    for (let row = excludeCorners ? 1 : 0; row < (excludeCorners ? this.gridSize - 1 : this.gridSize); row++) {
      edges.push({ row, col: 0 });
    }

    // Right edge
    for (let row = excludeCorners ? 1 : 0; row < (excludeCorners ? this.gridSize - 1 : this.gridSize); row++) {
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
          this.turnpike
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
          `Could not place landmark ${i + 1} after ${MAX_ATTEMPTS} attempts`
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
    const selectedTiles = new Set<string>();

    // Generate path from each landmark to turnpike
    for (const landmark of this.landmarks) {
      const path = this.generatePath(landmark, this.turnpike, selectedTiles);
      this.solutionPaths.push(path);

      // Add all path tiles to selected set
      for (const pos of path) {
        selectedTiles.add(this.posKey(pos));
      }
    }

    // Convert selected tiles to road tile configs
    for (const key of selectedTiles) {
      const [rowStr, colStr] = key.split(",");
      const pos: TilePosition = { row: parseInt(rowStr), col: parseInt(colStr) };

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
    existingRoads: Set<string>
  ): TilePosition[] {
    const MAX_PATH_LENGTH = this.gridSize * this.gridSize; // Safety limit
    const MAX_ATTEMPTS = 50; // Increased for better success rate

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const path = this.attemptPath(start, target, existingRoads);
        // Accept any valid path (very relaxed constraint - minimum 1 tile)
        if (path.length >= 1) {
          return path;
        }
      } catch (e) {
        // Path generation failed, try again
        continue;
      }
    }

    // If all attempts fail, throw error
    throw new Error(
      `Could not generate valid path from (${start.row},${start.col}) to (${target.row},${target.col})`
    );
  }

  /**
   * Attempt to generate a single path
   */
  private attemptPath(
    start: TilePosition,
    target: TilePosition,
    existingRoads: Set<string>
  ): TilePosition[] {
    const path: TilePosition[] = [];
    const visited = new Set<string>();
    let current = start;
    const MAX_STEPS = this.gridSize * this.gridSize;

    // Start from first step away from landmark
    const firstStep = this.getFirstStepFromLandmark(start, visited, existingRoads);
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
      const candidates = this.getValidNextSteps(current, target, visited, existingRoads, path);

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
    existingRoads: Set<string>
  ): TilePosition | null {
    const neighbors = this.getCardinalNeighbors(landmark);

    // Filter to valid starting positions
    const candidates = neighbors.filter((n) => {
      if (visited.has(this.posKey(n))) return false;
      if (this.isEndpoint(n)) return false; // Don't step into other landmarks/turnpike

      // IMPORTANT: Pass the landmark as part of "currentPath" so it's counted as a connection
      // when checking if this would create crossroads
      const tempCurrentPath = [landmark];
      if (this.wouldCreateCrossroads(n, existingRoads, tempCurrentPath)) return false;
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
    currentPath: TilePosition[]
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
      if (this.wouldCreateCrossroads(n, existingRoads, currentPath)) return false;

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
    currentPath: TilePosition[]
  ): boolean {
    const neighbors = this.getCardinalNeighbors(pos);

    // Count how many neighbors THIS tile would connect to
    let thisConnectionCount = 0;

    for (const n of neighbors) {
      const isRoad = existingRoads.has(this.posKey(n));
      const isInCurrentPath = currentPath.some((p) => p.row === n.row && p.col === n.col);
      const isEndpoint = this.isEndpoint(n);

      // Count ALL neighbors (including endpoints like landmarks/turnpike)
      if (isRoad || isInCurrentPath || isEndpoint) {
        thisConnectionCount++;

        // ALSO check if connecting to this neighbor would give IT 4 connections
        // (Only check road tiles, not endpoints, since endpoints can have unlimited connections)
        if (isRoad && !isEndpoint) {
          // Count how many connections this existing road tile already has
          const neighborConnectionCount = this.countExistingConnections(n, existingRoads);

          // If it already has 3 connections, adding this would make 4!
          if (neighborConnectionCount >= 3) {
            return true; // Would create crossroads at neighbor
          }
        }
      }
    }

    // Would THIS tile have 4 connections?
    return thisConnectionCount >= 4;
  }

  /**
   * Count how many connections an existing road tile has
   */
  private countExistingConnections(
    pos: TilePosition,
    existingRoads: Set<string>
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
  private closestToTarget(candidates: TilePosition[], target: TilePosition): TilePosition {
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

    this.solutionPaths.forEach((path, landmarkIndex) => {
      const landmark = this.landmarks[landmarkIndex];
      const landmarkKey = this.posKey(landmark);
      const connections = new Set<string>();

      // Landmark connects to first tile in its path
      if (path.length > 0) {
        connections.add(this.posKey(path[0]));
      }

      landmarkConnections.set(landmarkKey, connections);
    });

    // Process all road tiles
    for (const roadTile of this.roadTiles) {
      this.assignTileTypeAndRotation(roadTile, landmarkConnections);
    }

    // Orient landmarks to face their connected road tile
    for (const landmark of this.landmarks) {
      this.orientLandmark(landmark, landmarkConnections);
    }
  }

  /**
   * Assign type and rotation for a single road tile
   */
  private assignTileTypeAndRotation(
    tile: TileConfig,
    landmarkConnections: Map<string, Set<string>>
  ): void {
    // Get all connected directions
    const connections = this.getConnectedDirections(tile, landmarkConnections);
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
      console.warn(`Invalid connection count ${connectionCount} at (${tile.row}, ${tile.col})`);
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
    landmarkConnections: Map<string, Set<string>>
  ): void {
    const connections = this.getConnectedDirections(landmark, landmarkConnections);

    if (connections.length === 0) {
      console.warn(`Landmark at (${landmark.row}, ${landmark.col}) has no connections`);
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
    landmarkConnections: Map<string, Set<string>>
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

    for (const neighbor of neighbors) {
      if (!this.inBounds(neighbor.pos)) continue;

      const neighborTile = this.getTile(neighbor.pos);
      if (!neighborTile) continue;

      const neighborKey = this.posKey(neighbor.pos);

      // Check if neighbor is a landmark
      if (neighborTile.tileType === "landmark") {
        // Only connect if this tile is in the landmark's path
        const landmarkConns = landmarkConnections.get(neighborKey);
        if (landmarkConns && landmarkConns.has(tileKey)) {
          connections.push(neighbor.dir);
        }
      } else {
        // Road or turnpike - always connects if adjacent
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

    if (hasNorth && hasEast) return 0;   // N-E corner
    if (hasEast && hasSouth) return 90;  // E-S corner
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

    if (!hasWest) return 0;   // N-E-S (stem points West)
    if (!hasNorth) return 90;  // E-S-W (stem points North)
    if (!hasEast) return 180; // S-W-N (stem points East)
    if (!hasSouth) return 270; // W-N-E (stem points South)

    return 0; // Fallback
  }

  /**
   * Convert direction to rotation angle
   */
  private directionToRotation(dir: Direction): number {
    switch (dir) {
      case Direction.North: return 0;
      case Direction.East: return 90;
      case Direction.South: return 180;
      case Direction.West: return 270;
      default: return 0;
    }
  }
}
