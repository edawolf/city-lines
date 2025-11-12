import { Container, Graphics, Text } from "pixi.js";
import type { TuningSystem } from "./TuningSystem";
import { TUNING_CATEGORIES, type ControlWidget } from "./TuningConfig";

/**
 * TuningDebugMenu
 *
 * Tabbed interface for adjusting game parameters in real-time.
 * Activated with tilde (~) key.
 */
export class TuningDebugMenu extends Container {
  private tuningSystem: TuningSystem;
  private background!: Graphics;
  private currentTab = 0;
  private tabs: string[] = [];
  private tabButtons: Container[] = [];
  private contentContainer!: Container;
  private controlWidgets: Map<string, any> = new Map();

  constructor(tuningSystem: TuningSystem, width: number, height: number) {
    super();
    this.tuningSystem = tuningSystem;
    this.tabs = Object.keys(TUNING_CATEGORIES);

    this.createUI(width, height);
    this.visible = false;
  }

  /**
   * Create the debug menu UI
   */
  private createUI(width: number, height: number): void {
    // Semi-transparent dark background
    this.background = new Graphics()
      .rect(0, 0, width, height)
      .fill({ color: 0x000000, alpha: 0.95 });
    this.addChild(this.background);

    // Title
    const title = new Text({
      text: "🎮 Ludemic Tuning Knobs",
      style: {
        fontSize: 28,
        fill: 0xffd700,
        fontFamily: "monospace",
        fontWeight: "bold",
      },
    });
    title.position.set(40, 30);
    this.addChild(title);

    // Subtitle
    const subtitle = new Text({
      text: "Press ~ to close | Changes apply immediately",
      style: {
        fontSize: 14,
        fill: 0xaaaaaa,
        fontFamily: "monospace",
      },
    });
    subtitle.position.set(40, 65);
    this.addChild(subtitle);

    // Tab bar
    this.createTabBar(40, 100, width - 80);

    // Content area
    this.contentContainer = new Container();
    this.contentContainer.position.set(40, 160);
    this.addChild(this.contentContainer);

    // Quick actions at bottom
    this.createQuickActions(40, height - 80, width - 80);

    // Show first tab
    this.showTab(0);
  }

  /**
   * Create tab navigation bar
   */
  private createTabBar(x: number, y: number, width: number): void {
    const tabWidth = width / this.tabs.length;

    this.tabs.forEach((tabName, index) => {
      const tabButton = this.createTabButton(
        tabName,
        x + index * tabWidth,
        y,
        tabWidth,
        index,
      );
      this.tabButtons.push(tabButton);
      this.addChild(tabButton);
    });
  }

  /**
   * Create individual tab button
   */
  private createTabButton(
    label: string,
    x: number,
    y: number,
    width: number,
    index: number,
  ): Container {
    const tab = new Container();
    tab.position.set(x, y);
    tab.eventMode = "static";
    tab.cursor = "pointer";

    const bg = new Graphics()
      .rect(0, 0, width - 10, 40)
      .fill(index === this.currentTab ? 0x444444 : 0x222222);

    const text = new Text({
      text: label,
      style: {
        fontSize: 14,
        fill: index === this.currentTab ? 0xffffff : 0xaaaaaa,
        fontFamily: "monospace",
      },
    });
    text.anchor.set(0.5);
    text.position.set(width / 2 - 5, 20);

    tab.addChild(bg, text);

    // Click handler
    tab.on("pointerdown", () => {
      this.showTab(index);
    });

    return tab;
  }

  /**
   * Show specific tab content
   */
  private showTab(index: number): void {
    this.currentTab = index;

    // Update tab button styles
    this.tabButtons.forEach((tab, i) => {
      const bg = tab.children[0] as Graphics;
      const text = tab.children[1] as Text;

      bg.clear().rect(
        0,
        0,
        (this.background.width - 80) / this.tabs.length - 10,
        40,
      );
      bg.fill(i === index ? 0x444444 : 0x222222);
      text.style.fill = i === index ? 0xffffff : 0xaaaaaa;
    });

    // Clear and rebuild content
    this.contentContainer.removeChildren();
    this.renderTabContent(this.tabs[index]);
  }

  /**
   * Render content for current tab
   */
  private renderTabContent(tabName: string): void {
    const controls = TUNING_CATEGORIES[tabName];
    let yOffset = 0;

    controls.forEach((control) => {
      const widget = this.createControlWidget(control, yOffset);
      this.contentContainer.addChild(widget);
      yOffset += 60;
    });
  }

