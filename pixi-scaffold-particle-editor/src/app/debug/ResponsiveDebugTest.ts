import { Container, Graphics, Text } from "pixi.js";
import { FancyButton, Slider } from "@pixi/ui";
import { LayoutIntentCompiler } from "../layout/LayoutIntent";
import { IntentLibrary } from "../layout/IntentLibrary";
import { LayoutIntelligenceSystem } from "../layout/LayoutIntelligence";
import { ElementAgentFactory } from "../layout/ElementAgentFactory";
import { LayoutExecutor } from "../layout/LayoutExecutor";

// Layout analysis interfaces
interface ElementInfo {
  name: string;
  localPosition: { x: number; y: number };
  globalPosition: { x: number; y: number };
  bounds: { x: number; y: number; width: number; height: number };
  scale: { x: number; y: number };
  rotation: number;
  visible: boolean;
  alpha: number;
  anchor: { x: number; y: number } | null;
  testData: any;
  isOffScreen: boolean;
  distanceFromEdges: EdgeDistances;
}

interface EdgeDistances {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface LayoutInfo {
  screenDimensions: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  elements: ElementInfo[];
  timestamp: number;
  totalElements: number;
}

/**
 * Comprehensive responsive debug test system for PixiJS applications.
 * Tests positioning, anchoring, scaling, and layout systems across different screen sizes.
 */
export class ResponsiveDebugTest extends Container {
  private debugGraphics!: Graphics;
  private debugInfo!: Text;
  private testElements: Container[] = [];
  private layoutTests!: Container;
  private currentWidth = 0;
  private currentHeight = 0;
  private showDebugInfo = true;
  private gridSize = 50;

  // Intent-based layout system
  private layoutEngine = new LayoutIntentCompiler();
  private useIntentLayout = true;

  // AI-based layout intelligence system
  private intelligence = new LayoutIntelligenceSystem();
  private agentFactory = new ElementAgentFactory(this.intelligence);
  private executor = new LayoutExecutor(this.intelligence);
  private useIntelligence = true;

  // Element registry for AI access
  private elementRegistry = new Map<string, Container>();

  // Test colors for visual differentiation
  private colors = {
    primary: 0x3498db, // Blue
    secondary: 0xe74c3c, // Red
    success: 0x2ecc71, // Green
    warning: 0xf39c12, // Orange
    info: 0x9b59b6, // Purple
    grid: 0x34495e, // Dark gray
    text: 0xffffff, // White
    background: 0x2c3e50, // Dark blue-gray
  };

  constructor() {
    super();
    this.initializeDebugSystem();
    // Note: Call initializeTests() separately after construction
  }

  private initializeDebugSystem(): void {
    // Create debug graphics layer
    this.debugGraphics = new Graphics();
    this.addChild(this.debugGraphics);

    // Create layout test container with z-index sorting enabled
    this.layoutTests = new Container();
    this.layoutTests.sortableChildren = true; // Enable z-index sorting
    this.addChild(this.layoutTests);

    // Create debug info display
    this.debugInfo = new Text({
      text: "Debug Info Loading...",
      style: {
        fontSize: 14,
        fill: this.colors.text,
        fontFamily: "Arial, sans-serif",
      },
    });
    this.addChild(this.debugInfo);
  }

  /**
   * Initialize all tests (call this after construction)
   */
  public initializeTests(): void {
    this.createAllTests();
  }

  private createAllTests(): void {
    console.log("=== STARTING RESPONSIVE DEBUG TESTS ===");

    // Core positioning tests
    this.createAnchorPointTests();
    this.createCornerAlignmentTests();
    this.createCenterAlignmentTests();
    this.createEdgeAlignmentTests();

    // Layout system tests
    this.createPixiLayoutTests();
    this.createPixiUITests();
    this.createFlexboxTests();

    // Responsive behavior tests
    this.createProportionalTests();
    this.createScalingTests();
    this.createViewportTests();

    // Interactive tests
    this.createInteractionTests();
  }

