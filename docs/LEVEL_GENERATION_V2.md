# CITY LINES – LEVEL GENERATION V2 SPEC

## 1. Overview

This document describes a cleaner, more maintainable level generation algorithm for City Lines that separates concerns into distinct phases:

1. **Placement Phase** - Where are the endpoints?
2. **Selection Phase** - Which tiles become roads?
3. **Connection Phase** - How do tiles connect?
4. **Assignment Phase** - What type is each tile?
5. **Scramble Phase** - Create the puzzle state

**Key Improvement:** No orphan road pruning needed. Only selected tiles become roads.

---

## 2. Core Principles

### 2.1 Single Turnpike Rule

- **Always exactly one turnpike per level** - never more, never less
- Turnpike is the single endpoint for all paths
- All landmarks must connect to this one turnpike

### 2.2 Selection-First Approach

```
OLD: Generate paths → Place tiles → Prune orphans → Validate
NEW: Select tiles → Connect endpoints → Assign types → Scramble
```

**Benefits:**
- No orphan roads by design
- Clearer separation of concerns
- Simpler validation
- Natural difficulty scaling

### 2.3 No Diagonal Movement

All paths follow grid adjacency (N, E, S, W only).

---

## 3. Generation Pipeline

### Phase 1: Place Turnpike

**Input:** Difficulty level (`easy` | `medium` | `hard`)

**Algorithm:**

```typescript
placeTurnpike(gridSize, difficulty): TurnpikePosition {
  switch (difficulty) {
    case 'easy':
      // Place near center region
      return randomPositionInRegion(center, radius: gridSize / 4)

    case 'medium':
      // Place on random edge (not corner)
      edge = randomChoice(['top', 'bottom', 'left', 'right'])
      return randomEdgePosition(edge, excludeCorners: true)

    case 'hard':
      // Place in corner or near-corner
      return randomCornerPosition(gridSize)
  }
}
```

**Output:** `{ row, col }` position for turnpike

**Tile Properties:**
```typescript
{
  tileType: "turnpike",
  roadType: RoadType.Turnpike,
  rotatable: false,
  rotation: 0  // Turnpike treated as open on all 4 sides
}
```

---

### Phase 2: Place Landmarks

**Input:**
- Grid size
- Landmark count (based on difficulty)
- Turnpike position

**Constraints:**
- Minimum Manhattan distance from turnpike (e.g., ≥ 3 tiles)
- Minimum spacing between landmarks (e.g., ≥ 2 tiles apart)
- Optional: Distribute across quadrants to avoid clustering

**Algorithm:**

```typescript
placeLandmarks(
  gridSize,
  landmarkCount,
  turnpikePos
): LandmarkPosition[] {
  landmarks = []
  landmarkTypes = ['diner', 'gas_station', 'market']  // Cycle through

  for (i = 0; i < landmarkCount; i++) {
    attempts = 0

    while (attempts < MAX_ATTEMPTS) {
      candidate = randomGridPosition(gridSize)

      // Check constraints
      if (manhattanDistance(candidate, turnpikePos) < MIN_DISTANCE) {
        continue
      }

      if (any(landmark in landmarks:
              manhattanDistance(candidate, landmark) < MIN_SPACING)) {
        continue
      }

      // Valid position
      landmarks.push({
        position: candidate,
        landmarkType: landmarkTypes[i % landmarkTypes.length]
      })
      break
    }

    if (attempts >= MAX_ATTEMPTS) {
      throw Error("Could not place landmark - retry with new seed")
    }
  }

  return landmarks
}
```

**Output:** Array of landmark positions with types

**Tile Properties (temporary - rotation calculated later):**
```typescript
{
  tileType: "landmark",
  roadType: RoadType.Landmark,
  rotatable: false,
  landmarkType: LandmarkType,
  rotation: 0  // Will be calculated in Phase 4
}
```

---

### Phase 3: Select Road Tiles (Path Generation)

**Input:**
- Landmarks
- Turnpike
- Min path length (difficulty-based)
- Grid bounds

**Algorithm:** Constrained random walk for each landmark

