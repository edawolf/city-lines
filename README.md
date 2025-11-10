# FullSail Game Jam Scaffold - Ludemic Primitives Edition

**A composable game engine built from Ludemic primitives - like Lego blocks for game mechanics.**

Games are assembled from **LISA instruction primitives** configured via JSON. Students can build any genre (Breakout, Shooter, Snake, RPG) by mixing and matching the same building blocks.

## 🎮 Current Status: Phase 5 Complete - Ready for Phase 6! 🚀

**What's Working Now (Phases 1-5):**
- ✅ **Phase 1**: InputMovement primitive (paddle control)
- ✅ **Phase 2**: LinearMovement + BounceCollision (ball physics)
- ✅ **Phase 3**: DestroyCollision + PointsOnDestroy + Block Grid (core gameplay)
- ✅ **Phase 4**: ParticleEmitter + ScreenShake + SoundTrigger (game feel)
- ✅ **Phase 5**: SpeedScaling + ComboMultiplier + TuningSystem (difficulty & progression)

**Playable Demo:** Fully featured Breakout game with complete difficulty curve!

```bash
npm install
npm run dev
```

Open http://localhost:8080/ and play! Press `~` to adjust game parameters in real-time.

---

## 🏆 What's New in Phase 5?

### Difficulty Progression Primitives
- **SpeedScaling**: Ball speeds up as blocks are destroyed (LISA: ESCALATE)
- **ComboMultiplier**: Consecutive hits award higher scores (LISA: EXTEND + ESCALATE)
- **TuningSystem**: Runtime parameter adjustment with localStorage persistence

### Real-Time Game Tuning
- Press `~` to open tuning menu
- Adjust 17 different game parameters live
- Changes apply immediately, no restart needed
- Save/load/export configurations as JSON

### UI Enhancements
- **ComboDisplay**: Shows combo count + multiplier with color coding
- Responsive layout for all screen sizes
- Real-time score updates

**See:** [`docs/PHASE_5_SUMMARY.md`](docs/PHASE_5_SUMMARY.md) for full details.

---

## 🎯 Quick Start: Run the Full Game

### 1. Install & Run

```bash
npm install
npm run dev
```

### 2. Play Breakout with Full Features

**Controls:**
- **←** **→** arrow keys to move paddle
- **~** (tilde) to open tuning menu
- Press slider to adjust parameters in real-time
- See scores, combos, and effects immediately

### 3. Explore the Architecture

**Beginner:** Edit JSON configs
```bash
# Edit game parameters without touching code
public/config/breakout-difficulty.json
```

**Intermediate:** Study primitives
```
src/ludemic/primitives/
├── movement/        # InputMovement, LinearMovement
├── collision/       # BounceCollision, DestroyCollision
├── scoring/         # PointsOnDestroy, ComboMultiplier
├── difficulty/      # SpeedScaling
└── juice/          # ParticleEmitter, ScreenShake, SoundTrigger
```

**Advanced:** Create new primitives
```
Copy any primitive → Modify → Register in PrimitiveFactory → Use in JSON
```

---

## 📊 Primitive System Overview

### What are Primitives?

**Primitives** are reusable atomic behaviors implementing **LISA (Ludemic Instruction Set Architecture)** instructions.

| Phase | Primitive | LISA Instruction | Status |
|-------|-----------|------------------|--------|
| 1 | InputMovement | INPUT + MOVE | ✅ Complete |
| 2 | LinearMovement | MOVE | ✅ Complete |
| 2 | BounceCollision | COLLIDE | ✅ Complete |
| 3 | DestroyCollision | COLLIDE + KILL | ✅ Complete |
| 3 | PointsOnDestroy | REWARD | ✅ Complete |
| 4 | ParticleEmitter | JUICE + DISPLAY | ✅ Complete |
| 4 | ScreenShake | JUICE | ✅ Complete |
| 4 | SoundTrigger | SOUND | ✅ Complete |
| 5 | SpeedScaling | ESCALATE | ✅ Complete |
| 5 | ComboMultiplier | EXTEND + ESCALATE | ✅ Complete |
| 6 | *(Your Game)* | *(Compose from above)* | 🔄 Your Turn! |

