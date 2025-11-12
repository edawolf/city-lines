/**
 * UIConfig - Percentage-based responsive UI configuration
 *
 * All values are percentages (0-100) relative to viewport dimensions.
 * This ensures responsive layouts across all screen sizes.
 *
 * Design Philosophy:
 * - No hardcoded pixels
 * - Everything relative to viewport
 * - Mobile-first scaling
 * - Semantic positioning
 *
 * ARCHITECTURE RULE: ALL UI components MUST use these config interfaces.
 * No hardcoded dimensions allowed - everything comes from JSON configuration.
 * This ensures students can modify game UI by editing config files, not code.
 */

/**
 * Percentage-based position (0-100)
 */
export interface PercentPosition {
  x: number; // Percentage from left (0 = left edge, 50 = center, 100 = right edge)
  y: number; // Percentage from top (0 = top edge, 50 = center, 100 = bottom edge)
}

/**
 * Percentage-based size (0-100)
 */
export interface PercentSize {
  width: number; // Percentage of viewport width
  height: number; // Percentage of viewport height
}

/**
 * Responsive spacing (percentage of viewport)
 */
export interface ResponsiveSpacing {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  all?: number; // Shorthand for all sides
}

/**
 * Grid configuration with percentage-based sizing
 */
export interface GridUIConfig {
  position: PercentPosition; // Grid position as % of viewport
  size: PercentSize; // Grid size as % of viewport
  tileCount: {
    rows: number;
    cols: number;
  };
  tileSizePercent?: number; // Tile size as % of grid size (default: auto-calculated)
  padding?: ResponsiveSpacing; // Padding around grid
  backgroundColor?: string;
}

/**
 * Text/Label configuration
 */
export interface TextUIConfig {
  position: PercentPosition;
  text: string;
  fontSizePercent: number; // Font size as % of viewport width
  color?: string;
  align?: "left" | "center" | "right";
  anchor?: { x: number; y: number }; // Anchor point (0-1)
}

/**
 * Button configuration
 */
export interface ButtonUIConfig {
  position: PercentPosition;
  size: PercentSize;
  text: string;
  fontSizePercent: number;
  color?: string;
  hoverColor?: string;
}

/**
 * Modal/Overlay configuration
 * Used for HeadlineDisplay, notifications, dialogs, etc.
 */
export interface ModalUIConfig extends TextUIConfig {
  widthPercent: number; // Modal width as % of viewport (e.g., 90 for 90%)
  backgroundAlpha?: number; // Background transparency (0-1)
  paddingPercent?: number; // Padding as % of modal width
}

/**
 * Complete UI configuration for a game screen
 */
export interface GameUIConfig {
  name: string;
  description?: string;

  // Grid configuration
  grid?: GridUIConfig;

  // Text elements
  texts?: Record<string, TextUIConfig>;

  // Buttons
  buttons?: Record<string, ButtonUIConfig>;

  // Safe areas (for mobile notches, etc.)
  safeArea?: ResponsiveSpacing;
}

/**
 * Utility: Convert percentage position to pixels
 */
export function percentToPx(
  percent: PercentPosition,
  viewportWidth: number,
  viewportHeight: number,
): { x: number; y: number } {
  return {
    x: (percent.x / 100) * viewportWidth,
    y: (percent.y / 100) * viewportHeight,
  };
}

/**
 * Utility: Convert percentage size to pixels
 */
export function percentSizeToPx(
  percent: PercentSize,
  viewportWidth: number,
  viewportHeight: number,
): { width: number; height: number } {
  return {
    width: (percent.width / 100) * viewportWidth,
    height: (percent.height / 100) * viewportHeight,
  };
}

/**
 * Utility: Calculate responsive font size
 */
export function responsiveFontSize(
  fontSizePercent: number,
  viewportWidth: number,
  minSize: number = 12,
  maxSize: number = 72,
): number {
  const size = (fontSizePercent / 100) * viewportWidth;
  return Math.max(minSize, Math.min(maxSize, size));
}

/**
 * Utility: Calculate responsive spacing
 */
export function responsiveSpacing(
  spacingPercent: number,
  viewportWidth: number,
): number {
  return (spacingPercent / 100) * viewportWidth;
}

/**
 * Utility: Apply safe area constraints to position and size
 * Ensures elements stay within viewport bounds
 */
export function applySafeArea(
  position: { x: number; y: number },
  size: { width: number; height: number },
  viewportWidth: number,
  viewportHeight: number,
  safeArea?: ResponsiveSpacing,
): { x: number; y: number; width: number; height: number } {
  // Calculate safe area margins in pixels
  const safeTop = safeArea?.top ?? safeArea?.all ?? 0;
  const safeRight = safeArea?.right ?? safeArea?.all ?? 0;
  const safeBottom = safeArea?.bottom ?? safeArea?.all ?? 0;
  const safeLeft = safeArea?.left ?? safeArea?.all ?? 0;

  const marginTop = (safeTop / 100) * viewportHeight;
  const marginRight = (safeRight / 100) * viewportWidth;
  const marginBottom = (safeBottom / 100) * viewportHeight;
  const marginLeft = (safeLeft / 100) * viewportWidth;

  // Calculate available viewport area
  const availableWidth = viewportWidth - marginLeft - marginRight;
  const availableHeight = viewportHeight - marginTop - marginBottom;

  // Clamp size to available area
  const clampedWidth = Math.min(size.width, availableWidth);
  const clampedHeight = Math.min(size.height, availableHeight);

  // Clamp position to keep element within bounds
  const minX = marginLeft + clampedWidth / 2;
  const maxX = viewportWidth - marginRight - clampedWidth / 2;
  const minY = marginTop + clampedHeight / 2;
  const maxY = viewportHeight - marginBottom - clampedHeight / 2;

  const clampedX = Math.max(minX, Math.min(maxX, position.x));
  const clampedY = Math.max(minY, Math.min(maxY, position.y));

  return {
    x: clampedX,
    y: clampedY,
    width: clampedWidth,
    height: clampedHeight,
  };
}

/**
 * Utility: Calculate safe viewport dimensions
 * Returns the usable area after applying safe area margins
 */
export function getSafeViewport(
  viewportWidth: number,
  viewportHeight: number,
  safeArea?: ResponsiveSpacing,
): {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
} {
  const safeTop = safeArea?.top ?? safeArea?.all ?? 0;
  const safeRight = safeArea?.right ?? safeArea?.all ?? 0;
  const safeBottom = safeArea?.bottom ?? safeArea?.all ?? 0;
  const safeLeft = safeArea?.left ?? safeArea?.all ?? 0;

  const marginTop = (safeTop / 100) * viewportHeight;
  const marginRight = (safeRight / 100) * viewportWidth;
  const marginBottom = (safeBottom / 100) * viewportHeight;
  const marginLeft = (safeLeft / 100) * viewportWidth;

  const width = viewportWidth - marginLeft - marginRight;
  const height = viewportHeight - marginTop - marginBottom;

  return {
    x: marginLeft,
    y: marginTop,
    width,
    height,
    centerX: marginLeft + width / 2,
    centerY: marginTop + height / 2,
  };
}
