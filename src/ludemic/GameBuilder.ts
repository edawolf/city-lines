import { Container, EventEmitter } from "pixi.js";

import type { GameConfig, EntityConfig } from "./config/types";
import { EntityFactory } from "./entities/EntityFactory";
import { PrimitiveFactory } from "./primitives/PrimitiveFactory";
import type { Primitive, PrimitiveConfig } from "./primitives/Primitive";
import { BlockGrid } from "./layouts/BlockGrid";
import { ScoreDisplay } from "./ui/ScoreDisplay";
import { ComboDisplay } from "./ui/ComboDisplay";
import { HealthDisplay } from "./ui/HealthDisplay";
import { GameOverScreen } from "./ui/GameOverScreen";
import { LevelCompleteScreen } from "./ui/LevelCompleteScreen";
import { HeadlineDisplay } from "./ui/HeadlineDisplay";
import { Particle } from "./primitives/juice/Particle";
import type { TuningSystem } from "./tuning/TuningSystem";
import { ParticleManager } from "./effects/ParticleManager";

/**
 * GameContainer
 *
 * Main game container that holds all entities and manages update loop.
 * Provides entity lookup by ID and type for primitive communication.
 * Extends EventEmitter to allow primitives to emit/listen for game events.
 * Manages particle system and screen shake effects.
 */
export class GameContainer extends Container {
  private entities: Container[] = [];
  private entityMap = new Map<string, Container>();
  private entityTypeMap = new Map<string, Container[]>();
  private eventEmitter = new EventEmitter();
  private score = 0;
  private scoreDisplay?: ScoreDisplay;
  private comboDisplay?: ComboDisplay;
  private headlineDisplay?: HeadlineDisplay;

  // Tuning system for runtime parameter adjustment
  public tuningSystem?: TuningSystem;

  // Juice systems
  private particles: Particle[] = [];
  public particleContainer?: Container; // Container for screen-wide particle effects
  public particleManager?: ParticleManager; // ParticleManager (initialized at GameContainer level)
  private shakeOffset = { x: 0, y: 0 };
  private shakeIntensity = 0;
  private shakeDuration = 0;
  private shakeFrequency = 30;
  private shakeTime = 0;
  private basePosition = { x: 0, y: 0 };

  // Difficulty systems
  private scoreMultiplier = 1.0;

  // Game lifecycle systems
  private healthDisplay?: HealthDisplay;
  private gameOverScreen?: GameOverScreen;
  private levelCompleteScreen?: LevelCompleteScreen;
  private currentLevel = 1;
  private highScore = 0;
  private gameState: "playing" | "paused" | "game_over" | "level_complete" =
    "playing";
  private gameConfig?: GameConfig;

  // Viewport dimensions (updated on resize)
  private viewportWidth = 0; // Will be set by updateViewport() - no hardcoded default
  private viewportHeight = 0; // Will be set by updateViewport() - no hardcoded default

  // DEBUG: Track update calls
  private updateCallCount = 0;

  // Headlines system
  private headlines: string[] = [];
  private currentHeadlineIndex = 0;

  /**
   * Add an entity to the game
   */
  addEntity(entity: Container, id?: string, type?: string): void {
    this.entities.push(entity);
    this.addChild(entity);

    // Store by ID for quick lookup
    if (id) {
      this.entityMap.set(id, entity);
    }

    // Store by type for batch operations (e.g., get all enemies)
    if (type) {
      if (!this.entityTypeMap.has(type)) {
        this.entityTypeMap.set(type, []);
      }
      this.entityTypeMap.get(type)!.push(entity);
    }
  }

  /**
   * Get entity by ID
   */
  getEntityById(id: string): Container | undefined {
    return this.entityMap.get(id);
  }

  /**
   * Get all entities of a type
   */
  getEntitiesByType(type: string): Container[] {
    return this.entityTypeMap.get(type) ?? [];
  }

  /**
   * Update all entities, particles, and effects
   */
  update(deltaTime: number): void {
    // Update entities
    this.entities.forEach((entity) => {
      if ("update" in entity && typeof entity.update === "function") {
        (entity as any).update(deltaTime);
      }
    });

    // Update particles (old system)
    this.particles = this.particles.filter((particle) => {
      const alive = particle.update(deltaTime);
      if (!alive) {
        this.removeChild(particle);
        particle.destroy();
      }
      return alive;
    });

    // Update ParticleManager (new system)
    if (this.particleManager) {
      this.particleManager.update(deltaTime);
    }

    // Update HeadlineDisplay (for auto-advance timer)
    if (this.headlineDisplay && "update" in this.headlineDisplay) {
      (this.headlineDisplay as any).update(deltaTime);
    }

    // Update screen shake
    this.updateShake(deltaTime);
  }

