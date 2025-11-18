import {
  Container,
  Text,
  Ticker,
  Texture,
  ParticleContainer,
  Particle,
  Graphics,
} from "pixi.js";
import { FancyButton, Slider } from "@pixi/ui";
import { engine } from "../getEngine";

interface ParticleConfig {
  // Particle Properties
  alphaStart: number;
  alphaEnd: number;
  scaleStart: number;
  scaleEnd: number;
  scaleMultiplier: number;
  color: number;
  speed: number;
  speedMultiplier: number;
  acceleration: number;
  rotationSpeed: number;
  lifetime: number;

  // Emitter Properties
  spawnFrequency: number;
  maxParticles: number;
  particlesPerWave: number;

  // Spawn Shape
  spawnType: "point" | "rectangle" | "circle" | "ring";
  spawnRadius: number;
  spawnWidth: number;
  spawnHeight: number;

  // Physics
  gravity: number;

  // Visual
  blendMode: string;
}

/** Comprehensive particle editor for PixiJS v8 */
export class ParticleEditorScreenV2 extends Container {
  public static assetBundles = ["main"];

  private particleContainer?: ParticleContainer;
  private particles: Array<{
    particle: Particle;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    angularVelocity: number;
    startScale: number;
    endScale: number;
    startAlpha: number;
    endAlpha: number;
  }> = [];

  private particleTexture?: Texture;
  private isReady = false;
  private isEmitting = false;
  private timeSinceLastSpawn = 0;

  // UI Elements
  private backButton: FancyButton;
  private playPauseButton: FancyButton;
  private clearButton: FancyButton;
  private exportButton: FancyButton;
  private titleText: Text;
  private fpsText: Text;
  private particleCountText: Text;

  // Property panels
  private leftPanel: Container;
  private rightPanel: Container;

  // Sliders and controls
  private sliders: Map<string, { slider: Slider; label: Text }> = new Map();

  // Current configuration
  private config: ParticleConfig = {
    // Particle Properties
    alphaStart: 1.0,
    alphaEnd: 0.0,
    scaleStart: 0.02,
    scaleEnd: 0.01,
    scaleMultiplier: 0.5,
    color: 0xffffff,
    speed: 5,
    speedMultiplier: 0.5,
    acceleration: 0.2,
    rotationSpeed: 0,
    lifetime: 1.0,

    // Emitter Properties
    spawnFrequency: 0.05,
    maxParticles: 500,
    particlesPerWave: 3,

    // Spawn Shape
    spawnType: "point",
    spawnRadius: 10,
    spawnWidth: 50,
    spawnHeight: 50,

    // Physics
    gravity: 0.1,

    // Visual
    blendMode: "normal",
  };

  private spawnX = 0;
  private spawnY = 0;

  constructor() {
    super();

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, 10000, 10000);
    bg.fill({ color: 0x1a1a1a });
    this.addChild(bg);

    // Title
    this.titleText = new Text({
      text: "Particle Editor - PixiJS v8",
      style: {
        fontSize: 32,
        fill: 0xffffff,
        fontWeight: "bold",
      },
    });
    this.titleText.x = 10;
    this.titleText.y = 10;
    this.addChild(this.titleText);

    // FPS Counter
    this.fpsText = new Text({
      text: "FPS: 60",
      style: {
        fontSize: 20,
        fill: 0x00ff00,
      },
    });
    this.fpsText.x = 10;
    this.fpsText.y = 50;
    this.addChild(this.fpsText);

    // Particle Count
    this.particleCountText = new Text({
      text: "Particles: 0",
      style: {
        fontSize: 20,
        fill: 0x00ffff,
      },
    });
    this.particleCountText.x = 10;
    this.particleCountText.y = 80;
    this.addChild(this.particleCountText);

    // Create panels
    this.leftPanel = new Container();
    this.leftPanel.x = 10;
    this.leftPanel.y = 120;
    this.addChild(this.leftPanel);

    this.rightPanel = new Container();
    this.addChild(this.rightPanel);

