import { FancyButton } from "@pixi/ui";
import { animate } from "motion";
import type { Ticker } from "pixi.js";
import { Container, Graphics, Text } from "pixi.js";

import { engine } from "../getEngine";
import { ResponsiveDebugTest } from "../debug/ResponsiveDebugTest";

/**
 * Debug Screen for testing responsive layout and positioning systems
 * This screen provides comprehensive testing for PixiJS layout capabilities
 */
export class DebugScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  private debugTest!: ResponsiveDebugTest;
  private controlPanel!: Container;
  private toggleGridButton!: FancyButton;
  private backButton!: FancyButton;
  private testInfoDisplay!: Text;
  private resizeEventDisplay!: Text;
  private isGridVisible = true;
  private resizeEventCount = 0;

  constructor() {
    super();
    this.setupKeyboardControls();
    // Debug interface will be created in prepare() method
  }

  private createDebugInterface(): void {
    // Create the main debug test system
    this.debugTest = new ResponsiveDebugTest();
    this.debugTest.initializeTests();
    this.addChild(this.debugTest);

    // Create control panel
    this.controlPanel = new Container();
    this.addChild(this.controlPanel);

    // Create control panel background
    const panelBg = new Graphics()
      .roundRect(0, 0, 300, 200, 10)
      .fill({ color: 0x2c3e50, alpha: 0.9 })
      .stroke({ width: 2, color: 0x34495e });
    this.controlPanel.addChild(panelBg);

    // Create buttons
    this.createControlButtons();

    // Create info displays
    this.createInfoDisplays();
  }

  private createControlButtons(): void {
    const buttonAnimations = {
      hover: {
        props: { scale: { x: 1.05, y: 1.05 } },
        duration: 100,
      },
      pressed: {
        props: { scale: { x: 0.95, y: 0.95 } },
        duration: 100,
      },
    };

    // Toggle Grid Button
    this.toggleGridButton = new FancyButton({
      defaultView: this.createButtonGraphics(120, 40, 0x3498db, "Toggle Grid"),
      hoverView: this.createButtonGraphics(120, 40, 0x2980b9, "Toggle Grid"),
      pressedView: this.createButtonGraphics(120, 40, 0x1f618d, "Toggle Grid"),
      animations: buttonAnimations,
    });

    this.toggleGridButton.onPress.connect(() => {
      this.isGridVisible = !this.isGridVisible;
      this.debugTest.toggleDebugInfo();
      console.log(`Debug grid ${this.isGridVisible ? "enabled" : "disabled"}`);
    });

    // Back Button
    this.backButton = new FancyButton({
      defaultView: this.createButtonGraphics(120, 40, 0xe74c3c, "Back to Main"),
      hoverView: this.createButtonGraphics(120, 40, 0xc0392b, "Back to Main"),
      pressedView: this.createButtonGraphics(120, 40, 0xa93226, "Back to Main"),
      animations: buttonAnimations,
    });

    this.backButton.onPress.connect(async () => {
      await this.hide();
      // Navigate back to main screen
      const { MainScreen } = await import("./main/MainScreen");
      await engine().navigation.showScreen(MainScreen);
    });

    // Position buttons
    this.toggleGridButton.x = 20;
    this.toggleGridButton.y = 20;
    this.backButton.x = 160;
    this.backButton.y = 20;

    this.controlPanel.addChild(this.toggleGridButton, this.backButton);
  }

  private createInfoDisplays(): void {
    // Test info display
    this.testInfoDisplay = new Text({
      text: "Loading debug tests...",
      style: {
        fontSize: 12,
        fill: 0xffffff,
        fontFamily: "Arial, sans-serif",
        wordWrap: true,
        wordWrapWidth: 280,
      },
    });
    this.testInfoDisplay.x = 10;
    this.testInfoDisplay.y = 80;
    this.controlPanel.addChild(this.testInfoDisplay);

    // Resize event display
    this.resizeEventDisplay = new Text({
      text: "Resize events: 0",
      style: {
        fontSize: 12,
        fill: 0xf39c12,
        fontFamily: "Arial, sans-serif",
      },
    });
    this.resizeEventDisplay.x = 10;
    this.resizeEventDisplay.y = 160;
    this.controlPanel.addChild(this.resizeEventDisplay);

    // Instructions text
    const instructions = new Text({
      text: [
        "CONTROLS:",
        "• G - Toggle debug grid",
        "• R - Print debug test results",
        "• P - Poll MainScreen layout",
        "• L - Poll debug layout",
        "• T - Toggle layout system (auto-disables AI)",
        "• I - Toggle AI intelligence (auto-disables T)",
        "• A - AI analysis report",
        "• X - Execute AI corrections (only 9 anchors)",
        "• ESC - Return to main",
        "",
        "LAYOUT POLLING:",
        "• P key polls MainScreen elements",
        "• Shows off-screen elements",
        "• Reports actual positions",
        "• Compares with expected positions",
        "",
        "TESTS:",
        "• Anchor point validation",
        "• Corner/edge alignment",
        "• Center positioning",
        "• Layout system integration",
        "• UI component responsiveness",
      ].join("\n"),
      style: {
        fontSize: 10,
        fill: 0xbdc3c7,
        fontFamily: "Arial, sans-serif",
        lineHeight: 14,
      },
    });
    instructions.x = 10;
    instructions.y = 180;
    this.controlPanel.addChild(instructions);
  }

  private createButtonGraphics(
    width: number,
    height: number,
    color: number,
    text: string,
  ): Container {
    const button = new Container();

    const bg = new Graphics()
      .roundRect(0, 0, width, height, 5)
      .fill({ color, alpha: 0.9 });

    const label = new Text({
      text,
      style: {
        fontSize: 12,
        fill: 0xffffff,
        fontFamily: "Arial, sans-serif",
        fontWeight: "bold",
      },
    });

    label.anchor.set(0.5);
    label.x = width / 2;
    label.y = height / 2;

    button.addChild(bg, label);
    return button;
  }

  private setupKeyboardControls(): void {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case "g":
          this.debugTest.toggleDebugInfo();
          this.isGridVisible = !this.isGridVisible;
          break;
        case "r":
          console.log(this.debugTest.getTestResults());
          break;
        case "p":
          // Poll MainScreen layout
          console.log("=== POLLING MAIN SCREEN LAYOUT ===");
          console.log(this.pollMainScreenLayout());
          break;
        case "l":
          // Poll current debug screen layout
          console.log("=== POLLING DEBUG SCREEN LAYOUT ===");
          console.log(this.debugTest.getLayoutReport());
          break;
        case "t":
          // Toggle layout system
          console.log("=== TOGGLING LAYOUT SYSTEM ===");
          this.debugTest.toggleLayoutSystem();
          break;
        case "i":
          // Toggle intelligence system
          console.log("=== TOGGLING AI INTELLIGENCE ===");
          this.debugTest.toggleIntelligenceSystem();
          break;
        case "a":
          // Get AI analysis report
          console.log("=== AI INTELLIGENCE REPORT ===");
          console.log(this.debugTest.getIntelligenceReport());
          break;
        case "x":
          // Execute AI corrections
          console.log("=== EXECUTING AI CORRECTIONS ===");
          console.log(this.debugTest.executeAICorrections());
          break;
        case "escape":
          this.backButton.onPress.emit();
          break;
      }
    };

    // Add keyboard event listener
    document.addEventListener("keydown", handleKeyPress);

    // Store reference for cleanup
    (this as any).keyHandler = handleKeyPress;
  }

  /** Prepare the screen just before showing */
  public prepare(): void {
    // Create debug interface if not already created
    if (!this.debugTest) {
      this.createDebugInterface();
    }

    // Update test info display
    this.updateTestInfo();
  }

  /** Update the screen */
  public update(_time: Ticker): void {
    // Debug screens typically don't need constant updates
    // but this can be used for real-time testing if needed
  }

  /** Pause gameplay - automatically fired when a popup is presented */
  public async pause(): Promise<void> {
    // Disable interactions during pause
    this.controlPanel.interactiveChildren = false;
  }

  /** Resume gameplay */
  public async resume(): Promise<void> {
    // Re-enable interactions
    this.controlPanel.interactiveChildren = true;
  }

  /** Fully reset */
  public reset(): void {
    this.resizeEventCount = 0;
    this.updateResizeInfo();
  }

  /** Resize the screen, fired whenever window size changes */
  public resize(width: number, height: number): void {
    // Update resize event counter
    this.resizeEventCount++;
    this.updateResizeInfo();

    // Resize the debug test system
    this.debugTest.resize(width, height);

    // Position control panel
    this.controlPanel.x = width - 320;
    this.controlPanel.y = 20;

    // Update test info
    this.updateTestInfo();

    console.log(
      `DebugScreen resized to: ${width}x${height} (Event #${this.resizeEventCount})`,
    );

    // Automatically poll MainScreen layout on resize for debugging
    console.log("=== AUTO-POLLING MAIN SCREEN LAYOUT ON RESIZE ===");
    console.log(this.pollMainScreenLayout());
  }

  private updateTestInfo(): void {
    const info = [
      "RESPONSIVE DEBUG ACTIVE",
      "",
      `Screen: ${engine().renderer.width}x${engine().renderer.height}`,
      `Aspect: ${(engine().renderer.width / engine().renderer.height).toFixed(2)}`,
      `DPR: ${window.devicePixelRatio?.toFixed(2) || "N/A"}`,
      `Orientation: ${engine().renderer.width > engine().renderer.height ? "Landscape" : "Portrait"}`,
      "",
      "All positioning tests are active.",
      "Resize window to see responsive behavior.",
    ].join("\n");

    this.testInfoDisplay.text = info;
  }

  private updateResizeInfo(): void {
    this.resizeEventDisplay.text = `Resize events: ${this.resizeEventCount}`;
  }

  /**
   * Poll the actual MainScreen elements for layout debugging
   */
  public pollMainScreenLayout(): string {
    try {
      // Get the main screen from navigation if available
      const navigation = engine().navigation;
      const currentScreen = navigation.currentScreen;

      if (!currentScreen) {
        return "No current screen available for polling";
      }

      const elements: any[] = [];
      this.traverseScreenElements(currentScreen, elements, "main-screen");

      const lines: string[] = [];
      lines.push("=== MAIN SCREEN LAYOUT ANALYSIS ===");
      lines.push(
        `Screen: ${engine().renderer.width}x${engine().renderer.height}`,
      );
      lines.push(`Current Screen: ${currentScreen.constructor.name}`);
      lines.push(`Total Elements Found: ${elements.length}`);
      lines.push("");

      // Group by off-screen status
      const onScreen = elements.filter((e) => !e.isOffScreen);
      const offScreen = elements.filter((e) => e.isOffScreen);

      if (offScreen.length > 0) {
        lines.push("⚠️  OFF-SCREEN ELEMENTS:");
        offScreen.forEach((element) => {
          lines.push(
            `  - ${element.name}: global(${element.globalPosition.x.toFixed(1)}, ${element.globalPosition.y.toFixed(1)})`,
          );
          lines.push(
            `    Expected at: ${element.expectedPosition || "unknown"}`,
          );
        });
        lines.push("");
      }

      lines.push("✅ ON-SCREEN ELEMENTS:");
      onScreen.forEach((element) => {
        lines.push(`  - ${element.name}:`);
        lines.push(
          `    Global: (${element.globalPosition.x.toFixed(1)}, ${element.globalPosition.y.toFixed(1)})`,
        );
        lines.push(
          `    Local: (${element.localPosition.x.toFixed(1)}, ${element.localPosition.y.toFixed(1)})`,
        );
        lines.push(
          `    Size: ${element.bounds.width.toFixed(1)}x${element.bounds.height.toFixed(1)}`,
        );
        if (element.anchor) {
          lines.push(`    Anchor: (${element.anchor.x}, ${element.anchor.y})`);
        }
        lines.push("");
      });

      return lines.join("\n");
    } catch (error) {
      return `Error polling layout: ${error}`;
    }
  }

  /**
   * Traverse screen elements and collect position info
   */
  private traverseScreenElements(
    container: Container,
    elements: any[],
    containerName: string,
  ): void {
    container.children.forEach((child, index) => {
      if (child instanceof Container) {
        const globalPos = child.toGlobal({ x: 0, y: 0 });
        const bounds = child.getBounds();

        // Try to identify the element
        let elementName = this.identifyElement(child, containerName, index);
        let expectedPosition = "";

        // Special identification for MainScreen elements
        if (containerName === "main-screen") {
          if (child.constructor.name === "FancyButton") {
            // Check button positions to identify them
            if (Math.abs(child.x - 30) < 5 && Math.abs(child.y - 30) < 5) {
              elementName = "Pause Button";
              expectedPosition = "top-left (30,30)";
            } else if (
              Math.abs(child.x - (engine().renderer.width - 30)) < 5 &&
              Math.abs(child.y - 30) < 5
            ) {
              elementName = "Settings Button";
              expectedPosition = `top-right (${engine().renderer.width - 30},30)`;
            } else if (
              Math.abs(child.x - (engine().renderer.width - 30)) < 5 &&
              Math.abs(child.y - 90) < 5
            ) {
              elementName = "Debug Button";
              expectedPosition = `top-right-below (${engine().renderer.width - 30},90)`;
            }
          } else if (child.constructor.name === "Button") {
            if (child.x < engine().renderer.width / 2) {
              elementName = "Remove Button";
            } else {
              elementName = "Add Button";
            }
          }
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
          isOffScreen: this.isOffScreen(bounds),
          expectedPosition,
        };

        elements.push(elementInfo);

        // Recursively check children
        if (child.children.length > 0) {
          this.traverseScreenElements(child, elements, elementName);
        }
      }
    });
  }

  /**
   * Identify element by its properties
   */
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

  /**
   * Get anchor information if available
   */
  private getElementAnchor(
    element: Container,
  ): { x: number; y: number } | null {
    if ("anchor" in element && element.anchor) {
      return { x: (element.anchor as any).x, y: (element.anchor as any).y };
    }
    return null;
  }

  /**
   * Check if element is off-screen
   */
  private isOffScreen(bounds: {
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

  /** Show screen with animations */
  public async show(): Promise<void> {
    console.log("=== STARTING RESPONSIVE DEBUG SCREEN ===");
    console.log(this.debugTest.getTestResults());

    // Animate control panel entrance
    this.controlPanel.alpha = 0;
    this.controlPanel.scale.set(0.8);

    const animation = animate(
      this.controlPanel,
      {
        alpha: 1,
      },
      { duration: 0.5, ease: "backOut" },
    );

    // Manually set scale since motion animate has issues with PixiJS scale
    animate(
      this.controlPanel.scale,
      { x: 1, y: 1 },
      { duration: 0.5, ease: "backOut" },
    );

    await animation;

    // Show initial test info
    this.updateTestInfo();
  }

  /** Hide screen with animations */
  public async hide(): Promise<void> {
    console.log("=== ENDING RESPONSIVE DEBUG SCREEN ===");
    console.log(`Final resize event count: ${this.resizeEventCount}`);

    // Animate control panel exit
    const animation = animate(
      this.controlPanel,
      {
        alpha: 0,
      },
      { duration: 0.3, ease: "easeIn" },
    );

    // Manually animate scale
    animate(
      this.controlPanel.scale,
      { x: 0.8, y: 0.8 },
      { duration: 0.3, ease: "easeIn" },
    );

    await animation;
  }

  /** Auto pause the app when window goes out of focus */
  public blur(): void {
    console.log("Debug screen lost focus");
  }

  /** Cleanup when screen is destroyed */
  public destroy(): void {
    // Remove keyboard event listener
    if ((this as any).keyHandler) {
      document.removeEventListener("keydown", (this as any).keyHandler);
    }

    // Destroy debug test system
    this.debugTest.destroy();

    super.destroy();
    console.log("DebugScreen destroyed and cleaned up");
  }
}
