#!/usr/bin/env bun

/**
 * Level Generator CLI Tool
 *
 * Usage:
 *   bun run scripts/generate-level.ts --landmarks 2 --difficulty easy
 *   bun run scripts/generate-level.ts --help
 */

import { LevelGenerator } from '../src/ludemic/generation/LevelGenerator';
import * as fs from 'fs';
import * as path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const config: any = {
  gridSize: { rows: 4, cols: 4 },
  landmarkCount: 2,
  difficulty: 'easy'
};

// Simple arg parser
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--help' || arg === '-h') {
    console.log(`
Level Generator CLI

Usage:
  bun run scripts/generate-level.ts [options]

Options:
  --landmarks <number>     Number of landmarks (default: 2)
  --difficulty <level>     Difficulty: easy, medium, hard (default: easy)
  --rows <number>          Grid rows (default: 4)
  --cols <number>          Grid columns (default: 4)
  --seed <number>          Random seed for reproducible levels
  --output <path>          Output file path (default: public/config/generated-level.json)
  --help, -h               Show this help

Examples:
  bun run scripts/generate-level.ts --landmarks 3 --difficulty medium
  bun run scripts/generate-level.ts --rows 5 --cols 5 --landmarks 4
    `);
    process.exit(0);
  } else if (arg === '--landmarks') {
    config.landmarkCount = parseInt(args[++i], 10);
  } else if (arg === '--difficulty') {
    config.difficulty = args[++i];
  } else if (arg === '--rows') {
    config.gridSize.rows = parseInt(args[++i], 10);
  } else if (arg === '--cols') {
    config.gridSize.cols = parseInt(args[++i], 10);
  } else if (arg === '--seed') {
    config.seed = parseInt(args[++i], 10);
  } else if (arg === '--output') {
    config.output = args[++i];
  }
}

const outputPath = config.output || 'public/config/generated-level.json';

console.log('🎲 City Lines Level Generator');
console.log('==============================');
console.log(`Grid Size: ${config.gridSize.rows}×${config.gridSize.cols}`);
console.log(`Landmarks: ${config.landmarkCount}`);
console.log(`Difficulty: ${config.difficulty}`);
if (config.seed) console.log(`Seed: ${config.seed}`);
console.log('');

// Generate level
const generator = new LevelGenerator(config);
const level = generator.generate();

// Export to JSON
const json = generator.exportToJSON(level);

// Save to file
const fullPath = path.resolve(process.cwd(), outputPath);
fs.writeFileSync(fullPath, json, 'utf-8');

console.log('');
console.log(`✅ Level generated successfully!`);
console.log(`📄 Saved to: ${fullPath}`);
console.log('');
console.log('To test the level, update PrimitiveTestScreen.ts to load:');
console.log(`  await GameBuilder.fromFile("${outputPath}")`);
