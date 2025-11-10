import { Container } from "pixi.js";
import { Primitive } from "../Primitive";
import type { PrimitiveConfig } from "../Primitive";

/**
 * ScreenShake Primitive (LISA: JUICE)
 *
 * Triggers camera shake effect in response to game events.
 * Adds impact and excitement to gameplay moments.
 *
 * LISA Mapping:
 * - JUICE: Add satisfying physical feedback
 */
export interface ScreenShakeConfig extends PrimitiveConfig {
  triggerOn?: string; // Event name to listen for (legacy)
  triggerEvent?: string; // Event name to listen for (preferred)
  intensity: number; // Shake intensity (displacement in pixels)
  duration: number; // Shake duration in seconds
  frequency?: number; // Shake frequency (default 30)
}

export class ScreenShake extends Primitive {
  private entity!: Container;
  private config!: ScreenShakeConfig;
  private game!: Container & {
    on: (event: string, fn: (...args: unknown[]) => void) => void;
    off: (event: string, fn: (...args: unknown[]) => void) => void;
    shake: (intensity: number, duration: number, frequency?: number) => void;
    tuningSystem?: any;
  };
  private tuningUnsubscribe?: () => void;

  init(entity: Container, config: ScreenShakeConfig): void {
    this.entity = entity;
    this.config = config;
    this.game = entity.parent as Container & {
      on: (event: string, fn: (...args: unknown[]) => void) => void;
      off: (event: string, fn: (...args: unknown[]) => void) => void;
      shake: (intensity: number, duration: number, frequency?: number) => void;
      tuningSystem?: any;
    };

    // Listen for trigger event (support both naming conventions)
    const triggerEvent = this.config.triggerEvent ?? this.config.triggerOn;
    if (triggerEvent) {
      this.game.on(triggerEvent, this.shake);
    }

    this.setupTuning();
  }

  private setupTuning(): void {
    // Listen for tuning system parameter changes
    if (this.game.tuningSystem) {
      const handleParameterChange = ({ key, value }: { key: string; value: any }) => {
        if (key === "screenshake_intensity") {
          this.config.intensity = value;
          console.log(`[ScreenShake] 🎛️ Intensity updated to ${value}`);
        } else if (key === "screenshake_duration") {
          this.config.duration = value;
          console.log(`[ScreenShake] 🎛️ Duration updated to ${value}`);
        } else if (key === "enable_screenshake") {
          // Store enabled state in config
          (this.config as any).enabled = value;
          console.log(`[ScreenShake] 🎛️ Screenshake ${value ? 'enabled' : 'disabled'}`);
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
    // No per-frame update needed (shake is handled by GameContainer)
  }

  /**
   * Trigger screen shake effect
   */
  private shake = () => {
    // Check if screenshake is enabled via tuning system
    if ((this.config as any).enabled === false) {
      return;
    }

    this.game.shake(
      this.config.intensity,
      this.config.duration,
      this.config.frequency,
    );
  };

  destroy(): void {
    const triggerEvent = this.config.triggerEvent ?? this.config.triggerOn;
    if (triggerEvent) {
      this.game.off(triggerEvent, this.shake);
    }

    // Unsubscribe from tuning changes
    if (this.tuningUnsubscribe) {
      this.tuningUnsubscribe();
    }
  }
}
