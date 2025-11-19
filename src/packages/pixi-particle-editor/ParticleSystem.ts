import { Container, Sprite, Texture, Ticker, Graphics } from "pixi.js";
import type {
  ParticleConfig,
  VFXData,
  Spawner,
  ParticleInstance,
} from "./types";
import { deepCloneConfig } from "./types";

/**
 * ParticleSystem - Runtime particle system for PixiJS
 *
 * This is the runtime-only version without the editor GUI.
 * Use this in your game to play particle effects created in the editor.
 *
 * @example
 * ```typescript
 * const particleSystem = new ParticleSystem();
 * myContainer.addChild(particleSystem);
 *
 * // Load a VFX configuration
 * const vfxData = await fetch('/effects/explosion.json').then(r => r.json());
 * await particleSystem.loadVFX(vfxData);
 *
 * // Update in game loop
 * app.ticker.add((time) => particleSystem.update(time));
 * ```
 */
export class ParticleSystem extends Container {
  private spawners: Spawner[] = [];
  private loadedTextures: Map<string, Texture> = new Map();
  private timeSinceLastSpawn = 0;
  private vfxAssetsPath: string;

  /**
   * Create a new ParticleSystem
   * @param vfxAssetsPath - Path to VFX assets folder (default: '/assets/vfx/')
   */
  constructor(vfxAssetsPath: string = "/assets/vfx/") {
    super();
    this.vfxAssetsPath = vfxAssetsPath;
  }

  /**
   * Load a VFX configuration from a VFXData object
   * This clears any existing spawners and creates new ones from the data
   */
  public async loadVFX(vfxData: VFXData): Promise<void> {
    console.log(`📂 Loading VFX: ${vfxData.spawners?.length || 0} spawner(s)`);

    // Clear existing spawners
    this.clear();

    // Recreate spawners from the saved data
    for (const spawnerData of vfxData.spawners || []) {
      await this.createSpawner(
        spawnerData.config,
        spawnerData.position.x,
        spawnerData.position.y,
        spawnerData.name,
        spawnerData.visible,
      );
    }

    console.log(`✅ Loaded ${this.spawners.length} spawner(s)`);
  }

  /**
   * Create a new spawner with the given configuration
   */
  public async createSpawner(
    config: ParticleConfig,
    x: number = 0,
    y: number = 0,
    name: string = "Spawner",
    visible: boolean = true,
  ): Promise<Spawner> {
    // Create container
    const container = new Container();
    container.visible = visible;

    // Load texture
    const texture = await this.loadTexture(config.textureName);

    // Create crosshair (optional, for debugging)
    const crosshair = this.createCrosshair(x, y);
    crosshair.visible = visible;
    this.addChild(crosshair);

    // Calculate emitter lifetime
    const emitterLifeVar =
      (Math.random() - 0.5) * config.emitterLifetimeVariance * 2;
    const emitterMaxLife =
      config.emitterLifetime > 0
        ? config.emitterLifetime * (1 + emitterLifeVar)
        : 0;

    // Create spawner object
    const spawner: Spawner = {
      id: `spawner_${Date.now()}_${Math.random()}`,
      name,
      config: deepCloneConfig(config),
      container,
      particles: [],
      texture,
      enabled: true,
      spawnX: x,
      spawnY: y,
      crosshair,
      emitterLife: 0,
      emitterMaxLife,
      isEmitterDead: false,
      hasBurst: false,
      delayTimer: 0,
      hasStarted: config.emitterStartDelay === 0,
    };

    // Add to scene
    this.addChild(container);
    this.spawners.push(spawner);

    return spawner;
  }

  /**
   * Clear all spawners and particles
   */
  public clear(): void {
    for (const spawner of this.spawners) {
      this.removeChild(spawner.container);
      this.removeChild(spawner.crosshair);
      spawner.container.destroy({ children: true });
      spawner.crosshair.destroy();
    }
    this.spawners = [];
  }

