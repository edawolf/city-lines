import type { RoadTile } from "../entities/RoadTile";
import { Direction, CONNECTION_RULES } from "../entities/RoadTile";

/**
 * PathValidator
 *
 * LISA Instructions: COLLIDE + CMP + LINK
 *
 * Validates road connections in the city grid using:
 * 1. Direction matching (roads must connect via openings)
 * 2. Road type hierarchy (must follow connection rules)
 * 3. Graph traversal (BFS to find paths between landmarks)
 *
 * Mechanical Layer:
 * - COLLIDE: Check if tiles connect via directions
 * - CMP: Compare road types for compatibility
 * - LINK: Build connection graph
 *
 * Strategic Layer:
 * - TEST: Validate player's path solution
 * - REWARD: Enable path completion detection
 */

export interface ConnectionResult {
  connected: boolean;
  reason?: string; // Why connection failed (for debugging)
}

export interface PathResult {
  exists: boolean;
  path?: RoadTile[]; // Actual tiles in the path
  length?: number;
}

export class PathValidator {
  /**
   * Check if two adjacent tiles connect properly
   */
  public static validateConnection(
    tileA: RoadTile,
    tileB: RoadTile,
    direction: Direction,
  ): ConnectionResult {
    // Check direction compatibility
    const { directionsMatch, typesCompatible } = tileA.connectsTo(
      tileB,
      direction,
    );

    if (!directionsMatch) {
      return {
        connected: false,
        reason: `Directions don't match: ${tileA.getOpenings()} vs ${tileB.getOpenings()}`,
      };
    }

    if (!typesCompatible) {
      return {
        connected: false,
        reason: `Road types incompatible: ${tileA.roadType} → ${tileB.roadType}`,
      };
    }

    return { connected: true };
  }

