# City Lines - Game Design Document

## **Core Concept**

Players repair broken city roads to reconnect service destinations (diners, gas stations, markets) to highway turnpikes. Each completed connection reveals a news headline, transforming a puzzle into a miniature city of stories.

---

## **Game Elements**

### **1. Turnpikes (Highway Gates)** 🚧
- **Rule:** Every level MUST have at least one turnpike
- **Purpose:** Main entry point to the highway system
- **Icon:** 🚧 (or 🛂 for toll booth variant)
- **Function:** The ultimate destination - all landmarks must connect here

### **2. Landmarks (Service Destinations)**

These are the buildings that need highway access:

#### **🍔 Diner**
- Restaurant/food service
- Icon: 🍔 (or 🍽️)
- Must connect to turnpike to receive supplies

#### **⛽ Gas Station**
- Fuel service
- Icon: ⛽
- Must connect to turnpike for fuel deliveries

#### **🏪 Market**
- Grocery store/convenience store
- Icon: 🏪 (or 🛒)
- Must connect to turnpike for product deliveries

### **3. Houses** 🏠
- Residential buildings
- Icon: 🏠 (or 🏡)
- Optional: May or may not need to connect
- Add narrative depth to neighborhoods

### **4. Roads (Connection Infrastructure)**

#### **🏘️ Local Roads** (Gray)
- Neighborhood streets
- Connect houses and landmarks to main roads
- Can connect to: Houses, Landmarks, other Local Roads, Arterial Roads

#### **🚗 Arterial Roads** (Orange)
- Main streets with yellow dashed lines
- Connect neighborhoods to highways
- Can connect to: Local Roads, other Arterials, Highways

#### **🛣️ Highways** (Dark Orange)
- High-speed express routes with yellow dashed lines
- Connect main areas to turnpikes
- Can connect to: Arterials, other Highways, Turnpikes

---

## **Win Condition**

**All landmarks (diner, gas station, market) must be connected to a turnpike through the road network.**

Example:
```
🏪 Market
  ↓ (local road)
🚗 Arterial
  ↓ (highway)
🛣️ Highway
  ↓
🚧 Turnpike ✓ (CONNECTED!)
```

---

## **Road Tile Types**

All roads come in these shapes (rotatable):

1. **Straight** - 2 connections (North-South or East-West)
2. **Corner** - 2 connections at 90° angle
3. **T-Junction** - 3 connections
4. **Crossroads** - 4 connections

---

## **Level Structure**

### **Minimum Level Requirements**
- 1+ Turnpikes (required)
- 1+ Landmarks (diner, gas station, or market)
- Enough road tiles to create connections
- Grid size: 4x4 minimum, 8x8 maximum

### **Example Level Layout**

```
🏪    🍔    ⛽   (Landmarks - need to connect!)
 │     │     │
🏘️───🏘️───🏘️   (Local roads - rotatable)
 │     │     │
🚗═══🚗═══🚗   (Arterial roads)
 │     │     │
🛣️═══🛣️═══🛣️   (Highways)
 │     │     │
🏠   🚧   🏠   (Turnpike in center!)
```

**Goal:** Rotate tiles so all landmarks connect to the turnpike (🚧)

---

## **Gameplay Flow**

### **1. Start**
- Player sees broken/disconnected grid
- Landmarks are isolated
- Turnpike is visible but unreachable

### **2. Solve**
- Click tiles to rotate them 90°
- Build paths from landmarks to turnpike
- Follow road hierarchy rules (local → arterial → highway → turnpike)

### **3. Complete**
- When all landmarks connect to turnpike
- Headline appears with story related to the landmark
- Optional: Car animation drives through completed route

### **4. Reveal**
- "Front Page Map" shows all headlines collected
- Player sees full day's news for that section

---

## **Difficulty Progression**

### **Easy (Tutorial)**
- 4x4 grid
- 1 turnpike, 1 landmark
- 3-5 rotatable tiles
- Clear path visible

### **Medium**
- 6x6 grid
- 1 turnpike, 2-3 landmarks
- 8-12 rotatable tiles
- Some decoy tiles

### **Hard**
- 8x8 grid
- 2 turnpikes, 4-5 landmarks
- 15-20 rotatable tiles
- Multiple valid solutions

### **Expert**
- 8x8 grid
- All landmarks must connect to ALL turnpikes
- Fixed tiles (non-rotatable)
- Limited rotation count