  /**
   * Update all spawners and particles
   * Call this in your game loop
   */
  public update(time: Ticker): void {
    const delta = time.deltaTime / 60;

    // Update emitter lifetimes
    for (const spawner of this.spawners) {
      if (!spawner.enabled || !spawner.config.emitting) continue;

      // Handle start delay
      if (!spawner.hasStarted) {
        spawner.delayTimer += delta;
        if (spawner.delayTimer >= spawner.config.emitterStartDelay) {
          spawner.hasStarted = true;
        }
        continue;
      }

      // Update emitter lifetime
      if (!spawner.isEmitterDead) {
        spawner.emitterLife += delta;

        // Check if emitter has reached its lifetime
        if (
          spawner.emitterMaxLife > 0 &&
          spawner.emitterLife >= spawner.emitterMaxLife
        ) {
          spawner.isEmitterDead = true;

          // Handle looping
          if (spawner.config.loop) {
            spawner.emitterLife = 0;
            spawner.isEmitterDead = false;
            spawner.hasBurst = false;
            spawner.delayTimer = 0;
            spawner.hasStarted = spawner.config.emitterStartDelay === 0;

            // Recalculate max life with variance
            const emitterLifeVar =
              (Math.random() - 0.5) *
              spawner.config.emitterLifetimeVariance *
              2;
            spawner.emitterMaxLife =
              spawner.config.emitterLifetime > 0
                ? spawner.config.emitterLifetime * (1 + emitterLifeVar)
                : 0;
          }
        }
      }
    }

    // Spawn particles
    this.timeSinceLastSpawn += delta;
    const spawnInterval = 1 / 30; // Use a base spawn rate, individual spawners handle their own rates

    while (this.timeSinceLastSpawn >= spawnInterval) {
      this.spawnParticles();
      this.timeSinceLastSpawn -= spawnInterval;
    }

    // Update particles
    for (const spawner of this.spawners) {
      for (let i = spawner.particles.length - 1; i >= 0; i--) {
        const p = spawner.particles[i];
        p.life += delta;

        // Remove dead particles
        if (p.life >= p.maxLife) {
          p.particle.destroy();
          spawner.particles.splice(i, 1);
          continue;
        }

        const lifeRatio = p.life / p.maxLife;

        // Apply acceleration
        if (spawner.config.acceleration !== 0) {
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (speed > 0) {
            const dirX = p.vx / speed;
            const dirY = p.vy / speed;
            p.vx += dirX * spawner.config.acceleration * delta * 60;
            p.vy += dirY * spawner.config.acceleration * delta * 60;
          }
        }

        // Apply gravity
        p.vy += spawner.config.gravity * delta * 60;

        // Update position
        p.particle.x += p.vx * delta * 60;
        p.particle.y += p.vy * delta * 60;

        // Update rotation
        p.particle.rotation += p.angularVelocity * delta;

        // Interpolate scale
        const currentScale =
          p.startScale + (p.endScale - p.startScale) * lifeRatio;
        if (typeof p.particle.scale === "object" && "set" in p.particle.scale) {
          p.particle.scale.set(currentScale);
        }

        // Interpolate alpha
        p.particle.alpha =
          p.startAlpha + (p.endAlpha - p.startAlpha) * lifeRatio;

        // Interpolate color
        const startColor = spawner.config.colorStart;
        const endColor = spawner.config.colorEnd;
        const r = Math.round(
          startColor.r + (endColor.r - startColor.r) * lifeRatio,
        );
        const g = Math.round(
          startColor.g + (endColor.g - startColor.g) * lifeRatio,
        );
        const b = Math.round(
          startColor.b + (endColor.b - startColor.b) * lifeRatio,
        );
        const currentColor = (r << 16) | (g << 8) | b;
        p.particle.tint = currentColor;
      }
    }
  }

  /**
   * Respawn all spawners (reset their state)
   */
  public respawnAll(): void {
    for (const spawner of this.spawners) {
      this.respawnSpawner(spawner);
    }
  }

  /**
   * Respawn a specific spawner
   */
  private respawnSpawner(spawner: Spawner): void {
    spawner.emitterLife = 0;
    spawner.isEmitterDead = false;
    spawner.hasBurst = false;
    spawner.delayTimer = 0;
    spawner.hasStarted = spawner.config.emitterStartDelay === 0;

    // Clear existing particles
    spawner.particles = [];
    spawner.container.removeChildren();

    // Re-enable emitting
    if (!spawner.config.emitting) {
      spawner.config.emitting = true;
    }
  }

  /**
   * Spawn particles for all active spawners
   */
  private spawnParticles(): void {
    for (const spawner of this.spawners) {
      if (!spawner.enabled || !spawner.config.emitting) continue;
      if (!spawner.hasStarted) continue;
      if (spawner.isEmitterDead) continue;
      if (spawner.particles.length >= spawner.config.maxParticles) continue;

      // Burst mode
      if (spawner.config.burst) {
        if (!spawner.hasBurst) {
          const particlesToSpawn = Math.min(
            spawner.config.maxParticles - spawner.particles.length,
            spawner.config.maxParticles,
          );
          for (let i = 0; i < particlesToSpawn; i++) {
            this.spawnParticlesForSpawner(spawner, 1);
          }
          spawner.hasBurst = true;
        }
        continue;
      }

      // Normal spawning
      this.spawnParticlesForSpawner(spawner);
    }
  }

