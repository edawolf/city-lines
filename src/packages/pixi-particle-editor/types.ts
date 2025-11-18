/**
 * Particle configuration interface
 * Defines all properties for a particle emitter
 */
export interface ParticleConfig {
  // Texture
  textureName: string;

  // Particle Visual
  alphaStart: number;
  alphaEnd: number;
  sizeMode: "pixels" | "scale";
  sizeStartPixels: number;
  sizeEndPixels: number;
  scaleStart: number;
  scaleEnd: number;
  scaleVariance: number;
  colorStart: { r: number; g: number; b: number };
  colorEnd: { r: number; g: number; b: number };

  // Particle Motion
  speed: number;
  speedVariance: number;
  angle: number;
  angleVariance: number;
  acceleration: number;
  gravity: number;
  rotationStart: number;
  rotationSpeed: number;
  rotationVariance: number;
  rotationDirection: "clockwise" | "counter-clockwise" | "random";

  // Lifetime
  emitterStartDelay: number;
  emitterLifetime: number;
  emitterLifetimeVariance: number;
  particleLifetime: number;
  particleLifetimeVariance: number;
  loop: boolean;

  // Emitter
  emitting: boolean;
  burst: boolean;
  spawnRate: number;
  maxParticles: number;
  particlesPerWave: number;

  // Advanced
  blendMode: "normal" | "add" | "multiply" | "screen";
  autoPlay: boolean;
}

/**
 * Spawner data structure for save/load
 */
export interface SpawnerData {
  id: string;
  name: string;
  position: {
    x: number;
    y: number;
  };
  visible: boolean;
  config: ParticleConfig;
}

/**
 * VFX file format
 */
export interface VFXData {
  version: string;
  timestamp: string;
  spawners: SpawnerData[];
}

/**
 * Internal particle instance
 */
export interface ParticleInstance {
  particle: import("pixi.js").Sprite;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  angularVelocity: number;
  startScale: number;
  endScale: number;
  startAlpha: number;
  endAlpha: number;
}

/**
 * Internal spawner instance
 */
export interface Spawner {
  id: string;
  name: string;
  config: ParticleConfig;
  container: import("pixi.js").Container;
  particles: ParticleInstance[];
  texture: import("pixi.js").Texture;
  enabled: boolean;
  spawnX: number;
  spawnY: number;
  crosshair: import("pixi.js").Graphics;

  // Emitter lifetime tracking
  emitterLife: number;
  emitterMaxLife: number;
  isEmitterDead: boolean;
  hasBurst: boolean;
  delayTimer: number;
  hasStarted: boolean;
}

/**
 * Default particle configuration
 */
export const DEFAULT_PARTICLE_CONFIG: ParticleConfig = {
  textureName: "white-circle.png",
  // Particle Visual
  alphaStart: 1.0,
  alphaEnd: 0.0,
  sizeMode: "pixels",
  sizeStartPixels: 30,
  sizeEndPixels: 10,
  scaleStart: 0.02,
  scaleEnd: 0.01,
  scaleVariance: 0.3,
  colorStart: { r: 255, g: 255, b: 255 },
  colorEnd: { r: 255, g: 255, b: 255 },

  // Particle Motion
  speed: 5,
  speedVariance: 0.3,
  angle: 270,
  angleVariance: 30,
  acceleration: 0,
  gravity: 0.1,
  rotationStart: 0,
  rotationSpeed: 0,
  rotationVariance: 0,
  rotationDirection: "random",

  // Lifetime
  emitterStartDelay: 0,
  emitterLifetime: 0,
  emitterLifetimeVariance: 0,
  particleLifetime: 1.0,
  particleLifetimeVariance: 0.2,
  loop: true,

  // Emitter
  emitting: true,
  burst: false,
  spawnRate: 30,
  maxParticles: 1000,
  particlesPerWave: 3,

  // Advanced
  blendMode: "normal",
  autoPlay: true,
};

/**
 * Deep clone a ParticleConfig to avoid shared object references
 */
export function deepCloneConfig(config: ParticleConfig): ParticleConfig {
  return {
    ...config,
    colorStart: { ...config.colorStart },
    colorEnd: { ...config.colorEnd },
  };
}
