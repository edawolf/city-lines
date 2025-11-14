import { LevelGenerator } from '../src/ludemic/generation/LevelGenerator';

const generator = new LevelGenerator({
  gridSize: { rows: 4, cols: 4 },
  landmarkCount: 2,
  difficulty: 'easy',
  minPathLength: 3,
  seed: 4 * 12345
});

const level = generator.generate();

console.log('\n=== LEVEL 4 DEBUG ===\n');
console.log('Grid size:', level.gridSize);
console.log('Total tiles:', level.tiles.length);
console.log('\nTiles:');

level.tiles.forEach(tile => {
  const rotatable = tile.rotatable ? 'rotatable' : 'FIXED';
  const landmark = tile.landmarkType ? `(${tile.landmarkType})` : '';
  console.log(`[${tile.row},${tile.col}] ${tile.tileType} (${tile.roadType}) - rotation: ${tile.rotation} -> scrambled: ${tile.scrambledRotation} - ${rotatable} ${landmark}`);
});

console.log('\nSolution paths:');
level.solutionPaths.forEach(path => {
  console.log(`${path.landmark}:`, path.path.map(t => `[${t.row},${t.col}]`).join(' -> '));
});