```typescript
selectRoadTiles(
  landmarks,
  turnpike,
  minPathLength,
  gridSize
): Set<TilePosition> {
  selectedTiles = new Set()
  solutionPaths = []  // Store for validation

  for (landmark of landmarks) {
    path = generatePath(landmark, turnpike, minPathLength, selectedTiles)

    // Add all path tiles to selected set
    for (tile of path) {
      selectedTiles.add(tile)
    }

    solutionPaths.push(path)
  }

  return { selectedTiles, solutionPaths }
}
```

**Path Generation (Random Walk):**

```typescript
generatePath(
  start,
  target,
  minLength,
  existingTiles
): TilePosition[] {
  path = [start]
  current = start
  visited = new Set([start])

  while (true) {
    // Get valid neighbors (grid bounds, not diagonal)
    neighbors = getCardinalNeighbors(current, gridSize)

    // Filter candidates
    candidates = neighbors.filter(n => {
      // Can't revisit in same path
      if (visited.has(n)) return false

      // Check if would create crossroads (4 neighbors)
      if (wouldCreateCrossroads(n, selectedTiles + path)) return false

      // Check if would create illegal dead-end road
      // (Only landmarks/turnpike can be degree 1)
      if (wouldCreateDeadEnd(n, selectedTiles + path)) return false

      return true
    })

    if (candidates.length === 0) {
      throw Error("Path generation stuck - retry with new seed")
    }

    // Check if adjacent to turnpike and min length satisfied
    if (isAdjacentTo(current, target) && path.length >= minLength) {
      // Path complete!
      return path
    }

    // Choose next step (bias toward target but allow detours)
    if (random() < DETOUR_PROBABILITY) {
      next = randomChoice(candidates)
    } else {
      next = closestToTarget(candidates, target)
    }

    path.push(next)
    visited.add(next)
    current = next

    // Safety check
    if (path.length > MAX_PATH_LENGTH) {
      throw Error("Path too long - retry with new seed")
    }
  }
}
```

**Crossroads Prevention:**

```typescript
wouldCreateCrossroads(
  candidate,
  existingRoads
): boolean {
  neighbors = getCardinalNeighbors(candidate)

  // Count how many neighbors are roads
  roadNeighborCount = neighbors.filter(n =>
    existingRoads.has(n) || isLandmark(n) || isTurnpike(n)
  ).length

  // Would this create 4 connections? (forbidden)
  return roadNeighborCount >= 4
}
```

**Dead-End Prevention:**

```typescript
wouldCreateDeadEnd(
  candidate,
  existingRoads
): boolean {
  neighbors = getCardinalNeighbors(candidate)

  roadNeighbors = neighbors.filter(n => existingRoads.has(n))

  // If this would be a dead-end road (only 1 connection)
  // and it's not a landmark/turnpike, reject it
  if (roadNeighbors.length === 1) {
    return !isEndpoint(candidate)  // Only endpoints can be degree 1
  }

  return false
}
```

**Output:**
- `selectedTiles`: Set of grid positions that will have road tiles
- `solutionPaths`: Array of paths (for validation later)

---

### Phase 4: Assign Tile Types and Rotations (Solution State)

**Input:**
- Selected road tiles
- Landmark positions
- Turnpike position

**Algorithm:**

```typescript
assignTileTypes(
  selectedTiles,
  landmarks,
  turnpike
): TileConfiguration[] {
  tiles = []

  // Process each selected road tile
  for (tilePos of selectedTiles) {
    // Get connected neighbors (tiles that should connect)
    connectedDirs = getConnectedDirections(tilePos, selectedTiles)

    // Assign tile type based on connection count
    const neighborCount = connectedDirs.length

    let tileType: string

    if (neighborCount === 2) {
      // Two connections: straight or corner
      tileType = areOppositeDirections(connectedDirs)
        ? 'straight'
        : 'corner'
    }
    else if (neighborCount === 3) {
      // Three connections: t_junction
      tileType = 't_junction'
    }
    else if (neighborCount === 1) {
      // Should only happen at endpoints (landmark/turnpike adjacent)
      throw Error("Dead-end road detected - should not happen")
    }
    else if (neighborCount === 4) {
      // Forbidden crossroads
      throw Error("Crossroads detected - should not happen")
    }

    // Calculate rotation to match connections
    const rotation = calculateRotationForConnections(tileType, connectedDirs)

    tiles.push({
      position: tilePos,
      tileType: tileType,
      roadType: RoadType.LocalRoad,
      rotation: rotation,
      rotatable: true
    })
  }

  // Orient landmarks to face their first road tile
  for (landmark of landmarks) {
    const adjacentRoad = getAdjacentRoadTile(landmark, selectedTiles)
    const direction = getDirection(landmark, adjacentRoad)

    // Landmark base opening is South - rotate to face road
    landmark.rotation = calculateLandmarkRotation(Direction.South, direction)
  }

  return tiles
}
```

