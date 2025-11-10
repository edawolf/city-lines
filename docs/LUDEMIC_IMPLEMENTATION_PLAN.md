# Ludemic Primitives Game Scaffold - Implementation Plan (Gameplay-First)

## Project Vision

Build a composable game engine where Ludemic primitives (LISA instructions) are the atomic building blocks. Students can configure games via JSON, swap primitives like Lego blocks, and rapidly prototype any genre.

---

## ✅ COMPLETED: Phases 1-3 + Ludemic Layout Engine

**Status Update (Current):**
- **Phases 1-3**: ✅ COMPLETE - Core primitive architecture, entities, and game loop implemented
- **Ludemic Layout Engine**: ✅ COMPLETE - Advanced AI-driven layout system implemented (see `src/app/layout/`)
- **Ready for**: Phase 4 (Juice Primitives)

The Ludemic Layout Engine was implemented after Phase 3, providing:
- Intent-based layout compilation (`LayoutIntent.ts`)
- Pre-built layout patterns (`IntentLibrary.ts`)
- AI agent-based spatial intelligence (`LayoutIntelligence.ts`)
- Automatic role detection (`ElementAgentFactory.ts`)
- Intelligent layout execution (`LayoutExecutor.ts`)

This system is now integrated with the existing PixiJS scaffold and ready for juice primitives.

---

## Phase 1: Single Primitive Proof (Paddle + Ball Physics) ✅ COMPLETE

### Goal

Get ONE primitive working on screen: A paddle that moves smoothly with input. That's it. This proves:
- Primitive architecture works
- Input feels responsive
- Foundation is solid

### What to Build

#### 1.1: Core Architecture Setup

```
src/ludemic/
├── primitives/          # LISA instruction implementations
│   └── movement/
│       └── InputMovement.ts
├── entities/            # Primitive containers
│   └── Paddle.ts
├── config/              # JSON-driven configuration
│   └── types.ts
└── GameBuilder.ts       # Assembles primitives from config
```

#### 1.2: Minimal Primitive Interface

**File:** `src/ludemic/primitives/Primitive.ts`

```typescript
export interface PrimitiveConfig {
  [key: string]: any;
}

export abstract class Primitive {
  abstract init(entity: Container, config: PrimitiveConfig): void;
  abstract update(deltaTime: number): void;
  abstract destroy(): void;
}
```

#### 1.3: First Primitive - InputMovement (LISA: INPUT + MOVE)

**File:** `src/ludemic/primitives/movement/InputMovement.ts`

```typescript
export interface InputMovementConfig {
  speed: number;
  axis: 'horizontal' | 'vertical' | 'both';
  bounds?: { min: number; max: number };
  inputType: 'keyboard' | 'mouse' | 'touch';
}

export class InputMovement extends Primitive {
  private entity!: Container;
  private config!: InputMovementConfig;
  private velocity = { x: 0, y: 0 };

  init(entity: Container, config: InputMovementConfig): void {
    this.entity = entity;
    this.config = config;
    this.setupInput();
  }

  update(deltaTime: number): void {
    // Apply velocity
    if (this.config.axis === 'horizontal' || this.config.axis === 'both') {
      this.entity.x += this.velocity.x * deltaTime;
    }
    if (this.config.axis === 'vertical' || this.config.axis === 'both') {
      this.entity.y += this.velocity.y * deltaTime;
    }

    // Apply bounds
    if (this.config.bounds) {
      this.entity.x = Math.max(this.config.bounds.min,
                              Math.min(this.config.bounds.max, this.entity.x));
    }
  }

  private setupInput(): void {
    if (this.config.inputType === 'keyboard') {
      // Arrow keys or WASD
      document.addEventListener('keydown', this.handleKeyDown);
      document.addEventListener('keyup', this.handleKeyUp);
    } else if (this.config.inputType === 'mouse') {
      // Mouse position
      document.addEventListener('pointermove', this.handleMouseMove);
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') this.velocity.x = -this.config.speed;
    if (e.key === 'ArrowRight' || e.key === 'd') this.velocity.x = this.config.speed;
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
        e.key === 'a' || e.key === 'd') this.velocity.x = 0;
  };

  private handleMouseMove = (e: PointerEvent) => {
    // Set entity x position directly to mouse x (within bounds)
    const canvas = this.entity.parent?.toLocal({ x: e.clientX, y: e.clientY });
    if (canvas) {
      this.entity.x = canvas.x;
    }
  };

  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('pointermove', this.handleMouseMove);
  }
}
```

#### 1.4: First Entity - Paddle (Primitive Container)

**File:** `src/ludemic/entities/Paddle.ts`

```typescript
export class Paddle extends Container {
  private primitives: Primitive[] = [];
  private graphics: Graphics;

  constructor(config: EntityConfig) {
    super();

    // Visual representation (simple rectangle)
    this.graphics = new Graphics()
      .rect(0, 0, config.width || 100, config.height || 20)
      .fill(config.color || 0x4CAF50);
    this.graphics.pivot.set((config.width || 100) / 2, (config.height || 20) / 2);
    this.addChild(this.graphics);

    // Attach primitives from config
    config.primitives?.forEach(primConfig => {
      const primitive = PrimitiveFactory.create(primConfig.type, primConfig.config);
      primitive.init(this, primConfig.config);
      this.primitives.push(primitive);
    });
  }

  update(deltaTime: number): void {
    this.primitives.forEach(p => p.update(deltaTime));
  }

  destroy(): void {
    this.primitives.forEach(p => p.destroy());
    super.destroy();
  }
}
```

#### 1.5: Primitive Factory

**File:** `src/ludemic/primitives/PrimitiveFactory.ts`

