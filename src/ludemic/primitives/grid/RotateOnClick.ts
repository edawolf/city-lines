import type { Container, FederatedPointerEvent } from "pixi.js";

import { Primitive, type PrimitiveConfig } from "../Primitive";
import type { RoadTile } from "../../entities/RoadTile";

/**
 * RotateOnClick Primitive
 *
 * LISA Instructions: INPUT + ROT
 *
 * Implements click/tap-to-rotate interaction for grid tiles.
 * When player clicks/taps a tile, it rotates 90° clockwise.
 *
 * Mechanical Layer:
 * - INPUT: Capture pointer (mouse/touch) click events
 * - ROT: Rotate entity by 90 degrees
 * - TRIG: Emit "tile_rotated" event for validation
 *
 * Strategic Layer:
 * - TEACH: Players learn rotation through direct manipulation
 * - TEST: Players must visualize path outcomes
 *
 * Configuration Options:
 * - rotationDegrees: Amount to rotate per click (default: 90)
 * - rotatable: Whether tile can be rotated (read from entity)
 * - animationDuration: Future: smooth rotation animation
 */

export interface RotateOnClickConfig extends PrimitiveConfig {
  rotationDegrees?: number; // Degrees to rotate per click (default: 90)
  emitEvent?: boolean; // Whether to emit tile_rotated event (default: true)
}

export class RotateOnClick extends Primitive {
  private entity!: Container;
  private config!: RotateOnClickConfig;
  private roadTile!: RoadTile;
  private game: any;

  init(entity: Container, config: RotateOnClickConfig): void {
    this.entity = entity;
    this.config = {
      rotationDegrees: 90,
      emitEvent: true,
      ...config,
    };

    // Get reference to RoadTile for rotation
    this.roadTile = entity as RoadTile;

    // Get reference to game container for events
    this.game = this.entity.parent;

    this.setupInput();
  }

  private setupInput(): void {
    // Make entity interactive
    this.entity.eventMode = "static";
    this.entity.cursor = this.roadTile.rotatable ? "pointer" : "default";

    // Listen for click/tap events
    this.entity.on("pointerdown", this.handlePointerDown);

    // Add hover effect for feedback
    this.entity.on("pointerover", this.handlePointerOver);
    this.entity.on("pointerout", this.handlePointerOut);
  }

  private handlePointerDown = (event: FederatedPointerEvent) => {
    // Prevent event propagation
    event.stopPropagation();

    // Only rotate if tile is rotatable
    if (!this.roadTile.rotatable) {
      console.log(
        `[RotateOnClick] ⚠️ Tile at (${this.roadTile.gridPos.row}, ${this.roadTile.gridPos.col}) is not rotatable`,
      );
      return;
    }

    // Perform rotation
    this.roadTile.rotate();

    console.log(
      `[RotateOnClick] 🔄 Tile rotated to ${this.roadTile.rotation}° at (${this.roadTile.gridPos.row}, ${this.roadTile.gridPos.col})`,
    );

    // Emit event for path validation (emit on BOTH tile and grid)
    if (this.config.emitEvent) {
      const eventData = {
        tile: this.roadTile,
        rotation: this.roadTile.rotation,
        gridPos: this.roadTile.gridPos,
      };

      // Emit on the tile itself (for CityGrid listener)
      this.entity.emit("tile_rotated", eventData);

      // Also emit on parent (game/grid) for compatibility
      if (this.game?.emit) {
        this.game.emit("tile_rotated", eventData);
      }
    }

    // Visual feedback: brief scale animation
    this.entity.scale.set(0.95, 0.95);
    setTimeout(() => {
      this.entity.scale.set(1, 1);
    }, 100);
  };

  private handlePointerOver = () => {
    if (this.roadTile.rotatable) {
      // Slight scale up on hover
      this.entity.scale.set(1.05, 1.05);
    }
  };

  private handlePointerOut = () => {
    // Reset scale
    this.entity.scale.set(1, 1);
  };

  update(deltaTime: number): void {
    // No per-frame updates needed for click interaction
  }

  destroy(): void {
    // Clean up event listeners
    this.entity.off("pointerdown", this.handlePointerDown);
    this.entity.off("pointerover", this.handlePointerOver);
    this.entity.off("pointerout", this.handlePointerOut);

    // Reset interactive state
    this.entity.eventMode = "auto";
    this.entity.cursor = "default";
  }
}
