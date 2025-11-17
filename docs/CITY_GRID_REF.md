# City Lines - LLM Reference Documentation

**Last Updated:** 2025-11-17
**Project:** City Lines Puzzle Game
**Architecture:** Direct event-driven (no primitive system overhead)

---

## 🎮 Game Overview

**City Lines** is a puzzle game where players rotate road tiles to connect landmarks (🏛️ diners, ⛽ gas stations) to turnpikes (🚧 highway gates). Think "pipe connection puzzle meets urban planning."

### Win Condition
1. **All landmarks** must connect to **at least one turnpike**
2. **All road tiles** must be part of valid landmark→turnpike paths (no dead-ends)
3. When both conditions are met: confetti celebration + newspaper headline + auto-advance to next level

---

## 📁 Core File Structure

```
src/ludemic/
├── entities/
│   ├── RoadTile.ts          # ✅ Self-contained clickable tile (NO PRIMITIVES)
│   └── CityGrid.ts           # Grid container + path validation
├── grid/
│   └── PathValidator.ts      # Graph-based connection validation
├── generation/
│   ├── LevelGenerator.ts     # Procedural level creation (solution-first)
│   └── InfiniteLevelManager.ts  # Handles levels 1-3 + generated 4+
├── ui/
│   └── HeadlineDisplay.ts    # Typewriter newspaper headlines
├── effects/
│   └── ParticleManager.ts    # Confetti + burst effects
├── AudioManager.ts           # Background music + SFX
└── GameBuilder.ts            # JSON config → running game
```

---

## 🎯 Key Entities

### **1. RoadTile** ([RoadTile.ts](../src/ludemic/entities/RoadTile.ts))

**Purpose:** Individual tile on the grid. Self-contained with direct click handling.

**Key Features:**
- ✅ Click/tap to rotate 90° (if `rotatable: true`)
- ✅ Hover effects (scale up to 1.05x)
- ✅ Sound effects on rotation
- ✅ Particle burst on click
- ✅ Emits `tile_rotated` event for validation

**Properties:**
```typescript
tileType: string              // 'straight', 'corner', 't_junction', 'crossroads'
roadType: RoadType           // 'local_road', 'landmark', 'turnpike', 'house'
rotatable: boolean           // Can player rotate this?
rotationDegrees: number      // Current rotation: 0, 90, 180, 270
gridPos: { row, col }        // Position in grid
landmarkType?: LandmarkType  // 'home', 'diner', 'gas_station', 'market'
```

**Road Type Hierarchy:**
```
House → LocalRoad → Landmark/Turnpike
```

**Connection Rules:**
```typescript
House        → can connect to LocalRoad only
LocalRoad    → can connect to LocalRoad, House, Landmark, Turnpike
Turnpike     → can connect to Landmark, LocalRoad
Landmark     → can connect to Turnpike, LocalRoad
```

**Click Interaction (Direct - No Primitives!):**
```typescript
constructor() {
  // Setup click handling directly in constructor
  this.setupClickInteraction();
}

private setupClickInteraction() {
  this.eventMode = "static";
  this.cursor = this.rotatable ? "pointer" : "default";
  this.on("pointerdown", this.handlePointerDown);
  this.on("pointerover", this.handlePointerOver);
  this.on("pointerout", this.handlePointerOut);
}

private handlePointerDown = (event: FederatedPointerEvent) => {
  if (!this.rotatable) return;

  this.rotate();                              // Rotate 90°
  audioManager.playRotateSound();            // Sound
  ParticleManager.getInstance().createBurst(); // Particles
  this.emit("tile_rotated", eventData);      // Trigger validation

  // Visual feedback
  this.scale.set(0.95, 0.95);
  setTimeout(() => this.scale.set(1, 1), 100);
};
```

**Openings System:**
Each tile type has base openings (before rotation):
```typescript
straight:   [North, South]
corner:     [North, East]
t_junction: [North, East, West]
landmark:   [North, East, South, West]  // All sides
turnpike:   [North, East, South, West]  // All sides
```

Rotation transforms these openings:
```typescript
rotate(): void {
  this.rotationDegrees = (this.rotationDegrees + 90) % 360;
  this.angle = this.rotationDegrees;  // PixiJS rotation
  this.draw();  // Redraw visual
}

getOpenings(): Direction[] {
  const base = BASE_OPENINGS[this.tileType];
  return base.map(dir => this.rotateDirection(dir, this.rotationDegrees));
}
```

---

### **2. CityGrid** ([CityGrid.ts](../src/ludemic/entities/CityGrid.ts))

**Purpose:** Container for all tiles. Manages layout, validation, and celebrations.

