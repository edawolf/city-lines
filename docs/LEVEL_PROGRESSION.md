# City Lines - Level Progression

## Level Design Philosophy

City Lines uses a **solution-first** level generation approach that guarantees solvable puzzles. Each level teaches new mechanics while increasing complexity.

### Core Mechanics
1. **Rotate tiles** to create valid road connections
2. **Connect landmarks** (diner, gas station, market) to the turnpike
3. **No dead-ends** - all roads must be part of valid paths
4. **Road hierarchy** - Landmark → Local → Arterial → Highway → Turnpike

---

## Level 1: Tutorial (4x4, 2 Landmarks)

**File:** `public/config/city-lines-level-1.json`
**Grid:** 4×4
**Landmarks:** 2 (Diner, Gas Station)
**Tiles:** 7 total

**Learning Objectives:**
- Understand tile rotation mechanics
- Learn that landmarks must connect to turnpike
- Introduction to corner and T-junction tiles

**Tile Types:**
- 2 Landmarks (fixed)
- 1 Turnpike (fixed)
- 2 T-junctions (rotatable)
- 1 Corner (rotatable)
- 1 Straight (implied from T-junction paths)

**Layout:**
```
Row 0: [ ] [🍔 Diner] [⛽ Gas] [ ]
Row 1: [ ] [T-junction] [T-junction] [ ]
Row 2: [ ] [Corner] [T-junction] [ ]
Row 3: [ ] [ ] [🚧 Turnpike] [ ]
```

**Challenge:** Simple path-finding with 2 converging paths

---

## Level 2: Expanded Grid (5x5, 2 Landmarks)

**File:** `public/config/city-lines-level-2.json`
**Grid:** 5×5
**Landmarks:** 2
**Tiles:** 9 total

**Learning Objectives:**
- Handle larger grid space
- More spacing between elements
- Introduction to longer paths

**Challenge:** More tiles to rotate, longer connection paths

---

## Level 3: Three Landmarks (5x5, 3 Landmarks)

**File:** `public/config/city-lines-level-3.json`
**Grid:** 5×5
**Landmarks:** 3 (Diner, Gas Station, Market)
**Tiles:** 13 total

**Learning Objectives:**
- Manage multiple landmark connections
- Complex path intersections
- More T-junctions and potential crossroads

**Challenge:** Coordinating 3 different paths to the turnpike

---

## Generated Level Format

All levels follow this JSON structure:

```json
{
  "name": "City Lines - Level X",
  "description": "Level description",
  "viewport": { "width": 800, "height": 600 },
  "entities": [
    {
      "id": "city_grid",
      "type": "CityGrid",
      "position": { "x": 0, "y": 0 },
      "config": {
        "rows": 4,
        "cols": 4,
        "backgroundColor": "0x1a1a2e",
        "uiConfig": {
          "position": { "x": 50, "y": 50 },
          "size": { "width": 60, "height": 60 },
          "tileCount": { "rows": 4, "cols": 4 },
          "padding": { "all": 2 }
        }
      }
    }
  ],
  "ui": [
    {
      "id": "headline_display",
      "type": "HeadlineDisplay",
      "config": { ... }
    }
  ],
  "gridTiles": [
    {
      "row": 0,
      "col": 1,
      "tileType": "landmark",
      "roadType": "landmark",
      "rotation": 180,
      "rotatable": false,
      "solutionRotation": 180,
      "landmarkType": "diner"
    },
    ...
  ]
}
```

---

## Future Level Ideas

### Level 4: Crossroads Introduction (6x6, 3 Landmarks)
- Introduce crossroads tile (4-way intersection)
- Multiple path convergence points
- **Difficulty:** Medium

### Level 5: Dense City (6x6, 4 Landmarks)
- Maximum landmark density
- Complex path weaving
- Multiple crossroads
- **Difficulty:** Hard

### Level 6: The Maze (7x7, 3 Landmarks)
- Sparse landmark placement
- Long winding paths
- Strategic tile placement
- **Difficulty:** Hard

### Level 7: All Roads Lead Home (8x8, 5 Landmarks)
- Large grid with maximum landmarks
- Ultimate challenge
- **Difficulty:** Expert

---

## Generating Custom Levels

Use the level generator CLI:

```bash
# Generate Level 4
npx tsx scripts/generate-level.ts \
  --rows 6 --cols 6 \
  --landmarks 3 \
  --seed 300 \
  --output public/config/city-lines-level-4.json

# Generate Level 5
npx tsx scripts/generate-level.ts \
  --rows 6 --cols 6 \
  --landmarks 4 \
  --seed 400 \
  --output public/config/city-lines-level-5.json
```

---

## Validation Rules

All generated levels are validated to ensure:

1. ✅ **All landmarks connect to turnpike** - Every landmark has a valid path
2. ✅ **No dead-end roads** - All tiles are part of landmark→turnpike paths
3. ✅ **No dangling openings** - No tile openings point to empty grid spaces
4. ✅ **Correct tile types** - Automatically determined (straight, corner, t-junction, crossroads)
5. ✅ **Proper rotations** - Solution rotations calculated based on neighbor connections

---

## Difficulty Scaling

| Metric | Easy | Medium | Hard | Expert |
|--------|------|--------|------|--------|
| Grid Size | 4x4-5x5 | 5x5-6x6 | 6x6-7x7 | 8x8+ |
| Landmarks | 2 | 3 | 3-4 | 4-5 |
| Total Tiles | 7-9 | 10-15 | 16-25 | 25+ |
| Intersections | Few | Some | Many | Complex |
| Path Length | Short | Medium | Long | Very Long |

---

## Playtesting Notes

- **Level 1** should be completable in 30-60 seconds
- **Level 2** should take 1-2 minutes
- **Level 3** should take 2-3 minutes
- Progressive difficulty curve ensures player retention
- Each level introduces one new concept

---

## Implementation Status

- ✅ Level 1 - Complete with UI
- ✅ Level 2 - Generated (needs UI polish)
- ✅ Level 3 - Generated (needs UI polish)
- ⏳ Level 4+ - Ready to generate

---

**Next Steps:**
1. Add headlines for each level
2. Create level selection screen
3. Add difficulty ratings in UI
4. Implement star rating system (time-based?)