  /**
   * Test 1: Anchor Point Validation
   * Verifies different anchor points work correctly across screen sizes
   */
  private createAnchorPointTests(): void {
    console.log("🎯 Creating anchor point tests with intent-based layout...");

    const anchorPoints = [
      {
        x: 0,
        y: 0,
        label: "TL (0,0)",
        color: this.colors.primary,
        intent: "top-left",
      },
      {
        x: 0.5,
        y: 0,
        label: "TC (0.5,0)",
        color: this.colors.secondary,
        intent: "top",
      },
      {
        x: 1,
        y: 0,
        label: "TR (1,0)",
        color: this.colors.success,
        intent: "top-right",
      },
      {
        x: 0,
        y: 0.5,
        label: "ML (0,0.5)",
        color: this.colors.warning,
        intent: "left",
      },
      {
        x: 0.5,
        y: 0.5,
        label: "C (0.5,0.5)",
        color: this.colors.info,
        intent: "center",
      },
      {
        x: 1,
        y: 0.5,
        label: "MR (1,0.5)",
        color: this.colors.primary,
        intent: "right",
      },
      {
        x: 0,
        y: 1,
        label: "BL (0,1)",
        color: this.colors.secondary,
        intent: "bottom-left",
      },
      {
        x: 0.5,
        y: 1,
        label: "BC (0.5,1)",
        color: this.colors.success,
        intent: "bottom",
      },
      {
        x: 1,
        y: 1,
        label: "BR (1,1)",
        color: this.colors.warning,
        intent: "bottom-right",
      },
    ];

    anchorPoints.forEach((anchor) => {
      const testElement = this.createTestElement({
        width: 60,
        height: 40,
        color: anchor.color,
        label: anchor.label,
        anchor: { x: anchor.x, y: anchor.y },
        data: { anchorPoint: anchor },
      });

      // Register with intent-based layout
      if (this.useIntentLayout) {
        this.layoutEngine.register(
          `anchor-${anchor.label}`,
          testElement,
          IntentLibrary.fromDescription(
            `I want this anchor test to be clearly visible in the ${anchor.intent} area without overlapping other elements`,
          ),
        );
      }

      // Register with AI intelligence system (ONLY the intent layout, not createTestElement)
      if (this.useIntelligence && !this.useIntentLayout) {
        const elementId = `anchor-${anchor.label}`;
        this.elementRegistry.set(elementId, testElement);
        this.agentFactory.autoRegister(elementId, testElement, {
          purpose: "debug test element",
          interactivity: ["hover"],
          priority: "normal",
          grouping: "anchor-tests",
          metadata: { anchorPoint: anchor, testType: "anchor-validation" },
        });
      }

      this.layoutTests.addChild(testElement);
      this.testElements.push(testElement);
    });
  }

  /**
   * Test 2: Corner Alignment Tests
   * Ensures elements stay properly positioned in screen corners
   */
  private createCornerAlignmentTests(): void {
    const cornerTests = new Container();
    this.layoutTests.addChild(cornerTests);

    const corners = [
      {
        name: "TL Corner",
        offset: { x: 60, y: 60 },
        color: this.colors.primary,
      },
      {
        name: "TR Corner",
        offset: { x: -60, y: 60 },
        color: this.colors.secondary,
      },
      {
        name: "BL Corner",
        offset: { x: 60, y: -60 },
        color: this.colors.success,
      },
      {
        name: "BR Corner",
        offset: { x: -60, y: -60 },
        color: this.colors.warning,
      },
    ];

    corners.forEach((corner) => {
      const element = this.createTestElement({
        width: 80,
        height: 60,
        color: corner.color,
        label: corner.name,
        data: { cornerTest: true, offset: corner.offset },
      });

      cornerTests.addChild(element);
      this.testElements.push(element);
    });
  }

  /**
   * Test 3: Center Alignment Tests
   * Validates perfect centering across different screen ratios
   */
  private createCenterAlignmentTests(): void {
    const centerTest = this.createTestElement({
      width: 120,
      height: 80,
      color: this.colors.info,
      label: "CENTER",
      anchor: { x: 0.5, y: 0.5 },
      data: { centerTest: true },
    });

    // Add crosshairs for precise center validation
    const crosshairs = new Graphics();
    crosshairs.setStrokeStyle({
      width: 2,
      color: this.colors.text,
      alpha: 0.7,
    });
    crosshairs.moveTo(-60, 0).lineTo(60, 0);
    crosshairs.moveTo(0, -40).lineTo(0, 40);
    crosshairs.stroke();

    centerTest.addChild(crosshairs);
    this.layoutTests.addChild(centerTest);
    this.testElements.push(centerTest);
  }

  /**
   * Test 4: Edge Alignment Tests
   * Tests positioning along screen edges
   */
  private createEdgeAlignmentTests(): void {
    const edgeTests = new Container();
    this.layoutTests.addChild(edgeTests);

    const edges = [
      { name: "Top Edge", color: this.colors.primary, data: { edge: "top" } },
      {
        name: "Right Edge",
        color: this.colors.secondary,
        data: { edge: "right" },
      },
      {
        name: "Bottom Edge",
        color: this.colors.success,
        data: { edge: "bottom" },
      },
      { name: "Left Edge", color: this.colors.warning, data: { edge: "left" } },
    ];

    edges.forEach((edge) => {
      const element = this.createTestElement({
        width: 100,
        height: 30,
        color: edge.color,
        label: edge.name,
        anchor: { x: 0.5, y: 0.5 },
        data: edge.data,
      });

      edgeTests.addChild(element);
      this.testElements.push(element);
    });
  }

  /**
   * Test 5: Layout System Tests (Using Fallback Implementation)
   * Tests manual layout positioning that simulates flexbox behavior
   */
  private createPixiLayoutTests(): void {
    const layoutContainer = new Container();
    this.layoutTests.addChild(layoutContainer);

    console.log(
      "Using fallback layout implementation (no @pixi/layout dependency)",
    );
    this.createFallbackFlexboxTest(layoutContainer);
  }

  /**
   * Fallback flexbox test when @pixi/layout is not available
   */
  private createFallbackFlexboxTest(container: Container): void {
    const flexContainer = new Container();

    // Create background
    const bg = new Graphics()
      .roundRect(0, 0, 350, 100, 10)
      .fill({ color: this.colors.background, alpha: 0.8 });
    flexContainer.addChild(bg);

    // Simulate flexbox behavior with manual positioning
    const itemWidth = 80;
    const itemHeight = 60;
    const gap = 15; // Increased gap
    const padding = 25; // Increased padding

    for (let i = 0; i < 3; i++) {
      const flexItem = this.createTestElement({
        width: itemWidth,
        height: itemHeight,
        color: [
          this.colors.primary,
          this.colors.secondary,
          this.colors.success,
        ][i],
        label: `Flex ${i + 1}`,
        data: { fallbackFlex: true, index: i },
      });

      // Manual flexbox positioning with better spacing
      flexItem.x = padding + i * (itemWidth + gap);
      flexItem.y = padding;

      flexContainer.addChild(flexItem);
    }

    // Position the flex container away from other elements
    flexContainer.x = 100; // Offset from left edge
    flexContainer.y = 200; // Offset from top edge

    container.addChild(flexContainer);
    this.testElements.push(flexContainer);
  }