```typescript
export class PrimitiveFactory {
  private static registry = new Map<string, typeof Primitive>();

  static register(name: string, primitiveClass: typeof Primitive): void {
    this.registry.set(name, primitiveClass);
  }

  static create(name: string, config: PrimitiveConfig): Primitive {
    const PrimitiveClass = this.registry.get(name);
    if (!PrimitiveClass) {
      throw new Error(`Primitive "${name}" not found`);
    }
    return new PrimitiveClass();
  }
}

// Auto-register primitives
PrimitiveFactory.register('InputMovement', InputMovement);
```

#### 1.6: JSON Config (Paddle with InputMovement)

**File:** `config/paddle-test.json`

```json
{
  "entities": [
    {
      "type": "Paddle",
      "position": { "x": 400, "y": 550 },
      "config": {
        "width": 120,
        "height": 20,
        "color": "0x4CAF50"
      },
      "primitives": [
        {
          "type": "InputMovement",
          "config": {
            "speed": 8,
            "axis": "horizontal",
            "bounds": { "min": 60, "max": 740 },
            "inputType": "keyboard"
          }
        }
      ]
    }
  ],
  "viewport": {
    "width": 800,
    "height": 600
  }
}
```

#### 1.7: GameBuilder (Config → Running Game)

**File:** `src/ludemic/GameBuilder.ts`

```typescript
export class GameBuilder {
  static fromConfig(config: GameConfig): GameContainer {
    const game = new GameContainer();

    // Create entities from config
    config.entities.forEach(entityConfig => {
      const entity = EntityFactory.create(entityConfig.type, entityConfig.config);
      entity.position.set(entityConfig.position.x, entityConfig.position.y);
      game.addEntity(entity);
    });

    return game;
  }
}

export class GameContainer extends Container {
  private entities: Entity[] = [];

  addEntity(entity: Entity): void {
    this.entities.push(entity);
    this.addChild(entity);
  }

  update(deltaTime: number): void {
    this.entities.forEach(e => e.update?.(deltaTime));
  }
}
```

#### 1.8: Test Screen

**File:** `src/app/screens/PrimitiveTestScreen.ts`

```typescript
export class PrimitiveTestScreen extends Container {
  private game!: GameContainer;

  async show(): Promise<void> {
    // Load config
    const config = await fetch('./config/paddle-test.json').then(r => r.json());

    // Build game from config
    this.game = GameBuilder.fromConfig(config);
    this.addChild(this.game);
  }

  update(ticker: Ticker): void {
    this.game.update(ticker.deltaTime);
  }

  resize(width: number, height: number): void {
    // Center game area
    this.game.position.set((width - 800) / 2, (height - 600) / 2);
  }
}
```

### Phase 1 Checklist ✅ COMPLETE

- [x] Create `primitives/` directory structure
- [x] Implement `Primitive` base class
- [x] Implement `InputMovement` primitive
- [x] Create `Paddle` entity
- [x] Create `PrimitiveFactory`
- [x] Create `GameBuilder`
- [x] Create `paddle-test.json` config
- [x] Create `PrimitiveTestScreen`
- [x] Update `main.ts` to show `PrimitiveTestScreen`
- [x] Test: Can you move the paddle smoothly?

### Phase 1 Success Criteria ✅ COMPLETE

✅ Can you move the paddle with arrow keys?
- Paddle responds instantly to input
- Movement is smooth (no jitter)
- Bounds work (paddle stays on screen)
- Config changes take effect (edit JSON, reload)
- No code changes needed to adjust speed/bounds

**Status:** ✅ COMPLETE

---

## Phase 2: Add Second Primitive (Ball with LinearMovement + BounceCollision) ✅ COMPLETE

### Goal

Add ball that moves and bounces. Prove multiple primitives can coexist. This proves:
- Multiple entities work together
- Collision primitive architecture
- Physics feel good

### What to Add

#### 2.1: LinearMovement Primitive (LISA: MOVE)

**File:** `src/ludemic/primitives/movement/LinearMovement.ts`

```typescript
export interface LinearMovementConfig {
  velocity: { x: number; y: number };
  maxSpeed?: number;
}

export class LinearMovement extends Primitive {
  private entity!: Container;
  private config!: LinearMovementConfig;

  init(entity: Container, config: LinearMovementConfig): void {
    this.entity = entity;
    this.config = config;
  }

  update(deltaTime: number): void {
    this.entity.x += this.config.velocity.x * deltaTime;
    this.entity.y += this.config.velocity.y * deltaTime;

    // Apply max speed if set
    if (this.config.maxSpeed) {
      const speed = Math.sqrt(
        this.config.velocity.x ** 2 + this.config.velocity.y ** 2
      );
      if (speed > this.config.maxSpeed) {
        const scale = this.config.maxSpeed / speed;
        this.config.velocity.x *= scale;
        this.config.velocity.y *= scale;
      }
    }
  }

  getVelocity(): { x: number; y: number } {
    return { ...this.config.velocity };
  }

  setVelocity(vx: number, vy: number): void {
    this.config.velocity.x = vx;
    this.config.velocity.y = vy;
  }

  destroy(): void {}
}
```

#### 2.2: BounceCollision Primitive (LISA: COLLIDE)

**File:** `src/ludemic/primitives/collision/BounceCollision.ts`

