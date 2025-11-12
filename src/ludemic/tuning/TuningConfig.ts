/**
 * Ludemic Tuning Knobs System
 *
 * Runtime-adjustable parameters for gameplay balancing and iteration.
 * Based on LUDEMIC_TUNING_KNOBS.mdc specification.
 */

export interface TuningConfig {
  config_id: string;
  version: string;
  created_at: string;
  metadata: {
    variant: string;
    purpose: string;
    deployed_at: string;
  };
  parameters: TuningParameters;
}

export interface TuningParameters {
  // Timing and Pacing
  paddle_speed: number;
  ball_initial_speed: number;
  ball_max_speed_multiplier: number;
  level_complete_delay_seconds: number;

  // Scoring and Progression
  base_points_per_block: number;
  combo_multiplier_increment: number;
  combo_window_seconds: number;
  max_combo_multiplier: number;
  level_up_threshold: number;

  // Gameplay Flow
  starting_lives: number;
  blocks_per_row: number;
  blocks_rows: number;
  ball_speed_increase_per_block: number;

  // Player Feedback (Juice)
  screenshake_intensity: number;
  screenshake_duration: number;
  particle_count: number;
  particle_speed: number;
  particle_lifetime: number;

  // Feature Toggles
  enable_particles: boolean;
  enable_screenshake: boolean;
  enable_sound: boolean;
  enable_combo_system: boolean;
  enable_speed_scaling: boolean;

  // Debug
  invincible_mode: boolean;
  show_collision_bounds: boolean;
}

export const DEFAULT_TUNING: TuningConfig = {
  config_id: "baseline",
  version: "1.0.0",
  created_at: new Date().toISOString(),
  metadata: {
    variant: "baseline",
    purpose: "Default balanced configuration",
    deployed_at: new Date().toISOString(),
  },
  parameters: {
    // Timing and Pacing
    paddle_speed: 6,
    ball_initial_speed: 200,
    ball_max_speed_multiplier: 2.0,
    level_complete_delay_seconds: 2.5,

    // Scoring and Progression
    base_points_per_block: 100,
    combo_multiplier_increment: 0.25,
    combo_window_seconds: 1.5,
    max_combo_multiplier: 5.0,
    level_up_threshold: 1000,

    // Gameplay Flow
    starting_lives: 3,
    blocks_per_row: 10,
    blocks_rows: 5,
    ball_speed_increase_per_block: 0.02,

    // Player Feedback (Juice)
    screenshake_intensity: 5,
    screenshake_duration: 0.2,
    particle_count: 15,
    particle_speed: 200,
    particle_lifetime: 0.8,

    // Feature Toggles
    enable_particles: true,
    enable_screenshake: true,
    enable_sound: true,
    enable_combo_system: true,
    enable_speed_scaling: true,

    // Debug
    invincible_mode: false,
    show_collision_bounds: false,
  },
};

/**
 * Control widget metadata for UI generation
 */
