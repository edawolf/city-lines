# Getting Started with Ludemic Primitives Scaffold

## What is This?

This is a **game engine built from composable primitives** - like Lego blocks for game mechanics.

Instead of writing code for every game behavior, you:
1. **Configure games via JSON files** (no coding required for basic modifications)
2. **Compose primitives** like building blocks (each primitive = one LISA instruction)
3. **Extend with new primitives** when you need custom behavior

**Key insight**: Every primitive implements a specific **LISA (Ludemic Instruction Set Architecture)** instruction, which means game design decisions map directly to code.

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Opens at: **http://localhost:8080/**

### 3. See It Work

You should see a **green paddle** at the bottom of the screen that you can move with arrow keys.

---

## Current Status: Phase 1 Complete

**What's Implemented:**
- ✅ **InputMovement Primitive** (LISA: INPUT + MOVE)
- ✅ **Paddle Entity** (player-controlled object)
- ✅ **Config-driven gameplay** (edit JSON, see changes)

**What's Coming:**
- Phase 2: Ball physics and collision
- Phase 3: Blocks and scoring
- Phase 4: Juice (particles, shake, sound)
- Phase 5: Difficulty curves
- Phase 6: Additional game examples (shooter, snake)

---

## How to Modify the Game (No Code!)

### Edit: `public/config/paddle-test.json`

This file controls everything about the game.

### Examples:

#### Make paddle faster:
```json
"config": {
  "speed": 12  // Was 8
}
```

#### Make paddle bigger:
```json
"config": {
  "width": 180,  // Was 120
  "height": 30   // Was 20
}
```

#### Change paddle color:
```json
"config": {
  "color": "0xFF5722"  // Orange instead of green
}
```

**See changes**: Just refresh the browser!

---

## Understanding the Architecture

### Entities vs Primitives

**Entities** = Visual objects (what you see)
- Paddle, Ball, Block, Ship, Enemy, etc.
- Just graphics, no behavior

**Primitives** = Behavior (what they do)
- InputMovement, LinearMovement, BounceCollision, etc.
- Implement LISA instructions

### How They Compose

```json
{
  "type": "Paddle",
  "primitives": [
    {
      "type": "InputMovement",
      "config": { "speed": 8 }
    }
  ]
}
```

Result: **Paddle with player control**

Coming in Phase 2:
```json
{
  "type": "Ball",
  "primitives": [
    {
      "type": "LinearMovement",
      "config": { "velocity": { "x": 0, "y": -5 } }
    },
    {
      "type": "BounceCollision",
      "config": { "targets": ["paddle"] }
    }
  ]
}
```

Result: **Ball that moves and bounces off paddle**

---

## Project Structure

```
fullsail-scaffold/
├── src/
│   ├── ludemic/                   # Core primitive system
│   │   ├── primitives/            # LISA instruction implementations
│   │   │   └── movement/
│   │   │       └── InputMovement.ts
│   │   ├── entities/              # Visual game objects
│   │   │   └── Paddle.ts
│   │   ├── config/                # TypeScript types
│   │   └── GameBuilder.ts         # JSON → Running game
│   │
│   ├── app/
│   │   └── screens/
│   │       └── PrimitiveTestScreen.ts  # Test environment
│   │
│   └── main.ts                    # Entry point
│
├── public/
│   └── config/
│       └── paddle-test.json       # Game configuration
│
├── docs/
│   ├── GETTING_STARTED.md         # This file
│   ├── PHASE_1_COMPLETE.md        # Technical details
│   └── CLAUDE.md                  # Full architecture docs
│
└── context/ludemic/               # Game design reference
    ├── LUDEMIC_INSTRUCTION_SET_ARCHITECTURE(LISA).md
    ├── LUDEMIC_DIFFICULTY_CURVE.mdc
    └── ... (more design docs)
```

---

## LISA Instructions (Game Design → Code)

Each primitive implements specific LISA instructions:

### Mechanical Layer (What happens):
- **INPUT**: Capture player input
- **MOVE**: Change position
- **COLLIDE**: Detect collision
- **KILL**: Remove entity
- **SPAWN**: Create entity

### Strategic Layer (Why players care):
- **REWARD**: Give points/feedback
- **ESCALATE**: Increase difficulty
- **EXTEND**: Prolong engagement
- **RISK**: Create stakes
- **AFFORD**: Enable choices

### Narrative Layer (What it means):
- **REVEAL**: Disclose information
- **TRUST**: Build reliability
- **INVEST**: Make player care

### Phase 1 Example:

**InputMovement Primitive** implements:
- **INPUT**: Arrow keys capture
- **MOVE**: Update entity.x position

