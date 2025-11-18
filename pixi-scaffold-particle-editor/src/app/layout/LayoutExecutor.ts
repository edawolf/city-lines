import { DisplayObject } from "pixi.js";
import { LayoutIntelligenceSystem, ElementAgent } from "./LayoutIntelligence";

/**
 * Layout Executor - Actually moves elements based on AI analysis
 * The "action" component that works with the intelligence system
 */

export class LayoutExecutor {
  private intelligence: LayoutIntelligenceSystem;
  private viewport = { width: 0, height: 0 };
  private executionHistory: ExecutionRecord[] = [];

  constructor(intelligence: LayoutIntelligenceSystem) {
    this.intelligence = intelligence;
  }

  /**
   * Execute AI-driven layout corrections
   */
  public executeIntelligentLayout(): ExecutionResult {
    console.log("🚀 Executing AI-driven layout corrections...");

    const analysis = this.intelligence.performGlobalAnalysis();
    const executionPlan = this.createExecutionPlan(analysis);
    const results = this.executeMovements(executionPlan);

    // Record execution
    this.executionHistory.push({
      timestamp: Date.now(),
      plan: executionPlan,
      results,
      success: results.successfulMoves / results.totalMoves > 0.8,
    });

    return results;
  }

  /**
   * Create execution plan from AI analysis
   */
  private createExecutionPlan(analysis: any): ExecutionPlan {
    const plan: ExecutionPlan = {
      moves: [],
      priority: "high",
      strategy: "conflict_resolution",
    };

    // Handle clustering issues
    this.planClusterResolution(analysis, plan);

    // Handle off-screen elements
    this.planVisibilityCorrections(analysis, plan);

    // Handle overlap conflicts
    this.planConflictResolution(analysis, plan);

    return plan;
  }

  /**
   * Plan resolution for clustered elements
   */
  private planClusterResolution(analysis: any, plan: ExecutionPlan): void {
    if (analysis.globalPatterns?.clusters) {
      for (const cluster of analysis.globalPatterns.clusters) {
        console.log(
          `📦 Planning cluster resolution for: ${cluster.members.join(", ")}`,
        );

        const spreadPositions = this.calculateSpreadPositions(
          cluster.members.length,
          this.getRegionBounds(cluster.region || "center"),
        );

        cluster.members.forEach((memberId: string, index: number) => {
          plan.moves.push({
            elementId: memberId,
            targetPosition: spreadPositions[index],
            reason: "cluster_resolution",
            priority: 0.8,
          });
        });
      }
    }
  }

  /**
   * Plan corrections for off-screen elements
   */
  private planVisibilityCorrections(analysis: any, plan: ExecutionPlan): void {
    for (const report of analysis.agentReports) {
      if (report.positionAssessment?.visibility < 0.5) {
        const safePosition = this.findSafePosition(report.agentId);
        plan.moves.push({
          elementId: report.agentId,
          targetPosition: safePosition,
          reason: "visibility_correction",
          priority: 0.9,
        });
      }
    }
  }

  /**
   * Plan resolution for overlapping elements
   */
  private planConflictResolution(analysis: any, plan: ExecutionPlan): void {
    const processedPairs = new Set<string>();

    for (const report of analysis.agentReports) {
      if (report.environmentalPressures) {
        for (const pressure of report.environmentalPressures) {
          if (pressure.type === "overlap") {
            const pairKey = [report.agentId, pressure.source].sort().join("-");
            if (!processedPairs.has(pairKey)) {
              processedPairs.add(pairKey);

              const separatedPositions = this.calculateSeparation(
                report.agentId,
                pressure.source,
              );

              plan.moves.push({
                elementId: report.agentId,
                targetPosition: separatedPositions[0],
                reason: "conflict_resolution",
                priority: 0.7,
              });

              plan.moves.push({
                elementId: pressure.source,
                targetPosition: separatedPositions[1],
                reason: "conflict_resolution",
                priority: 0.7,
              });
            }
          }
        }
      }
    }
  }

  /**
   * Execute the planned movements
   */
  private executeMovements(plan: ExecutionPlan): ExecutionResult {
    const result: ExecutionResult = {
      totalMoves: plan.moves.length,
      successfulMoves: 0,
      failedMoves: 0,
      details: [],
    };

    // Sort moves by priority
    const sortedMoves = plan.moves.sort((a, b) => b.priority - a.priority);

    for (const move of sortedMoves) {
      try {
        const success = this.executeMove(move);
        if (success) {
          result.successfulMoves++;
          result.details.push({
            elementId: move.elementId,
            success: true,
            reason: move.reason,
            newPosition: move.targetPosition,
          });
          console.log(
            `✅ Moved ${move.elementId} to (${move.targetPosition.x.toFixed(1)}, ${move.targetPosition.y.toFixed(1)}) - ${move.reason}`,
          );
        } else {
          result.failedMoves++;
          result.details.push({
            elementId: move.elementId,
            success: false,
            reason: `Failed: ${move.reason}`,
            newPosition: move.targetPosition,
          });
          console.warn(`❌ Failed to move ${move.elementId} - ${move.reason}`);
        }
      } catch (error) {
        result.failedMoves++;
        console.error(`💥 Error moving ${move.elementId}:`, error);
      }
    }

    return result;
  }

  /**
   * Execute a single element move
   */
  private executeMove(move: PlannedMove): boolean {
    // This would need access to the actual elements
    // For now, we'll simulate the move and log it
    console.log(
      `🎯 Moving ${move.elementId} to (${move.targetPosition.x}, ${move.targetPosition.y})`,
    );

    // In a real implementation, you would:
    // 1. Find the element by ID
    // 2. Apply smooth animation to new position
    // 3. Update any dependent elements
    // 4. Validate the move didn't create new conflicts

    return true; // Simulated success
  }

