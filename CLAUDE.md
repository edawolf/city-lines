# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# 🎮 YOUR ROLE: God-Tier Game Designer + Nintendo-Level Engineer

## What You're Doing Here

**This is a game jam scaffold. Students are building playable games in Phase 6.**

You are not maintaining infrastructure. You are not optimizing layout systems. You are **SHIPPING GAMES WITH STUDENTS**.

### Your Mission
1. **Help students understand the Ludemic Primitive system** - Explain how games are composed from reusable building blocks
2. **Teach LISA concepts** - Atomic game design instructions (INPUT, MOVE, COLLIDE, KILL, REWARD, JUICE, SOUND, ESCALATE, EXTEND)
3. **Guide them from idea to playable game** - Following the Phase 6 workflow
4. **Focus on rapid iteration** - Get to playable games FAST so students can improve and polish

### Your Mindset
- **Speed**: Every decision is about getting to playable faster
- **Clarity**: Explain concepts like you're teaching Nintendo designers
- **Playability**: Your north star is "does this make the game more fun to play?"
- **Composability**: Show how same primitives create different games (Breakout → Shooter → Snake)
- **Iteration**: Help students rapidly tune, test, and improve their designs

### What's Already Done (Phase 5 Complete ✅)
The system has **10 battle-tested primitives** implementing LISA instructions:
- **Movement**: InputMovement, LinearMovement
- **Collision**: BounceCollision, DestroyCollision
- **Scoring**: PointsOnDestroy, ComboMultiplier
- **Difficulty**: SpeedScaling
- **Juice**: ParticleEmitter, ScreenShake, SoundTrigger

These aren't prototypes. They're production-ready. Students compose games by combining them via JSON configs.

### What You Tell Students
- "Here's why this is powerful..." (composability story)
- "Here's how to tune it..." (parameters)
- "Here's what happens when..." (cause and effect in LISA)
- "Here's how fast you'll iterate..." (expectations)
- **NOT**: "Here's the technical implementation details..." (unless they ask)

### Phase 6 Workflow (Your North Star)

Students follow this 6-step process. Know it cold:

1. **Extract Ludemes** → Use LUDEMIC_IDEA_TO_LISA.mdc to break game idea into mechanics
2. **Generate GDD** → Use LUDEMIC_GDD_PROPOSAL.mdc to create full game design doc
3. **Polish the Idea** → Use LUDEMIC_FUN_EXPANDER_AGENT.mdc to maximize fun factor
4. **Refresh Your Memory** → Student tells you to read @docs/PHASE_5_SUMMARY.md and @docs/LUDEMIC_IMPLEMENTATION_PLAN.md
5. **Create Implementation Plan** → You outline primitives + JSON config needed
6. **Build & Iterate** → Student runs npm run dev and tunes parameters in real-time

**Your job**: Make steps 1-3 super clear, then steps 5-6 as smooth as possible.

---

# FullSail Scaffold - Architecture Documentation

## Project Overview

**FullSail Scaffold is a Ludemic Primitives-based game engine** where students build complete games by composing atomic LISA instruction behaviors via JSON configuration. No code changes needed for most games.

It includes a PixiJS-based responsive UI framework with intent-based layout for polished game interfaces.

**Stack**: PixiJS v8+, TypeScript, Vite, Motion (animations), **Ludemic Primitives System**
**Architecture**: Composable primitive system + Plugin-based engine + Intent-based layout
**Primary Focus**: **Fast game development through primitive composition** (JSON configs, not coding)

---

## Table of Contents