  /**
   * Build a connection graph from a grid of tiles
   * Returns Map<tile, connected_tiles[]>
   */
  public static buildConnectionGraph(
    grid: RoadTile[][],
  ): Map<RoadTile, RoadTile[]> {
    const graph = new Map<RoadTile, RoadTile[]>();
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tile = grid[row][col];
        if (!tile) continue;

        const connectedNeighbors: RoadTile[] = [];

        // Check North neighbor
        if (row > 0) {
          const northTile = grid[row - 1][col];
          if (northTile) {
            const result = this.validateConnection(
              tile,
              northTile,
              Direction.North,
            );
            if (result.connected) {
              connectedNeighbors.push(northTile);
            }
          }
        }

        // Check East neighbor
        if (col < cols - 1) {
          const eastTile = grid[row][col + 1];
          if (eastTile) {
            const result = this.validateConnection(
              tile,
              eastTile,
              Direction.East,
            );
            if (result.connected) {
              connectedNeighbors.push(eastTile);
            }
          }
        }

        // Check South neighbor
        if (row < rows - 1) {
          const southTile = grid[row + 1][col];
          if (southTile) {
            const result = this.validateConnection(
              tile,
              southTile,
              Direction.South,
            );
            if (result.connected) {
              connectedNeighbors.push(southTile);
            }
          }
        }

        // Check West neighbor
        if (col > 0) {
          const westTile = grid[row][col - 1];
          if (westTile) {
            const result = this.validateConnection(
              tile,
              westTile,
              Direction.West,
            );
            if (result.connected) {
              connectedNeighbors.push(westTile);
            }
          }
        }

        graph.set(tile, connectedNeighbors);
      }
    }

    return graph;
  }

  /**
   * Find path between two tiles using BFS
   */
  public static findPath(
    start: RoadTile,
    end: RoadTile,
    graph: Map<RoadTile, RoadTile[]>,
  ): PathResult {
    if (start === end) {
      return { exists: true, path: [start], length: 0 };
    }

    const visited = new Set<RoadTile>();
    const queue: { tile: RoadTile; path: RoadTile[] }[] = [
      { tile: start, path: [start] },
    ];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;

      const { tile, path } = current;

      // Found the destination
      if (tile === end) {
        return {
          exists: true,
          path: path,
          length: path.length - 1,
        };
      }

      // Skip if already visited
      if (visited.has(tile)) continue;
      visited.add(tile);

      // Add neighbors to queue
      const neighbors = graph.get(tile) ?? [];
      neighbors.forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          queue.push({
            tile: neighbor,
            path: [...path, neighbor],
          });
        }
      });
    }

    // No path found
    return {
      exists: false,
      reason: `No path exists from (${start.gridPos.row},${start.gridPos.col}) to (${end.gridPos.row},${end.gridPos.col})`,
    } as PathResult;
  }

  /**
   * Check if all landmarks are mutually connected
   * (All landmarks should be reachable from each other)
   */
  public static validateAllLandmarksConnected(
    landmarks: RoadTile[],
    graph: Map<RoadTile, RoadTile[]>,
  ): { allConnected: boolean; disconnectedPairs?: [RoadTile, RoadTile][] } {
    if (landmarks.length < 2) {
      return { allConnected: true };
    }

    const disconnectedPairs: [RoadTile, RoadTile][] = [];

    // Check all pairs of landmarks
    for (let i = 0; i < landmarks.length; i++) {
      for (let j = i + 1; j < landmarks.length; j++) {
        const result = this.findPath(landmarks[i], landmarks[j], graph);
        if (!result.exists) {
          disconnectedPairs.push([landmarks[i], landmarks[j]]);
        }
      }
    }

    return {
      allConnected: disconnectedPairs.length === 0,
      disconnectedPairs:
        disconnectedPairs.length > 0 ? disconnectedPairs : undefined,
    };
  }

  /**
   * NEW RULE: Check if all landmarks connect to at least one turnpike
   * This is the PRIMARY win condition for City Lines
   */
  public static validateLandmarksConnectToTurnpikes(
    landmarks: RoadTile[],
    turnpikes: RoadTile[],
    graph: Map<RoadTile, RoadTile[]>,
  ): { allConnected: boolean; disconnectedLandmarks?: RoadTile[] } {
    if (landmarks.length === 0) {
      return { allConnected: true };
    }

    if (turnpikes.length === 0) {
      console.warn(
        "⚠️ No turnpikes found! Every level must have at least one turnpike.",
      );
      return { allConnected: false, disconnectedLandmarks: landmarks };
    }

    const disconnectedLandmarks: RoadTile[] = [];

    // For each landmark, check if it can reach ANY turnpike
    for (const landmark of landmarks) {
      let canReachAnyTurnpike = false;

      for (const turnpike of turnpikes) {
        const result = this.findPath(landmark, turnpike, graph);
        if (result.exists) {
          canReachAnyTurnpike = true;
          break; // Found a connection, no need to check other turnpikes
        }
      }

      if (!canReachAnyTurnpike) {
        disconnectedLandmarks.push(landmark);
      }
    }

    return {
      allConnected: disconnectedLandmarks.length === 0,
      disconnectedLandmarks:
        disconnectedLandmarks.length > 0 ? disconnectedLandmarks : undefined,
    };
  }

  /**
   * NEW VALIDATION: Check if all road tiles are part of the landmark-to-turnpike network
   * No "dead-end" or disconnected roads should exist
   */
  public static validateAllTilesConnected(
    allTiles: RoadTile[],
    landmarks: RoadTile[],
    turnpikes: RoadTile[],
    graph: Map<RoadTile, RoadTile[]>,
  ): { allConnected: boolean; disconnectedTiles?: RoadTile[] } {
    const disconnectedTiles: RoadTile[] = [];

    // Create a set of "important" tiles (landmarks + turnpikes)
    const importantTiles = new Set([...landmarks, ...turnpikes]);

    // For each road tile, check if it's either:
    // 1. A landmark/turnpike itself, OR
    // 2. On a path between a landmark and a turnpike
    for (const tile of allTiles) {
      // Skip if it's already a landmark or turnpike
      if (importantTiles.has(tile)) {
        continue;
      }

      // Check if this tile is on ANY path from ANY landmark to ANY turnpike
      let isOnValidPath = false;

      for (const landmark of landmarks) {
        for (const turnpike of turnpikes) {
          const result = this.findPath(landmark, turnpike, graph);
          if (result.exists && result.path) {
            // Check if current tile is in this path
            if (result.path.includes(tile)) {
              isOnValidPath = true;
              break;
            }
          }
        }
        if (isOnValidPath) break;
      }

      if (!isOnValidPath) {
        disconnectedTiles.push(tile);
      }
    }

    return {
      allConnected: disconnectedTiles.length === 0,
      disconnectedTiles:
        disconnectedTiles.length > 0 ? disconnectedTiles : undefined,
    };
  }

  /**
   * Debug: Print connection graph
   */
  public static debugPrintGraph(graph: Map<RoadTile, RoadTile[]>): void {
    console.log("🗺️ Connection Graph:");
    graph.forEach((neighbors, tile) => {
      const pos = tile.gridPos;
      const neighborPos = neighbors
        .map((n) => `(${n.gridPos.row},${n.gridPos.col})`)
        .join(", ");
      console.log(
        `  (${pos.row},${pos.col}) ${tile.roadType} → [${neighborPos}]`,
      );
    });
  }

  /**
   * Debug: Print path
   */
  public static debugPrintPath(result: PathResult): void {
    if (result.exists && result.path) {
      const pathStr = result.path
        .map((tile) => `(${tile.gridPos.row},${tile.gridPos.col})`)
        .join(" → ");
      console.log(`✅ Path found (length ${result.length}): ${pathStr}`);
    } else {
      console.log(`❌ No path found`);
    }
  }
}