  /**
   * Test 6: PixiJS UI Component Tests
   * Tests @pixi/ui components responsiveness
   */
  private createPixiUITests(): void {
    const uiContainer = new Container();
    this.layoutTests.addChild(uiContainer);

    // Create responsive button
    const responsiveButton = new FancyButton({
      defaultView: this.createButtonGraphics(150, 50, this.colors.primary),
      hoverView: this.createButtonGraphics(150, 50, this.colors.secondary),
      pressedView: this.createButtonGraphics(150, 50, this.colors.success),
      text: new Text({
        text: "Responsive Button",
        style: { fontSize: 16, fill: this.colors.text },
      }),
      textOffset: { x: 0, y: -2 },
    });

    responsiveButton.onPress.connect(() => {
      console.log("Responsive button pressed!");
    });

    // Create responsive slider
    const responsiveSlider = new Slider({
      bg: this.createButtonGraphics(200, 10, this.colors.grid),
      fill: this.createButtonGraphics(200, 10, this.colors.primary),
      slider: this.createButtonGraphics(20, 20, this.colors.text),
      min: 0,
      max: 100,
      value: 50,
    });

    uiContainer.addChild(responsiveButton);
    uiContainer.addChild(responsiveSlider);

    // Mark for responsive positioning using label property
    (responsiveButton as any).testData = { uiTest: true, type: "button" };
    (responsiveSlider as any).testData = { uiTest: true, type: "slider" };

    this.testElements.push(responsiveButton);
    this.testElements.push(responsiveSlider);
  }

  /**
   * Test 7: Advanced Layout Tests (Fallback Implementation)
   */
  private createFlexboxTests(): void {
    console.log("Using fallback vertical layout implementation");
    this.createFallbackVerticalLayout();
  }

  /**
   * Fallback vertical layout when @pixi/layout is not available
   */
  private createFallbackVerticalLayout(): void {
    const verticalContainer = new Container();

    // Create background
    const bg = new Graphics()
      .roundRect(0, 0, 200, 150, 8)
      .fill({ color: this.colors.background, alpha: 0.8 });
    verticalContainer.addChild(bg);

    ["Header", "Content", "Footer"].forEach((label, index) => {
      const item = this.createTestElement({
        width: 180,
        height: 40,
        color: [this.colors.info, this.colors.warning, this.colors.success][
          index
        ],
        label,
        data: { fallbackVertical: true, index },
      });

      item.x = 10;
      item.y = 10 + index * 45; // Manual vertical spacing

      verticalContainer.addChild(item);
    });

    // Position away from clustered elements
    verticalContainer.x = 120; // More space from left edge
    verticalContainer.y = 350; // Lower on screen to avoid clustering

    this.layoutTests.addChild(verticalContainer);
    this.testElements.push(verticalContainer);
  }

  /**
   * Test 8: Proportional Layout Tests
   */
  private createProportionalTests(): void {
    const proportionalContainer = new Container();
    this.layoutTests.addChild(proportionalContainer);

    // Create elements that should maintain proportions
    for (let i = 0; i < 5; i++) {
      const element = this.createTestElement({
        width: 40,
        height: 40,
        color: this.colors.primary + i * 0x111111,
        label: `P${i + 1}`,
        anchor: { x: 0.5, y: 0.5 },
        data: { proportional: true, index: i },
      });

      proportionalContainer.addChild(element);
      this.testElements.push(element);
    }
  }

  /**
   * Test 9: Scaling Tests
   */
  private createScalingTests(): void {
    const scalingContainer = new Container();
    this.layoutTests.addChild(scalingContainer);

    const scales = [0.5, 0.75, 1.0, 1.25, 1.5];
    scales.forEach((scale, index) => {
      const element = this.createTestElement({
        width: 50,
        height: 50,
        color: this.colors.secondary,
        label: `${scale}x`,
        anchor: { x: 0.5, y: 0.5 },
        data: { scaling: true, scale, index },
      });

      element.scale.set(scale);
      scalingContainer.addChild(element);
      this.testElements.push(element);
    });
  }

  /**
   * Test 10: Viewport and Safe Area Tests
   */
  private createViewportTests(): void {
    const viewportTest = this.createTestElement({
      width: 200,
      height: 100,
      color: this.colors.warning,
      label: "VIEWPORT",
      anchor: { x: 0.5, y: 0.5 },
      data: { viewport: true, background: true },
    });

    // Set as background layer (lowest z-index)
    viewportTest.zIndex = -100;

    // Add to layout tests but at the beginning (behind everything else)
    this.layoutTests.addChildAt(viewportTest, 0);
    this.testElements.push(viewportTest);
  }