### The Power of Composability

Same primitives. Different games.

**Breakout Config:**
```json
{
  "paddle": { "primitives": ["InputMovement"] },
  "ball": { "primitives": ["LinearMovement", "BounceCollision"] },
  "block": { "primitives": ["DestroyCollision", "PointsOnDestroy"] }
}
```

**Shooter Config (Phase 6):**
```json
{
  "ship": { "primitives": ["InputMovement (both axes)"] },
  "enemy": { "primitives": ["LinearMovement", "DestroyCollision"] },
  "bullet": { "primitives": ["LinearMovement", "DestroyCollision"] }
}
```

**Same primitives. Zero new code. Different game!**

---

## 🚀 Phase 6: Your Game Idea - Step-by-Step Process

### Step 1: Extract Your Game Idea (Run `idea-to-lisa`)

Start with your game concept. Use the Ludemic tool to extract primitives:

```bash
# Read: context/ludemic/LUDEMIC_IDEA_TO_LISA.mdc
# This tool helps you:
# - Describe your game in natural language
# - Identify core mechanics
# - Map mechanics to LISA instructions
# - List required primitives
```

**Example:** "I want a space shooter where enemies spawn waves and you dodge/shoot"

**Output:**
```
Required Primitives:
- InputMovement (ship control)
- LinearMovement (enemy waves)
- DestroyCollision (ship destruction)
- PointsOnDestroy (scoring)
- ParticleEmitter (explosions)
- ScreenShake (impact feedback)
```

### Step 2: Generate Your GDD (Run `ludemic gdd`)

Create a full Game Design Document:

```bash
# Read: context/ludemic/LUDEMIC_GDD_PROPOSAL.mdc
# This generates:
# - Complete game mechanics
# - Balance parameters
# - Level progression
# - Difficulty curves
# - Feedback systems
```

**Output:** Full GDD that shows your game coming to life!

### Step 3: Make It A 10/10 Game (Run `funRefiner`)

Refine your mechanics for maximum fun:

```bash
# Read: context/ludemic/LUDEMIC_FUN_EXPANDER_AGENT.mdc
# This tool helps you:
# - Add juice and feedback
# - Tune difficulty curves
# - Improve player satisfaction
# - Identify missing elements
```

**Output:** A polished, exciting game idea ready to build!

### Step 4: Refresh Claude's Memory

Tell Claude about your codebase:

```bash
# Send this prompt to Claude Code:
"Refresh your memory of the current codebase and Phase 5 implementation.
Read @docs/PHASE_5_SUMMARY.md and @docs/LUDEMIC_IMPLEMENTATION_PLAN.md
to understand:
1. Available primitives (10 total)
2. TuningSystem for parameter adjustment
3. GameBuilder.fromConfig() for JSON-to-game
4. How to register new primitives
Ready to implement my Phase 6 game?"
```

### Step 5: Generate Your Implementation Plan

Claude creates a detailed plan for your game:

```typescript
// For each primitive you need:
// 1. Check if it exists already
// 2. If new, outline implementation steps
// 3. Show JSON configuration
// 4. Provide success criteria
```

### Step 6: Build Your Game (Follow the Plan!)

Execute the implementation plan:

```bash
npm run dev
# Edit configs, create primitives, test incrementally
# Each step should be playable
```

---

## 📚 Ludemic Engine Documentation

Complete reference docs in `context/ludemic/`:

