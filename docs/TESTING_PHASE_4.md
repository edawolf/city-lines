# Testing Phase 4: Juice Primitives

## Quick Start

The juice effects have been integrated into the gameplay screen. Here's how to test them:

### 1. Start the Development Server

```bash
bun run dev
# or
npm run dev
```

The game will open at http://localhost:8080 (or next available port)

### 2. Play the Game

**Controls:**
- **← →** or **A D**: Move paddle left/right
- Hit the ball with the paddle
- Destroy blocks to see juice effects!

### 3. What to Look For

When you destroy a block, you should see:

#### 🎆 Particle Effects (ParticleEmitter)
- **Yellow particles** explode from the destroyed block
- **15 particles** per explosion
- Particles fade out and scale down over their 0.6s lifetime
- Gravity pulls particles downward
- Subtle drag creates natural motion

#### 💥 Screen Shake (ScreenShake)
- **Subtle camera shake** on block destruction
- Intensity: 4 pixels
- Duration: 0.15 seconds
- Frequency: 35 Hz (smooth vibration)
- Automatically decays to smooth stop

#### 🔊 Sound Effects (SoundTrigger)
- Sound will play if audio assets are present
- Configured for "block-break.wav" at 70% volume
- Also configured for "paddle-hit.wav" at 50% volume

## Current Configuration

The game loads from `public/config/breakout-juicy.json`:

```json
{
  "id": "juice_manager",
  "type": "GameManager",
  "primitives": [
    {
      "type": "ParticleEmitter",
      "config": {
        "triggerOn": "block_destroyed",
        "particleCount": 15,
        "color": "0xFFFF00",
        "lifetime": 0.6,
        "spread": 360,
        "speed": 250
      }
    },
    {
      "type": "ScreenShake",
      "config": {
        "triggerOn": "block_destroyed",
        "intensity": 4,
        "duration": 0.15
      }
    },
    {
      "type": "SoundTrigger",
      "config": {
        "triggerOn": "block_destroyed",
        "soundId": "sounds/block-break.wav",
        "volume": 0.7
      }
    }
  ]
}
```

## Tweaking the Effects

### Make Particles More Intense

Edit `public/config/breakout-juicy.json`:

```json
{
  "type": "ParticleEmitter",
  "config": {
    "particleCount": 30,  // More particles
    "color": "0xFF0000",  // Red instead of yellow
    "lifetime": 1.0,      // Last longer
    "speed": 400          // Fly faster
  }
}
```

### Make Shake More Dramatic

```json
{
  "type": "ScreenShake",
  "config": {
    "intensity": 10,    // Bigger shake
    "duration": 0.3,    // Longer shake
    "frequency": 50     // Faster oscillation
  }
}
```

### Add Paddle Hit Effects

The config already includes a paddle hit sound trigger. To add more effects:

```json
{
  "type": "ParticleEmitter",
  "config": {
    "triggerOn": "paddle_hit",
    "particleCount": 5,
    "color": "0x4CAF50",  // Green particles
    "lifetime": 0.3,
    "spread": 180,
    "speed": 150
  }
}
```

## Debugging

### Check Console Output

Open browser console (F12) to see:

```
✅ Game loaded from config/breakout-juicy.json
🎮 Phase 4: JUICY Breakout! Destroy blocks and feel the juice!
🎆 Particle effects enabled
💥 Screen shake enabled
🔊 Sound triggers enabled (if audio assets loaded)
```

### Verify Events are Firing

Add console logging to primitives by checking GameContainer events:

```typescript
// In browser console after game loads:
window.game = game;  // Expose game container
game.on('block_destroyed', () => console.log('Block destroyed!'));
```

### Common Issues

**No particles appearing?**
- Check that GameContainer.addParticle() is being called
- Verify particles array is being updated in update loop
- Check particle lifetime is > 0

**No screen shake?**
- Verify GameContainer.shake() is being called
- Check that shakeDuration is > 0
- Verify game container position is being modified

**No sound?**
- Sound assets may not be loaded
- Check browser console for audio loading errors
- Verify audio context is initialized (some browsers require user interaction first)

## Performance Notes

The juice primitives are lightweight:
- **Particles**: ~15 active at a time, automatically cleaned up
- **Screen Shake**: Simple position offset, no heavy calculations
- **Sound Triggers**: Event-driven, no per-frame overhead

## Next Steps

After testing Phase 4, try:

1. **Adjust parameters** in breakout-juicy.json
2. **Add new events** (e.g., "paddle_hit", "level_complete")
3. **Create new juice combinations** by mixing primitives
4. **Move to Phase 5**: Implement difficulty scaling and combos

---

**Phase 4 Complete!** Enjoy the juice! 🎉
