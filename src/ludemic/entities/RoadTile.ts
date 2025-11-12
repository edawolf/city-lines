import { Container, Graphics, Text } from "pixi.js";

import type { Primitive } from "../primitives/Primitive";
import type { EntityConfig } from "../config/types";

/**
 * Direction enum for road connections
 */
export enum Direction {
  North = "North",
  East = "East",
  South = "South",
  West = "West",
}

/**
 * Road type hierarchy for connection rules
 */
export enum RoadType {
  House = "house",
  LocalRoad = "local_road",
  ArterialRoad = "arterial_road",
  Highway = "highway",
  Turnpike = "turnpike",
  Landmark = "landmark", // Service destinations: diner, gas station, market
}

/**
 * Landmark types (service destinations)
 */
export enum LandmarkType {
  Diner = "diner",
  GasStation = "gas_station",
  Market = "market",
}

/**
 * Base openings for each road tile type (before rotation)
 * North = top, East = right, South = bottom, West = left
 */
const BASE_OPENINGS: Record<string, Direction[]> = {
  straight: [Direction.North, Direction.South],
  corner: [Direction.North, Direction.East],
  t_junction: [Direction.North, Direction.East, Direction.West],
  crossroads: [Direction.North, Direction.East, Direction.South, Direction.West],
  house: [Direction.South], // Houses connect downward
  landmark: [Direction.North], // Landmarks connect upward
  turnpike: [Direction.North, Direction.South], // Turnpikes are like straight roads
};

/**
 * Connection rules: which road types can connect to which
 */
export const CONNECTION_RULES: Record<RoadType, RoadType[]> = {
  [RoadType.House]: [RoadType.LocalRoad],
  [RoadType.LocalRoad]: [
    RoadType.LocalRoad,
    RoadType.House,
    RoadType.ArterialRoad,
    RoadType.Landmark,
  ],
  [RoadType.ArterialRoad]: [
    RoadType.LocalRoad,
    RoadType.ArterialRoad,
    RoadType.Highway,
  ],
  [RoadType.Highway]: [
    RoadType.ArterialRoad,
    RoadType.Highway,
    RoadType.Turnpike,
  ],
  [RoadType.Turnpike]: [RoadType.Highway, RoadType.Landmark],
  [RoadType.Landmark]: [RoadType.Turnpike, RoadType.LocalRoad],
};

/**
 * Road tile configuration
 */
export interface RoadTileConfig {
  tileType: string; // 'straight', 'corner', 't_junction', 'crossroads'
  roadType: RoadType; // Road hierarchy type
  rotation: number; // 0, 90, 180, 270 degrees
  rotatable: boolean; // Can player rotate this tile?
  color?: number; // Visual color
  size?: number; // Tile size in pixels
  gridPos?: { row: number; col: number }; // Grid position
  landmarkType?: LandmarkType; // Type of landmark (diner, gas_station, market)
  icon?: string; // Custom emoji icon override
}

/**
 * RoadTile Entity
 *
 * Represents a single tile in the city grid.
 * Can be a road segment, house, landmark, or turnpike.
 *
 * LISA Mapping:
 * - ROT (rotation state)
 * - DISPLAY (visual representation)
 * - COLLIDE (connection detection via openings)
 *
 * Key Features:
 * - Direction-based connections (N, E, S, W)
 * - Road type hierarchy (house → local → arterial → highway → turnpike → landmark)
 * - Rotation in 90° increments
 * - Visual representation of road type and openings
 */
export class RoadTile extends Container {
  private primitives: Map<string, Primitive> = new Map();
  private graphics: Graphics;
  private labelText?: Text;

  public readonly tileType: string;
  public readonly roadType: RoadType;
  public readonly rotatable: boolean;
  public rotationDegrees: number; // Stored in degrees: 0, 90, 180, 270 (renamed to avoid conflict with Container.rotation)
  public readonly gridPos: { row: number; col: number };
  private tileSize: number; // Changed from readonly to allow resize
  public readonly landmarkType?: LandmarkType; // Type of landmark (diner, gas_station, market)
  public readonly customIcon?: string; // Custom emoji override

