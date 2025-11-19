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
  blendMode: "normal" | "add" | "multiply" | "screen"; // Blend mode for particles
  spawnX: number; // Spawn X position as percent of screen width (0.0-1.0)
  spawnY: number; // Spawn Y position as percent of screen height (0.0-1.0)
  angle: number; // Base emission angle (270 = up, 90 = down, 0 = right, 180 = left)
}

/**
 * All particle configurations in one place
 */
export const PARTICLE_CONFIG = {
  /**
   * TILE ROTATION - Small sparkle burst when rotating a tile
   */
  TILE_ROTATION: {
    count: 50,
    color: 0x95d395, // Green (matches road theme)
    size: 90,
    speed: 20,
    lifetime: 0.9,
    textureName: "light_puff.png",
    angleVariance: 360, // Full circle burst
    speedVariance: 0.2, // 30% speed variation
    accelerationFactor: 0.4, // Gentle slowdown
    gravity: 0, // No gravity
    blendMode: "normal" as const,
    alphaStart: 0.2,
    alphaEnd: 0.0,
  } as ParticleBurstConfig,

  /**
   * WIN CONFETTI - Big celebration for level complete
   */
  WIN_CONFETTI: {
    spawnerCount: 5,
    particlesPerSpawner: 100,
    particleLifetime: 1.5,
    emitterLifetime: 0.5,
    spawnRate: 120,
    sizeStart: 40,
    sizeEnd: 8,
    speed: 8,
    speedVariance: 6,
    gravity: 1.0,
    angleSpread: 50,
    rotationSpeed: 12,
    textureName: "rect",
    blendMode: "normal" as const,
    spawnX: 0.5, // Middle of screen (50%)
    spawnY: 1.3, // Bottom of screen (100%)
    angle: 270, // Shoot upward
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
