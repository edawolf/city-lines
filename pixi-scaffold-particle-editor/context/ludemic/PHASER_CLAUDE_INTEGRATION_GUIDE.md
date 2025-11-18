# PhaserJS + Claude Integration Guide

A comprehensive handbook for Claude AI to effectively work with PhaserJS projects, covering layout systems, graphics creation, visual effects, and best practices for game development assistance.

> Philosophy: Prioritize ludemic design principles, maintain code quality, and provide immediate, testable solutions that enhance gameplay feel and player agency.

---

## 0) Quick Context Setup

When working with PhaserJS projects, always consider:

- **Game Resolution**: Base resolution is typically 1024×768 (treat as game-space coordinates)
- **Scene Flow**: Boot → Preloader → MainMenu → Game → GameOver
- **Ludemic Principles**: Focus on feel-first mechanics, emergent complexity, and player agency
- **TypeScript**: Prefer strong typing and functional composition over inheritance

---

## 1) Scene Architecture & Management

### Scene Lifecycle Understanding

```typescript
// Standard scene structure
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
  }

  preload() {
    // Load assets - keep minimal, most loading in Preloader scene
    this.load.image('placeholder', 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=')
  }

  create() {
    // Initialize game objects, physics, UI
    this.setupGameObjects()
    this.setupPhysics()
    this.setupUI()
    this.setupInput()
  }

  update(time: number, delta: number) {
    // Game loop logic - keep minimal, prefer event-driven architecture
    this.updateGameLogic(delta)
  }
}
```

### Scene Transitions

```typescript
// Smooth scene transitions with data passing
class SceneManager {
  static transition(currentScene: Phaser.Scene, targetKey: string, data?: any) {
    currentScene.scene.start(targetKey, data)
  }

  static overlay(currentScene: Phaser.Scene, overlayKey: string, data?: any) {
    currentScene.scene.launch(overlayKey, data)
    currentScene.scene.pause()
  }
}

// Usage in scenes
this.input.keyboard?.once('keydown-ESC', () => {
  SceneManager.overlay(this, 'PauseMenu', { fromScene: this.scene.key })
})
```

---

## 2) Layout System & Responsive Design

### Game-Space Coordinate System

```typescript
// Layout utilities for consistent positioning
export class LayoutManager {
  static readonly GAME_WIDTH = 1024
  static readonly GAME_HEIGHT = 768
  static readonly CENTER_X = this.GAME_WIDTH / 2
  static readonly CENTER_Y = this.GAME_HEIGHT / 2

  // Percentage-based positioning
  static getX(percentage: number): number {
    return (percentage / 100) * this.GAME_WIDTH
  }

  static getY(percentage: number): number {
    return (percentage / 100) * this.GAME_HEIGHT
  }

  // Safe area calculations for mobile
  static getSafeArea(scene: Phaser.Scene) {
    const scale = scene.scale
    return {
      left: scale.displaySize.width * 0.05,
      right: scale.displaySize.width * 0.95,
      top: scale.displaySize.height * 0.1,
      bottom: scale.displaySize.height * 0.9
    }
  }
}
```

### Responsive UI Elements

```typescript
// Responsive text that scales with screen size
class ResponsiveText extends Phaser.GameObjects.Text {
  constructor(scene: Phaser.Scene, x: number, y: number, text: string) {
    const fontSize = Math.min(scene.scale.gameSize.width / 30, 32)
    super(scene, x, y, text, {
      fontSize: `${fontSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      align: 'center'
    })
    
    this.setOrigin(0.5)
    scene.add.existing(this)
  }

  updateLayout(scene: Phaser.Scene) {
    const fontSize = Math.min(scene.scale.gameSize.width / 30, 32)
    this.setFontSize(fontSize)
  }
}

// Auto-layout container
class FlexContainer extends Phaser.GameObjects.Container {
  private spacing: number
  private direction: 'horizontal' | 'vertical'

  constructor(scene: Phaser.Scene, x: number, y: number, direction = 'vertical', spacing = 20) {
    super(scene, x, y)
    this.spacing = spacing
    this.direction = direction
    scene.add.existing(this)
  }

  addItem(item: Phaser.GameObjects.GameObject) {
    this.add(item)
    this.rearrange()
  }

  private rearrange() {
    this.list.forEach((item, index) => {
      if (this.direction === 'vertical') {
        item.y = index * this.spacing
        item.x = 0
      } else {
        item.x = index * this.spacing
        item.y = 0
      }
    })
  }
}
```

---

## 3) Graphics Creation & Visual Assets

### Procedural Graphics

```typescript
// Create graphics procedurally for rapid prototyping
class GraphicsFactory {
  static createButton(scene: Phaser.Scene, width: number, height: number, color = 0x4a90e2): Phaser.GameObjects.Graphics {
    const graphics = scene.add.graphics()
    
    // Rounded rectangle button
    graphics.fillStyle(color)
    graphics.fillRoundedRect(0, 0, width, height, 8)
    
    // Border
    graphics.lineStyle(2, 0xffffff, 0.8)
    graphics.strokeRoundedRect(0, 0, width, height, 8)
    
    return graphics
  }

