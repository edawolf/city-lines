### Ludemic Game Engine — Context and Development Guide

This repository contains the canonical context and design documentation for the Ludemic Game Engine. Start here to understand the philosophy, architecture, and development workflow that guide all engine and game work.



## Overview

The Ludemic Game Engine is a deterministic, high-performance web/mobile engine with a custom Entity Component System (ECS) and developer-friendly APIs. The project emphasizes LLM-safe, declarative configuration and robust validation for AI-assisted workflows.

- **Core technologies**: TypeScript, Phaser 3, custom ECS (struct-of-arrays), Zod, Vite/Bun, Bun Test & Sinon
- **Key properties**: deterministic simulation, 60fps mobile target with 1000+ entities, validated JSON configuration, and debug-first tooling


## Ludemic Design Principles

The engine encodes a set of ludemic principles—foundational ideas about fun, clarity, and player expression:

- **Miyamoto's Gameplay Intuition**: feel-first mechanics; prioritize responsive input and satisfying feedback.
- **Ki-Sho-Ten-Ketsu Progression**: a four-act structure for introducing and evolving mechanics.
- **Jonathan Blow's Puzzle Variety**: orthogonal complexity; new elements should interact with all prior elements.
- **Aonuma's Freedom Architecture**: non-linear skill expression with multiple valid solution paths.
- **Lucas Pope's Deduction Engine**: information synthesis where players reach conclusions from scattered signals.
- **Balatro's Viral Dopamine Architecture**: multiplicative reward loops and synergy stacking.
- **Korean Mobile Optimization**: retention-centered systems, daily engagement, and social mechanics.


## LISA: Ludemic Instruction Set Architecture

LISA is an "assembly language" for mechanics. It composes atomic instructions across three layers to build complex gameplay:

- **Mechanical**: state and flow control, entity ops (e.g., `SET`, `TRIG`, `SPAWN`)
- **Strategic**: reward, flow state, risk/opportunity (e.g., `REWARD`, `EXTEND`, `RISK`)
- **Narrative**: information flow, relationships, emotion (e.g., `REVEAL`, `TRUST`, `EMPATHY`)

LISA enables declarative design that is safe to generate and validate, supporting deterministic simulation and testability.


## Architecture at a Glance

- **Dual API Design**
  - Low-level ECS: struct-of-arrays for cache efficiency and minimal GC
  - High-level components: object-oriented facade that bridges down to the ECS

- **Layout & UI**
  - Ludemic Layout System for responsive, semantic interfaces
  - Mobile viewport management with safe-area handling and Safari-focused workarounds

- **Difficulty Curve Engine**
  - Ki-Sho-Ten-Ketsu-inspired progression with JSON-configurable ludemes
  - Emphasis on musical composition principles to sustain player flow


## Development Workflow


- **Testing**
  - Headless Phaser setup to isolate logic from rendering
  - Sinon v20 sandboxes and fake timers per test for deterministic time control
  - Manual stepping of the game loop to verify time-based behavior (tweens, physics)

- **Typical test commands**

```bash
bun test
bun test:watch
bun test:ci
```

Note: Asset loading is faked in tests for speed and focus.


## How to Use This Context

1. Read the documents end-to-end to internalize the project's mental model.
2. When proposing or implementing features, reference the documents listed below to keep designs declarative and aligned.
3. Validate mechanics and content through LISA-aligned, JSON-based configurations wherever possible.
4. Write tests that leverage fake timers and headless loops to preserve determinism.


## Game Development Workflow: Idea to Implementation

Follow this pipeline to transform a game concept into production-ready code:

### Step 1: Generate LISA Assembly Baseline
Reference `LUDEMIC_IDEA_TO_LISA.mdc` to compile your game concept into LISA assembly:
- **Input**: High-level gameplay description (e.g., "trivia game with time pressure and scoring multipliers")
- **Output**: LISA assembly program with mechanical, strategic, and narrative layers + emergent behavior analysis
- **Purpose**: Translate abstract ideas into executable gameplay architecture

### Step 2: Expand to Full Game Design Document
Use `LUDEMIC_GDD_PROPOSAL.mdc` to generate a comprehensive GDD from the LISA assembly:
- **Input**: LISA assembly program from Step 1
- **Output**: Production-ready GDD with systems design, progression, balance mechanics, monetization, success metrics
- **Purpose**: Create detailed specification covering all game systems and player motivations

