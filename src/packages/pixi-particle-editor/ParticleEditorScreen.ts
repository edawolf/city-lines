import { Container, Text, Ticker, Texture, Sprite, Graphics } from "pixi.js";
import { Pane } from "tweakpane";
import type { ParticleConfig, Spawner, VFXData } from "./types";
import { deepCloneConfig } from "./types";

/**
 * NOTE: This file expects an engine architecture with:
 * - engine() function that returns the game engine
 * - engine().navigation for screen management
 * - engine().renderer for rendering
 * - engine().canvas for DOM access
 *
 * You'll need to provide your own getEngine implementation or adapt this file.
 */

// Placeholder for engine - replace with your actual engine implementation
let engineInstance: any;

export function setEngine(engine: any): void {
  engineInstance = engine;
}

function engine(): any {
  if (!engineInstance) {
    throw new Error(
      "Engine not set. Call setEngine() before using ParticleEditorScreen.",
    );
  }
  return engineInstance;
}

/** Professional particle editor with Tweakpane GUI */
export class ParticleEditorScreen extends Container {
  public static assetBundles = ["main"];

  private pane?: Pane;

  // Spawner management
  private spawners: Spawner[] = [];
  private currentSpawner?: Spawner;
  private spawnerIdCounter = 1;

  // Available textures
  private availableTextures: string[] = [];
  private loadedTextures: Map<string, Texture> = new Map();

  // Texture info for the current default texture (used for UI and new spawners)
  private particleTexture?: Texture;
  private textureSize = 1157; // Default texture size
  private isReady = false;
  private timeSinceLastSpawn = 0;

  // UI Elements
  private titleText: Text;
  private statsText: Text;
  private crosshair?: Graphics;

  // Viewport for zooming/panning
  private viewport: Container;
  private backgroundGraphics: Graphics;
  private viewportZoom = 1;
  private minZoom = 0.1;
  private maxZoom = 5;

  // Panning state
  private isPanning = false;
  private panStartX = 0;
  private panStartY = 0;
  private viewportStartX = 0;
  private viewportStartY = 0;

  // Scene explorer state
  private sceneExplorerState = {
    selectedSpawnerId: "root", // Start with root selected
    viewMode: "root" as "root" | "spawner",
  };

  // Scene explorer DOM elements
  private sceneExplorerPanel?: HTMLDivElement;

  // Texture info for UI display
  private textureInfo = {
    dimensions: "0x0px",
  };

  // Current configuration
  private config: ParticleConfig = {
    textureName: "white-circle.png",
    // Particle Visual
    alphaStart: 1.0,
    alphaEnd: 0.0,
    sizeMode: "pixels",
    sizeStartPixels: 30,
    sizeEndPixels: 10,
    scaleStart: 0.02,
    scaleEnd: 0.01,
    scaleVariance: 0.3,
    colorStart: { r: 255, g: 255, b: 255 },
    colorEnd: { r: 255, g: 255, b: 255 },

    // Particle Motion
    speed: 5,
    speedVariance: 0.3,
    angle: 270, // degrees
    angleVariance: 30,
    acceleration: 0,
    gravity: 0.1,
    rotationStart: 0, // Initial rotation angle in degrees
    rotationSpeed: 0,
    rotationVariance: 0,
    rotationDirection: "random",

    // Lifetime
    emitterStartDelay: 0, // No delay by default
    emitterLifetime: 0, // 0 = infinite (always emitting)
    emitterLifetimeVariance: 0,
    particleLifetime: 1.0,
    particleLifetimeVariance: 0.2,
    loop: true, // Loop by default (continuous effect)

    // Emitter
    emitting: false, // Don't auto-emit - wait for spawner to be added
    burst: false, // False = continuous, True = all at once
    spawnRate: 30,
    maxParticles: 1000,
    particlesPerWave: 3,

    // Advanced
    blendMode: "normal",
    autoPlay: true,
  };

  private spawnX = 0;
  private spawnY = 0;

  constructor() {
    super();

    // Dark background (store reference so we can change color later)
    this.backgroundGraphics = new Graphics();
    this.backgroundGraphics.rect(0, 0, 10000, 10000);
    this.backgroundGraphics.fill({ color: 0x000000 }); // Start with black
    this.addChild(this.backgroundGraphics);

    // Create viewport container for zoom/pan functionality
    this.viewport = new Container();
    this.addChild(this.viewport);

    // Title
    this.titleText = new Text({
      text: "Particle Editor",
      style: {
        fontSize: 24,
        fill: 0xffffff,
        fontWeight: "bold",
      },
    });
    this.titleText.x = 20;
    this.titleText.y = 20;
    this.addChild(this.titleText);

    // Stats display
    this.statsText = new Text({
      text: "FPS: 60 | Particles: 0",
      style: {
        fontSize: 16,
        fill: 0xaaaaaa,
      },
    });
    this.statsText.x = 20;
    this.statsText.y = 55;
    this.addChild(this.statsText);

    // No longer mouse-driven - particles spawn from spawner positions
  }

  private createCrosshair(x: number, y: number): Graphics {
    const crosshair = new Graphics();
    crosshair.moveTo(-10, 0);
    crosshair.lineTo(10, 0);
    crosshair.moveTo(0, -10);
    crosshair.lineTo(0, 10);
    crosshair.stroke({ width: 1, color: 0x00ff00, alpha: 0.5 });
    crosshair.circle(0, 0, 5);
    crosshair.stroke({ width: 1, color: 0x00ff00, alpha: 0.3 });
    crosshair.x = x;
    crosshair.y = y;
    return crosshair;
  }

  private setupZoom(): void {
    // Enable interactive mode to capture wheel events
    this.eventMode = "static";
    this.hitArea = engine().renderer.screen;

    // Add wheel event listener for zoom
    this.on("wheel", (event: any) => {
      // Don't zoom while panning
      if (this.isPanning) return;

      // Prevent default browser zoom
      event.preventDefault?.();

      // Get mouse position in global coordinates
      const mouseX = event.global.x;
      const mouseY = event.global.y;

      // Calculate zoom delta (normalize wheel delta across browsers)
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(
        this.minZoom,
        Math.min(this.maxZoom, this.viewportZoom + delta),
      );

      if (newZoom === this.viewportZoom) return; // Already at limit

      // Get mouse position relative to viewport before zoom
      const localX = (mouseX - this.viewport.x) / this.viewportZoom;
      const localY = (mouseY - this.viewport.y) / this.viewportZoom;

      // Apply zoom
      this.viewportZoom = newZoom;
      this.viewport.scale.set(this.viewportZoom);

      // Adjust viewport position to zoom toward mouse
      this.viewport.x = mouseX - localX * this.viewportZoom;
      this.viewport.y = mouseY - localY * this.viewportZoom;

      // Update title to show zoom level
      this.titleText.text = `Particle Editor (Zoom: ${(this.viewportZoom * 100).toFixed(0)}%)`;

      console.log(`🔍 Zoom: ${(this.viewportZoom * 100).toFixed(0)}%`);
    });

    // Add middle mouse button panning
    this.on("pointerdown", (event: any) => {
      // Middle mouse button (button 1) or mouse wheel click
      if (event.button === 1) {
        this.isPanning = true;
        this.panStartX = event.global.x;
        this.panStartY = event.global.y;
        this.viewportStartX = this.viewport.x;
        this.viewportStartY = this.viewport.y;

        // Change cursor to indicate panning mode
        engine().canvas.style.cursor = "grabbing";

        console.log("🖐️ Panning started");
      }
    });

    this.on("pointermove", (event: any) => {
      if (this.isPanning) {
        // Calculate delta from pan start position
        const deltaX = event.global.x - this.panStartX;
        const deltaY = event.global.y - this.panStartY;

        // Apply delta to viewport position
        this.viewport.x = this.viewportStartX + deltaX;
        this.viewport.y = this.viewportStartY + deltaY;
      }
    });

    this.on("pointerup", (event: any) => {
      if (event.button === 1 && this.isPanning) {
        this.isPanning = false;
        engine().canvas.style.cursor = "default";
        console.log("🖐️ Panning ended");
      }
    });

    this.on("pointerupoutside", () => {
      if (this.isPanning) {
        this.isPanning = false;
        engine().canvas.style.cursor = "default";
        console.log("🖐️ Panning ended (outside)");
      }
    });

    console.log("🖱️ Mouse wheel zoom enabled (10% - 500%)");
    console.log("🖱️ Middle mouse button pan enabled");
  }

