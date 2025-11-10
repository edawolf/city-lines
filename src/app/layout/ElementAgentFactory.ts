import { Container } from "pixi.js";
import {
  LayoutIntelligenceSystem,
  ElementRole,
  AgentPersonality,
} from "./LayoutIntelligence";

/**
 * Element Agent Factory - Specialized AI agents for different UI element types
 * Auto-detects element types and assigns appropriate AI behaviors
 */

export class ElementAgentFactory {
  private intelligence: LayoutIntelligenceSystem;

  constructor(intelligence: LayoutIntelligenceSystem) {
    this.intelligence = intelligence;
  }

  /**
   * Auto-register an element by analyzing its properties and context
   */
  public autoRegister(
    id: string,
    element: Container,
    context?: ElementContext,
  ): void {
    const analysis = this.analyzeElement(id, element, context);

    console.log(`🔍 Auto-analyzing element "${id}":`, analysis);

    this.intelligence.registerAgent(
      id,
      element,
      analysis.role,
      analysis.personality,
    );
  }

  /**
   * Analyze an element to determine its role and personality
   */
  private analyzeElement(
    id: string,
    element: Container,
    context?: ElementContext,
  ): ElementAnalysis {
    element.getBounds();
    // const _size = bounds.width * bounds.height;
    // const _aspectRatio = bounds.width / bounds.height;

    // Analyze by ID patterns
    const roleFromId = this.analyzeById(id);
    if (roleFromId) {
      return {
        role: roleFromId,
        personality: this.getPersonalityForRole(roleFromId),
        confidence: 0.9,
        reasoning: `Identified by ID pattern: ${id}`,
      };
    }

    // Analyze by position
    const roleFromPosition = this.analyzeByPosition(element);
    if (roleFromPosition) {
      return {
        role: roleFromPosition.role,
        personality: roleFromPosition.personality,
        confidence: roleFromPosition.confidence,
        reasoning: roleFromPosition.reasoning,
      };
    }

    // Analyze by size and properties
    const roleFromSize = this.analyzeBySize(element);
    if (roleFromSize) {
      return {
        role: roleFromSize.role,
        personality: roleFromSize.personality,
        confidence: roleFromSize.confidence,
        reasoning: roleFromSize.reasoning,
      };
    }

    // Analyze by context
    if (context) {
      const roleFromContext = this.analyzeByContext(context);
      if (roleFromContext) {
        return roleFromContext;
      }
    }

    // Default fallback
    return {
      role: "wanderer",
      personality: this.getPersonalityForRole("wanderer"),
      confidence: 0.3,
      reasoning:
        "Default assignment - insufficient information for classification",
    };
  }

  /**
   * Analyze element role by ID patterns
   */
  private analyzeById(id: string): ElementRole | null {
    const lower = id.toLowerCase();

    // Button patterns
    if (lower.includes("button") || lower.includes("btn")) {
      if (lower.includes("debug") || lower.includes("dev")) return "scout";
      if (lower.includes("close") || lower.includes("back")) return "sentinel";
      if (lower.includes("menu") || lower.includes("nav")) return "anchor";
      if (lower.includes("cta") || lower.includes("primary")) return "merchant";
      return "guardian";
    }

    // Navigation elements
    if (
      lower.includes("nav") ||
      lower.includes("menu") ||
      lower.includes("header")
    ) {
      return "anchor";
    }

    // Debug and info elements
    if (
      lower.includes("debug") ||
      lower.includes("info") ||
      lower.includes("stat")
    ) {
      return "scout";
    }

    // Modal and overlay elements
    if (
      lower.includes("modal") ||
      lower.includes("overlay") ||
      lower.includes("popup")
    ) {
      return "diplomat";
    }

    // Background and decorative elements
    if (
      lower.includes("bg") ||
      lower.includes("background") ||
      lower.includes("decoration")
    ) {
      return "invisible";
    }

    // Tooltip and helper elements
    if (
      lower.includes("tooltip") ||
      lower.includes("help") ||
      lower.includes("hint")
    ) {
      return "follower";
    }

    // List and grid items
    if (
      lower.includes("item") ||
      lower.includes("card") ||
      lower.includes("tile")
    ) {
      return "crowd";
    }

    // Corner positioned elements
    if (
      lower.includes("corner") ||
      lower.includes("tl") ||
      lower.includes("tr") ||
      lower.includes("bl") ||
      lower.includes("br")
    ) {
      return "anchor";
    }

    return null;
  }

