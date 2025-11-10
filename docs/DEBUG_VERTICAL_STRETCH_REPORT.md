# Debug Report: Vertical Stretch Issue

## Problem Summary
All UI elements and game content are being vertically stretched to fill the browser height, causing aspect ratio distortion and unnatural proportions.

## Root Cause Analysis

### 1. **CSS Container Height Constraint** ⚠️ PRIMARY ISSUE

**Location:** `public/style.css` (lines 8-15)

```css
#app {
    width: 100%;
    height: 100vh;        /* ← THIS IS THE CULPRIT */
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
}
```

**Problem:** The `#app` container is set to `100vh` (100% of viewport height). This forces the PixiJS canvas container to always expand to fill the full browser height, regardless of the actual game's intended aspect ratio.

**Impact Chain:**
```
#app {height: 100vh}
  ↓
#pixi-container becomes 100vh tall
  ↓
PixiJS canvas styled to fill 100vh
  ↓
PrimitiveTestScreen container scaled to fill height
  ↓
All game elements stretched vertically
```

---

### 2. **ResizePlugin Canvas Styling** ⚠️ SECONDARY ISSUE

**Location:** `src/engine/resize/ResizePlugin.ts` (lines 130-131)

```typescript
app.renderer.canvas.style.width = `${canvasWidth}px`;
app.renderer.canvas.style.height = `${canvasHeight}px`;
```

**Problem:** The resize plugin sets canvas CSS dimensions to match `innerWidth` and `innerHeight`. On tall screens (like a 1920x1440 laptop), this makes the canvas very tall. Without proper aspect ratio constraints upstream, this height propagates down.

**Why This Matters:**
- `canvasHeight` gets set to `window.innerHeight` (full browser height)
- This gets applied as CSS height to the canvas element
- The canvas stretches to fill that height
- PixiJS renders content to fill the entire canvas

---

### 3. **PrimitiveTestScreen Scaling Logic** ⚠️ TERTIARY ISSUE

**Location:** `src/app/screens/PrimitiveTestScreen.ts` (lines 103-125)

```typescript
resize(width: number, height: number): void {
    // ...
    const targetWidth = 800;
    const targetHeight = 600;
    const scaleX = width / targetWidth;
    const scaleY = height / targetHeight;
    const scale = Math.min(scaleX, scaleY);  // ← Maintains aspect ratio

    this.game.scale.set(scale);
    // Center positioning...
}
```

**Issue Context:** While the `PrimitiveTestScreen.resize()` method correctly maintains aspect ratio by taking `Math.min(scaleX, scaleY)`, the problem is that `height` parameter being passed to it is already the full browser height from the resize plugin.

**The Logic Is Correct But Receives Bad Input:**
- If browser is 1920×1440, screen receives `resize(1920, 1440)`
- It calculates: `scaleX = 1920/800 = 2.4`, `scaleY = 1440/600 = 2.4`
- Uses `scale = min(2.4, 2.4) = 2.4` ✓ This math is correct
- But the game IS being scaled proportionally by 2.4x
- **The perceived stretch is NOT from unequal scaling, but from the viewport being letterboxed incorrectly**

---

## Why Everything Looks "Stretched"

The issue is **not** that `scaleX ≠ scaleY`. The issue is:

1. **CSS forces container to be full browser height** → `#app` is 1440px tall
2. **Resize plugin makes canvas 1440px tall** → canvas CSS height is 1440px
3. **Screen receives full height in resize()** → gets `height = 1440`
4. **Game scales proportionally** → scales by 2.4x uniformly
5. **But background is full viewport height** → letterbox shows the stretch

**Visual result:**
```
┌─────────────────────────────────────┐ (1920px wide)
│                                     │
│   ┌─────────────────────────────┐   │ Letterboxed game
│   │   Scaled Game (scaled 2.4x) │   │ (maintains 4:3)
│   │                             │   │
│   │   BUT appears stretched     │   │
│   │   because surround is       │   │ Surrounded by
│   │   huge tall background      │   │ huge tall
│   │                             │   │ background
│   │   The CONTRAST makes it     │   │
│   │   look stretched/weird      │   │
│   │                             │   │
│   └─────────────────────────────┘   │
│                                     │
│           (lots of vertical space)  │
└─────────────────────────────────────┘ (1440px tall)
```

The game IS maintaining its aspect ratio correctly. The **perception** of stretch comes from the massive empty space surrounding it, which makes the content inside feel disproportionate.

---

## The Real Problems

### Problem 1: CSS Height Lock
The `#app { height: 100vh }` is a hard lock that prevents proper aspect ratio handling.

### Problem 2: Letterboxy Appearance
When content is small relative to the screen, large letterbox areas make it feel wrong.

