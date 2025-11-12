# Bug Fix: Viewport Safety System - Loading Issue Resolution

## Issue

After implementing the viewport safety system, the game failed to load properly. The issue was caused by `undefined` `tileSize` references when using the new `uiConfig` system.

## Root Cause

The `CityGrid` class had code paths that relied on `this.config.tileSize` being defined:

```typescript
// ❌ BROKEN: tileSize undefined when using uiConfig
const { rows, cols, tileSize, padding, backgroundColor } = this.config;
const width = cols * tileSize + (padding ?? 0) * 2; // tileSize undefined!
```

When using the new percentage-based `uiConfig` system, `tileSize` is **dynamically calculated** and stored in `this.calculatedTileSize`, not in `this.config.tileSize`.

## Files Modified

### 1. `/src/ludemic/entities/CityGrid.ts`

#### Problem 1: `drawBackground()` used undefined `tileSize`

**Before:**
```typescript
private drawBackground(): void {
  this.backgroundGraphics.clear();
  const { rows, cols, tileSize, padding, backgroundColor } = this.config;
  const width = cols * tileSize + (padding ?? 0) * 2; // ❌ tileSize undefined
  const height = rows * tileSize + (padding ?? 0) * 2;
  // ...
}
```

**After:**
```typescript
private drawBackground(): void {
  this.backgroundGraphics.clear();
  const { rows, cols, backgroundColor } = this.config;
  const tileSize = this.calculatedTileSize || this.config.tileSize || 80; // ✅ Fallback chain
  const padding = this.config.padding ?? 0;
  const width = cols * tileSize + padding * 2;
  const height = rows * tileSize + padding * 2;
  // ...
}
```

#### Problem 2: `addTile()` used undefined `tileSize`

**Before:**
```typescript
public addTile(tile: RoadTile, row: number, col: number): void {
  // ...
  const x = col * this.config.tileSize + this.config.tileSize / 2; // ❌ undefined
  const y = row * this.config.tileSize + this.config.tileSize / 2;
  tile.position.set(x, y);
}
```

**After:**
```typescript
public addTile(tile: RoadTile, row: number, col: number): void {
  // ...
  const tileSize = this.calculatedTileSize || this.config.tileSize || 80; // ✅ Fallback
  const x = col * tileSize + tileSize / 2;
  const y = row * tileSize + tileSize / 2;
  tile.position.set(x, y);
}
```

#### Problem 3: `calculatedTileSize` not initialized

**Before:**
```typescript
constructor(config: EntityConfig) {
  super();
  this.config = ...;
  // calculatedTileSize defaults to 80 from property declaration
  // But if config.tileSize exists, it should use that!
}
```

**After:**
```typescript
constructor(config: EntityConfig) {
  super();
  this.config = ...;

  // Initialize calculated tile size (will be updated in resize())
  this.calculatedTileSize = this.config.tileSize ?? 80; // ✅ Use config value

  // ...
}
```

## Solution Pattern: Fallback Chain

All tile size calculations now use this fallback chain:

```typescript
const tileSize = this.calculatedTileSize || this.config.tileSize || 80;
```

**Priority:**
1. `this.calculatedTileSize` - Dynamically calculated from `uiConfig` (responsive)
2. `this.config.tileSize` - Static value from config (fallback mode)
3. `80` - Hardcoded default (last resort)

## Testing

### Manual Test Steps

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser console** and check for:
   ```
   ✅ [CityGrid] 📐 Resized to 1920x1080, safe area: 1824x972, tile size: XXXpx
   ✅ [HeadlineDisplay] 📐 Resized: viewport 1920x1080, safe area 1824x972, font XXpx
   ```

3. **Resize browser window** - Game should adapt without errors

4. **Check mobile viewport** (DevTools):
   - iPhone SE: 375x667
   - iPad: 768x1024
   - Tiles should scale appropriately

### Expected Behavior

✅ **Game loads successfully**
✅ **Grid renders centered**
✅ **Tiles positioned correctly**
✅ **Headlines display properly**
✅ **Resize works smoothly**
✅ **Console shows resize logs**

### Error Indicators

❌ Blank screen
❌ Console errors: `Cannot read property 'tileSize' of undefined`
❌ Console errors: `NaN` in positioning calculations
❌ Tiles positioned at (0, 0) or overlapping

## Architecture Lesson

### The Problem: Two Config Systems

The refactor introduced **two ways to configure the grid:**

1. **Old System (Static):**
   ```json
   {
     "config": {
       "rows": 4,
       "cols": 4,
       "tileSize": 80,  // ← Static pixel value
       "padding": 10
     }
   }
   ```

2. **New System (Responsive):**
   ```json
   {
     "config": {
       "rows": 4,
       "cols": 4,
       "uiConfig": {        // ← Percentage-based
         "position": { "x": 50, "y": 50 },
         "size": { "width": 60, "height": 60 }
       }
     }
   }
   ```

### The Solution: Unified Calculation

Instead of maintaining parallel code paths, **always use `calculatedTileSize`**:

```typescript
// ✅ GOOD: Single source of truth
const tileSize = this.calculatedTileSize;

// ❌ BAD: Checking which system is active
if (this.config.uiConfig) {
  tileSize = calculateFromUIConfig();
} else {
  tileSize = this.config.tileSize;
}
```

The `resize()` method handles the calculation:
- If `uiConfig` exists → calculate from percentages
- Otherwise → use static `tileSize`
- Result stored in `this.calculatedTileSize`

## Related Documentation

- [VIEWPORT_SAFETY_SYSTEM.md](./VIEWPORT_SAFETY_SYSTEM.md) - Full system documentation
- [UIConfig.ts](../src/ludemic/config/UIConfig.ts) - Utility functions
- [CityGrid.ts](../src/ludemic/entities/CityGrid.ts) - Grid implementation

## Commit Message

```
fix: resolve tileSize undefined errors in CityGrid

The viewport safety system introduced percentage-based uiConfig
which calculates tileSize dynamically. However, drawBackground()
and addTile() still referenced this.config.tileSize directly,
which was undefined when using uiConfig.

Solution:
- Use fallback chain: calculatedTileSize || config.tileSize || 80
- Initialize calculatedTileSize in constructor
- Ensure all tile positioning uses calculated value

This ensures the game loads correctly with both legacy static
configs and new responsive percentage-based configs.
```

## Prevention

To prevent similar issues in the future:

1. **Always use `calculatedTileSize`** for positioning calculations
2. **Never access `this.config.tileSize` directly** outside constructor/resize
3. **Initialize calculated values in constructor** with sensible defaults
4. **Test both config modes** (static and percentage-based)

## Status

✅ **RESOLVED** - Game loads and runs correctly with viewport safety system.
