# Particle Editor Integration Guide

This guide explains how to integrate the PixiJS Particle Editor package into your pixi-scaffold project.

## Quick Start

### 1. Copy Package Files

Copy the `packages/pixi-particle-editor/` folder to your project:

```bash
# From the source project
cp -r packages/pixi-particle-editor /path/to/your/project/packages/

# Copy VFX assets
cp -r public/assets/vfx /path/to/your/project/public/assets/
```

### 2. Install Dependencies

```bash
npm install pixi.js@^8.8.1 tweakpane@^4.0.5
# or
bun add pixi.js@^8.8.1 tweakpane@^4.0.5
```

### 3. TypeScript Configuration

Ensure your `tsconfig.json` includes the package:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@pixi-scaffold/particle-editor": ["./packages/pixi-particle-editor/index.ts"]
    }
  }
}
```

## Usage Scenarios

### Scenario 1: Runtime Particle Effects (No Editor)

Use this when you have pre-made VFX files and just want to play them in your game:

```typescript
import { ParticleSystem } from './packages/pixi-particle-editor';
import { Application } from 'pixi.js';

// Create your PixiJS app
const app = new Application();
await app.init({ width: 800, height: 600 });
document.body.appendChild(app.canvas);

// Create particle system
const particles = new ParticleSystem('/assets/vfx/');
app.stage.addChild(particles);

// Load a saved VFX configuration
const explosionVFX = await fetch('/effects/explosion.json').then(r => r.json());
await particles.loadVFX(explosionVFX);

// Update in your game loop
app.ticker.add((time) => {
  particles.update(time);
});
```

### Scenario 2: With Ludemic/CreationEngine Architecture

If you're using the CreationEngine architecture (like in the source project):

```typescript
import { ParticleEditorScreen, setEngine } from './packages/pixi-particle-editor';
import { engine } from './app/getEngine';

// Set the engine instance so the editor can access it
setEngine(engine());

// Navigate to the particle editor
await engine().navigation.showScreen(ParticleEditorScreen);
```

### Scenario 3: Standalone Editor Integration

If you want to add a particle editor button to your game menu:

```typescript
import { ParticleEditorScreen, setEngine } from './packages/pixi-particle-editor';

// In your MainScreen or MenuScreen
const editorButton = new Button('Particle Editor');
editorButton.onPress.connect(() => {
  // Set up the editor
  setEngine(myGameEngine); // Pass your engine instance
  
  // Show the editor screen
  this.parent?.addChild(new ParticleEditorScreen());
});
```

### Scenario 4: Custom Engine Adapter

If you don't use the CreationEngine architecture, you can create an adapter:

```typescript
// Create an adapter for your engine
const engineAdapter = {
  renderer: myApp.renderer,
  canvas: myApp.canvas,
  navigation: {
    showScreen: async (ScreenClass: any) => {
      // Your navigation logic here
      const screen = new ScreenClass();
      myApp.stage.addChild(screen);
      await screen.show();
    }
  }
};

// Set the adapter
setEngine(engineAdapter);

// Now you can use the ParticleEditorScreen
const editor = new ParticleEditorScreen();
myApp.stage.addChild(editor);
await editor.show();
```

## Customization

### Custom VFX Assets Path

```typescript
// Default is '/assets/vfx/'
const particles = new ParticleSystem('/my-custom-path/particles/');
```

### Hiding the Crosshair in Production

The ParticleSystem shows crosshairs for debugging. To hide them:

```typescript
const particles = new ParticleSystem();
await particles.loadVFX(vfxData);

// Hide all crosshairs
particles.getSpawners().forEach(spawner => {
  spawner.crosshair.visible = false;
});
```

### Creating Particles Programmatically

```typescript
import { ParticleSystem, DEFAULT_PARTICLE_CONFIG, deepCloneConfig } from './packages/pixi-particle-editor';

const particles = new ParticleSystem();
myContainer.addChild(particles);

// Create a custom config
const fireConfig = deepCloneConfig(DEFAULT_PARTICLE_CONFIG);
fireConfig.textureName = 'fire.png';
fireConfig.colorStart = { r: 255, g: 200, b: 0 };
fireConfig.colorEnd = { r: 255, g: 50, b: 0 };
fireConfig.alphaStart = 1.0;
fireConfig.alphaEnd = 0.0;
fireConfig.sizeMode = 'pixels';
fireConfig.sizeStartPixels = 40;
fireConfig.sizeEndPixels = 10;
fireConfig.speed = 2;
fireConfig.angle = 270; // Up
fireConfig.angleVariance = 30;
fireConfig.blendMode = 'add';
fireConfig.particleLifetime = 1.5;
fireConfig.spawnRate = 50;

