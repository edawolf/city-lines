# PixiJS Particle Editor Package

A professional particle editor and VFX library for PixiJS v8+ applications, built with Tweakpane GUI.

## Features

- 🎨 **Visual Particle Editor** - Real-time particle system editing with Tweakpane GUI
- 🖼️ **200+ VFX Textures** - Comprehensive library of particle textures (explosions, smoke, fire, magic, etc.)
- 💾 **Save/Load System** - Export and import particle configurations as JSON
- 🎬 **Multi-Spawner System** - Create complex effects with multiple emitters
- 🔄 **Loop & Burst Modes** - One-shot or continuous effects
- 🎯 **Viewport Controls** - Zoom and pan to precisely position effects

## Installation

### 1. Copy the Package

Copy the entire `packages/pixi-particle-editor` folder to your pixi-scaffold project.

### 2. Copy VFX Assets

Copy the `public/assets/vfx/` folder from this project to your project's `public/assets/` directory.

### 3. Install Dependencies

```bash
npm install pixi.js@^8.8.1 tweakpane@^4.0.5
# or
bun add pixi.js@^8.8.1 tweakpane@^4.0.5
```

## Usage

### Basic Integration

```typescript
import { ParticleEditorScreen } from './packages/pixi-particle-editor';
import { engine } from './app/getEngine';

// Navigate to the particle editor
await engine().navigation.showScreen(ParticleEditorScreen);
```

### Using the Particle System (Runtime)

```typescript
import { ParticleSystem } from './packages/pixi-particle-editor';

// Create a particle system
const particleSystem = new ParticleSystem();
yourContainer.addChild(particleSystem);

// Load a saved VFX configuration
const vfxConfig = await fetch('/path/to/your-effect.json').then(r => r.json());
particleSystem.loadVFX(vfxConfig);

// Update in your game loop
app.ticker.add((time) => {
  particleSystem.update(time);
});
```

## Particle Editor Controls

### Scene Explorer (Left Panel)
- **🆕 New**: Create a new scene (clears all spawners)
- **💾 Save VFX**: Export current scene as JSON
- **📂 Load VFX**: Import a previously saved scene
- **🔄 Respawn**: Restart the selected spawner or all spawners
- **➕ Add Spawner**: Create a new particle emitter at screen center
- **👁️ Toggle Visibility**: Show/hide individual spawners
- **🗑️ Delete**: Remove a spawner

### Tweakpane Controls (Right Panel)

#### Emitter
- **Emit**: Start/stop particle emission
- **Auto Play**: Automatically start emitting on load
- **Spawn Rate**: Particles per second
- **Max Particles**: Maximum particle count
- **Per Wave**: Particles spawned per wave

#### Lifetime
- **🔁 Loop**: Restart emitter after it finishes
- **💥 Burst Mode**: Spawn all particles at once
- **⏱️ Start Delay**: Delay before emitter starts
- **Emitter Life**: How long the emitter spawns particles (0 = infinite)
- **Particle Life**: How long each particle lives

#### Texture
- **Texture Selector**: Choose from 200+ VFX textures
- **Blend Mode**: Normal, Add, Multiply, or Screen

#### Visual
- **Color Start/End**: Particle color interpolation
- **Alpha Start/End**: Opacity interpolation
- **Size Mode**: Pixels or Scale
- **Size Start/End**: Particle size over lifetime
- **Size Variance**: Random size variation

#### Motion
- **Speed**: Base particle velocity
- **Direction**: Emission angle (degrees)
- **Angle Variance**: Spread cone
- **Acceleration**: Speed change over time
- **Gravity**: Downward force
- **Rotation**: Initial rotation, speed, and direction

### Viewport Controls
- **Mouse Wheel**: Zoom in/out (10% - 500%)
- **Middle Mouse Button**: Pan the viewport

## File Structure

```
packages/pixi-particle-editor/
├── README.md                 # This file
├── package.json             # Package metadata
├── index.ts                 # Main export file
├── ParticleEditorScreen.ts  # Full editor screen
├── ParticleSystem.ts        # Runtime particle system
└── types.ts                 # TypeScript interfaces
```

## Dependencies

- **pixi.js** ^8.8.1 - Rendering engine
- **tweakpane** ^4.0.5 - GUI controls (editor only)

## VFX Asset Library

The package includes 200+ professionally sourced particle textures:

- **Explosions**: blast, boom, explode variants
- **Fire & Flames**: fire, flame, heat effects
- **Smoke**: smoke, plume, dust variants
- **Energy**: lasers, lightning, plasma, glow
- **Magic**: sparkles, stars, radial effects
- **Combat**: muzzle flash, blood, dirt
- **Environmental**: rain, snow, splash
- **Basic Shapes**: circles, rings, gradients

All textures are PNG format with transparency, optimized for particle effects.

## Configuration Format

Saved VFX files are JSON with this structure:

```json
{
  "version": "1.0",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "spawners": [
    {
      "id": "spawner_1",
      "name": "Fire Effect",
      "position": { "x": 400, "y": 300 },
      "visible": true,
      "config": {
        "textureName": "fire.png",
        "alphaStart": 1.0,
        "alphaEnd": 0.0,
        "sizeMode": "pixels",
        "sizeStartPixels": 30,
        "sizeEndPixels": 10,
        "speed": 5,
        "angle": 270,
        "particleLifetime": 1.0,
        "spawnRate": 30,
        "blendMode": "add",
        // ... more properties
      }
    }
  ]
}
```

## License

This package is intended for use within pixi-scaffold projects. The VFX texture library is sourced from various public domain and Creative Commons resources.

## Credits

- Built with PixiJS v8
- GUI powered by Tweakpane
- VFX textures from various open-source collections

