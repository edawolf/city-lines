# Game Lifecycle Implementation

## Overview

Complete game lifecycle management system for Ludemic Engine, adding health, lives, level progression, game over/complete screens, and high score tracking.

## Implementation Date

October 2025

## New Primitives

### 1. HealthSystem (LISA: STATE + MANAGE)

**File**: `src/ludemic/primitives/gameplay/HealthSystem.ts`

Tracks player health/lives and emits events on damage and death.

**Configuration**:
```json
{
  "type": "HealthSystem",
  "config": {
    "maxHealth": 3,
    "startingHealth": 3,
    "damageEvent": "player_hit",
    "deathEvent": "player_died"
  }
}
```

**Key Features**:
- Track current/max health
- Emit `health_changed` event with delta
- Emit `player_died` event when health reaches 0
- Reset method for game restart
- Integrates with HealthDisplay UI

**LISA Mapping**:
- **STATE**: Track health state over time
- **MANAGE**: Control health changes and death conditions

---

### 2. BoundaryTrigger (LISA: DETECT + TRIGGER)

**File**: `src/ludemic/primitives/gameplay/BoundaryTrigger.ts`

Detects when entity crosses a boundary and triggers events.

**Configuration**:
```json
{
  "type": "BoundaryTrigger",
  "config": {
    "boundary": "bottom",
    "threshold": 600,
    "triggerEvent": "ball_out_of_bounds",
    "resetPosition": { "x": 400, "y": 500 },
    "continuous": false
  }
}
```

**Key Features**:
- Monitor entity position relative to boundaries
- Trigger once or continuously
- Optional entity reset position
- Supports top/bottom/left/right boundaries

**LISA Mapping**:
- **DETECT**: Monitor entity position
- **TRIGGER**: Emit event when boundary crossed

**Use Cases**:
- Ball falling off screen (lose life)
- Enemy escaping screen (lose points)
- Player reaching finish line (win condition)

---

### 3. LevelManager (LISA: MANAGE + PROGRESS)

**File**: `src/ludemic/primitives/gameplay/LevelManager.ts`

Manages level progression and block tracking.

**Configuration**:
```json
{
  "type": "LevelManager",
  "config": {
    "blockEntityType": "Block",
    "levelCompleteEvent": "level_complete",
    "blockDestroyedEvent": "block_destroyed",
    "startLevel": 1
  }
}
```

**Key Features**:
- Track blocks cleared per level
- Detect level completion (all blocks cleared)
- Emit level complete event with stats
- Auto-increment level counter
- Reset method for game restart

**LISA Mapping**:
- **MANAGE**: Track game state and progression
- **PROGRESS**: Advance through levels

---

## New UI Components

### 1. HealthDisplay

**File**: `src/ludemic/ui/HealthDisplay.ts`

Displays player lives as hearts.

**Features**:
- Renders hearts (filled = alive, outline = lost)
- Auto-updates on `health_changed` event
- Animate heart loss with pulse effect
- Reset method

**Visual Design**:
- Red filled hearts for remaining lives
- Gray outline hearts for lost lives
- Heart drawn with bezier curves
- Label: "Lives:"

---

### 2. GameOverScreen

**File**: `src/ludemic/ui/GameOverScreen.ts`

Full-screen overlay shown on game over.

**Features**:
- Semi-transparent dark background
- Display final score
- Display level reached
- Display high score (gold if new high score)
- Instruction: "Press SPACE to restart"
- Pulsing title animation

**Visual Design**:
- Title: "GAME OVER" (red, pulsing)
- Final score (white)
- Level reached (white)
- High score (yellow/gold)
- Instructions (gray)

---

### 3. LevelCompleteScreen

**File**: `src/ludemic/ui/LevelCompleteScreen.ts`

Overlay shown when level is complete.

**Features**:
- Semi-transparent dark background
- Display level completed
- Display current score
- Congratulations message
- Auto-hides after 2 seconds
- Pulsing title animation

