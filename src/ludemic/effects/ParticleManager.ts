/**
 * ParticleManager - Manages particle effects for the game
 *
 * Handles creation, updating, and cleanup of particle effects.
 * Now powered by the advanced ParticleSystem for better visuals.
 */

import { Container } from "pixi.js";
import {
  ParticleSystem,
  deepCloneConfig,
  DEFAULT_PARTICLE_CONFIG,
} from "../../packages/pixi-particle-editor";

export interface ParticleConfig {
  x: number;
  y: number;
  color: number;
  size: number;
  velocityX: number;
  velocityY: number;
  lifetime: number; // in seconds
}

export class ParticleManager {
  private static instance: ParticleManager;
  private particleContainer: Container;
  private particleSystem?: ParticleSystem;

  private constructor(particleContainer: Container) {
    this.particleContainer = particleContainer;
  }

  /**
   * Initialize the ParticleManager singleton
   * @param particleContainer - Container to add particles to (should be behind game objects)
   * @param forceReinit - Force re-initialization even if instance exists (for level transitions)
   */
  public static initialize(
    particleContainer: Container,
    forceReinit = false,
  ): ParticleManager {
    if (!ParticleManager.instance || forceReinit) {
      // Clear old particles if reinitializing
      if (ParticleManager.instance) {
        ParticleManager.instance.clear();
      }
      ParticleManager.instance = new ParticleManager(particleContainer);

      // Initialize the advanced particle system
      ParticleManager.instance.particleSystem = new ParticleSystem(
        "/assets/vfx/",
      );
      particleContainer.addChild(ParticleManager.instance.particleSystem);

    }
    return ParticleManager.instance;
  }

  /**
   * Get the ParticleManager singleton instance
   */
  public static getInstance(): ParticleManager {
    if (!ParticleManager.instance) {
      throw new Error(
        "ParticleManager not initialized. Call initialize() first.",
      );
    }
    return ParticleManager.instance;
  }

  /**
   * Get the particle container for coordinate transformations
   */
  public getContainer(): Container {
    return this.particleContainer;
  }

  /**
   * Create a burst of particles at a specific position
   * @param x - X position
   * @param y - Y position
   * @param count - Number of particles to spawn
   * @param config - Particle configuration (color, size, lifetime, etc.)
   */
  public createBurst(
    x: number,
    y: number,
    count: number,
    config: {
      color?: number;
      size?: number;
      speed?: number;
      lifetime?: number;
    } = {},
  ): void {
    if (!this.particleSystem) {

      return;
    }

    const {
      color = 0x2d5016, // Dark green
      size = 4,
      speed = 5,
      lifetime = 1.0,
    } = config;

    // Create advanced particle configuration
    const particleConfig = deepCloneConfig(DEFAULT_PARTICLE_CONFIG);

    // Convert hex color to RGB
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;

    // Configure burst effect
    particleConfig.textureName = "white-circle.png"; // Use a soft circle texture
    particleConfig.burst = true; // All particles at once
    particleConfig.maxParticles = count;
    particleConfig.particleLifetime = lifetime;
    particleConfig.emitterLifetime = 0; // Instant burst
    particleConfig.loop = false;
    particleConfig.emitting = true;

    // Appearance
    particleConfig.colorStart = { r, g, b };
    particleConfig.colorEnd = { r, g, b };
    particleConfig.alphaStart = 1.0;
    particleConfig.alphaEnd = 0.0;
    particleConfig.blendMode = "normal";

    // Size
    particleConfig.sizeMode = "pixels";
    particleConfig.sizeStartPixels = size;
    particleConfig.sizeEndPixels = size * 0.5;

    // Movement - radial burst in all directions
    particleConfig.angle = 0;
    particleConfig.angleVariance = 360;
    particleConfig.speed = speed;
    particleConfig.speedVariance = speed * 0.3;
    particleConfig.acceleration = -speed * 0.5; // Slow down over time
    particleConfig.gravity = 0;

    // Rotation
    particleConfig.rotationStart = 0;
    particleConfig.rotationSpeed = 0;

    // Create the spawner (it will auto-emit and destroy itself)
    this.particleSystem
      .createSpawner(particleConfig, x, y, `Burst_${Date.now()}`)
      .catch((err) => {

      });

    console.log(
      `[ParticleManager] 💥 Created burst of ${count} particles at (${x}, ${y})`,
    );
  }

  /**
   * Create fast confetti effect across the screen (for level complete celebration)
   * More energetic and faster than the burst effect
   * @param viewportWidth - Width of the viewport
   * @param viewportHeight - Height of the viewport
   */
  public createConfetti(viewportWidth: number, viewportHeight: number): void {
    if (!this.particleSystem) {

      return;
    }

    const confettiColors = [
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
    ];

    // Create multiple spawners across the top of the screen
    const spawnerCount = 5;
    const spacing = viewportWidth / (spawnerCount + 1);

    for (let i = 0; i < spawnerCount; i++) {
      const x = spacing * (i + 1);
      const y = -50;

      // Random color for this spawner
      const color =
        confettiColors[Math.floor(Math.random() * confettiColors.length)];

      const particleConfig = deepCloneConfig(DEFAULT_PARTICLE_CONFIG);

      // Configure confetti effect
      particleConfig.textureName = "circle_05.png";
      particleConfig.burst = false; // Continuous spawn
      particleConfig.maxParticles = 200;
      particleConfig.particleLifetime = 2.0;
      particleConfig.emitterLifetime = 0.5; // Spawn for 0.5 seconds
      particleConfig.spawnRate = 80; // Particles per second
      particleConfig.loop = false;
      particleConfig.emitting = true;

      // Appearance - use the random color
      particleConfig.colorStart = color;
      particleConfig.colorEnd = color;
      particleConfig.alphaStart = 1.0;
      particleConfig.alphaEnd = 0.3;
      particleConfig.blendMode = "normal";

      // Size - larger particles
      particleConfig.sizeMode = "pixels";
      particleConfig.sizeStartPixels = 8;
      particleConfig.sizeEndPixels = 4;

      // Movement - fall down with horizontal spread
      particleConfig.angle = 90; // Down
      particleConfig.angleVariance = 30; // Spread
      particleConfig.speed = 8;
      particleConfig.speedVariance = 3;
      particleConfig.acceleration = 0;
      particleConfig.gravity = 0.5; // Fall faster

      // Rotation for more dynamic look
      particleConfig.rotationStart = 0;
      particleConfig.rotationSpeed = 5;
      particleConfig.rotationDirection = "random";

      // Create the spawner
      this.particleSystem
        .createSpawner(particleConfig, x, y, `Confetti_${i}_${Date.now()}`)
        .catch((err) => {

        });
    }
  }

  /**
   * Update all particles
   * @param deltaTime - Time since last frame (in seconds) - Note: Passed as Ticker object internally
   */
  public update(deltaTime: number): void {
    if (this.particleSystem) {
      // The ParticleSystem expects a Ticker object, but we receive deltaTime
      // Create a mock Ticker object with the deltaTime property
      const mockTicker = { deltaTime: deltaTime * 60 } as any;
      this.particleSystem.update(mockTicker);
    }
  }

  /**
   * Clear all particles
   */
  public clear(): void {
    if (this.particleSystem) {
      this.particleSystem.clear();

    }
  }
}