  /**
   * Test 11: Interactive Element Tests
   */
  private createInteractionTests(): void {
    const interactiveElement = this.createTestElement({
      width: 100,
      height: 60,
      color: this.colors.info,
      label: "TOUCH",
      anchor: { x: 0.5, y: 0.5 },
      data: { interactive: true },
    });

    interactiveElement.eventMode = "static";
    interactiveElement.cursor = "pointer";

    interactiveElement.on("pointerdown", () => {
      interactiveElement.tint = this.colors.success;
    });

    interactiveElement.on("pointerup", () => {
      interactiveElement.tint = 0xffffff;
    });

    this.layoutTests.addChild(interactiveElement);
    this.testElements.push(interactiveElement);
  }

  /**
   * Helper method to create test elements with consistent styling
   */
  private createTestElement(config: {
    width: number;
    height: number;
    color: number;
    label: string;
    anchor?: { x: number; y: number };
    data?: any;
  }): Container {
    const element = new Container();

    // Create background shape
    const bg = new Graphics()
      .roundRect(0, 0, config.width, config.height, 5)
      .fill({ color: config.color, alpha: 0.8 })
      .stroke({ width: 2, color: this.colors.text, alpha: 0.5 });

    // Create label
    const label = new Text({
      text: config.label,
      style: {
        fontSize: 10,
        fill: this.colors.text,
        fontFamily: "Arial, sans-serif",
        fontWeight: "bold",
      },
    });

    // Position label at center of element
    label.anchor.set(0.5);
    label.x = config.width / 2;
    label.y = config.height / 2;

    element.addChild(bg, label);

    // Set anchor if provided
    if (config.anchor) {
      element.pivot.set(
        config.width * config.anchor.x,
        config.height * config.anchor.y,
      );
    }

    // Store test data
    if (config.data) {
      (element as any).testData = config.data;
    }

    // Auto-register with AI system if enabled (but not if intent layout is handling it or if it's a background element)
    if (
      this.useIntelligence &&
      !this.useIntentLayout &&
      config.label &&
      !config.data?.background
    ) {
      // Use clean, simple element ID without duplicates
      const elementId = config.label;
      this.elementRegistry.set(elementId, element);
      this.agentFactory.autoRegister(elementId, element, {
        purpose: "debug test element",
        interactivity: ["hover"],
        priority: "normal",
        grouping: "test-elements",
        metadata: { testConfig: config },
      });
    }

    return element;
  }

  /**
   * Helper to create button graphics for UI components
   */
  private createButtonGraphics(
    width: number,
    height: number,
    color: number,
  ): Graphics {
    return new Graphics()
      .roundRect(0, 0, width, height, 8)
      .fill({ color, alpha: 0.9 });
  }

  /**
   * Main resize handler - positions all test elements appropriately
   */
  public resize(width: number, height: number): void {
    this.currentWidth = width;
    this.currentHeight = height;

    // Update debug grid
    this.drawDebugGrid();

    if (this.useIntentLayout) {
      // Use intent-based layout system
      console.log("🎯 Using intent-based layout compilation...");
      this.layoutEngine.setViewport(width, height);
      this.layoutEngine.compile();

      // Log layout analysis
      console.log(this.layoutEngine.getAnalysisReport());
    } else {
      // Use legacy positioning
      console.log("📐 Using legacy positioning system for all elements...");
      this.positionTestElements();
    }

    if (this.useIntelligence) {
      // Update AI intelligence system
      console.log("🤖 Running AI layout intelligence analysis...");
      this.intelligence.setViewport(width, height);
      this.intelligence.performGlobalAnalysis();

      // Log AI analysis
      console.log(this.intelligence.generateIntelligenceReport());
    }

    // Update debug info
    this.updateDebugInfo();
  }

  /**
   * Draw helpful grid overlay
   */
  private drawDebugGrid(): void {
    this.debugGraphics.clear();

    if (!this.showDebugInfo) return;

    this.debugGraphics.setStrokeStyle({
      width: 1,
      color: this.colors.grid,
      alpha: 0.3,
    });

    // Draw grid lines
    for (let x = 0; x <= this.currentWidth; x += this.gridSize) {
      this.debugGraphics.moveTo(x, 0).lineTo(x, this.currentHeight);
    }

    for (let y = 0; y <= this.currentHeight; y += this.gridSize) {
      this.debugGraphics.moveTo(0, y).lineTo(this.currentWidth, y);
    }

    this.debugGraphics.stroke();

    // Draw center lines
    this.debugGraphics.setStrokeStyle({
      width: 2,
      color: this.colors.secondary,
      alpha: 0.6,
    });
    this.debugGraphics
      .moveTo(this.currentWidth / 2, 0)
      .lineTo(this.currentWidth / 2, this.currentHeight);
    this.debugGraphics
      .moveTo(0, this.currentHeight / 2)
      .lineTo(this.currentWidth, this.currentHeight / 2);
    this.debugGraphics.stroke();

    // Draw safe area bounds
    const safeMargin = 50;
    this.debugGraphics.setStrokeStyle({
      width: 3,
      color: this.colors.warning,
      alpha: 0.8,
    });
    this.debugGraphics.rect(
      safeMargin,
      safeMargin,
      this.currentWidth - safeMargin * 2,
      this.currentHeight - safeMargin * 2,
    );
    this.debugGraphics.stroke();
  }