  /**
   * Analyze element role by screen position
   */
  private analyzeByPosition(element: Container): ElementAnalysis | null {
    const bounds = element.getBounds();

    // Get viewport dimensions (assuming we have access)
    const viewportWidth = 800; // Default, should be injected
    const viewportHeight = 600; // Default, should be injected

    const x = bounds.x;
    const y = bounds.y;
    const right = x + bounds.width;
    const bottom = y + bounds.height;

    // Corner detection
    const isNearLeftEdge = x < 100;
    const isNearRightEdge = right > viewportWidth - 100;
    const isNearTopEdge = y < 100;
    const isNearBottomEdge = bottom > viewportHeight - 100;

    if (
      (isNearLeftEdge || isNearRightEdge) &&
      (isNearTopEdge || isNearBottomEdge)
    ) {
      return {
        role: "anchor",
        personality: {
          ...this.getPersonalityForRole("anchor"),
          stability: 0.95, // Corner elements should be very stable
        },
        confidence: 0.8,
        reasoning: "Positioned in screen corner",
      };
    }

    // Edge detection
    if (
      isNearLeftEdge ||
      isNearRightEdge ||
      isNearTopEdge ||
      isNearBottomEdge
    ) {
      return {
        role: "sentinel",
        personality: this.getPersonalityForRole("sentinel"),
        confidence: 0.7,
        reasoning: "Positioned near screen edge",
      };
    }

    // Center detection
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;
    const distanceFromCenter = Math.sqrt(
      Math.pow(x + bounds.width / 2 - centerX, 2) +
        Math.pow(y + bounds.height / 2 - centerY, 2),
    );

    if (distanceFromCenter < 150) {
      return {
        role: "guardian",
        personality: {
          ...this.getPersonalityForRole("guardian"),
          attention_seeking: 0.9, // Center elements want attention
        },
        confidence: 0.6,
        reasoning: "Positioned near screen center",
      };
    }

    return null;
  }

  /**
   * Analyze element role by size characteristics
   */
  private analyzeBySize(element: Container): ElementAnalysis | null {
    const bounds = element.getBounds();
    const area = bounds.width * bounds.height;
    const aspectRatio = bounds.width / bounds.height;

    // Very small elements (likely icons or indicators)
    if (area < 1000) {
      return {
        role: "scout",
        personality: {
          ...this.getPersonalityForRole("scout"),
          territoriality: 0.05, // Small elements don't need much space
        },
        confidence: 0.5,
        reasoning: "Very small size suggests indicator or icon",
      };
    }

    // Very large elements (likely backgrounds or main content)
    if (area > 50000) {
      return {
        role: "invisible",
        personality: this.getPersonalityForRole("invisible"),
        confidence: 0.6,
        reasoning: "Large size suggests background or container element",
      };
    }

    // Button-like aspect ratio (roughly square or wide rectangle)
    if (aspectRatio > 1.5 && aspectRatio < 4 && area > 2000 && area < 15000) {
      return {
        role: "guardian",
        personality: this.getPersonalityForRole("guardian"),
        confidence: 0.4,
        reasoning: "Size and aspect ratio suggest interactive button",
      };
    }

    return null;
  }

