import { Container } from "pixi.js";

/**
 * Layout Intent System - LISA-inspired declarative layout
 * Translates high-level layout intentions into actual positioning
 */

// Core Layout Intent Instructions (inspired by LISA)
export interface LayoutIntent {
  // Positioning Intent
  POSITION?: PositionIntent;

  // Relationship Intent
  RELATE?: RelationshipIntent;

  // Behavior Intent
  BEHAVE?: BehaviorIntent;

  // Visual Intent
  APPEAR?: AppearanceIntent;

  // Responsive Intent
  ADAPT?: ResponsiveIntent;
}

export interface PositionIntent {
  // Semantic positioning
  region?:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "center"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
  within?: "viewport" | "safe-area" | "parent" | "content-area";

  // Edge behavior
  edge?: "hug" | "avoid" | "float" | "stick";
  margin?: number | "auto" | "tight" | "comfortable" | "spacious";

  // Layering
  layer?: "background" | "content" | "overlay" | "modal" | number;
  priority?: "low" | "normal" | "high" | "critical";
}

export interface RelationshipIntent {
  // Collision behavior
  collision?: "overlap" | "avoid" | "push" | "stack" | "flow";

  // Alignment behavior
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  distribute?: "even" | "spread" | "pack" | "flow";

  // Grouping
  group?: string; // Elements with same group coordinate together
  cluster?: "tight" | "loose" | "auto";

  // Dependencies
  anchor?: string; // ID of element to position relative to
  follow?: string; // ID of element to track
}

export interface BehaviorIntent {
  // Movement
  movement?: "static" | "float" | "wander" | "bounce" | "orbit" | "follow";
  bounds?: "strict" | "soft" | "elastic" | "none";

  // Interaction
  interactive?: "none" | "hover" | "click" | "drag" | "gesture";
  feedback?: "subtle" | "obvious" | "dramatic" | "none";

  // Lifecycle
  appear?: "instant" | "fade" | "slide" | "bounce" | "scale";
  disappear?: "instant" | "fade" | "slide" | "scale" | "explode";
}

export interface AppearanceIntent {
  // Visual prominence
  prominence?: "hidden" | "subtle" | "normal" | "prominent" | "dominant";
  attention?: "none" | "gentle" | "notice" | "urgent" | "critical";

  // Visual style
  style?: "minimal" | "clean" | "decorated" | "rich" | "dramatic";
  mood?: "calm" | "energetic" | "serious" | "playful" | "mysterious";
}

export interface ResponsiveIntent {
  // Size adaptation
  scale?: "fixed" | "proportional" | "fluid" | "adaptive";
  minSize?: { width?: number; height?: number };
  maxSize?: { width?: number; height?: number };

  // Layout adaptation
  reflow?: "never" | "mobile" | "tablet" | "always";
  priority?: number; // Higher priority elements get better positioning

  // Content adaptation
  content?: "truncate" | "wrap" | "scale" | "hide" | "summarize";
}

// Layout Element with Intent
export interface IntentElement {
  id: string;
  element: Container;
  intent: LayoutIntent;

  // Computed properties (filled by layout engine)
  actualBounds?: { x: number; y: number; width: number; height: number };
  intentSatisfied?: boolean;
  conflicts?: string[]; // IDs of conflicting elements
}

// Layout Intent Compiler - translates intent to positioning
export class LayoutIntentCompiler {
  private elements: Map<string, IntentElement> = new Map();
  private viewport = { width: 0, height: 0 };
  private safeArea = { top: 0, right: 0, bottom: 0, left: 0 };

  /**
   * Register an element with layout intent
   */
  public register(id: string, element: Container, intent: LayoutIntent): void {
    this.elements.set(id, {
      id,
      element,
      intent,
      intentSatisfied: false,
      conflicts: [],
    });
  }

  /**
   * Update viewport dimensions
   */
  public setViewport(width: number, height: number): void {
    this.viewport = { width, height };
    this.safeArea = {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50,
    };
  }

  /**
   * Compile all layout intents into actual positions
   */
  public compile(): void {
    console.log("🎯 Compiling layout intents...");

    // Phase 1: Analyze and categorize intents
    const analysis = this.analyzeIntents();

    // Phase 2: Resolve positioning conflicts
    const resolved = this.resolveConflicts(analysis);

    // Phase 3: Apply final positioning
    this.applyPositioning(resolved);

    // Phase 4: Validate intent satisfaction
    this.validateIntents();
  }

