/**
 * TrafficLightAnimation - Animated traffic light that pops up on level complete
 *
 * Animation sequence:
 * 1. Red traffic light slides up from bottom of screen
 * 2. Stays in center for 1 second
 * 3. Swaps to green traffic light
 * 4. Slides back down off screen
 */

import { Container, Sprite, Assets } from "pixi.js";

export class TrafficLightAnimation extends Container {
  private redSprite?: Sprite;
  private greenSprite?: Sprite;
  private isAnimating = false;
  private viewportWidth = 0;
  private viewportHeight = 0;

  constructor() {
    super();
  }

  /**
   * Load traffic light assets
   */
  async loadAssets(): Promise<void> {
    try {
      // Load both traffic light images
      const redTexture = await Assets.load(
        "/assets/main/images/traffic-red.png",
      );
      const greenTexture = await Assets.load(
        "/assets/main/images/traffic-green.png",
      );

      // Create sprites
      this.redSprite = new Sprite(redTexture);
      this.greenSprite = new Sprite(greenTexture);

      // Center anchor points
      this.redSprite.anchor.set(0.5);
      this.greenSprite.anchor.set(0.5);

      // Initially hide both
      this.redSprite.visible = false;
      this.greenSprite.visible = false;

      // Add to container
      this.addChild(this.redSprite);
      this.addChild(this.greenSprite);
    } catch (error) {
      console.error("[TrafficLightAnimation] ❌ Failed to load assets:", error);
    }
  }

  /**
   * Update viewport dimensions
   */
  resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  /**
   * Play the traffic light animation
   */
  async play(): Promise<void> {
    if (this.isAnimating) {
      console.warn("[TrafficLightAnimation] Animation already in progress");
      return;
    }

    if (!this.redSprite || !this.greenSprite) {
      console.error("[TrafficLightAnimation] Sprites not loaded!");
      return;
    }

    this.isAnimating = true;

    const centerX = this.viewportWidth / 2;
    const centerY = this.viewportHeight / 1.2;
    const startY = this.viewportHeight + 100; // Start below screen
    const endY = this.viewportHeight + 300; // End below screen

    // Phase 1: Slide red light UP from bottom to center
    this.redSprite.visible = true;
    this.redSprite.position.set(centerX, startY);

    await this.animateSlide(this.redSprite, centerX, centerY, 500); // 500ms slide up

    // Phase 2: INSTANT swap to green (no pause with red)
    this.redSprite.visible = false;
    this.greenSprite.visible = true;
    this.greenSprite.position.set(centerX, centerY);

    // Phase 3: Wait 1 second with GREEN light visible
    await this.wait(400);

    // Phase 4: Slide green light DOWN to bottom
    await this.animateSlide(this.greenSprite, centerX, endY, 700); // 700ms slide down

    // Hide green sprite
    this.greenSprite.visible = false;

    this.isAnimating = false;
  }

  /**
   * Animate sprite sliding from current position to target
   */
  private animateSlide(
    sprite: Sprite,
    targetX: number,
    targetY: number,
    duration: number,
  ): Promise<void> {
    return new Promise((resolve) => {
      const startX = sprite.x;
      const startY = sprite.y;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / duration);

        // Ease-out cubic for smooth deceleration
        const eased = 1 - Math.pow(1 - progress, 3);

        sprite.x = startX + (targetX - startX) * eased;
        sprite.y = startY + (targetY - startY) * eased;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Wait for specified milliseconds
   */
  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if animation is currently playing
   */
  isPlaying(): boolean {
    return this.isAnimating;
  }

  /**
   * Clean up
   */
  override destroy(): void {
    this.redSprite?.destroy();
    this.greenSprite?.destroy();
    super.destroy();
  }
}