```typescript
export interface BounceCollisionConfig {
  bounds: { left: number; right: number; top: number; bottom: number };
  bounceDamping?: number; // 0.0-1.0, default 1.0 (perfect bounce)
  targets?: string[]; // Entity IDs to check collision with
}

export class BounceCollision extends Primitive {
  private entity!: Container;
  private config!: BounceCollisionConfig;
  private game!: GameContainer;

  init(entity: Container, config: BounceCollisionConfig): void {
    this.entity = entity;
    this.config = config;
    this.game = entity.parent as GameContainer;
  }

  update(deltaTime: number): void {
    // Get movement primitive to modify velocity
    const movement = this.getMovementPrimitive();
    if (!movement) return;

    const vel = movement.getVelocity();
    const pos = { x: this.entity.x, y: this.entity.y };
    const radius = this.getEntityRadius();

    // Bounce off walls
    if (pos.x - radius < this.config.bounds.left ||
        pos.x + radius > this.config.bounds.right) {
      vel.x *= -(this.config.bounceDamping ?? 1.0);
      movement.setVelocity(vel.x, vel.y);
    }
    if (pos.y - radius < this.config.bounds.top ||
        pos.y + radius > this.config.bounds.bottom) {
      vel.y *= -(this.config.bounceDamping ?? 1.0);
      movement.setVelocity(vel.x, vel.y);
    }

    // Bounce off targets (paddle, blocks, etc.)
    this.config.targets?.forEach(targetId => {
      const target = this.game.getEntityById(targetId);
      if (target && this.checkCollision(target)) {
        this.bounceOffTarget(target, movement);
      }
    });
  }

  private getMovementPrimitive(): LinearMovement | null {
    // Access sibling primitive (movement)
    return (this.entity as any).getPrimitive?.('LinearMovement');
  }

  private checkCollision(target: Container): boolean {
    const bounds = this.entity.getBounds();
    const targetBounds = target.getBounds();
    return bounds.intersects(targetBounds);
  }

  private bounceOffTarget(target: Container, movement: LinearMovement): void {
    // Simple reflection based on collision normal
    const vel = movement.getVelocity();
    // Calculate bounce angle based on paddle position, etc.
    vel.y *= -1;
    movement.setVelocity(vel.x, vel.y);
  }

  destroy(): void {}
}
```

#### 2.3: Ball Entity

**File:** `src/ludemic/entities/Ball.ts`

```typescript
export class Ball extends Container {
  private primitives: Primitive[] = [];
  private graphics: Graphics;

  constructor(config: EntityConfig) {
    super();

    // Visual (circle)
    const radius = config.radius || 10;
    this.graphics = new Graphics()
      .circle(0, 0, radius)
      .fill(config.color || 0xFFFFFF);
    this.addChild(this.graphics);

    // Attach primitives
    config.primitives?.forEach(primConfig => {
      const primitive = PrimitiveFactory.create(primConfig.type, primConfig.config);
      primitive.init(this, primConfig.config);
      this.primitives.push(primitive);
      (this as any)[primConfig.type] = primitive; // Store for cross-primitive access
    });
  }

  update(deltaTime: number): void {
    this.primitives.forEach(p => p.update(deltaTime));
  }

  getPrimitive(type: string): Primitive | null {
    return (this as any)[type] || null;
  }

  destroy(): void {
    this.primitives.forEach(p => p.destroy());
    super.destroy();
  }
}
```

#### 2.4: Updated Config (Paddle + Ball)

**File:** `config/breakout-minimal.json`

```json
{
  "entities": [
    {
      "id": "paddle",
      "type": "Paddle",
      "position": { "x": 400, "y": 550 },
      "config": {
        "width": 120,
        "height": 20,
        "color": "0x4CAF50"
      },
      "primitives": [
        {
          "type": "InputMovement",
          "config": {
            "speed": 8,
            "axis": "horizontal",
            "bounds": { "min": 60, "max": 740 },
            "inputType": "keyboard"
          }
        }
      ]
    },
    {
      "id": "ball",
      "type": "Ball",
      "position": { "x": 400, "y": 500 },
      "config": {
        "radius": 10,
        "color": "0xFFFFFF"
      },
      "primitives": [
        {
          "type": "LinearMovement",
          "config": {
            "velocity": { "x": 0, "y": -5 },
            "maxSpeed": 12
          }
        },
        {
          "type": "BounceCollision",
          "config": {
            "bounds": { "left": 10, "right": 790, "top": 10, "bottom": 590 },
            "bounceDamping": 1.0,
            "targets": ["paddle"]
          }
        }
      ]
    }
  ],
  "viewport": {
    "width": 800,
    "height": 600
  }
}
```

### Phase 2 Checklist ✅ COMPLETE

- [x] Implement `LinearMovement` primitive
- [x] Implement `BounceCollision` primitive
- [x] Create `Ball` entity
- [x] Update `GameBuilder` to handle entity IDs
- [x] Update `GameContainer` to support `getEntityById()`
- [x] Register new primitives in factory
- [x] Create `breakout-minimal.json` config
- [x] Test: Ball bounces off paddle and walls?

### Phase 2 Success Criteria ✅ COMPLETE

✅ Does ball physics feel good?
- Ball moves smoothly
- Bounces off walls correctly
- Bounces off paddle (basic collision)
- Can adjust velocity in JSON and see changes

**Status:** ✅ COMPLETE

---

## Phase 3: Add Third Primitive (Blocks with DestroyCollision + Scoring) ✅ COMPLETE

### Goal

Add destroyable blocks and basic scoring. Prove game loop works. This proves:
- Destruction works
- Multiple entities of same type
- Basic scoring integration
- Core Breakout loop complete

### What to Add

#### 3.1: DestroyCollision Primitive (LISA: COLLIDE + KILL)

**File:** `src/ludemic/primitives/collision/DestroyCollision.ts`

```typescript
export interface DestroyCollisionConfig {
  destroyOnHit: boolean; // Destroy THIS entity when hit
  triggerOnEntityTypes: string[]; // Only trigger on these entity types
  onDestroy?: string; // Event to emit
}

export class DestroyCollision extends Primitive {
  private entity!: Container;
  private config!: DestroyCollisionConfig;
  private game!: GameContainer;

  init(entity: Container, config: DestroyCollisionConfig): void {
    this.entity = entity;
    this.config = config;
    this.game = entity.parent as GameContainer;
  }

  update(deltaTime: number): void {
    // Check collision with specified entity types
    this.config.triggerOnEntityTypes.forEach(entityType => {
      const entities = this.game.getEntitiesByType(entityType);
      entities.forEach(other => {
        if (this.checkCollision(other)) {
          if (this.config.destroyOnHit) {
            // Emit event before destroying
            if (this.config.onDestroy) {
              this.game.emit(this.config.onDestroy, this.entity);
            }
            this.game.removeEntity(this.entity);
          }
        }
      });
    });
  }

  private checkCollision(other: Container): boolean {
    const bounds = this.entity.getBounds();
    const otherBounds = other.getBounds();
    return bounds.intersects(otherBounds);
  }

  destroy(): void {}
}
```