// Create spawner at position (400, 300)
await particles.createSpawner(fireConfig, 400, 300, 'Fire Effect');

// Update in game loop
app.ticker.add((time) => particles.update(time));
```

## VFX File Format

Saved VFX files are JSON with this structure:

```typescript
interface VFXData {
  version: string;
  timestamp: string;
  spawners: Array<{
    id: string;
    name: string;
    position: { x: number; y: number };
    visible: boolean;
    config: ParticleConfig;
  }>;
}
```

You can edit these files manually or programmatically to create variations of effects.

## Performance Tips

1. **Limit Max Particles**: Keep `maxParticles` reasonable (500-1000 per spawner)
2. **Use Texture Atlases**: Consider using texture atlases for VFX textures
3. **Blend Modes**: `add` and `screen` blend modes are GPU-intensive
4. **Object Pooling**: For high-performance games, consider implementing object pooling
5. **Culling**: Hide particles that are off-screen

## Troubleshooting

### "Engine not set" Error

```typescript
// Make sure to call setEngine() before using ParticleEditorScreen
import { setEngine } from './packages/pixi-particle-editor';
setEngine(myEngine);
```

### Textures Not Loading

- Verify VFX assets are in `public/assets/vfx/`
- Check browser console for 404 errors
- Ensure paths match: default is `/assets/vfx/[textureName]`

### Editor GUI Not Showing

- Ensure Tweakpane is installed: `npm install tweakpane@^4.0.5`
- Check for JavaScript errors in console
- Verify the editor screen's `show()` method is called

### Particles Not Visible

- Check `alphaStart` is > 0
- Verify `emitting` is set to `true`
- Check blend mode isn't causing issues with background
- Ensure spawner is within viewport bounds

## Examples

### Example: One-Shot Explosion

```typescript
const explosionConfig = deepCloneConfig(DEFAULT_PARTICLE_CONFIG);
explosionConfig.textureName = 'explode.png';
explosionConfig.burst = true; // All particles at once
explosionConfig.maxParticles = 50;
explosionConfig.particleLifetime = 0.8;
explosionConfig.emitterLifetime = 0; // Instant
explosionConfig.loop = false; // Don't repeat
explosionConfig.speed = 8;
explosionConfig.angleVariance = 360; // All directions
explosionConfig.blendMode = 'add';
explosionConfig.colorStart = { r: 255, g: 255, b: 255 };
explosionConfig.colorEnd = { r: 255, g: 100, b: 0 };

await particles.createSpawner(explosionConfig, x, y, 'Explosion');
```

### Example: Continuous Fire

```typescript
const fireConfig = deepCloneConfig(DEFAULT_PARTICLE_CONFIG);
fireConfig.textureName = 'fire.png';
fireConfig.burst = false; // Continuous
fireConfig.loop = true; // Keep going
fireConfig.spawnRate = 60;
fireConfig.particleLifetime = 1.2;
fireConfig.angle = 270; // Up
fireConfig.angleVariance = 20;
fireConfig.speed = 3;
fireConfig.gravity = -0.2; // Float upward
fireConfig.blendMode = 'add';
fireConfig.colorStart = { r: 255, g: 200, b: 50 };
fireConfig.colorEnd = { r: 100, g: 0, b: 0 };
fireConfig.alphaEnd = 0;

await particles.createSpawner(fireConfig, x, y, 'Fire');
```

### Example: Rain

```typescript
const rainConfig = deepCloneConfig(DEFAULT_PARTICLE_CONFIG);
rainConfig.textureName = 'rain.png';
rainConfig.burst = false;
rainConfig.loop = true;
rainConfig.spawnRate = 100;
rainConfig.maxParticles = 500;
rainConfig.particleLifetime = 2.0;
rainConfig.angle = 90; // Down
rainConfig.angleVariance = 5;
rainConfig.speed = 12;
rainConfig.gravity = 0.5;
rainConfig.sizeMode = 'pixels';
rainConfig.sizeStartPixels = 2;
rainConfig.sizeEndPixels = 2;
rainConfig.alphaStart = 0.6;
rainConfig.alphaEnd = 0.6;
rainConfig.colorStart = { r: 150, g: 180, b: 255 };
rainConfig.colorEnd = { r: 150, g: 180, b: 255 };

await particles.createSpawner(rainConfig, screenWidth / 2, -50, 'Rain');
```

## Support

For issues or questions:
1. Check the main README.md for feature documentation
2. Review the TypeScript types in `types.ts`
3. Look at example VFX files in your saved effects
4. Check console for error messages

## License

This package is provided as part of the pixi-scaffold ecosystem.

