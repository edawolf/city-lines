import { Container } from "pixi.js";
import { Primitive } from "../Primitive";
import type { PrimitiveConfig } from "../Primitive";
import { Particle } from "./Particle";

/**
 * ParticleEmitter Primitive (LISA: JUICE + DISPLAY)
 *
 * Spawns visual particles in response to game events.
 * Creates satisfying visual feedback for player actions.
 *
 * LISA Mapping:
 * - JUICE: Add satisfying visual feedback
 * - DISPLAY: Show visual effects
 */
export interface ParticleEmitterConfig extends PrimitiveConfig {
  triggerOn?: string; // Event name to listen for (legacy)
  triggerEvent?: string; // Event name to listen for (preferred)
  particleCount: number; // Number of particles per emission
  color: number; // Particle color (hex)
  lifetime: number; // Particle lifetime in seconds
  spread: number; // Emission angle spread in degrees
  speed: number; // Initial particle speed
  size?: number; // Particle size in pixels
  gravity?: number; // Gravity strength (default 200)
  drag?: number; // Velocity drag (default 0.98)
}

export class ParticleEmitter extends Primitive {
  private entity!: Container;
  private config!: ParticleEmitterConfig;
  private game!: Container & {
    onGame: (event: string, fn: (...args: unknown[]) => void) => void;
    offGame: (event: string, fn: (...args: unknown[]) => void) => void;
    addParticle: (particle: Particle) => void;
    tuningSystem?: any;
  };
  private tuningUnsubscribe?: () => void;

  init(entity: Container, config: ParticleEmitterConfig): void {
    this.entity = entity;
    this.config = config;
    this.game = entity.parent as Container & {
      onGame: (event: string, fn: (...args: unknown[]) => void) => void;
      offGame: (event: string, fn: (...args: unknown[]) => void) => void;
      addParticle: (particle: Particle) => void;
      tuningSystem?: any;
    };

    // Listen for trigger event (support both naming conventions)
    const triggerEvent = this.config.triggerEvent ?? this.config.triggerOn;
    if (triggerEvent) {
      this.game.onGame(triggerEvent, this.emit);
    }

    this.setupTuning();
  }

  private setupTuning(): void {
    // Listen for tuning system parameter changes
    if (this.game.tuningSystem) {
      const handleParameterChange = ({
        key,
        value,
      }: {
        key: string;
        value: any;
      }) => {
        if (key === "particle_count") {
          this.config.particleCount = value;
          console.log(
            `[ParticleEmitter] 🎛️ Particle count updated to ${value}`,
          );
        } else if (key === "particle_speed") {
          this.config.speed = value;
          console.log(
            `[ParticleEmitter] 🎛️ Particle speed updated to ${value}`,
          );
        } else if (key === "particle_lifetime") {
          this.config.lifetime = value;
          console.log(
            `[ParticleEmitter] 🎛️ Particle lifetime updated to ${value}`,
          );
        } else if (key === "enable_particles") {
          // Store enabled state in config
          (this.config as any).enabled = value;
          console.log(
            `[ParticleEmitter] 🎛️ Particles ${value ? "enabled" : "disabled"}`,
          );
        }
      };

      this.game.tuningSystem.on("parameterChanged", handleParameterChange);

      // Store unsubscribe function
      this.tuningUnsubscribe = () => {
        this.game.tuningSystem.off("parameterChanged", handleParameterChange);
      };
    }
  }

  update(): void {
    // No per-frame update needed
  }

  /**
   * Emit particles at the entity's position (or provided position)
   */
  private emit = (targetEntity?: Container) => {
    // Check if particles are enabled via tuning system
    if ((this.config as any).enabled === false) {
      return;
    }

    // Use target entity position if provided, otherwise use emitter's entity position
    const pos = targetEntity?.position ?? this.entity.position;

    // Convert spread from degrees to radians
    const spreadRad = (this.config.spread * Math.PI) / 180;

    for (let i = 0; i < this.config.particleCount; i++) {
      // Random angle within spread
      const angle = Math.random() * spreadRad - spreadRad / 2;

      // Random speed variation (50% to 100% of max speed)
      const speed = this.config.speed * (0.5 + Math.random() * 0.5);

      // Calculate velocity
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      // Create particle
      const particle = new Particle({
        x: pos.x,
        y: pos.y,
        vx,
        vy,
        color: this.config.color,
        lifetime: this.config.lifetime * (0.8 + Math.random() * 0.4), // Random lifetime variation
        size: this.config.size,
        gravity: this.config.gravity,
        drag: this.config.drag,
      });

      // Add particle to game (not to this entity, to game root)
      this.game.addParticle(particle);
    }
  };

  destroy(): void {
    const triggerEvent = this.config.triggerEvent ?? this.config.triggerOn;
    if (triggerEvent) {
      this.game.offGame(triggerEvent, this.emit);
    }

    // Unsubscribe from tuning changes
    if (this.tuningUnsubscribe) {
      this.tuningUnsubscribe();
    }
  }
}
