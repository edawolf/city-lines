/**
 * ParticleManager - Manages particle effects for the game
 *
 * Handles creation, updating, and cleanup of particle effects.
 * Particles are simple visual effects that fade out over time.
 */

import { Container, Graphics } from "pixi.js";

export interface ParticleConfig {
  x: number;
  y: number;
  color: number;
  size: number;
  velocityX: number;
  velocityY: number;
  lifetime: number; // in seconds
}

class Particle extends Graphics {
  public velocityX: number;
  public velocityY: number;
  public lifetime: number;
  public maxLifetime: number;

  constructor(config: ParticleConfig) {
    super();

    // Draw particle as a circle
    this.circle(0, 0, config.size);
    this.fill(config.color);

    // Set position
    this.x = config.x;
    this.y = config.y;

    // Set velocity
    this.velocityX = config.velocityX;
    this.velocityY = config.velocityY;

    // Set lifetime
    this.lifetime = config.lifetime;
    this.maxLifetime = config.lifetime;
  }

  /**
   * Update particle position and lifetime
   * @param deltaTime - Time since last frame (in seconds)
   * @returns true if particle is still alive, false if it should be removed
   */
  public update(deltaTime: number): boolean {
    // Calculate ease-out factor (starts at 1, approaches 0)
    const lifeProgress = this.lifetime / this.maxLifetime;
    const easeOutFactor = lifeProgress * lifeProgress; // Quadratic ease-out

    // Update position with ease-out velocity
    this.x += this.velocityX * deltaTime * 60 * easeOutFactor;
    this.y += this.velocityY * deltaTime * 60 * easeOutFactor;

    // Update lifetime
    this.lifetime -= deltaTime;

    // Fade out based on remaining lifetime
    this.alpha = Math.max(0, this.lifetime / this.maxLifetime);

    // Return true if still alive
    return this.lifetime > 0;
  }
}

export class ParticleManager {
  private static instance: ParticleManager;
  private particles: Particle[] = [];
  private particleContainer: Container;

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
    const {
      color = 0x2d5016, // Dark green
      size = 2,
      speed = 2,
      lifetime = 1.0,
    } = config;

    for (let i = 0; i < count; i++) {
      // Fully random angle for natural spread (not evenly distributed)
      const angle = Math.random() * Math.PI * 2;
      // Add speed variation (0.5x to 1.5x) for more organic look
      const speedVariation = speed * (0.5 + Math.random());
      const velocityX = Math.cos(angle) * speedVariation;
      const velocityY = Math.sin(angle) * speedVariation;

      const particle = new Particle({
        x,
        y,
        color,
        size,
        velocityX,
        velocityY,
        lifetime,
      });

      this.particles.push(particle);
      this.particleContainer.addChild(particle);
    }

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
  public createConfetti(viewportWidth: number, _viewportHeight: number): void {
    console.log("[ParticleManager] 🎉 Creating FAST confetti celebration!");

    const confettiColors = [
      0xff6b6b, // Red
      0x4ecdc4, // Cyan
      0xffe66d, // Yellow
      0x95e1d3, // Light green
      0xf38181, // Pink
      0xaa96da, // Purple
      0xfcbad3, // Light pink
      0xa8e6cf, // Mint
      0xff9f43, // Orange
      0x5f27cd, // Deep purple
    ];

    const particleCount = 150; // More particles for fuller effect

    for (let i = 0; i < particleCount; i++) {
      // Spawn from top of screen, spread across width
      const x = Math.random() * viewportWidth;
      const y = -50; // Start higher above screen

      // Random color from palette
      const color =
        confettiColors[Math.floor(Math.random() * confettiColors.length)];

      // FASTER confetti - falls down with MORE horizontal drift
      const velocityX = (Math.random() - 0.5) * 8; // Stronger horizontal drift (was 3)
      const velocityY = Math.random() * 8 + 5; // FASTER fall speed: 5-13 (was 2-6)

      // Larger particles for better visibility at high speed
      const size = Math.random() * 6 + 4; // 4-10 pixels (was 3-7)

      // Shorter lifetime - moves fast so doesn't need to last as long
      const lifetime = Math.random() * 1.5 + 1; // 1-2.5 seconds (was 2-4)

      const particle = new Particle({
        x,
        y,
        color,
        size,
        velocityX,
        velocityY,
        lifetime,
      });

      this.particles.push(particle);
      this.particleContainer.addChild(particle);
    }
  }

  /**
   * Update all particles
   * @param deltaTime - Time since last frame (in seconds)
   */
  public update(deltaTime: number): void {
    // Update particles and remove dead ones
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      const isAlive = particle.update(deltaTime);

      if (!isAlive) {
        // Remove particle
        this.particleContainer.removeChild(particle);
        particle.destroy();
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Clear all particles
   */
  public clear(): void {
    this.particles.forEach((particle) => {
      this.particleContainer.removeChild(particle);
      particle.destroy();
    });
    this.particles = [];
  }
}