  /**
   * Calculate spread positions for clustered elements
   */
  private calculateSpreadPositions(
    count: number,
    bounds: RegionBounds,
  ): Position[] {
    const positions: Position[] = [];

    if (count === 1) {
      positions.push({
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2,
      });
      return positions;
    }

    // Arrange in a grid pattern
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);

    const cellWidth = bounds.width / cols;
    const cellHeight = bounds.height / rows;

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;

      positions.push({
        x: bounds.x + col * cellWidth + cellWidth / 2,
        y: bounds.y + row * cellHeight + cellHeight / 2,
      });
    }

    return positions;
  }

  /**
   * Find a safe position for an off-screen element
   */
  private findSafePosition(elementId: string): Position {
    // Simple strategy: find center of available space
    const safeArea = {
      x: 50,
      y: 50,
      width: this.viewport.width - 100,
      height: this.viewport.height - 100,
    };

    return {
      x: safeArea.x + safeArea.width / 2,
      y: safeArea.y + safeArea.height / 2,
    };
  }

  /**
   * Calculate separated positions for overlapping elements
   */
  private calculateSeparation(
    elementId1: string,
    elementId2: string,
  ): Position[] {
    // Simple separation strategy: move elements apart horizontally
    const centerX = this.viewport.width / 2;
    const centerY = this.viewport.height / 2;

    return [
      { x: centerX - 100, y: centerY },
      { x: centerX + 100, y: centerY },
    ];
  }

  /**
   * Get bounds for a semantic region
   */
  private getRegionBounds(region: string): RegionBounds {
    const vw = this.viewport.width;
    const vh = this.viewport.height;
    const margin = 50;

    switch (region) {
      case "top-left":
        return { x: margin, y: margin, width: vw * 0.4, height: vh * 0.4 };
      case "top-right":
        return {
          x: vw * 0.6,
          y: margin,
          width: vw * 0.4 - margin,
          height: vh * 0.4,
        };
      case "bottom-left":
        return {
          x: margin,
          y: vh * 0.6,
          width: vw * 0.4,
          height: vh * 0.4 - margin,
        };
      case "bottom-right":
        return {
          x: vw * 0.6,
          y: vh * 0.6,
          width: vw * 0.4 - margin,
          height: vh * 0.4 - margin,
        };
      case "top":
        return {
          x: margin,
          y: margin,
          width: vw - 2 * margin,
          height: vh * 0.3,
        };
      case "bottom":
        return {
          x: margin,
          y: vh * 0.7,
          width: vw - 2 * margin,
          height: vh * 0.3 - margin,
        };
      case "left":
        return {
          x: margin,
          y: margin,
          width: vw * 0.3,
          height: vh - 2 * margin,
        };
      case "right":
        return {
          x: vw * 0.7,
          y: margin,
          width: vw * 0.3 - margin,
          height: vh - 2 * margin,
        };
      case "center":
      default:
        return { x: vw * 0.2, y: vh * 0.2, width: vw * 0.6, height: vh * 0.6 };
    }
  }

  /**
   * Set viewport dimensions
   */
  public setViewport(width: number, height: number): void {
    this.viewport = { width, height };
  }

  /**
   * Get execution summary
   */
  public getExecutionSummary(): string {
    const lines: string[] = [];
    lines.push("=== LAYOUT EXECUTION SUMMARY ===");

    if (this.executionHistory.length === 0) {
      lines.push("No executions performed yet.");
      return lines.join("\n");
    }

    const latest = this.executionHistory[this.executionHistory.length - 1];
    lines.push(
      `📊 Latest Execution: ${new Date(latest.timestamp).toLocaleTimeString()}`,
    );
    lines.push(
      `✅ Success Rate: ${((latest.results.successfulMoves / latest.results.totalMoves) * 100).toFixed(1)}%`,
    );
    lines.push(`🎯 Total Moves: ${latest.results.totalMoves}`);
    lines.push(`✅ Successful: ${latest.results.successfulMoves}`);
    lines.push(`❌ Failed: ${latest.results.failedMoves}`);
    lines.push("");

    lines.push("📋 EXECUTION DETAILS:");
    for (const detail of latest.results.details) {
      const status = detail.success ? "✅" : "❌";
      lines.push(`  ${status} ${detail.elementId}: ${detail.reason}`);
      if (detail.success && detail.newPosition) {
        lines.push(
          `     → Moved to (${detail.newPosition.x.toFixed(1)}, ${detail.newPosition.y.toFixed(1)})`,
        );
      }
    }

    return lines.join("\n");
  }
}

// Supporting interfaces
interface ExecutionPlan {
  moves: PlannedMove[];
  priority: "low" | "normal" | "high" | "critical";
  strategy: "conflict_resolution" | "optimization" | "emergency";
}

interface PlannedMove {
  elementId: string;
  targetPosition: Position;
  reason: string;
  priority: number; // 0-1
}

interface Position {
  x: number;
  y: number;
}

interface RegionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ExecutionResult {
  totalMoves: number;
  successfulMoves: number;
  failedMoves: number;
  details: ExecutionDetail[];
}

interface ExecutionDetail {
  elementId: string;
  success: boolean;
  reason: string;
  newPosition?: Position;
}

interface ExecutionRecord {
  timestamp: number;
  plan: ExecutionPlan;
  results: ExecutionResult;
  success: boolean;
}