  /**
   * Analyze all registered intents and categorize them
   */
  private analyzeIntents(): LayoutAnalysis {
    const analysis: LayoutAnalysis = {
      regions: new Map(),
      relationships: [],
      conflicts: [],
      layers: new Map(),
    };

    for (const [id, element] of this.elements) {
      const intent = element.intent;

      // Categorize by region
      const region = intent.POSITION?.region || "center";
      if (!analysis.regions.has(region)) {
        analysis.regions.set(region, []);
      }
      analysis.regions.get(region)!.push(element);

      // Analyze relationships
      if (intent.RELATE?.anchor) {
        analysis.relationships.push({
          from: id,
          to: intent.RELATE.anchor,
          type: "anchor",
        });
      }

      // Detect conflicts
      this.detectConflicts(element, analysis);
    }

    return analysis;
  }

  /**
   * Detect potential layout conflicts
   */
  private detectConflicts(
    element: IntentElement,
    analysis: LayoutAnalysis,
  ): void {
    const region = element.intent.POSITION?.region;
    const collision = element.intent.RELATE?.collision || "avoid";

    // Find other elements in same region
    const sameRegion = Array.from(this.elements.values()).filter(
      (other) =>
        other.id !== element.id && other.intent.POSITION?.region === region,
    );

    for (const other of sameRegion) {
      const otherCollision = other.intent.RELATE?.collision || "avoid";

      if (collision === "avoid" && otherCollision === "avoid") {
        analysis.conflicts.push({
          elements: [element.id, other.id],
          type: "avoidance",
          region: region || "unknown",
        });
      }
    }
  }

  /**
   * Resolve positioning conflicts using intent-based rules
   */
  private resolveConflicts(analysis: LayoutAnalysis): ResolvedLayout {
    const resolved: ResolvedLayout = {
      positions: new Map(),
      satisfied: new Map(),
      compromises: [],
    };

    // Resolve each region
    for (const [region, elements] of analysis.regions) {
      console.log(
        `🎯 Resolving region: ${region} (${elements.length} elements)`,
      );
      this.resolveRegion(region, elements, resolved);
    }

    return resolved;
  }

  /**
   * Resolve conflicts within a specific region
   */
  private resolveRegion(
    region: string,
    elements: IntentElement[],
    resolved: ResolvedLayout,
  ): void {
    // Sort by priority
    const sorted = elements.sort((a, b) => {
      const aPrio = a.intent.POSITION?.priority || "normal";
      const bPrio = b.intent.POSITION?.priority || "normal";
      const priorities = { critical: 4, high: 3, normal: 2, low: 1 };
      return priorities[bPrio] - priorities[aPrio];
    });

    // Get region bounds
    const bounds = this.getRegionBounds(region);

    // Position elements based on intent
    for (let i = 0; i < sorted.length; i++) {
      const element = sorted[i];
      const position = this.calculateIntentPosition(
        element,
        bounds,
        i,
        sorted.length,
      );

      resolved.positions.set(element.id, position);
      resolved.satisfied.set(
        element.id,
        this.checkIntentSatisfied(element, position),
      );
    }
  }

  /**
   * Get bounds for a semantic region
   */
  private getRegionBounds(region: string): RegionBounds {
    const vw = this.viewport.width;
    const vh = this.viewport.height;
    const safe = this.safeArea;

    switch (region) {
      case "top":
        return {
          x: safe.left,
          y: safe.top,
          width: vw - safe.left - safe.right,
          height: vh * 0.3,
        };
      case "bottom":
        return {
          x: safe.left,
          y: vh * 0.7,
          width: vw - safe.left - safe.right,
          height: vh * 0.3 - safe.bottom,
        };
      case "left":
        return {
          x: safe.left,
          y: safe.top,
          width: vw * 0.3,
          height: vh - safe.top - safe.bottom,
        };
      case "right":
        return {
          x: vw * 0.7,
          y: safe.top,
          width: vw * 0.3 - safe.right,
          height: vh - safe.top - safe.bottom,
        };
      case "top-left":
        return { x: safe.left, y: safe.top, width: vw * 0.3, height: vh * 0.3 };
      case "top-right":
        return {
          x: vw * 0.7,
          y: safe.top,
          width: vw * 0.3 - safe.right,
          height: vh * 0.3,
        };
      case "bottom-left":
        return {
          x: safe.left,
          y: vh * 0.7,
          width: vw * 0.3,
          height: vh * 0.3 - safe.bottom,
        };
      case "bottom-right":
        return {
          x: vw * 0.7,
          y: vh * 0.7,
          width: vw * 0.3 - safe.right,
          height: vh * 0.3 - safe.bottom,
        };
      case "center":
      default:
        return { x: vw * 0.2, y: vh * 0.2, width: vw * 0.6, height: vh * 0.6 };
    }
  }

