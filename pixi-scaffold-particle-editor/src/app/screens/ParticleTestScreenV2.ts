import {
  Container,
  Text,
  Ticker,
  Texture,
  ParticleContainer,
  Particle,
} from "pixi.js";
import { FancyButton } from "@pixi/ui";
import { engine } from "../getEngine";

/** Screen to test native PixiJS v8 ParticleContainer */
export class ParticleTestScreenV2 extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  private particleContainers: ParticleContainer[] = [];
  private particles: Array<{
    particle: Particle;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
  }> = [];
  private backButton: FancyButton;
  private titleText: Text;
  private instructionText: Text;
  private activeEmitterText: Text;
  private loadingText: Text;
  private currentEffectIndex = 0;
  private effectNames = ["Fire", "Sparkles", "Explosion", "Snow"];

  // Particle texture
  private particleTexture?: Texture;
  private isReady = false;

  constructor() {
    super();

    // Title
    this.titleText = new Text({
      text: "Native PixiJS v8 Particles",
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

    // Active effect indicator
    this.activeEmitterText = new Text({
      text: `Current Effect: ${this.effectNames[0]}`,
      style: {
        fontSize: 32,
        fill: 0x00ff00,
        fontWeight: "bold",
      },
    });
    this.activeEmitterText.anchor.set(0.5, 0);
    this.addChild(this.activeEmitterText);

    // Loading indicator
    this.loadingText = new Text({
      text: "Loading textures...",
      style: {
        fontSize: 48,
        fill: 0xffff00,
        fontWeight: "bold",
      },
    });
    this.loadingText.anchor.set(0.5);
    this.addChild(this.loadingText);

    // Back button
    const buttonAnimations = {
      hover: {
        props: { scale: { x: 1.1, y: 1.1 } },
        duration: 100,
      },
      pressed: {
        props: { scale: { x: 0.9, y: 0.9 } },
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

    // Make screen interactive
    this.eventMode = "static";
    this.cursor = "crosshair";

    this.on("pointerdown", (event) => {
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
        this.cycleEffectType();
      } else if (event.key === "Escape") {
        this.goBack();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    (this as any).keyHandler = handleKeyPress;
  }

  /** Cycle through different effect types */
  private cycleEffectType(): void {
    this.currentEffectIndex =
      (this.currentEffectIndex + 1) % this.effectNames.length;
    this.activeEmitterText.text = `Current Effect: ${this.effectNames[this.currentEffectIndex]}`;
    console.log(`Switched to: ${this.effectNames[this.currentEffectIndex]}`);
  }

  /** Spawn a particle effect at the given position */
  private spawnParticleEffect(x: number, y: number): void {
    if (!this.isReady) {
      console.warn("⚠️ Textures still loading, please wait...");
      return;
    }

    if (!this.particleTexture) {
      console.error("❌ Particle texture not loaded!", this.particleTexture);
      return;
    }

    console.log(
      `✨ Spawning ${this.effectNames[this.currentEffectIndex]} at (${x.toFixed(0)}, ${y.toFixed(0)})`,
    );
    console.log(
      `   Texture: ${this.particleTexture.width}x${this.particleTexture.height}`,
    );

    switch (this.currentEffectIndex) {
      case 0: // Fire
        this.spawnFireEffect(x, y);
        break;
      case 1: // Sparkles
        this.spawnSparklesEffect(x, y);
        break;
      case 2: // Explosion
        this.spawnExplosionEffect(x, y);
        break;
      case 3: // Snow
        this.spawnSnowEffect(x, y);
        break;
    }
  }

  /** Fire effect - particles rise upward with color fade */
  private spawnFireEffect(x: number, y: number): void {
    const container = new ParticleContainer({
      dynamicProperties: {
        position: true,
        scale: true,
        rotation: false,
        uvs: false,
        tint: true,
      },
    });

    this.addChild(container);
    this.particleContainers.push(container);

    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
      const particle = new Particle({
        texture: this.particleTexture,
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        anchorX: 0.5,
        anchorY: 0.5,
      });

      const angle = (Math.random() - 0.5) * 0.5 + Math.PI * 1.5; // Mostly upward
      const speed = Math.random() * 2 + 1;

      // Scale down - texture is 1157x1157, so scale to ~10-40 pixels
      particle.scale = Math.random() * 0.02 + 0.01;
      particle.tint = 0xfff191; // Start yellow-white

      container.addParticle(particle);

      this.particles.push({
        particle,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: Math.random() * 0.5 + 0.5,
      });
    }
  }

  /** Sparkles effect - colorful particles in all directions */
  private spawnSparklesEffect(x: number, y: number): void {
    const container = new ParticleContainer({
      dynamicProperties: {
        position: true,
        scale: true,
        rotation: true,
        uvs: false,
        tint: true,
      },
    });

    this.addChild(container);
    this.particleContainers.push(container);

    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
      const particle = new Particle({
        texture: this.particleTexture,
        x: x,
        y: y,
        anchorX: 0.5,
        anchorY: 0.5,
      });

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;

      particle.scale = Math.random() * 0.015 + 0.005; // Smaller sparkles
      particle.rotation = Math.random() * Math.PI * 2;

      // Random bright colors
      const colors = [0xffff00, 0xff00ff, 0x00ffff, 0xff8800, 0x00ff88];
      particle.tint = colors[Math.floor(Math.random() * colors.length)];

      container.addParticle(particle);

      this.particles.push({
        particle,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: Math.random() * 0.8 + 0.4,
      });
    }
  }

  /** Explosion effect - rapid burst outward */
  private spawnExplosionEffect(x: number, y: number): void {
    const container = new ParticleContainer({
      dynamicProperties: {
        position: true,
        scale: true,
        rotation: false,
        uvs: false,
        tint: true,
      },
    });

    this.addChild(container);
    this.particleContainers.push(container);

    const particleCount = 100;
    for (let i = 0; i < particleCount; i++) {
      const particle = new Particle({
        texture: this.particleTexture,
        x: x,
        y: y,
        anchorX: 0.5,
        anchorY: 0.5,
      });

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 10 + 5;

      particle.scale = Math.random() * 0.02 + 0.01; // Smaller explosion particles
      particle.tint = 0xffffff; // Start white

      container.addParticle(particle);

      this.particles.push({
        particle,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: Math.random() * 0.3 + 0.2,
      });
    }
  }

  /** Snow effect - gentle falling particles */
  private spawnSnowEffect(x: number, y: number): void {
    const container = new ParticleContainer({
      dynamicProperties: {
        position: true,
        scale: false,
        rotation: false,
        uvs: false,
        tint: false,
      },
    });

    this.addChild(container);
    this.particleContainers.push(container);

    const particleCount = 40;
    for (let i = 0; i < particleCount; i++) {
      const particle = new Particle({
        texture: this.particleTexture,
        x: x + (Math.random() - 0.5) * 100,
        y: y - Math.random() * 20,
        anchorX: 0.5,
        anchorY: 0.5,
      });

      particle.scale = Math.random() * 0.008 + 0.004; // Tiny snow flakes
      particle.tint = 0xe0e0ff; // Slight blue tint

      container.addParticle(particle);

      this.particles.push({
        particle,
        vx: (Math.random() - 0.5) * 0.5,
        vy: Math.random() * 1 + 0.5,
        life: 0,
        maxLife: Math.random() * 3 + 2,
      });
    }
  }

  /** Update particles */
  public update(time: Ticker) {
    const delta = time.deltaTime / 60;

    // Update all particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        // Remove dead particle
        this.particles.splice(i, 1);
        continue;
      }

      // Update position
      p.particle.x += p.vx;
      p.particle.y += p.vy;

      // Apply gravity for fire/explosion
      if (this.currentEffectIndex <= 2) {
        p.vy += 0.1; // Gravity
      }

      // Fade out based on life
      const lifeRatio = p.life / p.maxLife;
      p.particle.alpha = 1 - lifeRatio;

      // Scale based on effect
      if (this.currentEffectIndex === 0) {
        // Fire
        p.particle.scale *= 1.02; // Grow
        // Color transition: yellow -> orange -> red
        if (lifeRatio < 0.5) {
          p.particle.tint = 0xff622c; // Orange
        } else {
          p.particle.tint = 0xc01e00; // Red
        }
      } else if (this.currentEffectIndex === 2) {
        // Explosion
        p.particle.scale *= 0.98; // Shrink
        // Color transition: white -> yellow -> orange -> red
        if (lifeRatio < 0.25) {
          p.particle.tint = 0xffff00;
        } else if (lifeRatio < 0.5) {
          p.particle.tint = 0xff8800;
        } else {
          p.particle.tint = 0xff0000;
        }
      }
    }

    // Clean up empty containers
    for (let i = this.particleContainers.length - 1; i >= 0; i--) {
      const container = this.particleContainers[i];
      if (container.particleChildren.length === 0) {
        this.removeChild(container);
        container.destroy();
        this.particleContainers.splice(i, 1);
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

    this.loadingText.x = width / 2;
    this.loadingText.y = height / 2;

    this.backButton.x = 30;
    this.backButton.y = 30;

    // Set hit area to entire screen
    this.hitArea = {
      x: 0,
      y: 0,
      width,
      height,
      contains: (x: number, y: number) =>
        x >= 0 && x <= width && y >= 0 && y <= height,
    };
  }

  /** Show screen */
  public async show() {
    console.log("🎉 ParticleTestScreenV2 (Native PixiJS v8) shown!");

    // Load particle texture using Image element
    console.log("🎨 Loading particle texture...");

    const imagePath = "/assets/vfx/white-circle.png";

    try {
      // Create an Image element and load it
      const image = new Image();

      await new Promise<void>((resolve, reject) => {
        image.onload = () => {
          console.log(`✅ Image loaded: ${imagePath}`);
          console.log(`   Size: ${image.width}x${image.height}`);
          resolve();
        };

        image.onerror = (error) => {
          console.error(`❌ Image failed to load: ${imagePath}`, error);
          reject(error);
        };

        console.log(`  Loading from: ${imagePath}`);
        image.src = imagePath;
      });

      // Now create texture from the loaded image
      this.particleTexture = Texture.from(image);

      console.log(`✅ Texture created from image:`, {
        texture: this.particleTexture,
        width: this.particleTexture.width,
        height: this.particleTexture.height,
        source: this.particleTexture.source,
        label: this.particleTexture.label,
      });

      // In PixiJS v8, textures from loaded images should work even if 'valid' is undefined
      if (!this.particleTexture) {
        throw new Error("Texture creation failed");
      }
    } catch (error) {
      console.error("❌ Failed to load texture:", error);
      this.loadingText.text = "Failed to load textures!\nCheck console";
      this.loadingText.style.fill = 0xff0000;
      return;
    }

    console.log("📝 Instructions:");
    console.log("  - Click anywhere to spawn particles");
    console.log("  - Press SPACE to cycle effects");
    console.log("  - Press ESC to go back");
    console.log(`Current effect: ${this.effectNames[this.currentEffectIndex]}`);
    console.log(`✨ Ready to spawn particles!`);

    // Hide loading text and mark as ready
    this.loadingText.visible = false;
    this.isReady = true;
  }

  /** Hide screen */
  public async hide() {
    // Clean up all particles and containers
    this.particles = [];
    for (const container of this.particleContainers) {
      this.removeChild(container);
      container.destroy();
    }
    this.particleContainers = [];
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

    this.hide();
    super.destroy();
  }
}