**Connection Detection:**

```typescript
getConnectedDirections(
  tilePos,
  selectedTiles
): Direction[] {
  const directions = []
  const neighbors = {
    North: { row: tilePos.row - 1, col: tilePos.col },
    South: { row: tilePos.row + 1, col: tilePos.col },
    East:  { row: tilePos.row, col: tilePos.col + 1 },
    West:  { row: tilePos.row, col: tilePos.col - 1 }
  }

  for (const [dir, pos] of Object.entries(neighbors)) {
    if (selectedTiles.has(pos) ||
        isLandmark(pos) ||
        isTurnpike(pos)) {
      directions.push(Direction[dir])
    }
  }

  return directions
}
```

**Rotation Calculation:**

```typescript
calculateRotationForConnections(
  tileType,
  connectedDirs
): number {
  // Base openings for each tile type
  const baseOpenings = {
    straight:   [Direction.North, Direction.South],
    corner:     [Direction.North, Direction.East],
    t_junction: [Direction.North, Direction.East, Direction.West]
  }

  const base = baseOpenings[tileType]

  // Find rotation that makes base openings match connectedDirs
  for (let rotation of [0, 90, 180, 270]) {
    const rotatedOpenings = rotateDirections(base, rotation)

    if (directionsMatch(rotatedOpenings, connectedDirs)) {
      return rotation
    }
  }

  throw Error("Could not find matching rotation")
}
```

**Landmark Rotation:**

```typescript
calculateLandmarkRotation(
  baseOpening: Direction,  // South for landmarks
  targetDirection: Direction
): number {
  // Rotation needed to point baseOpening toward targetDirection
  const rotationMap = {
    [Direction.South]: 0,
    [Direction.West]: 90,
    [Direction.North]: 180,
    [Direction.East]: 270
  }

  return rotationMap[targetDirection]
}
```

**Output:** Complete tile configuration with solution rotations

---

### Phase 5: Scramble Rotations (Create Puzzle)

**Input:** Tiles with solution rotations

**Algorithm:**

```typescript
scrambleRotations(tiles, rng): ScrambledTiles[] {
  return tiles.map(tile => {
    if (!tile.rotatable) {
      // Landmarks and turnpike keep their rotation
      return {
        ...tile,
        scrambledRotation: tile.rotation,
        solutionRotation: tile.rotation
      }
    }

    // Rotatable tiles get random starting rotation
    const scrambledRotation = rng.choice([0, 90, 180, 270])

    return {
      ...tile,
      rotation: scrambledRotation,  // Starting state for player
      solutionRotation: tile.rotation,  // Correct rotation
      scrambledRotation: scrambledRotation
    }
  })
}
```

**Output:** Final level configuration ready for game

---

## 4. Validation

After generation, validate the level before returning. Validation happens in **Phase 3** (after tile assignment, before scrambling).

### 4.1 Crossroads Detection (validateNoFourWayIntersections)

**Purpose:** Detect if any tile requires 4+ connections, which would need a crossroad tile (not available in the game).

**When Called:** After Phase 3 (tile type assignment), before Phase 4 (scrambling).

**Algorithm:**