  /**
   * Update screen shake effect
   */
  private updateShake(deltaTime: number): void {
    if (this.shakeDuration <= 0) {
      // No shake active, restore position
      if (this.shakeOffset.x !== 0 || this.shakeOffset.y !== 0) {
        this.position.set(this.basePosition.x, this.basePosition.y);
        this.shakeOffset = { x: 0, y: 0 };
      }
      return;
    }

    // Decrease shake duration
    this.shakeDuration -= deltaTime;
    this.shakeTime += deltaTime;

    // Calculate shake offset
    const t = this.shakeTime * this.shakeFrequency;
    const decay = this.shakeDuration / (this.shakeDuration + deltaTime); // Fade out

    this.shakeOffset.x =
      Math.sin(t) * this.shakeIntensity * decay * (Math.random() - 0.5);
    this.shakeOffset.y =
      Math.cos(t * 1.3) * this.shakeIntensity * decay * (Math.random() - 0.5);

    // Apply shake
    this.position.set(
      this.basePosition.x + this.shakeOffset.x,
      this.basePosition.y + this.shakeOffset.y,
    );
  }

  /**
   * Emit game event for primitives to listen to
   */
  emitGame(event: string, ...args: any[]): void {
    this.eventEmitter.emit(event, ...args);
  }

  /**
   * Listen for game events
   */
  onGame(event: string, fn: (...args: any[]) => void): void {
    this.eventEmitter.on(event, fn);
  }

  /**
   * Remove event listener
   */
  offGame(event: string, fn: (...args: any[]) => void): void {
    this.eventEmitter.off(event, fn);
  }

  /**
   * Add points to score (with multiplier)
   */
  addScore(points: number): void {
    const multipliedPoints = Math.round(points * this.scoreMultiplier);
    this.score += multipliedPoints;
    if (this.scoreDisplay) {
      this.scoreDisplay.setScore(this.score);
    }
    this.emitGame("score_changed", this.score);
  }

  /**
   * Get current score
   */
  getScore(): number {
    return this.score;
  }

  /**
   * Set the score display UI component
   */
  setScoreDisplay(display: any): void {
    this.scoreDisplay = display;
    if (this.scoreDisplay) {
      this.scoreDisplay.setScore(this.score);
    }
  }

  /**
   * Reset score to zero
   */
  resetScore(): void {
    this.score = 0;
    if (this.scoreDisplay) {
      this.scoreDisplay.setScore(this.score);
    }
  }

  /**
   * Add a particle to the game
   */
  addParticle(particle: Particle): void {
    this.particles.push(particle);
    this.addChild(particle);
  }

  /**
   * Trigger screen shake effect
   */
  shake(intensity: number, duration: number, frequency?: number): void {
    // Store base position on first shake
    if (this.shakeDuration <= 0) {
      this.basePosition.x = this.position.x;
      this.basePosition.y = this.position.y;
    }

    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeFrequency = frequency ?? 30;
    this.shakeTime = 0;
  }

  /**
   * Get all particles (for debugging)
   */
  getParticles(): Particle[] {
    return this.particles;
  }

  /**
   * Set score multiplier (used by ComboMultiplier primitive)
   */
  setScoreMultiplier(multiplier: number): void {
    this.scoreMultiplier = multiplier;
  }

  /**
   * Get current score multiplier
   */
  getScoreMultiplier(): number {
    return this.scoreMultiplier;
  }

  /**
   * Set the combo display UI component
   */
  setComboDisplay(display: ComboDisplay): void {
    this.comboDisplay = display;

    // Listen for combo events and update display
    this.on("combo_updated", (data: { combo: number; multiplier: number }) => {
      if (this.comboDisplay) {
        this.comboDisplay.setCombo(data.combo, data.multiplier);
      }
    });

    this.on("combo_reset", () => {
      if (this.comboDisplay) {
        this.comboDisplay.reset();
      }
    });
  }

  /**
   * Set the headline display UI component
   */
  setHeadlineDisplay(display: HeadlineDisplay): void {
    this.headlineDisplay = display;
  }

  /**
   * Get the headline display UI component
   */
  getHeadlineDisplay(): HeadlineDisplay | undefined {
    return this.headlineDisplay;
  }

