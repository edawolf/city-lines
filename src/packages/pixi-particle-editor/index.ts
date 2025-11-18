/**
 * PixiJS Particle Editor Package
 *
 * A professional particle editor and VFX library for PixiJS v8+ applications
 *
 * @example Runtime usage (no editor GUI):
 * ```typescript
 * import { ParticleSystem } from '@pixi-scaffold/particle-editor';
 *
 * const particles = new ParticleSystem();
 * myContainer.addChild(particles);
 *
 * const vfxData = await fetch('/effects/explosion.json').then(r => r.json());
 * await particles.loadVFX(vfxData);
 *
 * app.ticker.add((time) => particles.update(time));
 * ```
 *
 * @example Editor usage (with Tweakpane GUI):
 * ```typescript
 * import { ParticleEditorScreen } from '@pixi-scaffold/particle-editor';
 * import { engine } from './app/getEngine';
 *
 * await engine().navigation.showScreen(ParticleEditorScreen);
 * ```
 */

// Export types
export type {
  ParticleConfig,
  SpawnerData,
  VFXData,
  ParticleInstance,
  Spawner,
} from "./types";

export { DEFAULT_PARTICLE_CONFIG, deepCloneConfig } from "./types";

// Export runtime particle system (no GUI)
export { ParticleSystem } from "./ParticleSystem";

// Export editor screen (requires Tweakpane and engine architecture)
export { ParticleEditorScreen } from "./ParticleEditorScreen";