```typescript
validateNoFourWayIntersections(): void {
  // Build connection map from solution paths
  const pathConnections = new Map<string, Set<string>>()

  // For each path, record all tile-to-tile connections
  for (const path of solutionPaths) {
    const landmark = landmarks[pathIndex]

    // Landmark → first tile connection
    if (path.length > 0) {
      addBidirectionalConnection(pathConnections, landmark, path[0])
    }

    // Tile → tile connections along path
    for (i = 0; i < path.length - 1; i++) {
      addBidirectionalConnection(pathConnections, path[i], path[i + 1])
    }

    // Last tile → turnpike connection
    if (path.length > 0) {
      addBidirectionalConnection(pathConnections, path[path.length - 1], turnpike)
    }
  }

  // Check each tile's connection count
  for (const [tilePos, connections] of pathConnections.entries()) {
    if (connections.size >= 4) {
      // This tile needs 4+ openings (crossroad) - INVALID!
      throw Error(
        `Tile at ${tilePos} requires ${connections.size} connections ` +
        `(4-way crossroad), but max tile type is T-junction (3 connections)`
      )
    }
  }
}
```

**Why This Matters:**

- The game only has 3 tile types: **straight** (2 openings), **corner** (2 openings), **T-junction** (3 openings)
- If paths converge to create a 4-way intersection, the level is **unsolvable**
- This validation catches these cases and triggers seed retry

**Error Triggering:**

When this validation throws an error:
1. The error is caught by `LevelGenerator.generate()` retry loop
2. The bad seed is marked in `badSeeds` Set
3. Next seed (baseSeed + 1) is tried
4. Up to 10 attempts before giving up

---

### 4.2 Full Level Validation (Optional - Not Currently Used)

The following validation checks are available but **not currently enabled** in the implementation. They can be added if needed:

```typescript
validateLevel(tiles, landmarks, turnpike): boolean {
  // 1. No crossroads (4 neighbors) - HANDLED by validateNoFourWayIntersections
  for (tile of tiles) {
    const neighbors = getConnectedNeighbors(tile, tiles)
    if (neighbors.length > 3) {
      throw Error("Crossroads detected at " + tile.position)
    }
  }

  // 2. No dead-end roads (only landmarks/turnpike can be degree 1)
  for (tile of tiles where tile.rotatable) {
    const neighbors = getConnectedNeighbors(tile, tiles)
    if (neighbors.length < 2) {
      throw Error("Dead-end road at " + tile.position)
    }
  }

  // 3. All landmarks reach turnpike (BFS validation)
  for (landmark of landmarks) {
    if (!canReachTurnpike(landmark, turnpike, tiles)) {
      throw Error("Landmark at " + landmark.position + " cannot reach turnpike")
    }
  }

  // 4. No dangling openings on road tiles
  for (tile of tiles where tile.rotatable) {
    const openings = getTileOpenings(tile)

    for (opening of openings) {
      const neighborPos = getNeighborPosition(tile.position, opening)
      const neighbor = getTileAt(neighborPos, tiles)

      if (!neighbor) {
        throw Error("Dangling opening at " + tile.position)
      }

      const oppositeDir = getOppositeDirection(opening)
      const neighborOpenings = getTileOpenings(neighbor)

      if (!neighborOpenings.includes(oppositeDir)) {
        throw Error("Mismatched opening at " + tile.position)
      }
    }
  }

  return true
}
```

**BFS Validation:**

```typescript
canReachTurnpike(
  landmark,
  turnpike,
  tiles
): boolean {
  const queue = [landmark]
  const visited = new Set([landmark])

  while (queue.length > 0) {
    const current = queue.shift()

    if (current === turnpike) {
      return true  // Path found!
    }

    // Get connected neighbors using tile openings
    const neighbors = getConnectedNeighborsViaOpenings(current, tiles)

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push(neighbor)
      }
    }
  }

  return false  // No path to turnpike
}
```

---

## 5. Difficulty Scaling

### 5.1 Grid Size

```typescript
easy:   3x3 or 4x4
medium: 4x4 or 5x5
hard:   5x5 or 6x6
```

### 5.2 Landmark Count

```typescript
easy:   2 landmarks
medium: 3 landmarks
hard:   4+ landmarks
```

### 5.3 Path Complexity