  /**
   * Position all test elements based on their test configuration
   */
  private positionTestElements(): void {
    this.testElements.forEach((element) => {
      const testData = (element as any).testData || {};

      // Anchor point tests - arrange in a 3x3 grid to avoid clustering
      if (testData.anchorPoint) {
        const anchor = testData.anchorPoint;
        const gridSize = 3;
        const cellWidth = this.currentWidth / (gridSize + 1);
        const cellHeight = this.currentHeight / (gridSize + 1);

        // Map anchor labels to grid positions
        const gridPositions: Record<string, { row: number; col: number }> = {
          "TL (0,0)": { row: 1, col: 1 },
          "TC (0.5,0)": { row: 1, col: 2 },
          "TR (1,0)": { row: 1, col: 3 },
          "ML (0,0.5)": { row: 2, col: 1 },
          "C (0.5,0.5)": { row: 2, col: 2 },
          "MR (1,0.5)": { row: 2, col: 3 },
          "BL (0,1)": { row: 3, col: 1 },
          "BC (0.5,1)": { row: 3, col: 2 },
          "BR (1,1)": { row: 3, col: 3 },
        };

        const position = gridPositions[anchor.label];
        if (position) {
          element.x = position.col * cellWidth;
          element.y = position.row * cellHeight;
        }
      }

      // Corner tests
      if (testData.cornerTest) {
        const offset = testData.offset;
        if (offset.x > 0 && offset.y > 0) {
          // Top-left
          element.x = offset.x;
          element.y = offset.y;
        } else if (offset.x < 0 && offset.y > 0) {
          // Top-right
          element.x = this.currentWidth + offset.x;
          element.y = offset.y;
        } else if (offset.x > 0 && offset.y < 0) {
          // Bottom-left
          element.x = offset.x;
          element.y = this.currentHeight + offset.y;
        } else {
          // Bottom-right
          element.x = this.currentWidth + offset.x;
          element.y = this.currentHeight + offset.y;
        }
      }

      // Center tests
      if (testData.centerTest) {
        element.x = this.currentWidth / 2;
        element.y = this.currentHeight / 2;
      }

      // Edge tests
      if (testData.edge) {
        const margin = 80; // Increased margin to avoid clustering
        switch (testData.edge) {
          case "top":
            element.x = this.currentWidth / 2;
            element.y = margin;
            break;
          case "right":
            element.x = this.currentWidth - margin;
            element.y = this.currentHeight / 2;
            break;
          case "bottom":
            element.x = this.currentWidth / 2;
            element.y = this.currentHeight - margin;
            break;
          case "left":
            element.x = margin;
            element.y = this.currentHeight / 2;
            break;
        }
      }

      // Proportional tests
      if (testData.proportional) {
        const spacing = this.currentWidth / 6;
        element.x = spacing * (testData.index + 1);
        element.y = this.currentHeight * 0.3;
      }

      // Scaling tests
      if (testData.scaling) {
        const spacing = this.currentWidth / 6;
        element.x = spacing * (testData.index + 1);
        element.y = this.currentHeight * 0.7;
      }

      // UI tests
      if (testData.uiTest) {
        if (testData.type === "button") {
          element.x = this.currentWidth / 2;
          element.y = this.currentHeight - 100;
        } else if (testData.type === "slider") {
          element.x = this.currentWidth / 2 - 100;
          element.y = this.currentHeight - 150;
        }
      }

      // Viewport tests - background reference frame
      if (testData.viewport) {
        element.x = this.currentWidth / 2;
        element.y = this.currentHeight / 2;

        // Scale to represent the safe area (80% of viewport with margin)
        const safeWidth = this.currentWidth * 0.8;
        const safeHeight = this.currentHeight * 0.8;

        // Scale the element to match safe area bounds
        element.scale.x = safeWidth / 200; // Original width was 200
        element.scale.y = safeHeight / 100; // Original height was 100

        // Make it semi-transparent background
        element.alpha = 0.3;

        // Ensure it stays behind everything
        element.zIndex = -100;
      }

      // Interactive tests
      if (testData.interactive) {
        element.x = this.currentWidth - 100;
        element.y = this.currentHeight - 100;
      }
    });
  }

  /**
   * Update debug information display
   */
  private updateDebugInfo(): void {
    const aspectRatio = (this.currentWidth / this.currentHeight).toFixed(2);
    const orientation =
      this.currentWidth > this.currentHeight ? "Landscape" : "Portrait";

    this.debugInfo.text = [
      `Screen: ${this.currentWidth}x${this.currentHeight}`,
      `Aspect: ${aspectRatio} (${orientation})`,
      `DPR: ${window.devicePixelRatio?.toFixed(2) || "N/A"}`,
      `Tests: ${this.testElements.length} elements`,
      `Grid: ${this.gridSize}px`,
      `Press 'G' to toggle grid`,
    ].join("\n");

    this.debugInfo.x = 10;
    this.debugInfo.y = 10;
  }

  /**
   * Toggle debug visualization
   */
  public toggleDebugInfo(): void {
    this.showDebugInfo = !this.showDebugInfo;
    this.debugInfo.visible = this.showDebugInfo;
    this.drawDebugGrid();
  }

