import {
  Container,
  Graphics,
  Text,
  Sprite,
  Assets,
  type FederatedPointerEvent,
} from "pixi.js";

import type { EntityConfig } from "../config/types";
import { UI_CONFIG } from "../config/ui-config";
import { audioManager } from "../AudioManager";
import { ParticleManager } from "../effects/ParticleManager";

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
  Turnpike = "turnpike",
  Landmark = "landmark", // Service destinations: diner, gas station, market
}

/**
 * Landmark types (service destinations)
 */
export enum LandmarkType {
  Home = "home",
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
  crossroads: [
    Direction.North,
    Direction.East,
    Direction.South,
    Direction.West,
  ],
  house: [Direction.South], // Houses connect downward
  landmark: [Direction.North, Direction.East, Direction.South, Direction.West], // Landmarks connect from all sides like turnpikes for proper connection graph building
  turnpike: [Direction.North, Direction.East, Direction.South, Direction.West], // Turnpikes connect from all sides
};

/**
 * Connection rules: which road types can connect to which
 */
export const CONNECTION_RULES: Record<RoadType, RoadType[]> = {
  [RoadType.House]: [RoadType.LocalRoad],
  [RoadType.LocalRoad]: [
    RoadType.LocalRoad,
    RoadType.House,
    RoadType.Landmark,
    RoadType.Turnpike,
  ],
  [RoadType.Turnpike]: [RoadType.Landmark, RoadType.LocalRoad],
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
 * Key Features:
 * - Click/tap to rotate tiles 90° (if rotatable)
 * - Direction-based connections (N, E, S, W)
 * - Road type hierarchy (house → local → turnpike → landmark)
 * - Rotation in 90° increments
 * - Visual representation of road type and openings
 * - Hover effects for interactive feedback
 */
export class RoadTile extends Container {
  private graphics: Graphics;
  private labelText?: Text;
  private houseSprite?: Sprite; // House image sprite
  private turnpikeSprite?: Sprite; // Turnpike image sprite
  private landmarkSprite?: Sprite; // Generic landmark image sprite (gas, diner, market)

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
    const roadConfig = ((config.config as RoadTileConfig) ?? {}) as any;
    this.tileType = roadConfig.tileType ?? "straight";
    this.roadType = roadConfig.roadType ?? RoadType.LocalRoad;
    this.rotationDegrees = roadConfig.rotation ?? 0;
    this.rotatable = roadConfig.rotatable ?? true;
    this.gridPos = roadConfig.gridPos ?? { row: 0, col: 0 };
    this.tileSize = roadConfig.size ?? 80;
    this.landmarkType = (roadConfig as any).landmarkType;
    this.customIcon = (roadConfig as any).icon;

    // Create visual representation
    this.graphics = new Graphics();
    this.addChild(this.graphics);

    // Setup click interaction directly (no primitive needed)
    this.setupClickInteraction();

    // Create debug label only for special tiles (house, landmark, turnpike)
    // Not for regular road tiles (corner, straight, t_junction, crossroads)
    const isSpecialTile =
      this.roadType === RoadType.House ||
      this.roadType === RoadType.Landmark ||
      this.roadType === RoadType.Turnpike;

    if (isSpecialTile) {
      this.labelText = new Text({
        text: this.tileType[0].toUpperCase(),
        style: {
          fontSize: 12,
          fill: UI_CONFIG.COLORS.textWhite,
        },
      });
      this.labelText.anchor.set(0.5);
      this.addChild(this.labelText);
    }

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
      .fill(UI_CONFIG.COLORS.tileBackground);

    // Draw grid lines
    this.graphics
      .rect(-halfSize, -halfSize, this.tileSize, this.tileSize)
      .stroke({ width: 1, color: UI_CONFIG.COLORS.tileGridLine });

    // Draw based on specific type with icons
    switch (this.roadType) {
      case RoadType.House:
        this.drawHouseIcon();
        break;
      case RoadType.Landmark:
        this.drawLandmarkIcon();
        break;
      case RoadType.Turnpike:
        this.drawTurnpikeIcon();
        break;
      default:
        this.drawRoadSegments(color, roadWidth);
        break;
    }

    // Visual indicator if rotatable (removed for cleaner look)
    // if (this.rotatable) {
    //   this.graphics
    //     .circle(halfSize * 0.7, halfSize * 0.7, 6)
    //     .fill(UI_CONFIG.COLORS.tileRotationIndicator)
    //     .stroke({ width: 1, color: UI_CONFIG.COLORS.textWhite });
    // }
  }

  /**
   * Draw house icon (🏠 or house.png image)
   */
  private drawHouseIcon(): void {
    console.log("[RoadTile] 🏠 drawHouseIcon() called");
    const halfSize = this.tileSize / 2;
    const roadWidth = this.tileSize * 0.3;

    // Try to load and use house.png image
    let houseTexture = null;
    try {
      // Try different asset names
      houseTexture =
        Assets.cache.get("house.png") ||
        Assets.cache.get("main/images/house.png");

      console.log("[RoadTile] House texture lookup:", {
        "house.png": Assets.cache.has("house.png"),
        "main/images/house.png": Assets.cache.has("main/images/house.png"),
        found: !!houseTexture,
      });
    } catch (error) {
      console.warn("[RoadTile] Failed to get house texture:", error);
    }

    if (houseTexture) {
      // Remove old house sprite if exists
      if (this.houseSprite) {
        this.removeChild(this.houseSprite);
      }

      // Create new house sprite
      this.houseSprite = new Sprite(houseTexture);
      this.houseSprite.anchor.set(0.5);

      // Size the sprite to fit nicely in the tile (from ui-config)
      const scale = UI_CONFIG.GRID.imageScales.home;
      const iconSize = this.tileSize * scale;
      this.houseSprite.width = iconSize;
      this.houseSprite.height = iconSize;

      // Position slightly above center
      this.houseSprite.position.set(0, -this.tileSize * 0.05);

      this.addChild(this.houseSprite);

      // Hide text label if we have the image
      if (this.labelText) {
        this.labelText.visible = false;
      }

      console.log("[RoadTile] ✅ House sprite created successfully");
    } else {
      // Fallback to emoji icon if image not loaded
      if (this.labelText) {
        this.labelText.visible = true;
        this.labelText.text = "🏠";
        this.labelText.style.fontSize = this.tileSize * 0.6;
        this.labelText.position.set(0, -this.tileSize * 0.1);
      }
      console.log(
        "[RoadTile] ⚠️ Using emoji fallback - house texture not found",
      );
    }

    // Draw connection road in the direction of opening (after rotation)
    const openings = this.getOpenings();
    openings.forEach((direction) => {
      switch (direction) {
        case Direction.North:
          this.graphics
            .rect(
              -roadWidth / 2,
              -halfSize,
              roadWidth,
              halfSize - this.tileSize * 0.3,
            )
            .fill(UI_CONFIG.COLORS.roadColor);
          break;
        case Direction.South:
          this.graphics
            .rect(
              -roadWidth / 2,
              this.tileSize * 0.2,
              roadWidth,
              halfSize - this.tileSize * 0.2,
            )
            .fill(UI_CONFIG.COLORS.roadColor);
          break;
        case Direction.East:
          this.graphics
            .rect(
              this.tileSize * 0.2,
              -roadWidth / 2,
              halfSize - this.tileSize * 0.2,
              roadWidth,
            )
            .fill(UI_CONFIG.COLORS.roadColor);
          break;
        case Direction.West:
          this.graphics
            .rect(
              -halfSize,
              -roadWidth / 2,
              halfSize - this.tileSize * 0.3,
              roadWidth,
            )
            .fill(UI_CONFIG.COLORS.roadColor);
          break;
      }
    });
  }

  /**
   * Draw landmark icon (service destinations: diner, gas station, market)
   */
  private drawLandmarkIcon(): void {
    console.log(
      "[RoadTile] 🏛️ drawLandmarkIcon() called, type:",
      this.landmarkType,
    );
    const halfSize = this.tileSize / 2;
    const roadWidth = this.tileSize * 0.3;

    // If this is a home landmark, try to use house.png image
    if (this.landmarkType === LandmarkType.Home) {
      let houseTexture = null;
      try {
        houseTexture =
          Assets.cache.get("house.png") ||
          Assets.cache.get("main/images/house.png");

        console.log("[RoadTile] Home landmark texture lookup:", {
          "house.png": Assets.cache.has("house.png"),
          "main/images/house.png": Assets.cache.has("main/images/house.png"),
          found: !!houseTexture,
        });
      } catch (error) {
        console.warn("[RoadTile] Failed to get house texture:", error);
      }

      if (houseTexture) {
        // Remove old house sprite if exists
        if (this.houseSprite) {
          this.removeChild(this.houseSprite);
        }

        // Create new house sprite
        this.houseSprite = new Sprite(houseTexture);
        this.houseSprite.anchor.set(0.5);

        // Size the sprite to fit nicely in the tile (from ui-config)
        const scale = UI_CONFIG.GRID.imageScales.home;
        const iconSize = this.tileSize * scale;
        this.houseSprite.width = iconSize;
        this.houseSprite.height = iconSize;

        // Position slightly above center
        this.houseSprite.position.set(0, -this.tileSize * 0.05);

        this.addChild(this.houseSprite);

        // Hide text label if we have the image
        if (this.labelText) {
          this.labelText.visible = false;
        }

        console.log("[RoadTile] ✅ Home landmark sprite created successfully");
      } else {
        // Fallback to emoji
        const icon = this.getLandmarkIcon();
        if (this.labelText) {
          this.labelText.visible = true;
          this.labelText.text = icon;
          this.labelText.style.fontSize = this.tileSize * 0.6;
          this.labelText.position.set(0, -this.tileSize * 0.1);
        }
        console.log("[RoadTile] ⚠️ Using emoji fallback for home");
      }
    } else if (this.landmarkType === LandmarkType.GasStation) {
      // Gas station - try to use gas.png image
      let gasTexture = null;
      try {
        gasTexture =
          Assets.cache.get("gas.png") ||
          Assets.cache.get("main/images/gas.png");

        console.log("[RoadTile] Gas station texture lookup:", {
          "gas.png": Assets.cache.has("gas.png"),
          "main/images/gas.png": Assets.cache.has("main/images/gas.png"),
          found: !!gasTexture,
        });
      } catch (error) {
        console.warn("[RoadTile] Failed to get gas texture:", error);
      }

      if (gasTexture) {
        // Remove old landmark sprite if exists
        if (this.landmarkSprite) {
          this.removeChild(this.landmarkSprite);
        }

        // Create new gas station sprite
        this.landmarkSprite = new Sprite(gasTexture);
        this.landmarkSprite.anchor.set(0.5);

        // Size the sprite to fit nicely in the tile (from ui-config)
        const scale = UI_CONFIG.GRID.imageScales.gas_station;
        const iconSize = this.tileSize * scale;
        this.landmarkSprite.width = iconSize;
        this.landmarkSprite.height = iconSize;

        // Position slightly above center
        this.landmarkSprite.position.set(0, -this.tileSize * 0.05);

        this.addChild(this.landmarkSprite);

        // Hide text label if we have the image
        if (this.labelText) {
          this.labelText.visible = false;
        }

        console.log("[RoadTile] ✅ Gas station sprite created successfully");
      } else {
        // Fallback to emoji
        const icon = this.getLandmarkIcon();
        if (this.labelText) {
          this.labelText.visible = true;
          this.labelText.text = icon;
          this.labelText.style.fontSize = this.tileSize * 0.6;
          this.labelText.position.set(0, -this.tileSize * 0.1);
        }
        console.log("[RoadTile] ⚠️ Using emoji fallback for gas station");
      }
    } else if (this.landmarkType === LandmarkType.Diner) {
      // Diner - try to use diner.png image
      let dinerTexture = null;
      try {
        dinerTexture =
          Assets.cache.get("diner.png") ||
          Assets.cache.get("main/images/diner.png");

        console.log("[RoadTile] Diner texture lookup:", {
          "diner.png": Assets.cache.has("diner.png"),
          "main/images/diner.png": Assets.cache.has("main/images/diner.png"),
          found: !!dinerTexture,
        });
      } catch (error) {
        console.warn("[RoadTile] Failed to get diner texture:", error);
      }

      if (dinerTexture) {
        // Remove old landmark sprite if exists
        if (this.landmarkSprite) {
          this.removeChild(this.landmarkSprite);
        }

        // Create new diner sprite
        this.landmarkSprite = new Sprite(dinerTexture);
        this.landmarkSprite.anchor.set(0.5);

        // Size the sprite to fit nicely in the tile (from ui-config)
        const scale = UI_CONFIG.GRID.imageScales.diner;
        const iconSize = this.tileSize * scale;
        this.landmarkSprite.width = iconSize;
        this.landmarkSprite.height = iconSize;

        // Position slightly above center
        this.landmarkSprite.position.set(0, -this.tileSize * 0.05);

        this.addChild(this.landmarkSprite);

        // Hide text label if we have the image
        if (this.labelText) {
          this.labelText.visible = false;
        }

        console.log("[RoadTile] ✅ Diner sprite created successfully");
      } else {
        // Fallback to emoji
        const icon = this.getLandmarkIcon();
        if (this.labelText) {
          this.labelText.visible = true;
          this.labelText.text = icon;
          this.labelText.style.fontSize = this.tileSize * 0.6;
          this.labelText.position.set(0, -this.tileSize * 0.1);
        }
        console.log("[RoadTile] ⚠️ Using emoji fallback for diner");
      }
    } else {
      // Other landmark types (market) - use emoji
      const icon = this.getLandmarkIcon();
      if (this.labelText) {
        this.labelText.text = icon;
        this.labelText.style.fontSize = this.tileSize * 0.6;
        this.labelText.position.set(0, -this.tileSize * 0.1);
      }
    }

    // Draw connection road in the direction of opening (after rotation)
    const openings = this.getOpenings();
    openings.forEach((direction) => {
      switch (direction) {
        case Direction.North:
          this.graphics
            .rect(
              -roadWidth / 2,
              -halfSize,
              roadWidth,
              halfSize - this.tileSize * 0.3,
            )
            .fill(UI_CONFIG.COLORS.roadColor);
          break;
        case Direction.South:
          this.graphics
            .rect(
              -roadWidth / 2,
              this.tileSize * 0.2,
              roadWidth,
              halfSize - this.tileSize * 0.2,
            )
            .fill(UI_CONFIG.COLORS.roadColor);
          break;
        case Direction.East:
          this.graphics
            .rect(
              this.tileSize * 0.2,
              -roadWidth / 2,
              halfSize - this.tileSize * 0.2,
              roadWidth,
            )
            .fill(UI_CONFIG.COLORS.roadColor);
          break;
        case Direction.West:
          this.graphics
            .rect(
              -halfSize,
              -roadWidth / 2,
              halfSize - this.tileSize * 0.3,
              roadWidth,
            )
            .fill(UI_CONFIG.COLORS.roadColor);
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
      case LandmarkType.Home:
        return "🏠";
      case LandmarkType.Diner:
        return "🍔"; // or 🍽️ for restaurant
      case LandmarkType.GasStation:
        return "⛽";
      case LandmarkType.Market:
        return "🏪"; // or 🛒 for shopping cart
      default:
        return "🏠"; // Fallback to home icon
    }
  }

  /**
   * Draw turnpike gate icon (🚧)
   */
  private drawTurnpikeIcon(): void {
    console.log("[RoadTile] 🚧 drawTurnpikeIcon() called");

    // No road graphics - just show the turnpike icon on empty tile

    // Try to load and use turnpike.png image
    let turnpikeTexture = null;
    try {
      turnpikeTexture =
        Assets.cache.get("turnpike.png") ||
        Assets.cache.get("main/images/turnpike.png");

      console.log("[RoadTile] Turnpike texture lookup:", {
        "turnpike.png": Assets.cache.has("turnpike.png"),
        "main/images/turnpike.png": Assets.cache.has(
          "main/images/turnpike.png",
        ),
        found: !!turnpikeTexture,
      });
    } catch (error) {
      console.warn("[RoadTile] Failed to get turnpike texture:", error);
    }

    if (turnpikeTexture) {
      // Remove old turnpike sprite if exists
      if (this.turnpikeSprite) {
        this.removeChild(this.turnpikeSprite);
      }

      // Create new turnpike sprite
      this.turnpikeSprite = new Sprite(turnpikeTexture);
      this.turnpikeSprite.anchor.set(0.5);

      // Size the sprite to fit nicely in the tile (from ui-config)
      const scale = UI_CONFIG.GRID.imageScales.turnpike;
      const iconSize = this.tileSize * scale;
      this.turnpikeSprite.width = iconSize;
      this.turnpikeSprite.height = iconSize;

      // Position at center
      this.turnpikeSprite.position.set(0, 0);

      this.addChild(this.turnpikeSprite);

      // Hide text label if we have the image
      if (this.labelText) {
        this.labelText.visible = false;
      }

      console.log("[RoadTile] ✅ Turnpike sprite created successfully");
    } else {
      // Fallback to emoji icon for toll gate
      if (this.labelText) {
        this.labelText.visible = true;
        this.labelText.text = "🚧"; // or 🛂 (passport control) for toll booth feel
        this.labelText.style.fontSize = this.tileSize * 0.5;
        this.labelText.position.set(0, 0);
      }
      console.log("[RoadTile] ⚠️ Using emoji fallback for turnpike");
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
            halfSize + roadWidth / 2,
          );
          break;
        case Direction.East:
          this.graphics.rect(
            -roadWidth / 2,
            -roadWidth / 2,
            halfSize + roadWidth / 2,
            roadWidth,
          );
          break;
        case Direction.South:
          this.graphics.rect(
            -roadWidth / 2,
            -roadWidth / 2,
            roadWidth,
            halfSize + roadWidth / 2,
          );
          break;
        case Direction.West:
          this.graphics.rect(
            -halfSize,
            -roadWidth / 2,
            halfSize + roadWidth / 2,
            roadWidth,
          );
          break;
      }

      this.graphics.fill(color);
    });

    // Center junction circles removed for cleaner look
    // if (openings.length > 1) {
    //   this.graphics
    //     .circle(0, 0, roadWidth / 2)
    //     .fill(color)
    //     .stroke({ width: 2, color: UI_CONFIG.COLORS.textWhite });
    // }

    // Road markings removed (no highway type)
  }

  /**
   * Draw road markings (dashed lines) - currently unused
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
              .rect(
                0,
                -this.tileSize / 2 + i * (dashLength + dashGap),
                lineWidth,
                dashLength,
              )
              .fill(UI_CONFIG.COLORS.roadMarkings);
          }
          break;
        case Direction.East:
        case Direction.West:
          // Horizontal dashed line
          for (let i = 0; i < 3; i++) {
            this.graphics
              .rect(
                -this.tileSize / 2 + i * (dashLength + dashGap),
                0,
                dashLength,
                lineWidth,
              )
              .fill(UI_CONFIG.COLORS.roadMarkings);
          }
          break;
      }
    });
  }

  /**
   * Get color based on road type hierarchy
   * Returns highlighted color if connected to turnpike
   */
  private getColorForRoadType(): number {
    // If highlighted (connected to turnpike), return green color
    if (this.isHighlighted) {
      return 0x4caf50; // Green color for connected roads
    }

    // Otherwise return default color based on road type
    const colors = UI_CONFIG.COLORS.roadTypeColors;
    switch (this.roadType) {
      case RoadType.House:
        return colors.house;
      case RoadType.LocalRoad:
        return colors.localRoad;
      case RoadType.Turnpike:
        return colors.turnpike;
      case RoadType.Landmark:
        return colors.landmark;
      default:
        return colors.localRoad;
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
    direction: Direction,
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
   * Setup click/tap interaction for rotating tiles
   */
  private setupClickInteraction(): void {
    // Make entity interactive
    this.eventMode = "static";
    this.cursor = this.rotatable ? "pointer" : "default";

    // Listen for click/tap events
    this.on("pointerdown", this.handlePointerDown);

    // Add hover effect for feedback
    this.on("pointerover", this.handlePointerOver);
    this.on("pointerout", this.handlePointerOut);
  }

  /**
   * Handle pointer down (click/tap)
   */
  private handlePointerDown = (event: FederatedPointerEvent) => {
    // Prevent event propagation
    event.stopPropagation();

    // Only rotate if tile is rotatable
    if (!this.rotatable) {
      console.log(
        `[RoadTile] ⚠️ Tile at (${this.gridPos.row}, ${this.gridPos.col}) is not rotatable`,
      );
      return;
    }

    // Perform rotation
    this.rotate();

    // Play rotation sound
    audioManager.playRotateSound();

    // Create particle burst effect
    try {
      const particleManager = ParticleManager.getInstance();
      const localPos = this.position;
      particleManager.createBurst(localPos.x, localPos.y, 50, {
        color: 0x2d5016, // Dark green
        size: 2,
        speed: 8,
        lifetime: 0.5,
      });
    } catch (error) {
      console.warn("[RoadTile] ParticleManager not available:", error);
    }

    console.log(
      `[RoadTile] 🔄 Tile rotated to ${this.rotation}° at (${this.gridPos.row}, ${this.gridPos.col})`,
    );

    // Emit event for path validation
    const eventData = {
      tile: this,
      rotation: this.rotation,
      gridPos: this.gridPos,
    };

    this.emit("tile_rotated", eventData);

    // Visual feedback: brief scale animation
    this.scale.set(0.95, 0.95);
    setTimeout(() => {
      this.scale.set(1, 1);
    }, 100);
  };

  /**
   * Handle pointer over (hover)
   */
  private handlePointerOver = () => {
    if (this.rotatable) {
      // Slight scale up on hover
      this.scale.set(1.05, 1.05);
    }
  };

  /**
   * Handle pointer out (unhover)
   */
  private handlePointerOut = () => {
    // Reset scale
    this.scale.set(1, 1);
  };

  /**
   * Get the landmark image sprite for animation
   * Returns the sprite (home, diner, gas station, etc.) if it exists
   */
  public getLandmarkImageSprite(): Sprite | undefined {
    if (this.houseSprite) return this.houseSprite;
    if (this.landmarkSprite) return this.landmarkSprite;
    return undefined;
  }

  /**
   * Highlight state for connected roads
   */
  private isHighlighted = false;

  /**
   * Set highlight state (changes road color when connected to turnpike)
   */
  public setHighlighted(highlighted: boolean): void {
    if (this.isHighlighted !== highlighted) {
      this.isHighlighted = highlighted;
      this.draw(); // Redraw with new color
    }
  }

  /**
   * Get if this tile is highlighted
   */
  public getIsHighlighted(): boolean {
    return this.isHighlighted;
  }

  /**
   * Update method (no longer needed for primitives, but kept for compatibility)
   */
  update(_deltaTime: number): void {
    // No per-frame updates needed
  }

  /**
   * Clean up event listeners
   */
  override destroy(): void {
    this.off("pointerdown", this.handlePointerDown);
    this.off("pointerover", this.handlePointerOver);
    this.off("pointerout", this.handlePointerOut);
    this.eventMode = "auto";
    this.cursor = "default";
    super.destroy();
  }
}