  /**
   * Set the headlines to reveal on level completion
   */
  setHeadlines(headlines: string[]): void {
    this.headlines = headlines;
    this.currentHeadlineIndex = 0;
  }

  /**
   * Get the next headline (cycles through the list)
   */
  private getNextHeadline(): string {
    if (this.headlines.length === 0) {
      return "City connection restored!";
    }
    const headline = this.headlines[this.currentHeadlineIndex];
    this.currentHeadlineIndex =
      (this.currentHeadlineIndex + 1) % this.headlines.length;
    return headline;
  }

  /**
   * Set the health display UI component
   */
  setHealthDisplay(display: HealthDisplay): void {
    this.healthDisplay = display;

    // Listen for health events and update display
    this.on(
      "health_changed",
      (data: { current: number; max: number; delta: number }) => {
        if (this.healthDisplay) {
          this.healthDisplay.setHealth(data.current, data.max);
          if (data.delta > 0) {
            this.healthDisplay.animateLoss();
          }
        }
      },
    );
  }

  /**
   * Set the game over screen UI component
   */
  setGameOverScreen(screen: GameOverScreen): void {
    this.gameOverScreen = screen;
    this.addChild(screen);
    screen.visible = false;
  }

  /**
   * Set the level complete screen UI component
   */
  setLevelCompleteScreen(screen: LevelCompleteScreen): void {
    this.levelCompleteScreen = screen;
    this.addChild(screen);
    screen.visible = false;
  }

  /**
   * Update viewport dimensions (called on resize)
   */
  updateViewport(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;

    // Resize modal screens if they're currently visible
    if (this.gameOverScreen?.visible) {
      this.gameOverScreen.resize(width, height);
    }
    if (this.levelCompleteScreen?.visible) {
      this.levelCompleteScreen.resize(width, height);
    }
  }

  /**
   * Initialize game lifecycle systems
   */
  initializeLifecycle(config: GameConfig, width: number, height: number): void {
    // Store initial viewport dimensions
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.gameConfig = config;
    this.loadHighScore();

    // Wire ball out of bounds to player damage
    this.on("ball_out_of_bounds", () => {
      this.emitGame("player_hit", 1); // Damage amount
    });

    // Listen for player death
    this.on("player_died", () => {
      this.handleGameOver();
    });

    // Listen for level complete
    this.on(
      "level_complete",
      (data: { level: number; blocksCleared: number }) => {
        this.handleLevelComplete(data.level);
      },
    );
  }

  /**
   * Handle game over
   */
  private handleGameOver(): void {
    if (this.gameState === "game_over") return;

    this.gameState = "game_over";

    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }

    // Show game over screen with current viewport dimensions
    if (this.gameOverScreen) {
      this.gameOverScreen.show(
        this.score,
        this.currentLevel,
        this.highScore,
        this.viewportWidth,
        this.viewportHeight,
      );
    }
  }

  /**
   * Handle level complete
   */
  private handleLevelComplete(level: number): void {
    if (this.gameState !== "playing") return;

    this.gameState = "level_complete";
    this.currentLevel = level + 1;

    // Show headline instead of level complete screen
    if (this.headlineDisplay) {
      const headline = this.getNextHeadline();
      const formattedHeadline = `This week: ${headline}`;
      this.headlineDisplay.show(formattedHeadline);
    } else if (this.levelCompleteScreen) {
      // Fallback to level complete screen if no headline display
      this.levelCompleteScreen.show(
        level,
        this.score,
        this.viewportWidth,
        this.viewportHeight,
      );
    }

    // Regenerate level after delay
    setTimeout(() => {
      this.regenerateLevel();
    }, 2500);
  }

  /**
   * Regenerate level
   * Note: City Lines doesn't use block regeneration like Breakout
   * This method is a placeholder for level progression
   */
  private regenerateLevel(): void {
    if (!this.gameConfig) return;

    // Resume playing
    this.gameState = "playing";
  }

  /**
   * Restart the entire game
   */
  restart(width: number, height: number): void {
    // Update viewport dimensions
    this.viewportWidth = width;
    this.viewportHeight = height;

    // Hide screens
    if (this.gameOverScreen) {
      this.gameOverScreen.hide();
    }
    if (this.levelCompleteScreen) {
      this.levelCompleteScreen.hide();
    }

    // Reset score and level
    this.score = 0;
    this.currentLevel = 1;
    this.scoreMultiplier = 1.0;
    if (this.scoreDisplay) {
      this.scoreDisplay.setScore(0);
    }
    if (this.comboDisplay) {
      this.comboDisplay.reset();
    }

    // Reset health
    const gameManager = this.getEntityById("gameManager");
    if (gameManager) {
      const healthSystem = (
        gameManager as Container & {
          getPrimitive?: (type: string) => any;
        }
      ).getPrimitive?.("HealthSystem");
      if (healthSystem && healthSystem.reset) {
        healthSystem.reset();
      }
    }

    // Reset level manager
    if (gameManager) {
      const levelManager = (
        gameManager as Container & {
          getPrimitive?: (type: string) => any;
        }
      ).getPrimitive?.("LevelManager");
      if (levelManager && levelManager.reset) {
        levelManager.reset();
      }
    }

    // Regenerate level
    this.regenerateLevel();

    this.gameState = "playing";
  }

  /**
   * Get current game state
   */
  getGameState(): string {
    return this.gameState;
  }

  /**
   * Load high score from localStorage
   */
  private loadHighScore(): void {
    try {
      const saved = localStorage.getItem("ludemic_high_score");
      if (saved) {
        this.highScore = parseInt(saved, 10);
      }
    } catch (_e) {
      // LocalStorage not available - silently fail
    }
  }

  /**
   * Save high score to localStorage
   */
  private saveHighScore(): void {
    try {
      localStorage.setItem("ludemic_high_score", this.highScore.toString());
    } catch (_e) {
      // LocalStorage not available - silently fail
    }
  }

  /**
   * Get current level
   */
  getLevel(): number {
    return this.currentLevel;
  }

  /**
   * Get high score
   */
  getHighScore(): number {
    return this.highScore;
  }
}