#### 3.2: PointsOnDestroy Primitive (LISA: REWARD)

**File:** `src/ludemic/primitives/scoring/PointsOnDestroy.ts`

```typescript
export interface PointsOnDestroyConfig {
  points: number;
  listenForEvent: string; // Event to listen for (e.g., "block_destroyed")
}

export class PointsOnDestroy extends Primitive {
  private config!: PointsOnDestroyConfig;
  private game!: GameContainer;

  init(entity: Container, config: PointsOnDestroyConfig): void {
    this.config = config;
    this.game = entity.parent as GameContainer;

    // Listen for destroy events
    this.game.on(this.config.listenForEvent, this.handleDestroy);
  }

  private handleDestroy = (entity: Container) => {
    // Award points when entity is destroyed
    this.game.addScore(this.config.points);
  };

  destroy(): void {
    this.game.off(this.config.listenForEvent, this.handleDestroy);
  }
}
```

#### 3.3: Block Entity

**File:** `src/ludemic/entities/Block.ts`

```typescript
export class Block extends Container {
  private primitives: Primitive[] = [];
  private graphics: Graphics;

  constructor(config: EntityConfig) {
    super();

    // Visual (rectangle with border)
    this.graphics = new Graphics()
      .rect(0, 0, config.width || 60, config.height || 30)
      .fill(config.color || 0xFF5722)
      .stroke({ width: 2, color: 0xFFFFFF });
    this.addChild(this.graphics);

    // Attach primitives
    config.primitives?.forEach(primConfig => {
      const primitive = PrimitiveFactory.create(primConfig.type, primConfig.config);
      primitive.init(this, primConfig.config);
      this.primitives.push(primitive);
    });
  }

  update(deltaTime: number): void {
    this.primitives.forEach(p => p.update(deltaTime));
  }

  destroy(): void {
    this.primitives.forEach(p => p.destroy());
    super.destroy();
  }
}
```

#### 3.4: BlockGrid Layout Helper

**File:** `src/ludemic/entities/BlockGrid.ts`

```typescript
export class BlockGrid {
  static generateConfig(rows: number, cols: number, config: {
    startX: number;
    startY: number;
    blockWidth: number;
    blockHeight: number;
    spacing: number;
    colors: string[];
  }): EntityConfig[] {
    const blocks: EntityConfig[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        blocks.push({
          id: `block_${row}_${col}`,
          type: 'Block',
          position: {
            x: config.startX + col * (config.blockWidth + config.spacing),
            y: config.startY + row * (config.blockHeight + config.spacing)
          },
          config: {
            width: config.blockWidth,
            height: config.blockHeight,
            color: config.colors[row % config.colors.length]
          },
          primitives: [
            {
              type: 'DestroyCollision',
              config: {
                destroyOnHit: true,
                triggerOnEntityTypes: ['Ball'],
                onDestroy: 'block_destroyed'
              }
            },
            {
              type: 'PointsOnDestroy',
              config: {
                points: 10,
                listenForEvent: 'block_destroyed'
              }
            }
          ]
        });
      }
    }

    return blocks;
  }
}
```

#### 3.5: ScoreDisplay UI

**File:** `src/ludemic/ui/ScoreDisplay.ts`

```typescript
export class ScoreDisplay extends Container {
  private scoreText: Text;
  private currentScore = 0;

  constructor() {
    super();

    this.scoreText = new Text({
      text: 'Score: 0',
      style: {
        fontSize: 24,
        fill: 0xFFFFFF,
        fontWeight: 'bold'
      }
    });
    this.addChild(this.scoreText);
  }

  setScore(score: number): void {
    this.currentScore = score;
    this.scoreText.text = `Score: ${this.currentScore}`;
  }
}
```

#### 3.6: Updated Config (Full Breakout)

**File:** `config/breakout-core.json`

```json
{
  "entities": [
    {
      "id": "paddle",
      "type": "Paddle",
      "position": { "x": 400, "y": 550 },
      "config": {
        "width": 120,
        "height": 20,
        "color": "0x4CAF50"
      },
      "primitives": [
        {
          "type": "InputMovement",
          "config": {
            "speed": 8,
            "axis": "horizontal",
            "bounds": { "min": 60, "max": 740 },
            "inputType": "keyboard"
          }
        }
      ]
    },
    {
      "id": "ball",
      "type": "Ball",
      "position": { "x": 400, "y": 500 },
      "config": {
        "radius": 10,
        "color": "0xFFFFFF"
      },
      "primitives": [
        {
          "type": "LinearMovement",
          "config": {
            "velocity": { "x": 0, "y": -5 },
            "maxSpeed": 12
          }
        },
        {
          "type": "BounceCollision",
          "config": {
            "bounds": { "left": 10, "right": 790, "top": 10, "bottom": 590 },
            "bounceDamping": 1.0,
            "targets": ["paddle"]
          }
        }
      ]
    }
  ],
  "layouts": [
    {
      "type": "BlockGrid",
      "config": {
        "rows": 5,
        "cols": 10,
        "startX": 100,
        "startY": 100,
        "blockWidth": 60,
        "blockHeight": 30,
        "spacing": 5,
        "colors": ["0xFF5722", "0xFF9800", "0xFFC107", "0x4CAF50", "0x2196F3"]
      }
    }
  ],
  "ui": [
    {
      "type": "ScoreDisplay",
      "position": { "x": 20, "y": 20 }
    }
  ],
  "viewport": {
    "width": 800,
    "height": 600
  }
}
```