export interface ControlWidget {
  key: keyof TuningParameters;
  label: string;
  type: "slider" | "toggle" | "input";
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

export const TUNING_CATEGORIES: Record<string, ControlWidget[]> = {
  "Timing & Pacing": [
    {
      key: "paddle_speed",
      label: "Paddle Speed",
      type: "slider",
      min: 1,
      max: 20,
      step: 1,
      description: "How fast the paddle moves (pixels/frame)",
    },
    {
      key: "ball_initial_speed",
      label: "Ball Initial Speed",
      type: "slider",
      min: 50,
      max: 500,
      step: 10,
      description: "Starting ball velocity (pixels/second)",
    },
    {
      key: "ball_max_speed_multiplier",
      label: "Max Speed Multiplier",
      type: "slider",
      min: 1.0,
      max: 5.0,
      step: 0.1,
      description: "Maximum ball speed increase",
    },
    {
      key: "level_complete_delay_seconds",
      label: "Level Complete Delay",
      type: "slider",
      min: 0,
      max: 5,
      step: 0.5,
      description: "Delay before next level (seconds)",
    },
  ],

  "Scoring & Progression": [
    {
      key: "base_points_per_block",
      label: "Base Points",
      type: "slider",
      min: 10,
      max: 500,
      step: 10,
      description: "Points awarded per block",
    },
    {
      key: "combo_multiplier_increment",
      label: "Combo Increment",
      type: "slider",
      min: 0.1,
      max: 1.0,
      step: 0.05,
      description: "Multiplier increase per combo hit",
    },
    {
      key: "combo_window_seconds",
      label: "Combo Window",
      type: "slider",
      min: 0.5,
      max: 5.0,
      step: 0.1,
      description: "Time window for combo (seconds)",
    },
    {
      key: "max_combo_multiplier",
      label: "Max Combo",
      type: "slider",
      min: 1.0,
      max: 10.0,
      step: 0.5,
      description: "Maximum combo multiplier",
    },
  ],

  "Gameplay Flow": [
    {
      key: "starting_lives",
      label: "Starting Lives",
      type: "slider",
      min: 1,
      max: 10,
      step: 1,
      description: "Number of starting lives",
    },
    {
      key: "blocks_per_row",
      label: "Blocks Per Row",
      type: "slider",
      min: 5,
      max: 20,
      step: 1,
      description: "Number of blocks horizontally",
    },
    {
      key: "blocks_rows",
      label: "Block Rows",
      type: "slider",
      min: 3,
      max: 10,
      step: 1,
      description: "Number of block rows",
    },
    {
      key: "ball_speed_increase_per_block",
      label: "Speed Increase Rate",
      type: "slider",
      min: 0,
      max: 0.1,
      step: 0.01,
      description: "Ball speed increase per block destroyed",
    },
  ],

  "Juice & Feedback": [
    {
      key: "screenshake_intensity",
      label: "Screenshake Intensity",
      type: "slider",
      min: 0,
      max: 20,
      step: 1,
      description: "Screen shake displacement (pixels)",
    },
    {
      key: "screenshake_duration",
      label: "Screenshake Duration",
      type: "slider",
      min: 0,
      max: 1,
      step: 0.05,
      description: "Screen shake length (seconds)",
    },
    {
      key: "particle_count",
      label: "Particle Count",
      type: "slider",
      min: 0,
      max: 50,
      step: 1,
      description: "Number of particles per explosion",
    },
    {
      key: "particle_speed",
      label: "Particle Speed",
      type: "slider",
      min: 50,
      max: 500,
      step: 10,
      description: "Initial particle velocity",
    },
    {
      key: "particle_lifetime",
      label: "Particle Lifetime",
      type: "slider",
      min: 0.1,
      max: 3,
      step: 0.1,
      description: "Particle duration (seconds)",
    },
  ],

  "Feature Toggles": [
    {
      key: "enable_particles",
      label: "Enable Particles",
      type: "toggle",
      description: "Show particle explosions",
    },
    {
      key: "enable_screenshake",
      label: "Enable Screenshake",
      type: "toggle",
      description: "Enable screen shake effect",
    },
    {
      key: "enable_sound",
      label: "Enable Sound",
      type: "toggle",
      description: "Play sound effects",
    },
    {
      key: "enable_combo_system",
      label: "Enable Combo System",
      type: "toggle",
      description: "Enable combo multiplier",
    },
    {
      key: "enable_speed_scaling",
      label: "Enable Speed Scaling",
      type: "toggle",
      description: "Ball speeds up over time",
    },
  ],

  Debug: [
    {
      key: "invincible_mode",
      label: "Invincible Mode",
      type: "toggle",
      description: "Infinite lives",
    },
    {
      key: "show_collision_bounds",
      label: "Show Collision Bounds",
      type: "toggle",
      description: "Display collision boxes",
    },
  ],
};