  /**
   * Spawn particles for a specific spawner
   */
  private spawnParticlesForSpawner(spawner: Spawner, count?: number): void {
    const particlesToSpawn =
      count !== undefined ? count : spawner.config.particlesPerWave;

    for (let i = 0; i < particlesToSpawn; i++) {
      const particle = new Sprite(spawner.texture);
      particle.x = spawner.spawnX;
      particle.y = spawner.spawnY;
      particle.anchor.set(0.5, 0.5);

      // Calculate velocity
      const baseAngle = (spawner.config.angle * Math.PI) / 180;

      // If angleVariance is 360 (full circle burst), use random angle instead of variance
      let velocityAngle: number;
      if (spawner.config.angleVariance >= 360) {
        velocityAngle = Math.random() * Math.PI * 2; // Full 360° random
      } else {
        const angleVar =
          ((Math.random() - 0.5) * spawner.config.angleVariance * Math.PI) /
          180;
        velocityAngle = baseAngle + angleVar;
      }

      const baseSpeed = spawner.config.speed;
      const speedVar = (Math.random() - 0.5) * spawner.config.speedVariance * 2;
      const speed = baseSpeed + speedVar * baseSpeed;

      // Calculate scale
      let startScale: number;
      let endScale: number;
      const textureSize = spawner.texture.width;

      if (spawner.config.sizeMode === "pixels") {
        startScale = spawner.config.sizeStartPixels / textureSize;
        endScale = spawner.config.sizeEndPixels / textureSize;
      } else {
        startScale = spawner.config.scaleStart;
        endScale = spawner.config.scaleEnd;
      }

      // Apply variance
      const scaleVar = (Math.random() - 0.5) * spawner.config.scaleVariance * 2;
      startScale = startScale * (1 + scaleVar);
      endScale = endScale * (1 + scaleVar);

      // Particle lifetime
      const particleLifeVar =
        (Math.random() - 0.5) * spawner.config.particleLifetimeVariance * 2;
      const particleLifetime =
        spawner.config.particleLifetime * (1 + particleLifeVar);

      // Set initial properties
      const startColor =
        (spawner.config.colorStart.r << 16) |
        (spawner.config.colorStart.g << 8) |
        spawner.config.colorStart.b;

      if (typeof particle.scale === "object" && "set" in particle.scale) {
        particle.scale.set(startScale);
      }

      particle.tint = startColor;
      particle.alpha = spawner.config.alphaStart;
      particle.blendMode = spawner.config.blendMode;
      particle.rotation = (spawner.config.rotationStart * Math.PI) / 180;

      spawner.container.addChild(particle);

      // Calculate angular velocity
      let angularVelocity = spawner.config.rotationSpeed;
      const rotationVar =
        (Math.random() - 0.5) * spawner.config.rotationVariance * 2;
      angularVelocity *= 1 + rotationVar;

      if (spawner.config.rotationDirection === "clockwise") {
        angularVelocity = Math.abs(angularVelocity);
      } else if (spawner.config.rotationDirection === "counter-clockwise") {
        angularVelocity = -Math.abs(angularVelocity);
      } else if (spawner.config.rotationDirection === "random") {
        angularVelocity *= Math.random() < 0.5 ? 1 : -1;
      }

      spawner.particles.push({
        particle,
        vx: Math.cos(velocityAngle) * speed,
        vy: Math.sin(velocityAngle) * speed,
        life: 0,
        maxLife: particleLifetime,
        angularVelocity,
        startScale,
        endScale,
        startAlpha: spawner.config.alphaStart,
        endAlpha: spawner.config.alphaEnd,
      });
    }
  }

  /**
   * Load a texture from the VFX assets folder
   */
  private async loadTexture(textureName: string): Promise<Texture> {
    if (this.loadedTextures.has(textureName)) {
      return this.loadedTextures.get(textureName)!;
    }

    // Special case: programmatic white rectangle
    if (textureName === "rect") {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 32, 32);
      const texture = Texture.from(canvas);
      this.loadedTextures.set(textureName, texture);
      return texture;
    }

    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = reject;
      image.src = `${this.vfxAssetsPath}${textureName}`;
    });

    const texture = Texture.from(image);
    this.loadedTextures.set(textureName, texture);
    return texture;
  }

  /**
   * Create a crosshair marker (for debugging spawner positions)
   */
  private createCrosshair(x: number, y: number): Graphics {
    const crosshair = new Graphics();
    crosshair.moveTo(-10, 0);
    crosshair.lineTo(10, 0);
    crosshair.moveTo(0, -10);
    crosshair.lineTo(0, 10);
    crosshair.stroke({ width: 1, color: 0x00ff00, alpha: 0.5 });
    crosshair.circle(0, 0, 5);
    crosshair.stroke({ width: 1, color: 0x00ff00, alpha: 0.3 });
    crosshair.x = x;
    crosshair.y = y;
    return crosshair;
  }

  /**
   * Get all spawners
   */
  public getSpawners(): Readonly<Spawner[]> {
    return this.spawners;
  }

  /**
   * Get total particle count across all spawners
   */
  public getParticleCount(): number {
    return this.spawners.reduce((sum, s) => sum + s.particles.length, 0);
  }

  /**
   * Clean up resources
   */
  public override destroy(options?: any): void {
    this.clear();
    super.destroy(options);
  }
}
