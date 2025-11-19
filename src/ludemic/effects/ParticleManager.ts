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
import { PARTICLE_CONFIG } from "../config/particle-config";

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

      // CRITICAL: Make ParticleSystem non-interactive so it doesn't block clicks
      ParticleManager.instance.particleSystem.eventMode = "none";
      ParticleManager.instance.particleSystem.interactiveChildren = false;

      particleContainer.addChild(ParticleManager.instance.particleSystem);

      console.log(
        "[ParticleManager] 🎨 Initialized with advanced ParticleSystem (non-interactive)",
      );
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
      console.warn("[ParticleManager] ⚠️ ParticleSystem not initialized!");
      return;
    }

    const {
      color = 0xffffff, // BRIGHT WHITE for debugging
      size = 50, // HUGE for debugging
      speed = 5,
      lifetime = 1.0,
    } = config;

    // Create advanced particle configuration
    const particleConfig = deepCloneConfig(DEFAULT_PARTICLE_CONFIG);

    // Convert hex color to RGB
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;

    // Configure burst effect using centralized tile rotation settings
    const burstConfig = PARTICLE_CONFIG.TILE_ROTATION;

    particleConfig.textureName = burstConfig.textureName;
    particleConfig.burst = true; // All particles at once
    particleConfig.maxParticles = count;
    particleConfig.particleLifetime = lifetime;
    particleConfig.emitterLifetime = 0.1; // Very short emission time (0 can cause issues)
    particleConfig.loop = false;
    particleConfig.emitting = true;
    particleConfig.autoPlay = true; // Start immediately

    // Appearance
    particleConfig.colorStart = { r, g, b };
    particleConfig.colorEnd = { r, g, b };
    particleConfig.alphaStart = burstConfig.alphaStart;
    particleConfig.alphaEnd = burstConfig.alphaEnd;
    particleConfig.blendMode = burstConfig.blendMode;

    // Size
    particleConfig.sizeMode = "pixels";
    particleConfig.sizeStartPixels = size;
    particleConfig.sizeEndPixels = size * 0.5;

    // Movement - radial burst in all directions
    particleConfig.angle = 0;
    particleConfig.angleVariance = burstConfig.angleVariance;
    particleConfig.speed = speed;
    particleConfig.speedVariance = burstConfig.speedVariance;
    particleConfig.acceleration = -speed * burstConfig.accelerationFactor;
    particleConfig.gravity = burstConfig.gravity;

    // Rotation
    particleConfig.rotationStart = 0;
    particleConfig.rotationSpeed = 0;

    // NOTE: x,y are already in particle container's local space
    // ParticleSystem expects coordinates relative to itself (which is at 0,0 in the container)
    // So we can use x,y directly

    // Create the spawner (it will auto-emit and destroy itself)
    this.particleSystem
      .createSpawner(particleConfig, x, y, `Burst_${Date.now()}`)
      .catch((err) => {
        console.error("[ParticleManager] ❌ Failed to create burst:", err);
      });
  }

  /**
   * Create fast confetti effect across the screen (for level complete celebration)
   * More energetic and faster than the burst effect
   * @param viewportWidth - Width of the viewport
   * @param viewportHeight - Height of the viewport
   */
  public createConfetti(viewportWidth: number, viewportHeight: number): void {
    if (!this.particleSystem) {
      console.warn("[ParticleManager] ⚠️ ParticleSystem not initialized!");
      return;
    }

    // Use centralized confetti config
    const confettiConfig = PARTICLE_CONFIG.WIN_CONFETTI;
    const confettiColors = PARTICLE_CONFIG.CONFETTI_COLORS;

    // Create multiple spawners across the top of the screen
    const spawnerCount = confettiConfig.spawnerCount;
    const spacing = viewportWidth / (spawnerCount + 1);

    for (let i = 0; i < spawnerCount; i++) {
      const x = spacing * (i + 1);
      const y = -50;

      // Random color for this spawner
      const color =
        confettiColors[Math.floor(Math.random() * confettiColors.length)];

      const particleConfig = deepCloneConfig(DEFAULT_PARTICLE_CONFIG);

      // Configure confetti effect using centralized settings
      particleConfig.textureName = confettiConfig.textureName;
      particleConfig.burst = false; // Continuous spawn
      particleConfig.maxParticles = confettiConfig.particlesPerSpawner;
      particleConfig.particleLifetime = confettiConfig.particleLifetime;
      particleConfig.emitterLifetime = confettiConfig.emitterLifetime;
      particleConfig.spawnRate = confettiConfig.spawnRate;
      particleConfig.loop = false;
      particleConfig.emitting = true;

      // Appearance - use the random color
      particleConfig.colorStart = color;
      particleConfig.colorEnd = color;
      particleConfig.alphaStart = 1.0;
      particleConfig.alphaEnd = 0.3;
      particleConfig.blendMode = "normal";

      // Size - from config
      particleConfig.sizeMode = "pixels";
      particleConfig.sizeStartPixels = confettiConfig.sizeStart;
      particleConfig.sizeEndPixels = confettiConfig.sizeEnd;

      // Movement - fall down with horizontal spread
      particleConfig.angle = 90; // Down
      particleConfig.angleVariance = confettiConfig.angleSpread;
      particleConfig.speed = confettiConfig.speed;
      particleConfig.speedVariance = confettiConfig.speedVariance;
      particleConfig.acceleration = 0;
      particleConfig.gravity = confettiConfig.gravity;

      // Rotation for more dynamic look
      particleConfig.rotationStart = 0;
      particleConfig.rotationSpeed = confettiConfig.rotationSpeed;
      particleConfig.rotationDirection = "random";

      // Create the spawner
      this.particleSystem
        .createSpawner(particleConfig, x, y, `Confetti_${i}_${Date.now()}`)
        .catch((err) => {});
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