**Visual Design**:
- Title: "Level X Complete!" (green, pulsing)
- Current score (white)
- Congratulations text (yellow)

---

## GameContainer Enhancements

**File**: `src/ludemic/GameBuilder.ts`

### New Properties

```typescript
private healthDisplay?: HealthDisplay;
private gameOverScreen?: GameOverScreen;
private levelCompleteScreen?: LevelCompleteScreen;
private currentLevel = 1;
private highScore = 0;
private gameState: "playing" | "paused" | "game_over" | "level_complete";
private gameConfig?: GameConfig;
```

### New Methods

#### `initializeLifecycle(config, width, height)`
Initialize game lifecycle systems and event listeners:
- Wire `ball_out_of_bounds` → `player_hit`
- Listen for `player_died` → show game over
- Listen for `level_complete` → show level complete screen

#### `handleGameOver(width, height)`
- Update game state
- Save high score if beaten
- Show game over screen

#### `handleLevelComplete(level, width, height)`
- Update game state
- Increment level counter
- Show level complete screen
- Schedule level regeneration (2.5s delay)

#### `regenerateLevel()`
- Remove all blocks
- Regenerate blocks from layout config
- Reset ball position and velocity
- Resume playing state

#### `restart(width, height)`
- Hide overlays
- Reset score, level, multiplier
- Reset health system
- Reset level manager
- Regenerate level
- Resume playing

#### High Score Methods
- `loadHighScore()`: Load from localStorage
- `saveHighScore()`: Save to localStorage
- `getHighScore()`: Get current high score
- `getLevel()`: Get current level
- `getGameState()`: Get game state

### UI Integration

```typescript
setHealthDisplay(display: HealthDisplay)
setGameOverScreen(screen: GameOverScreen)
setLevelCompleteScreen(screen: LevelCompleteScreen)
```

Auto-wires event listeners to update UI components.

---

## PrimitiveFactory Updates

**File**: `src/ludemic/primitives/PrimitiveFactory.ts`

Registered new gameplay primitives:
```typescript
PrimitiveFactory.register("HealthSystem", HealthSystem);
PrimitiveFactory.register("BoundaryTrigger", BoundaryTrigger);
PrimitiveFactory.register("LevelManager", LevelManager);
```

---

## GameBuilder Updates

**File**: `src/ludemic/GameBuilder.ts`

### UI Factory Enhancements

Added support for new UI components:
```typescript
case "HealthDisplay":
  uiElement = new HealthDisplay();
  break;
case "GameOverScreen":
  uiElement = new GameOverScreen();
  break;
case "LevelCompleteScreen":
  uiElement = new LevelCompleteScreen();
  break;
```

### UI Connection Logic

Auto-connects UI components to GameContainer:
```typescript
if (uiConfig.type === "HealthDisplay") {
  game.setHealthDisplay(uiElement as HealthDisplay);
} else if (uiConfig.type === "GameOverScreen") {
  game.setGameOverScreen(uiElement as GameOverScreen);
} else if (uiConfig.type === "LevelCompleteScreen") {
  game.setLevelCompleteScreen(uiElement as LevelCompleteScreen);
}
```

---

## Complete Game Configuration

**File**: `public/config/breakout-complete.json`

### Entity Configuration

#### Paddle
```json
{
  "id": "paddle",
  "type": "Paddle",
  "entityType": "Paddle",
  "position": { "x": 350, "y": 550 },
  "config": {
    "width": 100,
    "height": 20,
    "color": 4830800
  },
  "primitives": [
    { "type": "InputMovement", "config": {...} }
  ]
}
```

#### Ball
```json
{
  "id": "ball",
  "type": "Ball",
  "entityType": "Ball",
  "position": { "x": 400, "y": 500 },
  "config": {
    "radius": 10,
    "color": 16777215
  },
  "primitives": [
    { "type": "LinearMovement", "config": {...} },
    { "type": "BounceCollision", "config": {...} },
    { "type": "BoundaryTrigger", "config": {
      "boundary": "bottom",
      "threshold": 600,
      "triggerEvent": "ball_out_of_bounds",
      "resetPosition": { "x": 400, "y": 500 }
    }},
    { "type": "SoundTrigger", "config": {...} }
  ]
}
```

