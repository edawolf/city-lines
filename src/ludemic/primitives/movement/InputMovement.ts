import type { Container } from "pixi.js";

import { Primitive, type PrimitiveConfig } from "../Primitive";

/**
 * InputMovement Primitive
 *
 * LISA Instructions: INPUT + MOVE
 *
 * Implements player-controlled movement via keyboard, mouse, or touch input.
 * Handles input capture, velocity calculation, and bounds enforcement.
 *
 * Mechanical Layer:
 * - INPUT: Capture user input (keyboard/mouse/touch)
 * - MOVE: Apply velocity to entity position
 *
 * Configuration Options:
 * - speed: Movement speed in pixels per frame
 * - axis: Movement constraint ('horizontal', 'vertical', 'both')
 * - bounds: Optional min/max position constraints
 * - inputType: Input method ('keyboard', 'mouse', 'touch')
 */

export interface InputMovementConfig extends PrimitiveConfig {
  speed: number;
  axis: "horizontal" | "vertical" | "both";
  bounds?: {
    min?: number;
    max?: number;
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
  };
  inputType: "keyboard" | "mouse" | "touch";
}

export class InputMovement extends Primitive {
  private entity!: Container;
  private config!: InputMovementConfig;
  private velocity = { x: 0, y: 0 };
  private mousePos = { x: 0, y: 0 };
  private tuningUnsubscribe?: () => void;

  init(entity: Container, config: InputMovementConfig): void {
    this.entity = entity;
    this.config = config;
    this.setupInput();
    this.setupTuning();
  }

  private setupTuning(): void {
    // Listen for tuning system parameter changes
    const game = this.entity.parent as any;
    if (game?.tuningSystem) {
      const handleParameterChange = ({
        key,
        value,
      }: {
        key: string;
        value: any;
      }) => {
        if (key === "paddle_speed") {
          this.config.speed = value;

        }
      };

      game.tuningSystem.on("parameterChanged", handleParameterChange);

      // Store unsubscribe function
      this.tuningUnsubscribe = () => {
        game.tuningSystem.off("parameterChanged", handleParameterChange);
      };
    }
  }

  update(deltaTime: number): void {
    // Apply velocity based on axis constraint
    if (this.config.axis === "horizontal" || this.config.axis === "both") {
      this.entity.x += this.velocity.x * deltaTime * 60; // Normalize to 60fps
    }
    if (this.config.axis === "vertical" || this.config.axis === "both") {
      this.entity.y += this.velocity.y * deltaTime * 60;
    }

    // Apply bounds constraints
    if (this.config.bounds) {
      if (this.config.axis === "horizontal" || this.config.axis === "both") {
        const minX = this.config.bounds.minX ?? this.config.bounds.min;
        const maxX = this.config.bounds.maxX ?? this.config.bounds.max;
        if (minX !== undefined && maxX !== undefined) {
          this.entity.x = Math.max(minX, Math.min(maxX, this.entity.x));
        }
      }
      if (this.config.axis === "vertical" || this.config.axis === "both") {
        const minY = this.config.bounds.minY ?? this.config.bounds.min;
        const maxY = this.config.bounds.maxY ?? this.config.bounds.max;
        if (minY !== undefined && maxY !== undefined) {
          this.entity.y = Math.max(minY, Math.min(maxY, this.entity.y));
        }
      }
    }
  }

  private setupInput(): void {
    if (this.config.inputType === "keyboard") {
      document.addEventListener("keydown", this.handleKeyDown);
      document.addEventListener("keyup", this.handleKeyUp);
    } else if (this.config.inputType === "mouse") {
      document.addEventListener("pointermove", this.handleMouseMove);
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Horizontal movement
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      this.velocity.x = -this.config.speed;
    }
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      this.velocity.x = this.config.speed;
    }

    // Vertical movement
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
      this.velocity.y = -this.config.speed;
    }
    if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
      this.velocity.y = this.config.speed;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    // Stop horizontal movement
    if (
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      e.key === "a" ||
      e.key === "A" ||
      e.key === "d" ||
      e.key === "D"
    ) {
      this.velocity.x = 0;
    }

    // Stop vertical movement
    if (
      e.key === "ArrowUp" ||
      e.key === "ArrowDown" ||
      e.key === "w" ||
      e.key === "W" ||
      e.key === "s" ||
      e.key === "S"
    ) {
      this.velocity.y = 0;
    }
  };

  private handleMouseMove = (e: PointerEvent) => {
    // Track mouse position globally
    this.mousePos.x = e.clientX;
    this.mousePos.y = e.clientY;

    // Convert to local coordinates if entity has a parent
    if (this.entity.parent) {
      const localPos = this.entity.parent.toLocal({
        x: e.clientX,
        y: e.clientY,
      });

      // Smoothly move towards mouse position
      if (this.config.axis === "horizontal" || this.config.axis === "both") {
        this.entity.x = localPos.x;
      }
      if (this.config.axis === "vertical" || this.config.axis === "both") {
        this.entity.y = localPos.y;
      }
    }
  };

  destroy(): void {
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
    document.removeEventListener("pointermove", this.handleMouseMove);

    // Unsubscribe from tuning changes
    if (this.tuningUnsubscribe) {
      this.tuningUnsubscribe();
    }
  }
}