**Key Responsibilities:**
1. **Grid Layout** - Positions tiles in responsive grid
2. **Path Validation** - Checks connections on every rotation
3. **Visual Feedback** - Highlights connected roads in real-time
4. **Celebrations** - Triggers confetti + headline on completion

**Architecture:**
```typescript
CityGrid (Container)
├── backgroundGraphics (Graphics)
├── particleContainer (Container)  // Middle layer for particles
└── tiles (RoadTile[])              // Top layer
```

**Core Methods:**

```typescript
addTile(tile: RoadTile, row: number, col: number): void
  // Add tile to grid, listen for rotation events

private handleTileRotated(data: any): void
  // On rotation:
  // 1. Rebuild connection graph
  // 2. Highlight connected roads
  // 3. Validate landmark connections
  // 4. Emit 'path_complete' if puzzle solved

private rebuildConnectionGraph(): void
  // Use PathValidator to build graph from current tile states

private validateLandmarkConnections(): void
  // Check two rules:
  // 1. All landmarks connect to turnpikes
  // 2. All roads are part of valid paths (no dead-ends)
  // If both pass: trigger celebration

private highlightConnectedRoads(): void
  // Real-time visual feedback
  // BFS from turnpikes, highlight all reachable tiles

private celebratePuzzleSolved(): void
  // 1. Play level complete sound
  // 2. Create confetti burst
  // 3. Animate landmarks (scale up sequentially)
  // 4. Emit 'path_complete' event

resize(width: number, height: number): void
  // Responsive layout
  // Calculate tile size based on viewport
  // Reposition all tiles
```

**Event Flow:**
```
User clicks tile
  ↓
RoadTile.handlePointerDown()
  ↓
tile.rotate() → emit("tile_rotated")
  ↓
CityGrid.handleTileRotated()
  ↓
rebuildConnectionGraph() → PathValidator
  ↓
highlightConnectedRoads() → Real-time visual feedback
  ↓
validateLandmarkConnections()
  ↓
If complete: celebratePuzzleSolved() → emit("path_complete")
  ↓
PrimitiveTestScreen → Wait 6s → Load next level
```

---

### **3. PathValidator** ([PathValidator.ts](../src/ludemic/grid/PathValidator.ts))

**Purpose:** Graph-based path validation using BFS/DFS.

**Core Algorithm:**

```typescript
// Build adjacency list from tile grid
buildConnectionGraph(grid: RoadTile[][]): Map<RoadTile, RoadTile[]>
  // For each tile:
  //   Get openings (N, E, S, W)
  //   Check if neighbor has matching opening
  //   Check if road types can connect (hierarchy rules)
  //   If yes: add edge to graph

// Validate Rule 1: All landmarks connect to turnpikes
validateLandmarksConnectToTurnpikes(
  landmarks: RoadTile[],
  turnpikes: RoadTile[],
  graph: Map<RoadTile, RoadTile[]>
): ValidationResult
  // For each landmark:
  //   BFS from landmark
  //   Check if any turnpike is reachable
  //   If not: add to disconnected list

// Validate Rule 2: All tiles are part of valid paths
validateAllTilesConnected(
  allTiles: RoadTile[],
  landmarks: RoadTile[],
  turnpikes: RoadTile[],
  graph: Map<RoadTile, RoadTile[]>
): ValidationResult
  // BFS from turnpikes to find all reachable tiles
  // Compare with all tiles in grid
  // Any unreachable = dead-end road
```

**Connection Logic:**
```typescript
canConnect(tile1: RoadTile, tile2: RoadTile, direction: Direction): boolean
  // 1. Does tile1 have opening in direction?
  // 2. Does tile2 have opening in opposite direction?
  // 3. Do road types allow connection (hierarchy rules)?
  // All three must be true
```

---

## 🎲 Level Generation

### **LevelGenerator** ([LevelGenerator.ts](../src/ludemic/generation/LevelGenerator.ts))

**Solution-First Algorithm:**

```typescript
generate(): GeneratedLevel
  // 1. Place turnpike randomly
  // 2. Place N landmarks (based on difficulty)
  // 3. Generate valid paths from landmarks to turnpike
  // 4. Calculate tile types based on connections
  // 5. Prune orphan roads via BFS from turnpike
  // 6. Validate: no dangling openings
  // 7. Scramble rotations to create puzzle
  // 8. Return level config
```

**Key Insights:**
- Generates **solution first**, then scrambles
- Guarantees every level is solvable
- Uses seeded RNG for reproducible levels
- No crossroads tiles (only straight, corner, t_junction)

**Difficulty Scaling:**
```typescript
easy:   3x3 grid, 2 landmarks
medium: 4x4 grid, 3 landmarks
hard:   5x5 grid, 4+ landmarks
```