#### Game Manager
```json
{
  "id": "gameManager",
  "type": "GameManager",
  "entityType": "GameManager",
  "position": { "x": 0, "y": 0 },
  "primitives": [
    { "type": "ScreenShake", "config": {...} },
    { "type": "ParticleEmitter", "config": {...} },
    { "type": "SpeedScaling", "config": {...} },
    { "type": "ComboMultiplier", "config": {...} },
    { "type": "HealthSystem", "config": {
      "maxHealth": 3,
      "startingHealth": 3,
      "damageEvent": "player_hit",
      "deathEvent": "player_died"
    }},
    { "type": "LevelManager", "config": {
      "blockEntityType": "Block",
      "levelCompleteEvent": "level_complete",
      "blockDestroyedEvent": "block_destroyed",
      "startLevel": 1
    }}
  ]
}
```

### UI Configuration

```json
"ui": [
  { "type": "ScoreDisplay", "position": { "x": 20, "y": 20 } },
  { "type": "ComboDisplay", "position": { "x": 650, "y": 20 } },
  { "type": "HealthDisplay", "position": { "x": 350, "y": 20 } },
  { "type": "GameOverScreen" },
  { "type": "LevelCompleteScreen" }
]
```

---

## PrimitiveTestScreen Updates

**File**: `src/app/screens/PrimitiveTestScreen.ts`

### Configuration Loading

Changed config from `breakout-difficulty.json` to `breakout-complete.json`.

### Lifecycle Initialization

```typescript
this.game.initializeLifecycle(
  await (await fetch("config/breakout-complete.json")).json(),
  this.screenWidth,
  this.screenHeight
);
```

### Keyboard Controls

Added Space key listener for restart:
```typescript
this.keydownListener = (e: KeyboardEvent) => {
  if (e.code === "Space" && this.game.getGameState() === "game_over") {
    this.game.restart(this.screenWidth, this.screenHeight);
  }
};
window.addEventListener("keydown", this.keydownListener);
```

Cleanup on hide:
```typescript
async hide(): Promise<void> {
  if (this.keydownListener) {
    window.removeEventListener("keydown", this.keydownListener);
  }
}
```

### Instructions Update

Updated instructions to include:
- Space key for restart
- Health system (3 lives)
- Boundary trigger (lose life on ball out)
- Level progression
- High score tracking

---

## Event Flow

### Ball Out of Bounds Flow

```
1. Ball crosses bottom boundary
   ↓
2. BoundaryTrigger emits "ball_out_of_bounds"
   ↓
3. GameContainer listener emits "player_hit" (damage: 1)
   ↓
4. HealthSystem receives damage
   ↓
5. HealthSystem emits "health_changed" (current: 2, max: 3, delta: 1)
   ↓
6. HealthDisplay updates hearts (2 filled, 1 outline)
   ↓
7. Ball resets to position (400, 500)
```

### Player Death Flow

```
1. Health reaches 0
   ↓
2. HealthSystem emits "player_died"
   ↓
3. GameContainer.handleGameOver() called
   ↓
4. Check/update high score
   ↓
5. Save high score to localStorage
   ↓
6. GameOverScreen.show() with score, level, high score
   ↓
7. Game state = "game_over"
   ↓
8. Player presses Space
   ↓
9. GameContainer.restart() called
   ↓
10. Reset all systems and regenerate level
```

### Level Complete Flow

```
1. Last block destroyed
   ↓
2. LevelManager detects 0 blocks remaining
   ↓
3. LevelManager emits "level_complete" (level, blocksCleared)
   ↓
4. GameContainer.handleLevelComplete() called
   ↓
5. Increment level counter
   ↓
6. LevelCompleteScreen.show() with level, score
   ↓
7. Game state = "level_complete"
   ↓
8. Wait 2.5 seconds
   ↓
9. GameContainer.regenerateLevel() called
   ↓
10. Remove all blocks
   ↓
11. Regenerate blocks from layout
   ↓
12. Reset ball position/velocity
   ↓
13. Game state = "playing"
```