  private setupSceneExplorer(): void {
    // Create scene explorer panel
    this.sceneExplorerPanel = document.createElement("div");
    this.sceneExplorerPanel.style.cssText = `
      position: fixed;
      top: 80px;
      left: 20px;
      width: 280px;
      background: #2b2b2b;
      border: 1px solid #444;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      color: #ddd;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      z-index: 1000;
    `;

    document.body.appendChild(this.sceneExplorerPanel);

    this.updateSceneExplorer();
    console.log("🎬 Scene explorer created");
  }

  private updateSceneExplorer(): void {
    if (!this.sceneExplorerPanel) return;

    // Build the scene hierarchy HTML
    let html = `
      <div style="padding: 8px; background: #333; border-bottom: 1px solid #444;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-weight: 600; font-size: 11px;">🎬 SCENE EXPLORER</span>
          <button id="new-scene-btn" style="
            background: #6a1b9a;
            border: none;
            color: #e0e0e0;
            padding: 3px 8px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            font-weight: 500;
          ">🆕 New</button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px;">
          <button id="save-vfx-btn" style="
            background: #2d7a3e;
            border: none;
            color: #e0e0e0;
            padding: 5px 6px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            font-weight: 500;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
          ">
            <span style="font-size: 14px;">💾</span>
            <span>Save<br/>VFX</span>
          </button>
          <button id="load-vfx-btn" style="
            background: #1565c0;
            border: none;
            color: #e0e0e0;
            padding: 5px 6px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            font-weight: 500;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
          ">
            <span style="font-size: 14px;">📂</span>
            <span>Load<br/>VFX</span>
          </button>
          <button id="respawn-btn" style="
            background: #b36200;
            border: none;
            color: #e0e0e0;
            padding: 5px 6px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            font-weight: 500;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
          ">
            <span style="font-size: 14px;">🔄</span>
            <span>Respawn</span>
          </button>
        </div>
        <input type="file" id="load-vfx-input" accept=".json" style="display: none;" />
        <div style="margin-top: 6px; display: flex; align-items: center; justify-content: space-between; padding: 0 4px;">
          <span style="
            color: #e0e0e0;
            font-size: 11px;
            font-weight: 500;
          ">🎨 Background Color</span>
          <input type="color" id="bg-color-picker" value="#000000" style="
            width: 32px;
            height: 32px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            padding: 0;
          " />
        </div>
      </div>
      <div style="padding: 8px;">
        <div style="padding: 6px; cursor: pointer; border-radius: 3px; ${this.sceneExplorerState.selectedSpawnerId === "root" ? "background: #444;" : ""}" 
             id="scene-root">
          <span style="margin-right: 4px;">📦</span>
          <span style="font-weight: 500;">Root</span>
          <span style="margin-left: 8px; color: #888; font-size: 10px;">(${this.spawners.length} spawner${this.spawners.length !== 1 ? "s" : ""})</span>
        </div>
    `;

    // Add spawners as children
    this.spawners.forEach((spawner, index) => {
      const isSelected =
        this.sceneExplorerState.selectedSpawnerId === spawner.id;
      const icon = spawner.enabled ? "💫" : "⭕";
      const eyeIcon = spawner.container.visible ? "👁️" : "🚫";

      html += `
        <div style="padding: 6px 6px 6px 24px; cursor: pointer; border-radius: 3px; display: flex; justify-content: space-between; align-items: center; ${isSelected ? "background: #444;" : ""}"
             id="spawner-${spawner.id}">
          <div style="display: flex; align-items: center; gap: 4px;">
            <button class="toggle-visibility-btn" data-id="${spawner.id}" style="
              background: transparent;
              border: none;
              color: white;
              padding: 2px;
              cursor: pointer;
              font-size: 14px;
              opacity: 0.8;
              display: flex;
              align-items: center;
            ">${eyeIcon}</button>
            <span style="margin-right: 4px;">${icon}</span>
            <span class="spawner-name" contenteditable="true" style="outline: none; ${isSelected ? "font-weight: 500;" : ""}">${spawner.name}</span>
            <span style="margin-left: 8px; color: #888; font-size: 10px;">(${spawner.particles.length}p)</span>
          </div>
          <button class="delete-spawner-btn" data-id="${spawner.id}" style="
            background: #d44;
            border: none;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            opacity: 0.7;
          ">🗑️</button>
        </div>
      `;
    });

    html += `
        <button id="add-spawner-btn" style="
          background: #2e5f8f;
          border: none;
          color: #e0e0e0;
          padding: 8px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 500;
          width: 100%;
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        ">
          <span style="font-size: 16px;">➕</span>
          <span>Add Spawner</span>
        </button>
      </div>
    `;

    this.sceneExplorerPanel.innerHTML = html;

    // Add event listeners
    const rootEl = document.getElementById("scene-root");
    if (rootEl) {
      rootEl.addEventListener("click", () => this.selectRoot());
    }

    const respawnBtn = document.getElementById("respawn-btn");
    if (respawnBtn) {
      respawnBtn.addEventListener("click", () => this.handleRespawn());
    }

    const addBtn = document.getElementById("add-spawner-btn");
    if (addBtn) {
      addBtn.addEventListener("click", () => this.addSpawner());
    }

    // New Scene button
    const newBtn = document.getElementById("new-scene-btn");
    if (newBtn) {
      newBtn.addEventListener("click", () => this.newScene());
    }

    // Background color picker
    const bgColorPicker = document.getElementById(
      "bg-color-picker",
    ) as HTMLInputElement;
    if (bgColorPicker) {
      bgColorPicker.addEventListener("input", (e) => {
        const color = (e.target as HTMLInputElement).value;
        this.changeBackgroundColor(color);
      });
    }

    // Save VFX button
    const saveBtn = document.getElementById("save-vfx-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => this.saveVFX());
    }

    // Load VFX button
    const loadBtn = document.getElementById("load-vfx-btn");
    const loadInput = document.getElementById(
      "load-vfx-input",
    ) as HTMLInputElement;
    if (loadBtn && loadInput) {
      loadBtn.addEventListener("click", () => loadInput.click());
      loadInput.addEventListener("change", (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          this.loadVFX(file);
          // Reset input so the same file can be loaded again
          loadInput.value = "";
        }
      });
    }

