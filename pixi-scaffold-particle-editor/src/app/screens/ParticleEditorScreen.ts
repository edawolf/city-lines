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

/** Simple particle editor screen */
export class ParticleEditorScreen extends Container {
  public static assetBundles = ["main"];

  private particleContainer?: ParticleContainer;
  private particles: Array<{
    particle: Particle;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
  }> = [];
  private particleTexture?: Texture;
  private isReady = false;

  // UI Elements
  private backButton: FancyButton;
  private spawnButton: FancyButton;
  private clearButton: FancyButton;
  private titleText: Text;

  // Property panels
  private propertyPanel: Container;
  private particleCountSlider: Slider;
  private particleSizeSlider: Slider;
  private particleSpeedSlider: Slider;
  private particleLifeSlider: Slider;
  private particleAngleSlider: Slider;

  // Current settings
  private settings = {
    count: 50,
    size: 0.015,
    speed: 3,
    life: 1.0,
    angle: 270, // degrees
    color: 0xffffff,
  };

  constructor() {
    super();

    // Title
    this.titleText = new Text({
      text: "Particle Editor",
      style: {
        fontSize: 48,
        fill: 0xffffff,
        fontWeight: "bold",
      },
    });
    this.titleText.anchor.set(0.5, 0);
    this.addChild(this.titleText);

    // Create property panel
    this.propertyPanel = new Container();
    this.addChild(this.propertyPanel);

    // Back button
    this.backButton = new FancyButton({
      defaultView: "icon-pause.png",
      anchor: 0.5,
    });
    this.backButton.onPress.connect(() => this.goBack());
    this.addChild(this.backButton);

    // Spawn button
    this.spawnButton = new FancyButton({
      defaultView: "icon-settings.png",
      anchor: 0.5,
    });
    const spawnLabel = new Text({
      text: "✨",
      style: { fontSize: 24, fill: 0x000000, fontWeight: "bold" },
    });
    spawnLabel.anchor.set(0.5);
    this.spawnButton.addChild(spawnLabel);
    this.spawnButton.onPress.connect(() => this.spawnTestEffect());
    this.addChild(this.spawnButton);

    // Clear button
    this.clearButton = new FancyButton({
      defaultView: "icon-settings.png",
      anchor: 0.5,
    });
    const clearLabel = new Text({
      text: "🗑️",
      style: { fontSize: 24, fill: 0x000000, fontWeight: "bold" },
    });
    clearLabel.anchor.set(0.5);
    this.clearButton.addChild(clearLabel);
    this.clearButton.onPress.connect(() => this.clearParticles());
    this.addChild(this.clearButton);

    this.createPropertySliders();

    // Make screen interactive
    this.eventMode = "static";
    this.on("pointerdown", (event) => {
      if (this.isReady) {
        const pos = event.global;
        this.spawnParticlesAt(pos.x, pos.y);
      }
    });
  }

  private createPropertySliders(): void {
    const sliderConfig = {
      bg: "rounded-rectangle.png",
      fill: "rounded-rectangle.png",
      slider: "icon-settings.png",
    };

    let yOffset = 0;
    const spacing = 80;

    // Particle Count
    this.addSliderWithLabel(
      "Count",
      10,
      200,
      this.settings.count,
      yOffset,
      (value) => {
        this.settings.count = Math.round(value);
      },
    );
    yOffset += spacing;

    // Particle Size
    this.addSliderWithLabel(
      "Size",
      0.001,
      0.05,
      this.settings.size,
      yOffset,
      (value) => {
        this.settings.size = value;
      },
    );
    yOffset += spacing;

    // Particle Speed
    this.addSliderWithLabel(
      "Speed",
      0.5,
      10,
      this.settings.speed,
      yOffset,
      (value) => {
        this.settings.speed = value;
      },
    );
    yOffset += spacing;

    // Particle Life
    this.addSliderWithLabel(
      "Life",
      0.1,
      5,
      this.settings.life,
      yOffset,
      (value) => {
        this.settings.life = value;
      },
    );
    yOffset += spacing;

    // Particle Angle
    this.addSliderWithLabel(
      "Angle",
      0,
      360,
      this.settings.angle,
      yOffset,
      (value) => {
        this.settings.angle = value;
      },
    );
  }

