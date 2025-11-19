import type { EntityConfig } from "../config/types";

/**
 * BlockGrid Layout Helper
 *
 * Generates a grid of block entities from configuration.
 * This is a procedural entity generator - takes parameters and
 * outputs an array of entity configs.
 *
 * Use Cases:
 * - Breakout block layouts
 * - Tile-based levels
 * - Grid-based enemies
 * - Procedural level generation
 */

export interface BlockGridConfig {
  rows: number;
  cols: number;
  startX: number;
  startY: number;
  blockWidth: number;
  blockHeight: number;
  spacingX?: number;
  spacingY?: number;
  spacing?: number; // Fallback if spacingX/spacingY not provided
  colors?: number[]; // Optional array of colors (cycles through rows)
  points?: number[]; // Points per row (optional)
  primitives?: Array<{ type: string; config: any }>; // Primitives to attach to each block
}

export class BlockGrid {
  /**
   * Generate block entity configs in a grid pattern
   */
  static generate(config: BlockGridConfig): EntityConfig[] {
    const blocks: EntityConfig[] = [];

    // Support both spacingX/spacingY and single spacing parameter
    const spacingX = config.spacingX ?? config.spacing ?? 0;
    const spacingY = config.spacingY ?? config.spacing ?? 0;

    // Default colors if not provided (cycle through rainbow)
    const defaultColors = [
      0xff5722, // Red
      0xff9800, // Orange
      0xffc107, // Yellow
      0x4caf50, // Green
      0x2196f3, // Blue
    ];
    const colors = config.colors ?? defaultColors;

    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        const x = config.startX + col * (config.blockWidth + spacingX);
        const y = config.startY + row * (config.blockHeight + spacingY);

        // Cycle through colors by row
        const color = colors[row % colors.length];

        // Get points for this row (if specified)
        const points = config.points
          ? config.points[row % config.points.length]
          : 10;

        blocks.push({
          id: `block_${row}_${col}`,
          type: "Block",
          position: { x, y },
          config: {
            width: config.blockWidth,
            height: config.blockHeight,
            color: color,
          },
          primitives: config.primitives ?? [
            {
              type: "DestroyCollision",
              config: {
                destroyOnHit: true,
                triggerOnEntityTypes: ["Ball"],
                onDestroy: "block_destroyed",
              },
            },
            {
              type: "PointsOnDestroy",
              config: {
                points: points,
                listenForEvent: "block_destroyed",
              },
            },
          ],
        });
      }
    }

    return blocks;
  }
}
