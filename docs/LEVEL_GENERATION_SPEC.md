# CITY LINES – LEVEL GENERATION SPEC

## 1. Goal

Implement a **solution-first level generator** for City Lines that:

- Always produces a solvable puzzle.
- Uses only `straight`, `corner`, and `t_junction` road tiles.
- Has no dangling road openings in the solved state.
- Ensures every road tile lies on at least one landmark → turnpike path.
- Works reliably with seeded randomness so InfiniteLevelManager can generate infinite levels without constant failures.

The generator lives in `LevelGenerator.ts` and is called by `InfiniteLevelManager.ts`.

---

## 2. Tiles and roles

### 2.1 Tile types

**turnpike**
- Endpoint of all paths.
- Not rotatable.
- Treated as a graph endpoint.

**landmark**
- Start of each path.
- Not rotatable.
- Each landmark must connect to the turnpike through a chain of LocalRoad tiles.
- There are multiple landmark types: Diner, GasStation, Market, etc.

**Road tiles with roadType = LocalRoad**
- `straight`
- `corner`
- `t_junction`
- Rotatable by the player in the puzzle state.
- Rotation in the solution state is chosen by the generator to match neighbors.

### 2.2 Connection rules

In the solved state:
- A tile has openings in specific directions based on its type and rotation.
- Two adjacent tiles are connected only if:
  - They are neighbors on the grid, and
  - Each has an opening facing the other.

**Constraints:**
- **No crossroads.** No tile may have 4 connected neighbors.
- Road tiles should not end in dead ends.
- Only landmarks and the turnpike are allowed to have degree 1.
- All road tiles must be part of at least one landmark → turnpike path.

---

## 3. RNG and determinism

The generator must:
- Accept a seed and use a deterministic RNG (XORshift or similar).
- Produce the same layout for the same seed.
- Allow InfiniteLevelManager to vary seeds per level and per attempt.

**InfiniteLevelManager:**
- Computes a base seed from the level number.
- On each attempt, passes `seed: baseSeed + (attemptIndex - 1)` to LevelGenerator.
- Retries up to `MAX_GENERATION_ATTEMPTS` when generation throws.

The generator should be robust enough that valid levels are produced in a small number of attempts.

---

## 4. Overall pipeline

The level generation pipeline must follow these conceptual steps:

1. **Place the turnpike** according to difficulty rules.
2. **Place landmarks** on valid grid cells with spacing constraints.
3. **Generate a path** from each landmark to the turnpike using a constrained random walk.
4. **Convert the path graph** into concrete tile types and rotations.
5. **Prune orphan roads** so only tiles on landmark → turnpike paths remain.
6. **Validate:**
   - No illegal crossroads
   - No dangling road openings
   - All landmarks can reach the turnpike
7. **Scramble rotations** to create the actual puzzle state.
8. **Export** to the gridTiles format used by the game.

The generator should **throw** if any of the validation steps fail. InfiniteLevelManager will catch and retry with another seed.

---

## 5. Step details

### 5.1 Place turnpike

Accepts `difficulty: "easy" | "medium" | "hard"`.

**Placement rules:**

- **easy**: Place near the center region of the grid.
- **medium**: Place on a random edge (not corner).
- **hard**: Place on a corner or near-corner.

**Implementation details:**
- Create a `GeneratedTile` with:
  - `tileType: "turnpike"`
  - `roadType: RoadType.Turnpike`
  - `rotatable: false`

**Orientation rules:**
- **REQUIRED:** For logic and BFS, the turnpike is treated as connectable from all four sides.
- The turnpike is excluded from dangling-opening checks (it is an endpoint).
- This policy must be applied consistently across path generation, BFS traversal, and validation.

---

### 5.2 Place landmarks

Respect `landmarkCount` from config.

**Constraints:**
- Minimum Manhattan distance from turnpike (for example >= 3).
- Minimum spacing between landmarks.
- Optional quadrant distribution constraints to avoid clumping.

**Implementation details:**