#### 3.7: Update GameContainer with Scoring

```typescript
export class GameContainer extends Container {
  private entities: Entity[] = [];
  private score = 0;
  private scoreDisplay?: ScoreDisplay;

  addScore(points: number): void {
    this.score += points;
    this.scoreDisplay?.setScore(this.score);
    this.emit('score_changed', this.score);
  }

  getScore(): number {
    return this.score;
  }

  setScoreDisplay(display: ScoreDisplay): void {
    this.scoreDisplay = display;
  }

  removeEntity(entity: Container): void {
    const index = this.entities.indexOf(entity as any);
    if (index > -1) {
      this.entities.splice(index, 1);
      this.removeChild(entity);
      entity.destroy();
    }
  }
}
```

### Phase 3 Checklist ✅ COMPLETE

- [x] Implement `DestroyCollision` primitive
- [x] Implement `PointsOnDestroy` primitive
- [x] Create `Block` entity
- [x] Create `BlockGrid` layout helper
- [x] Create `ScoreDisplay` UI component
- [x] Update `GameContainer` with scoring system
- [x] Update `GameBuilder` to handle layouts and UI
- [x] Create `breakout-core.json` config
- [x] Test: Blocks destroy and score increases?

### Phase 3 Success Criteria ✅ COMPLETE

✅ Is core Breakout loop complete?
- Ball destroys blocks on contact
- Score increases when blocks destroyed
- All blocks can be cleared
- Game feels like actual Breakout

**Status:** ✅ COMPLETE

### Additional Achievement: Ludemic Layout Engine

After completing Phase 3, we implemented a comprehensive Ludemic Layout Engine inspired by LISA principles:

**Implemented Systems:**
- **LayoutIntentCompiler** - Translates high-level semantic intents into actual positions
- **IntentLibrary** - Pre-built layout patterns (CORNER_BUTTON, HERO_ELEMENT, etc.)
- **LayoutIntelligenceSystem** - AI agent-based spatial analysis
- **ElementAgentFactory** - Automatic role detection and agent registration
- **LayoutExecutor** - Executes AI-generated layout corrections

**Key Features:**
- Intent-based positioning (semantic layout descriptions)
- AI agents with personalities (territoriality, cooperation, attention-seeking)
- Spatial intelligence (proximity detection, conflict analysis)
- Automatic conflict resolution
- Natural language layout parsing

This advanced layout system is now integrated and ready to manage UI elements for juice primitives in Phase 4.

---

## Phase 4: Add Juice Primitives (Particles, ScreenShake, SoundTrigger) ✅ COMPLETE

**Status:** ✅ COMPLETE - See [PHASE_4_SUMMARY.md](PHASE_4_SUMMARY.md) for full details

This phase successfully implemented "game feel" through juice primitives. The Ludemic Layout Engine manages dynamic visual effects intelligently.

### Goal ✅ ACHIEVED

Make the game FEEL good with juice primitives. This proves:
- ✅ Visual feedback works (ParticleEmitter)
- ✅ Audio integration works (SoundTrigger)
- ✅ "Game feel" is configurable via JSON
- ✅ Particle system integrated with GameContainer
- ✅ Screen shake system implemented

### What to Add

#### 4.1: ParticleEmitter Primitive (LISA: JUICE + DISPLAY)

**File:** `src/ludemic/primitives/juice/ParticleEmitter.ts`

```typescript
export interface ParticleEmitterConfig {
  triggerOn: string; // Event name
  particleCount: number;
  color: number;
  lifetime: number; // seconds
  spread: number; // degrees
  speed: number;
}

export class ParticleEmitter extends Primitive {
  private config!: ParticleEmitterConfig;
  private game!: GameContainer;

  init(entity: Container, config: ParticleEmitterConfig): void {
    this.config = config;
    this.game = entity.parent as GameContainer;
    this.game.on(this.config.triggerOn, this.emit);
  }

  private emit = (entity?: Container) => {
    const pos = entity?.position || { x: 0, y: 0 };

    for (let i = 0; i < this.config.particleCount; i++) {
      const angle = Math.random() * this.config.spread - this.config.spread / 2;
      const speed = this.config.speed * (0.5 + Math.random() * 0.5);

      const particle = new Particle({
        x: pos.x,
        y: pos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: this.config.color,
        lifetime: this.config.lifetime
      });

      this.game.addParticle(particle);
    }
  };

  destroy(): void {
    this.game.off(this.config.triggerOn, this.emit);
  }
}
```

#### 4.2: ScreenShake Primitive (LISA: JUICE)

**File:** `src/ludemic/primitives/juice/ScreenShake.ts`

```typescript
export interface ScreenShakeConfig {
  triggerOn: string;
  intensity: number;
  duration: number; // seconds
}

export class ScreenShake extends Primitive {
  private config!: ScreenShakeConfig;
  private game!: GameContainer;

  init(entity: Container, config: ScreenShakeConfig): void {
    this.config = config;
    this.game = entity.parent as GameContainer;
    this.game.on(this.config.triggerOn, this.shake);
  }

  private shake = () => {
    this.game.shake(this.config.intensity, this.config.duration);
  };

  destroy(): void {
    this.game.off(this.config.triggerOn, this.shake);
  }
}
```

#### 4.3: SoundTrigger Primitive (LISA: SOUND)

**File:** `src/ludemic/primitives/juice/SoundTrigger.ts`