  constructor(config: EntityConfig) {
    super();

    // Extract road tile specific config
    const roadConfig = (config.config as RoadTileConfig) ?? {};
    this.tileType = roadConfig.tileType ?? "straight";
    this.roadType = roadConfig.roadType ?? RoadType.LocalRoad;
    this.rotationDegrees = roadConfig.rotation ?? 0;
    this.rotatable = roadConfig.rotatable ?? true;
    this.gridPos = roadConfig.gridPos ?? { row: 0, col: 0 };
    this.tileSize = roadConfig.size ?? 80;
    this.landmarkType = roadConfig.landmarkType;
    this.customIcon = roadConfig.icon;

    // Create visual representation
    this.graphics = new Graphics();
    this.addChild(this.graphics);

    // Add debug label
    this.labelText = new Text({
      text: this.tileType[0].toUpperCase(),
      style: {
        fontSize: 12,
        fill: 0xffffff,
      },
    });
    this.labelText.anchor.set(0.5);
    this.addChild(this.labelText);

    this.draw();
  }

  /**
   * Draw the tile visual based on type and rotation
   */
  private draw(): void {
    this.graphics.clear();

    const halfSize = this.tileSize / 2;
    const roadWidth = this.tileSize * 0.3;
    const color = this.getColorForRoadType();

    // Draw background
    this.graphics
      .rect(-halfSize, -halfSize, this.tileSize, this.tileSize)
      .fill(0x2c3e50);

    // Draw grid lines
    this.graphics
      .rect(-halfSize, -halfSize, this.tileSize, this.tileSize)
      .stroke({ width: 1, color: 0x34495e });

    // Draw based on specific type with icons
    switch (this.roadType) {
      case RoadType.House:
        this.drawHouseIcon();
        break;
      case RoadType.Landmark:
        this.drawLandmarkIcon();
        break;
      case RoadType.Turnpike:
        this.drawTurnpikeIcon(color, roadWidth);
        break;
      default:
        this.drawRoadSegments(color, roadWidth);
        break;
    }

    // Visual indicator if rotatable
    if (this.rotatable) {
      this.graphics
        .circle(halfSize * 0.7, halfSize * 0.7, 6)
        .fill(0x3498db)
        .stroke({ width: 1, color: 0xffffff });
    }
  }

  /**
   * Draw house icon (🏠)
   */
  private drawHouseIcon(): void {
    const halfSize = this.tileSize / 2;
    const roadWidth = this.tileSize * 0.3;

    // Draw emoji icon
    if (this.labelText) {
      this.labelText.text = "🏠";
      this.labelText.style.fontSize = this.tileSize * 0.6;
      this.labelText.position.set(0, -this.tileSize * 0.1);
    }

    // Draw connection road in the direction of opening (after rotation)
    const openings = this.getOpenings();
    openings.forEach((direction) => {
      switch (direction) {
        case Direction.North:
          this.graphics
            .rect(-roadWidth / 2, -halfSize, roadWidth, halfSize - this.tileSize * 0.3)
            .fill(0x95a5a6);
          break;
        case Direction.South:
          this.graphics
            .rect(-roadWidth / 2, this.tileSize * 0.2, roadWidth, halfSize - this.tileSize * 0.2)
            .fill(0x95a5a6);
          break;
        case Direction.East:
          this.graphics
            .rect(this.tileSize * 0.2, -roadWidth / 2, halfSize - this.tileSize * 0.2, roadWidth)
            .fill(0x95a5a6);
          break;
        case Direction.West:
          this.graphics
            .rect(-halfSize, -roadWidth / 2, halfSize - this.tileSize * 0.3, roadWidth)
            .fill(0x95a5a6);
          break;
      }
    });
  }

