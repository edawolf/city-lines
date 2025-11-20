/**
 * AudioManager - Ludemic Audio System
 *
 * Wraps the engine's audio system for easy use in Ludemic games.
 * Provides simple methods for playing sound effects and background music.
 */

import { engine } from "../app/getEngine";

export class AudioManager {
  private static instance: AudioManager;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get the AudioManager singleton instance
   */
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Play a sound effect
   * @param alias - Sound file alias (e.g., "rotate.mp3", "sfx/rotate.mp3")
   * @param volume - Volume (0.0 to 1.0), default 1.0
   */
  public playSFX(alias: string, volume = 1.0): void {
    try {
      engine().audio.sfx.play(alias, { volume });
    } catch (_error) {
      // Audio not available - silently fail
    }
  }

  /**
   * Play background music (loops automatically)
   * @param alias - Music file alias (e.g., "bgm-main.mp3")
   * @param volume - Volume (0.0 to 1.0), default 1.0
   */
  public async playBGM(alias: string, volume = 1.0): Promise<void> {
    try {
      await engine().audio.bgm.play(alias, { volume });
    } catch (_error) {
      // Audio not available - silently fail
    }
  }

  /**
   * Stop current background music
   */
  public stopBGM(): void {
    const current = engine().audio.bgm.current;
    if (current) {
      current.stop();
    }
  }

  /**
   * Set master volume for all audio
   * @param volume - Volume (0.0 to 1.0)
   */
  public setMasterVolume(volume: number): void {
    engine().audio.setMasterVolume(volume);
  }

  /**
   * Get current master volume
   */
  public getMasterVolume(): number {
    return engine().audio.getMasterVolume();
  }

  /**
   * Set SFX volume
   * @param volume - Volume (0.0 to 1.0)
   */
  public setSFXVolume(volume: number): void {
    engine().audio.sfx.setVolume(volume);
  }

  /**
   * Get current SFX volume
   */
  public getSFXVolume(): number {
    return engine().audio.sfx.getVolume();
  }

  /**
   * Set BGM volume
   * @param volume - Volume (0.0 to 1.0)
   */
  public setBGMVolume(volume: number): void {
    engine().audio.bgm.setVolume(volume);
  }

  /**
   * Get current BGM volume
   */
  public getBGMVolume(): number {
    return engine().audio.bgm.getVolume();
  }

  /**
   * Utility: Play a random sound from a list
   * @param aliases - Array of sound aliases
   * @param volume - Volume (0.0 to 1.0), default 1.0
   */
  public playRandomSFX(aliases: string[], volume = 1.0): void {
    if (aliases.length === 0) return;
    const randomAlias = aliases[Math.floor(Math.random() * aliases.length)];
    this.playSFX(randomAlias, volume);
  }

  /**
   * Array of tile tap sound effects for variety
   */
  private tileTapSounds = [
    "main/sounds/Confirm_04.wav",
    "main/sounds/Confirm_05.wav",
    "main/sounds/Confirm_06.wav",
    "main/sounds/Confirm_07.wav",
  ];

  /**
   * Play tile rotation sound effect (randomly selected from tileTapSounds)
   * @param volume - Volume (0.0 to 1.0), default 0.25
   */
  public playRotateSound(volume = 0.25): void {
    this.playRandomSFX(this.tileTapSounds, volume);
  }

  /**
   * Play level complete sound effect
   * @param volume - Volume (0.0 to 1.0), default 0.8
   */
  public playLevelCompleteSound(volume = 0.8): void {
    this.playSFX("main/sounds/honk.wav", volume);
  }

  /**
   * Play background music - loops the music sample automatically
   * @param volume - Volume (0.0 to 1.0), default 0.5
   */
  public async playBGMusic(volume = 0.5): Promise<void> {
    try {
      await engine().audio.bgm.play("main/sounds/traffic.mp3", { volume });
    } catch (_error) {
      // Audio not available - silently fail
    }
  }

  /**
   * Play secondary background music layer (plays on top of main BGM)
   * @param volume - Volume (0.0 to 1.0), default 0.3
   */
  public playBGLayer(volume = 0.3): void {
    try {
      engine().audio.sfx.play("main/sounds/bg-06.wav", {
        volume,
        loop: true,
      });
    } catch (_error) {
      // Audio not available - silently fail
    }
  }
}

// Export singleton instance for convenience
export const audioManager = AudioManager.getInstance();