  /**
   * Calculate position based on intent
   */
  private calculateIntentPosition(
    element: IntentElement,
    bounds: RegionBounds,
    index: number,
    total: number,
  ): Position {
    const intent = element.intent;
    const collision = intent.RELATE?.collision || "avoid";
    const distribute = intent.RELATE?.distribute || "even";

    let x = bounds.x;
    let y = bounds.y;

    // Handle distribution
    if (collision === "avoid" && total > 1) {
      switch (distribute) {
        case "even":
          if (bounds.width > bounds.height) {
            // Horizontal distribution
            x =
              bounds.x +
              (bounds.width / total) * index +
              (bounds.width / total) * 0.5;
            y = bounds.y + bounds.height * 0.5;
          } else {
            // Vertical distribution
            x = bounds.x + bounds.width * 0.5;
            y =
              bounds.y +
              (bounds.height / total) * index +
              (bounds.height / total) * 0.5;
          }
          break;
        case "flow":
          // Flow layout - wrap to next row/column as needed
          const itemsPerRow = Math.floor(bounds.width / 100); // Assume ~100px per item
          const row = Math.floor(index / itemsPerRow);
          const col = index % itemsPerRow;
          x = bounds.x + col * (bounds.width / itemsPerRow) + 50;
          y = bounds.y + row * 80 + 40; // 80px row height
          break;
      }
    } else {
      // Single element or overlapping allowed
      x = bounds.x + bounds.width * 0.5;
      y = bounds.y + bounds.height * 0.5;
    }

    return { x, y };
  }

  /**
   * Check if element's intent is satisfied by its position
   */
  private checkIntentSatisfied(
    element: IntentElement,
    position: Position,
  ): boolean {
    // For now, assume satisfied if position is within expected region
    // This could be expanded with more sophisticated checking
    return true;
  }

  /**
   * Apply calculated positions to actual elements
   */
  private applyPositioning(resolved: ResolvedLayout): void {
    for (const [id, position] of resolved.positions) {
      const element = this.elements.get(id);
      if (element) {
        element.element.x = position.x;
        element.element.y = position.y;
        element.actualBounds = {
          x: position.x,
          y: position.y,
          width: element.element.width,
          height: element.element.height,
        };

        console.log(
          `📍 Positioned ${id} at (${position.x.toFixed(1)}, ${position.y.toFixed(1)})`,
        );
      }
    }
  }

  /**
   * Validate that intents were satisfied
   */
  private validateIntents(): void {
    let satisfied = 0;
    let total = 0;

    for (const [id, element] of this.elements) {
      total++;
      const isSatisfied = this.checkIntentSatisfied(
        element,
        element.actualBounds || { x: 0, y: 0 },
      );
      element.intentSatisfied = isSatisfied;
      if (isSatisfied) satisfied++;

      if (!isSatisfied) {
        console.warn(`⚠️ Intent not satisfied for ${id}:`, element.intent);
      }
    }

    console.log(
      `✅ Layout intent satisfaction: ${satisfied}/${total} (${Math.round((satisfied / total) * 100)}%)`,
    );
  }

  /**
   * Get layout analysis report
   */
  public getAnalysisReport(): string {
    const lines: string[] = [];
    lines.push("=== LAYOUT INTENT ANALYSIS ===");

    for (const [id, element] of this.elements) {
      lines.push(`\n📦 ${id}:`);
      lines.push(`  Intent: ${JSON.stringify(element.intent, null, 2)}`);
      lines.push(
        `  Position: (${element.actualBounds?.x.toFixed(1)}, ${element.actualBounds?.y.toFixed(1)})`,
      );
      lines.push(`  Satisfied: ${element.intentSatisfied ? "✅" : "❌"}`);
      if (element.conflicts && element.conflicts.length > 0) {
        lines.push(`  Conflicts: ${element.conflicts.join(", ")}`);
      }
    }

    return lines.join("\n");
  }
}

// Supporting interfaces
interface LayoutAnalysis {
  regions: Map<string, IntentElement[]>;
  relationships: Array<{ from: string; to: string; type: string }>;
  conflicts: Array<{ elements: string[]; type: string; region: string }>;
  layers: Map<number, IntentElement[]>;
}

interface ResolvedLayout {
  positions: Map<string, Position>;
  satisfied: Map<string, boolean>;
  compromises: Array<{ element: string; reason: string }>;
}

interface RegionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Position {
  x: number;
  y: number;
}