For each landmark:
- Pick a candidate cell that is empty and satisfies all rules.
- Create a `GeneratedTile` with:
  - `tileType: "landmark"`
  - `roadType: RoadType.Landmark`
  - `rotatable: false`
  - `landmarkType` from a rotated list of types for variety.

**Orientation:**
- **In code, the landmark's base opening is South** (Direction.South).
- Landmarks must be oriented so that they open toward their adjacent road tile in the solved graph.
- After paths are built and tile types are assigned, landmarks should be rotated to face the road tile that starts their path.
- The rotation is calculated from the base South opening to match the direction of the adjacent tile.

---

### 5.3 Path generation between landmark and turnpike

The path generator is a **constrained random walk** that:

**Input:** from landmark, to turnpike.

**Output:** a list of tiles forming a path from landmark to turnpike.

**Requirements:**
- The path must reach the turnpike.
- The number of road tiles in the path must be at least `minPathLength`.
- The walk must respect grid bounds and avoid revisiting the same cell within a path.

**Constraints to enforce during pathing:**
- Avoid stepping into existing landmarks or turnpike except the final connection.
- **Avoid creating illegal crossroads:**
  - Before choosing a candidate step, simulate placing a road there and count how many neighboring road tiles it would have.
  - If it would create 4 neighbors (potential crossroads), skip that move.
- Optionally bias the path:
  - Ensure it eventually moves closer to the target.
  - Allow small detours to create interesting shapes, based on difficulty and a detour probability.

**Final connection:**
- When the current cell is adjacent to the turnpike and the path has at least `minPathLength` road tiles, you may connect to the turnpike.
- This must be compatible with how the turnpike is treated in connectivity checks:
  - Either allow turnpike connections from any side in the logic layer, or
  - Enforce that the final step approaches from a side the turnpike actually opens to.

---

### 5.4 Tile creation along paths

For each step in the path:
- If there is no tile at `(row, col)`:
  - Create a new road tile placeholder:
    - `tileType: "straight"` (temporary)
    - `roadType: LocalRoad`
    - `rotatable: true`
- If there is already a road tile, allow different landmark paths to share it.

At this point tiles may have arbitrary placeholder types because the real tile type and rotation are determined later based on actual neighbors.

---

### 5.5 Assign tile types and rotations (solution state)

After all paths are generated:

**For each grid tile that is rotatable (road tiles):**
- Inspect its neighbors and collect directions where connected tiles exist.
- Based on the number and pattern of directions:
  - **3 directions** → `t_junction`
  - **2 directions:**
    - Opposite directions (N/S or E/W) → `straight`
    - Adjacent directions → `corner`
  - **1 direction** → this should only be allowed for endpoints, so road tiles should typically not end in degree 1. These cases must be avoided or fixed earlier.
  - **4 directions** → forbidden. The generator must avoid creating this state.
- Compute rotation for each road tile so its openings exactly match the set of directions that actually have neighbors.

**For landmarks:**
- After road tile types have been assigned, each landmark should be rotated so its single opening faces the adjacent road tile that starts its path.

**For the turnpike:**
- **REQUIRED:** Treat it as logically connected on all sides in BFS.
- `getBaseTileOpenings("turnpike")` returns all four directions: North, East, South, West.
- The turnpike is excluded from dangling-opening validation.

---

### 5.6 Prune orphan roads

After paths and tile types are set:
- Only tiles that lie on at least one landmark → turnpike path should remain.

**CRITICAL:** Use the pre-generated solution paths, NOT BFS re-traversal.

**Algorithm:**
1. **Use the solution paths generated in step 3** (before rotations were calculated):
   - For each path in `solutionPaths`, mark ALL tiles in `path[]` as "on path"
   - This ensures consistency with the original path generation
   - DO NOT re-trace with BFS using `getTileOpenings()` - rotations may have changed!
2. Build a set of coordinates for tiles that are on any solution path.
3. Iterate over the grid:
   - Remove any tile that:
     - Is rotatable (road tile), and
     - Does not belong to the "on path" set.
4. Recompute tile types and rotations after pruning, because neighbor counts may have changed.

