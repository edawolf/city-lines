# City Lines - Icon Library Guide

## Using Emoji Icons

The game now uses **emoji icons** rendered as text - no external libraries needed! PixiJS Text supports emojis natively.

---

## **Available Icon Options**

### 🏠 **Houses / Residential**

Choose any of these for house destinations:

- `🏠` - House (current default)
- `🏡` - House with garden
- `🏘️` - Houses (multiple)
- `🏚️` - Derelict house (for abandoned areas)
- `🏚` - Old house

**Usage:**
```typescript
this.labelText.text = "🏠";
```

---

### 🏛️ **Landmarks / Destinations**

Different landmark types for different news sections:

#### **Government/Politics**
- `🏛️` - Classical building (current default)
- `🏢` - Office building
- `🏦` - Bank
- `🏤` - Post office
- `🏛` - Government building

#### **Sports**
- `🏟️` - Stadium
- `⚽` - Soccer ball
- `🏀` - Basketball
- `🏈` - Football
- `⚾` - Baseball

#### **Entertainment**
- `🎭` - Theater
- `🎬` - Movie camera
- `🎪` - Circus tent
- `🎨` - Art palette
- `🎵` - Musical note
- `🎸` - Guitar

#### **Business**
- `🏢` - Office building
- `🏭` - Factory
- `💼` - Briefcase
- `📊` - Chart
- `🏪` - Convenience store

#### **Food/Dining**
- `🍔` - Burger (diner)
- `🍕` - Pizza
- `☕` - Coffee
- `🍽️` - Restaurant
- `🥗` - Healthy food

#### **Services**
- `⛽` - Gas station
- `🚗` - Car (car service)
- `🏥` - Hospital
- `🏨` - Hotel
- `🏪` - Shop

**Usage:**
```typescript
// In config, add landmark type
"config": {
  "roadType": "landmark",
  "landmarkType": "stadium"  // Add this
}

// In RoadTile.ts, read landmarkType and select icon
const icons = {
  "stadium": "🏟️",
  "theater": "🎭",
  "city_hall": "🏛️",
  "business": "🏢"
};
this.labelText.text = icons[this.landmarkType] || "🏛️";
```

---

### 🚧 **Turnpike / Highway Gates**

Options for toll gates/highway entrances:

- `🚧` - Construction barrier (current default)
- `🛂` - Passport control (toll booth feel)
- `⛔` - No entry (gate feel)
- `🚦` - Traffic light
- `🚥` - Horizontal traffic light
- `🛑` - Stop sign
- `⚠️` - Warning sign
- `🎫` - Ticket (toll ticket)

**Usage:**
```typescript
this.labelText.text = "🚧";
```

---

### 🛣️ **Roads / Infrastructure**

Visual indicators for different road types (optional - currently using solid colors):

#### **Highways**
- `🛣️` - Motorway
- `🚗` - Car (indicates traffic)
- `🚙` - SUV

#### **Local Roads**
- `🏘️` - Houses (residential area)
- `🚶` - Person walking (pedestrian area)

**Usage:**
```typescript
// Add small icon to road tiles for visual variety
if (this.roadType === RoadType.Highway) {
  // Add small car icon
}
```

---

## **Configurable Icon System**

To make icons configurable via JSON:

### **1. Update RoadTileConfig**

```typescript
// In src/ludemic/entities/RoadTile.ts
export interface RoadTileConfig {
  tileType: string;
  roadType: RoadType;
  rotation: number;
  rotatable: boolean;
  color?: number;
  size?: number;
  gridPos?: { row: number; col: number };
  icon?: string; // ✨ Add this - custom emoji icon
  landmarkType?: string; // ✨ Add this - for landmark categories
}
```

### **2. Update Icon Selection**

