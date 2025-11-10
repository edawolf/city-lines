import { Container, Text } from "pixi.js";

/**
 * ComboDisplay UI Component
 *
 * Displays current combo count and score multiplier.
 * Updates automatically when combo changes via game events.
 */
export class ComboDisplay extends Container {
  private comboText: Text;
  private multText: Text;
  private currentCombo = 0;
  private currentMult = 1.0;

  constructor() {
    super();

    // Combo count text
    this.comboText = new Text({
      text: "Combo: 0",
      style: {
        fontSize: 18,
        fill: 0xffffff,
        fontFamily: "monospace",
        fontWeight: "bold",
      },
    });
    this.addChild(this.comboText);

    // Multiplier text (larger, more prominent)
    this.multText = new Text({
      text: "1.0x",
      style: {
        fontSize: 32,
        fill: 0xff6f00, // Orange
        fontFamily: "monospace",
        fontWeight: "bold",
      },
    });
    this.multText.position.set(0, 25);
    this.addChild(this.multText);
  }

  /**
   * Update combo display
   */
  setCombo(combo: number, mult: number): void {
    this.currentCombo = combo;
    this.currentMult = mult;

    this.comboText.text = `Combo: ${combo}`;
    this.multText.text = `${mult.toFixed(1)}x`;

    // Change color based on multiplier
    if (mult >= 4.0) {
      this.multText.style.fill = 0xff0000; // Red - max combo!
    } else if (mult >= 3.0) {
      this.multText.style.fill = 0xff6f00; // Orange - high combo
    } else if (mult >= 2.0) {
      this.multText.style.fill = 0xffeb3b; // Yellow - medium combo
    } else {
      this.multText.style.fill = 0xffffff; // White - low combo
    }

    // Pulse scale when combo increases
    if (combo > 0) {
      this.multText.scale.set(1.2);
      setTimeout(() => {
        if (this.multText) {
          this.multText.scale.set(1.0);
        }
      }, 100);
    }
  }

  /**
   * Reset combo display
   */
  reset(): void {
    this.currentCombo = 0;
    this.currentMult = 1.0;
    this.comboText.text = "Combo: 0";
    this.multText.text = "1.0x";
    this.multText.style.fill = 0xffffff;
  }

  /**
   * Show combo display (fade in)
   */
  show(): void {
    this.visible = true;
    this.alpha = 0;

    // Simple fade in
    const fadeIn = () => {
      if (this.alpha < 1) {
        this.alpha += 0.1;
        requestAnimationFrame(fadeIn);
      }
    };
    fadeIn();
  }

  /**
   * Hide combo display (fade out)
   */
  hide(): void {
    const fadeOut = () => {
      if (this.alpha > 0) {
        this.alpha -= 0.1;
        requestAnimationFrame(fadeOut);
      } else {
        this.visible = false;
      }
    };
    fadeOut();
  }
}