  /**
   * Create control widget based on type
   */
  private createControlWidget(control: ControlWidget, y: number): Container {
    const widget = new Container();
    widget.position.set(0, y);

    // Label
    const label = new Text({
      text: control.label,
      style: {
        fontSize: 16,
        fill: 0xffffff,
        fontFamily: "monospace",
      },
    });
    label.position.set(0, 0);
    widget.addChild(label);

    // Description
    if (control.description) {
      const desc = new Text({
        text: control.description,
        style: {
          fontSize: 12,
          fill: 0xaaaaaa,
          fontFamily: "monospace",
        },
      });
      desc.position.set(0, 22);
      widget.addChild(desc);
    }

    // Current value display
    const currentValue = this.tuningSystem.getParameter(control.key);
    const valueText = new Text({
      text: String(currentValue),
      style: {
        fontSize: 16,
        fill: 0x00ff00,
        fontFamily: "monospace",
        fontWeight: "bold",
      },
    });
    valueText.position.set(300, 0);
    widget.addChild(valueText);

    // Control input (simplified - would need proper HTML overlay for real sliders)
    if (control.type === "slider") {
      const sliderBg = new Graphics().rect(400, 8, 300, 4).fill(0x444444);
      widget.addChild(sliderBg);

      const min = control.min ?? 0;
      const max = control.max ?? 100;
      const range = max - min;
      const normalizedValue = ((currentValue as number) - min) / range;

      const sliderFill = new Graphics()
        .rect(400, 8, 300 * normalizedValue, 4)
        .fill(0x00ff00);
      widget.addChild(sliderFill);

      // Note: Real slider interaction would require HTML overlay or more complex input handling
      widget.eventMode = "static";
      widget.cursor = "pointer";
      widget.on("pointerdown", () => {
        console.log(
          `[TuningDebugMenu] Clicked ${control.label} - would open slider input`,
        );
        // In a full implementation, this would open an input overlay
      });
    } else if (control.type === "toggle") {
      const toggleBg = new Graphics()
        .rect(400, 4, 50, 24)
        .fill(currentValue ? 0x00aa00 : 0x444444);
      widget.addChild(toggleBg);

      const toggleText = new Text({
        text: currentValue ? "ON" : "OFF",
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: "monospace",
        },
      });
      toggleText.position.set(currentValue ? 410 : 408, 6);
      widget.addChild(toggleText);

      widget.eventMode = "static";
      widget.cursor = "pointer";
      widget.on("pointerdown", () => {
        const newValue = !currentValue;
        this.tuningSystem.setParameter(control.key, newValue as any);
        this.showTab(this.currentTab); // Refresh display
      });
    }

    return widget;
  }

  /**
   * Create quick action buttons
   */
  private createQuickActions(x: number, y: number, width: number): void {
    const buttonWidth = (width - 30) / 4;

    const actions = [
      { label: "Reset to Defaults", action: () => this.resetDefaults() },
      { label: "Save Config", action: () => this.saveConfig() },
      { label: "Load Config", action: () => this.loadConfig() },
      { label: "Download JSON", action: () => this.downloadConfig() },
    ];

    actions.forEach((action, index) => {
      const button = this.createButton(
        action.label,
        x + index * (buttonWidth + 10),
        y,
        buttonWidth,
        action.action,
      );
      this.addChild(button);
    });
  }

  /**
   * Create button
   */
  private createButton(
    label: string,
    x: number,
    y: number,
    width: number,
    callback: () => void,
  ): Container {
    const button = new Container();
    button.position.set(x, y);
    button.eventMode = "static";
    button.cursor = "pointer";

    const bg = new Graphics().rect(0, 0, width, 40).fill(0x444444);

    const text = new Text({
      text: label,
      style: {
        fontSize: 14,
        fill: 0xffffff,
        fontFamily: "monospace",
      },
    });
    text.anchor.set(0.5);
    text.position.set(width / 2, 20);

    button.addChild(bg, text);

    button.on("pointerdown", callback);

    return button;
  }

  /**
   * Toggle menu visibility
   */
  toggle(): void {
    this.visible = !this.visible;
    if (this.visible) {
      this.showTab(this.currentTab); // Refresh when opening
    }
  }

  /**
   * Quick actions
   */
  private resetDefaults(): void {
    this.tuningSystem.resetToDefaults();
    this.showTab(this.currentTab); // Refresh display
    console.log("[TuningDebugMenu] Reset to defaults");
  }

  private saveConfig(): void {
    console.log("[TuningDebugMenu] Config auto-saved to localStorage");
  }

  private loadConfig(): void {
    // In a full implementation, this would open file picker
    console.log("[TuningDebugMenu] Load config - would open file picker");
  }

  private downloadConfig(): void {
    this.tuningSystem.downloadConfig();
  }

  /**
   * Handle window resize
   */
  resize(width: number, height: number): void {
    if (this.background) {
      this.background
        .clear()
        .rect(0, 0, width, height)
        .fill({ color: 0x000000, alpha: 0.95 });
    }
  }
}