/**
 * GameBuilder
 *
 * Constructs a complete game from JSON configuration.
 * This is where config files become running games.
 *
 * Process:
 * 1. Create entities from config
 * 2. Attach primitives to entities
 * 3. Position entities
 * 4. Return game container ready to add to stage
 */
export class GameBuilder {
  /**
   * Build a game from JSON configuration
   */
  static fromConfig(config: GameConfig, tuningSystem?: any): GameContainer {
    const game = new GameContainer();

    // Inject tuning system BEFORE primitives are initialized
    if (tuningSystem) {
      game.tuningSystem = tuningSystem;
    }

    // Create entities from config (without primitives first)
    config.entities.forEach((entityConfig) => {
      const entity = this.createEntity(entityConfig, false); // Don't attach primitives yet
      game.addEntity(entity, entityConfig.id, entityConfig.type);
    });

    // Handle grid tiles (City Lines specific)
    if ((config as any).gridTiles) {
      const cityGrid = game.getEntityById("city_grid") as any;
      if (cityGrid && cityGrid.addTile) {
        (config as any).gridTiles.forEach((tileConfig: any) => {
          const tileEntityConfig: EntityConfig = {
            type: "RoadTile",
            position: { x: 0, y: 0 }, // Will be positioned by grid
            config: tileConfig,
            // No primitives needed - RoadTile handles click interaction directly
          };
          const tile = this.createEntity(tileEntityConfig, false);
          cityGrid.addTile(tile, tileConfig.row, tileConfig.col);
        });
      }
    }

    // Generate entities from layouts (without primitives first)
    if (config.layouts) {
      config.layouts.forEach((layoutConfig) => {
        const entities = this.createLayout(layoutConfig);
        entities.forEach((entityConfig) => {
          const entity = this.createEntity(entityConfig, false); // Don't attach primitives yet
          game.addEntity(entity, entityConfig.id, entityConfig.type);
        });
      });
    }

    // Now attach primitives to all entities (now they have parent references)
    config.entities.forEach((entityConfig) => {
      const entity = game.getEntityById(entityConfig.id!);
      if (entity && entityConfig.primitives) {
        this.attachPrimitives(entity, entityConfig.primitives);
      }
    });

    // Perform initial validation for City Lines grid
    if ((config as any).gridTiles) {
      const cityGrid = game.getEntityById("city_grid") as any;
      if (cityGrid && cityGrid.performInitialValidation) {
        // RoadTiles now handle click interaction directly (no primitives needed)
        cityGrid.performInitialValidation();
        // Enable tile interaction for new level
        if (cityGrid.setTilesInteractive) {
          cityGrid.setTilesInteractive(true);
        }
      }
    }

    // Attach primitives to layout entities
    if (config.layouts) {
      config.layouts.forEach((layoutConfig) => {
        const entities = this.createLayout(layoutConfig);
        entities.forEach((entityConfig) => {
          const entity = game.getEntityById(entityConfig.id!);
          if (entity && entityConfig.primitives) {
            this.attachPrimitives(entity, entityConfig.primitives);
          }
        });
      });
    }

    // Create UI elements
    if (config.ui) {
      config.ui.forEach((uiConfig) => {
        const uiElement = this.createUI(uiConfig);
        game.addChild(uiElement);

        // Connect UI to game if needed
        if (uiConfig.type === "ScoreDisplay") {
          game.setScoreDisplay(uiElement as ScoreDisplay);
        } else if (uiConfig.type === "ComboDisplay") {
          game.setComboDisplay(uiElement as ComboDisplay);
        } else if (uiConfig.type === "HealthDisplay") {
          game.setHealthDisplay(uiElement as unknown as HealthDisplay);
        } else if (uiConfig.type === "GameOverScreen") {
          game.setGameOverScreen(uiElement as GameOverScreen);
        } else if (uiConfig.type === "LevelCompleteScreen") {
          game.setLevelCompleteScreen(uiElement as LevelCompleteScreen);
        } else if (uiConfig.type === "HeadlineDisplay") {
          const headlineDisplay = uiElement as HeadlineDisplay;
          headlineDisplay.setGame(game); // Set game reference for event emission
          game.setHeadlineDisplay(headlineDisplay);
        }
      });
    }

    // Load headlines if provided in config
    if ((config as any).headlines) {
      game.setHeadlines((config as any).headlines);
    }

    // Initialize particle container at game root level (for screen-wide effects like confetti)
    // IMPORTANT: Add LAST so particles render on top of everything
    game.particleContainer = new Container();
    game.addChild(game.particleContainer);

    // Initialize ParticleManager for screen-level effects (confetti)
    game.particleManager = new ParticleManager(game.particleContainer);

    return game;
  }