  /**
   * Draw landmark icon (service destinations: diner, gas station, market)
   */
  private drawLandmarkIcon(): void {
    const halfSize = this.tileSize / 2;
    const roadWidth = this.tileSize * 0.3;

    // Get appropriate icon for landmark type
    const icon = this.getLandmarkIcon();
    if (this.labelText) {
      this.labelText.text = icon;
      this.labelText.style.fontSize = this.tileSize * 0.6;
      this.labelText.position.set(0, -this.tileSize * 0.1);
    }

    // Draw connection road in the direction of opening (after rotation)
    const openings = this.getOpenings();
    openings.forEach((direction) => {
      switch (direction) {
        case Direction.North:
          this.graphics
            .rect(-roadWidth / 2, -halfSize, roadWidth, halfSize - this.tileSize * 0.3)
            .fill(0x95a5a6);
          break;
        case Direction.South:
          this.graphics
            .rect(-roadWidth / 2, this.tileSize * 0.2, roadWidth, halfSize - this.tileSize * 0.2)
            .fill(0x95a5a6);
          break;
        case Direction.East:
          this.graphics
            .rect(this.tileSize * 0.2, -roadWidth / 2, halfSize - this.tileSize * 0.2, roadWidth)
            .fill(0x95a5a6);
          break;
        case Direction.West:
          this.graphics
            .rect(-halfSize, -roadWidth / 2, halfSize - this.tileSize * 0.3, roadWidth)
            .fill(0x95a5a6);
          break;
      }
    });
  }

  /**
   * Get emoji icon for landmark type
   */
  private getLandmarkIcon(): string {
    // Use custom icon if provided
    if (this.customIcon) {
      return this.customIcon;
    }

    // Otherwise use landmark-specific icons
    switch (this.landmarkType) {
      case LandmarkType.Diner:
        return "🍔"; // or 🍽️ for restaurant
      case LandmarkType.GasStation:
        return "⛽";
      case LandmarkType.Market:
        return "🏪"; // or 🛒 for shopping cart
      default:
        return "🏛️"; // Fallback
    }
  }

  /**
   * Draw turnpike/highway gate icon (🚧)
   */
  private drawTurnpikeIcon(color: number, roadWidth: number): void {
    const halfSize = this.tileSize / 2;

    // Draw road going through
    const openings = this.getOpenings();
    openings.forEach((direction) => {
      switch (direction) {
        case Direction.North:
          this.graphics
            .rect(-roadWidth / 2, -halfSize, roadWidth, halfSize + roadWidth / 2)
            .fill(color);
          break;
        case Direction.South:
          this.graphics
            .rect(-roadWidth / 2, -roadWidth / 2, roadWidth, halfSize + roadWidth / 2)
            .fill(color);
          break;
      }
    });

    // Draw emoji icon for toll gate
    if (this.labelText) {
      this.labelText.text = "🚧"; // or 🛂 (passport control) for toll booth feel
      this.labelText.style.fontSize = this.tileSize * 0.5;
      this.labelText.position.set(0, 0);
    }
  }

  /**
   * Draw regular road segments
   */
  private drawRoadSegments(color: number, roadWidth: number): void {
    const halfSize = this.tileSize / 2;
    const openings = this.getOpenings();

    openings.forEach((direction) => {
      this.graphics.beginPath();

      switch (direction) {
        case Direction.North:
          this.graphics.rect(
            -roadWidth / 2,
            -halfSize,
            roadWidth,
            halfSize + roadWidth / 2
          );
          break;
        case Direction.East:
          this.graphics.rect(
            -roadWidth / 2,
            -roadWidth / 2,
            halfSize + roadWidth / 2,
            roadWidth
          );
          break;
        case Direction.South:
          this.graphics.rect(
            -roadWidth / 2,
            -roadWidth / 2,
            roadWidth,
            halfSize + roadWidth / 2
          );
          break;
        case Direction.West:
          this.graphics.rect(
            -halfSize,
            -roadWidth / 2,
            halfSize + roadWidth / 2,
            roadWidth
          );
          break;
      }

      this.graphics.fill(color);
    });

    // Draw center junction if multiple openings
    if (openings.length > 1) {
      this.graphics
        .circle(0, 0, roadWidth / 2)
        .fill(color)
        .stroke({ width: 2, color: 0xffffff });
    }

    // Add road markings for highways
    if (this.roadType === RoadType.Highway || this.roadType === RoadType.ArterialRoad) {
      this.drawRoadMarkings(roadWidth, openings);
    }
  }

