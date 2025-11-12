import type { Container } from "pixi.js";

import type { EntityConfig } from "../config/types";

import { Paddle } from "./Paddle";
import { Paddle2 } from "./Paddle2";
import { Ball } from "./Ball";
import { Block } from "./Block";
import { GameManager } from "./GameManager";
import { RoadTile } from "./RoadTile";
import { CityGrid } from "./CityGrid";

/**
 * EntityFactory
 *
 * Central registry for all entity types.
 * Creates entity instances from JSON configuration.
 *
 * Similar to PrimitiveFactory, but for visual game objects.
 * Entities are the "actors" that primitives attach to.
 */

export class EntityFactory {
  private static registry = new Map<
    string,
    new (config: EntityConfig) => Container
  >();

  /**
   * Register an entity class with a name
   */
  static register(
    name: string,
    entityClass: new (config: EntityConfig) => Container,
  ): void {
    if (this.registry.has(name)) {
      console.warn(`Entity "${name}" is already registered. Overwriting...`);
    }
    this.registry.set(name, entityClass);
  }

  /**
   * Create an entity instance from config
   */
  static create(config: EntityConfig): Container {
    const EntityClass = this.registry.get(config.type);
    if (!EntityClass) {
      throw new Error(
        `Entity "${config.type}" not found. Did you forget to register it?\n` +
          `Available entities: ${Array.from(this.registry.keys()).join(", ")}`,
      );
    }
    return new EntityClass(config);
  }

  /**
   * Check if an entity is registered
   */
  static has(name: string): boolean {
    return this.registry.has(name);
  }

  /**
   * Get all registered entity names
   */
  static getRegisteredNames(): string[] {
    return Array.from(this.registry.keys());
  }
}

// Auto-register core entities
EntityFactory.register("Paddle", Paddle);
EntityFactory.register("Paddle2", Paddle2);
EntityFactory.register("Ball", Ball);
EntityFactory.register("Block", Block);
EntityFactory.register("GameManager", GameManager);

// City Lines entities
EntityFactory.register("RoadTile", RoadTile);
EntityFactory.register("CityGrid", CityGrid);