---

## Development Workflow

### For Beginners (JSON Only):
1. Open `public/config/paddle-test.json`
2. Change values (speed, size, color)
3. Refresh browser
4. See changes instantly

### For Intermediate (Understanding Code):
1. Read `src/ludemic/primitives/movement/InputMovement.ts`
2. See how LISA instructions map to code
3. Understand the primitive pattern
4. Explore entity composition

### For Advanced (Adding Features):
1. Create new primitive (e.g., `AcceleratedMovement.ts`)
2. Register in `PrimitiveFactory`
3. Use in config JSON
4. Test new behavior

---

## Common Questions

### Q: Why primitives instead of traditional game objects?

**A:** Traditional approach:
```typescript
class Paddle {
  speed = 8;

  update() {
    if (keyboard.left) this.x -= this.speed;
    if (keyboard.right) this.x += this.speed;
  }
}
```

Problems:
- Hardcoded behavior
- Can't change without editing code
- Can't reuse movement for other objects
- No LISA mapping (design → code disconnect)

**Primitive approach:**
```json
{
  "type": "Paddle",
  "primitives": [{ "type": "InputMovement", "config": { "speed": 8 } }]
}
```

Benefits:
- Config-driven (no code edits)
- Reusable (`InputMovement` works for Ship, Character, etc.)
- LISA-mapped (design intent explicit)
- Composable (add more primitives easily)

### Q: What's the difference between entities and primitives?

**Entities** = What you see (visual representation)
**Primitives** = What they do (behavior)

Think of entities as "actors" and primitives as "scripts" they follow.

### Q: How do I add a new primitive?

1. Create `src/ludemic/primitives/category/YourPrimitive.ts`
2. Extend `Primitive` base class
3. Implement `init()`, `update()`, `destroy()`
4. Register in `PrimitiveFactory`
5. Use in JSON config

Full example coming in Phase 2!

### Q: Can I make a completely different game with this?

**Yes!** That's the whole point. Phase 6 will show:
- **Breakout**: Paddle + Ball + Blocks
- **Shooter**: Ship + Bullets + Enemies
- **Snake**: SnakeHead + Segments + Food

All using the **same primitives**, just different configurations!

---

## Testing Your Changes

### Phase 1 Test Checklist:

1. **Paddle Movement**
   - [ ] Press ← arrow, paddle moves left
   - [ ] Press → arrow, paddle moves right
   - [ ] Paddle stops at screen edges
   - [ ] Movement is smooth (no stutter)

2. **Config Changes**
   - [ ] Change speed in JSON, paddle moves faster
   - [ ] Change width in JSON, paddle gets wider
   - [ ] Change color in JSON, paddle changes color
   - [ ] Refresh browser, changes apply

3. **Input Modes**
   - [ ] Keyboard input works (arrow keys)
   - [ ] Change to "mouse" in config
   - [ ] Paddle follows mouse cursor

---

## Next Steps

### Phase 2: Ball Physics (Coming Soon)
- Add **LinearMovement** primitive
- Add **BounceCollision** primitive
- Create **Ball** entity
- Config: `breakout-minimal.json`

### Your First Extension Task:
Try creating a **vertical-moving paddle**:
1. Edit `public/config/paddle-test.json`
2. Change `"axis": "horizontal"` to `"axis": "vertical"`
3. Change arrow keys to up/down
4. See paddle move vertically!

---

## Resources

- **Full Architecture**: See `docs/CLAUDE.md`
- **Phase 1 Details**: See `docs/PHASE_1_COMPLETE.md`
- **LISA Reference**: See `context/ludemic/LUDEMIC_INSTRUCTION_SET_ARCHITECTURE(LISA).md`
- **Game Design Docs**: See `context/ludemic/*.md`

---

## Support

If something isn't working:
1. Check console for errors (F12 → Console tab)
2. Verify JSON syntax (use https://jsonlint.com/)
3. Check registered primitives: `PrimitiveFactory.getRegisteredNames()`
4. Review `docs/PHASE_1_COMPLETE.md` for expected behavior

---

## Summary

You now have a **working game engine** where:
- ✅ Games are built from **composable primitives**
- ✅ Behavior is controlled via **JSON configuration**
- ✅ Primitives implement **LISA instructions** (game design → code)
- ✅ You can **modify without coding** (for basic changes)
- ✅ You can **extend with new primitives** (for custom behavior)

**Start experimenting!** Edit `public/config/paddle-test.json` and see what happens.

Phase 2 adds physics and collision, proving the architecture scales beyond simple movement. 🚀