  private addSliderWithLabel(
    label: string,
    min: number,
    max: number,
    value: number,
    yOffset: number,
    onChange: (value: number) => void,
  ): void {
    const labelText = new Text({
      text: `${label}: ${value.toFixed(3)}`,
      style: { fontSize: 20, fill: 0xffffff },
    });
    labelText.y = yOffset;
    this.propertyPanel.addChild(labelText);

    const slider = new Slider({
      bg: "rounded-rectangle.png",
      fill: "rounded-rectangle.png",
      slider: "icon-settings.png",
      min,
      max,
      value,
      width: 300,
      height: 20,
    });
    slider.y = yOffset + 30;

    slider.onChange.connect((val) => {
      onChange(val);
      labelText.text = `${label}: ${val.toFixed(3)}`;
    });

    this.propertyPanel.addChild(slider);
  }

  private spawnTestEffect(): void {
    const centerX = engine().renderer.width / 2;
    const centerY = engine().renderer.height / 2;
    this.spawnParticlesAt(centerX, centerY);
  }

  private spawnParticlesAt(x: number, y: number): void {
    if (!this.particleTexture || !this.particleContainer) return;

    console.log(`✨ Spawning ${this.settings.count} particles`, this.settings);

    for (let i = 0; i < this.settings.count; i++) {
      const particle = new Particle({
        texture: this.particleTexture,
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        anchorX: 0.5,
        anchorY: 0.5,
      });

      // Convert angle to radians and add some variance
      const angleRad =
        ((this.settings.angle + (Math.random() - 0.5) * 30) * Math.PI) / 180;
      const speed = this.settings.speed * (Math.random() * 0.5 + 0.75);

      particle.scale = this.settings.size * (Math.random() * 0.5 + 0.75);
      particle.tint = this.settings.color;
      particle.alpha = 1;

      this.particleContainer.addParticle(particle);

      this.particles.push({
        particle,
        vx: Math.cos(angleRad) * speed,
        vy: Math.sin(angleRad) * speed,
        life: 0,
        maxLife: this.settings.life * (Math.random() * 0.5 + 0.75),
      });
    }
  }

  private clearParticles(): void {
    if (this.particleContainer) {
      this.removeChild(this.particleContainer);
      this.particleContainer.destroy();

      this.particleContainer = new ParticleContainer({
        dynamicProperties: {
          position: true,
          scale: true,
          rotation: false,
          uvs: false,
          tint: true,
        },
      });

      this.addChild(this.particleContainer);
      this.particles = [];
      console.log("🗑️ Cleared all particles");
    }
  }

  public update(time: Ticker): void {
    const delta = time.deltaTime / 60;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      // Update position
      p.particle.x += p.vx;
      p.particle.y += p.vy;

      // Apply gravity
      p.vy += 0.1;

      // Fade out
      const lifeRatio = p.life / p.maxLife;
      p.particle.alpha = 1 - lifeRatio;
    }
  }

  public resize(width: number, height: number): void {
    this.titleText.x = width / 2;
    this.titleText.y = 30;

    this.propertyPanel.x = 30;
    this.propertyPanel.y = 120;

    this.backButton.x = 30;
    this.backButton.y = 30;

    this.spawnButton.x = width - 30;
    this.spawnButton.y = 30;

    this.clearButton.x = width - 30;
    this.clearButton.y = 90;

    this.hitArea = {
      x: 0,
      y: 0,
      width,
      height,
      contains: (x: number, y: number) =>
        x >= 0 && x <= width && y >= 0 && y <= height,
    };
  }

  public async show(): Promise<void> {
    console.log("🎨 Particle Editor loaded!");

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
        rotation: false,
        uvs: false,
        tint: true,
      },
    });

    this.addChild(this.particleContainer);
    this.isReady = true;

    console.log("✅ Editor ready! Click anywhere or press ✨ button");
  }

  public async hide(): Promise<void> {
    this.clearParticles();
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