  static createProgressBar(scene: Phaser.Scene, width: number, height: number): {
    background: Phaser.GameObjects.Graphics,
    fill: Phaser.GameObjects.Graphics,
    update: (progress: number) => void
  } {
    const background = scene.add.graphics()
    const fill = scene.add.graphics()
    
    background.fillStyle(0x222222)
    background.fillRoundedRect(0, 0, width, height, height / 2)
    
    const update = (progress: number) => {
      fill.clear()
      fill.fillStyle(0x4a90e2)
      fill.fillRoundedRect(2, 2, (width - 4) * progress, height - 4, (height - 4) / 2)
    }
    
    return { background, fill, update }
  }

  static createParticleTexture(scene: Phaser.Scene, size = 8, color = 0xffffff): string {
    const graphics = scene.add.graphics()
    graphics.fillStyle(color)
    graphics.fillCircle(size / 2, size / 2, size / 2)
    
    const key = `particle_${color}_${size}`
    graphics.generateTexture(key, size, size)
    graphics.destroy()
    
    return key
  }
}
```

### Dynamic Textures

```typescript
// Runtime texture generation for effects
class TextureGenerator {
  static createGradient(scene: Phaser.Scene, width: number, height: number, colors: number[]): string {
    const graphics = scene.add.graphics()
    
    // Create gradient steps
    const steps = colors.length - 1
    for (let i = 0; i < steps; i++) {
      const y = (height / steps) * i
      const stepHeight = height / steps
      
      graphics.fillGradientStyle(colors[i], colors[i], colors[i + 1], colors[i + 1])
      graphics.fillRect(0, y, width, stepHeight)
    }
    
    const key = `gradient_${Date.now()}`
    graphics.generateTexture(key, width, height)
    graphics.destroy()
    
    return key
  }

  static createNoise(scene: Phaser.Scene, width: number, height: number, scale = 0.1): string {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    
    const imageData = ctx.createImageData(width, height)
    const data = imageData.data
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 255
      data[i] = noise     // R
      data[i + 1] = noise // G
      data[i + 2] = noise // B
      data[i + 3] = 255   // A
    }
    
    ctx.putImageData(imageData, 0, 0)
    
    const key = `noise_${Date.now()}`
    scene.textures.addCanvas(key, canvas)
    
    return key
  }
}
```

---

## 4) Visual Effects & Animation Systems

### Tween-Based Animations

```typescript
// Reusable animation presets
class AnimationPresets {
  static fadeIn(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, duration = 500): Phaser.Tweens.Tween {
    target.setAlpha(0)
    return scene.tweens.add({
      targets: target,
      alpha: 1,
      duration,
      ease: 'Power2'
    })
  }

  static slideIn(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, direction: 'left' | 'right' | 'up' | 'down' = 'up', duration = 800): Phaser.Tweens.Tween {
    const startPos = { ...target }
    
    switch (direction) {
      case 'up':
        target.y += scene.scale.gameSize.height
        return scene.tweens.add({
          targets: target,
          y: startPos.y,
          duration,
          ease: 'Back.easeOut'
        })
      case 'left':
        target.x -= scene.scale.gameSize.width
        return scene.tweens.add({
          targets: target,
          x: startPos.x,
          duration,
          ease: 'Back.easeOut'
        })
      // ... other directions
    }
  }

  static bounce(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, intensity = 0.1): Phaser.Tweens.Tween {
    return scene.tweens.add({
      targets: target,
      scaleX: 1 + intensity,
      scaleY: 1 + intensity,
      duration: 100,
      yoyo: true,
      ease: 'Back.easeOut'
    })
  }

  static shake(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, intensity = 5, duration = 200): Phaser.Tweens.Tween {
    const originalX = target.x
    const originalY = target.y
    
    return scene.tweens.add({
      targets: target,
      x: originalX + Phaser.Math.Between(-intensity, intensity),
      y: originalY + Phaser.Math.Between(-intensity, intensity),
      duration: 50,
      repeat: duration / 50,
      yoyo: true,
      onComplete: () => {
        target.setPosition(originalX, originalY)
      }
    })
  }
}
```

### Particle Systems

```typescript
// Advanced particle effects
class EffectsManager {
  static createExplosion(scene: Phaser.Scene, x: number, y: number, config?: Partial<Phaser.Types.GameObjects.Particles.ParticleEmitterConfig>) {
    const textureKey = GraphicsFactory.createParticleTexture(scene, 4, 0xff6b35)
    
    const emitter = scene.add.particles(x, y, textureKey, {
      speed: { min: 50, max: 150 },
      scale: { start: 1, end: 0 },
      lifespan: 300,
      quantity: 20,
      ...config
    })

    scene.time.delayedCall(500, () => emitter.destroy())
    return emitter
  }

