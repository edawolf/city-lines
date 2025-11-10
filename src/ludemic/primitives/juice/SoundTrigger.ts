import { Container } from "pixi.js";
import { Primitive } from "../Primitive";
import type { PrimitiveConfig } from "../Primitive";
import { engine } from "../../../app/getEngine";

/**
 * SoundTrigger Primitive (LISA: SOUND)
 *
 * Plays sound effects in response to game events.
 * Adds audio feedback to gameplay moments.
 *
 * LISA Mapping:
 * - SOUND: Play audio feedback
 */
export interface SoundTriggerConfig extends PrimitiveConfig {
  triggerOn: string; // Event name to listen for
  soundId: string; // Sound asset ID/path
  volume?: number; // Volume (0.0 to 1.0, default 1.0)
  pitch?: number; // Pitch multiplier (default 1.0)
  loop?: boolean; // Loop sound (default false)
}

export class SoundTrigger extends Primitive {
  private entity!: Container;
  private config!: SoundTriggerConfig;
  private game!: Container & {
    on: (event: string, fn: (...args: unknown[]) => void) => void;
    off: (event: string, fn: (...args: unknown[]) => void) => void;
  };

  init(entity: Container, config: SoundTriggerConfig): void {
    this.entity = entity;
    this.config = config;
    this.game = entity.parent as Container & {
      on: (event: string, fn: (...args: unknown[]) => void) => void;
      off: (event: string, fn: (...args: unknown[]) => void) => void;
    };

    // Listen for trigger event
    this.game.on(this.config.triggerOn, this.playSound);
  }

  update(): void {
    // No per-frame update needed
  }

  /**
   * Play sound effect
   */
  private playSound = () => {
    const audioEngine = engine();
    if (!audioEngine || !audioEngine.audio) {
      console.warn("[SoundTrigger] Audio engine not available");
      return;
    }

    try {
      // Play through the SFX manager
      audioEngine.audio.sfx.play(this.config.soundId, {
        volume: this.config.volume ?? 1.0,
        speed: this.config.pitch ?? 1.0,
        loop: this.config.loop ?? false,
      });
    } catch (error) {
      console.warn(
        `[SoundTrigger] Failed to play sound "${this.config.soundId}":`,
        error,
      );
    }
  };

  destroy(): void {
    this.game.off(this.config.triggerOn, this.playSound);
  }
}