---

## 🎨 Visual Systems

### **ParticleManager** ([ParticleManager.ts](../src/ludemic/effects/ParticleManager.ts))

**Singleton pattern:**
```typescript
ParticleManager.initialize(container: Container)  // Call once in CityGrid
ParticleManager.getInstance()                     // Access anywhere

createBurst(x, y, count, options)  // Small burst on tile click
createConfetti(width, height)      // Full-screen celebration
```

### **HeadlineDisplay** ([HeadlineDisplay.ts](../src/ludemic/ui/HeadlineDisplay.ts))

**Typewriter effect:**
```typescript
show(headline: string): void
  // 1. Fade in background modal
  // 2. Typewriter effect (30ms per character)
  // 3. Display for 5 seconds
  // 4. Fade out
```

**Headline Pool:** (cycles through)
```
🏗️ BREAKING: New Road Connection Restores East Side Access
🚦 City Council Approves $2M for Traffic Light Restoration
🏘️ Residents Celebrate as Neighborhood Routes Reconnect
... (10 total headlines in city-lines-level-1.json)
```

---

## 🎵 Audio System

### **AudioManager** ([AudioManager.ts](../src/ludemic/AudioManager.ts))

**Singleton with layered music:**
```typescript
audioManager.playBGMusic(volume)      // Main background loop
audioManager.playBGLayer(volume)      // Secondary layer on top
audioManager.playRotateSound()        // Tile click SFX
audioManager.playLevelCompleteSound() // Win SFX
audioManager.stopBGM()                // Stop all music
```

---

## 📋 JSON Configuration Format

### **Level Config Structure:**

```json
{
  "name": "City Lines - Level 1",
  "description": "Tutorial: Connect two landmarks to the turnpike",
  "viewport": { "width": 800, "height": 600 },

  "headlines": [
    "🏗️ BREAKING: New Road Connection Restores East Side Access",
    "🚦 City Council Approves $2M for Traffic Light Restoration"
  ],

  "entities": [
    {
      "id": "city_grid",
      "type": "CityGrid",
      "position": { "x": 0, "y": 0 },
      "config": {
        "rows": 4,
        "cols": 4,
        "backgroundColor": "0x1a1a2e"
      },
      "uiConfig": {
        "position": { "x": 50, "y": 50 },
        "size": { "width": 60, "height": 60 },
        "tileCount": { "rows": 4, "cols": 4 },
        "padding": { "all": 2 }
      }
    }
  ],

  "ui": [
    {
      "id": "headline_display",
      "type": "HeadlineDisplay",
      "config": {
        "typewriterSpeed": 30,
        "displayDuration": 5
      }
    }
  ],

  "gridTiles": [
    {
      "row": 0, "col": 1,
      "tileType": "landmark",
      "roadType": "landmark",
      "rotation": 180,
      "rotatable": false,
      "landmarkType": "diner"
    },
    {
      "row": 1, "col": 1,
      "tileType": "t_junction",
      "roadType": "local_road",
      "rotation": 270,
      "rotatable": true,
      "solutionRotation": 90
    },
    {
      "row": 3, "col": 2,
      "tileType": "turnpike",
      "roadType": "turnpike",
      "rotation": 0,
      "rotatable": false
    }
  ]
}
```

**Key Config Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `tileType` | string | Visual type: 'straight', 'corner', 't_junction', 'landmark', 'turnpike' |
| `roadType` | RoadType | Connection hierarchy: 'local_road', 'landmark', 'turnpike', 'house' |
| `rotation` | number | Starting rotation (scrambled): 0, 90, 180, 270 |
| `rotatable` | boolean | Can player rotate? (false for landmarks/turnpikes) |
| `solutionRotation` | number | Correct rotation (for validation/hints) |
| `landmarkType` | LandmarkType | Icon type: 'home', 'diner', 'gas_station', 'market' |

---

## 🔧 GameBuilder Flow

**JSON Config → Running Game:**

```typescript
GameBuilder.fromConfig(config: GameConfig): GameContainer
  // 1. Create GameContainer
  // 2. Create entities (CityGrid)
  // 3. Add grid tiles (RoadTile instances)
  //    - NO primitives attached (handled directly)
  // 4. Create UI elements (HeadlineDisplay)
  // 5. Load headlines
  // 6. Perform initial validation
  // 7. Return game ready to play
```

**Important:** RoadTiles **DO NOT use primitives**. Click handling is built-in.

---

## 🎮 Player Controls

### **Keyboard:**
- **Left/Right Arrows** - Navigate between levels
- **R** - Reload current level
- **1-4** - Jump to specific level
- **Mouse/Touch** - Click tiles to rotate