  static createTrail(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, color = 0x4a90e2) {
    const textureKey = GraphicsFactory.createParticleTexture(scene, 6, color)
    
    return scene.add.particles(0, 0, textureKey, {
      follow: target,
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 200,
      frequency: 50
    })
  }

  static createUIGlow(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, color = 0xffffff) {
    const glowGraphics = scene.add.graphics()
    glowGraphics.fillStyle(color, 0.3)
    glowGraphics.fillCircle(0, 0, target.displayWidth * 0.6)
    glowGraphics.setPosition(target.x, target.y)
    
    scene.tweens.add({
      targets: glowGraphics,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      repeat: -1
    })
    
    return glowGraphics
  }
}
```

### Screen Effects

```typescript
// Post-processing style effects
class ScreenEffects {
  static screenFlash(scene: Phaser.Scene, color = 0xffffff, duration = 100) {
    const flash = scene.add.graphics()
    flash.fillStyle(color)
    flash.fillRect(0, 0, scene.scale.gameSize.width, scene.scale.gameSize.height)
    flash.setDepth(1000)
    
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration,
      onComplete: () => flash.destroy()
    })
  }

  static cameraShake(scene: Phaser.Scene, intensity = 10, duration = 200) {
    scene.cameras.main.shake(duration, intensity * 0.01)
  }

  static slowMotion(scene: Phaser.Scene, factor = 0.5, duration = 1000) {
    scene.physics.world.timeScale = factor
    scene.tweens.timeScale = factor
    
    scene.time.delayedCall(duration, () => {
      scene.physics.world.timeScale = 1
      scene.tweens.timeScale = 1
    })
  }

  static colorize(scene: Phaser.Scene, tint: number, duration = 500) {
    const overlay = scene.add.graphics()
    overlay.fillStyle(tint, 0.3)
    overlay.fillRect(0, 0, scene.scale.gameSize.width, scene.scale.gameSize.height)
    overlay.setDepth(999)
    
    scene.tweens.add({
      targets: overlay,
      alpha: 0,
      duration,
      onComplete: () => overlay.destroy()
    })
  }
}
```

---

## 5) Input & Interaction Systems

### Advanced Input Handling

```typescript
// Gesture and combo detection
class InputManager {
  private scene: Phaser.Scene
  private keyHistory: string[] = []
  private gestureStart: { x: number, y: number, time: number } | null = null

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.setupKeyboardInput()
    this.setupPointerInput()
  }

  private setupKeyboardInput() {
    this.scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      this.keyHistory.push(event.code)
      if (this.keyHistory.length > 10) {
        this.keyHistory.shift()
      }
      this.checkCombos()
    })
  }

  private setupPointerInput() {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.gestureStart = { x: pointer.x, y: pointer.y, time: this.scene.time.now }
    })

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.gestureStart) {
        this.detectGesture(pointer)
        this.gestureStart = null
      }
    })
  }

  private detectGesture(pointer: Phaser.Input.Pointer) {
    if (!this.gestureStart) return
    
    const dx = pointer.x - this.gestureStart.x
    const dy = pointer.y - this.gestureStart.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const duration = this.scene.time.now - this.gestureStart.time
    
    if (distance > 50 && duration < 500) {
      const angle = Math.atan2(dy, dx)
      const direction = this.getSwipeDirection(angle)
      this.scene.events.emit('swipe', direction, { dx, dy, distance, duration })
    }
  }

  private getSwipeDirection(angle: number): string {
    const degrees = (angle * 180 / Math.PI + 360) % 360
    if (degrees < 45 || degrees > 315) return 'right'
    if (degrees < 135) return 'down'
    if (degrees < 225) return 'left'
    return 'up'
  }

  checkCombo(sequence: string[]): boolean {
    if (this.keyHistory.length < sequence.length) return false
    
    const recent = this.keyHistory.slice(-sequence.length)
    return sequence.every((key, index) => recent[index] === key)
  }

  private checkCombos() {
    // Example: Konami code
    if (this.checkCombo(['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'])) {
      this.scene.events.emit('konami-code')
    }
  }
}
```

---

## 6) Audio Integration

### Dynamic Audio Management

```typescript
// Adaptive audio system
class AudioManager {
  private scene: Phaser.Scene
  private musicVolume = 1
  private sfxVolume = 1
  private currentMusic?: Phaser.Sound.BaseSound

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  playMusic(key: string, config?: Phaser.Types.Sound.SoundConfig) {
    if (this.currentMusic) {
      this.scene.tweens.add({
        targets: this.currentMusic,
        volume: 0,
        duration: 500,
        onComplete: () => {
          this.currentMusic?.stop()
          this.startNewMusic(key, config)
        }
      })
    } else {
      this.startNewMusic(key, config)
    }
  }

  private startNewMusic(key: string, config?: Phaser.Types.Sound.SoundConfig) {
    this.currentMusic = this.scene.sound.add(key, {
      loop: true,
      volume: 0,
      ...config
    })
    
    this.currentMusic.play()
    this.scene.tweens.add({
      targets: this.currentMusic,
      volume: this.musicVolume,
      duration: 500
    })
  }