| File | Purpose |
|------|---------|
| [LUDEMIC_IDEA_TO_LISA.mdc](context/ludemic/LUDEMIC_IDEA_TO_LISA.mdc) | 💡 Extract primitives from your game idea |
| [LUDEMIC_GDD_PROPOSAL.mdc](context/ludemic/LUDEMIC_GDD_PROPOSAL.mdc) | 📋 Generate complete Game Design Document |
| [LUDEMIC_FUN_EXPANDER_AGENT.mdc](context/ludemic/LUDEMIC_FUN_EXPANDER_AGENT.mdc) | ✨ Refine your game for maximum fun |
| [LUDEMIC_INSTRUCTION_SET_ARCHITECTURE(LISA).md](context/ludemic/LUDEMIC_INSTRUCTION_SET_ARCHITECTURE(LISA)\ .md) | 🏗️ Core LISA instruction reference |
| [LUDEMIC_IMPLEMENTATION_PLAN.mdc](context/ludemic/LUDEMIC_IMPLEMENTATION_PLAN.mdc) | 📐 Implementation patterns and examples |
| [LUDEMIC_TUNING_KNOBS.mdc](context/ludemic/LUDEMIC_TUNING_KNOBS.mdc) | 🎚️ Real-time parameter tuning system |
| [LUDEMIC_DIFFICULTY_CURVE.mdc](context/ludemic/LUDEMIC_DIFFICULTY_CURVE.mdc) | 📈 Difficulty progression design |
| [LUDEMIC_GAMEPLAY_EVAL.mdc](context/ludemic/LUDEMIC_GAMEPLAY_EVAL.mdc) | 🎮 Evaluate game feel and balance |
| [SAMPLE_GDD.md](context/ludemic/SAMPLE_GDD.md) | 📖 Example: Complete Breakout GDD |
| [SAMPLE_IMPLEMENTATION_PLAN_GAMEPLAY_FIRST.md](context/ludemic/SAMPLE_IMPLEMENTATION_PLAN_GAMEPLAY_FIRST.md) | 📝 Example: Breakout implementation plan |

To update docs to latest:
```bash
./scripts/update-context.sh
```

---

## 📂 Project Structure

```
fullsail-scaffold/
├── src/ludemic/                     # ⭐ Ludemic Primitives System
│   ├── primitives/                  # LISA instruction implementations
│   │   ├── movement/                # InputMovement, LinearMovement
│   │   ├── collision/               # BounceCollision, DestroyCollision
│   │   ├── scoring/                 # PointsOnDestroy, ComboMultiplier
│   │   ├── difficulty/              # SpeedScaling
│   │   ├── juice/                   # ParticleEmitter, ScreenShake, SoundTrigger
│   │   └── Primitive.ts             # Base interface
│   │
│   ├── entities/                    # Composable game objects
│   │   ├── Paddle.ts                # Container for primitives
│   │   ├── Ball.ts
│   │   ├── Block.ts
│   │   ├── EntityFactory.ts
│   │   └── PrimitiveFactory.ts      # Creates primitives by name
│   │
│   ├── tuning/                      # Runtime parameter adjustment
│   │   ├── TuningSystem.ts          # State management
│   │   ├── TuningConfig.ts          # Parameter definitions
│   │   ├── TuningControls.ts        # HTML UI overlay
│   │   └── TuningDebugMenu.ts       # PixiJS UI overlay
│   │
│   ├── config/                      # Type definitions
│   ├── layouts/                     # Entity generators (BlockGrid)
│   ├── ui/                          # Game UI components
│   │   ├── ScoreDisplay.ts
│   │   ├── ComboDisplay.ts
│   │   ├── HealthDisplay.ts
│   │   └── ...
│   │
│   └── GameBuilder.ts               # JSON config → Running game
│
├── public/config/                   # Game configurations (JSON)
│   ├── breakout-core.json           # Phase 3: Core gameplay
│   ├── breakout-juicy.json          # Phase 4: With juice effects
│   ├── breakout-difficulty.json     # Phase 5: With difficulty system
│   └── *.json                       # Your Phase 6 game configs!
│
├── docs/
│   ├── GETTING_STARTED.md           # Beginner guide
│   ├── LUDEMIC_IMPLEMENTATION_PLAN.md # Phases 1-6 reference
│   ├── PHASE_5_SUMMARY.md           # Latest features
│   ├── DEBUG_VERTICAL_STRETCH_REPORT.md
│   ├── TUNING_SYSTEM_BREAKAGE_REPORT.md
│   └── CLAUDE.md                    # Full architecture
│
├── context/ludemic/                 # Ludemic Engine Reference
│   ├── LUDEMIC_IDEA_TO_LISA.mdc     # Extract primitives from ideas
│   ├── LUDEMIC_GDD_PROPOSAL.mdc     # Generate game design docs
│   ├── LUDEMIC_FUN_EXPANDER_AGENT.mdc # Refine for fun factor
│   ├── LUDEMIC_IMPLEMENTATION_PLAN.mdc # Implementation templates
│   ├── LUDEMIC_TUNING_KNOBS.mdc     # Parameter tuning guide
│   ├── LUDEMIC_DIFFICULTY_CURVE.mdc # Difficulty progression
│   ├── LUDEMIC_GAMEPLAY_EVAL.mdc    # Game feel analysis
│   ├── SAMPLE_GDD.md                # Example: Breakout
│   ├── SAMPLE_IMPLEMENTATION_PLAN_GAMEPLAY_FIRST.md
│   └── README.md
│
└── src/app/                         # Original PixiJS features
    ├── layout/                      # Intent-based layout system
    ├── screens/
    │   ├── PrimitiveTestScreen.ts   # Phase 1-5 test environment
    │   └── DebugScreen.ts           # Layout debugging
    └── engine/                      # Core PixiJS engine
```

