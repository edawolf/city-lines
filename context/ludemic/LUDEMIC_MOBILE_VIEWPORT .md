# LUDEMIC_MOBILE_VIEWPORT

Created: September 17, 2025 10:25 AM

📱 Ludemic Mobile Implementation Guide

> A comprehensive guide to implementing responsive mobile gameplay with proper viewport handling, safe areas, and cross-platform compatibility.
> 

This document captures the lessons learned from implementing mobile-first responsive design for Ludemic games, with specific focus on Safari viewport handling, device detection, and touch controls.

## 🎯 Core Principles

### 1. Single Source of Truth

- **JavaScript handles ALL safe area calculations** - never mix CSS and JS safe areas
- **Device detection in one place** - centralized DeviceDetection utility
- **Layout management through code** - programmatic positioning over CSS layout

### 2. Mobile-First Architecture

- **Edge-to-edge on mobile** - full viewport utilization with proper safe areas
- **Centered simulation on desktop** - iPhone frame for desktop development/testing
- **Responsive controls** - touch-optimized UI that scales appropriately

### 3. Safari-Specific Handling

- **Viewport vs Screen dimensions** - Safari reduces viewport, use screen for device detection
- **Dynamic safe areas** - account for Safari UI changes (address bar, etc.)
- **No CSS safe area conflicts** - disable CSS safe area padding when using JS

---

## 🏗️ Implementation Architecture

### Device Detection System

```tsx
// Central device detection with Safari-aware logic
export class DeviceDetection {
  // iPhone 16 Pro detection using screen dimensions (not viewport)
  public static isIPhone16Pro(): boolean {
    const screenHeight = window.screen.height; // Use screen, not innerHeight
    const isScreenMatch = (width === 402 && screenHeight === 874);
    const isViewportMatch = (width === 402 && height >= 670 && height <= 874);
    return (isScreenMatch || isViewportMatch) && isPhysicalMatch && isPixelRatioMatch;
  }
}

```

### Layout Management System

```tsx
// Responsive layout with mobile/desktop modes
export class LayoutManager {
  private calculateAreas(): void {
    // Mobile: Full viewport with safe areas
    // Desktop: Fixed iPhone dimensions
    this.gameArea = {
      x: this.config.safeAreaLeft || 0,
      y: this.config.safeAreaTop + hudHeight, // JS-controlled safe areas
      width: this.config.width - safeAreaLeft - safeAreaRight,
      height: this.config.height - safeAreaTop - safeAreaBottom - hudHeight - controlsHeight,
    };
  }
}

```

### Mobile Layout Container

```tsx
export class MobileLayout {
  public resize(screenWidth: number, screenHeight: number): void {
    if (this.isMobileView) {
      // Edge-to-edge mobile layout
      this.gameViewport.scale.set(1);
      this.gameViewport.x = 0;
      this.gameViewport.y = 0;
    } else {
      // Centered desktop simulation
      this.gameViewport.x = (screenWidth - FIXED_PHONE_WIDTH) / 2;
      this.gameViewport.y = (screenHeight - FIXED_PHONE_HEIGHT) / 2;
    }
  }
}

```

---

## 📐 Safe Area Management

### Key Safe Area Values

```tsx
// iPhone 16 Pro (402×874pt logical, 1206×2622px physical)
public static readonly IPHONE_16_PRO_SAFE_TOP = 62;    // Status bar + Dynamic Island
public static readonly IPHONE_16_PRO_SAFE_BOTTOM = 142; // Safari address bar area

// Generic Mobile
public static readonly MOBILE_SAFE_TOP = 44;    // Standard status bar
public static readonly MOBILE_SAFE_BOTTOM = 34;  // Home indicator

```

### CSS Safe Area Setup (Critical)

```css
/* IMPORTANT: Disable CSS safe areas when using JavaScript layout */
@media screen and (max-width: 768px) {
    body {
        /* Let JavaScript handle safe areas - avoid double padding */
        padding-top: 0;
        padding-bottom: 0;
        padding-left: 0;
        padding-right: 0;
    }
}

/* Enhanced mobile viewport */
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />

```

---

## 🎮 Touch Controls Implementation

### Responsive D-Pad Sizing

```tsx
export class VirtualDPad {
  private radius: number = 80; // 2x larger for mobile usability

  // Scaled button positions for larger D-pad
  const directions = [
    { name: "up", x: 0, y: -50 },     // 2x scale from 25px
    { name: "down", x: 0, y: 50 },
    { name: "left", x: -50, y: 0 },
    { name: "right", x: 50, y: 0 },
  ];
}

```

### Dynamic Control Positioning

