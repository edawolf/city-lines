import { Container, Graphics, Text, Ticker, Texture, Assets } from "pixi.js";
import { Emitter, EmitterConfigV3 } from "@pixi/particle-emitter";
import { FancyButton } from "@pixi/ui";
import { engine } from "../getEngine";

/** Screen to test and demonstrate particle effects */
export class ParticleTestScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  private emitters: Emitter[] = [];
  private backButton: FancyButton;
  private titleText: Text;
  private instructionText: Text;
  private activeEmitterText: Text;
  private currentEmitterIndex = 0;
  private emitterNames = [
    "Fire",
    "Sparkles",
    "Smoke",
    "Explosion",
    "Snow",
    "Rain",
  ];

  // Cache textures on initialization
  private particleTexture?: Texture;
  private starTexture?: Texture;
  private rainTexture?: Texture;

  constructor() {
    super();

    // Title
    this.titleText = new Text({
      text: "Particle Effect Demo",
      style: {
        fontSize: 48,
        fill: 0xffffff,
        fontWeight: "bold",
      },
    });
    this.titleText.anchor.set(0.5, 0);
    this.addChild(this.titleText);

    // Instructions
    this.instructionText = new Text({
      text: "Click anywhere to spawn particles!\nPress SPACE to cycle effects",
      style: {
        fontSize: 24,
        fill: 0xcccccc,
        align: "center",
      },
    });
    this.instructionText.anchor.set(0.5, 0);
    this.addChild(this.instructionText);

    // Active emitter indicator
    this.activeEmitterText = new Text({
      text: `Current Effect: ${this.emitterNames[0]}`,
      style: {
        fontSize: 32,
        fill: 0x00ff00,
        fontWeight: "bold",
      },
    });
    this.activeEmitterText.anchor.set(0.5, 0);
    this.addChild(this.activeEmitterText);

    // Back button
    const buttonAnimations = {
      hover: {
        props: {
          scale: { x: 1.1, y: 1.1 },
        },
        duration: 100,
      },
      pressed: {
        props: {
          scale: { x: 0.9, y: 0.9 },
        },
        duration: 100,
      },
    };

    this.backButton = new FancyButton({
      defaultView: "icon-pause.png",
      anchor: 0.5,
      animations: buttonAnimations,
    });
    this.backButton.onPress.connect(() => this.goBack());
    this.addChild(this.backButton);

    // Add back button label
    const backLabel = new Text({
      text: "←",
      style: {
        fontSize: 24,
        fill: 0x000000,
        fontWeight: "bold",
      },
    });
    backLabel.anchor.set(0.5);
    this.backButton.addChild(backLabel);

    // Make screen interactive - we need to set hitArea to capture clicks
    this.eventMode = "static";
    this.cursor = "crosshair";

    // Add pointer event listener
    this.on("pointerdown", (event) => {
      console.log("👆 Click detected!", event.global);
      const pos = event.global;
      this.spawnParticleEffect(pos.x, pos.y);
    });

    // Keyboard controls
    this.setupKeyboardControls();
  }

  /** Setup keyboard controls */
  private setupKeyboardControls(): void {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        this.cycleEmitterType();
      } else if (event.key === "Escape") {
        this.goBack();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    (this as any).keyHandler = handleKeyPress;
  }

  /** Cycle through different emitter types */
  private cycleEmitterType(): void {
    this.currentEmitterIndex =
      (this.currentEmitterIndex + 1) % this.emitterNames.length;
    this.activeEmitterText.text = `Current Effect: ${this.emitterNames[this.currentEmitterIndex]}`;
    console.log(`Switched to: ${this.emitterNames[this.currentEmitterIndex]}`);
  }

  /** Spawn a particle effect at the given position */
  private spawnParticleEffect(x: number, y: number): void {
    console.log(`🎯 spawnParticleEffect called at (${x}, ${y})`);

    let config: EmitterConfigV3;

    switch (this.currentEmitterIndex) {
      case 0: // Fire
        config = this.getFireConfig();
        break;
      case 1: // Sparkles
        config = this.getSparklesConfig();
        break;
      case 2: // Smoke
        config = this.getSmokeConfig();
        break;
      case 3: // Explosion
        config = this.getExplosionConfig();
        break;
      case 4: // Snow
        config = this.getSnowConfig();
        break;
      case 5: // Rain
        config = this.getRainConfig();
        break;
      default:
        config = this.getFireConfig();
    }

    console.log("📦 Config created:", config);

    try {
      const emitter = new Emitter(this, config);
      console.log("🎨 Emitter created:", emitter);
      console.log("  - Parent:", this);
      console.log("  - Config behaviors:", config.behaviors?.length);

      emitter.updateSpawnPos(x, y);
      console.log("📍 Position updated to:", { x, y });

      // Initialize the emitter
      emitter.init();
      console.log("🎬 Emitter initialized");

      emitter.emit = true;
      console.log("▶️ Emitter emit set to true");

      this.emitters.push(emitter);

      // Manually trigger first update to spawn initial particles
      emitter.update(0.016);
      console.log("⚡ Initial update triggered");

      console.log(
        `✨ Spawned ${this.emitterNames[this.currentEmitterIndex]} at (${x.toFixed(0)}, ${y.toFixed(0)})`,
        `- Active emitters: ${this.emitters.length}`,
        `- Particle count: ${emitter.particleCount}`,
        `- Emitting: ${emitter.emit}`,
        `- Children in container: ${this.children.length}`,
      );

      // Debug: Check the particles that were created
      setTimeout(() => {
        console.log("🔍 Checking particles after spawn:");
        this.children.forEach((child, i) => {
          if (child.constructor.name === "Sprite") {
            console.log(`  Particle ${i}:`, {
              visible: child.visible,
              alpha: child.alpha,
              position: { x: child.x, y: child.y },
              scale: { x: child.scale.x, y: child.scale.y },
              texture: (child as any).texture?.valid,
            });
          }
        });
      }, 100);
    } catch (error) {
      console.error("❌ Error creating emitter:", error);
    }
  }

  /** Fire effect configuration */
  private getFireConfig(): EmitterConfigV3 {
    return {
      lifetime: { min: 0.3, max: 0.8 },
      frequency: 0.01,
      spawnChance: 1,
      particlesPerWave: 3,
      emitterLifetime: 0.5,
      maxParticles: 100,
      addAtBack: false,
      pos: { x: 0, y: 0 },
      behaviors: [
        {
          type: "alpha",
          config: {
            alpha: {
              list: [
                { time: 0, value: 0.8 },
                { time: 1, value: 0 },
              ],
            },
          },
        },
        {
          type: "color",
          config: {
            color: {
              list: [
                { time: 0, value: "fff191" },
                { time: 0.5, value: "ff622c" },
                { time: 1, value: "c01e00" },
              ],
            },
          },
        },
        {
          type: "scale",
          config: {
            scale: {
              list: [
                { time: 0, value: 0.3 },
                { time: 1, value: 0.8 },
              ],
            },
            minMult: 0.5,
          },
        },
        {
          type: "moveSpeedStatic",
          config: {
            min: 50,
            max: 150,
          },
        },
        {
          type: "rotationStatic",
          config: {
            min: 265,
            max: 275,
          },
        },
        {
          type: "spawnShape",
          config: {
            type: "torus",
            data: {
              x: 0,
              y: 0,
              radius: 5,
              innerRadius: 0,
              affectRotation: false,
            },
          },
        },
        {
          type: "textureSingle",
          config: {
            texture:
              this.particleTexture || this.createCircleTexture(32, 0xffffff),
          },
        },
      ],
    };
  }

  /** Sparkles effect configuration */
  private getSparklesConfig(): EmitterConfigV3 {
    return {
      lifetime: { min: 0.5, max: 1.0 },
      frequency: 0.005,
      spawnChance: 1,
      particlesPerWave: 5,
      emitterLifetime: 0.3,
      maxParticles: 100,
      addAtBack: false,
      pos: { x: 0, y: 0 },
      behaviors: [
        {
          type: "alpha",
          config: {
            alpha: {
              list: [
                { time: 0, value: 0 },
                { time: 0.1, value: 1 },
                { time: 0.9, value: 1 },
                { time: 1, value: 0 },
              ],
            },
          },
        },
        {
          type: "color",
          config: {
            color: {
              list: [
                { time: 0, value: "ffff00" },
                { time: 0.5, value: "00ffff" },
                { time: 1, value: "ff00ff" },
              ],
            },
          },
        },
        {
          type: "scale",
          config: {
            scale: {
              list: [
                { time: 0, value: 0.1 },
                { time: 0.5, value: 0.5 },
                { time: 1, value: 0.1 },
              ],
            },
          },
        },
        {
          type: "moveSpeedStatic",
          config: {
            min: 100,
            max: 300,
          },
        },
        {
          type: "rotationStatic",
          config: {
            min: 0,
            max: 360,
          },
        },
        {
          type: "spawnShape",
          config: {
            type: "torus",
            data: {
              x: 0,
              y: 0,
              radius: 10,
              innerRadius: 0,
              affectRotation: false,
            },
          },
        },
        {
          type: "textureSingle",
          config: {
            texture: this.starTexture || this.createStarTexture(32, 0xffffff),
          },
        },
      ],
    };
  }

  /** Smoke effect configuration */
  private getSmokeConfig(): EmitterConfigV3 {
    return {
      lifetime: { min: 1.0, max: 2.0 },
      frequency: 0.05,
      spawnChance: 1,
      particlesPerWave: 2,
      emitterLifetime: 1.0,
      maxParticles: 50,
      addAtBack: false,
      pos: { x: 0, y: 0 },
      behaviors: [
        {
          type: "alpha",
          config: {
            alpha: {
              list: [
                { time: 0, value: 0 },
                { time: 0.1, value: 0.6 },
                { time: 1, value: 0 },
              ],
            },
          },
        },
        {
          type: "color",
          config: {
            color: {
              list: [
                { time: 0, value: "666666" },
                { time: 1, value: "333333" },
              ],
            },
          },
        },
        {
          type: "scale",
          config: {
            scale: {
              list: [
                { time: 0, value: 0.5 },
                { time: 1, value: 2.0 },
              ],
            },
          },
        },
        {
          type: "moveSpeedStatic",
          config: {
            min: 20,
            max: 80,
          },
        },
        {
          type: "rotationStatic",
          config: {
            min: 240,
            max: 300,
          },
        },
        {
          type: "spawnShape",
          config: {
            type: "torus",
            data: {
              x: 0,
              y: 0,
              radius: 15,
              innerRadius: 0,
              affectRotation: false,
            },
          },
        },
        {
          type: "textureSingle",
          config: {
            texture:
              this.particleTexture || this.createCircleTexture(64, 0xffffff),
          },
        },
      ],
    };
  }

  /** Explosion effect configuration */
  private getExplosionConfig(): EmitterConfigV3 {
    return {
      lifetime: { min: 0.2, max: 0.5 },
      frequency: 0.001,
      spawnChance: 1,
      particlesPerWave: 50,
      emitterLifetime: 0.1,
      maxParticles: 100,
      addAtBack: false,
      pos: { x: 0, y: 0 },
      behaviors: [
        {
          type: "alpha",
          config: {
            alpha: {
              list: [
                { time: 0, value: 1 },
                { time: 1, value: 0 },
              ],
            },
          },
        },
        {
          type: "color",
          config: {
            color: {
              list: [
                { time: 0, value: "ffffff" },
                { time: 0.2, value: "ffff00" },
                { time: 0.5, value: "ff8800" },
                { time: 1, value: "ff0000" },
              ],
            },
          },
        },
        {
          type: "scale",
          config: {
            scale: {
              list: [
                { time: 0, value: 0.5 },
                { time: 1, value: 0.1 },
              ],
            },
          },
        },
        {
          type: "moveSpeedStatic",
          config: {
            min: 200,
            max: 500,
          },
        },
        {
          type: "rotationStatic",
          config: {
            min: 0,
            max: 360,
          },
        },
        {
          type: "spawnShape",
          config: {
            type: "torus",
            data: {
              x: 0,
              y: 0,
              radius: 5,
              innerRadius: 0,
              affectRotation: false,
            },
          },
        },
        {
          type: "textureSingle",
          config: {
            texture:
              this.particleTexture || this.createCircleTexture(16, 0xffffff),
          },
        },
      ],
    };
  }

  /** Snow effect configuration */
  private getSnowConfig(): EmitterConfigV3 {
    return {
      lifetime: { min: 3.0, max: 5.0 },
      frequency: 0.02,
      spawnChance: 1,
      particlesPerWave: 3,
      emitterLifetime: 2.0,
      maxParticles: 200,
      addAtBack: false,
      pos: { x: 0, y: 0 },
      behaviors: [
        {
          type: "alpha",
          config: {
            alpha: {
              list: [
                { time: 0, value: 0 },
                { time: 0.1, value: 0.8 },
                { time: 0.9, value: 0.8 },
                { time: 1, value: 0 },
              ],
            },
          },
        },
        {
          type: "color",
          config: {
            color: {
              list: [
                { time: 0, value: "ffffff" },
                { time: 1, value: "e0e0ff" },
              ],
            },
          },
        },
        {
          type: "scale",
          config: {
            scale: {
              list: [
                { time: 0, value: 0.2 },
                { time: 1, value: 0.3 },
              ],
            },
            minMult: 0.5,
          },
        },
        {
          type: "moveSpeedStatic",
          config: {
            min: 30,
            max: 80,
          },
        },
        {
          type: "rotationStatic",
          config: {
            min: 80,
            max: 100,
          },
        },
        {
          type: "spawnShape",
          config: {
            type: "rect",
            data: {
              x: -100,
              y: 0,
              w: 200,
              h: 10,
            },
          },
        },
        {
          type: "textureSingle",
          config: {
            texture:
              this.particleTexture || this.createCircleTexture(16, 0xffffff),
          },
        },
      ],
    };
  }

  /** Rain effect configuration */
  private getRainConfig(): EmitterConfigV3 {
    return {
      lifetime: { min: 0.5, max: 1.0 },
      frequency: 0.005,
      spawnChance: 1,
      particlesPerWave: 5,
      emitterLifetime: 1.5,
      maxParticles: 300,
      addAtBack: false,
      pos: { x: 0, y: 0 },
      behaviors: [
        {
          type: "alpha",
          config: {
            alpha: {
              list: [
                { time: 0, value: 0.7 },
                { time: 1, value: 0 },
              ],
            },
          },
        },
        {
          type: "color",
          config: {
            color: {
              list: [
                { time: 0, value: "aaccff" },
                { time: 1, value: "ffffff" },
              ],
            },
          },
        },
        {
          type: "scale",
          config: {
            scale: {
              list: [
                { time: 0, value: 0.15 },
                { time: 1, value: 0.1 },
              ],
            },
          },
        },
        {
          type: "moveSpeedStatic",
          config: {
            min: 400,
            max: 600,
          },
        },
        {
          type: "rotationStatic",
          config: {
            min: 100,
            max: 110,
          },
        },
        {
          type: "spawnShape",
          config: {
            type: "rect",
            data: {
              x: -150,
              y: 0,
              w: 300,
              h: 10,
            },
          },
        },
        {
          type: "textureSingle",
          config: {
            texture:
              this.rainTexture || this.createRainDropTexture(32, 0xffffff),
          },
        },
      ],
    };
  }

  /** Create a simple circle texture */
  private createCircleTexture(size: number, color: number): Texture {
    const graphics = new Graphics();
    graphics.circle(size / 2, size / 2, size / 2);
    graphics.fill({ color, alpha: 1 });
    const texture = engine().renderer.generateTexture({
      target: graphics,
      resolution: 1,
    });
    console.log(
      "🎨 Generated circle texture:",
      texture,
      "Valid:",
      texture.valid,
    );
    return texture;
  }

  /** Create a star texture */
  private createStarTexture(size: number, color: number): Texture {
    const graphics = new Graphics();
    const points = 5;
    const outerRadius = size / 2;
    const innerRadius = size / 4;
    const centerX = size / 2;
    const centerY = size / 2;

    graphics.moveTo(
      centerX + outerRadius * Math.cos(0),
      centerY + outerRadius * Math.sin(0),
    );

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? innerRadius : outerRadius;
      const angle = (Math.PI * i) / points;
      graphics.lineTo(
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle),
      );
    }

    graphics.fill({ color, alpha: 1 });
    return engine().renderer.generateTexture({
      target: graphics,
      resolution: 1,
    });
  }

  /** Create a rain drop texture (elongated) */
  private createRainDropTexture(size: number, color: number): Texture {
    const graphics = new Graphics();
    graphics.rect(size / 2 - 1, 0, 2, size);
    graphics.fill({ color, alpha: 1 });
    return engine().renderer.generateTexture({
      target: graphics,
      resolution: 1,
    });
  }

  private updateCount = 0;

  /** Update emitters */
  public update(time: Ticker) {
    // deltaTime is in milliseconds, convert to seconds for particle emitter
    const delta = time.deltaTime / 60; // PixiJS deltaTime is scaled by 60fps

    // Log first few updates to verify update is being called
    if (this.updateCount < 5) {
      console.log(
        `🔄 Update called: delta=${delta}, emitters=${this.emitters.length}`,
      );
      this.updateCount++;
    }

    // Update all active emitters
    for (let i = this.emitters.length - 1; i >= 0; i--) {
      const emitter = this.emitters[i];
      emitter.update(delta);

      if (this.updateCount < 5) {
        console.log(
          `  Emitter ${i}: particleCount=${emitter.particleCount}, emit=${emitter.emit}`,
        );
      }

      // Remove completed emitters
      if (emitter.particleCount === 0 && !emitter.emit) {
        emitter.destroy();
        this.emitters.splice(i, 1);
        console.log(
          `🗑️ Removed completed emitter. Remaining: ${this.emitters.length}`,
        );
      }
    }
  }

  /** Resize handler */
  public resize(width: number, height: number) {
    this.titleText.x = width / 2;
    this.titleText.y = 30;

    this.instructionText.x = width / 2;
    this.instructionText.y = 100;

    this.activeEmitterText.x = width / 2;
    this.activeEmitterText.y = height - 80;

    this.backButton.x = 30;
    this.backButton.y = 30;

    // Set hit area to entire screen so clicks are captured
    this.hitArea = {
      x: 0,
      y: 0,
      width,
      height,
      contains: (x: number, y: number) => {
        return x >= 0 && x <= width && y >= 0 && y <= height;
      },
    };

    console.log(`📐 Screen resized to ${width}x${height}, hitArea set`);
  }

  /** Show screen */
  public async show() {
    console.log("🎉 ParticleTestScreen shown!");

    // Load particle textures from files
    console.log("🎨 Loading particle textures from assets...");
    try {
      this.particleTexture = Texture.from("/assets/vfx/white-circle.png");
      this.starTexture = Texture.from("/assets/vfx/white-circle.png"); // Use circle for now
      this.rainTexture = Texture.from("/assets/vfx/white-circle.png");

      console.log("✅ Textures loaded:", {
        circle: this.particleTexture,
        circleValid: this.particleTexture.valid,
        star: this.starTexture,
        rain: this.rainTexture,
      });
    } catch (error) {
      console.error("❌ Error loading textures:", error);
    }

    console.log("📝 Instructions:");
    console.log("  - Click anywhere to spawn particles");
    console.log("  - Press SPACE to cycle effects");
    console.log("  - Press ESC to go back");
    console.log(
      `Current effect: ${this.emitterNames[this.currentEmitterIndex]}`,
    );
  }

  /** Hide screen */
  public async hide() {
    // Clean up all emitters
    for (const emitter of this.emitters) {
      emitter.destroy();
    }
    this.emitters = [];
  }

  /** Go back to main screen */
  private async goBack() {
    await this.hide();
    const { MainScreen } = await import("./main/MainScreen");
    await engine().navigation.showScreen(MainScreen);
  }

  /** Cleanup */
  public destroy(): void {
    if ((this as any).keyHandler) {
      document.removeEventListener("keydown", (this as any).keyHandler);
    }

    // Destroy all emitters
    for (const emitter of this.emitters) {
      emitter.destroy();
    }
    this.emitters = [];

    super.destroy();
  }
}