```typescript
export interface SoundTriggerConfig {
  triggerOn: string;
  soundId: string;
  volume?: number;
}

export class SoundTrigger extends Primitive {
  private config!: SoundTriggerConfig;
  private game!: GameContainer;

  init(entity: Container, config: SoundTriggerConfig): void {
    this.config = config;
    this.game = entity.parent as GameContainer;
    this.game.on(this.config.triggerOn, this.playSound);
  }

  private playSound = () => {
    engine().audio.sfx.play(this.config.soundId, {
      volume: this.config.volume ?? 1.0
    });
  };

  destroy(): void {
    this.game.off(this.config.triggerOn, this.playSound);
  }
}
```

#### 4.4: Updated Config (With Juice)

**File:** `config/breakout-juicy.json`

```json
{
  "entities": [
    {
      "id": "ball",
      "type": "Ball",
      "primitives": [
        {
          "type": "ParticleEmitter",
          "config": {
            "triggerOn": "block_destroyed",
            "particleCount": 10,
            "color": "0xFFFF00",
            "lifetime": 0.5,
            "spread": 360,
            "speed": 200
          }
        },
        {
          "type": "ScreenShake",
          "config": {
            "triggerOn": "block_destroyed",
            "intensity": 5,
            "duration": 0.1
          }
        },
        {
          "type": "SoundTrigger",
          "config": {
            "triggerOn": "block_destroyed",
            "soundId": "sounds/block-break.wav",
            "volume": 0.7
          }
        }
      ]
    }
  ]
}
```

### Phase 4 Checklist ✅ COMPLETE

- [x] Implement `ParticleEmitter` primitive
- [x] Implement `ScreenShake` primitive
- [x] Implement `SoundTrigger` primitive
- [x] Create `Particle` class for visual effects
- [x] Create `GameManager` entity for global juice effects
- [x] Add particle system to `GameContainer`
- [x] Add screen shake to `GameContainer`
- [x] Register primitives in `PrimitiveFactory`
- [x] Create `breakout-juicy.json` config
- [x] Test: All primitives pass linting
- [x] Test: Game feels satisfying

### Phase 4 Success Criteria ✅ COMPLETE

✅ Does the game FEEL good?
- ✅ Particles explode on block destruction (ParticleEmitter implemented)
- ✅ Screen shakes on impact (ScreenShake implemented)
- ✅ Sound effects play on events (SoundTrigger implemented)
- ✅ Can adjust juice parameters in JSON (all configs support customization)
- ✅ Event-driven architecture (all primitives listen for game events)
- ✅ Clean TypeScript implementation (no lint errors)

**Status:** ✅ COMPLETE

### Implementation Highlights

**New Files Created:**
- `src/ludemic/primitives/juice/Particle.ts` - Particle visual effect class
- `src/ludemic/primitives/juice/ParticleEmitter.ts` - LISA: JUICE + DISPLAY primitive
- `src/ludemic/primitives/juice/ScreenShake.ts` - LISA: JUICE primitive
- `src/ludemic/primitives/juice/SoundTrigger.ts` - LISA: SOUND primitive
- `src/ludemic/entities/GameManager.ts` - Invisible entity for global logic
- `public/config/breakout-juicy.json` - Full game config with juice
- `docs/PHASE_4_SUMMARY.md` - Detailed implementation documentation

**Modified Files:**
- `src/ludemic/GameBuilder.ts` - Added particle system and screen shake support
- `src/ludemic/primitives/PrimitiveFactory.ts` - Registered juice primitives
- `src/ludemic/entities/EntityFactory.ts` - Registered GameManager entity

---

## Phase 5: Add Difficulty Primitive (SpeedScaling + ComboMultiplier) ✅ COMPLETE

**Status:** ✅ COMPLETE - Difficulty and combo systems fully implemented

This phase successfully added progressive difficulty and scoring depth through composable primitives.

### Goal ✅ ACHIEVED

Add Ludemic difficulty curve and scoring depth. This proves:
- ✅ Difficulty tuning via config (SpeedScaling)
- ✅ Strategic depth (ComboMultiplier with 2s window)
- ✅ LISA ESCALATE/EXTEND operations work
- ✅ Score multiplier system integrated
- ✅ Real-time combo UI display

### What to Add

#### 5.1: SpeedScaling Primitive (LISA: ESCALATE)

**File:** `src/ludemic/primitives/difficulty/SpeedScaling.ts`

```typescript
export interface SpeedScalingConfig {
  targetEntityTypes: string[];
  startSpeed: number;
  maxSpeed: number;
  increaseRate: number; // Per level or time
  triggerOn: string; // e.g., "level_complete" or "time_elapsed"
}

export class SpeedScaling extends Primitive {
  private config!: SpeedScalingConfig;
  private game!: GameContainer;
  private currentSpeedMult = 1.0;

  init(entity: Container, config: SpeedScalingConfig): void {
    this.config = config;
    this.game = entity.parent as GameContainer;
    this.game.on(this.config.triggerOn, this.escalate);
  }

  private escalate = () => {
    this.currentSpeedMult += this.config.increaseRate;

    // Apply speed increase to target entities
    this.config.targetEntityTypes.forEach(type => {
      const entities = this.game.getEntitiesByType(type);
      entities.forEach(entity => {
        const movement = entity.getPrimitive?.('LinearMovement');
        if (movement) {
          const vel = movement.getVelocity();
          const newSpeed = Math.min(
            Math.sqrt(vel.x ** 2 + vel.y ** 2) * this.currentSpeedMult,
            this.config.maxSpeed
          );
          const angle = Math.atan2(vel.y, vel.x);
          movement.setVelocity(
            Math.cos(angle) * newSpeed,
            Math.sin(angle) * newSpeed
          );
        }
      });
    });
  };

  destroy(): void {
    this.game.off(this.config.triggerOn, this.escalate);
  }
}
```

#### 5.2: ComboMultiplier Primitive (LISA: EXTEND + ESCALATE)

**File:** `src/ludemic/primitives/scoring/ComboMultiplier.ts`

