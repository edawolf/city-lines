# City Lines - Game Rules Summary

## **The Core Rule**

> **Every level must have at least one Turnpike (🚧)**
> **All Landmarks must connect to it!**

---

## **What Are the Elements?**

### **Turnpike** 🚧 (THE GOAL)
- Highway entrance/exit gate
- **Required:** Every level has 1+
- **Icon:** 🚧 (construction barrier) or 🛂 (toll booth)
- **Purpose:** All landmarks must reach here

### **Landmarks** (Service Destinations)
These are the 3 types of buildings that need highway access:

1. **Diner** 🍔 - Restaurant/food service
2. **Gas Station** ⛽ - Fuel/charging station
3. **Market** 🏪 - Grocery/convenience store

### **Houses** 🏠 (Optional)
- Residential buildings
- May or may not need to connect
- Add story depth

### **Roads** (The Puzzle Pieces)
- **Local Roads** (Gray) - Neighborhood streets
- **Arterial Roads** (Orange) - Main streets
- **Highways** (Dark Orange) - Express routes

---

## **How to Win**

**Connect ALL landmarks (🍔⛽🏪) to the turnpike (🚧) using roads**

Example winning path:
```
🍔 Diner
  ↓ Local Road (Gray)
🚗 Arterial Road (Orange)
  ↓
🛣️ Highway (Dark Orange)
  ↓
🚧 TURNPIKE ✓ Connected!
```

---

## **Connection Rules**

Roads follow a hierarchy. Each road type can only connect to specific others:

| Road Type | Can Connect To |
|-----------|----------------|
| House 🏠 | Local Roads only |
| Local Road (Gray) | Houses, Landmarks, Local Roads, Arterial Roads |
| Arterial Road (Orange) | Local Roads, Arterial Roads, Highways |
| Highway (Dark Orange) | Arterial Roads, Highways, Turnpikes |
| Turnpike 🚧 | Highways, Landmarks |
| Landmark (🍔⛽🏪) | Turnpikes, Local Roads |

---

## **Tile Types**

All roads come in these rotatable shapes:

- **Straight** │ or ─ (2 connections)
- **Corner** └ or ┐ (2 connections at 90°)
- **T-Junction** ├ or ┬ (3 connections)
- **Crossroads** ┼ (4 connections)

---

## **Gameplay**

1. **Start:** See disconnected grid with landmarks and turnpike
2. **Solve:** Click tiles to rotate them 90° clockwise
3. **Win:** When all landmarks connect to turnpike
4. **Reward:** Headline reveals for each connected landmark

---

## **Example Level**

```
🍔    ⛽    🏪   ← Landmarks (must connect!)
│     │     │
┌─────┼─────┐   ← Local Roads (rotatable)
│     │     │
═════╪═════   ← Arterial Roads
      │
      ║          ← Highway
      │
     🚧         ← Turnpike (THE GOAL!)
```

**Puzzle:** Rotate tiles so all 3 landmarks reach the turnpike!

---

## **Headlines**

When a landmark connects, reveal a story:

- 🍔 → "Downtown Diner Wins Best Breakfast Award"
- ⛽ → "New EV Charging Station Opens on Main St"
- 🏪 → "Market Expands to 24-Hour Service"

---

## **Difficulty Levels**

### Easy (4x4 grid)
- 1 turnpike
- 1-2 landmarks
- Clear solution

### Medium (6x6 grid)
- 1 turnpike
- 3 landmarks
- Some decoy tiles

### Hard (8x8 grid)
- 2 turnpikes
- 4-5 landmarks
- Multiple paths

---

## **Quick Reference**

✅ **DO:**
- Click tiles to rotate 90° clockwise
- Follow road hierarchy (local → arterial → highway → turnpike)
- Connect ALL landmarks to reach turnpike

❌ **DON'T:**
- Skip the turnpike (required!)
- Connect incompatible road types
- Leave landmarks disconnected

---

## **Visual Cheat Sheet**

**Color Code:**
- 🔴 Red = Houses (optional)
- ⚪ Gray = Local Roads (neighborhood)
- 🟠 Orange = Arterial Roads (main streets)
- 🟠 Dark Orange = Highways (express)
- 🟣 Purple = Turnpikes (REQUIRED!)
- Buildings = Landmarks (MUST CONNECT!)

**Connection Priority:**
```
Bottom Priority
    🏠 House
    ↓
    Gray Local Road
    ↓
    Orange Arterial
    ↓
    Dark Orange Highway
    ↓
    🟣 Purple TURNPIKE
    ↓
    🍔⛽🏪 LANDMARKS
Top Priority (MUST REACH!)
```

---

## **That's It!**

**Remember:** Every level needs a turnpike (🚧), and all landmarks (🍔⛽🏪) must connect to it. Rotate roads to build the path!
