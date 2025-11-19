import type { Primitive } from "./Primitive";
import { InputMovement } from "./movement/InputMovement";
import { LinearMovement } from "./movement/LinearMovement";
import { BounceCollision } from "./collision/BounceCollision";
import { PointsOnDestroy } from "./scoring/PointsOnDestroy";
import { ParticleEmitter } from "./juice/ParticleEmitter";
import { ScreenShake } from "./juice/ScreenShake";
import { SoundTrigger } from "./juice/SoundTrigger";
import { SpeedScaling } from "./difficulty/SpeedScaling";
import { ComboMultiplier } from "./difficulty/ComboMultiplier";
import { HealthSystem } from "./gameplay/HealthSystem";
import { BoundaryTrigger } from "./gameplay/BoundaryTrigger";
import { LevelManager } from "./gameplay/LevelManager";
import { RotateOnClick } from "./grid/RotateOnClick";
import { HeadlineReveal } from "./narrative/HeadlineReveal";

/**
 * PrimitiveFactory
 *
 * Central registry for all primitive types.
 * Allows creation of primitives by name from JSON configuration.
 *
 * Usage:
 * 1. Register primitives at app startup:
 *    PrimitiveFactory.register('InputMovement', InputMovement);
 *
 * 2. Create primitives from config:
 *    const primitive = PrimitiveFactory.create('InputMovement', config);
 *
 * This enables the JSON-driven game configuration system where
 * students can swap primitives by changing strings in JSON files.
 */

export class PrimitiveFactory {
  private static registry = new Map<string, new () => Primitive>();

  /**
   * Register a primitive class with a name
   * Name is used in JSON config files
   */
  static register(name: string, primitiveClass: new () => Primitive): void {
    if (this.registry.has(name)) {
    }
    this.registry.set(name, primitiveClass);
  }

  /**
   * Create a primitive instance from a name
   * Throws error if primitive not found (helps catch typos in JSON)
   */
  static create(name: string): Primitive {
    const PrimitiveClass = this.registry.get(name);
    if (!PrimitiveClass) {
      throw new Error(
        `Primitive "${name}" not found. Did you forget to register it?\n` +
          `Available primitives: ${Array.from(this.registry.keys()).join(", ")}`,
      );
    }
    return new PrimitiveClass();
  }

  /**
   * Check if a primitive is registered
   */
  static has(name: string): boolean {
    return this.registry.has(name);
  }

  /**
   * Get all registered primitive names
   */
  static getRegisteredNames(): string[] {
    return Array.from(this.registry.keys());
  }
}

// Auto-register core primitives
// New primitives are registered here as we build them

// Movement primitives
PrimitiveFactory.register("InputMovement", InputMovement);
PrimitiveFactory.register("LinearMovement", LinearMovement);

// Collision primitives
PrimitiveFactory.register("BounceCollision", BounceCollision);

// Scoring primitives
PrimitiveFactory.register("PointsOnDestroy", PointsOnDestroy);

// Juice primitives (Phase 4)
PrimitiveFactory.register("ParticleEmitter", ParticleEmitter);
PrimitiveFactory.register("ScreenShake", ScreenShake);
PrimitiveFactory.register("SoundTrigger", SoundTrigger);

// Difficulty primitives (Phase 5)
PrimitiveFactory.register("SpeedScaling", SpeedScaling);
PrimitiveFactory.register("ComboMultiplier", ComboMultiplier);

// Gameplay primitives (Game Lifecycle)
PrimitiveFactory.register("HealthSystem", HealthSystem);
PrimitiveFactory.register("BoundaryTrigger", BoundaryTrigger);
PrimitiveFactory.register("LevelManager", LevelManager);

// Grid primitives (City Lines)
PrimitiveFactory.register("RotateOnClick", RotateOnClick);

// Narrative primitives (City Lines - Phase 2)
PrimitiveFactory.register("HeadlineReveal", HeadlineReveal);