  /**
   * Analyze element role by provided context
   */
  private analyzeByContext(context: ElementContext): ElementAnalysis | null {
    if (context.interactivity) {
      if (context.interactivity.includes("click")) {
        return {
          role: "guardian",
          personality: this.getPersonalityForRole("guardian"),
          confidence: 0.8,
          reasoning: "Interactive element with click functionality",
        };
      }

      if (context.interactivity.includes("hover")) {
        return {
          role: "follower",
          personality: this.getPersonalityForRole("follower"),
          confidence: 0.7,
          reasoning: "Hover-interactive element suggests tooltip or helper",
        };
      }
    }

    if (context.purpose) {
      const purpose = context.purpose.toLowerCase();

      if (purpose.includes("debug") || purpose.includes("info")) {
        return {
          role: "scout",
          personality: this.getPersonalityForRole("scout"),
          confidence: 0.9,
          reasoning: "Context indicates debug or informational purpose",
        };
      }

      if (purpose.includes("navigation") || purpose.includes("menu")) {
        return {
          role: "anchor",
          personality: this.getPersonalityForRole("anchor"),
          confidence: 0.9,
          reasoning: "Context indicates navigation purpose",
        };
      }

      if (purpose.includes("decoration") || purpose.includes("background")) {
        return {
          role: "invisible",
          personality: this.getPersonalityForRole("invisible"),
          confidence: 0.9,
          reasoning: "Context indicates decorative purpose",
        };
      }
    }

    return null;
  }

  /**
   * Get default personality for a role
   */
  private getPersonalityForRole(role: ElementRole): AgentPersonality {
    const personalities: Record<ElementRole, AgentPersonality> = {
      guardian: {
        territoriality: 0.9,
        cooperation: 0.3,
        attention_seeking: 0.8,
        stability: 0.9,
        social: 0.2,
        independence: 0.8,
      },
      scout: {
        territoriality: 0.1,
        cooperation: 0.9,
        attention_seeking: 0.3,
        stability: 0.2,
        social: 0.8,
        independence: 0.6,
      },
      diplomat: {
        territoriality: 0.6,
        cooperation: 0.9,
        attention_seeking: 0.7,
        stability: 0.5,
        social: 0.9,
        independence: 0.3,
      },
      wanderer: {
        territoriality: 0.2,
        cooperation: 0.8,
        attention_seeking: 0.4,
        stability: 0.1,
        social: 0.6,
        independence: 0.9,
      },
      anchor: {
        territoriality: 0.9,
        cooperation: 0.4,
        attention_seeking: 0.6,
        stability: 1.0,
        social: 0.3,
        independence: 0.9,
      },
      follower: {
        territoriality: 0.3,
        cooperation: 0.8,
        attention_seeking: 0.5,
        stability: 0.3,
        social: 0.9,
        independence: 0.1,
      },
      crowd: {
        territoriality: 0.4,
        cooperation: 0.9,
        attention_seeking: 0.5,
        stability: 0.6,
        social: 0.9,
        independence: 0.2,
      },
      sentinel: {
        territoriality: 0.8,
        cooperation: 0.5,
        attention_seeking: 0.3,
        stability: 0.9,
        social: 0.4,
        independence: 0.7,
      },
      merchant: {
        territoriality: 0.7,
        cooperation: 0.4,
        attention_seeking: 1.0,
        stability: 0.6,
        social: 0.6,
        independence: 0.5,
      },
      invisible: {
        territoriality: 0.0,
        cooperation: 1.0,
        attention_seeking: 0.0,
        stability: 0.8,
        social: 0.1,
        independence: 0.3,
      },
    };

    return personalities[role];
  }

  /**
   * Create specialized agents for common UI patterns
   */

  public createDebugButton(id: string, element: Container): void {
    this.intelligence.registerAgent(id, element, "scout", {
      territoriality: 0.1,
      cooperation: 0.9,
      attention_seeking: 0.4,
      stability: 0.7,
      social: 0.5,
      independence: 0.8,
    });
  }

  public createMainMenuButton(id: string, element: Container): void {
    this.intelligence.registerAgent(id, element, "guardian", {
      territoriality: 0.8,
      cooperation: 0.3,
      attention_seeking: 0.9,
      stability: 0.8,
      social: 0.2,
      independence: 0.9,
    });
  }

