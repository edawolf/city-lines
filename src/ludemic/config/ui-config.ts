/**
 * UI Configuration - City Lines Game
 * All values are percentages (0.0 to 1.0) relative to screen dimensions
 *
 * ARCHITECTURE RULE: ALL UI components MUST read from this config.
 * Students can modify layouts by editing these values, not component code.
 */

export const UI_CONFIG = {
  /**
   * HeadlineDisplay Modal (News headline reveals)
   */
  HEADLINE_MODAL: {
    // Modal sizing
    widthPercent: 0.4, // 70% of screen width
    heightPercent: 0.8, // Maximum 80% of screen height
    paddingPercent: 0.02, // 2% padding as percentage of viewport
    backgroundAlpha: 0.9, // Semi-transparent background

    // Text styling
    fontSizePercent: 0.025, // 2.5% of viewport width
    minFontSize: 16, // Minimum font size in pixels
    maxFontSize: 36, // Maximum font size in pixels

    // Text wrapping (percentage of modal width)
    textWrapPercent: 0.75, // 75% of modal width for text

    // Animation timing
    typewriterSpeed: 30, // Characters per second
    displayDuration: 5, // Seconds to show headline
    fadeInDuration: 0.5, // Fade in time in seconds
    fadeOutDuration: 0.5, // Fade out time in seconds
  },

  /**
   * Level Complete Screen (Breakout game completion)
   */
  LEVEL_COMPLETE_SCREEN: {
    // Background
    backgroundAlpha: 0.7, // Semi-transparent dark overlay

    // Title "LEVEL COMPLETE!"
    title: {
      fontSizePercent: 0.07, // 7% of viewport width
      minFontSize: 24,
      maxFontSize: 56,
      offsetFromCenterPercent: 0.13, // 13% above center
    },

    // Level number text
    levelText: {
      fontSizePercent: 0.04, // 4% of viewport width
      minFontSize: 18,
      maxFontSize: 32,
      offsetFromCenterPercent: 0.02, // 2% above center
    },

    // Score display
    scoreText: {
      fontSizePercent: 0.03, // 3% of viewport width
      minFontSize: 14,
      maxFontSize: 24,
      offsetFromCenterPercent: -0.07, // 7% below center (negative = down)
    },

    // Instructions text
    instructionText: {
      fontSizePercent: 0.025, // 2.5% of viewport width
      minFontSize: 12,
      maxFontSize: 20,
      offsetFromCenterPercent: -0.17, // 17% below center
    },

    // Auto-hide duration
    displayDuration: 2.0, // Seconds before auto-hiding
  },

  /**
   * Game Over Screen (Breakout game over)
   */
  GAME_OVER_SCREEN: {
    // Background
    backgroundAlpha: 0.8, // Semi-transparent dark overlay

    // Title "GAME OVER"
    title: {
      fontSizePercent: 0.08, // 8% of viewport width
      minFontSize: 28,
      maxFontSize: 64,
      offsetFromCenterPercent: 0.2, // 20% above center
    },

    // Final score text
    scoreText: {
      fontSizePercent: 0.04, // 4% of viewport width
      minFontSize: 18,
      maxFontSize: 32,
      offsetFromCenterPercent: 0.07, // 7% above center
    },

    // Level reached text
    levelText: {
      fontSizePercent: 0.03, // 3% of viewport width
      minFontSize: 14,
      maxFontSize: 24,
      offsetFromCenterPercent: -0.02, // 2% below center
    },

    // High score text
    highScoreText: {
      fontSizePercent: 0.03, // 3% of viewport width
      minFontSize: 14,
      maxFontSize: 24,
      offsetFromCenterPercent: -0.08, // 8% below center
    },

    // Instruction text "Press SPACE to restart"
    instructionText: {
      fontSizePercent: 0.025, // 2.5% of viewport width
      minFontSize: 12,
      maxFontSize: 20,
      offsetFromCenterPercent: -0.2, // 20% below center
    },
  },

  /**
   * Common spacing values
   */
  SPACING: {
    // Modal padding
    modalPaddingPercent: 0.02, // 2% of viewport

    // Button spacing
    buttonGapPercent: 0.02, // 2% gap between buttons

    // Text line height
    lineHeightMultiplier: 1.5, // 1.5x font size for line height
  },

  /**
   * Game Colors (hex values)
   */
  COLORS: {
    // Background colors
    screenBackground: 0x5a7a5a, // Main screen background (muted green)
    gridBackground: 0x6b8e6b, // CityGrid background (lighter muted green)
    gridStroke: 0x4a6b4a, // CityGrid border color (darker green)

    // Tile colors
    tileBackground: 0x7d9d7d, // Tile background (medium green)
    tileRotationIndicator: 0xa5c4a5, // Rotation indicator dot (light green)
    tileGridLine: 0x5a7a5a, // Tile grid border (medium-dark green)
    roadColor: 0x3a4a3a, // Road surface color (darker gray-green)
    roadMarkings: 0xd4e4d4, // Road markings/dashes (light cream-green)

    // Road type colors (different road hierarchy levels)
    roadTypeColors: {
      house: 0xe74c3c, // Red (starting point)
      localRoad: 0x5a6a6a, // Dark gray (local streets)
      arterialRoad: 0xf39c12, // Orange (main roads)
      highway: 0xe67e22, // Dark orange (highways)
      turnpike: 0x9b59b6, // Purple (toll roads)
      landmark: 0x2ecc71, // Green (destinations)
    },

    // UI element colors
    textWhite: 0xffffff, // White text
  },
} as const;

/**
 * Type-safe access to UI config
 */
export type UIConfigType = typeof UI_CONFIG;