---

## 🎯 Phase 6 Workflow: Build Your Game!

### Your First Primitive (Example: Shooter)

1. **Read the Phase 6 reference** in [`context/ludemic/LUDEMIC_IMPLEMENTATION_PLAN.mdc`](context/ludemic/LUDEMIC_IMPLEMENTATION_PLAN.mdc)
2. **Use existing primitives** - Most games use the 10 primitives we've built
3. **Create 1 JSON config** - Your game is defined here, not in code
4. **Run and tune** - Adjust parameters, see changes immediately
5. **No code needed** for most games!

### If You Need a New Primitive

1. **Copy an existing one** - All in `src/ludemic/primitives/`
2. **Modify the logic** - Change update(), init(), or event handling
3. **Register it** - Add to `PrimitiveFactory.register()`
4. **Use in JSON** - Reference by name in your config

---

## 🔧 Running the Game

### Prerequisites

- **Node.js** 18+ or **Bun** (recommended)
- Modern web browser with WebGL support

### Installation & Setup

```bash
# Install dependencies (using Bun - faster)
bun install
# Or using npm
npm install

# Start development server
bun run dev    # or: npm run dev

# Open browser to http://localhost:8080
```

### Controls

**Game Controls:**
- **← →** arrow keys - Move paddle
- **~ (tilde)** - Open tuning menu
- **Slider** - Adjust parameters in real-time

**Debug Controls** (original features):
- **G** - Toggle debug grid
- **I** - Toggle AI layout intelligence
- **D** - Open debug screen
- **ESC** - Return to game

---

## 📖 Learning Path for Phase 6

### Level 1: Play & Tune (No code required!)

1. Run `npm run dev`
2. Move paddle with arrow keys
3. Press `~` to open tuning menu
4. Adjust parameters: paddle speed, ball speed, particle effects
5. See changes instantly!