  public createCornerIcon(id: string, element: Container): void {
    this.intelligence.registerAgent(id, element, "anchor", {
      territoriality: 0.9,
      cooperation: 0.2,
      attention_seeking: 0.5,
      stability: 1.0,
      social: 0.1,
      independence: 1.0,
    });
  }

  public createTooltip(
    id: string,
    element: Container,
    _targetId: string,
  ): void {
    this.intelligence.registerAgent(id, element, "follower", {
      territoriality: 0.1,
      cooperation: 1.0,
      attention_seeking: 0.6,
      stability: 0.1,
      social: 1.0,
      independence: 0.0,
    });
  }

  public createTestElement(id: string, element: Container): void {
    this.intelligence.registerAgent(id, element, "crowd", {
      territoriality: 0.3,
      cooperation: 0.8,
      attention_seeking: 0.4,
      stability: 0.5,
      social: 0.7,
      independence: 0.3,
    });
  }

  public createBackground(id: string, element: Container): void {
    this.intelligence.registerAgent(id, element, "invisible", {
      territoriality: 0.0,
      cooperation: 1.0,
      attention_seeking: 0.0,
      stability: 1.0,
      social: 0.0,
      independence: 0.0,
    });
  }

  /**
   * Batch register multiple elements with automatic analysis
   */
  public autoRegisterBatch(
    elements: Array<{
      id: string;
      element: Container;
      context?: ElementContext;
    }>,
  ): void {
    console.log(
      `🤖 Auto-registering ${elements.length} elements as intelligent agents...`,
    );

    for (const { id, element, context } of elements) {
      this.autoRegister(id, element, context);
    }

    console.log(
      `✅ Successfully registered ${elements.length} intelligent agents`,
    );
  }

  /**
   * Get analysis summary for all registered agents
   */
  public getRegistrationSummary(): RegistrationSummary {
    // This would need access to the intelligence system's agents
    return {
      totalAgents: 0,
      roleDistribution: {
        guardian: 0,
        scout: 0,
        diplomat: 0,
        wanderer: 0,
        anchor: 0,
        follower: 0,
        crowd: 0,
        sentinel: 0,
        merchant: 0,
        invisible: 0,
      },
      averageConfidence: 0,
      analysisNotes: [],
    };
  }
}

// Supporting interfaces
export interface ElementContext {
  purpose?: string; // 'debug', 'navigation', 'decoration', etc.
  interactivity?: string[]; // ['click', 'hover', 'drag']
  priority?: "low" | "normal" | "high" | "critical";
  grouping?: string; // Group identifier for related elements
  dependencies?: string[]; // IDs of elements this depends on
  metadata?: Record<string, unknown>; // Additional context data
}

interface ElementAnalysis {
  role: ElementRole;
  personality: AgentPersonality;
  confidence: number;
  reasoning: string;
}

interface RegistrationSummary {
  totalAgents: number;
  roleDistribution: Record<ElementRole, number>;
  averageConfidence: number;
  analysisNotes: string[];
}

/**
 * Usage Examples:
 *
 * ```typescript
 * const intelligence = new LayoutIntelligenceSystem();
 * const factory = new ElementAgentFactory(intelligence);
 *
 * // Auto-detect and register
 * factory.autoRegister('debugButton', myButton);
 *
 * // Specialized registration
 * factory.createDebugButton('debugBtn', debugButton);
 * factory.createCornerIcon('settingsIcon', settingsButton);
 *
 * // Batch registration
 * factory.autoRegisterBatch([
 *   { id: 'header', element: headerElement, context: { purpose: 'navigation' }},
 *   { id: 'tooltip', element: tooltipElement, context: { purpose: 'help', interactivity: ['hover'] }}
 * ]);
 *
 * // Get intelligence report
 * const report = intelligence.generateIntelligenceReport();
 * console.log(report);
 * ```
 */
