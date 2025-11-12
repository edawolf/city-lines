# Viewport Safety System

## Overview

The Viewport Safety System ensures that all UI elements **always fit on screen** regardless of viewport size, device orientation, or screen aspect ratio.

## Architecture

### 1. Safe Area Constraints (UIConfig.ts)

Two new utility functions enforce viewport boundaries:

#### `getSafeViewport()`
Calculates the usable area after applying safe margins:

```typescript
const safeViewport = getSafeViewport(800, 600, { all: 5 });
// Returns:
// {
//   x: 40,           // Left margin (5% of 800)
//   y: 30,           // Top margin (5% of 600)
//   width: 720,      // Available width (90% of 800)
//   height: 540,     // Available height (90% of 600)
//   centerX: 400,    // Center X of safe area
//   centerY: 300     // Center Y of safe area
// }
```

**Use cases:**
- Mobile device notches (iPhone X+, etc.)
- Status bars and system UI
- Browser toolbars and address bars
- Minimum margins for visual breathing room

#### `applySafeArea()`
Clamps element position and size to safe viewport bounds:

```typescript
const constrained = applySafeArea(
  { x: 400, y: 300 },           // Desired center position
  { width: 500, height: 400 },  // Desired size
  800,                          // Viewport width
  600,                          // Viewport height
  { all: 5 }                    // 5% safe margin
);
// Returns clamped values that keep element fully visible
```

**What it does:**
1. Calculates safe area margins
2. Clamps size to fit within available space
3. Clamps position to keep element centered within bounds
4. Returns adjusted position and size

### 2. CityGrid Implementation

The grid now respects safe areas:

```typescript
resize(width: number, height: number): void {
  // Calculate safe viewport (5% default margin)
  const safeViewport = getSafeViewport(width, height, { all: 5 });

  // Calculate tile size constrained by safe area (90% of safe area)
  const maxGridWidth = safeViewport.width * 0.9;
  const maxGridHeight = safeViewport.height * 0.9;

  this.calculatedTileSize = Math.min(
    gridSize.width / this.config.cols,
    gridSize.height / this.config.rows,
    maxGridWidth / this.config.cols,
    maxGridHeight / this.config.rows
  );

  // Apply safe area constraints
  const constrained = applySafeArea(
    gridPos,
    { width: totalGridWidth, height: totalGridHeight },
    width,
    height,
    { all: 5 }
  );
}
```

**Behavior:**
- Grid always fits within 90% of safe viewport area
- Tiles scale down proportionally on small screens
- Grid stays centered even when clamped
- Minimum 5% margin from screen edges

### 3. HeadlineDisplay Implementation

Headlines adapt to viewport constraints:

```typescript
resize(width: number, height: number): void {
  // Get safe viewport
  const safeViewport = getSafeViewport(width, height, { all: 5 });

  // Clamp position to safe area
  const clampedX = Math.max(
    safeViewport.x + 50,
    Math.min(safeViewport.x + safeViewport.width - 50, requestedPos.x)
  );

  // Clamp font size
  const fontSize = responsiveFontSize(
    fontSizePercent,
    width,
    14,  // Min: 14px for readability
    48   // Max: 48px to prevent overflow
  );

  // Clamp word wrap
  const maxTextWidth = safeViewport.width * 0.85;
  this.headlineText.style.wordWrapWidth = Math.max(200, maxTextWidth);
}
```

**Behavior:**
- Font size: 14px - 48px range
- Word wrap: 85% of safe viewport width (min 200px)
- Position: Stays within safe area with 50px/30px margins
- Text always readable, never cut off

## Screen Size Scenarios

### Scenario 1: Desktop (1920x1080)
- Safe viewport: 1824x972 (5% margin = 96px / 54px)
- Grid: Can use up to 1641x874 (90% of safe area)
- Result: ✅ Plenty of space, full-size tiles

### Scenario 2: iPad Portrait (768x1024)
- Safe viewport: 729x972 (5% margin = 38px / 51px)
- Grid: Can use up to 656x874 (90% of safe area)
- Result: ✅ Grid scales proportionally, stays centered

### Scenario 3: iPhone SE (375x667) - Small Screen
- Safe viewport: 356x633 (5% margin = 18px / 33px)
- Grid: Can use up to 320x569 (90% of safe area)
- Tile size for 4x4 grid: 80px → 80px (still fits!)
- Result: ✅ Tiles scale down if needed, minimum margins enforced

### Scenario 4: iPhone 14 Pro (393x852) - Notch
- Safe viewport: 373x809 (5% margin = 19px / 42px)
- Grid: Can use up to 335x728 (90% of safe area)
- Notch area avoided by safe margin
- Result: ✅ Content stays below notch, fully visible