### Step 3: Refine Through Iterative Validation
Apply `LUDEMIC_FUN_EXPANDER_AGENT.mdc` to improve the design through 7 validation stages:
- **Input**: Game design from Step 2
- **Output**: Refined design validated through Designer ↔ Judge cycles until convergence (all scores ≥8)
- **Purpose**: Ensure core loop is fun before building; validate at each milestone
- **Stages**: Initial Design → Evaluation → Revision → Evaluation → Revision → Convergence Check → Final Output

### Step 4: Generate Gameplay-First Implementation Plan
Reference `LUDEMIC_IMPLEMENTATION_PLAN.mdc` to create a phased development roadmap:
- **Input**: Validated GDD from Step 3
- **Output**: 5-phase implementation plan with file structures, code templates, validation gates
- **Purpose**: Prove gameplay first; add complexity incrementally with designer validation at each milestone
- **Phases**: Minimal Prototype → Core Loop → Engagement Systems → Replayability → Strategic Depth

### Step 5: Build the Game
Execute the implementation plan with validation checkpoints:
- Use file structures and code templates from Step 4
- Build one phase at a time
- Run designer playtests at each validation gate
- Only proceed to next phase after current phase feels fun
- Reference `SINON_TESTING.mdc` for test-driven development

### Example Flow
```
Idea: "Daily word puzzle with multipliers"
  ↓ (LUDEMIC_IDEA_TO_LISA.mdc)
LISA Assembly: scoring system with REWARD → ESCALATE → EXTEND loops
  ↓ (LUDEMIC_GDD_PROPOSAL.mdc)
GDD: Core loop, modifier system, progression tracking, retention mechanics
  ↓ (LUDEMIC_FUN_EXPANDER_AGENT.mdc)
Refined GDD: Validated through 7 stages, all scores ≥8, ready for production
  ↓ (LUDEMIC_IMPLEMENTATION_PLAN.mdc)
Implementation Plan: Phase 1-5 with validation gates, file structures, code templates
  ↓ (Development)
Production Game: Built incrementally with validated fun at each milestone
```

This workflow ensures you **prove the game is fun before investing in complexity**, preventing wasted effort on unfun mechanics.


## Document Map (this repo)

### Core Documentation
- `LUDEMIC_GAME_ENGINE .md`: Engine purpose, scope, and core tenets

### SudoLang Design Documents (.sudo)
- `sudolang.sudo.md`: SudoLang specification and style guide
- `LUDEMIC_GAMEPLAY_EVAL.mdc`: Master ludologist role for analyzing gameplay through ludemic patterns
- `LUDEMIC_IDEA_TO_LISA.mdc`: Compiler translating gameplay concepts → LISA assembly programs
- `LUDEMIC_GDD_PROPOSAL.mdc`: Generator for production-ready Game Design Documents
- `LUDEMIC_IMPLEMENTATION_PLAN.mdc`: Gameplay-first development roadmap with validation gates
- `LUDEMIC_UI_ENHANCEMENT.mdc`: Premier UI designer role blending Apple/Nintendo philosophies
- `SINON_TESTING.mdc`: Testing framework guide for Phaser + TypeScript + Bun

### Legacy Markdown Documents (.md)
- `LUDEMIC_INSTRUCTION_SET_ARCHITECTURE(LISA) .md`: LISA instruction set and patterns
- `LUDEMIC_LAYOUT_SYSTEM.md`: Layout system concepts and responsive semantics
- `LUDEMIC_MOBILE_VIEWPORT .md`: Mobile viewport management and safe-area guidance
- `LUDEMIC_DIFFICULTY_CURVE .md`: Difficulty progression engine and configuration

### Sample Documents
- `SAMPLE_GDD.md`: Example Game Design Document structure (Coffee Toast Trivia)
- `SAMPLE_IMPLEMENTATION_PLAN_GAMEPLAY_FIRST.md`: Example phased development plan

### Development Guides
- `LUDEMIC_FUN_EXPANDER_AGENT.mdc`: 7-stage gameplay refinement agent with validation gates
- `PHASER_CLAUDE_INTEGRATION_GUIDE.md`: Integrating LLMs with Phaser scene architecture
- `PHASER_API_DOC.MD`: Handy Phaser API notes and engine integration details
- `JAVASCRIPT_GUIDE.MD`: JavaScript/TypeScript style guidance and patterns
- `codegen_instructions.md`: Gemini API guidance for correct, current SDK usage


## Contributing

- Keep updates declarative and grounded in the documents above; prefer expanding LISA and schemas over ad-hoc logic.
- When adding mechanics, describe their LISA mapping and interactions with existing instructions.
- For tests, use Sinon sandboxes per test and prefer fake timers with explicit loop stepping for determinism.
- Submit small, focused PRs with clear rationale tied to specific documents in this repo.


## License

TBD.