  playSFX(key: string, config?: Phaser.Types.Sound.SoundConfig) {
    return this.scene.sound.play(key, {
      volume: this.sfxVolume,
      ...config
    })
  }

  // Positional audio for immersion
  playPositionalSFX(key: string, x: number, y: number, maxDistance = 500) {
    const listener = this.scene.cameras.main
    const distance = Phaser.Math.Distance.Between(listener.centerX, listener.centerY, x, y)
    const volume = Math.max(0, 1 - (distance / maxDistance)) * this.sfxVolume
    
    return this.scene.sound.play(key, { volume })
  }
}
```

---

## 7) Performance Optimization

### Object Pooling

```typescript
// Efficient object reuse system
class ObjectPool<T extends Phaser.GameObjects.GameObject> {
  private pool: T[] = []
  private activeObjects: Set<T> = new Set()
  private createFn: () => T

  constructor(createFunction: () => T, initialSize = 10) {
    this.createFn = createFunction
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      const obj = this.createFn()
      obj.setActive(false).setVisible(false)
      this.pool.push(obj)
    }
  }

  get(): T {
    let obj = this.pool.pop()
    
    if (!obj) {
      obj = this.createFn()
    }
    
    obj.setActive(true).setVisible(true)
    this.activeObjects.add(obj)
    return obj
  }

  release(obj: T) {
    if (this.activeObjects.has(obj)) {
      obj.setActive(false).setVisible(false)
      this.activeObjects.delete(obj)
      this.pool.push(obj)
    }
  }

  releaseAll() {
    this.activeObjects.forEach(obj => this.release(obj))
  }

  getActiveCount(): number {
    return this.activeObjects.size
  }

  getPoolSize(): number {
    return this.pool.length
  }
}

// Usage example
class BulletPool extends ObjectPool<Phaser.Physics.Arcade.Sprite> {
  constructor(scene: Phaser.Scene) {
    super(() => {
      const bullet = scene.physics.add.sprite(0, 0, 'bullet')
      bullet.setActive(false).setVisible(false)
      return bullet
    }, 50)
  }

  fire(x: number, y: number, velocityX: number, velocityY: number) {
    const bullet = this.get()
    bullet.setPosition(x, y)
    bullet.setVelocity(velocityX, velocityY)
    
    // Auto-release after time
    bullet.scene.time.delayedCall(3000, () => this.release(bullet))
    
    return bullet
  }
}
```

---

## 8) State Management & Data Flow

### Game State Architecture

```typescript
// Centralized state management
interface GameState {
  player: {
    health: number
    score: number
    level: number
    powerups: string[]
  }
  world: {
    currentArea: string
    completedLevels: string[]
    unlockedFeatures: string[]
  }
  settings: {
    musicVolume: number
    sfxVolume: number
    difficulty: 'easy' | 'normal' | 'hard'
  }
}

class StateManager extends Phaser.Events.EventEmitter {
  private state: GameState
  private previousState: GameState

  constructor(initialState: GameState) {
    super()
    this.state = { ...initialState }
    this.previousState = { ...initialState }
  }

  getState(): Readonly<GameState> {
    return this.state
  }

  updateState(updates: Partial<GameState>) {
    this.previousState = { ...this.state }
    this.state = { ...this.state, ...updates }
    this.emit('stateChanged', this.state, this.previousState)
  }

  updatePlayer(updates: Partial<GameState['player']>) {
    this.updateState({
      player: { ...this.state.player, ...updates }
    })
  }

  canUndo(): boolean {
    return JSON.stringify(this.state) !== JSON.stringify(this.previousState)
  }

  undo() {
    if (this.canUndo()) {
      const temp = this.state
      this.state = this.previousState
      this.previousState = temp
      this.emit('stateChanged', this.state, this.previousState)
    }
  }

  // Persistence
  save(key = 'gameState') {
    localStorage.setItem(key, JSON.stringify(this.state))
  }

  load(key = 'gameState'): boolean {
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        this.state = JSON.parse(saved)
        this.emit('stateChanged', this.state, this.previousState)
        return true
      } catch (e) {
        console.warn('Failed to load game state:', e)
      }
    }
    return false
  }
}
```

---

## 9) Testing Integration

### Ludemic Testing Patterns

```typescript
// Testing game mechanics with Ludemic principles
import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { makeHeadlessGame } from '../test-utils/makeHeadlessGame'