    this.spawners.forEach((spawner) => {
      const spawnerEl = document.getElementById(`spawner-${spawner.id}`);
      if (spawnerEl) {
        spawnerEl.addEventListener("click", (e) => {
          // Don't select if clicking the name (for editing) or delete button
          const target = e.target as HTMLElement;
          if (
            !target.classList.contains("spawner-name") &&
            !target.classList.contains("delete-spawner-btn")
          ) {
            this.selectSpawner(spawner.id);
          }
        });

        // Handle name editing
        const nameEl = spawnerEl.querySelector(".spawner-name");
        if (nameEl) {
          nameEl.addEventListener("blur", () => {
            const newName = (nameEl as HTMLElement).textContent || spawner.name;
            this.renameSpawner(spawner.id, newName);
          });
          nameEl.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (nameEl as HTMLElement).blur();
            }
          });
        }
      }

      // Visibility toggle button
      const visibilityBtn = spawnerEl.querySelector(
        `.toggle-visibility-btn[data-id="${spawner.id}"]`,
      );
      if (visibilityBtn) {
        visibilityBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.toggleSpawnerVisibility(spawner.id);
        });
      }

      // Delete button
      const deleteBtn = spawnerEl.querySelector(
        `.delete-spawner-btn[data-id="${spawner.id}"]`,
      );
      if (deleteBtn) {
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.deleteSpawner(spawner.id);
        });
      }
    });
  }

  private selectRoot(): void {
    this.sceneExplorerState.selectedSpawnerId = "root";
    this.currentSpawner = undefined;
    this.updateSceneExplorer();
    console.log("📦 Selected: Root (showing all spawners)");
  }

  private selectSpawner(id: string): void {
    const spawner = this.spawners.find((s) => s.id === id);
    if (spawner) {
      this.sceneExplorerState.selectedSpawnerId = id;
      this.currentSpawner = spawner;

      // Update Tweakpane to show this spawner's config
      if (this.pane) {
        // Manually copy each property to trigger Tweakpane's reactivity
        this.config.emitting = spawner.config.emitting;
        this.config.autoPlay = spawner.config.autoPlay;
        this.config.spawnRate = spawner.config.spawnRate;
        this.config.maxParticles = spawner.config.maxParticles;
        this.config.particlesPerWave = spawner.config.particlesPerWave;
        this.config.textureName = spawner.config.textureName;
        this.config.blendMode = spawner.config.blendMode;
        this.config.alphaStart = spawner.config.alphaStart;
        this.config.alphaEnd = spawner.config.alphaEnd;
        this.config.sizeMode = spawner.config.sizeMode;
        this.config.sizeStartPixels = spawner.config.sizeStartPixels;
        this.config.sizeEndPixels = spawner.config.sizeEndPixels;
        this.config.scaleStart = spawner.config.scaleStart;
        this.config.scaleEnd = spawner.config.scaleEnd;
        this.config.scaleVariance = spawner.config.scaleVariance;
        this.config.speed = spawner.config.speed;
        this.config.speedVariance = spawner.config.speedVariance;
        this.config.angle = spawner.config.angle;
        this.config.angleVariance = spawner.config.angleVariance;
        this.config.acceleration = spawner.config.acceleration;
        this.config.gravity = spawner.config.gravity;
        this.config.rotationStart = spawner.config.rotationStart;
        this.config.rotationSpeed = spawner.config.rotationSpeed;
        this.config.rotationVariance = spawner.config.rotationVariance;
        this.config.rotationDirection = spawner.config.rotationDirection;
        this.config.emitterStartDelay = spawner.config.emitterStartDelay;
        this.config.emitterLifetime = spawner.config.emitterLifetime;
        this.config.emitterLifetimeVariance =
          spawner.config.emitterLifetimeVariance;
        this.config.particleLifetime = spawner.config.particleLifetime;
        this.config.particleLifetimeVariance =
          spawner.config.particleLifetimeVariance;
        this.config.loop = spawner.config.loop;
        this.config.burst = spawner.config.burst;
        // Deep copy nested objects
        this.config.colorStart = { ...spawner.config.colorStart };
        this.config.colorEnd = { ...spawner.config.colorEnd };
        this.pane.refresh();

        // Debug: Log the blend mode to verify it's correct
        console.log(
          `🔍 Selected "${spawner.name}" with blend mode: ${spawner.config.blendMode}`,
        );
        console.log(
          `🔍 this.config.blendMode is now: ${this.config.blendMode}`,
        );
        console.log(`🔍 Spawner has ${spawner.particles.length} particles`);
        console.log(
          `⚠️ NOTE: Tweakpane dropdown may not visually update, but the value IS correct!`,
        );
        console.log(
          `   If you need to change blend mode, just select a new value from the dropdown.`,
        );

        // IMPORTANT: Verify that all particles match this spawner's blend mode
        let mismatchCount = 0;
        spawner.particles.forEach((p) => {
          if (p.particle.blendMode !== spawner.config.blendMode) {
            p.particle.blendMode = spawner.config.blendMode as any;
            mismatchCount++;
          }
        });
        if (mismatchCount > 0) {
          console.log(
            `⚠️ Fixed ${mismatchCount} particles with wrong blend mode`,
          );
        }
      }

      this.updateSceneExplorer();
      console.log(`💫 Selected: ${spawner.name}`);
    }
  }

  private renameSpawner(id: string, newName: string): void {
    const spawner = this.spawners.find((s) => s.id === id);
    if (spawner) {
      spawner.name = newName.trim() || spawner.name;
      this.updateSceneExplorer();
      console.log(`✏️ Renamed spawner to: ${spawner.name}`);
    }
  }

  private toggleSpawnerVisibility(id: string): void {
    const spawner = this.spawners.find((s) => s.id === id);
    if (spawner) {
      // Toggle visibility of container and crosshair
      spawner.container.visible = !spawner.container.visible;
      spawner.crosshair.visible = !spawner.crosshair.visible;

      // Update scene explorer to show new icon
      this.updateSceneExplorer();

      const status = spawner.container.visible ? "visible" : "hidden";
      console.log(`👁️ Spawner "${spawner.name}" is now ${status}`);
    }
  }

  private newScene(): void {
    // Confirm with user before clearing
    const confirmed = confirm(
      `Create a new scene? This will delete all ${this.spawners.length} spawner(s).`,
    );
    if (!confirmed) {
      console.log("🚫 New scene cancelled by user");
      return;
    }

    console.log("🆕 Creating new scene...");

    // Clear all spawners
    while (this.spawners.length > 0) {
      const spawner = this.spawners[0];
      this.deleteSpawner(spawner.id);
    }

    // Select root
    this.selectRoot();

    console.log("✅ New scene created! Scene is now empty.");
  }

  private changeBackgroundColor(hexColor: string): void {
    // Convert hex to numeric color
    const colorNum = parseInt(hexColor.replace("#", ""), 16);

    // Clear and redraw the background graphics with new color
    this.backgroundGraphics.clear();
    this.backgroundGraphics.rect(0, 0, 10000, 10000);
    this.backgroundGraphics.fill({ color: colorNum });

    console.log(`🎨 Background color changed to: ${hexColor} (${colorNum})`);
  }

  private saveVFX(): void {
    // Create a serializable representation of the entire VFX system
    const vfxData: VFXData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      spawners: this.spawners.map((spawner) => ({
        id: spawner.id,
        name: spawner.name,
        position: {
          x: spawner.spawnX,
          y: spawner.spawnY,
        },
        visible: spawner.container.visible,
        config: spawner.config,
      })),
    };

    // Convert to JSON
    const jsonString = JSON.stringify(vfxData, null, 2);

    // Create a blob and download it
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `particle-vfx-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`💾 Saved VFX with ${this.spawners.length} spawner(s)`);
    console.log(`   File: ${a.download}`);
  }

  private async loadVFX(file: File): Promise<void> {
    try {
      // Read the file
      const text = await file.text();
      const vfxData: VFXData = JSON.parse(text);

      console.log(`📂 Loading VFX from: ${file.name}`);
      console.log(`   Version: ${vfxData.version}`);
      console.log(`   Spawners: ${vfxData.spawners?.length || 0}`);

      // Clear existing spawners
      while (this.spawners.length > 0) {
        const spawner = this.spawners[0];
        this.deleteSpawner(spawner.id);
      }

      // Recreate spawners from the saved data
      for (const spawnerData of vfxData.spawners || []) {
        // Create a new spawner with the saved config
        const centerX = spawnerData.position?.x || 0;
        const centerY = spawnerData.position?.y || 0;

        // Temporarily set this.config to match the loaded spawner's config
        this.config = deepCloneConfig(spawnerData.config);

        // Create container
        const container = new Container();
        container.scale.set(1, 1);

        // Load texture
        const texture = await this.loadTexture(this.config.textureName);

        // Create crosshair
        const crosshair = this.createCrosshair(centerX, centerY);
        this.viewport.addChild(crosshair);

        // Calculate emitter lifetime
        const emitterLifeVar =
          (Math.random() - 0.5) * this.config.emitterLifetimeVariance * 2;
        const emitterMaxLife =
          this.config.emitterLifetime > 0
            ? this.config.emitterLifetime * (1 + emitterLifeVar)
            : 0;

        // Create spawner object
        const spawner: Spawner = {
          id: spawnerData.id || `spawner-${this.spawnerIdCounter++}`,
          name: spawnerData.name || `Spawner ${this.spawnerIdCounter - 1}`,
          config: deepCloneConfig(this.config),
          container,
          particles: [],
          texture,
          enabled: true,
          spawnX: centerX,
          spawnY: centerY,
          crosshair,
          emitterLife: 0,
          emitterMaxLife,
          isEmitterDead: false,
          hasBurst: false,
          delayTimer: 0,
          hasStarted: this.config.emitterStartDelay === 0,
        };

        // Set visibility
        spawner.container.visible = spawnerData.visible !== false;
        spawner.crosshair.visible = spawnerData.visible !== false;

        // Add to scene
        this.viewport.addChild(container);
        this.spawners.push(spawner);

        console.log(
          `✅ Loaded spawner "${spawner.name}" at (${centerX}, ${centerY})`,
        );
      }

      // Select the first spawner if any exist
      if (this.spawners.length > 0) {
        this.selectSpawner(this.spawners[0].id);
      } else {
        this.selectRoot();
      }

      this.updateSceneExplorer();

      console.log(
        `✅ Successfully loaded ${this.spawners.length} spawner(s) from ${file.name}`,
      );
    } catch (error) {
      console.error("❌ Error loading VFX file:", error);
      alert(
        `Failed to load VFX file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private deleteSpawner(id: string): void {
    const index = this.spawners.findIndex((s) => s.id === id);
    if (index !== -1) {
      const spawner = this.spawners[index];

      // Remove from scene
      this.viewport.removeChild(spawner.container);
      this.viewport.removeChild(spawner.crosshair);

      // Clean up
      spawner.container.destroy();
      spawner.crosshair.destroy();

      // Remove from array
      this.spawners.splice(index, 1);

      // Update selection
      if (this.currentSpawner === spawner) {
        this.currentSpawner = undefined;
        this.sceneExplorerState.selectedSpawnerId = "root";
      }

      this.updateSceneExplorer();
      console.log(`🗑️ Deleted spawner: ${spawner.name}`);
    }
  }

  private setupTweakpane(): void {
    // Create Tweakpane GUI
    this.pane = new Pane({
      title: "Particle Properties",
      container: document.body,
    });

    // Style the pane to position it on the right
    const paneElement = this.pane.element;
    paneElement.style.position = "fixed";
    paneElement.style.top = "20px";
    paneElement.style.right = "20px";
    paneElement.style.width = "350px";
    paneElement.style.zIndex = "1000";

    // Helper function to sync config changes to current spawner
    const syncToCurrentSpawner = () => {
      if (this.currentSpawner) {
        // Deep copy each property to avoid breaking Tweakpane bindings
        Object.assign(this.currentSpawner.config, this.config);
        this.currentSpawner.config.colorStart = { ...this.config.colorStart };
        this.currentSpawner.config.colorEnd = { ...this.config.colorEnd };
        console.log(`🔄 Synced config to "${this.currentSpawner.name}"`);
        console.log(`   - blendMode: ${this.currentSpawner.config.blendMode}`);
        console.log(`   - loop: ${this.config.loop}`);
      } else {
        console.warn("⚠️ syncToCurrentSpawner called but no spawner selected!");
      }
    };

    // Helper function to recalculate emitter max life when lifetime changes
    const recalculateEmitterLife = () => {
      if (this.currentSpawner) {
        syncToCurrentSpawner();
        const emitterLifeVar =
          (Math.random() - 0.5) * this.config.emitterLifetimeVariance * 2;
        this.currentSpawner.emitterMaxLife =
          this.config.emitterLifetime > 0
            ? this.config.emitterLifetime * (1 + emitterLifeVar)
            : 0;
        console.log(
          `⏱️ Recalculated emitter max life: ${this.currentSpawner.emitterMaxLife.toFixed(2)}s (base: ${this.config.emitterLifetime}s)`,
        );
      }
    };

    // === EMITTER CONTROLS ===
    const emitterFolder = this.pane.addFolder({
      title: "Emitter",
      expanded: true,
    });

    emitterFolder
      .addBinding(this.config, "emitting", { label: "Emit" })
      .on("change", syncToCurrentSpawner);
    emitterFolder
      .addBinding(this.config, "autoPlay", { label: "Auto Play" })
      .on("change", syncToCurrentSpawner);
    emitterFolder
      .addBinding(this.config, "spawnRate", {
        label: "Spawn Rate (p/s)",
        min: 1,
        max: 200,
        step: 1,
      })
      .on("change", syncToCurrentSpawner);
    emitterFolder
      .addBinding(this.config, "maxParticles", {
        label: "Max Particles",
        min: 50,
        max: 5000,
        step: 50,
      })
      .on("change", syncToCurrentSpawner);
    emitterFolder
      .addBinding(this.config, "particlesPerWave", {
        label: "Per Wave",
        min: 1,
        max: 50,
        step: 1,
      })
      .on("change", syncToCurrentSpawner);

    emitterFolder
      .addButton({ title: "Clear All" })
      .on("click", () => this.clearParticles());

    // === LIFETIME ===
    const lifetimeFolder = this.pane.addFolder({
      title: "Lifetime",
      expanded: true,
    });

    // Loop toggle
    lifetimeFolder
      .addBinding(this.config, "loop", {
        label: "🔁 Loop",
      })
      .on("change", syncToCurrentSpawner);

    // Burst mode
    lifetimeFolder
      .addBinding(this.config, "burst", {
        label: "💥 Burst Mode",
      })
      .on("change", syncToCurrentSpawner);

    // Start delay
    lifetimeFolder
      .addBinding(this.config, "emitterStartDelay", {
        label: "⏱️ Start Delay (s)",
        min: 0,
        max: 10,
        step: 0.1,
      })
      .on("change", syncToCurrentSpawner);

    // Emitter Lifetime
    lifetimeFolder
      .addBinding(this.config, "emitterLifetime", {
        label: "Emitter Life (s)",
        min: 0,
        max: 10,
        step: 0.1,
      })
      .on("change", recalculateEmitterLife);
    lifetimeFolder
      .addBinding(this.config, "emitterLifetimeVariance", {
        label: "Emitter Variance",
        min: 0,
        max: 1,
        step: 0.05,
      })
      .on("change", recalculateEmitterLife);

    // Particle Lifetime
    lifetimeFolder
      .addBinding(this.config, "particleLifetime", {
        label: "Particle Life (s)",
        min: 0.1,
        max: 10,
        step: 0.1,
      })
      .on("change", syncToCurrentSpawner);
    lifetimeFolder
      .addBinding(this.config, "particleLifetimeVariance", {
        label: "Particle Variance",
        min: 0,
        max: 1,
        step: 0.05,
      })
      .on("change", syncToCurrentSpawner);

    // Note: Respawn button is now in Scene Explorer (top-left panel)

    lifetimeFolder
      .addButton({ title: "💡 Tip: 0 = Infinite" })
      .on("click", () => {
        console.log(
          "💡 Emitter Life of 0 means the emitter will continue spawning particles indefinitely.",
        );
      });

    // === ADVANCED (BLEND MODE) ===
    // === TEXTURE SELECTOR ===
    const textureFolder = this.pane.addFolder({
      title: "🖼️ Texture",
      expanded: true,
    });

    // Create options object for texture dropdown
    const textureOptions: { [key: string]: string } = {};
    this.availableTextures.forEach((tex) => {
      textureOptions[tex.replace(".png", "")] = tex;
    });

    textureFolder
      .addBinding(this.config, "textureName", {
        label: "Texture",
        options: textureOptions,
      })
      .on("change", async (ev) => {
        console.log(`🎨 Changing texture to: ${ev.value}`);
        await this.changeTexture(ev.value);
        syncToCurrentSpawner();
        this.pane?.refresh();
      });

    // Add read-only texture info display
    this.textureInfo.dimensions = `${this.particleTexture?.width || 0}x${this.particleTexture?.height || 0}px`;
    textureFolder.addBinding(this.textureInfo, "dimensions", {
      label: "Size",
      readonly: true,
    });

    // Add custom HTML texture preview grid below the dropdown
    this.createTexturePreviewGrid(textureFolder.element);

    // Blend Mode (moved from Advanced)
    textureFolder
      .addBinding(this.config, "blendMode", {
        label: "Blend Mode",
        options: {
          Normal: "normal",
          Add: "add",
          Multiply: "multiply",
          Screen: "screen",
        },
      })
      .on("change", (ev) => {
        syncToCurrentSpawner();
        // Also update blend mode for all existing particles of the current spawner
        if (this.currentSpawner) {
          this.currentSpawner.particles.forEach((p) => {
            p.particle.blendMode = ev.value as any;
          });
          console.log(
            `🎨 Updated blend mode to "${ev.value}" for ${this.currentSpawner.particles.length} existing particles`,
          );
        }
      });

    // === VISUAL PROPERTIES ===
    const visualFolder = this.pane.addFolder({
      title: "Visual",
      expanded: true,
    });

    // Color Start/End
    visualFolder
      .addBinding(this.config, "colorStart", { label: "Color Start" })
      .on("change", syncToCurrentSpawner);
    visualFolder
      .addBinding(this.config, "colorEnd", { label: "Color End" })
      .on("change", syncToCurrentSpawner);

    // Alpha
    visualFolder
      .addBinding(this.config, "alphaStart", {
        label: "Alpha Start",
        min: 0,
        max: 1,
        step: 0.01,
      })
      .on("change", syncToCurrentSpawner);
    visualFolder
      .addBinding(this.config, "alphaEnd", {
        label: "Alpha End",
        min: 0,
        max: 1,
        step: 0.01,
      })
      .on("change", syncToCurrentSpawner);

    // Size Mode
    visualFolder
      .addBinding(this.config, "sizeMode", {
        label: "Size Mode",
        options: {
          Pixels: "pixels",
          "Scale (Raw)": "scale",
        },
      })
      .on("change", () => {
        syncToCurrentSpawner();
        this.pane?.refresh();
      });

    // Size controls based on mode
    if (this.config.sizeMode === "pixels") {
      visualFolder
        .addBinding(this.config, "sizeStartPixels", {
          label: "Size Start (px)",
          min: 1,
          max: 200,
          step: 1,
        })
        .on("change", () => {
          syncToCurrentSpawner();
          this.clearParticles();
        });
      visualFolder
        .addBinding(this.config, "sizeEndPixels", {
          label: "Size End (px)",
          min: 1,
          max: 200,
          step: 1,
        })
        .on("change", () => {
          syncToCurrentSpawner();
          this.clearParticles();
        });
    } else {
      visualFolder
        .addBinding(this.config, "scaleStart", {
          label: "Scale Start",
          min: 0.001,
          max: 0.2,
          step: 0.001,
        })
        .on("change", syncToCurrentSpawner);
      visualFolder
        .addBinding(this.config, "scaleEnd", {
          label: "Scale End",
          min: 0.001,
          max: 0.2,
          step: 0.001,
        })
        .on("change", syncToCurrentSpawner);
    }

    visualFolder
      .addBinding(this.config, "scaleVariance", {
        label: "Size Variance",
        min: 0,
        max: 1,
        step: 0.05,
      })
      .on("change", syncToCurrentSpawner);

    // === MOTION ===
    const motionFolder = this.pane.addFolder({
      title: "Motion",
      expanded: true,
    });

    motionFolder
      .addBinding(this.config, "speed", {
        label: "Speed",
        min: 0,
        max: 30,
        step: 0.1,
      })
      .on("change", syncToCurrentSpawner);
    motionFolder
      .addBinding(this.config, "speedVariance", {
        label: "Speed Variance",
        min: 0,
        max: 1,
        step: 0.05,
      })
      .on("change", syncToCurrentSpawner);
    motionFolder
      .addBinding(this.config, "angle", {
        label: "Direction (deg)",
        min: 0,
        max: 360,
        step: 1,
      })
      .on("change", syncToCurrentSpawner);
    motionFolder
      .addBinding(this.config, "angleVariance", {
        label: "Angle Variance",
        min: 0,
        max: 360,
        step: 5,
      })
      .on("change", syncToCurrentSpawner);
    motionFolder
      .addBinding(this.config, "acceleration", {
        label: "Acceleration",
        min: -2,
        max: 2,
        step: 0.1,
      })
      .on("change", syncToCurrentSpawner);
    motionFolder
      .addBinding(this.config, "gravity", {
        label: "Gravity",
        min: -2,
        max: 2,
        step: 0.05,
      })
      .on("change", syncToCurrentSpawner);
    motionFolder
      .addBinding(this.config, "rotationStart", {
        label: "Rotation Start (deg)",
        min: 0,
        max: 360,
        step: 5,
      })
      .on("change", syncToCurrentSpawner);
    motionFolder
      .addBinding(this.config, "rotationSpeed", {
        label: "Rotation Speed",
        min: -20,
        max: 20,
        step: 0.5,
      })
      .on("change", syncToCurrentSpawner);
    motionFolder
      .addBinding(this.config, "rotationVariance", {
        label: "Rotation Variance",
        min: 0,
        max: 1,
        step: 0.05,
      })
      .on("change", syncToCurrentSpawner);
    motionFolder
      .addBinding(this.config, "rotationDirection", {
        label: "Rotation Dir",
        options: {
          Clockwise: "clockwise",
          "Counter-CW": "counter-clockwise",
          Random: "random",
        },
      })
      .on("change", syncToCurrentSpawner);

    // === EXPORT ===
    this.pane
      .addButton({ title: "📋 Export Config" })
      .on("click", () => this.exportConfig());
    this.pane
      .addButton({ title: "← Back to Main" })
      .on("click", () => this.goBack());
  }

  private async changeTexture(textureName: string): Promise<void> {
    console.log(`🔄 Changing texture to: ${textureName}`);

    // Load new texture
    const newTexture = await this.loadTexture(textureName);
    this.particleTexture = newTexture;
    this.textureSize = newTexture.width;

    // Update texture info display
    this.textureInfo.dimensions = `${newTexture.width}x${newTexture.height}px`;

    // Update current spawner's texture
    if (this.currentSpawner) {
      this.currentSpawner.texture = newTexture;
      console.log(`✅ Updated spawner "${this.currentSpawner.name}" texture`);
    }

    // Clear existing particles to force respawn with new texture
    this.clearParticles();

    console.log(
      `✅ Texture changed to: ${textureName} (${this.textureSize}x${newTexture.height})`,
    );
  }

  private async addSpawner(): Promise<void> {
    console.log("➕ Adding new spawner...");

    // Get screen center from renderer (engine IS the application)
    const renderer = engine().renderer;
    const centerX = renderer.width / 2;
    const centerY = renderer.height / 2;

    console.log(`📏 Screen dimensions: ${renderer.width}x${renderer.height}`);
    console.log(`🎯 Center position: (${centerX}, ${centerY})`);

    // Create new spawner
    const spawnerId = `spawner_${this.spawnerIdCounter++}`;
    const spawnerName = `Spawner ${this.spawnerIdCounter - 1}`;

    // Create regular container for this spawner (ParticleContainer has API issues in v8)
    const container = new Container();
    container.scale.set(1, 1);

    // Load texture
    const texture = await this.loadTexture(this.config.textureName);

    // Create crosshair marker for this spawner
    const crosshair = this.createCrosshair(centerX, centerY);
    this.viewport.addChild(crosshair);
    console.log(`✅ Crosshair added at (${centerX}, ${centerY})`);

    // Calculate emitter lifetime with variance
    const emitterLifeVar =
      (Math.random() - 0.5) * this.config.emitterLifetimeVariance * 2;
    const emitterMaxLife =
      this.config.emitterLifetime > 0
        ? this.config.emitterLifetime * (1 + emitterLifeVar)
        : 0; // 0 = infinite

    console.log(`⏱️ Emitter lifetime calculation:`);
    console.log(`   Base lifetime: ${this.config.emitterLifetime}s`);
    console.log(`   Variance: ${this.config.emitterLifetimeVariance}`);
    console.log(`   Random variance multiplier: ${emitterLifeVar.toFixed(3)}`);
    console.log(`   Final emitter max life: ${emitterMaxLife.toFixed(3)}s`);

    // Create spawner object
    const spawner: Spawner = {
      id: spawnerId,
      name: spawnerName,
      config: deepCloneConfig(this.config), // Deep clone to avoid shared references
      container,
      particles: [],
      texture,
      enabled: true,
      spawnX: centerX,
      spawnY: centerY,
      crosshair,

      // Initialize emitter lifetime
      emitterLife: 0,
      emitterMaxLife,
      isEmitterDead: false,
      hasBurst: false,
      delayTimer: 0,
      hasStarted: this.config.emitterStartDelay === 0, // If no delay, start immediately
    };

    // Add container to viewport (for zoom support)
    this.viewport.addChild(container);

    // Store spawner
    this.spawners.push(spawner);

    console.log(`✅ Added spawner "${spawnerName}"`);
    console.log(`   Position: (${centerX.toFixed(0)}, ${centerY.toFixed(0)})`);
    console.log(`   Total spawners: ${this.spawners.length}`);
    console.log(
      `   Texture: ${this.config.textureName} (${texture.width}x${texture.height})`,
    );

    // Update legacy spawn position (for backwards compatibility during transition)
    this.spawnX = centerX;
    this.spawnY = centerY;

    // Enable emitting for the new spawner
    spawner.config.emitting = true;

    // Select the new spawner (this will properly sync Tweakpane and scene explorer)
    this.selectSpawner(spawner.id);

    console.log(`▶️ Emitting enabled for spawner "${spawnerName}"`);
  }

  private clearParticles(): void {
    // Clear all particles from all spawners
    for (const spawner of this.spawners) {
      spawner.particles = [];
      spawner.container.removeChildren();
    }
    console.log("🗑️ Cleared all particles from all spawners");
  }

  private createTexturePreviewGrid(folderElement: HTMLElement): void {
    // Create a container for the texture preview grid
    const gridContainer = document.createElement("div");
    gridContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
      gap: 4px;
      padding: 8px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 4px;
      max-height: 200px;
      overflow-y: auto;
      margin: 8px 0;
    `;

    // Add each texture as a clickable thumbnail
    this.availableTextures.forEach((textureName) => {
      const thumbnail = document.createElement("div");
      thumbnail.style.cssText = `
        width: 48px;
        height: 48px;
        background-color: rgba(255, 255, 255, 0.1);
        background-image: url(/assets/vfx/${textureName});
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        border: 2px solid transparent;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
      `;

      // Highlight the currently selected texture
      if (textureName === this.config.textureName) {
        thumbnail.style.borderColor = "#00d4ff";
        thumbnail.style.backgroundColor = "rgba(0, 212, 255, 0.2)";
      }

      // Add hover effect
      thumbnail.addEventListener("mouseenter", () => {
        if (textureName !== this.config.textureName) {
          thumbnail.style.borderColor = "rgba(255, 255, 255, 0.5)";
          thumbnail.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
        }
      });

      thumbnail.addEventListener("mouseleave", () => {
        if (textureName !== this.config.textureName) {
          thumbnail.style.borderColor = "transparent";
          thumbnail.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        }
      });

      // Handle texture selection
      thumbnail.addEventListener("click", async () => {
        console.log(`🖼️ Texture thumbnail clicked: ${textureName}`);

        // Update config and change texture
        this.config.textureName = textureName;
        await this.changeTexture(textureName);

        // Sync to current spawner
        if (this.currentSpawner) {
          this.currentSpawner.config.textureName = textureName;
          Object.assign(this.currentSpawner.config, this.config);
          this.currentSpawner.config.colorStart = { ...this.config.colorStart };
          this.currentSpawner.config.colorEnd = { ...this.config.colorEnd };
        }

        // Update the visual selection in the grid
        gridContainer.querySelectorAll("div").forEach((thumb) => {
          thumb.style.borderColor = "transparent";
          thumb.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        });
        thumbnail.style.borderColor = "#00d4ff";
        thumbnail.style.backgroundColor = "rgba(0, 212, 255, 0.2)";

        // Force Tweakpane to refresh and show the updated texture name
        if (this.pane) {
          this.pane.refresh();
          console.log(
            `✅ Tweakpane refreshed, texture dropdown should show: ${textureName}`,
          );
        }
      });

      // Add tooltip with texture name
      thumbnail.title = textureName.replace(".png", "");

      gridContainer.appendChild(thumbnail);
    });

    // Append the grid to the texture folder
    folderElement.appendChild(gridContainer);

    console.log(
      `🖼️ Created texture preview grid with ${this.availableTextures.length} thumbnails`,
    );
  }

  private handleRespawn(): void {
    // Check what's selected (root, empty string, or specific spawner ID)
    if (
      this.sceneExplorerState.selectedSpawnerId === "root" ||
      this.sceneExplorerState.selectedSpawnerId === ""
    ) {
      // Respawn all spawners
      if (this.spawners.length === 0) {
        console.warn("⚠️ No spawners to respawn!");
        return;
      }

      console.log(`🔄 Respawning ALL ${this.spawners.length} spawner(s)...`);
      this.spawners.forEach((spawner) => {
        this.respawnSpawner(spawner);
      });
      console.log(`✅ Respawned ${this.spawners.length} spawner(s)`);
    } else {
      // Respawn the selected spawner
      const spawner = this.spawners.find(
        (s) => s.id === this.sceneExplorerState.selectedSpawnerId,
      );
      if (!spawner) {
        console.error(
          `❌ Spawner with ID "${this.sceneExplorerState.selectedSpawnerId}" not found!`,
        );
        return;
      }

      this.respawnSpawner(spawner);
    }
  }

  private respawnSpawner(spawner: Spawner): void {
    console.log(`🔄 Respawning emitter "${spawner.name}"`);

    // Reset emitter lifetime
    spawner.emitterLife = 0;
    spawner.isEmitterDead = false;
    spawner.hasBurst = false; // Reset burst flag so it can fire again
    spawner.delayTimer = 0; // Reset delay timer
    spawner.hasStarted = spawner.config.emitterStartDelay === 0; // Reset start flag

    // Clear existing particles
    spawner.particles = [];
    spawner.container.removeChildren();

    // Re-enable emitting if it was turned off
    if (!spawner.config.emitting) {
      spawner.config.emitting = true;
      console.log(`✅ Re-enabled emitting for spawner "${spawner.name}"`);
    }
  }

  private exportConfig(): void {
    const json = JSON.stringify(this.config, null, 2);
    console.log("📋 Exported Configuration:");
    console.log(json);

    if (navigator.clipboard) {
      navigator.clipboard.writeText(json);
      alert("✅ Config copied to clipboard!");
    }
  }

  private spawnParticles(): void {
    // Spawn particles for all active spawners (but not dead emitters)
    for (const spawner of this.spawners) {
      if (!spawner.enabled || !spawner.config.emitting) continue;
      if (!spawner.hasStarted) continue; // Don't spawn if start delay hasn't elapsed
      if (spawner.isEmitterDead) continue; // Don't spawn new particles if emitter is dead
      if (spawner.particles.length >= spawner.config.maxParticles) continue;

      // In burst mode, spawn all particles at once on first frame, then stop
      if (spawner.config.burst) {
        if (!spawner.hasBurst) {
          // Spawn all maxParticles at once
          const particlesToSpawn = Math.min(
            spawner.config.maxParticles - spawner.particles.length,
            spawner.config.maxParticles,
          );
          for (let i = 0; i < particlesToSpawn; i++) {
            this.spawnParticlesForSpawner(spawner, 1); // Spawn 1 particle at a time
          }
          spawner.hasBurst = true;
          console.log(
            `💥 Burst! Spawned ${particlesToSpawn} particles for "${spawner.name}"`,
          );
        }
        // Don't spawn more particles in burst mode after initial burst
        continue;
      }

      // Normal continuous spawning
      this.spawnParticlesForSpawner(spawner);
    }
  }

  private spawnParticlesForSpawner(spawner: Spawner, count?: number): void {
    const particlesToSpawn =
      count !== undefined ? count : spawner.config.particlesPerWave;
    for (let i = 0; i < particlesToSpawn; i++) {
      // Spawn at point (spawn shape removed for now)
      const spawnOffsetX = 0;
      const spawnOffsetY = 0;

      const particle = new Sprite(spawner.texture);
      particle.x = spawner.spawnX + spawnOffsetX;
      particle.y = spawner.spawnY + spawnOffsetY;
      particle.anchor.set(0.5, 0.5);

      // Calculate velocity
      const baseAngle = (spawner.config.angle * Math.PI) / 180;
      const angleVar =
        ((Math.random() - 0.5) * spawner.config.angleVariance * Math.PI) / 180;
      const velocityAngle = baseAngle + angleVar;

      const baseSpeed = spawner.config.speed;
      const speedVar = (Math.random() - 0.5) * spawner.config.speedVariance * 2;
      const speed = baseSpeed + speedVar * baseSpeed;

      // Calculate scale based on mode
      let startScale: number;
      let endScale: number;
      const textureSize = spawner.texture.width;

      if (spawner.config.sizeMode === "pixels") {
        startScale = spawner.config.sizeStartPixels / textureSize;
        endScale = spawner.config.sizeEndPixels / textureSize;
      } else {
        startScale = spawner.config.scaleStart;
        endScale = spawner.config.scaleEnd;
      }

      // Apply variance
      const scaleVar = (Math.random() - 0.5) * spawner.config.scaleVariance * 2;
      startScale = startScale * (1 + scaleVar);
      endScale = endScale * (1 + scaleVar);

      // Particle lifetime variance
      const particleLifeVar =
        (Math.random() - 0.5) * spawner.config.particleLifetimeVariance * 2;
      const particleLifetime =
        spawner.config.particleLifetime * (1 + particleLifeVar);

      // Use colorStart as initial color (will interpolate to colorEnd during update)
      const startColor =
        (spawner.config.colorStart.r << 16) |
        (spawner.config.colorStart.g << 8) |
        spawner.config.colorStart.b;

      // Set initial properties
      if (typeof particle.scale === "object" && "set" in particle.scale) {
        particle.scale.set(startScale);
      }

      particle.tint = startColor;
      particle.alpha = spawner.config.alphaStart;

      // Set blend mode
      particle.blendMode = spawner.config.blendMode;

      // Set initial rotation (convert degrees to radians)
      particle.rotation = (spawner.config.rotationStart * Math.PI) / 180;

      spawner.container.addChild(particle);

      // Calculate angular velocity based on rotation direction and variance
      let angularVelocity = spawner.config.rotationSpeed;
      const rotationVar =
        (Math.random() - 0.5) * spawner.config.rotationVariance * 2;
      angularVelocity *= 1 + rotationVar;

      // Apply rotation direction
      if (spawner.config.rotationDirection === "clockwise") {
        angularVelocity = Math.abs(angularVelocity);
      } else if (spawner.config.rotationDirection === "counter-clockwise") {
        angularVelocity = -Math.abs(angularVelocity);
      } else if (spawner.config.rotationDirection === "random") {
        angularVelocity *= Math.random() < 0.5 ? 1 : -1;
      }

      spawner.particles.push({
        particle,
        vx: Math.cos(velocityAngle) * speed,
        vy: Math.sin(velocityAngle) * speed,
        life: 0,
        maxLife: particleLifetime,
        angularVelocity,
        startScale,
        endScale,
        startAlpha: spawner.config.alphaStart,
        endAlpha: spawner.config.alphaEnd,
      });
    }
  }

  public update(time: Ticker): void {
    if (!this.isReady) return;

    const delta = time.deltaTime / 60;

    // Update emitter lifetimes and count active emitters
    let activeSpawners = 0;
    for (const spawner of this.spawners) {
      if (!spawner.enabled || !spawner.config.emitting) continue;

      // Handle start delay
      if (!spawner.hasStarted) {
        spawner.delayTimer += delta;
        if (spawner.delayTimer >= spawner.config.emitterStartDelay) {
          spawner.hasStarted = true;
          console.log(
            `▶️ Emitter "${spawner.name}" started after ${spawner.config.emitterStartDelay.toFixed(2)}s delay`,
          );
        }
        continue; // Don't update lifetime until delay has elapsed
      }

      // Update emitter lifetime
      if (!spawner.isEmitterDead) {
        spawner.emitterLife += delta;

        // Check if emitter has reached its lifetime (0 = infinite)
        if (
          spawner.emitterMaxLife > 0 &&
          spawner.emitterLife >= spawner.emitterMaxLife
        ) {
          spawner.isEmitterDead = true;
          console.log(
            `💀 Emitter "${spawner.name}" has finished its lifetime (${spawner.emitterMaxLife.toFixed(2)}s)`,
          );

          // Handle looping
          if (spawner.config.loop) {
            console.log(`🔁 Looping: respawning emitter "${spawner.name}"`);
            // Reset for next loop iteration
            spawner.emitterLife = 0;
            spawner.isEmitterDead = false;
            spawner.hasBurst = false; // Reset burst flag for next loop
            spawner.delayTimer = 0; // Reset delay timer
            spawner.hasStarted = spawner.config.emitterStartDelay === 0; // Reset start flag
            // Recalculate max life with variance for next loop
            const emitterLifeVar =
              (Math.random() - 0.5) *
              spawner.config.emitterLifetimeVariance *
              2;
            spawner.emitterMaxLife =
              spawner.config.emitterLifetime > 0
                ? spawner.config.emitterLifetime * (1 + emitterLifeVar)
                : 0;
          } else {
            console.log(
              `⏹️ Loop OFF: emitter "${spawner.name}" will NOT respawn`,
            );
          }
        } else {
          activeSpawners++;
        }
      }

      // Count looping emitters that are temporarily dead but will respawn
      if (spawner.isEmitterDead && spawner.config.loop) {
        // Don't increment activeSpawners, but also don't remove spawner
      } else if (!spawner.isEmitterDead) {
        // Already counted above
      }
    }

    // Count total particles across all spawners
    const totalParticles = this.spawners.reduce(
      (sum, s) => sum + s.particles.length,
      0,
    );
    const emitStatus =
      activeSpawners > 0 ? `▶ EMITTING (${activeSpawners})` : "⏸ PAUSED";
    this.statsText.text = `FPS: ${Math.round(time.FPS)} | Particles: ${totalParticles} | ${emitStatus}`;

    // Spawn particles (only for live emitters)
    this.timeSinceLastSpawn += delta;
    const spawnInterval = 1 / this.config.spawnRate;

    while (this.timeSinceLastSpawn >= spawnInterval) {
      this.spawnParticles(); // This handles all spawners
      this.timeSinceLastSpawn -= spawnInterval;
    }

    // Update particles and remove dead spawners
    for (let s = this.spawners.length - 1; s >= 0; s--) {
      const spawner = this.spawners[s];

      // Update particles
      for (let i = spawner.particles.length - 1; i >= 0; i--) {
        const p = spawner.particles[i];
        p.life += delta;

        // Remove particle if it's expired
        if (p.life >= p.maxLife) {
          p.particle.destroy();
          spawner.particles.splice(i, 1);
          continue;
        }

        const lifeRatio = p.life / p.maxLife;

        // Apply acceleration in the direction of travel
        if (spawner.config.acceleration !== 0) {
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (speed > 0) {
            // Normalize direction and apply acceleration
            const dirX = p.vx / speed;
            const dirY = p.vy / speed;
            p.vx += dirX * spawner.config.acceleration * delta * 60;
            p.vy += dirY * spawner.config.acceleration * delta * 60;
          }
        }

        // Apply gravity (always downward)
        p.vy += spawner.config.gravity * delta * 60;

        // Update position
        p.particle.x += p.vx * delta * 60;
        p.particle.y += p.vy * delta * 60;

        // Update rotation
        p.particle.rotation += p.angularVelocity * delta;

        // Interpolate scale
        const currentScale =
          p.startScale + (p.endScale - p.startScale) * lifeRatio;
        if (typeof p.particle.scale === "object" && "set" in p.particle.scale) {
          p.particle.scale.set(currentScale);
        }

        // Interpolate alpha
        p.particle.alpha =
          p.startAlpha + (p.endAlpha - p.startAlpha) * lifeRatio;

        // Interpolate color (from colorStart to colorEnd)
        const startColor = spawner.config.colorStart;
        const endColor = spawner.config.colorEnd;
        const r = Math.round(
          startColor.r + (endColor.r - startColor.r) * lifeRatio,
        );
        const g = Math.round(
          startColor.g + (endColor.g - startColor.g) * lifeRatio,
        );
        const b = Math.round(
          startColor.b + (endColor.b - startColor.b) * lifeRatio,
        );
        const currentColor = (r << 16) | (g << 8) | b;
        p.particle.tint = currentColor;
      }

      // Spawners are never auto-removed - user must manually delete them via scene explorer
      // This allows users to respawn one-shot effects using the "Respawn Effect" button
    }
  }

  public resize(width: number, height: number): void {
    this.hitArea = {
      x: 0,
      y: 0,
      width,
      height,
      contains: (x: number, y: number) =>
        x >= 0 && x <= width && y >= 0 && y <= height,
    };

    // Spawners remain at their individual positions
    console.log(`📐 Screen resized to: ${width}x${height}`);
  }

  private async loadTexture(textureName: string): Promise<Texture> {
    // Check if already loaded
    if (this.loadedTextures.has(textureName)) {
      return this.loadedTextures.get(textureName)!;
    }

    // Load new texture
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = reject;
      image.src = `/assets/vfx/${textureName}`;
    });

    const texture = Texture.from(image);
    this.loadedTextures.set(textureName, texture);
    console.log(
      `✅ Loaded texture: ${textureName} (${texture.width}x${texture.height})`,
    );
    return texture;
  }

  public async show(): Promise<void> {
    console.log("🎨 Professional Particle Editor loaded!");

    // Dynamically scan all textures from vfx folder
    // For now, we'll use a comprehensive list based on your assets
    this.availableTextures = [
      "white-circle.png",
      "white-ring.png",
      "ball_shadow.png",
      "bar.png",
      "BHD_flame02.png",
      "black_chunks01.png",
      "black_chunks02.png",
      "blackplume.png",
      "blackplume2.png",
      "blacksmoke.png",
      "blast_01_R.png",
      "blast_full_01b.png",
      "blast_puff_02b.png",
      "blast.png",
      "blood_puff.png",
      "Bloodpool01.png",
      "bluelaser.png",
      "bluelightsaber.png",
      "bluelightsaberstreak.png",
      "bolt.png",
      "boom3.png",
      "brownsmoke.png",
      "bulhit.png",
      "CameraBlood.png",
      "CameraDirt.png",
      "center.png",
      "center2.png",
      "center2a.png",
      "chunkbit.png",
      "chunks01.png",
      "chunks02.png",
      "chunkybits.png",
      "colorspread.png",
      "dirt_2.png",
      "dirt_puff_1.png",
      "dirt.png",
      "dirtsmoke.png",
      "dirtspray.png",
      "dust_expl_01.png",
      "dust_expl_02.png",
      "dust_expl_02b.png",
      "expl_puff_1.png",
      "explode_harbinger.png",
      "explode.png",
      "explode2.png",
      "explode3.png",
      "explode4_purple.png",
      "explode4.png",
      "explode5.png",
      "explode6.png",
      "explode7.png",
      "explodeplume.png",
      "fire_puff.png",
      "fire.png",
      "fireburn.png",
      "firepuff.png",
      "firetendril.png",
      "flame_02.png",
      "flame_02b.png",
      "flame_03.png",
      "flame_03a.png",
      "flame.png",
      "flame2.png",
      "flare.png",
      "flare0.png",
      "flare1.png",
      "flare2.png",
      "flare3.png",
      "flare4.png",
      "forceripple.png",
      "fx_b_dust_puff.png",
      "fx_b_dust_puff2.png",
      "graylaser.png",
      "greenlaser.png",
      "greenlightsaber.png",
      "greenlightsaberstreak.png",
      "ground_poof_1.png",
      "gsplat.png",
      "heat.png",
      "HG explosion 01.png",
      "HG explosion 02.png",
      "interlace.png",
      "interlace2.png",
      "lglow.png",
      "light_puff.png",
      "lightblob.png",
      "lightflare.png",
      "lightglow.png",
      "lighthalo.png",
      "lightning.png",
      "lightning2.png",
      "lightning3.png",
      "lightningstart.png",
      "lightsaber.png",
      "MFCrew01.png",
      "muffle_flare_saw_long.png",
      "muzzle_flare_crew01.png",
      "muzzle_flare_crewserve.png",
      "muzzle_flare_crewserve2.png",
      "muzzle_flare_saw_02.png",
      "muzzle_flare_saw.png",
      "muzzle_flare_saw0.png",
      "muzzle_flash_crewserve_side.png",
      "muzzleflash_crewserve_side.png",
      "MuzzleFlash_crewserve3.png",
      "muzzleflash.png",
      "muzzleflash2.png",
      "muzzleflash2b.png",
      "muzzleflash3.png",
      "muzzleflash4.png",
      "particlespray.png",
      "plant_debri.png",
      "plasma.png",
      "playicon.png",
      "plume.png",
      "PS2_star.png",
      "purplelaser.png",
      "purplelightsaber.png",
      "purplelightsaberstreak.png",
      "radial.png",
      "radial2.png",
      "radial3.png",
      "radial4.png",
      "radial5.png",
      "rain.png",
      "raindrop.png",
      "recordicon.png",
      "redlaser.png",
      "ripple.png",
      "ripple2.png",
      "rocket_puff.png",
      "scorch1.png",
      "scorchmark.png",
      "scorchmark1.png",
      "scorchmark2.png",
      "scorchmark3.png",
      "ScorchMarkDetail.png",
      "shine0.png",
      "shine1.png",
      "shine2.png",
      "shine3.png",
      "shine4.png",
      "shine5.png",
      "shine6.png",
      "shine7.png",
      "shine8.png",
      "shine9.png",
      "smoke_bw_02.png",
      "smoke_center_01.png",
      "smoke.png",
      "smoke2.png",
      "smoke3.png",
      "smoke7.png",
      "smokeplume.png",
      "smoketrail_puff.png",
      "smoketrail.png",
      "smoketrail2.png",
      "snowflake.png",
      "spark.png",
      "spark2.png",
      "sparkles.png",
      "Sparks01.png",
      "Sparks02.png",
      "Sparks03.png",
      "Sparks04.png",
      "Sparks05.png",
      "splash_Faded.png",
      "splash_map.png",
      "splash.png",
      "spotlight.png",
      "star.png",
      "static.png",
      "stucco_chunks01.png",
      "stucco_chunks02.png",
      "stucco_chunks03.png",
      "tank_flash.png",
      "teallaser.png",
      "testalpha.png",
    ];

    console.log(
      `📦 Loaded ${this.availableTextures.length} available textures`,
    );

    // Load initial texture
    this.particleTexture = await this.loadTexture(this.config.textureName);

    // Detect texture size for pixel calculations
    this.textureSize = this.particleTexture.width;
    console.log(
      `✅ Texture loaded: ${this.textureSize}x${this.particleTexture.height} pixels`,
    );

    // Setup Scene Explorer (left panel)
    this.setupSceneExplorer();

    // Setup Tweakpane GUI (right panel)
    this.setupTweakpane();

    // Setup mouse wheel zoom
    this.setupZoom();

    this.isReady = true;

    console.log("✅ Editor ready!");
    console.log("  - Click '➕ Add Spawner' to create a particle emitter");
    console.log("  - Use the panel on the right to control particles");
    console.log("  - Select textures from the dropdown");
    console.log("  - Use mouse wheel to zoom in/out");
    console.log("  - Middle mouse button to pan the viewport");
  }

  public async hide(): Promise<void> {
    this.clearParticles();
    this.config.emitting = false;

    // Destroy Tweakpane
    if (this.pane) {
      this.pane.dispose();
      this.pane = undefined;
    }

    // Remove scene explorer panel
    if (this.sceneExplorerPanel) {
      document.body.removeChild(this.sceneExplorerPanel);
      this.sceneExplorerPanel = undefined;
    }
  }

  private async goBack(): Promise<void> {
    await this.hide();
    // Note: You'll need to implement your own navigation logic here
    // or remove this button from the editor
    console.log("Back button clicked - implement your own navigation");
  }

  public destroy(): void {
    this.hide();
    super.destroy();
  }
}