```typescript
export interface ComboMultiplierConfig {
  comboWindow: number; // seconds between hits to maintain combo
  baseMultiplier: number;
  maxMultiplier: number;
  incrementPerHit: number;
  listenForEvent: string;
}

export class ComboMultiplier extends Primitive {
  private config!: ComboMultiplierConfig;
  private game!: GameContainer;
  private currentCombo = 0;
  private currentMultiplier = 1.0;
  private lastHitTime = 0;

  init(entity: Container, config: ComboMultiplierConfig): void {
    this.config = config;
    this.game = entity.parent as GameContainer;
    this.game.on(this.config.listenForEvent, this.handleHit);
  }

  update(deltaTime: number): void {
    // Check if combo expired
    const now = Date.now();
    if (this.currentCombo > 0 &&
        (now - this.lastHitTime) / 1000 > this.config.comboWindow) {
      this.resetCombo();
    }
  }

  private handleHit = () => {
    this.currentCombo++;
    this.lastHitTime = Date.now();

    // Calculate multiplier
    this.currentMultiplier = Math.min(
      this.config.baseMultiplier + (this.currentCombo * this.config.incrementPerHit),
      this.config.maxMultiplier
    );

    this.game.setScoreMultiplier(this.currentMultiplier);
    this.game.emit('combo_updated', { combo: this.currentCombo, mult: this.currentMultiplier });
  };

  private resetCombo(): void {
    this.currentCombo = 0;
    this.currentMultiplier = 1.0;
    this.game.setScoreMultiplier(1.0);
    this.game.emit('combo_reset');
  }

  destroy(): void {
    this.game.off(this.config.listenForEvent, this.handleHit);
  }
}
```

#### 5.3: ComboDisplay UI

**File:** `src/ludemic/ui/ComboDisplay.ts`

```typescript
export class ComboDisplay extends Container {
  private comboText: Text;
  private multText: Text;

  constructor() {
    super();

    this.comboText = new Text({
      text: 'Combo: 0',
      style: { fontSize: 18, fill: 0xFFFFFF }
    });
    this.addChild(this.comboText);

    this.multText = new Text({
      text: '1.0x',
      style: { fontSize: 24, fill: 0xFF6F00, fontWeight: 'bold' }
    });
    this.multText.position.set(0, 25);
    this.addChild(this.multText);
  }

  setCombo(combo: number, mult: number): void {
    this.comboText.text = `Combo: ${combo}`;
    this.multText.text = `${mult.toFixed(1)}x`;
  }

  reset(): void {
    this.comboText.text = 'Combo: 0';
    this.multText.text = '1.0x';
  }
}
```

#### 5.4: Updated Config (With Difficulty)

**File:** `config/breakout-difficulty.json`

```json
{
  "entities": [
    {
      "id": "game_manager",
      "type": "GameManager",
      "primitives": [
        {
          "type": "SpeedScaling",
          "config": {
            "targetEntityTypes": ["Ball"],
            "startSpeed": 5,
            "maxSpeed": 12,
            "increaseRate": 0.1,
            "triggerOn": "level_complete"
          }
        },
        {
          "type": "ComboMultiplier",
          "config": {
            "comboWindow": 2.0,
            "baseMultiplier": 1.0,
            "maxMultiplier": 5.0,
            "incrementPerHit": 0.2,
            "listenForEvent": "block_destroyed"
          }
        }
      ]
    }
  ],
  "ui": [
    {
      "type": "ComboDisplay",
      "position": { "x": 680, "y": 20 }
    }
  ]
}
```

### Phase 5 Checklist ✅ COMPLETE

- [x] Implement `SpeedScaling` primitive (LISA: ESCALATE)
- [x] Implement `ComboMultiplier` primitive (LISA: EXTEND + ESCALATE)
- [x] Create `ComboDisplay` UI with color-coded multipliers
- [x] Update `GameContainer` with multiplier system
- [x] Add score multiplier integration to scoring
- [x] Register primitives in `PrimitiveFactory`
- [x] Create `breakout-difficulty.json` config
- [x] Update PrimitiveTestScreen with Phase 5 features
- [x] Test: All primitives pass linting
- [x] Test: Difficulty increases & combos feel rewarding

### Phase 5 Success Criteria ✅ COMPLETE

✅ Does difficulty progression work?
- ✅ Ball speeds up as game progresses (5% increase per block)
- ✅ Combo counter increases on consecutive hits (2s window)
- ✅ Score multiplier applies correctly (up to 5x)
- ✅ Combo resets after window expires
- ✅ ComboDisplay shows real-time combo & multiplier
- ✅ Color-coded multiplier display (white → yellow → orange → red)
- ✅ Event-driven architecture for all difficulty systems

**Status:** ✅ COMPLETE

### Implementation Highlights

**New Files Created:**
- `src/ludemic/primitives/difficulty/SpeedScaling.ts` - Progressive speed increases
- `src/ludemic/primitives/difficulty/ComboMultiplier.ts` - Time-window combo system
- `src/ludemic/ui/ComboDisplay.ts` - Real-time combo & multiplier UI
- `public/config/breakout-difficulty.json` - Full config with all systems

**Modified Files:**
- `src/ludemic/GameBuilder.ts` - Added score multiplier & combo display support
- `src/ludemic/primitives/PrimitiveFactory.ts` - Registered difficulty primitives
- `src/app/screens/PrimitiveTestScreen.ts` - Updated for Phase 5

---

## Phase 6: Add Second Game Example (Shooter)

### Goal

Prove same primitives compose into different game. This proves:
- Architecture is truly composable
- Students can see primitive reuse
- Config is the only difference

### What to Add

#### 6.1: Shooter Config (Reuses All Existing Primitives!)

**File:** `config/shooter.json`