describe('Archery Mechanics (Ludemic Analysis)', () => {
  let game: Phaser.Game
  let scene: ArcheryScene
  
  beforeEach(async () => {
    scene = new ArcheryScene()
    game = makeHeadlessGame(scene)
    await new Promise<void>(r => game.events.once(Phaser.Core.Events.READY, () => r()))
  })

  afterEach(async () => {
    await game.destroy(true)
  })

  test('MIYAMOTO_LENS: immediate feel satisfaction', async () => {
    // Test the "playground test" - is it immediately fun?
    const bow = scene.createBow(512, 400)
    const drawSpy = globalThis.sandbox.spy()
    
    bow.on('draw', drawSpy)
    bow.startDraw()
    
    expect(drawSpy.called).toBe(true)
    expect(bow.tension).toBeGreaterThan(0)
  })

  test('PROGRESSION_ARC: Ki-Sho-Ten-Ketsu flow', async () => {
    // Ki (introduction) - setup
    scene.startLevel(1)
    expect(scene.targets.length).toBe(3)
    
    // Sho (development) - progression
    scene.hitTarget(scene.targets[0])
    scene.hitTarget(scene.targets[1])
    expect(scene.score).toBe(200)
    
    // Ten (twist) - challenge escalation
    scene.hitTarget(scene.targets[2])
    expect(scene.currentLevel).toBe(2)
    expect(scene.targets.length).toBe(5) // More targets
    
    // Ketsu (conclusion) - satisfying resolution
    // Tested in integration tests
  })

  test('EMERGENCE_MATRIX: orthogonal complexity', async () => {
    // Test how wind + target movement + power-ups interact
    const arrow = scene.fireArrow(100, -200) // power, angle
    scene.setWind(50) // Add wind factor
    scene.activatePowerUp('piercing') // Add piercing
    
    // The mechanics should interact multiplicatively, not additively
    expect(arrow.trajectoryComplexity()).toBeGreaterThan(
      scene.baseComplexity + scene.windComplexity + scene.powerUpComplexity
    )
  })

  test('AGENCY_VECTORS: multiple solution paths', async () => {
    const target = scene.createTarget(800, 300)
    
    // Path 1: High arc shot
    const highShot = scene.calculateTrajectory(80, -60) // low power, high angle
    
    // Path 2: Direct shot
    const directShot = scene.calculateTrajectory(150, -30) // high power, low angle
    
    // Path 3: Bank shot (if walls present)
    const bankShot = scene.calculateBankShot(target, scene.walls)
    
    // All paths should be viable
    expect([highShot, directShot, bankShot].every(shot => shot.canHitTarget(target))).toBe(true)
  })
})
```

---

## 10) Ludemic Integration Patterns

### Feel-First Mechanics Implementation

```typescript
// Implementing Miyamoto's "playground test"
class FeelFirstMechanics {
  static createResponsiveBow(scene: Phaser.Scene, x: number, y: number) {
    const bow = scene.add.sprite(x, y, 'bow')
    const string = scene.add.graphics()
    
    // Immediate visual feedback
    bow.setInteractive()
    bow.on('pointerdown', () => {
      // Instant gratification - immediate response
      AnimationPresets.bounce(scene, bow, 0.05)
      AudioManager.playSFX('bowDraw')
      
      // Progressive tension build-up
      const drawTween = scene.tweens.add({
        targets: bow,
        scaleY: 1.1,
        duration: 2000,
        ease: 'Power2',
        onUpdate: (tween) => {
          const progress = tween.progress
          bow.setTint(Phaser.Display.Color.GetColor(255, 255 - progress * 100, 255 - progress * 100))
          
          // Haptic-style feedback through micro-animations
          if (progress > 0.7) {
            bow.x += Phaser.Math.Between(-1, 1)
          }
        }
      })
      
      bow.on('pointerup', () => {
        drawTween.stop()
        this.releaseBow(scene, bow, drawTween.progress)
      })
    })
    
    return bow
  }

  private static releaseBow(scene: Phaser.Scene, bow: Phaser.GameObjects.Sprite, tension: number) {
    // Satisfying release with proportional power
    ScreenEffects.cameraShake(scene, tension * 5, 100)
    AnimationPresets.shake(scene, bow, tension * 3, 150)
    
    // Visual power indicator
    const powerRing = scene.add.graphics()
    powerRing.lineStyle(4, 0xffffff, tension)
    powerRing.strokeCircle(bow.x, bow.y, 30 + tension * 20)
    
    scene.tweens.add({
      targets: powerRing,
      alpha: 0,
      duration: 300,
      onComplete: () => powerRing.destroy()
    })
  }
}
```

### Emergent Complexity Patterns

```typescript
// Jonathan Blow-style orthogonal system interactions
class EmergentSystemsManager {
  private systems: Map<string, GameSystem> = new Map()
  private interactions: Map<string, SystemInteraction[]> = new Map()

  registerSystem(name: string, system: GameSystem) {
    this.systems.set(name, system)
  }

  registerInteraction(systemA: string, systemB: string, interaction: SystemInteraction) {
    const key = `${systemA}-${systemB}`
    if (!this.interactions.has(key)) {
      this.interactions.set(key, [])
    }
    this.interactions.get(key)!.push(interaction)
  }

  update(delta: number) {
    // Update all systems
    this.systems.forEach(system => system.update(delta))
    
    // Process interactions
    this.interactions.forEach((interactions, key) => {
      const [systemAName, systemBName] = key.split('-')
      const systemA = this.systems.get(systemAName)
      const systemB = this.systems.get(systemBName)
      
      if (systemA && systemB) {
        interactions.forEach(interaction => {
          interaction.process(systemA, systemB, delta)
        })
      }
    })
  }
}

