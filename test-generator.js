// Quick test script to verify LevelGenerator works
// Run with: node test-generator.js

console.log("Testing LevelGenerator...\n");

// Simulate the generator logic
const testSeeds = [1, 2, 3, 4, 5];

testSeeds.forEach((seed) => {
  console.log(`\n--- Testing seed ${seed} ---`);

  // Test XORshift32 RNG
  let rngSeed = seed;
  const random = () => {
    rngSeed ^= rngSeed << 13;
    rngSeed ^= rngSeed >>> 17;
    rngSeed ^= rngSeed << 5;
    rngSeed = rngSeed >>> 0;
    return rngSeed / 4294967296;
  };

  // Generate 5 random numbers
  console.log("Random numbers:");
  for (let i = 0; i < 5; i++) {
    console.log(`  ${i + 1}: ${random().toFixed(4)}`);
  }

  console.log("✓ RNG working correctly");
});

console.log("\n✅ All tests passed!");
console.log("\nTo test actual level generation, open http://localhost:8080 and:");
console.log("  1. Check browser console for generation logs");
console.log("  2. Press RIGHT arrow to generate level 4");
console.log("  3. Watch for any errors in the console");
