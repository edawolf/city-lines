# Particle Editor Quick Reference

## Installation

```bash
# Copy package to your project
cp -r packages/pixi-particle-editor /your/project/packages/

# Copy VFX assets
cp -r public/assets/vfx /your/project/public/assets/

# Install dependencies
npm install pixi.js@^8.8.1 tweakpane@^4.0.5
```

## Runtime Usage (No Editor)

```typescript
import { ParticleSystem } from './packages/pixi-particle-editor';

const particles = new ParticleSystem();
myContainer.addChild(particles);

// Load saved VFX
const vfx = await fetch('/effects/my-effect.json').then(r => r.json());
await particles.loadVFX(vfx);

// Update in game loop
app.ticker.add((time) => particles.update(time));
```

## Editor Usage

```typescript
import { ParticleEditorScreen, setEngine } from './packages/pixi-particle-editor';

// Set your engine instance
setEngine(myEngine);

// Show editor
const editor = new ParticleEditorScreen();
myContainer.addChild(editor);
await editor.show();
```

## Programmatic Creation

```typescript
import { ParticleSystem, DEFAULT_PARTICLE_CONFIG, deepCloneConfig } from './packages/pixi-particle-editor';

const particles = new ParticleSystem();
const config = deepCloneConfig(DEFAULT_PARTICLE_CONFIG);

// Customize config
config.textureName = 'fire.png';
config.speed = 5;
config.angle = 270; // degrees
config.blendMode = 'add';
config.particleLifetime = 1.5;

// Create spawner at (x, y)
await particles.createSpawner(config, 400, 300, 'Fire Effect');

// Update
app.ticker.add((time) => particles.update(time));
```

## Key Configuration Properties

| Property | Description | Example |
|----------|-------------|---------|
| `textureName` | Particle texture file | `'fire.png'` |
| `alphaStart` / `alphaEnd` | Opacity over lifetime | `1.0` → `0.0` |
| `sizeMode` | Size calculation | `'pixels'` or `'scale'` |
| `sizeStartPixels` / `sizeEndPixels` | Size in pixels | `40` → `10` |
| `speed` | Initial velocity | `5` |
| `angle` | Emission direction (degrees) | `270` (up) |
| `angleVariance` | Spread cone | `30` |
| `acceleration` | Speed change | `0.5` |
| `gravity` | Downward force | `0.1` |
| `particleLifetime` | How long particles live (seconds) | `1.5` |
| `emitterLifetime` | How long emitter spawns (0=infinite) | `2.0` |
| `spawnRate` | Particles per second | `30` |
| `maxParticles` | Maximum particle count | `500` |
| `blendMode` | Rendering blend | `'normal'`, `'add'`, `'multiply'`, `'screen'` |
| `burst` | All at once vs continuous | `true` / `false` |
| `loop` | Restart when done | `true` / `false` |

## Common Patterns

### Explosion
```typescript
config.burst = true;
config.angleVariance = 360;
config.speed = 8;
config.emitterLifetime = 0;
config.particleLifetime = 0.8;
config.loop = false;
config.blendMode = 'add';
```

### Fire
```typescript
config.burst = false;
config.angle = 270; // up
config.angleVariance = 20;
config.gravity = -0.2; // float
config.blendMode = 'add';
config.loop = true;
```

### Rain
```typescript
config.angle = 90; // down
config.angleVariance = 5;
config.speed = 12;
config.gravity = 0.5;
config.spawnRate = 100;
config.loop = true;
```

### Sparkles
```typescript
config.textureName = 'star.png';
config.angleVariance = 360;
config.speed = 2;
config.rotationSpeed = 5;
config.blendMode = 'add';
config.sizeStartPixels = 20;
config.sizeEndPixels = 5;
```

## Editor Controls

| Control | Action |
|---------|--------|
| **Mouse Wheel** | Zoom viewport |
| **Middle Mouse** | Pan viewport |
| **➕ Add Spawner** | Create new emitter |
| **💾 Save VFX** | Export to JSON |
| **📂 Load VFX** | Import from JSON |
| **🔄 Respawn** | Restart effect |
| **👁️ Toggle** | Show/hide spawner |
| **🗑️ Delete** | Remove spawner |

## Useful Methods

```typescript
// ParticleSystem methods
particles.clear();                    // Remove all spawners
particles.respawnAll();              // Reset all spawners
particles.getParticleCount();        // Get total particle count
particles.getSpawners();             // Get all spawner instances
particles.destroy();                 // Clean up

// Hide crosshairs (for production)
particles.getSpawners().forEach(s => s.crosshair.visible = false);
```

## File Structure

```
packages/pixi-particle-editor/
├── index.ts                    # Main exports
├── ParticleSystem.ts          # Runtime particle system
├── ParticleEditorScreen.ts    # Editor with GUI
├── types.ts                   # TypeScript interfaces
├── package.json               # Package metadata
├── README.md                  # Full documentation
├── INTEGRATION_GUIDE.md       # Integration examples
└── QUICK_REFERENCE.md         # This file
```

## VFX Assets

200+ textures in `/public/assets/vfx/`:
- Explosions, fire, smoke
- Energy, lasers, lightning
- Magic, sparkles, stars
- Combat effects
- Environmental (rain, snow)
- Basic shapes (circles, rings)

## TypeScript Types

```typescript
import type { 
  ParticleConfig,      // Main configuration
  VFXData,            // Save file format
  SpawnerData,        // Individual spawner data
  ParticleInstance,   // Runtime particle
  Spawner            // Runtime spawner
} from './packages/pixi-particle-editor';
```

## Performance Tips

- Keep `maxParticles` under 1000 per spawner
- Use `add` blend mode sparingly (GPU intensive)
- Hide off-screen particles
- Reuse VFX configs with `deepCloneConfig()`
- Consider texture atlases for production

## Troubleshooting

**Textures not loading?**
- Check `/assets/vfx/` exists
- Verify texture name in config

**Editor not showing?**
- Install Tweakpane: `npm i tweakpane@^4.0.5`
- Call `setEngine()` before using editor

**Particles invisible?**
- Check `alphaStart > 0`
- Verify `emitting: true`
- Check blend mode with background

**"Engine not set" error?**
```typescript
import { setEngine } from './packages/pixi-particle-editor';
setEngine(myEngine);
```