    // Control buttons
    this.createControlButtons();

    // Property controls
    this.createPropertyControls();

    // Make screen interactive for spawn position
    this.eventMode = "static";
    this.on("pointermove", (event) => {
      const pos = event.global;
      this.spawnX = pos.x;
      this.spawnY = pos.y;
    });
  }

  private createControlButtons(): void {
    const buttonY = 50;

    // Back button
    this.backButton = new FancyButton({
      defaultView: "rounded-rectangle.png",
      text: new Text({
        text: "← Back",
        style: { fontSize: 16, fill: 0xffffff },
      }),
    });
    this.backButton.x = window.innerWidth - 120;
    this.backButton.y = buttonY;
    this.backButton.onPress.connect(() => this.goBack());
    this.addChild(this.backButton);

    // Play/Pause button
    this.playPauseButton = new FancyButton({
      defaultView: "rounded-rectangle.png",
      text: new Text({
        text: "▶ Play",
        style: { fontSize: 16, fill: 0xffffff },
      }),
    });
    this.playPauseButton.x = window.innerWidth - 250;
    this.playPauseButton.y = buttonY;
    this.playPauseButton.onPress.connect(() => this.toggleEmit());
    this.addChild(this.playPauseButton);

    // Clear button
    this.clearButton = new FancyButton({
      defaultView: "rounded-rectangle.png",
      text: new Text({
        text: "🗑️ Clear",
        style: { fontSize: 16, fill: 0xffffff },
      }),
    });
    this.clearButton.x = window.innerWidth - 380;
    this.clearButton.y = buttonY;
    this.clearButton.onPress.connect(() => this.clearParticles());
    this.addChild(this.clearButton);

    // Export button
    this.exportButton = new FancyButton({
      defaultView: "rounded-rectangle.png",
      text: new Text({
        text: "📋 Export",
        style: { fontSize: 16, fill: 0xffffff },
      }),
    });
    this.exportButton.x = window.innerWidth - 520;
    this.exportButton.y = buttonY;
    this.exportButton.onPress.connect(() => this.exportConfig());
    this.addChild(this.exportButton);
  }

  private createPropertyControls(): void {
    let yOffset = 0;
    const spacing = 60;

    // Particle Properties Section
    this.addSectionHeader("PARTICLE PROPERTIES", yOffset);
    yOffset += 40;

    this.addSlider("Alpha Start", "alphaStart", 0, 1, yOffset);
    yOffset += spacing;

    this.addSlider("Alpha End", "alphaEnd", 0, 1, yOffset);
    yOffset += spacing;

    this.addSlider("Scale Start", "scaleStart", 0.001, 0.1, yOffset);
    yOffset += spacing;

    this.addSlider("Scale End", "scaleEnd", 0.001, 0.1, yOffset);
    yOffset += spacing;

    this.addSlider("Scale Mult", "scaleMultiplier", 0, 1, yOffset);
    yOffset += spacing;

    this.addSlider("Speed", "speed", 0, 20, yOffset);
    yOffset += spacing;

    this.addSlider("Speed Mult", "speedMultiplier", 0, 1, yOffset);
    yOffset += spacing;

    this.addSlider("Acceleration", "acceleration", -1, 1, yOffset);
    yOffset += spacing;

    this.addSlider("Rotation Speed", "rotationSpeed", -10, 10, yOffset);
    yOffset += spacing;

    this.addSlider("Lifetime", "lifetime", 0.1, 10, yOffset);
    yOffset += spacing;

    this.addSlider("Gravity", "gravity", -1, 2, yOffset);
    yOffset += spacing + 20;

    // Emitter Properties Section
    this.addSectionHeader("EMITTER PROPERTIES", yOffset);
    yOffset += 40;

    this.addSlider("Spawn Freq", "spawnFrequency", 0.001, 0.5, yOffset);
    yOffset += spacing;

    this.addSlider("Max Particles", "maxParticles", 50, 2000, yOffset);
    yOffset += spacing;

    this.addSlider("Per Wave", "particlesPerWave", 1, 20, yOffset);
    yOffset += spacing;

    this.addSlider("Spawn Radius", "spawnRadius", 0, 100, yOffset);
    yOffset += spacing;
  }

  private addSectionHeader(text: string, y: number): void {
    const header = new Text({
      text,
      style: {
        fontSize: 18,
        fill: 0xffff00,
        fontWeight: "bold",
      },
    });
    header.y = y;
    this.leftPanel.addChild(header);
  }

  private addSlider(
    label: string,
    configKey: keyof ParticleConfig,
    min: number,
    max: number,
    y: number,
  ): void {
    const value = this.config[configKey] as number;

    const labelText = new Text({
      text: `${label}: ${value.toFixed(3)}`,
      style: {
        fontSize: 16,
        fill: 0xcccccc,
      },
    });
    labelText.y = y;
    this.leftPanel.addChild(labelText);

    const slider = new Slider({
      bg: "rounded-rectangle.png",
      fill: "rounded-rectangle.png",
      slider: "icon-settings.png",
      min,
      max,
      value,
      width: 250,
      height: 15,
    });
    slider.y = y + 25;

    slider.onChange.connect((val) => {
      (this.config[configKey] as number) = val;
      labelText.text = `${label}: ${val.toFixed(3)}`;
    });

    this.leftPanel.addChild(slider);
    this.sliders.set(configKey as string, { slider, label: labelText });
  }

  private toggleEmit(): void {
    this.isEmitting = !this.isEmitting;
    const buttonText = this.playPauseButton.children[0] as Text;
    buttonText.text = this.isEmitting ? "⏸ Pause" : "▶ Play";
    console.log(this.isEmitting ? "▶ Emission started" : "⏸ Emission paused");
  }

  private clearParticles(): void {
    if (this.particleContainer) {
      this.removeChild(this.particleContainer);
      this.particleContainer.destroy();

      this.particleContainer = new ParticleContainer({
        dynamicProperties: {
          position: true,
          scale: true,
          rotation: true,
          uvs: false,
          tint: true,
        },
      });

      this.addChildAt(this.particleContainer, 1); // Add after background
      this.particles = [];
      console.log("🗑️ Cleared all particles");
    }
  }

  private exportConfig(): void {
    const json = JSON.stringify(this.config, null, 2);
    console.log("📋 Exported Configuration:");
    console.log(json);

    // Copy to clipboard if available
    if (navigator.clipboard) {
      navigator.clipboard.writeText(json);
      console.log("✅ Copied to clipboard!");
    }
  }

  private spawnParticles(): void {
    if (!this.particleTexture || !this.particleContainer) return;
    if (this.particles.length >= this.config.maxParticles) return;

    for (let i = 0; i < this.config.particlesPerWave; i++) {
      // Calculate spawn position based on spawn type
      let spawnOffsetX = 0;
      let spawnOffsetY = 0;

      switch (this.config.spawnType) {
        case "point":
          break;
        case "circle":
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * this.config.spawnRadius;
          spawnOffsetX = Math.cos(angle) * radius;
          spawnOffsetY = Math.sin(angle) * radius;
          break;
        case "rectangle":
          spawnOffsetX = (Math.random() - 0.5) * this.config.spawnWidth;
          spawnOffsetY = (Math.random() - 0.5) * this.config.spawnHeight;
          break;
        case "ring":
          const ringAngle = Math.random() * Math.PI * 2;
          spawnOffsetX = Math.cos(ringAngle) * this.config.spawnRadius;
          spawnOffsetY = Math.sin(ringAngle) * this.config.spawnRadius;
          break;
      }

      const particle = new Particle({
        texture: this.particleTexture,
        x: this.spawnX + spawnOffsetX,
        y: this.spawnY + spawnOffsetY,
        anchorX: 0.5,
        anchorY: 0.5,
      });

      // Random velocity direction (upward cone)
      const velocityAngle = ((Math.random() - 0.5) * Math.PI) / 2 - Math.PI / 2;
      const speed =
        this.config.speed *
        (Math.random() * this.config.speedMultiplier +
          (1 - this.config.speedMultiplier));

      const startScale =
        this.config.scaleStart *
        (Math.random() * this.config.scaleMultiplier +
          (1 - this.config.scaleMultiplier));
      const endScale =
        this.config.scaleEnd *
        (Math.random() * this.config.scaleMultiplier +
          (1 - this.config.scaleMultiplier));

      particle.scale = startScale;
      particle.tint = this.config.color;
      particle.alpha = this.config.alphaStart;

      this.particleContainer.addParticle(particle);

      this.particles.push({
        particle,
        vx: Math.cos(velocityAngle) * speed,
        vy: Math.sin(velocityAngle) * speed,
        life: 0,
        maxLife: this.config.lifetime,
        angularVelocity: this.config.rotationSpeed * (Math.random() - 0.5),
        startScale,
        endScale,
        startAlpha: this.config.alphaStart,
        endAlpha: this.config.alphaEnd,
      });
    }
  }

  public update(time: Ticker): void {
    if (!this.isReady) return;

    const delta = time.deltaTime / 60;

    // Update FPS
    this.fpsText.text = `FPS: ${Math.round(time.FPS)}`;
    this.particleCountText.text = `Particles: ${this.particles.length}`;

    // Spawn particles
    if (this.isEmitting) {
      this.timeSinceLastSpawn += delta;
      if (this.timeSinceLastSpawn >= this.config.spawnFrequency) {
        this.spawnParticles();
        this.timeSinceLastSpawn = 0;
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      const lifeRatio = p.life / p.maxLife;

      // Update position
      p.particle.x += p.vx * delta * 60;
      p.particle.y += p.vy * delta * 60;

      // Apply acceleration and gravity
      p.vy += (this.config.acceleration + this.config.gravity) * delta * 60;

      // Update rotation
      p.particle.rotation += p.angularVelocity * delta;

      // Interpolate scale
      p.particle.scale = p.startScale + (p.endScale - p.startScale) * lifeRatio;

      // Interpolate alpha
      p.particle.alpha = p.startAlpha + (p.endAlpha - p.startAlpha) * lifeRatio;
    }
  }

  public resize(width: number, height: number): void {
    // Reposition buttons
    this.backButton.x = width - 120;
    this.playPauseButton.x = width - 250;
    this.clearButton.x = width - 380;
    this.exportButton.x = width - 520;

    this.hitArea = {
      x: 0,
      y: 0,
      width,
      height,
      contains: (x: number, y: number) =>
        x >= 0 && x <= width && y >= 0 && y <= height,
    };

    // Set initial spawn position to center
    this.spawnX = width / 2;
    this.spawnY = height / 2;
  }

  public async show(): Promise<void> {
    console.log("🎨 Comprehensive Particle Editor loaded!");

    // Load texture
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = reject;
      image.src = "/assets/vfx/white-circle.png";
    });

    this.particleTexture = Texture.from(image);

    // Create particle container
    this.particleContainer = new ParticleContainer({
      dynamicProperties: {
        position: true,
        scale: true,
        rotation: true,
        uvs: false,
        tint: true,
      },
    });

    this.addChildAt(this.particleContainer, 1); // Add after background
    this.isReady = true;

    console.log("✅ Editor ready!");
    console.log("  - Press ▶ Play to start emitting");
    console.log("  - Move mouse to change spawn position");
    console.log("  - Adjust sliders to modify particle behavior");
    console.log("  - Click 📋 Export to copy config to clipboard");
  }

  public async hide(): Promise<void> {
    this.clearParticles();
    this.isEmitting = false;
  }

  private async goBack(): Promise<void> {
    await this.hide();
    const { MainScreen } = await import("./main/MainScreen");
    await engine().navigation.showScreen(MainScreen);
  }

  public destroy(): void {
    this.clearParticles();
    super.destroy();
  }
}