---

## High Score System

### Storage

Uses browser localStorage with key: `"ludemic_high_score"`

### Loading

On game initialization:
```typescript
const saved = localStorage.getItem("ludemic_high_score");
if (saved) {
  this.highScore = parseInt(saved, 10);
}
```

### Saving

On game over (if new high score):
```typescript
if (this.score > this.highScore) {
  this.highScore = this.score;
  localStorage.setItem("ludemic_high_score", this.highScore.toString());
}
```

### Display

GameOverScreen shows:
- Current high score (yellow)
- "NEW HIGH SCORE!" message (gold) if beaten

---

## Testing Checklist

### Health System
- [ ] Start with 3 hearts displayed
- [ ] Lose a heart when ball hits bottom
- [ ] Heart animates loss (pulse effect)
- [ ] Game over after losing all 3 lives

### Game Over Screen
- [ ] Shows final score
- [ ] Shows level reached
- [ ] Shows high score
- [ ] "NEW HIGH SCORE!" shown if beaten
- [ ] High score persists across sessions
- [ ] Space key restarts game

### Level Complete
- [ ] Screen shows when all blocks cleared
- [ ] Displays level number and score
- [ ] Auto-hides after 2 seconds
- [ ] New blocks regenerate
- [ ] Ball resets position
- [ ] Level counter increments

### Level Regeneration
- [ ] Blocks respawn in same pattern
- [ ] Ball resets to center
- [ ] Health persists between levels
- [ ] Score persists between levels
- [ ] Combo resets between levels

### Game Restart
- [ ] Space key works on game over
- [ ] Score resets to 0
- [ ] Level resets to 1
- [ ] Health resets to 3
- [ ] Blocks regenerate
- [ ] Combo resets

---

## Known Issues / Future Enhancements

### Potential Improvements

1. **Ball Velocity Reset**: Currently resets to fixed velocity (200, -200). Could scale with level.

2. **Block Pattern Variation**: All levels use same block pattern. Could load different patterns per level.

3. **Pause State**: Game state includes "paused" but pause functionality not implemented.

4. **Sound Effects**: Health loss and game over sounds could be added.

5. **Visual Effects**:
   - Heart loss particle effect
   - Level complete particle burst
   - Screen shake on game over

6. **Difficulty Progression**: Speed scaling persists across levels. Could reset or further increase per level.

7. **Lives Power-up**: Could add blocks that give extra lives.

8. **Level Time Bonus**: Could award bonus points for clearing level quickly.

---

## Architecture Notes

### Design Patterns Used

1. **Event-Driven Architecture**: All systems communicate via events
2. **State Machine**: Game state tracking (playing, game_over, level_complete)
3. **Observer Pattern**: UI components observe game events
4. **Template Method**: Lifecycle hooks (init, update, destroy)
5. **Factory Pattern**: PrimitiveFactory and GameBuilder

### Separation of Concerns

- **Primitives**: Pure game logic, no UI
- **UI Components**: Pure rendering, no game logic
- **GameContainer**: Event orchestration and state management
- **Config Files**: Declarative game definition

### Benefits

- Easy to add new primitives
- UI completely decoupled from logic
- Game behavior defined in JSON
- Testing primitives in isolation
- Reusable across different game types

---

## Conclusion

This implementation completes the core game lifecycle for Ludemic Engine, providing a fully playable breakout game with health, lives, level progression, and persistent high scores. The architecture remains true to Ludemic's primitive-based design, demonstrating how complex game systems can be built from composable primitives defined in JSON configuration.

All game logic is event-driven and declarative, making it easy for students to understand, modify, and extend the game by editing JSON files or creating new primitives.