```typescript
// In drawLandmarkIcon()
private drawLandmarkIcon(): void {
  // ... existing code ...

  // Use custom icon if provided, otherwise use default
  const icon = this.config.icon || this.getDefaultLandmarkIcon();
  if (this.labelText) {
    this.labelText.text = icon;
  }
}

private getDefaultLandmarkIcon(): string {
  // Map landmark types to icons
  const landmarkIcons: Record<string, string> = {
    "city_hall": "🏛️",
    "stadium": "🏟️",
    "theater": "🎭",
    "business": "🏢",
    "hospital": "🏥",
    "school": "🏫",
    "park": "🌳",
    "restaurant": "🍽️"
  };

  return landmarkIcons[this.landmarkType] || "🏛️";
}
```

### **3. JSON Configuration Example**

```json
{
  "id": "city_hall",
  "type": "RoadTile",
  "position": { "x": 400, "y": 100 },
  "config": {
    "tileType": "landmark",
    "roadType": "landmark",
    "landmarkType": "city_hall",
    "icon": "🏛️",
    "rotatable": false,
    "gridPos": { "row": 0, "col": 4 }
  }
}
```

---

## **Theme-Based Icon Sets**

Create different visual themes for different news sections:

### **Local News Theme**
```json
{
  "houses": "🏡",
  "landmarks": {
    "city_hall": "🏛️",
    "school": "🏫",
    "park": "🌳",
    "library": "📚"
  },
  "turnpike": "🚧"
}
```

### **Sports Theme**
```json
{
  "houses": "🏠",
  "landmarks": {
    "stadium": "🏟️",
    "arena": "🏀",
    "field": "⚽",
    "gym": "🏋️"
  },
  "turnpike": "🎫"
}
```

### **Entertainment Theme**
```json
{
  "houses": "🏠",
  "landmarks": {
    "theater": "🎭",
    "cinema": "🎬",
    "concert_hall": "🎵",
    "art_gallery": "🎨"
  },
  "turnpike": "🎫"
}
```

### **Business Theme**
```json
{
  "houses": "🏠",
  "landmarks": {
    "office": "🏢",
    "factory": "🏭",
    "bank": "🏦",
    "stock_exchange": "📊"
  },
  "turnpike": "🛂"
}
```

---

## **Implementation Status**

### ✅ **Currently Implemented**
- Emoji rendering via PixiJS Text
- House icon: 🏠
- Landmark icon: 🏛️
- Turnpike icon: 🚧
- All icons scale with tile size

### 🚀 **Next Steps (Optional)**
- Add `landmarkType` to config
- Create icon mapping system
- Add theme support
- Allow custom icons per level

---

## **Benefits of Emoji Icons**

✅ **No external libraries** - Works out of the box with PixiJS
✅ **Universal support** - All modern browsers support emoji
✅ **Easy to customize** - Just change the emoji character
✅ **Colorful by default** - Emojis have built-in colors
✅ **Scalable** - Text scales perfectly with tile size
✅ **Fast** - No image loading required

---

## **Alternative: Using Icon Fonts**

If you want more control (monochrome icons, custom colors), you can use icon fonts:

### **Option A: Font Awesome (Free)**

```bash
npm install @fortawesome/fontawesome-free
```

```typescript
// Import in main.ts
import '@fortawesome/fontawesome-free/css/all.css';

// Use in RoadTile
this.labelText.text = "\uf015"; // FontAwesome house icon
this.labelText.style.fontFamily = "Font Awesome 6 Free";
```

### **Option B: Material Icons**

```bash
npm install material-icons
```

```typescript
// Import in main.ts
import 'material-icons/iconfont/material-icons.css';

// Use in RoadTile
this.labelText.text = "home";
this.labelText.style.fontFamily = "Material Icons";
```

---

## **Testing Icons**

Open the game at **http://localhost:8086/** to see:
- 🏠 Houses at the bottom
- 🏛️ Landmarks at the top
- 🚧 Turnpikes in the middle

Try different emoji combinations to find what works best for your game!