**Why not BFS?**
- BFS uses current tile rotations via `getTileOpenings()`
- Rotations are calculated AFTER paths are generated
- BFS might find different paths or miss tiles on the original paths
- This causes orphan roads that should have been pruned

---

### 5.7 Validation

After pruning and recomputing:

**No isolated road tiles**
- Any rotatable tile must have at least 2 neighbors if it represents a road.
- Landmark and turnpike tiles may be degree 1.

**No crossroads**
- No tile may have 4 neighbors in the final graph.

**No dangling road openings**
- For every road tile opening, the adjacent cell must contain a tile that has a matching opening back.
- **Endpoints:**
  - Landmarks and turnpike may be treated as endpoints. They can have one connection.
  - If you allow them to have logical openings on all sides, they should be excluded from dangling road checks.

**All landmarks reach the turnpike**
- For each landmark, BFS over tile openings until reach the turnpike.
- If any landmark cannot reach the turnpike, generation must be treated as a failure.

If any of these checks fail, the generator should **throw**. InfiniteLevelManager will catch, log, and retry with another seed.

---

## 6. Scrambling to create the puzzle

Once the solution state is valid:

For each rotatable tile:
- Pick a random rotation from `[0, 90, 180, 270]` using the RNG.
- Store:
  - `rotation` as the solution rotation.
  - `scrambledRotation` as the starting rotation for the player.

Landmarks and turnpike keep their rotation and are not rotatable.

The exported grid must include both the solution rotation and the scrambled rotation per tile.

---

## 7. Integration with InfiniteLevelManager

**InfiniteLevelManager:**
- For levels 1-3, loads hand-authored JSON from disk.
- For levels 4+, uses LevelGenerator.

**For each procedural level:**
1. Compute difficulty parameters using `getDifficultyParams(levelNumber)`
   - Choose `gridSize`, `landmarkCount`, `difficulty`, `minPathLength` based on a wave pattern.
2. Call LevelGenerator with these params plus a seed.
3. If LevelGenerator succeeds:
   - Convert `GeneratedLevel` into `GameConfig`:
     - Create a CityGrid entity with the specified rows, cols, and uiConfig.
     - Attach gridTiles from the generator, using:
       - `rotation: scrambledRotation`
       - `solutionRotation` from the solution state
       - `tileType`, `roadType`, `landmarkType`, `rotatable`.
4. If LevelGenerator throws after all attempts fail:
   - Fall back to a safe predefined template level.

---

## 8. What the LLM should fix / enforce

When you modify or regenerate `LevelGenerator.ts` and `InfiniteLevelManager.ts`:

### ✅ Ensure landmarks and turnpike connect correctly in the graph representation:
- Landmarks must be oriented to face their first road tile.
- Turnpike handling must be consistent with how BFS and dangling checks treat its openings.

### ✅ Ensure the path generator does not create illegal crossroads:
- Add checks before placing a road tile to avoid 4 neighbors.

### ✅ Ensure dead-end road tiles are not present in the final solution:
- Only landmarks and turnpike may be degree 1.

### ✅ Maintain all validations:
- No dangling road openings on road tiles.
- All landmarks reach the turnpike.

**The final code must adhere to this specification so that procedural levels are consistently solvable and the InfiniteLevelManager can generate infinite levels without frequent failures.**

---

## Quick Reference: Common Issues to Avoid

| Issue | Solution |
|-------|----------|
| **Crossroads (4 neighbors)** | Check neighbor count before placing road tile during path generation |
| **Dead-end roads** | Prune orphan roads; only landmarks/turnpike can be degree 1 |
| **Dangling openings** | Validate every opening has a matching tile with reciprocal opening |
| **Unreachable landmarks** | BFS from each landmark to turnpike after pruning |
| **Landmark orientation wrong** | Rotate landmarks to face their first road tile after tile types assigned |
| **Turnpike orientation inconsistent** | Treat turnpike as logically open on all sides, OR enforce consistent orientation |
| **Generation failures** | Use robust retry logic in InfiniteLevelManager with different seeds |
| **Non-deterministic levels** | Use seeded RNG (XORshift32) throughout |

---

**End of Specification** 🏁