---

## **Headline Integration**

When a landmark connects to turnpike, reveal themed headline:

### **Diner Headlines** 🍔
- "Local Diner Named Best Breakfast Spot"
- "New Menu Item Draws Crowds Downtown"
- "Family Restaurant Celebrates 50 Years"

### **Gas Station Headlines** ⛽
- "Gas Prices Drop for Third Week"
- "New EV Charging Station Opens"
- "Local Station Wins Community Award"

### **Market Headlines** 🏪
- "Grocery Chain Expands to Neighborhood"
- "Farmers Market Opens Weekend Hours"
- "New Organic Section Added at Market"

---

## **Level Themes (News Sections)**

### **Local News**
- Landmarks: Diner, Market, Gas Station
- Roads: Mostly local and arterial
- Headlines: Community stories

### **Business**
- Landmarks: Markets, Offices (🏢), Banks (🏦)
- Roads: More highways
- Headlines: Economic stories

### **Sports**
- Landmarks: Stadiums (🏟️), Gyms (🏋️)
- Roads: Express routes
- Headlines: Game results, events

### **Entertainment**
- Landmarks: Theaters (🎭), Cinemas (🎬), Diners
- Roads: Urban grid
- Headlines: Shows, events, reviews

---

## **JSON Configuration Example**

```json
{
  "levelName": "Downtown Connections",
  "gridSize": { "rows": 6, "cols": 6 },
  "requiredConnections": "all_landmarks_to_any_turnpike",

  "entities": [
    {
      "id": "turnpike_01",
      "type": "RoadTile",
      "config": {
        "tileType": "straight",
        "roadType": "turnpike",
        "rotation": 0,
        "rotatable": false,
        "gridPos": { "row": 5, "col": 3 }
      }
    },
    {
      "id": "diner_01",
      "type": "RoadTile",
      "config": {
        "tileType": "landmark",
        "roadType": "landmark",
        "landmarkType": "diner",
        "icon": "🍔",
        "rotatable": false,
        "gridPos": { "row": 0, "col": 1 }
      }
    },
    {
      "id": "gas_station_01",
      "type": "RoadTile",
      "config": {
        "tileType": "landmark",
        "roadType": "landmark",
        "landmarkType": "gas_station",
        "icon": "⛽",
        "rotatable": false,
        "gridPos": { "row": 0, "col": 4 }
      }
    }
  ],

  "headlines": [
    {
      "landmarkId": "diner_01",
      "text": "Downtown Diner Wins Best Breakfast Award"
    },
    {
      "landmarkId": "gas_station_01",
      "text": "New EV Charging Station Opens on Main St"
    }
  ]
}
```

---

## **Visual Hierarchy**

### **By Color:**
1. 🔴 Red (House) - Residential
2. ⚪ Gray (Local Road) - Neighborhood
3. 🟠 Orange (Arterial) - Main streets
4. 🟠 Dark Orange (Highway) - Express
5. 🟣 Purple (Turnpike) - Gates (GOAL!)
6. 🟢 Green (Landmarks) - Destinations

### **By Connection Priority:**
```
House (🏠)
    ↓
Local Road (Gray)
    ↓
Arterial Road (Orange)
    ↓
Highway (Dark Orange)
    ↓
Turnpike (Purple) ← REQUIRED!
    ↓
Landmarks (🍔⛽🏪) ← MUST CONNECT!
```

---

## **Key Game Rules**

1. ✅ **Every level has at least 1 turnpike**
2. ✅ **Landmarks are: Diner, Gas Station, Market**
3. ✅ **Win = All landmarks connected to turnpike(s)**
4. ✅ **Roads follow hierarchy** (local → arterial → highway → turnpike)
5. ✅ **Tiles rotate 90° clockwise** on click
6. ✅ **Some tiles are fixed** (non-rotatable)
7. ✅ **Each connection reveals a headline**

---

## **Future Enhancements**

### **Phase 1 (Current)**
- Basic grid puzzle
- Landmark connections
- Headline reveals

### **Phase 2**
- Level progression
- Multiple levels per news section
- Win/loss screens

### **Phase 3**
- Car animation along completed paths
- Timed challenges
- Rotation limits

### **Phase 4**
- Level editor
- Community puzzles
- Daily challenges

---

## **Success Metrics**

- Average time to solve
- Number of rotations needed
- Completion percentage
- Headlines collected
- Player engagement (replay rate)