### **Auto-Progression:**
On level complete:
1. Confetti celebration
2. Headline reveal (6 seconds)
3. Auto-advance to next level

---

## 🧪 Testing & Debugging

### **Console Commands:**

```javascript
// Get current grid
const grid = game.getEntityById("city_grid");

// Get all tiles
const tiles = grid.getAllTiles();

// Get landmarks
const landmarks = grid.getLandmarks();

// Manual validation
grid.performInitialValidation();

// Highlight specific path
grid.highlightPath(tiles.slice(0, 5));
```

### **Debug Info:**

All validation logs to console:
```
[CityGrid] 🔄 Tile rotated at (1, 2)
[CityGrid] 🗺️ Connection graph rebuilt
[PathValidator] 🔍 Checking landmark at (0,1)
[PathValidator] ✅ Landmark (0,1) connects to turnpike (3,2)
[CityGrid] ✅ All landmarks connected to turnpikes!
[CityGrid] 🎉 LEVEL COMPLETE!
```

---

## ⚠️ Common Pitfalls

### **1. Don't Use Primitives for RoadTiles**
❌ **WRONG:**
```typescript
tile.addPrimitive("RotateOnClick", new RotateOnClick());
```

✅ **RIGHT:**
```typescript
// RoadTile handles clicks automatically via constructor
const tile = new RoadTile({ config: tileConfig });
```

### **2. Connection Graph Must Be Rebuilt After Every Rotation**
```typescript
handleTileRotated() {
  this.rebuildConnectionGraph();  // ← REQUIRED
  this.validateLandmarkConnections();
}
```

### **3. Road Type Hierarchy Matters**
```typescript
// LocalRoad can connect to Landmark ✅
// House CANNOT connect to Turnpike ❌
// Must respect CONNECTION_RULES
```

### **4. Responsive Layout Uses Percentages**
```typescript
// Don't hardcode pixel values
const tileSize = 80;  // ❌ WRONG

// Use responsive calculation
const tileSize = Math.min(
  gridSize.width / this.config.cols,
  gridSize.height / this.config.rows
);  // ✅ RIGHT
```

---

## 📊 Performance Considerations

- **Grid Size:** 3x3 to 5x5 (tested up to 7x7)
- **Tile Count:** Max ~50 tiles per level
- **Validation:** O(V + E) graph traversal, runs on every rotation
- **Particle System:** Uses object pooling, max 200 particles
- **Audio:** Background music loops, SFX pooled
- **Memory:** ~10MB per level, levels unload on transition

---

## 🚀 Extending the Game

### **Adding New Tile Types:**

1. **Define base openings:**
```typescript
// In RoadTile.ts
const BASE_OPENINGS = {
  my_tile: [Direction.North, Direction.East, Direction.South]
};
```

2. **Add visual rendering:**
```typescript
// In RoadTile.draw()
case 'my_tile':
  this.drawMyTileVisual();
  break;
```

3. **Update connection rules if needed:**
```typescript
// In RoadTile.ts
CONNECTION_RULES[RoadType.MyType] = [RoadType.LocalRoad];
```

### **Adding New Landmarks:**

1. **Add to LandmarkType enum:**
```typescript
export enum LandmarkType {
  Market = "market",
  School = "school"  // NEW
}
```

2. **Add icon:**
```typescript
getLandmarkIcon() {
  case LandmarkType.School:
    return "🏫";
}
```

3. **Add image asset:** `public/assets/images/school.png`

---

## 📚 Related Documentation

- [Phase 5 Summary](./PHASE_5_SUMMARY.md) - Difficulty primitives (for Breakout)
- [Ludemic Implementation Plan](./LUDEMIC_IMPLEMENTATION_PLAN.md) - Overall scaffold architecture
- [UI Config Reference](../src/ludemic/config/ui-config.ts) - Centralized UI percentages

---

## 🎯 Quick Reference: Key Files to Modify

| Task | File | What to Change |
|------|------|----------------|
| **New tile type** | `RoadTile.ts` | Add to BASE_OPENINGS, draw() |
| **New landmark** | `RoadTile.ts` | Add to LandmarkType, getLandmarkIcon() |
| **New level** | `public/config/city-lines-level-X.json` | Copy existing, modify gridTiles |
| **Connection rules** | `RoadTile.ts` | Update CONNECTION_RULES |
| **Win condition** | `CityGrid.ts` | Modify validateLandmarkConnections() |
| **Visual effects** | `ParticleManager.ts` | Add new particle types |
| **Audio** | `AudioManager.ts` | Add new sound effects |
| **UI layout** | `ui-config.ts` | Change percentage values |

---

**End of Reference** 🏁