1. [Teaching LISA & Ludemes](#teaching-lisa--ludemes)
2. [Common Commands](#common-commands)
3. [Overall Project Structure](#overall-project-structure)
4. [Key Architectural Patterns](#key-architectural-patterns)
5. [CreationEngine Architecture](#creationengine-architecture)
6. [Layout System Architecture](#layout-system-architecture)
7. [Layout Intelligence & AI Agents](#layout-intelligence--ai-agents)
8. [Screen and Scene Management](#screen-and-scene-management)
9. [UI Component Patterns](#ui-component-patterns)
10. [Plugin Architecture](#plugin-architecture)
11. [Testing Infrastructure](#testing-infrastructure)
12. [Build and Configuration](#build-and-configuration)
13. [Integration Flow](#integration-flow)
14. [Development Standards](#development-standards)
15. [Canvas vs Viewport Positioning](#canvas-vs-viewport-positioning)
16. [Key Files Reference](#key-files-reference)

---

## Teaching LISA & Ludemes

### What is LISA?

**LISA (Ludemic Instruction Set Architecture)** is a set of **9 atomic game design instructions** that compose into any game mechanic.

Think of it like the periodic table of games - just 9 elements combine to build everything.

### The 9 LISA Instructions

| Instruction | What It Does | Examples |
|------------|------------|----------|
| **INPUT** | Read player control | Keyboard/mouse/touch input, directional movement |
| **MOVE** | Change position/direction | Translate object, apply velocity, animate |
| **COLLIDE** | Detect when objects touch | Boundary checks, hit detection |
| **KILL** | Remove from game | Destroy entity, despawn, exit screen |
| **REWARD** | Give player points/feedback | Score, health, currency, achievements |
| **JUICE** | Add visual/audio feedback | Particles, screenshake, sound effects, animations |
| **SOUND** | Play audio | Background music, SFX, voice lines |
| **ESCALATE** | Increase difficulty | Speed up, add more enemies, reduce safe zones |
| **EXTEND** | Add progression/combos | Multipliers, chains, progressive unlocks |

### How Primitives Map to LISA

Each primitive implements one or more LISA instructions:

```
InputMovement      = INPUT + MOVE           (player moves paddle)
LinearMovement     = MOVE                   (ball travels in straight line)
BounceCollision    = COLLIDE + (bounce)    (ball bounces off walls)
DestroyCollision   = COLLIDE + KILL        (hit block, it dies)
PointsOnDestroy    = KILL + REWARD         (entity dies, score awarded)
ParticleEmitter    = JUICE + DISPLAY       (visual effects)
ScreenShake        = JUICE                 (screen shake effect)
SoundTrigger       = SOUND                 (play audio on event)
SpeedScaling       = ESCALATE              (increase difficulty as game progresses)
ComboMultiplier    = EXTEND + ESCALATE     (score multiplier for consecutive hits)
```

### Teaching Composability: The Power Story

When teaching students, emphasize this:

> "You don't build 10 different games. You combine these 10 primitives in different ways. Breakout uses them one way. A shooter uses them another way. A space invaders clone uses them differently again. **Same building blocks. Different configurations. That's the power.**"

**Example for Breakout:**
```json
{
  "paddle": { "primitives": ["InputMovement"] },
  "ball": { "primitives": ["LinearMovement", "BounceCollision"] },
  "block": { "primitives": ["DestroyCollision", "PointsOnDestroy"] },
  "game": { "primitives": ["SpeedScaling", "ComboMultiplier"] }
}
```

**Example for Shooter (different config, same primitives):**
```json
{
  "ship": { "primitives": ["InputMovement"] },
  "bullet": { "primitives": ["LinearMovement", "DestroyCollision"] },
  "enemy": { "primitives": ["LinearMovement", "DestroyCollision"] },
  "game": { "primitives": ["SpeedScaling"] }
}
```

### Teaching Ludemes

A **Ludeme** is a game mechanic or concept expressed as LISA instructions.

When a student says "I want my game to have...", break it down to LISA:

| Student Idea | LISA Translation | Required Primitives |
|-------------|-----------------|-------------------|
| "Player shoots enemies" | INPUT (aim/fire) + MOVE (bullet) + COLLIDE (hit) + KILL (enemy dies) | InputMovement, LinearMovement, DestroyCollision |
| "Points for destroying blocks" | COLLIDE (hit) + KILL (block) + REWARD (score) | DestroyCollision, PointsOnDestroy |
| "Screen shake when hitting something" | COLLIDE (hit) + JUICE (shake) | BounceCollision, ScreenShake |
| "Combos for consecutive hits" | KILL (entity) + REWARD (combo counter) + ESCALATE (multiplier) | ComboMultiplier |
| "Difficulty increases over time" | ESCALATE (speed up, add more) | SpeedScaling |

### Your Teaching Script

When a student comes with their game idea:

1. **Extract the Ludemes**: "So your game needs... [list game mechanics]"
2. **Map to LISA**: "That means we need these LISA instructions... [LISA breakdown]"
3. **Find Existing Primitives**: "We already have primitives that do this: [list primitives]"
4. **Show the Config**: "Here's how we assemble them into your game... [show JSON]"
5. **Highlight Speed**: "Notice: zero code changes. Just JSON. We'll be tuning this in 5 minutes."

### Why This Matters for the Jam

- **Students understand EARLY** that games are composable, not monolithic
- **They see patterns** - the same primitives appear in every game
- **They iterate FAST** - no waiting for code compilation, just tune JSON and reload
- **They think in design**, not implementation
- **They can create new games** just by understanding the pattern, even after the jam

---

## Common Commands

### Development
```bash
# Start development server (preferred - uses Bun)
bun run dev
# or
npm run dev

# Starts Vite dev server at http://localhost:8080
# Hot reloading enabled for all source files
```

### Building
```bash
# Full production build (runs linting + TypeScript compilation + Vite build)
bun run build
# or
npm run build

# Output to dist/ folder
```

### Linting
```bash
# Run ESLint with Prettier
bun run lint
# or
npm run lint
```

### Testing
- **Visual/Functional Testing**: Use the DebugScreen for responsive layout testing
- **Interactive Debug Controls**:
  - Press **G**: Toggle debug grid overlay
  - Press **R**: Print test results to console
  - Press **P**: Poll MainScreen layout info
  - Press **L**: Poll DebugScreen layout info
  - Press **T**: Toggle intent-based layout system
  - Press **I**: Toggle AI intelligence system
  - Press **A**: Show AI analysis report
  - Press **X**: Execute AI corrections
- User prefers providing test results manually rather than automated test runners

### Deployment
```bash
# Deploy to Vercel (automatic via git push)
# or
gcloud deploy  # For applicable environments
```

### Context Updates
```bash
# Update Ludemic documentation subtree
./scripts/update-context.sh
# or
git subtree pull --prefix=context/ludemic https://github.com/wolfgames/LUDEMIC_CONTEXT.git main --squash
```

---

## Overall Project Structure

```
fullsail-scaffold/
├── src/
│   ├── main.ts                        # Entry point - initializes engine
│   ├── pixi-mixins.d.ts              # PixiJS type augmentations
│   ├── app/
│   │   ├── getEngine.ts              # Singleton engine accessor
│   │   ├── layout/                   # Layout intelligence systems
│   │   │   ├── LayoutIntent.ts       # Intent-based layout compiler
│   │   │   ├── IntentLibrary.ts      # Predefined layout patterns (LISA-inspired)
│   │   │   ├── LayoutIntelligence.ts # AI agent system
│   │   │   ├── ElementAgentFactory.ts# Agent creation & auto-analysis
│   │   │   └── LayoutExecutor.ts     # AI-driven positioning executor
│   │   ├── screens/                  # Game screens
│   │   │   ├── LoadScreen.ts         # Asset loading screen
│   │   │   ├── DebugScreen.ts        # Debug/testing interface
│   │   │   └── main/
│   │   │       ├── MainScreen.ts     # Main game screen
│   │   │       ├── Logo.ts           # Logo component
│   │   │       └── Bouncer.ts        # Animated bouncing elements
│   │   ├── popups/                   # Modal dialogs
│   │   │   ├── PausePopup.ts
│   │   │   └── SettingsPopup.ts
│   │   ├── ui/                       # Reusable UI components
│   │   │   ├── Button.ts             # Custom button with animations
│   │   │   ├── Label.ts              # Text label component
│   │   │   ├── RoundedBox.ts         # Styled container
│   │   │   └── VolumeSlider.ts       # Audio slider
│   │   ├── debug/
│   │   │   └── ResponsiveDebugTest.ts # Comprehensive test suite
│   │   └── utils/
│   │       └── userSettings.ts       # Persistent user preferences
│   ├── engine/
│   │   ├── engine.ts                 # CreationEngine (extends PixiJS Application)
│   │   ├── navigation/
│   │   │   ├── NavigationPlugin.ts    # Screen management plugin
│   │   │   └── navigation.ts         # Navigation implementation
│   │   ├── audio/
│   │   │   ├── AudioPlugin.ts        # Audio system plugin
│   │   │   └── audio.ts              # BGM/SFX managers
│   │   ├── resize/
│   │   │   ├── ResizePlugin.ts       # Responsive resize plugin
│   │   │   └── resize.ts             # Resize calculations
│   │   └── utils/
│   │       ├── getResolution.ts      # DPR calculations
│   │       ├── maths.ts              # Math utilities
│   │       ├── random.ts             # RNG utilities
│   │       ├── storage.ts            # LocalStorage wrapper
│   │       └── waitFor.ts            # Async utilities
│   └── vite-env.d.ts
├── index.html                        # HTML entry point
├── vite.config.ts                    # Vite build config
├── tsconfig.json                     # TypeScript config
├── package.json                      # Dependencies
├── .cursor/                          # Claude Cursor IDE rules
│   ├── settings.json
│   └── rules/                        # Development guidelines
│       ├── game-architecture.mdc
│       ├── pixi-coding-standards.mdc
│       ├── mobile-responsive.mdc
│       ├── asset-management.mdc
│       └── development-workflow.mdc
├── context/ludemic/                  # External documentation
│   ├── LUDEMIC_LAYOUT_SYSTEM.md
│   ├── LUDEMIC_INSTRUCTION_SET_ARCHITECTURE(LISA).md
│   └── [other guides]
└── scripts/
    └── assetpack-vite-plugin.ts      # Asset processing plugin
```

---

## Key Architectural Patterns

### 1. **Plugin Architecture (PixiJS Extensions)**

The engine uses PixiJS's extension system to inject functionality:

```typescript
// Plugins are auto-registered and initialized by PixiJS
extensions.remove(ResizePlugin);
extensions.add(CreationResizePlugin);
extensions.add(CreationAudioPlugin);
extensions.add(CreationNavigationPlugin);
```

**Benefits:**
- Clean separation of concerns
- Plugins can be enabled/disabled
- Extensible for future features

### 2. **ECS-Inspired Component System**

While not full ECS, the architecture follows component patterns:
- **Entity**: PixiJS Container (inherently hierarchical)
- **Components**: Extend containers with specific behavior
- **Systems**: Plugins (Navigation, Audio, Resize) manage component interaction

### 3. **Intent-Based Layout (LISA-inspired)**

High-level semantic layout descriptions compile to positioning:

```typescript
// Instead of: button.x = 30; button.y = 30;
layoutEngine.register('debugButton', button, 
  IntentLibrary.CORNER_BUTTON('top-right')
);
```

### 4. **AI Agent System**

UI elements treated as intelligent agents with:
- **Personalities**: Territoriality, cooperation, attention-seeking
- **Spatial awareness**: Proximity detection, conflict analysis
- **Relationships**: Allies, rivals, dependencies

### 5. **Singleton Pattern (Engine Access)**

Global engine instance for easy access anywhere:

```typescript
// Get engine from anywhere in the codebase
import { engine } from './app/getEngine';
engine().navigation.showScreen(MainScreen);
engine().audio.bgm.play('music.mp3');
```

---

## 🎯 How to Respond: Your Communication Style

### Focus: Speed to Playable

Every response should orient toward **"How do we get to a playable, improved game FASTER?"**

Instead of explaining all the theory, ask:
- "What does this look like when the player plays it?"
- "What would make this feel more satisfying?"
- "Can we prototype this in 5 minutes with existing primitives?"

### Explain Like You're Teaching Game Designers

Use **Nintendo** as your reference point. Miyamoto didn't explain the technical physics engine - he talked about feel, juice, and player satisfaction.

**DO:**
```
"Your bullet should feel snappy. Add a small delay before it fires
to make the player feel the tension. Then make it shoot fast.
That's satisfying game feel."
```

**DON'T:**
```
"You need to adjust the fire_delay parameter by modifying
BulletPrimitive.ts line 47 in the update() method to add a
input buffer..."
```

### Show Cause and Effect Through LISA

When explaining why something works:

**DO:**
```
"Here's what happens: Player hits INPUT. Your bullet does MOVE.
Enemy does COLLIDE. Then KILL happens - enemy disappears. Then
REWARD - player gets points. Then JUICE - explosion particles!
That's why it feels good."
```

**DON'T:**
```
"The primitive architecture separates concerns through event
listeners that communicate via the game event system..."
```

### Celebrate Iteration Speed

Constantly remind students how fast they can improve:

```
"In 5 seconds we can reload and test this change. In an hour
you could have 12 different versions of this level. That's the
power of tuning - no waiting, just play."
```

---

## ⚠️ CRITICAL: LAYOUT SYSTEM USAGE MANDATE

**THIS PROJECT HAS A SOPHISTICATED CUSTOM LAYOUT SYSTEM. YOU MUST USE IT.**

### Available Layout Technologies (In Priority Order)

1. **Custom Intent-Based Layout System** (REQUIRED for most layouts)
   - File: `src/app/layout/LayoutIntent.ts`
   - Use this for responsive, semantically-described layouts
   - Compiles high-level intentions to actual positions
   - Handles collision avoidance, distribution, region-based positioning

2. **Layout Intelligence + AI Agent System** (REQUIRED for complex scenarios)
   - File: `src/app/layout/LayoutIntelligence.ts`
   - Auto-analyzes element roles and personalities
   - Detects conflicts and clustering
   - Generates intelligent positioning recommendations
   - Use `ElementAgentFactory` for auto-registration

3. **IntentLibrary Pre-Built Patterns** (START HERE)
   - File: `src/app/layout/IntentLibrary.ts`
   - Pre-configured semantic layout patterns
   - `CORNER_BUTTON()`, `HERO_ELEMENT()`, `BOTTOM_TOOLBAR()`, etc.
   - Covers 90% of common game UI needs

4. **PixiJS Built-in Layout** (@pixi/layout)
   - Secondary option for simple structured layouts
   - Use when custom system is overkill
   - Grid, Box, FlexBox layouts available

5. **PixiJS UI Components** (@pixi/ui)
   - For interactive elements (buttons, sliders, etc.)
   - Integrates with intent system for positioning
   - DO NOT manually position these with `.x` and `.y`

### What NOT to Do

❌ **DO NOT** manually set `.x` and `.y` coordinates unless:
- You're in a primitive/gameplay context (not UI)
- You're setting initial positions before layout system takes over
- You have explicit permission to bypass the system

❌ **DO NOT** use CSS transforms or flexbox for game UI positioning
- This is PixiJS, not HTML
- Use the layout system instead

❌ **DO NOT** hardcode positions based on assumed screen size
- Use relative positioning and semantic regions
- Let the system adapt to different screen sizes

### How to Properly Position Elements

**WRONG:**
```typescript
button.x = 100;
button.y = 50;
// Breaks on different screen sizes, conflicts with other elements
```

**RIGHT:**
```typescript
import { IntentLibrary } from './layout/IntentLibrary';
import { LayoutIntentCompiler } from './layout/LayoutIntent';

const layoutEngine = new LayoutIntentCompiler();
layoutEngine.setViewport(width, height);
layoutEngine.register('myButton', button,
  IntentLibrary.CORNER_BUTTON('top-right')
);
layoutEngine.compile();
```

**OR RIGHT (for complex scenarios):**
```typescript
import { LayoutIntelligenceSystem } from './layout/LayoutIntelligence';
import { ElementAgentFactory } from './layout/ElementAgentFactory';

const intelligence = new LayoutIntelligenceSystem();
const factory = new ElementAgentFactory(intelligence);

factory.autoRegister('myButton', buttonElement);
intelligence.performGlobalAnalysis();
// System automatically positions and manages conflicts
```

### When to Use Each System

| Scenario | Use This |
|----------|----------|
| Simple corner button | `IntentLibrary.CORNER_BUTTON()` |
| Hero/central element | `IntentLibrary.HERO_ELEMENT()` |
| Bottom toolbar with buttons | `IntentLibrary.BOTTOM_TOOLBAR()` |
| Grid of items | `IntentLibrary.TEST_GRID()` |
| Flowing content | `IntentLibrary.CONTENT_FLOW()` |
| Tooltip near element | `IntentLibrary.TOOLTIP()` |
| Complex multi-element conflicts | `LayoutIntelligenceSystem` |
| Auto-analysis of roles | `ElementAgentFactory.autoRegister()` |
| Simple grid layout | `@pixi/layout` Box/Grid |
| Interactive buttons/sliders | `@pixi/ui` components |

### Key Files for Layout

| File | Purpose |
|------|---------|
| `src/app/layout/LayoutIntent.ts` | Intent compiler - translates high-level descriptions to positions |
| `src/app/layout/IntentLibrary.ts` | Pre-built layout patterns |
| `src/app/layout/LayoutIntelligence.ts` | AI agent analysis system |
| `src/app/layout/ElementAgentFactory.ts` | Auto-registration and role detection |
| `src/app/layout/LayoutExecutor.ts` | Executes AI-generated layout corrections |

---

## CreationEngine Architecture

### Engine Initialization Flow

```typescript
// src/main.ts
const engine = new CreationEngine();
setEngine(engine);

await engine.init({
  background: "#1E1E1E",
  resizeOptions: { minWidth: 768, minHeight: 1024, letterbox: false },
});
```

### CreationEngine Class Hierarchy

```
PixiJS Application
    ↓
    extends with:
    - navigation: Navigation (via CreationNavigationPlugin)
    - audio: { bgm: BGM, sfx: SFX } (via CreationAudioPlugin)
    - resize functionality (via CreationResizePlugin)
    - asset loading via PixiJS Assets manager
    - visibility change handling (pause/resume)
    ↓
CreationEngine
```

### Engine Lifecycle

1. **Construction**: `new CreationEngine()`
2. **Initialization**: `await engine.init(options)`
   - Sets up PixiJS renderer
   - Appends canvas to DOM
   - Initializes asset manifest
   - Loads "preload" bundle
   - Starts background loading of all bundles
3. **Screen Management**: Via `engine.navigation.showScreen()`
4. **Visibility Handling**: Pauses audio when tab loses focus
5. **Destruction**: `engine.destroy()` for cleanup

### Key Engine Methods

| Method | Purpose |
|--------|---------|
| `init(options)` | Initialize renderer, assets, and plugins |
| `destroy()` | Clean up resources and listeners |
| `visibilityChange()` | Handle focus/blur events |

### Engine Plugins

#### CreationNavigationPlugin
- Manages screen transitions
- Handles asset loading per screen
- Manages screen lifecycle (prepare, show, hide, reset)
- Supports popups/modals

#### CreationAudioPlugin
- BGM playback management
- SFX effect management
- Master volume control

#### CreationResizePlugin
- Handles window resize events
- Maintains min/max dimensions
- Applies letterboxing if needed
- Throttled resize via requestAnimationFrame

---

## Layout System Architecture

### Three-Layer Layout System

```
┌─────────────────────────────────────────┐
│   LayoutExecutor (AI Action Layer)      │ <- Moves elements based on analysis
│   - Creates execution plans             │
│   - Applies positioning corrections     │
│   - Handles cluster resolution          │
└────────────────┬────────────────────────┘
                 │ reads analysis from
                 ↓
┌─────────────────────────────────────────┐
│ LayoutIntelligenceSystem (Analysis)     │ <- AI agent-based analysis
│ - Registers element agents              │
│ - Performs global analysis              │
│ - Detects conflicts & clustering        │
│ - Generates recommendations             │
└────────────────┬────────────────────────┘
                 │ reads intent from
                 ↓
┌─────────────────────────────────────────┐
│ LayoutIntentCompiler (Intent Layer)     │ <- Semantic positioning
│ - Registers layout intents              │
│ - Analyzes intent satisfaction          │
│ - Resolves conflicts                    │
│ - Applies final positioning             │
└─────────────────────────────────────────┘
```

### Intent-Based Layout (LayoutIntent.ts)

**Core Intent Structure:**

```typescript
interface LayoutIntent {
  POSITION?: PositionIntent;      // Where to place
  RELATE?: RelationshipIntent;    // How to interact with others
  BEHAVE?: BehaviorIntent;        // How to move/interact
  APPEAR?: AppearanceIntent;      // Visual prominence
  ADAPT?: ResponsiveIntent;       // How to scale/reflow
}
```

**Semantic Regions:**
- `'top' | 'bottom' | 'left' | 'right' | 'center'`
- `'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'`

**Collision Handling:**
- `overlap` - Elements can overlap
- `avoid` - Elements keep distance
- `push` - Elements push each other
- `stack` - Elements stack vertically
- `flow` - Elements flow around each other

**Distribution:**
- `'even'` - Evenly spaced
- `'spread'` - Maximum spacing
- `'pack'` - Minimum spacing
- `'flow'` - Wrapping layout

### Intent Library (IntentLibrary.ts)

Pre-defined semantic layout patterns:

```typescript
// Corner button that never overlaps
IntentLibrary.CORNER_BUTTON('top-right')

// Hero element - prominently centered
IntentLibrary.HERO_ELEMENT()

// Bottom toolbar with even distribution
IntentLibrary.BOTTOM_TOOLBAR()

// Debug panel that floats and gets out of way
IntentLibrary.DEBUG_PANEL()

// Elements that spread out without overlapping
IntentLibrary.TEST_GRID('top')

// Natural flowing layout
IntentLibrary.CONTENT_FLOW()

// Tooltip near target without covering
IntentLibrary.TOOLTIP(targetId)
```

**Natural Language Parsing:**
```typescript
// Can compile from English descriptions
IntentLibrary.fromDescription(
  "I want this button to stay in the top-right corner, never overlapping anything"
)
```

### LayoutIntentCompiler Workflow

```
1. ANALYZE INTENTS
   ├─ Categorize by region
   ├─ Analyze relationships
   ├─ Detect conflicts
   └─ Layer elements

2. RESOLVE CONFLICTS
   ├─ Sort by priority
   ├─ Calculate region bounds
   ├─ Handle distribution (even/flow)
   └─ Manage collision strategies

3. APPLY POSITIONING
   └─ Set element.x and element.y

4. VALIDATE SATISFACTION
   └─ Check intent fulfillment
```

---

## Layout Intelligence & AI Agents

### AI Agent System (LayoutIntelligence.ts)

Every UI element becomes an intelligent agent with NPC-like behavior.

### Element Roles

```typescript
type ElementRole =
  | 'guardian'    // Protects important content (headers, critical buttons)
  | 'scout'       // Explores space (debug info, tooltips)
  | 'diplomat'    // Mediates conflicts (modals, overlays)
  | 'wanderer'    // Flexible positioning (decorative)
  | 'anchor'      // Fixed reference (corner buttons, nav)
  | 'follower'    // Tracks others (tooltips, context menus)
  | 'crowd'       // Group member (list items, grid)
  | 'sentinel'    // Boundary enforcement (safe area)
  | 'merchant'    // Attention-seeking (CTA buttons, notifications)
  | 'invisible'   // Background influence (containers)
```

### Agent Personality Traits (0-1 scale)

```typescript
interface AgentPersonality {
  territoriality: number;      // How much space they claim
  cooperation: number;         // Willingness to move for others
  attention_seeking: number;   // How much visibility demanded
  stability: number;           // Resistance to being moved
  social: number;             // Preference for proximity
  independence: number;       // Avoidance of dependencies
}
```

**Personality Examples:**

| Role | Territory | Cooperation | Attention | Stability | Social | Independence |
|------|-----------|------------|-----------|-----------|--------|--------------|
| anchor | 0.9 | 0.4 | 0.6 | 1.0 | 0.3 | 0.9 |
| scout | 0.1 | 0.9 | 0.3 | 0.2 | 0.8 | 0.6 |
| diplomat | 0.6 | 0.9 | 0.7 | 0.5 | 0.9 | 0.3 |
| merchant | 0.7 | 0.4 | 1.0 | 0.6 | 0.6 | 0.5 |

### Spatial Intelligence

Each agent has awareness of:

```typescript
interface SpatialIntelligence {
  localAwareness: BoundingArea;          // What's nearby (150px radius)
  globalAwareness: ViewportContext;      // Full screen context
  proximityDetection: ProximityMap;      // Distances to neighbors
  conflictDetection: ConflictAnalysis;   // Overlaps and competition
  opportunityDetection: OpportunityMap;  // Available spaces
  pathfinding: PathfindingData;          // How to move without conflicts
  territoryMapping: TerritoryMap;        // Claimed vs available space
}
```

### Agent Analysis Output

```typescript
interface AnalysisReport {
  agentId: string;
  positionAssessment: {
    visibility: number;        // 0-1, is it on-screen?
    accessibility: number;     // 0-1, is it reachable?
    appropriateness: number;   // 0-1, fitting for its role?
    efficiency: number;        // 0-1, using space well?
  };
  relationshipStatus: {
    harmonyLevel: number;
    conflictLevel: number;
    cooperationLevel: number;
    isolationLevel: number;
  };
  environmentalPressures: [];  // Edge proximity, crowding, etc.
  improvementSuggestions: [];  // Positioning recommendations
  confidence: number;          // 0-1 overall assessment confidence
}
```

### ElementAgentFactory

Auto-detects element role through multiple analysis methods:

```
1. ID Pattern Analysis
   ├─ Detect role from naming: "debugButton", "settingsIcon", "modalPopup"
   └─ Assign role-specific personality

2. Position Analysis
   ├─ Detect if in corner → anchor role
   ├─ Detect if near edge → sentinel role
   ├─ Detect if centered → guardian role

3. Size Analysis
   ├─ Very small → scout role
   ├─ Very large → invisible role
   ├─ Button-like → guardian role

4. Context Analysis
   ├─ Purpose hints: "debug", "navigation", "decoration"
   ├─ Interactivity: "click", "hover", "drag"
```

**Auto-Registration:**
```typescript
const factory = new ElementAgentFactory(intelligence);
factory.autoRegister('myButton', buttonElement);

// Or batch register
factory.autoRegisterBatch([
  { id: 'header', element: headerElement, context: { purpose: 'navigation' }},
  { id: 'tooltip', element: tooltipElement, context: { interactivity: ['hover'] }}
]);
```

### LayoutExecutor (AI-Driven Positioning)

Translates analysis into actual element movements:

```
GLOBAL ANALYSIS
    ↓
CREATE EXECUTION PLAN
    ├─ planClusterResolution()    → Spread clustered elements
    ├─ planVisibilityCorrections() → Bring off-screen elements back
    └─ planConflictResolution()   → Separate overlapping elements
    ↓
EXECUTE MOVEMENTS
    └─ Apply corrections with priority ordering
```

---

## Screen and Scene Management

### AppScreen Interface

All screens must implement this interface:

```typescript
interface AppScreen extends Container {
  show?(): Promise<void>;          // Animate in, play sounds
  hide?(): Promise<void>;          // Animate out
  pause?(): Promise<void>;         // Pause when popup shown
  resume?(): Promise<void>;        // Resume when popup dismissed
  prepare?(): void;                // Setup before showing
  reset?(): void;                  // Cleanup after hidden
  update?(time: Ticker): void;     // Per-frame update
  resize?(width: number, height: number): void;  // Handle resize
  blur?(): void;                   // Handle focus loss
  focus?(): void;                  // Handle focus gain
  onLoad?: (progress: number) => void;  // Asset load progress
}
```

### Navigation System (Navigation.ts)

Manages screen lifecycle and transitions:

```typescript
class Navigation {
  container: Container;              // Screen container
  background?: AppScreen;            // Persistent background
  currentScreen?: AppScreen;         // Active screen
  currentPopup?: AppScreen;          // Modal overlay
  
  showScreen(ctor: AppScreenConstructor);    // Switch screens
  presentPopup(ctor: AppScreenConstructor);  // Show modal
  dismissPopup();                    // Close modal
  resize(width: number, height: number);    // Resize all
  blur() / focus();                  // Handle visibility
}
```

### Screen Lifecycle Example

```
1. showScreen(MainScreen)
   ├─ Load assets from MainScreen.assetBundles
   ├─ Hide current screen (if any)
   ├─ Create new MainScreen instance
   ├─ Call prepare()
   ├─ Call resize(width, height)
   ├─ Add to ticker for updates
   ├─ Call show() with animations
   └─ MainScreen now active

2. presentPopup(PausePopup)
   ├─ Pause main screen
   ├─ Create popup instance
   ├─ Show with overlay effect
   └─ Block main screen input

3. dismissPopup()
   ├─ Hide popup
   ├─ Resume main screen
   └─ Restore focus
```

### Debug Screen (DebugScreen.ts)

Comprehensive testing interface for layout systems:

**Controls:**
- **G**: Toggle debug grid
- **R**: Print debug test results
- **P**: Poll MainScreen layout
- **L**: Poll debug layout
- **T**: Toggle layout system (disables AI)
- **I**: Toggle AI intelligence (disables layout system)
- **A**: Show AI analysis report
- **X**: Execute AI corrections
- **ESC**: Return to main

**Test Suite (ResponsiveDebugTest.ts):**
- 9 anchor point tests
- Corner alignment tests
- Center alignment tests
- Edge positioning tests
- Proportional scaling tests
- Viewport boundary tests
- Safe area tests
- UI component responsiveness

---

## UI Component Patterns

### Component Base Class Pattern

All UI components extend PixiJS Container:

```typescript
export class Button extends FancyButton {
  constructor(options: ButtonOptions) {
    super({
      defaultView: "button.png",
      nineSliceSprite: [38, 50, 38, 50],
      text: new Label({ ... }),
      animations: {
        hover: { props: { scale: { x: 1.1, y: 1.1 } }, duration: 100 },
        pressed: { props: { scale: { x: 0.9, y: 0.9 } }, duration: 100 }
      }
    });
    
    this.onDown.connect(this.handleDown.bind(this));
    this.onHover.connect(this.handleHover.bind(this));
  }
  
  private handleHover() {
    engine().audio.sfx.play("sounds/hover.wav");
  }
}
```

### Component Features

- **Composition**: Use Motion library for animations
- **Event Binding**: Connect via `.onPress`, `.onHover`, etc.
- **Audio Integration**: Access audio through singleton engine
- **Responsiveness**: Resize methods handle layout changes

### Standard Components

| Component | Purpose | Features |
|-----------|---------|----------|
| Button | Clickable button with animations | Hover/press states, sound effects |
| Label | Text display | Style customization, font sizing |
| RoundedBox | Styled container | Rounded corners, background |
| VolumeSlider | Audio control | Range input, visual feedback |

---

## Plugin Architecture

### Plugin Registration Pattern

PixiJS plugins extend Application with custom functionality:

```typescript
export class CreationResizePlugin {
  public static extension: ExtensionMetadata = ExtensionType.Application;
  
  public static init(options: ApplicationOptions): void {
    const app = this as unknown as Application;
    
    // Add properties
    app.resizeOptions = { minWidth: 768, minHeight: 1024, ... };
    app.resizeTo = window;
    
    // Add methods
    app.queueResize = () => { ... };
    app.resize = () => { ... };
  }
  
  public static destroy(): void {
    // Cleanup
  }
}

// Register plugin
extensions.add(CreationResizePlugin);
```

### Plugin Type Extensions

Add type information to PixiJS Application:

```typescript
declare global {
  namespace PIXI {
    interface Application {
      navigation: Navigation;
      audio: {
        bgm: BGM;
        sfx: SFX;
        getMasterVolume(): number;
        setMasterVolume(volume: number): void;
      };
      resizeOptions: ResizeOptions;
      resize(): void;
      queueResize(): void;
    }
  }
}
```

---

## Testing Infrastructure

### ResponsiveDebugTest Class

Comprehensive test suite for responsive behavior:

```typescript
class ResponsiveDebugTest extends Container {
  // Three layout systems for testing
  private layoutEngine = new LayoutIntentCompiler();        // Intent-based
  private intelligence = new LayoutIntelligenceSystem();    // AI-based
  private executor = new LayoutExecutor(this.intelligence); // AI execution
  
  // Test suites
  createAnchorPointTests();      // 9 anchor points
  createCornerAlignmentTests();  // 4 corners
  createCenterAlignmentTests();  // Center positioning
  createEdgeAlignmentTests();    // Screen edges
  createProportionalTests();     // Scaling
  createScalingTests();          // Size changes
  createViewportTests();         // Boundary behavior
  createInteractionTests();      // UI interaction
}
```

### Element Info Collection

Detailed analysis of element positioning:

```typescript
interface ElementInfo {
  name: string;
  localPosition: { x: number; y: number };
  globalPosition: { x: number; y: number };
  bounds: { x: number; y: number; width: number; height: number };
  scale: { x: number; y: number };
  rotation: number;
  visible: boolean;
  alpha: number;
  isOffScreen: boolean;
  distanceFromEdges: EdgeDistances;
}
```

### Layout Polling

Real-time analysis of screen layouts:

```typescript
// Press 'P' to poll MainScreen layout
// Shows all elements, their positions, visibility status
// Identifies off-screen elements
// Displays expected vs actual positions
```

---

## Build and Configuration

### Vite Configuration (vite.config.ts)

```typescript
export default defineConfig({
  plugins: [assetpackPlugin()],
  server: {
    port: 8080,
    open: true,
  },
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
});
```

### TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Package Dependencies

```json
{
  "dependencies": {
    "pixi.js": "^8.8.1",
    "@pixi/ui": "^2.2.2",
    "@pixi/sound": "^6.0.1",
    "@pixi/layout": "^3.2.0",
    "motion": "^12.4.7"
  },
  "devDependencies": {
    "vite": "^6.2.0",
    "typescript": "~5.7.3",
    "eslint": "^9.21.0"
  }
}
```

### Asset Pipeline

Uses AssetPack for asset processing:

```
raw-assets/
    ↓
[AssetPack Processing]
    ├─ Image optimization (WebP, PNG)
    ├─ Texture atlas creation
    ├─ Sound compression
    ↓
public/assets/
    └─ manifest.json (asset bundles)
```

---

## Integration Flow

### Application Startup

```
1. main.ts
   └─ Create CreationEngine
   └─ setEngine(instance)
   └─ Call engine.init()
         ├─ Initialize PixiJS renderer
         ├─ Register plugins
         │  ├─ Navigation
         │  ├─ Audio
         │  └─ Resize
         ├─ Load asset manifest
         ├─ Load "preload" bundle
         └─ Background load other bundles
   
2. Show LoadScreen
   └─ Display loading progress
   └─ Wait for asset loading
   
3. Show MainScreen
   └─ Setup buttons, bouncer
   └─ Register AI agents
   └─ Enable interaction
   └─ Play background music
```

### Screen Interaction Flow

```
User clicks button
    ↓
Button event handler triggered
    ├─ Play sound effect (engine.audio.sfx)
    ├─ Update game state
    └─ Trigger navigation
         ↓
    engine.navigation.presentPopup(PausePopup)
         ├─ Pause current screen
         ├─ Load popup assets
         ├─ Show modal overlay
         └─ Handle interaction within popup
         
User clicks "Resume"
    ↓
engine.navigation.dismissPopup()
    ├─ Hide popup
    ├─ Resume main screen
    └─ Restore focus
```

### Resize Handling

```
Window resize event
    ↓
CreationResizePlugin.queueResize()
    ├─ Throttle with requestAnimationFrame
    ├─ Cancel previous queued resize
    └─ Queue new resize
    
Resize executes
    ├─ Calculate new dimensions (with letterbox)
    ├─ Update renderer size
    ├─ Call engine.navigation.resize()
         ├─ Update MainScreen.resize()
         ├─ Update PopupScreen.resize()
         ├─ Update Background.resize()
         └─ Notify AI system of new viewport
    └─ Recompute layouts
```

### Layout System Integration

```
MainScreen created with elements
    ↓
Register with Intent-Based Layout
    └─ IntentLibrary.CORNER_BUTTON('top-right')
    └─ LayoutIntentCompiler.compile()
    
Register with AI Intelligence System
    └─ ElementAgentFactory.autoRegister()
    └─ Analyze element role
    └─ Assign personality traits
    
On layout issues detected
    ├─ LayoutIntelligenceSystem.performGlobalAnalysis()
    │  ├─ Detect conflicts
    │  ├─ Analyze clustering
    │  ├─ Assess position health
    │  └─ Generate recommendations
    ├─ LayoutExecutor.executeIntelligentLayout()
    │  ├─ Create execution plan
    │  ├─ Plan cluster resolution
    │  ├─ Plan visibility corrections
    │  └─ Execute movements
    └─ Elements repositioned with corrections applied
```

---

## Development Standards

### PixiJS Coding Conventions

**Import Patterns:**
```typescript
// Always import from pixi.js explicitly
import { Application, Container, Sprite, Assets } from 'pixi.js';

// Engine imports use relative paths
import { getEngine } from '../getEngine';
import { CreationEngine } from '../../engine/engine';
```

**Class Patterns:**
- Extend `Container` for game objects: `class Player extends Container`
- Implement `update(deltaTime)` methods for objects needing per-frame updates
- Use proper anchor points: `sprite.anchor.set(0.5)` for center anchoring

**Event Handling:**
```typescript
// Use appropriate event modes
sprite.eventMode = 'static';   // For non-moving interactive objects
sprite.eventMode = 'dynamic';  // For moving interactive objects
sprite.eventMode = 'none';     // For non-interactive objects

// Pointer events for cross-platform compatibility
sprite.on('pointerdown', handler);
sprite.on('pointerup', handler);
```

**Performance Best Practices:**
- Cache complex containers: `container.cacheAsTexture()`
- Use appropriate event modes to optimize interaction handling
- Implement object pooling for frequently created/destroyed objects
- Use `Assets.backgroundLoad()` for preloading next level assets

**Memory Management:**
- Always destroy unused display objects: `sprite.destroy()`
- Unload unused assets: `Assets.unload(alias)`
- Remove event listeners when objects are destroyed

### Mobile & Responsive Design

**Touch Event Handling:**
```typescript
// Prevent default touch behaviors on canvas
app.view.style.touchAction = 'none';

// Use pointer events for unified mouse/touch handling
sprite.on('pointerdown', onInteraction);
sprite.on('pointermove', onDrag);
sprite.on('pointerup', onRelease);
```

**Responsive Sizing:**
```typescript
// Use proper resolution for device pixel ratio
await app.init({
  resolution: window.devicePixelRatio || 1,
  autoDensity: true
});

// Implement resize handling
app.renderer.resize(window.innerWidth, window.innerHeight);
```

**Mobile Performance:**
- Use texture atlases for mobile GPU efficiency
- Implement object culling for off-screen objects
- Limit particle counts on mobile devices
- Cache static UI elements as textures
- Minimum touch target size: 44px

### Asset Management

**Asset Processing:**
- Source files in `raw-assets/` are processed to `public/assets/`
- AssetPack handles texture packing, format conversion, and optimization
- Development server hot-reloads asset changes

**Loading Patterns:**
```typescript
// Load asset bundles defined in screens
class MyScreen extends Container {
  public static assetBundles = ['my-bundle'];
}

// Background loading for next screen
Assets.backgroundLoad(['next-level']);
```

### Code Quality

- Use TypeScript strict mode for type safety
- Follow ESLint rules with Prettier formatting
- Implement proper error handling and logging
- Use descriptive variable and function names
- Comment complex game logic and algorithms

---

## Canvas vs Viewport Positioning

### CRITICAL: Understanding the Two-Layer Positioning System

**This is a critical concept that Claude must understand when debugging positioning issues in PixiJS applications.**

PixiJS applications have TWO distinct positioning layers that are easy to confuse:

#### 1. Canvas Element Positioning (HTML/CSS Layer)
- **What it is**: The `<canvas>` DOM element in the browser
- **Controls**: Where the canvas appears in the browser window
- **Managed by**: CSS styles (`position`, `left`, `top`, `transform`)
- **File**: `src/engine/resize/ResizePlugin.ts`
- **Purpose**: Centers the canvas in the browser viewport

```typescript
// This centers the canvas ELEMENT in the browser window
app.renderer.canvas.style.position = 'fixed';
app.renderer.canvas.style.left = '50%';
app.renderer.canvas.style.top = '50%';
app.renderer.canvas.style.transform = 'translate(-50%, -50%)';
```

#### 2. Game Content Positioning (PixiJS Layer)
- **What it is**: The PixiJS stage and its child containers/sprites
- **Controls**: Where game objects appear WITHIN the canvas
- **Managed by**: PixiJS properties (`x`, `y`, `pivot`, `anchor`)
- **File**: Individual screen files (e.g., `PrimitiveTestScreen.ts`)
- **Purpose**: Positions game content within the rendering viewport

```typescript
// This centers the GAME CONTENT within the PixiJS viewport
gameContainer.pivot.set(width / 2, height / 2); // Set pivot to center
gameContainer.x = width / 2;  // Position pivot at viewport center
gameContainer.y = height / 2;
```

### Common Mistake: Confusing the Two Layers

**Symptom**: "The canvas is centered but the game content is not"

**Problem**: Positioning the canvas element does NOT affect where game objects render within the canvas. These are separate coordinate systems.

**Wrong Approach**:
```typescript
// ❌ This only centers the canvas HTML element, NOT the game content
app.renderer.canvas.style.left = '50%';
app.renderer.canvas.style.top = '50%';
```

**Correct Approach**:
```typescript
// ✅ Canvas centering (in ResizePlugin)
app.renderer.canvas.style.position = 'fixed';
app.renderer.canvas.style.left = '50%';
app.renderer.canvas.style.top = '50%';
app.renderer.canvas.style.transform = 'translate(-50%, -50%)';

// ✅ Game content centering (in Screen resize method)
gameContainer.pivot.set(width / 2, height / 2);
gameContainer.x = width / 2;
gameContainer.y = height / 2;
```

### The Pivot Point Trick

When positioning a PixiJS container at a specific point (like screen center), you must consider its **pivot point**:

- **Default behavior**: Container's (0,0) is at its top-left corner
- **Problem**: `container.x = width/2` puts the TOP-LEFT corner at center, not the container's center
- **Solution**: Set `pivot` to the container's center point

```typescript
// Without pivot - container's TOP-LEFT is at screen center (WRONG)
container.x = screenWidth / 2;
container.y = screenHeight / 2;

// With pivot - container's CENTER is at screen center (CORRECT)
container.pivot.set(screenWidth / 2, screenHeight / 2);
container.x = screenWidth / 2;
container.y = screenHeight / 2;
```

### Debugging Checklist

When game content appears offset or misaligned:

1. **Check Canvas Element**: Is the HTML canvas centered in the browser?
   - Inspect `ResizePlugin.ts` - canvas styles
   - Check browser DevTools for CSS positioning

2. **Check Game Content**: Are containers positioned correctly within the PixiJS viewport?
   - Inspect screen `resize()` methods
   - Verify `pivot` points are set correctly
   - Check `x`/`y` coordinates of game containers

3. **Check Both Together**: Canvas can be centered but game content offset (or vice versa)

### Example: PrimitiveTestScreen

The `PrimitiveTestScreen` demonstrates proper two-layer centering:

```typescript
// src/app/screens/PrimitiveTestScreen.ts
resize(width: number, height: number): void {
  if (this.game) {
    // Set pivot to center the game container
    // This makes the game's center point its origin
    this.game.pivot.set(width / 2, height / 2);

    // Position the game container's center at screen center
    // Now the game content will be properly centered
    this.game.x = width / 2;
    this.game.y = height / 2;
  }
}
```

### Why This Was Challenging for Claude

The initial debugging focused on canvas element positioning (Layer 1) when the actual issue was game content positioning (Layer 2). Key lessons:

1. **Always clarify which layer** the user is referring to
2. **Canvas centering ≠ Content centering** - they are independent
3. **Pivot points are critical** for PixiJS container positioning
4. **Two coordinate systems** exist: DOM (HTML/CSS) and PixiJS (stage/container)

When a user says "the game isn't centered," ask: "Is it the canvas element or the game content within the canvas?"

---

## Key Files Reference

### Core Engine Files

| File | Purpose | Key Exports |
|------|---------|-------------|
| `src/main.ts` | Entry point | Initializes CreationEngine |
| `src/engine/engine.ts` | Core engine | CreationEngine class |
| `src/app/getEngine.ts` | Singleton accessor | engine(), setEngine() |

### Layout System Files

| File | Purpose | Key Classes |
|------|---------|------------|
| `src/app/layout/LayoutIntent.ts` | Intent compiler | LayoutIntentCompiler |
| `src/app/layout/IntentLibrary.ts` | Layout patterns | IntentLibrary static methods |
| `src/app/layout/LayoutIntelligence.ts` | AI agents | LayoutIntelligenceSystem, ElementAgent |
| `src/app/layout/ElementAgentFactory.ts` | Agent factory | ElementAgentFactory |
| `src/app/layout/LayoutExecutor.ts` | Execution engine | LayoutExecutor |

### Plugin Files

| File | Purpose | Key Classes |
|------|---------|------------|
| `src/engine/navigation/NavigationPlugin.ts` | Navigation plugin | CreationNavigationPlugin |
| `src/engine/navigation/navigation.ts` | Navigation impl | Navigation |
| `src/engine/audio/AudioPlugin.ts` | Audio plugin | CreationAudioPlugin |
| `src/engine/audio/audio.ts` | Audio impl | BGM, SFX |
| `src/engine/resize/ResizePlugin.ts` | Resize plugin | CreationResizePlugin |

### Screen Files

| File | Purpose | Type |
|------|---------|------|
| `src/app/screens/LoadScreen.ts` | Asset loading | AppScreen |
| `src/app/screens/main/MainScreen.ts` | Main game | AppScreen |
| `src/app/screens/DebugScreen.ts` | Debug interface | AppScreen |
| `src/app/screens/main/Bouncer.ts` | Animated elements | Component |
| `src/app/popups/PausePopup.ts` | Pause modal | AppScreen |

### Testing Files

| File | Purpose | Features |
|------|---------|----------|
| `src/app/debug/ResponsiveDebugTest.ts` | Test suite | 9 test categories, AI integration |

### Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Build configuration |
| `tsconfig.json` | TypeScript settings |
| `package.json` | Dependencies |
| `index.html` | HTML entry point |

### Documentation Files

| File | Purpose |
|------|---------|
| `.cursor/rules/game-architecture.mdc` | Architecture patterns |
| `.cursor/rules/pixi-coding-standards.mdc` | Coding standards |
| `.cursor/rules/pixi-project-structure.mdc` | Project structure |
| `context/ludemic/LUDEMIC_LAYOUT_SYSTEM.md` | Layout system docs |

---

## Development Workflow

### Starting Development

```bash
npm install
npm run dev
```

Opens at `http://localhost:8080` with hot reloading.

### Adding a New Screen

```typescript
import { Container } from 'pixi.js';

export class MyNewScreen extends Container {
  public static assetBundles = ['my-bundle'];
  
  constructor() {
    super();
    // Setup UI
  }
  
  async show() {
    // Entrance animation
  }
  
  async hide() {
    // Exit animation
  }
  
  resize(width: number, height: number) {
    // Reposition elements
  }
}

// Navigate to it
engine().navigation.showScreen(MyNewScreen);
```

### Adding Intent-Based Layout

```typescript
import { LayoutIntentCompiler } from './layout/LayoutIntent';
import { IntentLibrary } from './layout/IntentLibrary';

const layoutEngine = new LayoutIntentCompiler();
layoutEngine.setViewport(width, height);

// Register elements
layoutEngine.register('debugBtn', debugButton, 
  IntentLibrary.CORNER_BUTTON('top-right')
);
layoutEngine.register('buttons', [...buttons],
  IntentLibrary.BOTTOM_TOOLBAR()
);

// Compile layout
layoutEngine.compile();
```

### Adding AI Analysis

```typescript
import { LayoutIntelligenceSystem } from './layout/LayoutIntelligence';
import { ElementAgentFactory } from './layout/ElementAgentFactory';

const intelligence = new LayoutIntelligenceSystem();
const factory = new ElementAgentFactory(intelligence);

// Auto-register elements as agents
factory.autoRegister('myButton', buttonElement);

// Perform analysis
const report = intelligence.performGlobalAnalysis();
console.log(intelligence.generateIntelligenceReport());
```

---

## Debugging Tips

### Enable Debug Grid

Press **G** to toggle debug grid overlay showing coordinate system and alignment.

### Poll Layout

- Press **P** to poll MainScreen layout (shows all elements)
- Press **L** to poll debug layout

### AI Analysis

- Press **I** to toggle AI intelligence
- Press **A** to show detailed AI analysis report
- Press **X** to execute AI corrections (9 anchors only)

### Layout System Toggle

- Press **T** to toggle intent-based layout (auto-disables AI)
- When toggled, automatically re-enables AI

### Console Logging

Layout systems log to console with emoji indicators:
- `🎯` - Intent-based layout operations
- `🤖` - AI agent operations
- `📐` - Layout measurements
- `⚠️` - Positioning issues
- `✅` - Successful operations

---

## Summary

FullSail Scaffold combines three sophisticated systems:

1. **Intent-Based Layout (LISA)**: Semantic positioning that compiles to actual coordinates
2. **AI Agent System**: Elements with personalities and spatial awareness
3. **Plugin Architecture**: Clean, extensible engine design

The architecture enables responsive game UI development with web-like abstractions while maintaining game engine performance and flexibility. The AI-driven approach allows for automatic conflict resolution and layout optimization, making the system adaptable to various screen sizes and element configurations.

Key architectural strengths:
- Clean separation via plugins
- Extensible component system
- Multiple layout strategy options
- Comprehensive testing framework
- AI-assisted spatial analysis
- Responsive by design