  /**
   * Toggle between intent-based and legacy layout systems
   */
  public toggleLayoutSystem(): void {
    this.useIntentLayout = !this.useIntentLayout;
    console.log(
      `🎯 Switched to ${this.useIntentLayout ? "intent-based" : "legacy"} layout system`,
    );

    // When switching to intent layout, disable AI intelligence to avoid conflicts
    if (this.useIntentLayout) {
      this.useIntelligence = false;
      console.log(
        `🤖 Auto-disabled AI intelligence to avoid conflicts with intent system`,
      );
    }

    // Re-apply layout with current system
    this.resize(this.currentWidth, this.currentHeight);
  }

  /**
   * Toggle AI intelligence system
   */
  public toggleIntelligenceSystem(): void {
    this.useIntelligence = !this.useIntelligence;
    console.log(
      `🤖 ${this.useIntelligence ? "Enabled" : "Disabled"} AI layout intelligence system`,
    );

    // When enabling AI intelligence, disable intent layout to avoid conflicts
    if (this.useIntelligence) {
      this.useIntentLayout = false;
      console.log(
        `🎯 Auto-disabled intent layout to avoid conflicts with AI system`,
      );

      // Clear existing registry and re-register elements for AI
      this.elementRegistry.clear();
      this.reinitializeAISystem();
    }

    // Re-run layout
    this.resize(this.currentWidth, this.currentHeight);
  }

  /**
   * Reinitialize AI system with clean element registration
   */
  private reinitializeAISystem(): void {
    if (!this.useIntelligence) return;

    console.log("🤖 Reinitializing AI system with clean element registry...");

    // Register only the 9 main anchor test elements (not duplicates)
    const anchorElements = [
      "TL (0,0)",
      "TC (0.5,0)",
      "TR (1,0)",
      "ML (0,0.5)",
      "C (0.5,0.5)",
      "MR (1,0.5)",
      "BL (0,1)",
      "BC (0.5,1)",
      "BR (1,1)",
    ];

    // Find and register only these specific elements
    for (const element of this.testElements) {
      const testData = (element as any).testData;
      if (testData && testData.anchorPoint) {
        const label = testData.anchorPoint.label;
        if (anchorElements.includes(label)) {
          this.elementRegistry.set(label, element);
          this.agentFactory.autoRegister(label, element, {
            purpose: "anchor test element",
            interactivity: ["hover"],
            priority: "normal",
            grouping: "anchor-tests",
            metadata: { anchorPoint: testData.anchorPoint },
          });
        }
      }
    }

    console.log(
      `🤖 Registered ${this.elementRegistry.size} elements for AI control`,
    );
  }

  /**
   * Get AI intelligence report
   */
  public getIntelligenceReport(): string {
    if (!this.useIntelligence) {
      return "AI Intelligence system is disabled. Press I to enable.";
    }

    return this.intelligence.generateIntelligenceReport();
  }

  /**
   * Execute AI-driven layout corrections
   */
  public executeAICorrections(): string {
    if (!this.useIntelligence) {
      return "AI Intelligence system is disabled. Press I to enable.";
    }

    console.log("🤖 Executing AI-driven layout corrections...");

    // Update executor with current viewport
    this.executor.setViewport(this.currentWidth, this.currentHeight);

    // Create enhanced executor that can actually move elements
    const result = this.executeIntelligentMovements();

    return (
      this.executor.getExecutionSummary() + "\n\nActual movements: " + result
    );
  }

  /**
   * Execute intelligent movements with access to actual elements
   */
  private executeIntelligentMovements(): string {
    const analysis = this.intelligence.performGlobalAnalysis();
    let movementCount = 0;
    const movements: string[] = [];

    // Handle clustering - only process the main anchor cluster
    if (analysis.globalPatterns?.clusters) {
      for (const cluster of analysis.globalPatterns.clusters) {
        // Only process clusters that contain anchor test elements
        const anchorCluster = cluster.members.filter(
          (id) =>
            id.includes("(0,0)") ||
            id.includes("(0.5,0)") ||
            id.includes("(1,0)") ||
            id.includes("(0,0.5)") ||
            id.includes("(0.5,0.5)") ||
            id.includes("(1,0.5)") ||
            id.includes("(0,1)") ||
            id.includes("(0.5,1)") ||
            id.includes("(1,1)"),
        );

        if (anchorCluster.length < 3) {
          console.log(
            `📦 Skipping small cluster: ${cluster.members.join(", ")}`,
          );
          continue; // Skip non-anchor clusters
        }

        console.log(`📦 Resolving anchor cluster: ${anchorCluster.join(", ")}`);

        // Calculate spread positions for ONLY the anchor elements
        const region = this.getOptimalRegion(anchorCluster);
        console.log(
          `🎯 Using region: x=${region.x.toFixed(1)}, y=${region.y.toFixed(1)}, w=${region.width}, h=${region.height}`,
        );

        const spreadPositions = this.calculateSpreadPositions(
          anchorCluster.length,
          region,
        );

        anchorCluster.forEach((memberId: string, index: number) => {
          const element = this.elementRegistry.get(memberId);
          if (element && spreadPositions[index]) {
            const oldPos = { x: element.x, y: element.y };
            const newPos = this.validatePosition(spreadPositions[index]);

            element.x = newPos.x;
            element.y = newPos.y;

            movementCount++;
            movements.push(
              `✅ ${memberId}: (${oldPos.x.toFixed(1)}, ${oldPos.y.toFixed(1)}) → (${element.x.toFixed(1)}, ${element.y.toFixed(1)})`,
            );
            console.log(
              `🎯 Moved ${memberId} from (${oldPos.x}, ${oldPos.y}) to (${element.x}, ${element.y})`,
            );
          }
        });
      }
    }

    // Handle off-screen elements
    for (const report of analysis.agentReports) {
      if (report.positionAssessment?.visibility < 0.5) {
        const element = this.elementRegistry.get(report.agentId);
        if (element) {
          const oldPos = { x: element.x, y: element.y };
          const safePos = this.findSafePosition();
          element.x = safePos.x;
          element.y = safePos.y;

          movementCount++;
          movements.push(
            `✅ ${report.agentId}: Moved from off-screen to (${element.x.toFixed(1)}, ${element.y.toFixed(1)})`,
          );
          console.log(
            `🎯 Brought ${report.agentId} back on-screen to (${element.x}, ${element.y})`,
          );
        }
      }
    }

    const summary = [
      `🎯 Executed ${movementCount} intelligent movements`,
      `📊 Total registered elements: ${this.elementRegistry.size}`,
      `📦 Clusters resolved: ${analysis.globalPatterns?.clusters?.length || 0}`,
      "",
      "📋 MOVEMENTS PERFORMED:",
      ...movements,
    ].join("\n");

    return summary;
  }

