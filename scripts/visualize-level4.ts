import { LevelGenerator } from '../src/ludemic/generation/LevelGenerator';
import { Direction } from '../src/ludemic/types';

const generator = new LevelGenerator({
  gridSize: { rows: 4, cols: 4 },
  landmarkCount: 2,
  difficulty: 'easy',
  minPathLength: 3,
  seed: 4 * 12345
});

const level = generator.generate();

// Build grid for visualization
const grid: any[][] = Array(4).fill(null).map(() => Array(4).fill(null));
level.tiles.forEach(tile => {
  grid[tile.row][tile.col] = tile;
});

console.log('\n=== SCRAMBLED STATE (what player sees) ===\n');

for (let row = 0; row < 4; row++) {
  let line = '';
  for (let col = 0; col < 4; col++) {
    const tile = grid[row][col];
    if (!tile) {
      line += '[     ] ';
    } else {
      const type = tile.tileType === 'landmark' ? tile.landmarkType.substring(0,3) :
                   tile.tileType === 'turnpike' ? 'TPK' :
                   tile.tileType === 't_junction' ? 'T' :
                   tile.tileType === 'corner' ? 'C' :
                   tile.tileType === 'straight' ? 'S' : '?';
      line += `[${type}:${tile.scrambledRotation.toString().padStart(3)}] `;
    }
  }
  console.log(line);
}

console.log('\n=== SOLUTION STATE (correct rotations) ===\n');

for (let row = 0; row < 4; row++) {
  let line = '';
  for (let col = 0; col < 4; col++) {
    const tile = grid[row][col];
    if (!tile) {
      line += '[     ] ';
    } else {
      const type = tile.tileType === 'landmark' ? tile.landmarkType.substring(0,3) :
                   tile.tileType === 'turnpike' ? 'TPK' :
                   tile.tileType === 't_junction' ? 'T' :
                   tile.tileType === 'corner' ? 'C' :
                   tile.tileType === 'straight' ? 'S' : '?';
      line += `[${type}:${tile.rotation.toString().padStart(3)}] `;
    }
  }
  console.log(line);
}