```tsx
public repositionControls(containerWidth?: number, containerHeight?: number): void {
  // Position controls in top 1/4 of safe area for thumb accessibility
  const verticalPosition = Math.min(40, containerHeight / 4);

  this.dPad.x = 60;  // Left margin
  this.dPad.y = verticalPosition;

  this.actionButtons.x = containerWidth - 60;  // Right margin
  this.actionButtons.y = verticalPosition;
}

```

---

## 🔧 Engine Configuration

### Viewport-Aware Resize System

```tsx
export function resize(w: number, h: number, minWidth: number, minHeight: number, letterbox: boolean) {
  if (letterbox) {
    // Desktop: Use fixed dimensions (no window filling)
    canvasWidth = minWidth;   // 420px (iPhone + frame)
    canvasHeight = minHeight; // 874px
  } else {
    // Mobile: Use full viewport
    canvasWidth = w;
    canvasHeight = h;
  }

  return { width: Math.floor(canvasWidth), height: Math.floor(canvasHeight) };
}

```

### Canvas Positioning

```tsx
// Desktop: Center fixed-size canvas
if (shouldLetterbox) {
  app.renderer.canvas.style.width = `${width}px`;
  app.renderer.canvas.style.height = `${height}px`;
  app.renderer.canvas.style.position = 'fixed';
  app.renderer.canvas.style.left = '50%';
  app.renderer.canvas.style.top = '50%';
  app.renderer.canvas.style.transform = 'translate(-50%, -50%)';
}

```

---

## 🐛 Debug & Testing Tools

### Debug Screen Implementation

```tsx
// Create comprehensive diagnostic screen
export class DebugScreen {
  // Visual grid with coordinate system
  // Device detection verification
  // Safe area boundary visualization
  // Container positioning debug info
}

// Access methods:
// URL: localhost:8082?debug=true
// Button: "DEBUG" button on menu screen
// Event: window.dispatchEvent(new CustomEvent("show-debug-screen"))

```

### Debug Route Setup

```tsx
// main.ts - Debug route handling
const urlParams = new URLSearchParams(window.location.search);
const isDebugMode = urlParams.get('debug') === 'true';

if (isDebugMode) {
  await engine.navigation.showScreen(DebugScreen);
} else {
  await engine.navigation.showScreen(MenuScreen);
}

```

---

## 🚨 Common Pitfalls & Solutions

### 1. Double Safe Area Padding

**Problem**: CSS `env(safe-area-inset-*)` + JavaScript safe areas = double offset

```css
/* ❌ Wrong - creates double padding */
body {
  padding-top: var(--safe-area-inset-top);
}

/* ✅ Correct - let JavaScript handle it */
body {
  padding-top: 0;
}

```

### 2. Device Detection Failure

**Problem**: Safari reduces `window.innerHeight`, breaking exact dimension matching

```tsx
// ❌ Wrong - fails in Safari
const isIPhone16Pro = (width === 402 && height === 874);

// ✅ Correct - use screen dimensions + tolerance
const isScreenMatch = (width === 402 && window.screen.height === 874);
const isViewportMatch = (width === 402 && height >= 670 && height <= 874);
const isIPhone16Pro = isScreenMatch || isViewportMatch;

```

### 3. Desktop Width Expansion

**Problem**: Letterbox mode still fills browser width instead of fixed size

```tsx
// ❌ Wrong - expands to window size
if (letterbox) {
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
}

// ✅ Correct - use fixed dimensions
if (letterbox) {
  canvasWidth = minWidth;   // Fixed iPhone size
  canvasHeight = minHeight;
}

```

### 4. Touch Control Positioning

**Problem**: Controls positioned too low, hard to reach with thumbs

```tsx
// ❌ Wrong - center of large safe area
const verticalPosition = containerHeight / 2;

// ✅ Correct - top quarter for thumb accessibility
const verticalPosition = Math.min(40, containerHeight / 4);

```

---

## 🎯 Testing Checklist

### Mobile Safari Testing

- [ ]  iPhone 16 Pro detection working (check debug screen)
- [ ]  Safe areas: Top 62px, Bottom 142px for iPhone 16 Pro
- [ ]  HUD positioned at y=67 (62+5), not y=49
- [ ]  Game area starts at proper y=112 (62+50), not lower
- [ ]  Controls accessible in bottom safe area
- [ ]  No double safe area padding
- [ ]  Edge-to-edge layout on mobile

### Desktop Testing

- [ ]  Fixed iPhone simulator size (420×874)
- [ ]  Centered in browser window
- [ ]  iPhone frame visible on desktop
- [ ]  No width expansion to fill browser
- [ ]  Debug screen accessible via ?debug=true

### Cross-Platform

- [ ]  Touch controls scale appropriately (2x size)
- [ ]  Gamepad positioned for thumb reach
- [ ]  Responsive layout on orientation change
- [ ]  Proper viewport handling across devices

---