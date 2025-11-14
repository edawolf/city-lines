import { LevelGenerator } from '../src/ludemic/generation/LevelGenerator';
import { Direction, RoadType } from '../src/ludemic/types';

const generator = new LevelGenerator({
  gridSize: { rows: 4, cols: 4 },
  landmarkCount: 2,
  difficulty: 'easy',
  minPathLength: 3,
  seed: 4 * 12345
});

const level = generator.generate();

console.log('\n=== LEVEL 4 CONNECTION DEBUG ===\n');

// Build grid
const grid: any[][] = Array(4).fill(null).map(() => Array(4).fill(null));
level.tiles.forEach(tile => {
  grid[tile.row][tile.col] = tile;
});

// Function to get base openings
function getBaseOpenings(tileType: string): Direction[] {
  switch (tileType) {
    case 'straight': return [Direction.North, Direction.South];
    case 'corner': return [Direction.North, Direction.East];
    case 't_junction': return [Direction.North, Direction.East, Direction.West];
    case 'crossroads': return [Direction.North, Direction.East, Direction.South, Direction.West];
    case 'turnpike': return [Direction.North, Direction.East, Direction.South, Direction.West];
    case 'landmark': return [Direction.North, Direction.East, Direction.South, Direction.West];
    default: return [];
  }
}

// Function to rotate openings
function rotateOpenings(openings: Direction[], degrees: number): Direction[] {
  const steps = (degrees / 90) % 4;
  const directionOrder = [Direction.North, Direction.East, Direction.South, Direction.West];

  return openings.map((direction) => {
    const currentIndex = directionOrder.indexOf(direction);
    const newIndex = (currentIndex + steps) % 4;
    return directionOrder[newIndex];
  });
}

// Function to get openings with current rotation
function getOpenings(tile: any): Direction[] {
  const baseOpenings = getBaseOpenings(tile.tileType);
  return rotateOpenings(baseOpenings, tile.scrambledRotation);
}

// Function to get opposite direction
function getOppositeDirection(direction: Direction): Direction {
  switch (direction) {
    case Direction.North: return Direction.South;
    case Direction.South: return Direction.North;
    case Direction.East: return Direction.West;
    case Direction.West: return Direction.East;
  }
}

// Check all connections
console.log('Checking all adjacent tile pairs:\n');

level.tiles.forEach(tile => {
  const openings = getOpenings(tile);
  console.log(`\n[${tile.row},${tile.col}] ${tile.tileType} at ${tile.scrambledRotation}° - Openings: ${openings.map(d => Direction[d]).join(', ')}`);

  // Check North neighbor
  if (tile.row > 0 && grid[tile.row - 1][tile.col]) {
    const neighbor = grid[tile.row - 1][tile.col];
    const neighborOpenings = getOpenings(neighbor);
    const hasOpening = openings.includes(Direction.North);
    const neighborHasOpening = neighborOpenings.includes(Direction.South);
    console.log(`  → North [${neighbor.row},${neighbor.col}]: ${hasOpening && neighborHasOpening ? '✅ CONNECTED' : '❌ NOT CONNECTED'} (me: ${hasOpening ? 'has North' : 'no North'}, neighbor: ${neighborHasOpening ? 'has South' : 'no South'})`);
  }

  // Check East neighbor
  if (tile.col < 3 && grid[tile.row][tile.col + 1]) {
    const neighbor = grid[tile.row][tile.col + 1];
    const neighborOpenings = getOpenings(neighbor);
    const hasOpening = openings.includes(Direction.East);
    const neighborHasOpening = neighborOpenings.includes(Direction.West);
    console.log(`  → East [${neighbor.row},${neighbor.col}]: ${hasOpening && neighborHasOpening ? '✅ CONNECTED' : '❌ NOT CONNECTED'} (me: ${hasOpening ? 'has East' : 'no East'}, neighbor: ${neighborHasOpening ? 'has West' : 'no West'})`);
  }

  // Check South neighbor
  if (tile.row < 3 && grid[tile.row + 1][tile.col]) {
    const neighbor = grid[tile.row + 1][tile.col];
    const neighborOpenings = getOpenings(neighbor);
    const hasOpening = openings.includes(Direction.South);
    const neighborHasOpening = neighborOpenings.includes(Direction.North);
    console.log(`  → South [${neighbor.row},${neighbor.col}]: ${hasOpening && neighborHasOpening ? '✅ CONNECTED' : '❌ NOT CONNECTED'} (me: ${hasOpening ? 'has South' : 'no South'}, neighbor: ${neighborHasOpening ? 'has North' : 'no North'})`);
  }

  // Check West neighbor
  if (tile.col > 0 && grid[tile.row][tile.col - 1]) {
    const neighbor = grid[tile.row][tile.col - 1];
    const neighborOpenings = getOpenings(neighbor);
    const hasOpening = openings.includes(Direction.West);
    const neighborHasOpening = neighborOpenings.includes(Direction.East);
    console.log(`  → West [${neighbor.row},${neighbor.col}]: ${hasOpening && neighborHasOpening ? '✅ CONNECTED' : '❌ NOT CONNECTED'} (me: ${hasOpening ? 'has West' : 'no West'}, neighbor: ${neighborHasOpening ? 'has East' : 'no East'})`);
  }
});