### Problem 3: No Maximum Bounds
The resize system has no way to say "never make the game larger than 1600×1200" or similar. It just keeps scaling to fit available space.

---

## Solution Strategy (No Code Changes)

### Fix 1: Remove CSS Height Constraint
**File:** `public/style.css`

The `#app` container should NOT dictate height. It should be sized by its content or by aspect ratio constraints.

**Current:**
```css
#app { height: 100vh; }
```

**Should be:** One of these approaches:
- `height: auto;` - Let content dictate height
- `height: 100%;` instead of `100vh` - More flexible
- Remove height entirely and let container size by content
- Add `max-height` instead of fixed height

---

### Fix 2: Respect Target Aspect Ratio in CSS
The container needs to understand that the game is 800×600 (4:3 aspect ratio).

**Strategy:**
- Don't force container to fill viewport height
- Let it size based on viewport width with aspect ratio constraint
- Or set max-width/max-height to prevent excessive scaling
- CSS aspect-ratio property could help here

**Example approach:**
```css
#app {
    width: 100%;
    height: 100%;  /* or auto, not 100vh */
    aspect-ratio: 16 / 9;  /* Or match game ratio */
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
}
```

---

### Fix 3: Add Constraints to ResizePlugin
The resize plugin should have configurable bounds that prevent excessive scaling.

**Current behavior:** Always resize canvas to exactly `innerWidth × innerHeight`

**Better behavior:** Respect maximum canvas dimensions, similar to how `minWidth/minHeight` work

**Possible approach:**
- Add `maxWidth` and `maxHeight` to `resizeOptions`
- Clamp canvas size to reasonable limits
- Prevents games from becoming too large on ultra-wide/tall displays

---

### Fix 4: Add Viewport Aspect Ratio Preservation
The navigation/screen system could enforce aspect ratio at a higher level.

**Currently:** Screen receives whatever dimensions the resize plugin provides

**Better approach:**
- Application could specify its intended aspect ratio (e.g., 4:3, 16:9)
- Resize logic would adjust container based on this
- Game wouldn't receive distorted aspect ratios
- Similar to how mobile apps handle safe areas and notches

---

## Investigation Trace

### What I Verified
1. ✅ `PrimitiveTestScreen.resize()` IS calculating correct uniform scale (`Math.min(scaleX, scaleY)`)
2. ✅ Game IS maintaining 800×600 aspect ratio internally
3. ✅ Layout intent code (LayoutIntent.ts, LayoutExecutor.ts) is NOT stretching elements
4. ✅ ResizePlugin is working as designed (it's just given full viewport height)
5. ✅ CSS `#app { height: 100vh }` is forcing the tall container

### What I Confirmed NOT the Issue
- ❌ Layout compiler is NOT stretching elements
- ❌ Element agents are NOT scaling differently on X vs Y
- ❌ Screen scaling is NOT using different X/Y multipliers
- ❌ Region bounds calculations are NOT aspect-ratio-aware (but don't need to be)

---

## Summary Table

| Component | File | Line | Status | Issue |
|-----------|------|------|--------|-------|
| CSS Container | `public/style.css` | 10 | 🔴 | `height: 100vh` forces full height |
| Canvas Sizing | `ResizePlugin.ts` | 130-131 | 🟡 | Uses full viewport, no max bounds |
| Screen Scaling | `PrimitiveTestScreen.ts` | 113-115 | 🟢 | Correctly maintains aspect ratio |
| Layout Intent | `LayoutIntent.ts` | 268-293 | 🟢 | Region bounds proportional, OK |
| Layout Executor | `LayoutExecutor.ts` | 273-299 | 🟢 | Region sizing correct |

---

## Recommended Fix Priority

### HIGH PRIORITY
1. **Fix CSS** - Remove or modify `#app { height: 100vh }`
   - Simplest fix
   - Biggest impact
   - No JavaScript changes needed

### MEDIUM PRIORITY
2. **Add ResizePlugin constraints** - Add `maxWidth`/`maxHeight` options
   - Prevents excessive scaling
   - More professional appearance
   - Gives developers control

### LOW PRIORITY
3. **Add aspect ratio support** - Application-level aspect ratio preservation
   - Nice to have
   - Helps mobile/responsive
   - Can come in Phase 2 polish

---

## Testing After Fixes

After making changes, verify:
- [ ] Game maintains 4:3 aspect ratio on all screen sizes
- [ ] No vertical stretch on tall displays
- [ ] No horizontal stretch on wide displays
- [ ] Letterboxing only appears in expected cases
- [ ] Game scales proportionally (not stretched)
- [ ] Layout system still positions elements correctly within scaled container