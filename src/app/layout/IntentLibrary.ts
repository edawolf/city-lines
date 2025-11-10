import { LayoutIntent } from "./LayoutIntent";

/**
 * LISA-style Intent Library - Predefined layout intentions
 * High-level semantic descriptions that compile to layout intents
 */

export class IntentLibrary {
  /**
   * LISA-style Intent Definitions
   * These translate natural language intentions into layout intents
   */

  // CORE UI PATTERNS

  /**
   * "I want this button to stay in the top-right corner, never overlapping anything"
   */
  static CORNER_BUTTON(
    corner: "top-left" | "top-right" | "bottom-left" | "bottom-right",
  ): LayoutIntent {
    return {
      POSITION: {
        region: corner,
        within: "safe-area",
        edge: "hug",
        margin: "comfortable",
        priority: "high",
      },
      RELATE: {
        collision: "avoid",
        align: "center",
      },
      BEHAVE: {
        movement: "static",
        bounds: "strict",
        interactive: "click",
        feedback: "obvious",
      },
      APPEAR: {
        prominence: "prominent",
        attention: "notice",
      },
      ADAPT: {
        scale: "fixed",
        reflow: "never",
        priority: 8,
      },
    };
  }

  /**
   * "I want these test elements to spread out in the top area without overlapping"
   */
  static TEST_GRID(
    region:
      | "top"
      | "bottom"
      | "left"
      | "right"
      | "center"
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right" = "top",
  ): LayoutIntent {
    return {
      POSITION: {
        region,
        within: "safe-area",
        margin: "spacious",
        priority: "normal",
      },
      RELATE: {
        collision: "avoid",
        distribute: "flow",
        cluster: "loose",
      },
      BEHAVE: {
        movement: "static",
        interactive: "hover",
        feedback: "subtle",
      },
      APPEAR: {
        prominence: "normal",
        style: "clean",
      },
      ADAPT: {
        scale: "proportional",
        reflow: "mobile",
        priority: 3,
      },
    };
  }

  /**
   * "I want this debug info panel to float in a corner but get out of the way"
   */
  static DEBUG_PANEL(): LayoutIntent {
    return {
      POSITION: {
        region: "top-right",
        within: "viewport",
        edge: "float",
        margin: "tight",
        priority: "low",
      },
      RELATE: {
        collision: "push", // Gets pushed away by higher priority elements
        align: "start",
      },
      BEHAVE: {
        movement: "float",
        bounds: "soft",
        interactive: "drag",
        feedback: "subtle",
        appear: "fade",
      },
      APPEAR: {
        prominence: "subtle",
        style: "minimal",
      },
      ADAPT: {
        scale: "adaptive",
        reflow: "always",
        priority: 1,
        content: "truncate",
      },
    };
  }

  /**
   * "I want this to be prominently centered and impossible to miss"
   */
  static HERO_ELEMENT(): LayoutIntent {
    return {
      POSITION: {
        region: "center",
        within: "content-area",
        priority: "critical",
      },
      RELATE: {
        collision: "overlap", // Can overlap lower priority items
        align: "center",
      },
      BEHAVE: {
        movement: "static",
        interactive: "click",
        feedback: "dramatic",
        appear: "scale",
      },
      APPEAR: {
        prominence: "dominant",
        attention: "critical",
        style: "rich",
      },
      ADAPT: {
        scale: "fluid",
        priority: 10,
        reflow: "never",
      },
    };
  }

  /**
   * "I want these to line up horizontally at the bottom"
   */
  static BOTTOM_TOOLBAR(): LayoutIntent {
    return {
      POSITION: {
        region: "bottom",
        within: "safe-area",
        edge: "hug",
        margin: "comfortable",
      },
      RELATE: {
        collision: "avoid",
        distribute: "even",
        align: "center",
      },
      BEHAVE: {
        movement: "static",
        interactive: "click",
        feedback: "obvious",
      },
      APPEAR: {
        prominence: "prominent",
        style: "clean",
      },
      ADAPT: {
        scale: "proportional",
        reflow: "mobile",
        priority: 7,
      },
    };
  }

  /**
   * "I want this to follow the user's cursor/attention"
   */
  static FOLLOW_CURSOR(): LayoutIntent {
    return {
      POSITION: {
        priority: "high",
        layer: "overlay",
      },
      RELATE: {
        collision: "overlap",
        follow: "cursor",
      },
      BEHAVE: {
        movement: "follow",
        bounds: "soft",
        interactive: "none",
      },
      APPEAR: {
        prominence: "subtle",
        style: "minimal",
      },
      ADAPT: {
        scale: "fixed",
        priority: 9,
      },
    };
  }

