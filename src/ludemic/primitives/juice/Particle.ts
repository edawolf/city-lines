import { Container, Graphics } from "pixi.js";

/**
 * Particle
 *
 * A simple visual particle for juice effects.
 * Spawned by ParticleEmitter primitive.
 */
export interface ParticleConfig {
  x: number;
  y: number;
  vx: number; // Velocity x
  vy: number; // Velocity y
  color: number;
  lifetime: number; // Seconds
  size?: number;
  gravity?: number;
  drag?: number;
}

export class Particle extends Container {
  private graphics: Graphics;
  private velocity = { x: 0, y: 0 };
  private lifetime: number;
  private maxLifetime: number;
  private gravity: number;
  private drag: number;

  constructor(config: ParticleConfig) {
    super();

    // Create visual representation
    const size = config.size ?? 4;
    this.graphics = new Graphics().circle(0, 0, size).fill(config.color);
    this.addChild(this.graphics);

    // Set initial position
    this.position.set(config.x, config.y);

    // Set velocity
    this.velocity.x = config.vx;
    this.velocity.y = config.vy;

    // Set lifetime
    this.maxLifetime = config.lifetime;
    this.lifetime = config.lifetime;

    // Physics
    this.gravity = config.gravity ?? 200; // Pixels per second squared
    this.drag = config.drag ?? 0.98; // Velocity multiplier per frame
  }

  /**
   * Update particle physics and lifetime
   */
  update(deltaTime: number): boolean {
    // Update lifetime
    this.lifetime -= deltaTime;

    // Return false if particle is dead
    if (this.lifetime <= 0) {
      return false;
    }

    // Apply gravity
    this.velocity.y += this.gravity * deltaTime;

    // Apply drag
    this.velocity.x *= this.drag;
    this.velocity.y *= this.drag;

    // Update position
    this.x += this.velocity.x * deltaTime;
    this.y += this.velocity.y * deltaTime;

    // Fade out based on lifetime
    const lifetimePercent = this.lifetime / this.maxLifetime;
    this.alpha = lifetimePercent;

    // Scale down based on lifetime
    const scale = 0.5 + lifetimePercent * 0.5;
    this.scale.set(scale);

    return true; // Still alive
  }
}