```json
{
  "entities": [
    {
      "id": "player",
      "type": "Ship",
      "position": { "x": 400, "y": 500 },
      "config": {
        "width": 40,
        "height": 40,
        "color": "0x4CAF50"
      },
      "primitives": [
        {
          "type": "InputMovement",
          "config": {
            "speed": 6,
            "axis": "both",
            "bounds": { "min": 20, "max": 780 },
            "inputType": "keyboard"
          }
        }
      ]
    }
  ],
  "spawners": [
    {
      "type": "EnemySpawner",
      "config": {
        "spawnRate": 2.0,
        "maxEnemies": 10,
        "entityTemplate": {
          "type": "Enemy",
          "config": {
            "width": 30,
            "height": 30,
            "color": "0xF44336"
          },
          "primitives": [
            {
              "type": "LinearMovement",
              "config": {
                "velocity": { "x": 0, "y": 3 },
                "maxSpeed": 5
              }
            },
            {
              "type": "DestroyCollision",
              "config": {
                "destroyOnHit": true,
                "triggerOnEntityTypes": ["Bullet"],
                "onDestroy": "enemy_destroyed"
              }
            },
            {
              "type": "PointsOnDestroy",
              "config": {
                "points": 100,
                "listenForEvent": "enemy_destroyed"
              }
            }
          ]
        }
      }
    }
  ]
}
```

**Key insight:** Same `LinearMovement`, `DestroyCollision`, `PointsOnDestroy` primitives, just different config values and entity types!

### Phase 6 Checklist

- [ ] Create `Ship` entity (reuses `InputMovement`)
- [ ] Create `Enemy` entity (reuses all collision primitives)
- [ ] Create `EnemySpawner` system
- [ ] Create `shooter.json` config
- [ ] Test: Shooter plays like top-down shooter?

### Phase 6 Success Criteria

✅ Does shooter feel different from Breakout?
- Ship moves in all directions
- Enemies spawn and move down
- Shooting enemies destroys them
- Score increases
- Zero new primitives needed!

**Estimated Time:** 1 day

---

## Summary Timeline (Gameplay-First, Primitives Architecture)

| Phase | Goal | Time | Status |
|-------|------|------|--------|
| Phase 1 | Single primitive (paddle movement) | 1 day | ✅ COMPLETE - Input feels responsive |
| Phase 2 | Add ball (movement + collision) | 1 day | ✅ COMPLETE - Physics feel good |
| Phase 3 | Add blocks (destruction + scoring) | 2 days | ✅ COMPLETE - Core loop complete |
| **Layout** | **Ludemic Layout Engine (LISA-inspired)** | **Extra** | ✅ **COMPLETE - AI-driven positioning** |
| Phase 4 | Add juice (particles, shake, sound) | 2 days | ✅ **COMPLETE - Game feel implemented** |
| Phase 5 | Add difficulty (speed, combos) | 2 days | ✅ **COMPLETE - Progression systems** |
| Phase 6 | Second game (shooter) | 1 day | 🚀 **READY TO START** |
| **Total** | **Fully composable primitive system with 2 working games** | **9 days** | **78% Complete** |

**Current Progress:**
- ✅ Core primitive architecture established (Phases 1-3)
- ✅ Entity system with composable primitives
- ✅ JSON-driven configuration system
- ✅ Advanced layout system with AI agents (beyond original plan)
- ✅ Juice primitives for game feel (Phase 4)
- ✅ Difficulty primitives for progression (Phase 5)
- ✅ Event-driven architecture for reactive gameplay
- 🚀 Ready to create second game example (Phase 6)

---

## Development Principles (Inherited from Coffee Toast)

- **Playable at Every Stage** - After each phase, something works
- **Incremental Complexity** - One major system per phase
- **Prove Before Polish** - Core feel first, effects later
- **Fail Fast** - If primitive doesn't work, fix before adding more
- **Separation of Concerns** - Primitives, entities, config are separate

---

## Documentation to Create

### Phase 1-3:
- `docs/PRIMITIVES_REFERENCE.md` - Every primitive explained with LISA mapping
- `docs/GETTING_STARTED.md` - How to edit JSON and see changes

### Phase 4-5:
- `docs/JUICE_GUIDE.md` - How to add game feel
- `docs/DIFFICULTY_TUNING.md` - How to balance via config

### Phase 6:
- `docs/GAME_TEMPLATES.md` - Breakout vs Shooter comparison
- `docs/EXTENSION_COOKBOOK.md` - Common modifications

---

## Student Journey Examples

### Beginner (JSON Only):

```json
// "I want Breakout but ball is faster"
{
  "entities": [
    {
      "id": "ball",
      "primitives": [
        {
          "type": "LinearMovement",
          "config": {
            "velocity": { "x": 0, "y": -10 }
          }
        }
      ]
    }
  ]
}
```

### Intermediate (Mix Primitives):

```json
// "I want Breakout but blocks take 3 hits"
// Add HealthSystem primitive to blocks
{
  "type": "Block",
  "primitives": [
    {
      "type": "HealthSystem",
      "config": {
        "health": 3,
        "onDeath": "block_destroyed"
      }
    }
  ]
}
```

### Advanced (New Primitive):

```typescript
// "I want blocks that shoot back"
// Create ShooterBehavior primitive
export class ShooterBehavior extends Primitive {
  update(deltaTime: number): void {
    // Spawn bullets periodically
  }
}
```

---

## Next Steps After Phase 6

### Phase 7: Third Game (Snake)
- Reuse `GridMovement`, `GrowthCollision` primitives
- Prove architecture works for completely different genres

### Phase 8: Tuning UI
- Live primitive editor
- Real-time config changes
- LISA assembly visualization

### Phase 9: Documentation Polish
- Video tutorials
- Interactive playground
- Cookbook with 20+ patterns

### Phase 10: Game Jam Ready
- 5+ game templates
- 30+ primitives
- Clear extension paths
- Production polish