  /**
   * Create a single entity
   */
  private static createEntity(
    config: EntityConfig,
    attachPrimitivesNow = true,
  ): Container {
    // Create the entity
    const entity = EntityFactory.create(config);

    // Position it
    entity.position.set(config.position.x, config.position.y);

    // Attach primitives immediately if requested (old behavior)
    // This is used for standalone entity creation
    if (attachPrimitivesNow && config.primitives) {
      this.attachPrimitives(entity, config.primitives);
    }

    return entity;
  }

  /**
   * Attach primitives to an entity
   * Separated from createEntity to allow two-phase initialization
   */
  private static attachPrimitives(
    entity: Container,
    primitives: Array<{ type: string; config: PrimitiveConfig }>,
  ): void {
    primitives.forEach((primConfig) => {
      const primitive = PrimitiveFactory.create(primConfig.type);
      (
        entity as Container & {
          addPrimitive?: (
            type: string,
            primitive: Primitive,
            config: PrimitiveConfig,
          ) => void;
        }
      ).addPrimitive?.(primConfig.type, primitive, primConfig.config);
    });
  }

  /**
   * Create entities from a layout generator
   */
  private static createLayout(layoutConfig: any): EntityConfig[] {
    switch (layoutConfig.type) {
      case "BlockGrid":
        return BlockGrid.generate(layoutConfig.config);
      default:
        console.warn(`Unknown layout type: ${layoutConfig.type}`);
        return [];
    }
  }

  /**
   * Create a UI element
   */
  private static createUI(uiConfig: any): Container {
    let uiElement: Container;

    switch (uiConfig.type) {
      case "ScoreDisplay":
        uiElement = new ScoreDisplay();
        break;
      case "ComboDisplay":
        uiElement = new ComboDisplay();
        break;
      case "HealthDisplay":
        uiElement = new HealthDisplay() as any;
        break;
      case "GameOverScreen":
        uiElement = new GameOverScreen();
        break;
      case "LevelCompleteScreen":
        uiElement = new LevelCompleteScreen();
        break;
      case "HeadlineDisplay":
        uiElement = new HeadlineDisplay(uiConfig.config);
        break;
      default:
        console.warn(`Unknown UI type: ${uiConfig.type}`);
        uiElement = new Container();
    }

    // Position the UI element (if not a full-screen overlay)
    if (uiConfig.position) {
      uiElement.position.set(uiConfig.position.x, uiConfig.position.y);
    }

    return uiElement;
  }

  /**
   * Load config from JSON file
   */
  static async fromFile(
    path: string,
    tuningSystem?: any,
  ): Promise<GameContainer> {
    const response = await fetch(path);
    const config: GameConfig = await response.json();
    return this.fromConfig(config, tuningSystem);
  }
}
