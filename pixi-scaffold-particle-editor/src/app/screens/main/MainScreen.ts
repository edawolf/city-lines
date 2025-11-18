import { FancyButton } from "@pixi/ui";
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion/react";
import type { Ticker } from "pixi.js";
import { Container, Text } from "pixi.js";

import { engine } from "../../getEngine";
import { PausePopup } from "../../popups/PausePopup";
import { SettingsPopup } from "../../popups/SettingsPopup";
import { Button } from "../../ui/Button";

import { Bouncer } from "./Bouncer";

/** The screen that holds the app */
export class MainScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  public mainContainer: Container;
  private pauseButton: FancyButton;
  private settingsButton: FancyButton;
  private debugButton: FancyButton;
  private particleButton: FancyButton;
  private editorButton: FancyButton;
  private addButton: FancyButton;
  private removeButton: FancyButton;
  private bouncer: Bouncer;
  private paused = false;

  constructor() {
    super();

    this.mainContainer = new Container();
    this.addChild(this.mainContainer);
    this.bouncer = new Bouncer();

    // Add global keyboard shortcuts for debugging
    this.setupDebugKeyboardControls();

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
    this.pauseButton = new FancyButton({
      defaultView: "icon-pause.png",
      anchor: 0.5,
      animations: buttonAnimations,
    });
    this.pauseButton.onPress.connect(() =>
      engine().navigation.presentPopup(PausePopup),
    );
    this.addChild(this.pauseButton);

    this.settingsButton = new FancyButton({
      defaultView: "icon-settings.png",
      anchor: 0.5,
      animations: buttonAnimations,
    });
    this.settingsButton.onPress.connect(() =>
      engine().navigation.presentPopup(SettingsPopup),
    );
    this.addChild(this.settingsButton);

    this.debugButton = new FancyButton({
      defaultView: "icon-settings.png", // Use same icon as settings for now
      anchor: 0.5,
      animations: buttonAnimations,
    });

    // Ensure button is interactive
    this.debugButton.eventMode = "static";
    this.debugButton.cursor = "pointer";

    // Add debug label to make button more identifiable
    const debugLabel = new Text({
      text: "🔧", // Use a tool emoji to distinguish from settings
      style: {
        fontSize: 16,
        fill: 0x000000,
        fontFamily: "Arial, sans-serif",
        fontWeight: "bold",
      },
    });
    debugLabel.anchor.set(0.5);
    debugLabel.x = 12; // Offset slightly to avoid overlap with icon
    this.debugButton.addChild(debugLabel);
    this.debugButton.onPress.connect(async () => {
      console.log("Debug button pressed! Navigating to debug screen...");
      try {
        await this.hide();
        const { DebugScreen } = await import("../DebugScreen");
        await engine().navigation.showScreen(DebugScreen);
        console.log("Successfully navigated to debug screen");
      } catch (error) {
        console.error("Error navigating to debug screen:", error);
      }
    });
    this.addChild(this.debugButton);

    // Particle test button
    this.particleButton = new FancyButton({
      defaultView: "icon-settings.png",
      anchor: 0.5,
      animations: buttonAnimations,
    });

    this.particleButton.eventMode = "static";
    this.particleButton.cursor = "pointer";

    const particleLabel = new Text({
      text: "✨",
      style: {
        fontSize: 16,
        fill: 0x000000,
        fontFamily: "Arial, sans-serif",
        fontWeight: "bold",
      },
    });
    particleLabel.anchor.set(0.5);
    particleLabel.x = 12;
    this.particleButton.addChild(particleLabel);
    this.particleButton.onPress.connect(async () => {
      console.log(
        "Particle button pressed! Navigating to particle test screen...",
      );
      try {
        await this.hide();
        const { ParticleTestScreenV2 } = await import(
          "../ParticleTestScreenV2"
        );
        await engine().navigation.showScreen(ParticleTestScreenV2);
        console.log("Successfully navigated to particle test screen");
      } catch (error) {
        console.error("Error navigating to particle test screen:", error);
      }
    });
    this.addChild(this.particleButton);

    // Particle editor button
    this.editorButton = new FancyButton({
      defaultView: "icon-settings.png",
      anchor: 0.5,
      animations: buttonAnimations,
    });

    this.editorButton.eventMode = "static";
    this.editorButton.cursor = "pointer";

    const editorLabel = new Text({
      text: "🎨",
      style: {
        fontSize: 16,
        fill: 0x000000,
        fontFamily: "Arial, sans-serif",
        fontWeight: "bold",
      },
    });
    editorLabel.anchor.set(0.5);
    editorLabel.x = 12;
    this.editorButton.addChild(editorLabel);
    this.editorButton.onPress.connect(async () => {
      console.log("Editor button pressed! Navigating to particle editor...");
      try {
        await this.hide();
        const { ParticleEditorScreenV3 } = await import(
          "../ParticleEditorScreenV3"
        );
        await engine().navigation.showScreen(ParticleEditorScreenV3);
        console.log("Successfully navigated to particle editor");
      } catch (error) {
        console.error("Error navigating to particle editor:", error);
      }
    });
    this.addChild(this.editorButton);

    // Debug logging to verify button setup
    console.log("Debug button created and added:", {
      visible: this.debugButton.visible,
      interactive: this.debugButton.eventMode,
      position: { x: this.debugButton.x, y: this.debugButton.y },
      size: { width: this.debugButton.width, height: this.debugButton.height },
    });

    this.addButton = new Button({
      text: "Add",
      width: 175,
      height: 110,
    });
    this.addButton.onPress.connect(() => this.bouncer.add());
    this.addChild(this.addButton);

    this.removeButton = new Button({
      text: "Remove",
      width: 175,
      height: 110,
    });
    this.removeButton.onPress.connect(() => this.bouncer.remove());
    this.addChild(this.removeButton);
  }

  /** Prepare the screen just before showing */
  public prepare() {}

  /** Update the screen */

  public update(_time: Ticker) {
    if (this.paused) return;
    this.bouncer.update();
  }

  /** Pause gameplay - automatically fired when a popup is presented */
  public async pause() {
    this.mainContainer.interactiveChildren = false;
    this.paused = true;
  }

  /** Resume gameplay */
  public async resume() {
    this.mainContainer.interactiveChildren = true;
    this.paused = false;
  }

  /** Fully reset */
  public reset() {}

  /** Resize the screen, fired whenever window size changes */
  public resize(width: number, height: number) {
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    this.mainContainer.x = centerX;
    this.mainContainer.y = centerY;
    this.pauseButton.x = 30;
    this.pauseButton.y = 30;
    this.settingsButton.x = width - 30;
    this.settingsButton.y = 30;
    this.debugButton.x = width - 30;
    this.debugButton.y = 90;
    this.particleButton.x = width - 30;
    this.particleButton.y = 150;
    this.editorButton.x = width - 30;
    this.editorButton.y = 210;
    this.removeButton.x = width / 2 - 100;
    this.removeButton.y = height - 75;
    this.addButton.x = width / 2 + 100;
    this.addButton.y = height - 75;

    this.bouncer.resize(width, height);
  }

  /** Show screen with animations */
  public async show(): Promise<void> {
    engine().audio.bgm.play("main/sounds/bgm-main.mp3", { volume: 0.5 });

    const elementsToAnimate = [
      this.pauseButton,
      this.settingsButton,
      this.debugButton,
      this.particleButton,
      this.editorButton,
      this.addButton,
      this.removeButton,
    ];

    let finalPromise!: AnimationPlaybackControls;
    for (const element of elementsToAnimate) {
      element.alpha = 0;
      finalPromise = animate(
        element,
        { alpha: 1 },
        { duration: 0.3, delay: 0.75, ease: "backOut" },
      );
    }

    await finalPromise;
    this.bouncer.show(this);
  }

  /** Hide screen with animations */
  public async hide() {}

  /** Auto pause the app when window go out of focus */
  public blur() {
    if (!engine().navigation.currentPopup) {
      engine().navigation.presentPopup(PausePopup);
    }
  }

  /** Setup debug keyboard controls */
  private setupDebugKeyboardControls(): void {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case "p":
          // Poll MainScreen layout from anywhere
          console.log("=== POLLING MAIN SCREEN LAYOUT (Global) ===");
          this.pollCurrentLayout();
          break;
        case "i":
          // Show element info
          console.log("=== MAIN SCREEN ELEMENT INFO ===");
          this.logElementPositions();
          break;
        case "d":
          // Debug shortcut - same as debug button
          console.log(
            "Debug keyboard shortcut pressed! Navigating to debug screen...",
          );
          this.debugButton.onPress.emit();
          break;
      }
    };

    // Add global keyboard event listener
    document.addEventListener("keydown", handleKeyPress);

    // Store reference for cleanup
    (this as any).debugKeyHandler = handleKeyPress;
  }

  /** Poll and log current layout information */
  private pollCurrentLayout(): void {
    try {
      const elements: any[] = [];
      this.traverseElements(this, elements, "main-screen");

      const lines: string[] = [];
      lines.push("=== MAIN SCREEN LAYOUT ANALYSIS ===");
      lines.push(
        `Screen: ${engine().renderer.width}x${engine().renderer.height}`,
      );
      lines.push(`Total Elements: ${elements.length}`);
      lines.push("");

      // Group by visibility and screen position
      const onScreen = elements.filter((e) => !e.isOffScreen);
      const offScreen = elements.filter((e) => e.isOffScreen);

      if (offScreen.length > 0) {
        lines.push("⚠️  OFF-SCREEN ELEMENTS:");
        offScreen.forEach((element) => {
          lines.push(`  - ${element.name}:`);
          lines.push(
            `    Local: (${element.localPosition.x.toFixed(1)}, ${element.localPosition.y.toFixed(1)})`,
          );
          lines.push(
            `    Global: (${element.globalPosition.x.toFixed(1)}, ${element.globalPosition.y.toFixed(1)})`,
          );
          lines.push(
            `    Bounds: ${element.bounds.width.toFixed(1)}x${element.bounds.height.toFixed(1)}`,
          );
          lines.push(`    Expected: ${element.expectedPosition}`);
          lines.push("");
        });
      }

      lines.push("✅ ON-SCREEN ELEMENTS:");
      onScreen.forEach((element) => {
        lines.push(`  - ${element.name}:`);
        lines.push(
          `    Local: (${element.localPosition.x.toFixed(1)}, ${element.localPosition.y.toFixed(1)})`,
        );
        lines.push(
          `    Global: (${element.globalPosition.x.toFixed(1)}, ${element.globalPosition.y.toFixed(1)})`,
        );
        lines.push(
          `    Size: ${element.bounds.width.toFixed(1)}x${element.bounds.height.toFixed(1)}`,
        );
        if (element.anchor) {
          lines.push(`    Anchor: (${element.anchor.x}, ${element.anchor.y})`);
        }
        lines.push("");
      });

      console.log(lines.join("\n"));
    } catch (error) {
      console.error("Error polling layout:", error);
    }
  }

  /** Traverse elements and collect position info */
  private traverseElements(
    container: Container,
    elements: any[],
    containerName: string,
  ): void {
    container.children.forEach((child, index) => {
      if (child instanceof Container) {
        const globalPos = child.toGlobal({ x: 0, y: 0 });
        const bounds = child.getBounds();

        let elementName = this.identifyElement(child, containerName, index);
        let expectedPosition = "";

        // Identify specific MainScreen elements
        if (child === this.pauseButton) {
          elementName = "Pause Button";
          expectedPosition = "top-left (30,30)";
        } else if (child === this.settingsButton) {
          elementName = "Settings Button";
          expectedPosition = `top-right (${engine().renderer.width - 30},30)`;
        } else if (child === this.debugButton) {
          elementName = "Debug Button";
          expectedPosition = `top-right-below (${engine().renderer.width - 30},90)`;
        } else if (child === this.addButton) {
          elementName = "Add Button";
          expectedPosition = `bottom-center-right (${engine().renderer.width / 2 + 100},${engine().renderer.height - 75})`;
        } else if (child === this.removeButton) {
          elementName = "Remove Button";
          expectedPosition = `bottom-center-left (${engine().renderer.width / 2 - 100},${engine().renderer.height - 75})`;
        }

        const elementInfo = {
          name: elementName,
          localPosition: { x: child.x, y: child.y },
          globalPosition: { x: globalPos.x, y: globalPos.y },
          bounds: {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
          },
          anchor: this.getElementAnchor(child),
          isOffScreen: this.isElementOffScreen(bounds),
          expectedPosition,
        };

        elements.push(elementInfo);

        // Recursively check children
        if (child.children.length > 0) {
          this.traverseElements(child, elements, elementName);
        }
      }
    });
  }

  /** Identify element by its properties */
  private identifyElement(
    element: Container,
    containerName: string,
    index: number,
  ): string {
    // Try to get name from text content
    const textChild = element.children.find(
      (child) => child instanceof Text,
    ) as Text;
    if (textChild && textChild.text) {
      return `${textChild.text}`;
    }

    // Identify by constructor name
    if (element.constructor.name !== "Container") {
      return `${element.constructor.name}-${index}`;
    }

    return `${containerName}-child-${index}`;
  }

  /** Get anchor information if available */
  private getElementAnchor(
    element: Container,
  ): { x: number; y: number } | null {
    if ("anchor" in element && element.anchor) {
      return { x: (element.anchor as any).x, y: (element.anchor as any).y };
    }
    return null;
  }

  /** Check if element is off-screen */
  private isElementOffScreen(bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): boolean {
    const screenWidth = engine().renderer.width;
    const screenHeight = engine().renderer.height;

    return (
      bounds.x + bounds.width < 0 ||
      bounds.x > screenWidth ||
      bounds.y + bounds.height < 0 ||
      bounds.y > screenHeight
    );
  }

  /** Log basic element positions for debugging */
  private logElementPositions(): void {
    console.log("=== MAIN SCREEN BUTTON POSITIONS ===");
    console.log(
      `Screen size: ${engine().renderer.width}x${engine().renderer.height}`,
    );
    console.log(
      `Pause Button: (${this.pauseButton.x}, ${this.pauseButton.y}) - visible: ${this.pauseButton.visible}`,
    );
    console.log(
      `Settings Button: (${this.settingsButton.x}, ${this.settingsButton.y}) - visible: ${this.settingsButton.visible}`,
    );
    console.log(
      `Debug Button: (${this.debugButton.x}, ${this.debugButton.y}) - visible: ${this.debugButton.visible}`,
    );
    console.log(
      `Add Button: (${this.addButton.x}, ${this.addButton.y}) - visible: ${this.addButton.visible}`,
    );
    console.log(
      `Remove Button: (${this.removeButton.x}, ${this.removeButton.y}) - visible: ${this.removeButton.visible}`,
    );

    // Check if buttons are actually added to the stage
    console.log("Button hierarchy:");
    console.log(
      `- Pause Button parent: ${this.pauseButton.parent?.constructor.name}`,
    );
    console.log(
      `- Settings Button parent: ${this.settingsButton.parent?.constructor.name}`,
    );
    console.log(
      `- Debug Button parent: ${this.debugButton.parent?.constructor.name}`,
    );
    console.log(
      `- Add Button parent: ${this.addButton.parent?.constructor.name}`,
    );
    console.log(
      `- Remove Button parent: ${this.removeButton.parent?.constructor.name}`,
    );
  }

  /** Cleanup debug handlers */
  public destroy(): void {
    // Remove debug keyboard event listener
    if ((this as any).debugKeyHandler) {
      document.removeEventListener("keydown", (this as any).debugKeyHandler);
    }
    super.destroy();
  }
}