```typescript
easy: {
  minPathLength: 3,
  DETOUR_PROBABILITY: 0.1  // Mostly straight paths
}

medium: {
  minPathLength: 5,
  DETOUR_PROBABILITY: 0.3  // Some winding
}

hard: {
  minPathLength: 7,
  DETOUR_PROBABILITY: 0.5  // Very winding paths
}
```

### 5.4 Turnpike Placement

```typescript
easy:   Center region (easy to reach)
medium: Edge (moderate challenge)
hard:   Corner (maximum path length required)
```

---

## 6. Integration with InfiniteLevelManager

**InfiniteLevelManager** handles levels 1-3 (hand-authored JSON) and 4+ (procedural):

```typescript
class InfiniteLevelManager {
  generateLevel(levelNumber: number): GameConfig {
    if (levelNumber <= 3) {
      // Load hand-authored levels
      return loadLevelJSON(`city-lines-level-${levelNumber}.json`)
    }

    // Procedural generation for level 4+
    const seed = this.calculateSeed(levelNumber)
    const params = this.getDifficultyParams(levelNumber)

    const MAX_ATTEMPTS = 10

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const attemptSeed = seed + attempt
        const level = LevelGenerator.generate(params, attemptSeed)

        return this.convertToGameConfig(level)
      } catch (error) {
        console.warn(`Level ${levelNumber} generation attempt ${attempt + 1} failed:`, error)
      }
    }

    // Fallback to safe template level
    console.error(`Failed to generate level ${levelNumber} after ${MAX_ATTEMPTS} attempts`)
    return this.getFallbackLevel()
  }

  getDifficultyParams(levelNumber: number): DifficultyParams {
    // Wave pattern: easy → medium → hard → repeat
    const cycle = (levelNumber - 4) % 9

    if (cycle < 3) {
      return {
        gridSize: 4,
        landmarkCount: 2,
        difficulty: 'easy',
        minPathLength: 3
      }
    } else if (cycle < 6) {
      return {
        gridSize: 5,
        landmarkCount: 3,
        difficulty: 'medium',
        minPathLength: 5
      }
    } else {
      return {
        gridSize: 6,
        landmarkCount: 4,
        difficulty: 'hard',
        minPathLength: 7
      }
    }
  }

  calculateSeed(levelNumber: number): number {
    // Deterministic seed based on level number
    return BASE_SEED * levelNumber + SALT
  }
}
```

---

## 7. RNG and Determinism

**Use seeded XORshift32 RNG:**

```typescript
class XORShift32 {
  private state: number

  constructor(seed: number) {
    this.state = seed
  }

  next(): number {
    let x = this.state
    x ^= x << 13
    x ^= x >> 17
    x ^= x << 5
    this.state = x
    return (x >>> 0) / 4294967296  // Normalize to [0, 1)
  }

  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)]
  }
}
```

**Deterministic Level Generation:**

```typescript
const rng = new XORShift32(seed)
const level = LevelGenerator.generate(params, rng)
```

Same seed → same level (every time)

---

## 8. Output Format

**Generated Level Structure:**

```typescript
interface GeneratedLevel {
  gridSize: { rows: number; cols: number }
  turnpike: TileConfig
  landmarks: LandmarkConfig[]
  roadTiles: RoadTileConfig[]
  solutionPaths: TilePosition[][]  // For debugging
}

interface TileConfig {
  row: number
  col: number
  tileType: string  // 'straight', 'corner', 't_junction', 'landmark', 'turnpike'
  roadType: RoadType
  rotation: number  // Scrambled (starting state)
  solutionRotation: number  // Correct rotation
  rotatable: boolean
  landmarkType?: LandmarkType
}
```

**Conversion to GameConfig:**

