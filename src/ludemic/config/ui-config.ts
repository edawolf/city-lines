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
    // Level text styling (always visible at top)
    levelFontSizePercent: 0.025, // 2.5% of viewport width
    levelMinFontSize: 18, // Minimum font size in pixels
    levelMaxFontSize: 32, // Maximum font size in pixels
    levelPaddingTopPercent: 0.15, // 15% padding from top of screen

    // Headline positioning (from top of screen)
    headlinePaddingTopPercent: 0.001, // 20% padding from top of screen

    // Inline background box sizing (appears below "Level: X" text)
    widthPercent: 0.35, // 35% of screen width
    heightPercent: 0.8, // 80% of screen height (maximum)
    textWrapPercent: 0.9, // 90% of modal width for text wrapping
    paddingPercent: 0.02, // 2% padding inside background box
    backgroundAlpha: 0.7, // Semi-transparent dark background

    // Headline text styling
    fontSizePercent: 0.02, // 2% of viewport width
    minFontSize: 12, // Minimum font size in pixels
    maxFontSize: 36, // Maximum font size in pixels

    // Animation timing
    typewriterSpeed: 30, // Characters per second
    displayDuration: 5, // Seconds to show headline
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
      minFontSize: 14,
      maxFontSize: 32,
      offsetFromCenterPercent: 0.51, // 2% above center
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
   * Title Screen (Initial game screen)
   */
  TITLE_SCREEN: {
    // Background
    backgroundAlpha: 1.0, // Solid background

    // Main title "CITY LINES"
    title: {
      fontSizePercent: 0.06, // 8% of viewport width
      minFontSize: 36,
      maxFontSize: 96,
      offsetFromCenterPercent: -0.28, // 8% above center (negative = up)
    },

    // Tagline text
    tagline: {
      fontSizePercent: 0.018, // 2.2% of viewport width
      minFontSize: 14,
      maxFontSize: 28,
      offsetFromCenterPercent: -0.2, // 5.5% below center (positive = down)
      wordWrapPercent: 0.4, // 80% of screen width for word wrapping
    },

    // Prompt text "Press any key or click to start"
    prompt: {
      fontSizePercent: 0.02, // 2% of viewport width
      minFontSize: 12,
      maxFontSize: 24,
      offsetFromBottomPercent: 0.1, // 10% from bottom of screen
    },

    // Intro puzzle (3x1 grid preview)
    introPuzzle: {
      tileSizePercent: 0.12, // 12% of viewport width per tile
      minTileSize: 80,
      maxTileSize: 180,
      spacing: 10, // Pixels between tiles
      offsetFromCenterPercent: 0.05, // 5% below center
    },
  },

  /**
   * Next Level Button (Level completion)
   */
  NEXT_LEVEL_BUTTON: {
    // Button sizing
    width: 180,
    height: 60,

    // Font styling
    fontSizePercent: 0.02, // 2% of viewport width
    minFontSize: 18,
    maxFontSize: 28,

    // Positioning
    offsetFromBottomPercent: 0.12, // 15% from bottom of screen

    // Animation timing
    fadeInDuration: 0.5, // Seconds to fade in
    fadeOutDuration: 0.3, // Seconds to fade out
    pulseDuration: 2.0, // Seconds for pulse animation cycle
    delayAfterComplete: 2.0, // Seconds to wait after level complete before showing

    // Colors (white button with green text)
    colors: {
      default: 0xffffff, // White
      hover: 0xf5f5f5, // Light gray (slightly darker white)
      pressed: 0xe0e0e0, // Gray (pressed state)
      text: 0x4caf50, // Green text
    },
  },

  /**
   * Grid and Tile Settings
   */
  GRID: {
    // Tile size as percentage of original image (160px)
    tileSizePercent: 0.2, // 20% of 160px = 32px
    padding: 10, // Padding around grid

    // Individual landmark/tile image scales (relative to tile size)
    imageScales: {
      home: 1.05, // 100% of tile size
      gas_station: 1.1, // 100% of tile size
      diner: 1.0, // 100% of tile size
      turnpike: 0.65, // 100% of tile size
      landmark: 1.0, // Default for all landmarks
      tile: 1.0, // Default for regular tiles (roads)
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
    screenBackground: 0x6fae6f, // Main screen background (brighter green)
    gridBackground: 0x81c681, // CityGrid background (bright green)
    gridStroke: 0x5a9a5a, // CityGrid border color (medium green)

    // Tile colors
    tileBackground: 0x95d395, // Tile background (bright medium green)
    tileRotationIndicator: 0xb8e6b8, // Rotation indicator dot (very light green)
    tileGridLine: 0x6fae6f, // Tile grid border (bright medium green)
    roadColor: 0x95d395, // Road surface color (matches tile background - invisible under landmarks)
    roadMarkings: 0xe4f4e4, // Road markings/dashes (very light cream-green)

    // Road type colors (different road hierarchy levels)
    roadTypeColors: {
      house: 0xe74c3c, // Red (starting point)
      localRoad: 0x5a6a6a, // Dark gray (local streets)
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