  /**
   * Calculate spread positions for clustered elements (fixed to match intent system)
   */
  private calculateSpreadPositions(
    count: number,
    region: { x: number; y: number; width: number; height: number },
  ): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];

    if (count === 1) {
      positions.push({
        x: region.x + region.width / 2,
        y: region.y + region.height / 2,
      });
      return positions;
    }

    // Force a 3x3 grid like the working intent system (max 9 elements per cluster)
    const maxCols = 3;
    const maxRows = 3;
    const maxElements = maxCols * maxRows;

    // Limit to first 9 elements if more than that
    const elementsToPosition = Math.min(count, maxElements);

    const cellWidth = region.width / maxCols;
    const cellHeight = region.height / maxRows;

    for (let i = 0; i < elementsToPosition; i++) {
      const row = Math.floor(i / maxCols);
      const col = i % maxCols;

      positions.push({
        x: region.x + col * cellWidth + cellWidth / 2,
        y: region.y + row * cellHeight + cellHeight / 2,
      });
    }

    // Handle excess elements by placing them at center (fallback)
    for (let i = elementsToPosition; i < count; i++) {
      positions.push({
        x: region.x + region.width / 2,
        y: region.y + region.height / 2,
      });
    }

    return positions;
  }

  /**
   * Get optimal region for spreading elements (matching intent system behavior)
   */
  private getOptimalRegion(elementIds: string[]): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    // Match the successful intent system positioning
    // Looking at the working layout: elements around (863-953, 472-532)
    const centerX = this.currentWidth / 2;
    const centerY = this.currentHeight / 2;

    // Create a reasonable area around the center (much smaller than before)
    const regionWidth = 200; // Tight clustering area
    const regionHeight = 150; // Reasonable vertical space

    return {
      x: centerX - regionWidth / 2,
      y: centerY - regionHeight / 2,
      width: regionWidth,
      height: regionHeight,
    };
  }

  /**
   * Find a safe position that doesn't conflict with existing elements
   */
  private findSafePosition(): { x: number; y: number } {
    const safeArea = {
      x: 50,
      y: 50,
      width: this.currentWidth - 100,
      height: this.currentHeight - 100,
    };

    // Simple strategy: find center of safe area
    // Could be enhanced to check for conflicts
    return {
      x: safeArea.x + safeArea.width / 2,
      y: safeArea.y + safeArea.height / 2,
    };
  }

  /**
   * Validate and clamp position to stay within reasonable bounds
   */
  private validatePosition(pos: { x: number; y: number }): {
    x: number;
    y: number;
  } {
    const margin = 50;
    const maxX = this.currentWidth - margin;
    const maxY = this.currentHeight - margin;

    return {
      x: Math.max(margin, Math.min(maxX, pos.x)),
      y: Math.max(margin, Math.min(maxY, pos.y)),
    };
  }

  /**
   * Poll actual element positions and layout information
   */
  public pollLayoutInfo(): LayoutInfo {
    const elements: ElementInfo[] = [];

    // Traverse all children recursively to find positioned elements
    this.traverseAndCollectElements(this, elements, "debug-root");

    return {
      screenDimensions: {
        width: this.currentWidth,
        height: this.currentHeight,
        aspectRatio: this.currentWidth / this.currentHeight,
      },
      elements,
      timestamp: Date.now(),
      totalElements: elements.length,
    };
  }

  /**
   * Recursively traverse container and collect element position info
   */
  private traverseAndCollectElements(
    container: Container,
    elements: ElementInfo[],
    containerName: string,
  ): void {
    container.children.forEach((child, index) => {
      if (child instanceof Container) {
        const globalPos = child.toGlobal({ x: 0, y: 0 });
        const bounds = child.getBounds();
        const testData = (child as any).testData;

        const elementInfo: ElementInfo = {
          name: this.getElementName(child, containerName, index),
          localPosition: { x: child.x, y: child.y },
          globalPosition: { x: globalPos.x, y: globalPos.y },
          bounds: {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
          },
          scale: { x: child.scale.x, y: child.scale.y },
          rotation: child.rotation,
          visible: child.visible,
          alpha: child.alpha,
          anchor: this.getAnchorInfo(child),
          testData: testData || null,
          isOffScreen: this.isElementOffScreen(bounds),
          distanceFromEdges: this.getDistanceFromEdges(bounds),
        };

        elements.push(elementInfo);

        // Recursively check children
        if (child.children.length > 0) {
          this.traverseAndCollectElements(child, elements, elementInfo.name);
        }
      }
    });
  }

  /**
   * Generate a meaningful name for an element
   */
  private getElementName(
    element: Container,
    containerName: string,
    index: number,
  ): string {
    const testData = (element as any).testData;

    if (testData) {
      if (testData.cornerTest)
        return `Corner-${testData.offset.x > 0 ? "L" : "R"}${testData.offset.y > 0 ? "T" : "B"}`;
      if (testData.centerTest) return "Center-Test";
      if (testData.edge) return `Edge-${testData.edge}`;
      if (testData.proportional) return `Proportional-${testData.index}`;
      if (testData.scaling) return `Scaling-${testData.scale}x`;
      if (testData.uiTest) return `UI-${testData.type}`;
      if (testData.viewport) return "Viewport-Test";
      if (testData.interactive) return "Interactive-Test";
      if (testData.fallbackFlex) return `Flex-${testData.index}`;
      if (testData.fallbackVertical) return `Vertical-${testData.index}`;
    }

    // Try to get name from text content
    const textChild = element.children.find(
      (child) => child instanceof Text,
    ) as Text;
    if (textChild && textChild.text) {
      return `Element-${textChild.text}`;
    }

    return `${containerName}-child-${index}`;
  }

  /**
   * Get anchor information if element has it
   */
  private getAnchorInfo(element: Container): { x: number; y: number } | null {
    if ("anchor" in element && element.anchor) {
      return { x: (element.anchor as any).x, y: (element.anchor as any).y };
    }
    if (element.pivot) {
      // Convert pivot to anchor-like values
      const bounds = element.getLocalBounds();
      return {
        x: bounds.width > 0 ? element.pivot.x / bounds.width : 0,
        y: bounds.height > 0 ? element.pivot.y / bounds.height : 0,
      };
    }
    return null;
  }

  /**
   * Check if element is positioned off-screen
   */
  private isElementOffScreen(bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): boolean {
    return (
      bounds.x + bounds.width < 0 ||
      bounds.x > this.currentWidth ||
      bounds.y + bounds.height < 0 ||
      bounds.y > this.currentHeight
    );
  }

  /**
   * Calculate distance from screen edges
   */
  private getDistanceFromEdges(bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): EdgeDistances {
    return {
      top: bounds.y,
      right: this.currentWidth - (bounds.x + bounds.width),
      bottom: this.currentHeight - (bounds.y + bounds.height),
      left: bounds.x,
    };
  }

  /**
   * Get formatted layout report
   */
  public getLayoutReport(): string {
    const layoutInfo = this.pollLayoutInfo();
    const lines: string[] = [];

    lines.push("=== ACTUAL LAYOUT ANALYSIS ===");
    lines.push(
      `Screen: ${layoutInfo.screenDimensions.width}x${layoutInfo.screenDimensions.height} (${layoutInfo.screenDimensions.aspectRatio.toFixed(2)})`,
    );
    lines.push(`Total Elements: ${layoutInfo.totalElements}`);
    lines.push("");

    // Group elements by off-screen status
    const onScreen = layoutInfo.elements.filter((e) => !e.isOffScreen);
    const offScreen = layoutInfo.elements.filter((e) => e.isOffScreen);

    if (offScreen.length > 0) {
      lines.push("⚠️  OFF-SCREEN ELEMENTS:");
      offScreen.forEach((element) => {
        lines.push(
          `  - ${element.name}: global(${element.globalPosition.x.toFixed(1)}, ${element.globalPosition.y.toFixed(1)})`,
        );
      });
      lines.push("");
    }

    lines.push("✅ ON-SCREEN ELEMENTS:");
    onScreen.forEach((element) => {
      const edgeDist = element.distanceFromEdges;
      lines.push(`  - ${element.name}:`);
      lines.push(
        `    Global: (${element.globalPosition.x.toFixed(1)}, ${element.globalPosition.y.toFixed(1)})`,
      );
      lines.push(
        `    Local: (${element.localPosition.x.toFixed(1)}, ${element.localPosition.y.toFixed(1)})`,
      );
      lines.push(
        `    Bounds: ${element.bounds.width.toFixed(1)}x${element.bounds.height.toFixed(1)}`,
      );
      lines.push(
        `    Edges: T:${edgeDist.top.toFixed(1)} R:${edgeDist.right.toFixed(1)} B:${edgeDist.bottom.toFixed(1)} L:${edgeDist.left.toFixed(1)}`,
      );
      if (element.anchor) {
        lines.push(`    Anchor: (${element.anchor.x}, ${element.anchor.y})`);
      }
      lines.push("");
    });

    lines.push("================================");

    return lines.join("\n");
  }

  /**
   * Get test results summary
   */
  public getTestResults(): string {
    return this.getLayoutReport();
  }

  /**
   * Cleanup method
   */
  public destroy(): void {
    this.testElements.forEach((element) => element.destroy());
    this.testElements = [];
    super.destroy();
  }
}