  /**
   * Draw road markings (dashed lines for highways)
   */
  private drawRoadMarkings(roadWidth: number, openings: Direction[]): void {
    const dashLength = this.tileSize * 0.1;
    const dashGap = this.tileSize * 0.05;
    const lineWidth = 2;

    openings.forEach((direction) => {
      switch (direction) {
        case Direction.North:
        case Direction.South:
          // Vertical dashed line
          for (let i = 0; i < 3; i++) {
            this.graphics
              .rect(0, -this.tileSize / 2 + i * (dashLength + dashGap), lineWidth, dashLength)
              .fill(0xf1c40f);
          }
          break;
        case Direction.East:
        case Direction.West:
          // Horizontal dashed line
          for (let i = 0; i < 3; i++) {
            this.graphics
              .rect(-this.tileSize / 2 + i * (dashLength + dashGap), 0, dashLength, lineWidth)
              .fill(0xf1c40f);
          }
          break;
      }
    });
  }

  /**
   * Get color based on road type hierarchy
   */
  private getColorForRoadType(): number {
    switch (this.roadType) {
      case RoadType.House:
        return 0xe74c3c; // Red
      case RoadType.LocalRoad:
        return 0x95a5a6; // Gray
      case RoadType.ArterialRoad:
        return 0xf39c12; // Orange
      case RoadType.Highway:
        return 0xe67e22; // Dark orange
      case RoadType.Turnpike:
        return 0x9b59b6; // Purple
      case RoadType.Landmark:
        return 0x2ecc71; // Green
      default:
        return 0x95a5a6;
    }
  }

  /**
   * Get current openings based on tile type and rotation
   */
  public getOpenings(): Direction[] {
    const baseOpenings = BASE_OPENINGS[this.tileType] ?? [];
    return this.rotateOpenings(baseOpenings, this.rotationDegrees);
  }

  /**
   * Rotate openings based on rotation amount
   */
  private rotateOpenings(openings: Direction[], degrees: number): Direction[] {
    const steps = (degrees / 90) % 4;
    const directionOrder = [
      Direction.North,
      Direction.East,
      Direction.South,
      Direction.West,
    ];

    return openings.map((direction) => {
      const currentIndex = directionOrder.indexOf(direction);
      const newIndex = (currentIndex + steps) % 4;
      return directionOrder[newIndex];
    });
  }

  /**
   * Rotate tile by 90 degrees clockwise
   */
  public rotate(): void {
    if (!this.rotatable) return;

    this.rotationDegrees = (this.rotationDegrees + 90) % 360;
    this.draw();
  }

  /**
   * Resize tile (called by CityGrid when viewport changes)
   */
  public resize(newSize: number): void {
    this.tileSize = newSize;
    this.draw();
  }

  /**
   * Check if this tile connects to another tile in a given direction
   */
  public connectsTo(
    other: RoadTile,
    direction: Direction
  ): { directionsMatch: boolean; typesCompatible: boolean } {
    // Check if this tile has an opening in the given direction
    const myOpenings = this.getOpenings();
    const hasOpening = myOpenings.includes(direction);

    // Check if other tile has opening in opposite direction
    const oppositeDirection = this.getOppositeDirection(direction);
    const otherOpenings = other.getOpenings();
    const otherHasOpening = otherOpenings.includes(oppositeDirection);

    const directionsMatch = hasOpening && otherHasOpening;

    // Check if road types are compatible via hierarchy
    const allowedConnections = CONNECTION_RULES[this.roadType] ?? [];
    const typesCompatible = allowedConnections.includes(other.roadType);

    return { directionsMatch, typesCompatible };
  }

  /**
   * Get opposite direction
   */
  private getOppositeDirection(direction: Direction): Direction {
    switch (direction) {
      case Direction.North:
        return Direction.South;
      case Direction.East:
        return Direction.West;
      case Direction.South:
        return Direction.North;
      case Direction.West:
        return Direction.East;
    }
  }

  /**
   * Attach a primitive to this entity
   */
  addPrimitive(type: string, primitive: Primitive, config: any): void {
    primitive.init(this, config);
    this.primitives.set(type, primitive);
  }

  /**
   * Get a primitive by type name
   */
  getPrimitive(type: string): Primitive | null {
    return this.primitives.get(type) ?? null;
  }

  /**
   * Update all attached primitives
   */
  update(deltaTime: number): void {
    this.primitives.forEach((primitive) => primitive.update(deltaTime));
  }

  /**
   * Clean up all primitives
   */
  override destroy(): void {
    this.primitives.forEach((primitive) => primitive.destroy());
    this.primitives.clear();
    super.destroy();
  }
}