```typescript
convertToGameConfig(level: GeneratedLevel): GameConfig {
  return {
    name: `City Lines - Level ${levelNumber}`,
    description: `Procedurally generated ${difficulty} level`,
    viewport: { width: 800, height: 600 },
    headlines: getRandomHeadlines(),
    entities: [
      {
        id: "city_grid",
        type: "CityGrid",
        config: {
          rows: level.gridSize.rows,
          cols: level.gridSize.cols,
          backgroundColor: "0x1a1a2e"
        },
        uiConfig: { /* responsive layout */ }
      }
    ],
    gridTiles: [
      level.turnpike,
      ...level.landmarks,
      ...level.roadTiles
    ].map(tile => ({
      row: tile.row,
      col: tile.col,
      tileType: tile.tileType,
      roadType: tile.roadType,
      rotation: tile.rotation,  // Starting scrambled state
      solutionRotation: tile.solutionRotation,
      rotatable: tile.rotatable,
      landmarkType: tile.landmarkType
    }))
  }
}
```

---

## 9. Advantages of V2 Algorithm

### Compared to V1:

| Aspect | V1 (Old) | V2 (New) |
|--------|----------|----------|
| **Orphan Roads** | Must prune after generation | None by design |
| **Validation Complexity** | "Use paths NOT BFS" warning | Simple BFS validation |
| **Rotation Timing** | Calculated before pruning | Calculated after selection |
| **Path Storage** | Needed for pruning | Only for debugging |
| **Crossroads Prevention** | Validated after | Prevented during |
| **Dead-End Prevention** | Pruned after | Prevented during |
| **Phases** | Generate → Prune → Validate | Select → Assign → Validate |

### Code Maintainability:

✅ Clear phase separation
✅ Each phase has single responsibility
✅ Easier to debug (know which phase failed)
✅ Easier to tune (tweak one phase without affecting others)
✅ No "fix pruning to match BFS" issues

---

## 10. Implementation Checklist

### Phase 1: Core Structure
- [ ] Create `LevelGeneratorV2.ts` class
- [ ] Implement XORShift32 RNG
- [ ] Implement `placeTurnpike()`
- [ ] Implement `placeLandmarks()`

### Phase 2: Path Generation
- [ ] Implement `selectRoadTiles()`
- [ ] Implement `generatePath()` with random walk
- [ ] Implement `wouldCreateCrossroads()`
- [ ] Implement `wouldCreateDeadEnd()`

### Phase 3: Tile Assignment
- [ ] Implement `assignTileTypes()`
- [ ] Implement `getConnectedDirections()`
- [ ] Implement `calculateRotationForConnections()`
- [ ] Implement `calculateLandmarkRotation()`

### Phase 4: Scrambling
- [ ] Implement `scrambleRotations()`

### Phase 5: Validation
- [ ] Implement `validateLevel()`
- [ ] Implement `canReachTurnpike()` BFS
- [ ] Implement dangling opening checks

### Phase 6: Integration
- [ ] Update `InfiniteLevelManager` to use V2
- [ ] Test with levels 4-20
- [ ] Verify deterministic generation (same seed = same level)
- [ ] Add fallback level for generation failures

### Phase 7: Testing
- [ ] Unit tests for each phase
- [ ] Visual debugging (render solution paths)
- [ ] Difficulty scaling validation
- [ ] Stress test (100+ levels)

---

## 11. Debugging & Visualization

### Solution Path Rendering

```typescript
// Optional: Render solution paths for debugging
renderSolutionPaths(solutionPaths) {
  for (path of solutionPaths) {
    for (i = 0; i < path.length - 1; i++) {
      drawLine(path[i], path[i + 1], color: GREEN)
    }
  }
}
```

### Generation Stats

```typescript
interface GenerationStats {
  attempts: number
  gridSize: { rows: number; cols: number }
  landmarkCount: number
  roadTileCount: number
  averagePathLength: number
  longestPath: number
  generationTime: number  // milliseconds
}
```

---

## 12. Future Enhancements

### Post-V2 Improvements:

1. **Path Merging** - Allow paths to share road tiles for efficiency
2. **Obstacle Tiles** - Place non-road obstacles that paths must avoid
3. **Multiple Turnpikes** - (Violates single turnpike rule, but interesting variant)
4. **Hand-Crafted Constraints** - "Must use this specific tile arrangement"
5. **Thematic Levels** - "Highway expansion" (more straight roads) vs "City maze" (more corners)

---

**End of Level Generation V2 Specification** 🏁
