// Quick test to see if trees are generated
const { LevelGenerator } = require('./src/ludemic/generation/LevelGenerator.ts');

const params = {
  gridSize: 5,
  landmarkCount: 2,
  difficulty: 'easy',
  minPathLength: 3,
  detourProbability: 0.1
};

try {
  const level = LevelGenerator.generate(params, 12345);
  console.log('Generated level:');
  console.log('- Grid size:', level.gridSize);
  console.log('- Landmarks:', level.landmarks.length);
  console.log('- Road tiles:', level.roadTiles.length);
  console.log('- Tree tiles:', level.treeTiles.length);
  
  if (level.treeTiles.length > 0) {
    console.log('\nTree tiles found:');
    level.treeTiles.forEach(tree => {
      console.log(`  - Tree at (${tree.row}, ${tree.col}), type: ${tree.tileType}, roadType: ${tree.roadType}`);
    });
  } else {
    console.log('\nNo trees generated (grid might be full)');
  }
} catch (error) {
  console.error('Error:', error.message);
}
