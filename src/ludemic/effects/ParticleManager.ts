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
  private particleContainer: Container;
  private particleSystem?: ParticleSystem;

  constructor(particleContainer: Container) {
    this.particleContainer = particleContainer;

    // Initialize the advanced particle system
    // Use the AssetPack processed path from main{m}/vfx
    this.particleSystem = new ParticleSystem("/assets/main/vfx/");

    // CRITICAL: Make ParticleSystem non-interactive so it doesn't block clicks
    this.particleSystem.eventMode = "none";
    this.particleSystem.interactiveChildren = false;

    particleContainer.addChild(this.particleSystem);
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
      .then(() => {
        console.log("[ParticleManager] ✅ Burst spawner created successfully");
      })
      .catch((err) => {
        console.error("[ParticleManager] ❌ Failed to create burst:", err);
      });
  }

  /**
   * Create fast confetti effect across the screen (for level complete celebration)
   * More energetic and faster than the burst effect
   * @param screenWidth - Width of the screen/viewport
   */
  public createConfetti(screenWidth: number, screenHeight: number): void {
    if (!this.particleSystem) {
      console.warn("[ParticleManager] ⚠️ ParticleSystem not initialized!");
      return;
    }

    // Use centralized confetti config
    const confettiConfig = PARTICLE_CONFIG.WIN_CONFETTI;
    const confettiColors = PARTICLE_CONFIG.CONFETTI_COLORS;

    // Calculate spawn position from config percentages
    const spawnX = screenWidth * confettiConfig.spawnX;
    const spawnY = screenHeight * confettiConfig.spawnY;

    for (let i = 0; i < confettiConfig.spawnerCount; i++) {
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
      particleConfig.autoPlay = true; // Start immediately (CRITICAL!)

      // Appearance - use the random color
      particleConfig.colorStart = color;
      particleConfig.colorEnd = color;
      particleConfig.alphaStart = 1.0;
      particleConfig.alphaEnd = 0.3;
      particleConfig.blendMode = confettiConfig.blendMode || "normal";

      // Size - from config
      particleConfig.sizeMode = "pixels";
      particleConfig.sizeStartPixels = confettiConfig.sizeStart;
      particleConfig.sizeEndPixels = confettiConfig.sizeEnd;

      // Movement - use angle from config
      particleConfig.angle = confettiConfig.angle;
      particleConfig.angleVariance = confettiConfig.angleSpread;
      particleConfig.speed = confettiConfig.speed;
      particleConfig.speedVariance = confettiConfig.speedVariance;
      particleConfig.acceleration = 0;
      particleConfig.gravity = confettiConfig.gravity;

      // Rotation for more dynamic look
      particleConfig.rotationStart = 0;
      particleConfig.rotationSpeed = confettiConfig.rotationSpeed;
      particleConfig.rotationDirection = "random";

      // Create the spawner at the configured position
      this.particleSystem
        .createSpawner(
          particleConfig,
          spawnX,
          spawnY,
          `Confetti_${i}_${Date.now()}`,
        )
        .then(() => {
          // Confetti spawner created
        })
        .catch((err) => {
          console.error(
            `[ParticleManager] ❌ Failed to create confetti spawner ${i}:`,
            err,
          );
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