  /**
   * "I want this tooltip to appear near its target without covering it"
   */
  static TOOLTIP(targetId: string): LayoutIntent {
    return {
      POSITION: {
        priority: "high",
        layer: "overlay",
        margin: "tight",
      },
      RELATE: {
        collision: "avoid",
        anchor: targetId,
        align: "start",
      },
      BEHAVE: {
        movement: "static",
        interactive: "none",
        appear: "fade",
        disappear: "fade",
      },
      APPEAR: {
        prominence: "prominent",
        style: "clean",
      },
      ADAPT: {
        scale: "adaptive",
        content: "wrap",
        priority: 6,
      },
    };
  }

  /**
   * "I want these elements to form a natural flowing layout"
   */
  static CONTENT_FLOW(): LayoutIntent {
    return {
      POSITION: {
        region: "center",
        within: "content-area",
        margin: "auto",
      },
      RELATE: {
        collision: "flow", // Elements flow around each other
        distribute: "flow",
        cluster: "auto",
      },
      BEHAVE: {
        movement: "static",
        bounds: "soft",
      },
      APPEAR: {
        prominence: "normal",
        style: "clean",
      },
      ADAPT: {
        scale: "fluid",
        reflow: "always",
        content: "wrap",
        priority: 4,
      },
    };
  }

  /**
   * "I want this background element that doesn't interfere with anything"
   */
  static BACKGROUND_DECORATION(): LayoutIntent {
    return {
      POSITION: {
        layer: "background",
        priority: "low",
      },
      RELATE: {
        collision: "overlap", // Can be overlapped by anything
      },
      BEHAVE: {
        movement: "static",
        interactive: "none",
      },
      APPEAR: {
        prominence: "subtle",
        style: "minimal",
      },
      ADAPT: {
        scale: "fluid",
        priority: 0,
      },
    };
  }

  /**
   * LISA-style Intent Compiler
   * Translates natural language descriptions to intents
   */
  static fromDescription(description: string): LayoutIntent {
    const lower = description.toLowerCase();

    // Parse common patterns
    if (lower.includes("corner") && lower.includes("never overlap")) {
      const corner = this.extractCorner(lower);
      return this.CORNER_BUTTON(corner);
    }

    if (lower.includes("spread out") && lower.includes("without overlapping")) {
      const region = this.extractRegion(lower);
      return this.TEST_GRID(region);
    }

    if (lower.includes("center") && lower.includes("impossible to miss")) {
      return this.HERO_ELEMENT();
    }

    if (lower.includes("bottom") && lower.includes("line up")) {
      return this.BOTTOM_TOOLBAR();
    }

    if (lower.includes("debug") && lower.includes("get out of the way")) {
      return this.DEBUG_PANEL();
    }

    if (lower.includes("follow") && lower.includes("cursor")) {
      return this.FOLLOW_CURSOR();
    }

    if (lower.includes("tooltip") && lower.includes("near")) {
      return this.TOOLTIP("target"); // Would need to parse target ID
    }

    if (lower.includes("flowing") || lower.includes("natural layout")) {
      return this.CONTENT_FLOW();
    }

    if (lower.includes("background") && lower.includes("not interfere")) {
      return this.BACKGROUND_DECORATION();
    }

    // Default fallback
    console.warn(`Could not parse layout description: "${description}"`);
    return this.CONTENT_FLOW();
  }

  private static extractCorner(
    description: string,
  ): "top-left" | "top-right" | "bottom-left" | "bottom-right" {
    if (description.includes("top-right")) return "top-right";
    if (description.includes("top-left")) return "top-left";
    if (description.includes("bottom-right")) return "bottom-right";
    if (description.includes("bottom-left")) return "bottom-left";
    if (description.includes("top")) return "top-right";
    if (description.includes("bottom")) return "bottom-right";
    return "top-right";
  }

  private static extractRegion(description: string): string {
    if (description.includes("top")) return "top";
    if (description.includes("bottom")) return "bottom";
    if (description.includes("left")) return "left";
    if (description.includes("right")) return "right";
    return "center";
  }
}

/**
 * Intent-based Layout Examples
 *
 * Instead of:
 * ```
 * button.x = width - 30;
 * button.y = 30;
 * ```
 *
 * You write:
 * ```
 * layoutEngine.register('debugButton', button,
 *   IntentLibrary.CORNER_BUTTON('top-right')
 * );
 * ```
 *
 * Or even:
 * ```
 * layoutEngine.register('debugButton', button,
 *   IntentLibrary.fromDescription(
 *     "I want this button to stay in the top-right corner, never overlapping anything"
 *   )
 * );
 * ```
 */