interface GameSystem {
  update(delta: number): void
  getState(): any
}

interface SystemInteraction {
  process(systemA: GameSystem, systemB: GameSystem, delta: number): void
}

// Example: Wind affects trajectory affects target scoring
class WindSystem implements GameSystem {
  public force = 0
  public direction = 0

  update(delta: number) {
    // Dynamic wind variation
    this.force += (Math.random() - 0.5) * 0.1
    this.force = Phaser.Math.Clamp(this.force, 0, 10)
  }

  getState() {
    return { force: this.force, direction: this.direction }
  }
}

class TrajectoryWindInteraction implements SystemInteraction {
  process(trajectorySystem: any, windSystem: WindSystem, delta: number) {
    // Wind affects all active projectiles
    trajectorySystem.projectiles.forEach((projectile: any) => {
      projectile.velocity.x += windSystem.force * Math.cos(windSystem.direction) * 0.01
      projectile.velocity.y += windSystem.force * Math.sin(windSystem.direction) * 0.01
    })
  }
}
```

---

## 11) Mobile & Touch Optimization

### Touch-First Interaction Design

```typescript
class TouchOptimizedControls {
  static createTouchZones(scene: Phaser.Scene) {
    const safeArea = LayoutManager.getSafeArea(scene)
    
    // Large, forgiving touch areas
    const drawZone = scene.add.zone(
      safeArea.left + 100, 
      safeArea.top + 100, 
      200, 
      scene.scale.gameSize.height - 200
    )
    drawZone.setInteractive()
    drawZone.setOrigin(0)
    
    // Visual feedback for touch areas (debug mode)
    if (scene.game.config.physics?.arcade?.debug) {
      const graphics = scene.add.graphics()
      graphics.lineStyle(2, 0x00ff00, 0.5)
      graphics.strokeRect(drawZone.x, drawZone.y, drawZone.width, drawZone.height)
    }
    
    return {
      drawZone,
      aimZone: this.createAimZone(scene, safeArea)
    }
  }

