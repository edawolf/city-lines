/**
 * Particle Configuration
 *
 * Centralized particle effect settings for the game.
 * Adjust these values to change particle behavior across the entire game.
 */

export interface ParticleBurstConfig {
  count: number; // Number of particles
  color: number; // Hex color (0xRRGGBB)
  size: number; // Size in pixels
  speed: number; // Speed in pixels/second
  lifetime: number; // How long particles live (seconds)
  textureName: string; // Particle sprite to use
  angleVariance: number; // Spread angle (degrees)
  speedVariance: number; // Speed randomness (0-1)
  accelerationFactor: number; // Deceleration (speed * this)
  gravity: number; // Downward pull
  blendMode: "normal" | "add" | "multiply" | "screen";
  alphaStart: number; // Starting alpha (0-1)
  alphaEnd: number; // Ending alpha (0-1)
}

export interface ParticleConfettiConfig {
  spawnerCount: number; // How many confetti spawners
  particlesPerSpawner: number; // Max particles per spawner
  particleLifetime: number; // How long each particle lives
  emitterLifetime: number; // How long spawner emits
  spawnRate: number; // Particles per second
  sizeStart: number; // Starting size (pixels)
  sizeEnd: number; // Ending size (pixels)
  speed: number; // Fall speed
  speedVariance: number; // Speed randomness
  gravity: number; // Downward pull
  angleSpread: number; // Spread angle (degrees)
  rotationSpeed: number; // Spin speed
  textureName: string; // Particle sprite to use
}

/**
 * All particle configurations in one place
 */
export const PARTICLE_CONFIG = {
  /**
   * TILE ROTATION - Small sparkle burst when rotating a tile
   */
  TILE_ROTATION: {
    count: 70,
    color: 0x4caf50, // Green (matches road theme)
    size: 50,
    speed: 8,
    lifetime: 0.6,
    textureName: "light_puff.png",
    angleVariance: 360, // Full circle burst
    speedVariance: 0.3, // 30% speed variation
    accelerationFactor: 0.1, // Gentle slowdown
    gravity: 0, // No gravity
    blendMode: "screen" as const,
    alphaStart: 1.0,
    alphaEnd: 0.0,
  } as ParticleBurstConfig,

  /**
   * WIN CONFETTI - Big celebration for level complete
   */
  WIN_CONFETTI: {
    spawnerCount: 5,
    particlesPerSpawner: 200,
    particleLifetime: 2.0,
    emitterLifetime: 0.5,
    spawnRate: 80,
    sizeStart: 8,
    sizeEnd: 4,
    speed: 8,
    speedVariance: 3,
    gravity: 0.5,
    angleSpread: 30,
    rotationSpeed: 5,
    textureName: "circle_05.png",
  } as ParticleConfettiConfig,

  /**
   * Confetti colors (10 vibrant colors)
   */
  CONFETTI_COLORS: [
    { r: 255, g: 107, b: 107 }, // Red
    { r: 78, g: 205, b: 196 }, // Cyan
    { r: 255, g: 230, b: 109 }, // Yellow
    { r: 149, g: 225, b: 211 }, // Light green
    { r: 243, g: 129, b: 129 }, // Pink
    { r: 170, g: 150, b: 218 }, // Purple
    { r: 252, g: 186, b: 211 }, // Light pink
    { r: 168, g: 230, b: 207 }, // Mint
    { r: 255, g: 159, b: 67 }, // Orange
    { r: 95, g: 39, b: 205 }, // Deep purple
  ],
};
