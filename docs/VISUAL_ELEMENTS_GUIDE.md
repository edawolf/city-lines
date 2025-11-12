# City Lines - Visual Elements Guide

## Game Elements & Icons

This guide shows the visual representation of each element type in City Lines.

---

## **1. Destinations (Must Connect to Turnpikes)**

### 🏠 **House**
- **Color:** Red (#e74c3c)
- **Visual:** House with triangular roof and door
- **Connection:** Single road extends from bottom (South)
- **Purpose:** Residential destination that needs highway access

```
    /\
   /  \
  |    |
  | [] |    ← House with roof
  |____|
    ||       ← Road connection (South)
```

### 🏛️ **Landmark** (Destination Buildings)
- **Color:** Green (#2ecc71)
- **Visual:** Tall building with windows and flag on top
- **Connection:** Single road extends from top (North)
- **Purpose:** Important destinations (City Hall, Stadium, etc.)
- **Examples:**
  - City Hall
  - Stadium
  - Concert Hall
  - Business District
  - Parks

```
     •       ← Flag marker
  |████|
  |⬜⬜|
  |⬜⬜|    ← Building with windows
  |⬜⬜|
  |████|
    ||       ← Road connection (North)
```

---

## **2. Highway Infrastructure**

### 🚧 **Turnpike/Highway Gate**
- **Color:** Purple (#9b59b6)
- **Visual:** Gate structure with pillars and overhead bar
- **Connection:** Road passes through (North ↔ South)
- **Purpose:** Main entry point to highway system - ALL destinations must ultimately connect here
- **Special:** Displays "TOLL" sign

```
  |████|
  | ▓▓ |    ← Overhead bar with TOLL sign
  █    █
  █ || █    ← Road passing through
  █ || █
  █____█    ← Pillars on sides
```

---

## **3. Road Types (Connection Infrastructure)**

### 🛣️ **Highway**
- **Color:** Dark Orange (#e67e22)
- **Visual:** Wide road with yellow dashed center line
- **Connection:** Can connect to: Arterial Roads, other Highways, Turnpikes
- **Purpose:** High-speed routes connecting major areas

```
     ||
  -------
  || -- ||  ← Yellow dashed markings
  -------
     ||
```

### 🚗 **Arterial Road**
- **Color:** Orange (#f39c12)
- **Visual:** Medium road with yellow dashed center line
- **Connection:** Can connect to: Local Roads, other Arterials, Highways
- **Purpose:** Main streets connecting neighborhoods to highways

```
     ||
  ------
  || - ||   ← Yellow dashed markings
  ------
     ||
```

### 🏘️ **Local Road**
- **Color:** Gray (#95a5a6)
- **Visual:** Simple road segments (straight, corner, T-junction, crossroads)
- **Connection:** Can connect to: Houses, Landmarks, other Local Roads, Arterial Roads
- **Purpose:** Residential streets connecting houses to main roads

```
  Straight:    Corner:      T-Junction:   Crossroads:
     ||         ||              ||             ||
     ||         ||___           ||___       ___||___
     ||                                         ||
```

---

## **Road Tile Shapes**

All road types can have these shapes:

### **Straight** (2 connections)
- Connects North ↔ South or East ↔ West
- Used for long stretches

### **Corner** (2 connections, 90° angle)
- Connects North ↔ East, or any 90° combination
- Used for turns

### **T-Junction** (3 connections)
- Connects 3 directions
- Used for intersections

### **Crossroads** (4 connections)
- Connects all 4 directions (North, East, South, West)
- Used for major intersections

---

## **Connection Hierarchy**

```
House (🏠)
    ↓
Local Road (🏘️) ← Gray
    ↓
Arterial Road (🚗) ← Orange
    ↓
Highway (🛣️) ← Dark Orange
    ↓
Turnpike (🚧) ← Purple (GOAL!)
    ↓
Landmark (🏛️) ← Green
```

**Connection Rules:**
- **Houses** can ONLY connect to **Local Roads**
- **Local Roads** can connect to: Houses, Landmarks, other Local Roads, Arterial Roads
- **Arterial Roads** can connect to: Local Roads, other Arterials, Highways
- **Highways** can connect to: Arterials, other Highways, Turnpikes
- **Turnpikes** can connect to: Highways, Landmarks
- **Landmarks** can connect to: Turnpikes, Local Roads

---

## **Visual Indicators**

### **Rotatable Tile**
- Small blue circle (🔵) in bottom-right corner
- Indicates player can click to rotate

### **Road Markings**
- Yellow dashed lines on Highways and Arterial Roads
- Shows traffic direction and importance

### **Color Coding by Importance**
1. **Red (House)** - Residential, lowest priority
2. **Gray (Local)** - Neighborhood streets
3. **Orange (Arterial)** - Main streets
4. **Dark Orange (Highway)** - Express routes
5. **Purple (Turnpike)** - Highway gates (CRITICAL!)
6. **Green (Landmark)** - Important destinations

---

## **Win Condition Visual Feedback**

When all destinations are connected to turnpikes:
- ✅ All paths light up
- 🎉 Headline appears with story
- 🚗 Optional: Car animation drives through completed network
- 📰 "Front Page Map" shows all collected headlines

---

## **Example Puzzle Layout**

```
    🏛️         🏛️
     |          |
    🚧═════════🚧  ← Turnpikes (must reach here!)
     ║          ║
    🛣️═════════🛣️  ← Highways
     ║          ║
    🚗─────────🚗  ← Arterial Roads
     │    │    │
    🏘️   🏘️   🏘️  ← Local Roads
     │    │    │
    🏠   🏠   🏠  ← Houses (start here!)
```

**Goal:** Rotate/swap tiles so every house connects through the road network to reach a turnpike!

---

## **Implementation Details**

All visuals are drawn programmatically in [`RoadTile.ts`](../src/ludemic/entities/RoadTile.ts):

- `drawHouseIcon()` - Renders house with roof and door
- `drawLandmarkIcon()` - Renders building with windows
- `drawTurnpikeIcon()` - Renders gate structure with toll sign
- `drawRoadSegments()` - Renders road connections
- `drawRoadMarkings()` - Adds yellow dashed lines

Colors are defined in `getColorForRoadType()` method.