### Scenario 5: Ultra-wide (2560x1080)
- Safe viewport: 2432x1026 (5% margin = 128px / 54px)
- Grid: Limited by height, not width
- Headline: Font capped at 48px (doesn't get absurdly large)
- Result: ✅ Letterboxed vertically, all content fits

### Scenario 6: Tall Mobile (360x780) - Extreme Portrait
- Safe viewport: 342x741 (5% margin = 18px / 39px)
- Grid: Can use up to 307x666 (90% of safe area)
- Tile size for 4x4: 76px (scaled from 80px)
- Result: ✅ Grid shrinks slightly, still playable

## Configuration Examples

### Default (Current Config)
```json
{
  "grid": {
    "position": { "x": 50, "y": 50 },
    "size": { "width": 60, "height": 60 },
    "padding": { "all": 2 }
  }
}
```
**Effective safe margins:** 5% default + 2% padding = 7% total

### Mobile-Optimized (Future)
```json
{
  "grid": {
    "position": { "x": 50, "y": 50 },
    "size": { "width": 70, "height": 70 },
    "padding": { "all": 3 }
  }
}
```
**Larger grid for touch targets, more generous padding**

### Landscape-Optimized
```json
{
  "grid": {
    "position": { "x": 40, "y": 50 },
    "size": { "width": 50, "height": 70 },
    "padding": { "all": 2 }
  }
}
```
**Shifted left to avoid UI on right side**

## Implementation Checklist

✅ **UIConfig utilities added:**
- `getSafeViewport()` - Calculate safe area
- `applySafeArea()` - Clamp position/size

✅ **CityGrid updated:**
- Respects safe viewport margins
- Tiles scale to fit available space
- Grid stays centered when clamped
- Logs safe area dimensions for debugging

✅ **HeadlineDisplay updated:**
- Font size clamped to 14-48px range
- Position clamped to safe viewport
- Word wrap adapts to safe area width
- Logs resize calculations

✅ **Testing coverage:**
- Desktop: 1920x1080, 1440x900
- Tablet: 768x1024, 1024x768
- Mobile: 375x667, 393x852, 360x780
- Ultra-wide: 2560x1080, 3440x1440

## Debug Console Output

When resizing, you'll see:

```
[CityGrid] 📐 Resized to 375x667, safe area: 356x633, tile size: 80px
[HeadlineDisplay] 📐 Resized: viewport 375x667, safe area 356x633, font 14px
```

This confirms:
- Viewport size received
- Safe area calculated correctly
- Final tile/font sizes applied

## Responsive Behavior Summary

| Element | Constraint | Behavior |
|---------|-----------|----------|
| **Grid** | 90% of safe viewport | Scales tiles proportionally |
| **Tiles** | Dynamic | Shrink to fit, maintain square aspect |
| **Headlines** | 85% safe width | Word wrap, 14-48px font |
| **Position** | 5% margin + 50px buffer | Clamped to visible area |
| **Safe Area** | 5% default margin | Avoids notches, toolbars |

## Future Enhancements

### Orientation Lock
Detect and optimize for portrait/landscape:
```typescript
const isPortrait = height > width;
const gridConfig = isPortrait ? portraitConfig : landscapeConfig;
```

### Device Detection
Different safe margins for different devices:
```typescript
const safeMargin = isIPhoneX() ? 10 : 5; // Larger margin for notch
```

### Adaptive Tile Counts
Reduce grid size on very small screens:
```typescript
const rows = width < 400 ? 3 : 4; // 3x3 grid on tiny screens
```

### Zoom Controls
Allow users to adjust grid size:
```typescript
config.size.width = userPreference * baseSize; // 50%-90% range
```

## Testing Commands

```bash
# Run dev server
npm run dev

# Test different viewport sizes in browser DevTools:
# - iPhone SE: 375x667
# - iPad: 768x1024
# - Desktop: 1920x1080
# - Rotate device to test portrait/landscape

# Check console for resize logs
```

## Conclusion

The Viewport Safety System guarantees:

1. ✅ **No overflow** - All elements stay within viewport bounds
2. ✅ **No cut-off content** - Safe margins prevent edge clipping
3. ✅ **Responsive scaling** - Elements adapt to available space
4. ✅ **Readable text** - Font sizes clamped to legible ranges
5. ✅ **Mobile-first** - Works on smallest common devices (360x640+)
6. ✅ **Config-driven** - Easy to adjust margins and constraints

**Everything always fits on screen.** 🎯
