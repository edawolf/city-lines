import { EventEmitter } from "pixi.js";
import type { TuningConfig, TuningParameters } from "./TuningConfig";
import { DEFAULT_TUNING } from "./TuningConfig";

/**
 * TuningSystem
 *
 * Manages runtime-adjustable game parameters.
 * Supports loading, saving, and real-time updates.
 */
export class TuningSystem extends EventEmitter {
  private config: TuningConfig;
  private changeHistory: Array<{
    key: string;
    oldValue: any;
    newValue: any;
    timestamp: number;
  }> = [];

  constructor() {
    super();
    this.config = this.loadConfig();
  }

  /**
   * Get current tuning configuration
   */
  getConfig(): TuningConfig {
    return this.config;
  }

  /**
   * Get specific parameter value
   */
  getParameter<K extends keyof TuningParameters>(key: K): TuningParameters[K] {
    return this.config.parameters[key];
  }

  /**
   * Set parameter value and emit update event
   */
  setParameter<K extends keyof TuningParameters>(
    key: K,
    value: TuningParameters[K],
  ): void {
    const oldValue = this.config.parameters[key];

    if (oldValue === value) return; // No change

    this.config.parameters[key] = value;

    // Track change
    this.changeHistory.push({
      key,
      oldValue,
      newValue: value,
      timestamp: Date.now(),
    });

    // Emit update event for listeners
    this.emit("parameterChanged", { key, value, oldValue });

    // Auto-save to localStorage
    this.saveConfig();
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults(): void {

    this.config = JSON.parse(JSON.stringify(DEFAULT_TUNING));
    this.saveConfig();
    this.emit("configReset");
  }

  /**
   * Load configuration from localStorage or use defaults
   */
  private loadConfig(): TuningConfig {
    try {
      const stored = localStorage.getItem("ludemic_tuning_config");
      if (stored) {
        const parsed = JSON.parse(stored);

        return parsed;
      }
    } catch (error) {
      console.error("[TuningSystem] Failed to load config:", error);
    }

    return JSON.parse(JSON.stringify(DEFAULT_TUNING));
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem(
        "ludemic_tuning_config",
        JSON.stringify(this.config),
      );
    } catch (error) {
      console.error("[TuningSystem] Failed to save config:", error);
    }
  }

  /**
   * Export configuration as JSON string
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON string
   */
  importConfig(jsonString: string): void {
    try {
      const imported = JSON.parse(jsonString);
      this.config = imported;
      this.saveConfig();
      this.emit("configImported");

    } catch (error) {
      console.error("[TuningSystem] Failed to import config:", error);
      throw new Error("Invalid JSON format");
    }
  }

  /**
   * Get change history for telemetry
   */
  getChangeHistory() {
    return this.changeHistory;
  }

  /**
   * Download config as JSON file
   */
  downloadConfig(): void {
    const dataStr = this.exportConfig();
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `tuning-config-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

  }
}