**Files to read:**
- This README (you're reading it!)
- [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md)

### Level 2: Understand the Architecture

1. Read [`docs/PHASE_5_SUMMARY.md`](docs/PHASE_5_SUMMARY.md) for Phase 5 details
2. Review [`context/ludemic/LUDEMIC_IDEA_TO_LISA.mdc`](context/ludemic/LUDEMIC_IDEA_TO_LISA.mdc) - How to convert ideas to primitives
3. Study the primitive structure in `src/ludemic/primitives/`
4. Edit `public/config/breakout-difficulty.json` to see how configs work

**Key concepts:**
- **Primitives** = Reusable behaviors (move, collide, score, juice)
- **Entities** = Visual containers holding primitives
- **Config** = JSON that assembles games from primitives

### Level 3: Build Your Game (Phase 6!)

1. Choose your game idea (Shooter, Snake, RPG, etc.)
2. Use `context/ludemic/LUDEMIC_IDEA_TO_LISA.mdc` to extract required primitives
3. Generate your GDD with `LUDEMIC_GDD_PROPOSAL.mdc`
4. Refine your idea with `LUDEMIC_FUN_EXPANDER_AGENT.mdc`
5. Create your game config in `public/config/your-game.json`
6. Run and tune!
7. If you need new behavior, create a primitive

### Level 4: Create New Primitives

Only if your game needs behavior beyond the 10 we've built:

1. Pick an existing primitive as a template (see `src/ludemic/primitives/`)
2. Copy and modify the logic
3. Register in `src/ludemic/primitives/PrimitiveFactory.ts`
4. Use in your JSON config
5. Tune parameters via the tuning system

---

## 🎓 Resources for Phase 6

### Quick Reference

| What You Need | Where to Find It |
|---------------|------------------|
| Extract primitives from your idea | [`context/ludemic/LUDEMIC_IDEA_TO_LISA.mdc`](context/ludemic/LUDEMIC_IDEA_TO_LISA.mdc) |
| Build a complete GDD | [`context/ludemic/LUDEMIC_GDD_PROPOSAL.mdc`](context/ludemic/LUDEMIC_GDD_PROPOSAL.mdc) |
| Make your game fun | [`context/ludemic/LUDEMIC_FUN_EXPANDER_AGENT.mdc`](context/ludemic/LUDEMIC_FUN_EXPANDER_AGENT.mdc) |
| See how Breakout was built | [`context/ludemic/SAMPLE_IMPLEMENTATION_PLAN_GAMEPLAY_FIRST.md`](context/ludemic/SAMPLE_IMPLEMENTATION_PLAN_GAMEPLAY_FIRST.md) |
| Understand LISA instructions | [`context/ludemic/LUDEMIC_INSTRUCTION_SET_ARCHITECTURE(LISA).md`](context/ludemic/LUDEMIC_INSTRUCTION_SET_ARCHITECTURE(LISA)\ .md) |
| Tune difficulty curves | [`context/ludemic/LUDEMIC_DIFFICULTY_CURVE.mdc`](context/ludemic/LUDEMIC_DIFFICULTY_CURVE.mdc) |
| Design tuning systems | [`context/ludemic/LUDEMIC_TUNING_KNOBS.mdc`](context/ludemic/LUDEMIC_TUNING_KNOBS.mdc) |
| All architecture docs | [`docs/CLAUDE.md`](docs/CLAUDE.md) |

### Example Workflow

```
1. "I want a vertical space shooter"
   ↓
2. Read LUDEMIC_IDEA_TO_LISA.mdc
   → Extract primitives: InputMovement (ship), LinearMovement (enemies),
     DestroyCollision, PointsOnDestroy, ParticleEmitter, ScreenShake
   ↓
3. Read LUDEMIC_GDD_PROPOSAL.mdc
   → Define wave patterns, scoring, difficulty progression
   ↓
4. Read LUDEMIC_FUN_EXPANDER_AGENT.mdc
   → Add juice: particles, shaking, sound effects, combo system
   ↓
5. Create public/config/shooter.json
   → Assemble your game from existing primitives (no code!)
   ↓
6. Run: npm run dev
   ↓
7. Tune with ~ menu
   → Adjust enemy speed, particle effects, difficulty curve
   ↓
8. Play! Done! 🎮
```

---

## 🔧 Build & Deployment

### Build for Production

```bash
# Build optimized production bundle
bun run build

# Preview production build locally
bun run preview
```

### Deployment Targets

- **Vercel** (recommended) - Automatic deployment from Git
- **Netlify** - Static site hosting
- **GitHub Pages** - Free hosting for public repos
- **Self-hosted** - Any static file server

---

## 📝 Troubleshooting & Common Questions

### Game Not Running?

```bash
# Make sure dependencies are installed
npm install

# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Start development server
npm run dev
```

### Tuning Menu Not Appearing?

- Press `~` (tilde) to open the tuning menu
- Make sure you're in the game (not on a loading screen)
- Check browser console for any errors

### Need Help?

- Check [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md) for beginner questions
- Review [`docs/PHASE_5_SUMMARY.md`](docs/PHASE_5_SUMMARY.md) for Phase 5 technical details
- See [`docs/CLAUDE.md`](docs/CLAUDE.md) for full architecture documentation

---

## 🎮 Bonus: Original PixiJS Features (Advanced)

This scaffold originally included advanced responsive design patterns with PixiJS. While Phase 6 focuses on Ludemic primitives, these features remain available:

- **Intent-Based Layout System** - Semantic layout descriptions (see CLAUDE.md)
- **AI Layout Intelligence** - Elements with personalities and spatial awareness (see CLAUDE.md)
- **Real-time Layout Analysis** - Debug and optimize element positioning

Access via the DebugScreen (press 'D' in game) or use keyboard shortcuts:
- **G** - Toggle debug grid
- **I** - Toggle AI layout intelligence
- **D** - Open debug screen

These are advanced features for future extensions beyond Phase 6.

---

## 🎓 Full Documentation Index

### Getting Started
- [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md) - Beginner's guide to the scaffold
- [`docs/PHASE_5_SUMMARY.md`](docs/PHASE_5_SUMMARY.md) - Complete Phase 5 features and implementation

### Ludemic Primitives (Phase 6 Tools)
- [`context/ludemic/LUDEMIC_IDEA_TO_LISA.mdc`](context/ludemic/LUDEMIC_IDEA_TO_LISA.mdc) - Extract game mechanics to primitives
- [`context/ludemic/LUDEMIC_GDD_PROPOSAL.mdc`](context/ludemic/LUDEMIC_GDD_PROPOSAL.mdc) - Generate complete GDD
- [`context/ludemic/LUDEMIC_FUN_EXPANDER_AGENT.mdc`](context/ludemic/LUDEMIC_FUN_EXPANDER_AGENT.mdc) - Refine for fun factor

### Architecture & Reference
- [`docs/CLAUDE.md`](docs/CLAUDE.md) - Full architecture (layout systems, plugin design, etc.)
- [`docs/LUDEMIC_IMPLEMENTATION_PLAN.md`](docs/LUDEMIC_IMPLEMENTATION_PLAN.md) - Phases 1-6 reference
- [`context/ludemic/LUDEMIC_INSTRUCTION_SET_ARCHITECTURE(LISA).md`](context/ludemic/LUDEMIC_INSTRUCTION_SET_ARCHITECTURE(LISA)\ .md) - LISA instruction reference

### Examples
- [`context/ludemic/SAMPLE_GDD.md`](context/ludemic/SAMPLE_GDD.md) - Example: Complete Breakout GDD
- [`context/ludemic/SAMPLE_IMPLEMENTATION_PLAN_GAMEPLAY_FIRST.md`](context/ludemic/SAMPLE_IMPLEMENTATION_PLAN_GAMEPLAY_FIRST.md) - Example: Breakout implementation plan

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using PixiJS, TypeScript, and Ludemic Primitives.**