  private static createAimZone(scene: Phaser.Scene, safeArea: any) {
    const aimZone = scene.add.zone(
      safeArea.right - 150,
      safeArea.top + 100,
      150,
      300
    )
    aimZone.setInteractive()
    
    // Joystick-style aiming
    let aimCenter = { x: aimZone.x, y: aimZone.y }
    let isDragging = false
    
    aimZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      isDragging = true
      aimCenter = { x: pointer.x, y: pointer.y }
    })
    
    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (isDragging) {
        const distance = Phaser.Math.Distance.Between(aimCenter.x, aimCenter.y, pointer.x, pointer.y)
        const angle = Phaser.Math.Angle.Between(aimCenter.x, aimCenter.y, pointer.x, pointer.y)
        
        // Constrain to circular area
        const maxDistance = 75
        const clampedDistance = Math.min(distance, maxDistance)
        
        scene.events.emit('aim', {
          angle,
          power: clampedDistance / maxDistance
        })
      }
    })
    
    scene.input.on('pointerup', () => {
      isDragging = false
    })
    
    return aimZone
  }

  // Gesture recognition for advanced controls
  static enableGestures(scene: Phaser.Scene) {
    const gestureManager = new InputManager(scene)
    
    scene.events.on('swipe', (direction: string, data: any) => {
      switch (direction) {
        case 'up':
          scene.events.emit('quickShot', data.distance / 100)
          break
        case 'down':
          scene.events.emit('powerShot', data.distance / 200)
          break
        case 'left':
        case 'right':
          scene.events.emit('changeArrow', direction)
          break
      }
    })
    
    return gestureManager
  }
}
```

---

## 12) Accessibility & Inclusive Design

### Universal Design Patterns

```typescript
class AccessibilityManager {
  private scene: Phaser.Scene
  private isHighContrast = false
  private isReducedMotion = false
  private fontSize = 1.0

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.detectPreferences()
    this.setupAccessibilityFeatures()
  }

  private detectPreferences() {
    // Respect system preferences
    this.isHighContrast = window.matchMedia('(prefers-contrast: high)').matches
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  private setupAccessibilityFeatures() {
    // High contrast mode
    if (this.isHighContrast) {
      this.enableHighContrast()
    }
    
    // Reduced motion
    if (this.isReducedMotion) {
      this.reduceMotion()
    }
    
    // Keyboard navigation
    this.setupKeyboardNavigation()
    
    // Screen reader support
    this.setupScreenReaderSupport()
  }

  private enableHighContrast() {
    // Override color schemes for better visibility
    const pipeline = this.scene.renderer.pipelines
    
    // Add contrast adjustment pipeline if available
    if (pipeline && 'ColorMatrix' in pipeline) {
      this.scene.cameras.main.setPostPipeline('ColorMatrix')
    }
  }

  private reduceMotion() {
    // Override animation durations
    const originalTweenAdd = this.scene.tweens.add.bind(this.scene.tweens)
    this.scene.tweens.add = (config: any) => {
      if (config.duration) {
        config.duration = Math.min(config.duration, 100) // Cap animations
      }
      return originalTweenAdd(config)
    }
  }

  private setupKeyboardNavigation() {
    const keyboard = this.scene.input.keyboard
    if (!keyboard) return
    
    // Tab navigation for UI elements
    const focusableElements: Phaser.GameObjects.GameObject[] = []
    let currentFocusIndex = 0
    
    keyboard.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault()
      
      if (focusableElements.length > 0) {
        // Remove focus from current element
        this.removeFocus(focusableElements[currentFocusIndex])
        
        // Move to next element
        if (event.shiftKey) {
          currentFocusIndex = (currentFocusIndex - 1 + focusableElements.length) % focusableElements.length
        } else {
          currentFocusIndex = (currentFocusIndex + 1) % focusableElements.length
        }
        
        // Add focus to new element
        this.addFocus(focusableElements[currentFocusIndex])
      }
    })
    
    // Enter/Space activation
    keyboard.on('keydown-ENTER', () => this.activateFocusedElement())
    keyboard.on('keydown-SPACE', () => this.activateFocusedElement())
  }

  private addFocus(element: Phaser.GameObjects.GameObject) {
    // Visual focus indicator
    const focusRing = this.scene.add.graphics()
    focusRing.lineStyle(3, 0xffff00)
    focusRing.strokeRect(
      element.x - element.displayWidth / 2 - 5,
      element.y - element.displayHeight / 2 - 5,
      element.displayWidth + 10,
      element.displayHeight + 10
    )
    
    // Store reference for removal
    ;(element as any).focusRing = focusRing
  }

  private removeFocus(element: Phaser.GameObjects.GameObject) {
    const focusRing = (element as any).focusRing
    if (focusRing) {
      focusRing.destroy()
      delete (element as any).focusRing
    }
  }

  private activateFocusedElement() {
    // Trigger click/activation on focused element
    // Implementation depends on element type
  }

  private setupScreenReaderSupport() {
    // Create hidden DOM elements for screen reader announcements
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', 'polite')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.style.position = 'absolute'
    announcer.style.left = '-10000px'
    announcer.style.width = '1px'
    announcer.style.height = '1px'
    announcer.style.overflow = 'hidden'
    document.body.appendChild(announcer)
    
    // Game state announcements
    this.scene.events.on('scoreChange', (newScore: number) => {
      announcer.textContent = `Score: ${newScore}`
    })
    
    this.scene.events.on('targetHit', () => {
      announcer.textContent = 'Target hit!'
    })
  }

  announce(message: string) {
    const announcer = document.querySelector('[aria-live="polite"]') as HTMLElement
    if (announcer) {
      announcer.textContent = message
    }
  }
}
```

---

## 13) Debugging & Development Tools

### Visual Debug Overlays

```typescript
class DebugManager {
  private scene: Phaser.Scene
  private debugGraphics: Phaser.GameObjects.Graphics
  private isEnabled = false
  private debugInfo: { [key: string]: any } = {}

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.debugGraphics = scene.add.graphics()
    this.debugGraphics.setDepth(10000)
    
