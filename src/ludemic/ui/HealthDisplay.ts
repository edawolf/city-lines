import { Container, Graphics, Text } from "pixi.js";

/**
 * HealthDisplay UI Component
 *
 * Displays player health/lives as hearts.
 * Updates automatically when health changes via game events.
 */
export class HealthDisplay extends Container {
  private hearts: Graphics[] = [];
  private label: Text;
  private maxHealth: number;
  private currentHealth: number;

  constructor() {
    super();

    this.maxHealth = 3;
    this.currentHealth = 3;

    // Label
    this.label = new Text({
      text: "Lives:",
      style: {
        fontSize: 18,
        fill: 0xffffff,
        fontFamily: "monospace",
        fontWeight: "bold",
      },
    });
    this.addChild(this.label);

    // Create heart graphics
    this.updateHearts();
  }

  /**
   * Update health display
   */
  setHealth(current: number, max: number): void {
    this.currentHealth = current;
    this.maxHealth = max;
    this.updateHearts();
  }

  /**
   * Update heart visuals
   */
  private updateHearts(): void {
    // Remove old hearts
    this.hearts.forEach((heart) => {
      this.removeChild(heart);
      heart.destroy();
    });
    this.hearts = [];

    // Create new hearts
    for (let i = 0; i < this.maxHealth; i++) {
      const heart = this.createHeart(i < this.currentHealth);
      heart.position.set(70 + i * 30, 0);
      this.addChild(heart);
      this.hearts.push(heart);
    }
  }

  /**
   * Create a heart graphic
   */
  private createHeart(filled: boolean): Graphics {
    const heart = new Graphics();

    if (filled) {
      // Filled heart (alive)
      heart
        .moveTo(0, -6)
        .bezierCurveTo(-5, -11, -10, -11, -10, -6)
        .bezierCurveTo(-10, -1, -5, 3, 0, 8)
        .bezierCurveTo(5, 3, 10, -1, 10, -6)
        .bezierCurveTo(10, -11, 5, -11, 0, -6)
        .fill(0xff0000); // Red
    } else {
      // Empty heart (lost)
      heart
        .moveTo(0, -6)
        .bezierCurveTo(-5, -11, -10, -11, -10, -6)
        .bezierCurveTo(-10, -1, -5, 3, 0, 8)
        .bezierCurveTo(5, 3, 10, -1, 10, -6)
        .bezierCurveTo(10, -11, 5, -11, 0, -6)
        .stroke({ width: 2, color: 0x666666 }); // Gray outline
    }

    return heart;
  }

  /**
   * Animate heart loss
   */
  animateLoss(): void {
    const lostHeart = this.hearts[this.currentHealth];
    if (lostHeart) {
      // Simple pulse animation
      lostHeart.scale.set(1.5);
      setTimeout(() => {
        if (lostHeart) {
          lostHeart.scale.set(1.0);
        }
      }, 200);
    }
  }

  /**
   * Reset health display
   */
  reset(maxHealth: number = 3): void {
    this.currentHealth = maxHealth;
    this.maxHealth = maxHealth;
    this.updateHearts();
  }
}
