/**
 * TuningControls
 *
 * HTML-based input controls for real-time parameter adjustment.
 * Uses DOM overlay on top of PixiJS canvas for native input widgets.
 */

import type { TuningSystem } from "./TuningSystem";
import type { TuningParameters } from "./TuningConfig";
import { TUNING_CATEGORIES } from "./TuningConfig";

export class TuningControls {
  private container: HTMLDivElement;
  private tuningSystem: TuningSystem;
  private currentCategory = 0;
  private categories = Object.keys(TUNING_CATEGORIES);

  constructor(tuningSystem: TuningSystem) {
    this.tuningSystem = tuningSystem;
    this.container = this.createContainer();
    this.renderControls();
    this.hide();
  }

  /**
   * Create main container element
   */
  private createContainer(): HTMLDivElement {
    const container = document.createElement("div");
    container.id = "tuning-controls";
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      z-index: 10000;
      overflow-y: auto;
      font-family: monospace;
      color: white;
      padding: 40px;
      box-sizing: border-box;
    `;
    document.body.appendChild(container);
    return container;
  }

  /**
   * Render all controls
   */
  private renderControls(): void {
    this.container.innerHTML = "";

    // Title
    const title = document.createElement("h1");
    title.textContent = "🎮 Ludemic Tuning Knobs";
    title.style.cssText = `
      color: #ffd700;
      margin: 0 0 10px 0;
      font-size: 28px;
    `;
    this.container.appendChild(title);

    // Subtitle
    const subtitle = document.createElement("p");
    subtitle.textContent = "Press ~ to close | Changes apply immediately";
    subtitle.style.cssText = `
      color: #aaa;
      margin: 0 0 30px 0;
      font-size: 14px;
    `;
    this.container.appendChild(subtitle);

    // Tab bar
    const tabBar = this.createTabBar();
    this.container.appendChild(tabBar);

    // Content area
    const content = document.createElement("div");
    content.id = "tuning-content";
    content.style.cssText = `
      margin-top: 30px;
      max-width: 800px;
    `;
    // Populate with first tab content
    content.appendChild(this.renderTabContent());
    this.container.appendChild(content);

    // Quick actions
    const actions = this.createQuickActions();
    this.container.appendChild(actions);
  }

  /**
   * Create tab navigation bar
   */
  private createTabBar(): HTMLDivElement {
    const tabBar = document.createElement("div");
    tabBar.style.cssText = `
      display: flex;
      gap: 10px;
      border-bottom: 2px solid #444;
      padding-bottom: 10px;
    `;

    this.categories.forEach((category, index) => {
      const tab = document.createElement("button");
      tab.textContent = category;
      tab.style.cssText = `
        padding: 10px 20px;
        background: ${index === this.currentCategory ? "#444" : "#222"};
        color: ${index === this.currentCategory ? "#fff" : "#aaa"};
        border: none;
        cursor: pointer;
        font-family: monospace;
        font-size: 14px;
      `;
      tab.onclick = () => this.showTab(index);
      tabBar.appendChild(tab);
    });

    return tabBar;
  }

  /**
   * Show specific tab (updates content only, not full re-render)
   */
  private showTab(index: number): void {
    this.currentCategory = index;

    // Update tab button styles
    const tabBar = this.container.querySelector("div");
    if (tabBar) {
      Array.from(tabBar.children).forEach((tab, i) => {
        const button = tab as HTMLButtonElement;
        button.style.background = i === index ? "#444" : "#222";
        button.style.color = i === index ? "#fff" : "#aaa";
      });
    }

    // Update content
    const content = document.getElementById("tuning-content");
    if (content) {
      content.innerHTML = "";
      content.appendChild(this.renderTabContent());
    }
  }

  /**
   * Render content for current tab
   */
  private renderTabContent(): HTMLDivElement {
    const content = document.createElement("div");
    const category = this.categories[this.currentCategory];
    const controls = TUNING_CATEGORIES[category];

    controls.forEach((control) => {
      const widget = document.createElement("div");
      widget.style.cssText = `
        margin-bottom: 30px;
        padding: 20px;
        background: #1a1a1a;
        border-radius: 5px;
      `;

      // Label
      const label = document.createElement("div");
      label.style.cssText = `
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 5px;
      `;
      label.textContent = control.label;
      widget.appendChild(label);

      // Description
      if (control.description) {
        const desc = document.createElement("div");
        desc.style.cssText = `
          font-size: 12px;
          color: #aaa;
          margin-bottom: 15px;
        `;
        desc.textContent = control.description;
        widget.appendChild(desc);
      }

      // Current value
      const currentValue = this.tuningSystem.getParameter(control.key);
      const valueDisplay = document.createElement("div");
      valueDisplay.id = `value-${control.key}`;
      valueDisplay.style.cssText = `
        font-size: 16px;
        color: #0f0;
        font-weight: bold;
        margin-bottom: 10px;
      `;
      valueDisplay.textContent = `Current: ${currentValue}`;
      widget.appendChild(valueDisplay);

      // Input control
      if (control.type === "slider") {
        const inputContainer = document.createElement("div");
        inputContainer.style.cssText = `
          display: flex;
          align-items: center;
          gap: 15px;
        `;

        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = String(control.min ?? 0);
        slider.max = String(control.max ?? 100);
        slider.step = String(control.step ?? 1);
        slider.value = String(currentValue);
        slider.style.cssText = `
          flex: 1;
          height: 30px;
          cursor: pointer;
        `;

        slider.oninput = (e) => {
          const value = parseFloat((e.target as HTMLInputElement).value);
          this.tuningSystem.setParameter(control.key, value as any);
          valueDisplay.textContent = `Current: ${value}`;
        };

        const minLabel = document.createElement("span");
        minLabel.textContent = String(control.min ?? 0);
        minLabel.style.cssText = "color: #888; font-size: 12px;";

        const maxLabel = document.createElement("span");
        maxLabel.textContent = String(control.max ?? 100);
        maxLabel.style.cssText = "color: #888; font-size: 12px;";

        inputContainer.appendChild(minLabel);
        inputContainer.appendChild(slider);
        inputContainer.appendChild(maxLabel);
        widget.appendChild(inputContainer);
      } else if (control.type === "toggle") {
        const toggle = document.createElement("button");
        toggle.textContent = currentValue ? "ON" : "OFF";
        toggle.style.cssText = `
          padding: 10px 30px;
          background: ${currentValue ? "#0a0" : "#444"};
          color: white;
          border: none;
          cursor: pointer;
          font-family: monospace;
          font-size: 16px;
          font-weight: bold;
          border-radius: 5px;
        `;
        toggle.onclick = () => {
          const newValue = !currentValue;
          this.tuningSystem.setParameter(control.key, newValue as any);
          toggle.textContent = newValue ? "ON" : "OFF";
          toggle.style.background = newValue ? "#0a0" : "#444";
          valueDisplay.textContent = `Current: ${newValue}`;
        };
        widget.appendChild(toggle);
      }

      content.appendChild(widget);
    });

    return content;
  }

  /**
   * Create quick action buttons
   */
  private createQuickActions(): HTMLDivElement {
    const actions = document.createElement("div");
    actions.style.cssText = `
      position: fixed;
      bottom: 40px;
      left: 40px;
      right: 40px;
      display: flex;
      gap: 15px;
      max-width: 800px;
    `;

    const buttons = [
      {
        label: "Reset to Defaults",
        action: () => {
          this.tuningSystem.resetToDefaults();
          // Refresh current tab content to show reset values
          this.showTab(this.currentCategory);
        },
      },
      {
        label: "Download JSON",
        action: () => this.tuningSystem.downloadConfig(),
      },
      {
        label: "Close (~)",
        action: () => this.hide(),
      },
    ];

    buttons.forEach((btn) => {
      const button = document.createElement("button");
      button.textContent = btn.label;
      button.style.cssText = `
        flex: 1;
        padding: 15px;
        background: #444;
        color: white;
        border: none;
        cursor: pointer;
        font-family: monospace;
        font-size: 14px;
        border-radius: 5px;
      `;
      button.onmouseover = () => (button.style.background = "#555");
      button.onmouseout = () => (button.style.background = "#444");
      button.onclick = btn.action;
      actions.appendChild(button);
    });

    return actions;
  }

  /**
   * Show the controls
   */
  show(): void {
    this.container.style.display = "block";
    // Re-render current tab to show latest values
    const content = document.getElementById("tuning-content");
    if (content) {
      content.innerHTML = "";
      content.appendChild(this.renderTabContent());
    }
  }

  /**
   * Hide the controls
   */
  hide(): void {
    this.container.style.display = "none";
  }

  /**
   * Toggle visibility
   */
  toggle(): void {
    if (this.container.style.display === "none") {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Destroy and remove from DOM
   */
  destroy(): void {
    this.container.remove();
  }
}