    this.setupDebugControls()
  }

  private setupDebugControls() {
    this.scene.input.keyboard?.on('keydown-F1', () => {
      this.toggle()
    })
    
    this.scene.input.keyboard?.on('keydown-F2', () => {
      this.showPerformanceMetrics()
    })
    
    this.scene.input.keyboard?.on('keydown-F3', () => {
      this.showPhysicsDebug()
    })
  }

  toggle() {
    this.isEnabled = !this.isEnabled
    this.debugGraphics.setVisible(this.isEnabled)
    
    if (this.isEnabled) {
      this.startDebugLoop()
    }
  }

  private startDebugLoop() {
    if (!this.isEnabled) return
    
    this.debugGraphics.clear()
    this.drawDebugInfo()
    
    this.scene.time.delayedCall(100, () => this.startDebugLoop())
  }

  private drawDebugInfo() {
    const camera = this.scene.cameras.main
    let y = camera.scrollY + 20
    
    // Background
    this.debugGraphics.fillStyle(0x000000, 0.7)
    this.debugGraphics.fillRect(camera.scrollX + 10, y - 10, 300, Object.keys(this.debugInfo).length * 20 + 20)
    
    // Debug text
    this.debugGraphics.fillStyle(0xffffff)
    Object.entries(this.debugInfo).forEach(([key, value]) => {
      this.drawDebugText(`${key}: ${value}`, camera.scrollX + 20, y)
      y += 20
    })
  }

  private drawDebugText(text: string, x: number, y: number) {
    // Simple bitmap text rendering for debug info
    // In a real implementation, you'd use Phaser's text objects
    console.log(`Debug: ${text} at (${x}, ${y})`)
  }

  setDebugValue(key: string, value: any) {
    this.debugInfo[key] = value
  }

  showTrajectory(startX: number, startY: number, velocityX: number, velocityY: number, gravity = 500) {
    if (!this.isEnabled) return
    
    const points: { x: number, y: number }[] = []
    let x = startX
    let y = startY
    let vx = velocityX
    let vy = velocityY
    const dt = 1/60 // 60 FPS
    
    // Simulate trajectory
    for (let t = 0; t < 3; t += dt) {
      points.push({ x, y })
      x += vx * dt
      y += vy * dt
      vy += gravity * dt
      
      if (y > this.scene.scale.gameSize.height) break
    }
    
    // Draw trajectory
    this.debugGraphics.lineStyle(2, 0x00ff00, 0.8)
    for (let i = 1; i < points.length; i++) {
      this.debugGraphics.lineBetween(
        points[i-1].x, points[i-1].y,
        points[i].x, points[i].y
      )
    }
    
    // Draw velocity vector
    this.debugGraphics.lineStyle(3, 0xff0000)
    this.debugGraphics.lineBetween(
      startX, startY,
      startX + velocityX * 0.1, startY + velocityY * 0.1
    )
  }

  private showPerformanceMetrics() {
    const metrics = {
      FPS: Math.round(this.scene.game.loop.actualFps),
      'Game Objects': this.scene.children.length,
      'Tweens': this.scene.tweens.getTweens().length,
      'Timers': this.scene.time.getAllEvents().length
    }
    
    Object.entries(metrics).forEach(([key, value]) => {
      this.setDebugValue(key, value)
    })
  }

  private showPhysicsDebug() {
    // Enable/disable physics debug rendering
    if (this.scene.physics.world.debugGraphic) {
      this.scene.physics.world.debugGraphic.setVisible(!this.scene.physics.world.debugGraphic.visible)
    } else {
      this.scene.physics.world.createDebugGraphic()
    }
  }
}
```

---

## 14) Claude Integration Best Practices

### When Working with Claude on Phaser Projects

1. **Provide Context**: Always share the current scene structure and game flow
2. **Ludemic Focus**: Frame requests in terms of player experience and game feel
3. **Incremental Development**: Request small, testable changes that build on existing systems
4. **Performance Awareness**: Consider mobile performance and object pooling from the start
5. **Accessibility First**: Include accessibility considerations in all UI/UX requests

### Common Request Patterns

```typescript
// ✅ Good: Specific, ludemic-focused request
// "Create a bow drawing mechanic that feels satisfying and provides immediate feedback"

// ✅ Good: Clear context and constraints
// "Add particle effects to arrow impacts, keeping mobile performance in mind"

// ❌ Avoid: Vague, technical-only requests
// "Make particles for arrows"

// ✅ Good: Testing-conscious development
// "Implement wind system that can be easily tested with different configurations"
```

### Integration Checklist

When Claude provides Phaser code, verify:

- [ ] **Ludemic Alignment**: Does it enhance player experience?
- [ ] **Performance**: Uses object pooling where appropriate?
- [ ] **Accessibility**: Includes visual and interaction accessibility?
- [ ] **Mobile Optimized**: Touch-friendly and responsive?
- [ ] **Testable**: Can be easily unit tested?
- [ ] **Scene Integration**: Fits into existing scene flow?
- [ ] **State Management**: Integrates with game state properly?
- [ ] **Visual Polish**: Includes appropriate animations and feedback?

---

## 15) Reference Quick Cards

### Essential Phaser Classes for Game Development

```typescript
// Core Phaser objects for common tasks
Phaser.Scene              // Base scene class
Phaser.GameObjects.Sprite // Visual game objects
Phaser.Physics.Arcade     // 2D physics system
Phaser.Tweens.Tween      // Animation system
Phaser.Sound.BaseSound   // Audio management
Phaser.Input.Keyboard    // Keyboard input
Phaser.Input.Pointer     // Mouse/touch input
Phaser.Cameras.Scene2D   // Camera control
Phaser.GameObjects.Graphics // Procedural graphics
Phaser.GameObjects.Particles // Particle effects
```

### Common Ludemic Patterns

```typescript
// Feel-first: Immediate response to input
input.on('down', () => immediate_feedback())

// Progression: Ki-Sho-Ten-Ketsu structure
// Ki: introduce_mechanic()
// Sho: develop_skill()
// Ten: add_challenge()
// Ketsu: provide_mastery()

// Emergence: Orthogonal system interactions
// system_a.interact(system_b) !== system_a.effect + system_b.effect

// Agency: Multiple valid solution paths
// solution_space.filter(path => path.isValid()).length > 1
```

---

**Remember**: Every mechanic should pass the "playground test" - is it immediately fun to interact with? Focus on feel first, then build complexity through emergent system interactions.

---

*This guide serves as a comprehensive reference for Claude when working on PhaserJS projects. Always prioritize player experience, ludemic principles, and inclusive design in every implementation.*
