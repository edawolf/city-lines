# Coffee Toast Trivia - Implementation Plan (Gameplay-First Approach)

## Project Spec
- **Target Platform**: Banner-ad game for local news websites
- **Embed Format**: iframe embeddable
- **Play Area**: 640x480 pixels (4:3 aspect ratio)
- **Architecture**: Modular separation of concerns, no monolithic controllers
- **Philosophy**: **Prove gameplay first, add complexity incrementally**

---

## Phase 1: Minimal Playable Prototype (Single Question-Answer Turn)

### Goal
**Get one question on screen with clickable answers that gives feedback. That's it.**

This proves:
- Layout works in 640x480
- Question display is readable
- Answer interaction feels good
- Feedback is satisfying

### What to Build

#### 1.1: Repo Conversion
**File**: `src/main.ts`
```typescript
// Remove LoadScreen, jump directly to GameScreen
await engine.init({
  background: "#FFF8E7", // Cream
  resizeOptions: {
    minWidth: 640,
    minHeight: 480,
    maxWidth: 640,
    maxHeight: 480,
    letterbox: true
  },
});

await engine.navigation.showScreen(GameScreen); // No LoadScreen
```

#### 1.2: Minimal File Structure
```
src/game/
├── GameScreen.ts              # Thin coordinator
├── types.ts                   # Question interface only
├── graphics/
│   ├── QuestionCard.ts        # Display question text
│   └── AnswerButton.ts        # Single answer button
└── data/
    └── sampleQuestions.ts     # 5 hardcoded questions
```

#### 1.3: Core Interfaces (Minimal)
**File**: `src/game/types.ts`
```typescript
export interface Question {
  text: string;
  answers: string[]; // Just text, no objects yet
  correctIndex: number;
}
```

#### 1.4: Sample Data
**File**: `src/game/data/sampleQuestions.ts`
```typescript
export const SAMPLE_QUESTIONS: Question[] = [
  {
    text: "What city announced new climate regulations today?",
    answers: ["New York City", "Los Angeles", "Chicago", "Houston"],
    correctIndex: 0
  },
  // ... 4 more
];
```

#### 1.5: Question Card Graphic
**File**: `src/game/graphics/QuestionCard.ts`
```typescript
export class QuestionCard extends Container {
  private background: Graphics;
  private questionText: Text;

  constructor() {
    super();

    // Simple rounded rect background
    this.background = new Graphics()
      .roundRect(0, 0, 580, 120, 10)
      .fill(0xFFFFFF);
    this.addChild(this.background);

    // Question text
    this.questionText = new Text({
      text: '',
      style: {
        fontSize: 18,
        fill: 0x000000,
        wordWrap: true,
        wordWrapWidth: 560,
        align: 'center'
      }
    });
    this.questionText.anchor.set(0.5);
    this.questionText.position.set(290, 60);
    this.addChild(this.questionText);
  }

  public setQuestion(question: Question): void {
    this.questionText.text = question.text;
  }
}
```

#### 1.6: Answer Button Graphic
**File**: `src/game/graphics/AnswerButton.ts`
```typescript
export class AnswerButton extends Container {
  private background: Graphics;
  private label: Text;
  public onClick = new Signal<number>();

  constructor(text: string, index: number) {
    super();

    // Button background
    this.background = new Graphics()
      .roundRect(0, 0, 280, 60, 8)
      .fill(0xD4A574); // Toast brown
    this.addChild(this.background);

    // Button label
    this.label = new Text({
      text,
      style: { fontSize: 16, fill: 0xFFFFFF }
    });
    this.label.anchor.set(0.5);
    this.label.position.set(140, 30);
    this.addChild(this.label);

    // Make interactive
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerdown', () => this.onClick.emit(index));

    // Hover effect
    this.on('pointerover', () => this.background.tint = 0xEEEEEE);
    this.on('pointerout', () => this.background.tint = 0xFFFFFF);
  }

  public showCorrect(): void {
    this.background.clear().roundRect(0, 0, 280, 60, 8).fill(0x4CAF50); // Green
  }

  public showWrong(): void {
    this.background.clear().roundRect(0, 0, 280, 60, 8).fill(0xF44336); // Red
  }
}
```

#### 1.7: Game Screen (Minimal Coordinator)
**File**: `src/game/GameScreen.ts`
```typescript
import { Container } from 'pixi.js';
import { QuestionCard } from './graphics/QuestionCard';
import { AnswerButton } from './graphics/AnswerButton';
import { SAMPLE_QUESTIONS } from './data/sampleQuestions';
import type { Question } from './types';

export class GameScreen extends Container {
  private questionCard: QuestionCard;
  private answerButtons: AnswerButton[] = [];
  private currentQuestion: Question;

  constructor() {
    super();

    // Get first question
    this.currentQuestion = SAMPLE_QUESTIONS[0];

    // Create question card
    this.questionCard = new QuestionCard();
    this.questionCard.position.set(320, 180); // Center-ish
    this.addChild(this.questionCard);

    // Create answer buttons (2x2 grid)
    const positions = [
      { x: 180, y: 320 }, // Top-left
      { x: 460, y: 320 }, // Top-right
      { x: 180, y: 390 }, // Bottom-left
      { x: 460, y: 390 }  // Bottom-right
    ];

    this.currentQuestion.answers.forEach((answer, index) => {
      const button = new AnswerButton(answer, index);
      button.position.set(positions[index].x, positions[index].y);
      button.onClick.connect((idx) => this.handleAnswer(idx));
      this.answerButtons.push(button);
      this.addChild(button);
    });

    // Display question
    this.questionCard.setQuestion(this.currentQuestion);
  }

  private handleAnswer(answerIndex: number): void {
    const isCorrect = answerIndex === this.currentQuestion.correctIndex;

    // Show feedback
    this.answerButtons[answerIndex].showCorrect();
    if (!isCorrect) {
      this.answerButtons[answerIndex].showWrong();
      this.answerButtons[this.currentQuestion.correctIndex].showCorrect();
    }

    // Disable all buttons
    this.answerButtons.forEach(btn => btn.eventMode = 'none');

    // TODO: Next question or end screen (Phase 2)
    console.log(isCorrect ? '✅ Correct!' : '❌ Wrong!');
  }

  public resize(width: number, height: number): void {
    // Scale to fit 640x480 (with letterbox if needed)
    const scale = Math.min(width / 640, height / 480);
    this.scale.set(scale);
    this.position.set((width - 640 * scale) / 2, (height - 480 * scale) / 2);
  }

  public async show(): Promise<void> {
    // Fade in animation (optional)
  }
}
```

### Phase 1 Checklist
- [ ] Remove LoadScreen from main.ts
- [ ] Create `src/game/` directory structure
- [ ] Define `types.ts` with Question interface
- [ ] Create `sampleQuestions.ts` with 5 questions
- [ ] Build `QuestionCard.ts` graphic
- [ ] Build `AnswerButton.ts` graphic
- [ ] Build `GameScreen.ts` coordinator
- [ ] Test in browser: can you answer one question?

### Phase 1 Success Criteria
✅ **Can you play a single question-answer turn?**
- Question displays clearly
- All 4 answers are clickable
- Correct answer turns green
- Wrong answer turns red (and shows correct in green)
- Buttons disable after selection
- Layout fits in 640x480

**Estimated Time**: 1 day

---

## Phase 2: Core Game Loop (Multiple Questions → Run Completion)

### Goal
**Play through 10 questions in sequence, see final score.**

This proves:
- Loop structure works
- Question progression feels good
- Ending is satisfying

### What to Add

#### 2.1: Game State (Simple)
**File**: `src/game/GameState.ts`
```typescript
export class GameState {
  public currentQuestionIndex: number = 0;
  public correctAnswers: number = 0;
  public totalQuestions: number = 10;

  public isComplete(): boolean {
    return this.currentQuestionIndex >= this.totalQuestions;
  }

  public recordAnswer(isCorrect: boolean): void {
    if (isCorrect) this.correctAnswers++;
    this.currentQuestionIndex++;
  }
}
```

#### 2.2: Run Summary Screen
**File**: `src/game/graphics/RunSummary.ts`
```typescript
export class RunSummary extends Container {
  constructor(correctAnswers: number, totalQuestions: number) {
    super();

    const title = new Text({
      text: 'Run Complete!',
      style: { fontSize: 32, fill: 0x000000 }
    });
    title.anchor.set(0.5);
    title.position.set(320, 150);
    this.addChild(title);

    const score = new Text({
      text: `${correctAnswers} / ${totalQuestions} Correct`,
      style: { fontSize: 24, fill: 0x000000 }
    });
    score.anchor.set(0.5);
    score.position.set(320, 240);
    this.addChild(score);

    // Play Again button
    const playAgainBtn = new Button({ text: 'Play Again', width: 200, height: 60 });
    playAgainBtn.position.set(220, 350);
    playAgainBtn.onPress.connect(() => {
      // Reload game (simple for now)
      window.location.reload();
    });
    this.addChild(playAgainBtn);
  }
}
```

#### 2.3: Update GameScreen
```typescript
// Add to GameScreen.ts
private gameState: GameState;

constructor() {
  this.gameState = new GameState();
  // ... existing code
}

private async handleAnswer(answerIndex: number): Promise<void> {
  const isCorrect = answerIndex === this.currentQuestion.correctIndex;

  // Show feedback
  this.showAnswerFeedback(answerIndex, isCorrect);

  // Wait 1.5 seconds
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Record answer
  this.gameState.recordAnswer(isCorrect);

  // Check if run complete
  if (this.gameState.isComplete()) {
    this.showRunSummary();
  } else {
    this.loadNextQuestion();
  }
}

private loadNextQuestion(): void {
  // Remove old buttons
  this.answerButtons.forEach(btn => btn.destroy());
  this.answerButtons = [];

  // Get next question
  this.currentQuestion = SAMPLE_QUESTIONS[this.gameState.currentQuestionIndex];

  // Recreate buttons and display
  this.createAnswerButtons();
  this.questionCard.setQuestion(this.currentQuestion);
}

private showRunSummary(): void {
  // Clear screen
  this.removeChildren();

  // Show summary
  const summary = new RunSummary(
    this.gameState.correctAnswers,
    this.gameState.totalQuestions
  );
  this.addChild(summary);
}
```

### Phase 2 Checklist
- [ ] Create `GameState.ts` for run tracking
- [ ] Create `RunSummary.ts` graphic
- [ ] Update `GameScreen.ts` to loop through questions
- [ ] Add question progression logic
- [ ] Add run completion logic
- [ ] Expand `sampleQuestions.ts` to 10+ questions
- [ ] Test full run: 10 questions → summary screen

### Phase 2 Success Criteria
✅ **Can you play a complete 10-question run?**
- Questions progress automatically after answer
- Correct/wrong count tracks properly
- Summary screen shows final score
- Can restart game

**Estimated Time**: 1 day

---

## Phase 3: Scoring Systems (Streak, Freshness, Multipliers)

### Goal
**Add the Balatro-style cascading score system.**

This proves:
- Scoring feels rewarding
- Multipliers create excitement
- Freshness urgency is real

### What to Add

#### 3.1: Scoring System
**File**: `src/game/ScoreCalculator.ts`
```typescript
export class ScoreCalculator {
  public calculateQuestionScore(
    basePoints: number,
    speedBonus: number,
    streakMult: number,
    freshnessMult: number
  ): number {
    return Math.floor((basePoints + speedBonus) * streakMult * freshnessMult);
  }

  public getStreakMultiplier(streak: number): number {
    if (streak >= 10) return 5.0;
    if (streak >= 7) return 3.0;
    if (streak >= 5) return 2.0;
    if (streak >= 3) return 1.5;
    if (streak >= 2) return 1.2;
    return 1.0;
  }

  public getFreshnessMultiplier(minutesElapsed: number): number {
    if (minutesElapsed <= 5) return 1.0;
    if (minutesElapsed <= 10) return 0.9;
    if (minutesElapsed <= 15) return 0.8;
    return 0.7;
  }

  public getSpeedBonus(secondsSpent: number, maxTime: number = 30): number {
    const ratio = 1 - (secondsSpent / maxTime);
    return Math.floor(50 * Math.max(0, ratio));
  }
}
```

#### 3.2: Timer System
**File**: `src/game/FreshnessTimer.ts`
```typescript
export class FreshnessTimer {
  private startTime: number;

  public start(): void {
    this.startTime = Date.now();
  }

  public getMinutesElapsed(): number {
    return (Date.now() - this.startTime) / 1000 / 60;
  }

  public getFreshness(): number {
    const mins = this.getMinutesElapsed();
    if (mins <= 5) return 1.0;
    if (mins <= 10) return 0.9;
    if (mins <= 15) return 0.8;
    return 0.7;
  }
}
```

#### 3.3: Visual Components
**File**: `src/game/graphics/ToastMeter.ts`
```typescript
export class ToastMeter extends Container {
  private bar: Graphics;
  private label: Text;

  constructor() {
    super();

    // Background
    const bg = new Graphics()
      .roundRect(0, 0, 140, 30, 5)
      .fill(0x000000);
    bg.alpha = 0.3;
    this.addChild(bg);

    // Progress bar
    this.bar = new Graphics();
    this.addChild(this.bar);

    // Label
    this.label = new Text({
      text: '🍞 100%',
      style: { fontSize: 14, fill: 0xFFFFFF }
    });
    this.label.position.set(10, 7);
    this.addChild(this.label);
  }

  public setFreshness(value: number): void {
    // value: 0.0 to 1.0
    const width = 140 * value;
    const color = value > 0.8 ? 0x4CAF50 : value > 0.5 ? 0xFF9800 : 0xF44336;

    this.bar.clear()
      .roundRect(0, 0, width, 30, 5)
      .fill(color);

    this.label.text = `🍞 ${Math.floor(value * 100)}%`;
  }
}
```

**File**: `src/game/graphics/StreakIndicator.ts`
```typescript
export class StreakIndicator extends Container {
  private streakText: Text;
  private multiplierText: Text;

  constructor() {
    super();

    this.streakText = new Text({
      text: 'Streak: 0',
      style: { fontSize: 16, fill: 0x000000 }
    });
    this.addChild(this.streakText);

    this.multiplierText = new Text({
      text: '1.0x',
      style: { fontSize: 24, fill: 0xFF6F00, fontWeight: 'bold' }
    });
    this.multiplierText.position.set(0, 25);
    this.addChild(this.multiplierText);
  }

  public setStreak(count: number, multiplier: number): void {
    this.streakText.text = `Streak: ${count}`;
    this.multiplierText.text = `${multiplier.toFixed(1)}x`;
  }
}
```

**File**: `src/game/graphics/ScorePopup.ts`
```typescript
export class ScorePopup extends Container {
  constructor(points: number, breakdown: string[]) {
    super();

    // Main score
    const scoreText = new Text({
      text: `+${points}`,
      style: { fontSize: 32, fill: 0xFF6F00, fontWeight: 'bold' }
    });
    scoreText.anchor.set(0.5);
    this.addChild(scoreText);

    // Breakdown (base × streak × freshness)
    const breakdownText = new Text({
      text: breakdown.join(' × '),
      style: { fontSize: 14, fill: 0x000000 }
    });
    breakdownText.anchor.set(0.5);
    breakdownText.position.set(0, 40);
    this.addChild(breakdownText);

    // Animate up and fade out
    this.animate();
  }

  private async animate(): Promise<void> {
    // Simple animation: move up and fade
    const duration = 1500;
    const startY = this.y;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        this.y = startY - progress * 50;
        this.alpha = 1 - progress;
        requestAnimationFrame(tick);
      } else {
        this.destroy();
      }
    };

    tick();
  }
}
```

#### 3.4: Update GameState
```typescript
export class GameState {
  public currentQuestionIndex: number = 0;
  public correctAnswers: number = 0;
  public totalQuestions: number = 10;
  public currentStreak: number = 0;
  public totalScore: number = 0;
  public questionStartTime: number = 0;

  public startQuestion(): void {
    this.questionStartTime = Date.now();
  }

  public getQuestionTime(): number {
    return (Date.now() - this.questionStartTime) / 1000; // seconds
  }

  public recordAnswer(isCorrect: boolean, pointsEarned: number): void {
    if (isCorrect) {
      this.correctAnswers++;
      this.currentStreak++;
    } else {
      this.currentStreak = 0;
    }
    this.totalScore += pointsEarned;
    this.currentQuestionIndex++;
  }
}
```

#### 3.5: Update GameScreen
```typescript
// Add to GameScreen
private gameState: GameState;
private scoreCalculator: ScoreCalculator;
private freshnessTimer: FreshnessTimer;
private toastMeter: ToastMeter;
private streakIndicator: StreakIndicator;

constructor() {
  super();

  // Initialize systems
  this.gameState = new GameState();
  this.scoreCalculator = new ScoreCalculator();
  this.freshnessTimer = new FreshnessTimer();
  this.freshnessTimer.start();

  // Create UI
  this.toastMeter = new ToastMeter();
  this.toastMeter.position.set(490, 10);
  this.addChild(this.toastMeter);

  this.streakIndicator = new StreakIndicator();
  this.streakIndicator.position.set(10, 100);
  this.addChild(this.streakIndicator);

  // Start first question
  this.gameState.startQuestion();
  // ... rest of constructor
}

private handleAnswer(answerIndex: number): void {
  const isCorrect = answerIndex === this.currentQuestion.correctIndex;
  const timeSpent = this.gameState.getQuestionTime();

  // Calculate score
  const basePoints = 100;
  const speedBonus = this.scoreCalculator.getSpeedBonus(timeSpent);
  const streakMult = this.scoreCalculator.getStreakMultiplier(this.gameState.currentStreak);
  const freshnessMult = this.scoreCalculator.getFreshnessMultiplier(this.freshnessTimer.getMinutesElapsed());

  const points = this.scoreCalculator.calculateQuestionScore(
    basePoints,
    speedBonus,
    streakMult,
    freshnessMult
  );

  // Show score popup
  if (isCorrect) {
    const popup = new ScorePopup(points, [
      `${basePoints + speedBonus}`,
      `${streakMult.toFixed(1)}x`,
      `${freshnessMult.toFixed(1)}x`
    ]);
    popup.position.set(320, 240);
    this.addChild(popup);
  }

  // Update state
  this.gameState.recordAnswer(isCorrect, isCorrect ? points : 0);
  this.streakIndicator.setStreak(
    this.gameState.currentStreak,
    this.scoreCalculator.getStreakMultiplier(this.gameState.currentStreak)
  );

  // Show feedback and continue
  // ...
}

public update(ticker: Ticker): void {
  // Update toast meter
  this.toastMeter.setFreshness(this.freshnessTimer.getFreshness());
}
```

### Phase 3 Checklist
- [ ] Create `ScoreCalculator.ts` with all formulas
- [ ] Create `FreshnessTimer.ts` for time tracking
- [ ] Create `ToastMeter.ts` graphic
- [ ] Create `StreakIndicator.ts` graphic
- [ ] Create `ScorePopup.ts` animation
- [ ] Update `GameState.ts` with scoring fields
- [ ] Update `GameScreen.ts` to calculate and display scores
- [ ] Add update loop for toast meter
- [ ] Test: score cascade feels satisfying?

### Phase 3 Success Criteria
✅ **Does scoring feel rewarding?**
- Toast meter visibly decays over time
- Streak counter updates on correct answers
- Score popup shows cascading multipliers
- High streaks feel exciting
- Fresh toast bonus is noticeable

**Estimated Time**: 2 days

---

## Phase 4: Modifiers and Run Variety

### Goal
**Add pre-run modifier selection and variety.**

This proves:
- Replayability through different modifiers
- Risk/reward decisions are interesting
- Unlock progression is motivating

### What to Add

#### 4.1: Modifier System
**File**: `src/game/data/modifiers.ts`
```typescript
export interface Modifier {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  difficulty?: 'easier' | 'normal' | 'harder';
  unlockCondition: string;
  isUnlocked: boolean;
}

export const MODIFIERS: Modifier[] = [
  {
    id: 'classic',
    name: 'Classic Mode',
    description: 'Balanced difficulty',
    multiplier: 1.0,
    unlockCondition: 'Always available',
    isUnlocked: true
  },
  {
    id: 'coffee-break',
    name: 'Coffee Break',
    description: 'Easier questions, lower multiplier',
    multiplier: 0.8,
    difficulty: 'easier',
    unlockCondition: 'Always available',
    isUnlocked: true
  },
  {
    id: 'morning-rush',
    name: 'Morning Rush',
    description: 'Higher stakes, 1.5x points',
    multiplier: 1.5,
    difficulty: 'harder',
    unlockCondition: 'Always available',
    isUnlocked: true
  },
  // Add 3-4 more unlockable modifiers
];
```

#### 4.2: Modifier Selection Screen
**File**: `src/game/screens/ModifierSelectScreen.ts`
```typescript
export class ModifierSelectScreen extends Container {
  public onModifierSelected = new Signal<Modifier>();

  constructor() {
    super();

    const title = new Text({
      text: 'Choose Your Modifier',
      style: { fontSize: 28, fill: 0x000000 }
    });
    title.anchor.set(0.5);
    title.position.set(320, 80);
    this.addChild(title);

    // Show 3 modifier cards
    const availableModifiers = MODIFIERS.filter(m => m.isUnlocked).slice(0, 3);
    availableModifiers.forEach((modifier, index) => {
      const card = new ModifierCard(modifier);
      card.position.set(100 + index * 220, 200);
      card.onClick.connect(() => this.onModifierSelected.emit(modifier));
      this.addChild(card);
    });
  }
}
```

**File**: `src/game/graphics/ModifierCard.ts`
```typescript
export class ModifierCard extends Container {
  public onClick = new Signal();

  constructor(modifier: Modifier) {
    super();

    // Card background
    const bg = new Graphics()
      .roundRect(0, 0, 200, 200, 10)
      .fill(0xFFFFFF)
      .stroke({ width: 2, color: 0xD4A574 });
    this.addChild(bg);

    // Title
    const title = new Text({
      text: modifier.name,
      style: { fontSize: 18, fill: 0x000000, fontWeight: 'bold' }
    });
    title.anchor.set(0.5);
    title.position.set(100, 30);
    this.addChild(title);

    // Description
    const desc = new Text({
      text: modifier.description,
      style: { fontSize: 14, fill: 0x000000, wordWrap: true, wordWrapWidth: 180, align: 'center' }
    });
    desc.anchor.set(0.5);
    desc.position.set(100, 100);
    this.addChild(desc);

    // Multiplier badge
    const badge = new Text({
      text: `${modifier.multiplier}x`,
      style: { fontSize: 24, fill: 0xFF6F00, fontWeight: 'bold' }
    });
    badge.anchor.set(0.5);
    badge.position.set(100, 160);
    this.addChild(badge);

    // Make interactive
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerdown', () => this.onClick.emit());
    this.on('pointerover', () => bg.tint = 0xEEEEEE);
    this.on('pointerout', () => bg.tint = 0xFFFFFF);
  }
}
```

#### 4.3: Update GameScreen to Accept Modifier
```typescript
export class GameScreen extends Container {
  private modifier: Modifier;

  constructor(modifier: Modifier) {
    super();
    this.modifier = modifier;
    // ... rest of constructor
  }

  private handleAnswer(answerIndex: number): void {
    // ... existing code

    // Apply modifier multiplier to final score
    const modifiedPoints = Math.floor(points * this.modifier.multiplier);

    // ...
  }
}
```

#### 4.4: Update Navigation Flow
```typescript
// In main.ts or navigation logic
await engine.navigation.showScreen(ModifierSelectScreen);

// When modifier selected:
modifierScreen.onModifierSelected.connect((modifier) => {
  engine.navigation.showScreen(new GameScreen(modifier));
});
```

### Phase 4 Checklist
- [ ] Create `modifiers.ts` with 6 modifiers (3 starter + 3 unlockable)
- [ ] Create `ModifierSelectScreen.ts`
- [ ] Create `ModifierCard.ts` graphic
- [ ] Update `GameScreen.ts` to accept modifier
- [ ] Apply modifier multiplier to scoring
- [ ] Add unlock logic (simple: after N runs)
- [ ] Test: modifier selection → gameplay → different feels

### Phase 4 Success Criteria
✅ **Does run variety feel fresh?**
- Modifier selection screen is clear
- Each modifier feels different
- Higher multipliers feel rewarding
- Unlock progression is motivating

**Estimated Time**: 2 days

---

## Phase 5: PowerUps and PlayStyle Progression

### Goal
**Add strategic depth with PowerUps and long-term progression.**

This proves:
- PowerUps create interesting decisions
- Progression keeps players coming back
- Meta-game has depth

### What to Add

#### 5.1: PowerUp System
**File**: `src/game/PowerUpSystem.ts`
```typescript
export interface PowerUp {
  id: 'coffee-token' | 'hindsight';
  name: string;
  count: number;
  maxCarry: number;
}

export class PowerUpSystem {
  private inventory = {
    coffeeToken: 0,
    hindsight: 0
  };

  public useCoffeeToken(): boolean {
    if (this.inventory.coffeeToken > 0) {
      this.inventory.coffeeToken--;
      return true;
    }
    return false;
  }

  public useHindsight(): boolean {
    if (this.inventory.hindsight > 0) {
      this.inventory.hindsight--;
      return true;
    }
    return false;
  }

  public addPowerUp(id: string): void {
    if (id === 'coffee-token' && this.inventory.coffeeToken < 3) {
      this.inventory.coffeeToken++;
    }
    if (id === 'hindsight' && this.inventory.hindsight < 1) {
      this.inventory.hindsight++;
    }
  }

  public getInventory() {
    return { ...this.inventory };
  }
}
```

#### 5.2: PowerUp UI
**File**: `src/game/graphics/PowerUpButton.ts`
```typescript
export class PowerUpButton extends Container {
  public onActivate = new Signal();

  constructor(powerUp: PowerUp) {
    super();

    // Button icon
    const icon = new Text({
      text: powerUp.id === 'coffee-token' ? '☕' : '💡',
      style: { fontSize: 24 }
    });
    icon.anchor.set(0.5);
    icon.position.set(20, 20);
    this.addChild(icon);

    // Count badge
    const countBadge = new Text({
      text: `${powerUp.count}`,
      style: { fontSize: 12, fill: 0xFFFFFF }
    });
    countBadge.anchor.set(0.5);
    countBadge.position.set(30, 10);
    this.addChild(countBadge);

    // Make interactive if count > 0
    if (powerUp.count > 0) {
      this.eventMode = 'static';
      this.cursor = 'pointer';
      this.on('pointerdown', () => this.onActivate.emit());
    } else {
      this.alpha = 0.3;
    }
  }
}
```

#### 5.3: PlayStyle Tracking (Basic)
**File**: `src/game/PlayStyleTracker.ts`
```typescript
export class PlayStyleTracker {
  private stats = {
    totalRuns: 0,
    earlyBirdRuns: 0, // Played within 5 min
    highRiskRuns: 0,  // Used 1.5x+ modifier
    perfectRuns: 0    // 10/10 correct
  };

  public recordRun(modifier: Modifier, correctAnswers: number, minutesElapsed: number): void {
    this.stats.totalRuns++;

    if (minutesElapsed <= 5) this.stats.earlyBirdRuns++;
    if (modifier.multiplier >= 1.5) this.stats.highRiskRuns++;
    if (correctAnswers === 10) this.stats.perfectRuns++;

    this.checkTitleUnlocks();
  }

  private checkTitleUnlocks(): void {
    // Simple unlock logic
    if (this.stats.earlyBirdRuns >= 7) {
      console.log('🌅 Unlocked: Early Bird (Bronze)');
    }
    if (this.stats.highRiskRuns >= 5) {
      console.log('🎲 Unlocked: Risk-Taker (Bronze)');
    }
  }

  public getStats() {
    return { ...this.stats };
  }
}
```

#### 5.4: Integration into GameScreen
```typescript
// Add PowerUps and PlayStyle tracking to GameScreen
private powerUpSystem: PowerUpSystem;
private playStyleTracker: PlayStyleTracker;
private powerUpButtons: PowerUpButton[];

constructor(modifier: Modifier) {
  super();
  this.powerUpSystem = new PowerUpSystem();
  this.playStyleTracker = new PlayStyleTracker();

  // Create PowerUp UI
  this.createPowerUpBar();
  // ...
}

private createPowerUpBar(): void {
  const inventory = this.powerUpSystem.getInventory();
  const powerUps: PowerUp[] = [
    { id: 'coffee-token', name: 'Coffee Token', count: inventory.coffeeToken, maxCarry: 3 },
    { id: 'hindsight', name: 'Hindsight', count: inventory.hindsight, maxCarry: 1 }
  ];

  powerUps.forEach((powerUp, index) => {
    const btn = new PowerUpButton(powerUp);
    btn.position.set(260 + index * 60, 440);
    btn.onActivate.connect(() => this.activatePowerUp(powerUp.id));
    this.powerUpButtons.push(btn);
    this.addChild(btn);
  });
}

private activatePowerUp(powerUpId: string): void {
  if (powerUpId === 'coffee-token') {
    // Save streak from break
    const used = this.powerUpSystem.useCoffeeToken();
    if (used) {
      console.log('☕ Coffee Token used! Streak saved.');
      // Don't reset streak on next wrong answer
    }
  } else if (powerUpId === 'hindsight') {
    // Remove one wrong answer
    const used = this.powerUpSystem.useHindsight();
    if (used) {
      console.log('💡 Hindsight used! One wrong answer removed.');
      // Hide one wrong answer button
      this.removeWrongAnswer();
    }
  }
  this.refreshPowerUpBar();
}

private showRunSummary(): void {
  // ... existing summary code

  // Record run for playstyle tracking
  this.playStyleTracker.recordRun(
    this.modifier,
    this.gameState.correctAnswers,
    this.freshnessTimer.getMinutesElapsed()
  );
}
```

### Phase 5 Checklist
- [ ] Create `PowerUpSystem.ts`
- [ ] Create `PowerUpButton.ts` graphic
- [ ] Integrate PowerUps into GameScreen
- [ ] Implement Coffee Token (streak save)
- [ ] Implement Hindsight (remove wrong answer)
- [ ] Create `PlayStyleTracker.ts`
- [ ] Record run stats and check unlocks
- [ ] Add title unlock notifications
- [ ] Test: PowerUps feel strategic? Progression feels rewarding?

### Phase 5 Success Criteria
✅ **Does meta-progression add depth?**
- PowerUps create interesting decisions
- Coffee Token feels valuable (saves streak)
- Hindsight is useful but not overpowered
- PlayStyle titles unlock naturally
- Players want to replay for unlocks

**Estimated Time**: 2-3 days

---

## Summary Timeline (Gameplay-First)

| Phase | Goal | Time | Proof |
|-------|------|------|-------|
| **Phase 1** | Single question-answer turn | 1 day | ✅ Core loop feels good |
| **Phase 2** | 10-question run with summary | 1 day | ✅ Complete run is satisfying |
| **Phase 3** | Scoring cascade (streak, freshness) | 2 days | ✅ Scoring feels rewarding |
| **Phase 4** | Modifiers and run variety | 2 days | ✅ Replayability is compelling |
| **Phase 5** | PowerUps and progression | 2-3 days | ✅ Meta-game has depth |

**Total: 8-9 days to fully playable prototype**

---

## Development Principles

### 1. **Playable at Every Stage**
After each phase, you can play the game and get meaningful feedback.

### 2. **Incremental Complexity**
Each phase adds ONE major system. No big-bang integration.

### 3. **Prove Before Polish**
Get the core feel right before adding animations, sounds, etc.

### 4. **Fail Fast**
If scoring doesn't feel good in Phase 3, fix it before adding modifiers.

### 5. **Separation of Concerns**
Systems (logic) are separate from Graphics (presentation). GameScreen only coordinates.

---

## Next Steps After Phase 5

Once gameplay is proven and fun:

### Polish Pass
- Add sound effects and music
- Improve animations (score cascade, toast browning)
- Add particle effects (steam, streak flames)
- Smooth transitions between screens

### Content Expansion
- Expand to 100+ questions
- Add all 21 modifiers from GDD
- Add remaining PowerUps (Toast Insurance, Speed Boost)
- Implement adaptive difficulty

### Meta Features
- Add leaderboard (local storage → backend)
- Add all 4 PlayStyle titles with tiers
- Add daily challenges
- Add run history

### Production Ready
- Real news API integration
- iframe embedding optimization
- Analytics tracking
- Ad integration (if monetizing)

---

## Success Metrics (Per Phase)

### Phase 1
- [ ] Can play one question in <30 seconds from launch
- [ ] Answer feedback is clear and instant
- [ ] Layout is readable in 640x480

### Phase 2
- [ ] Can complete 10-question run in ~3 minutes
- [ ] Want to play again immediately after summary

### Phase 3
- [ ] Streak building feels exciting
- [ ] Freshness creates urgency (not anxiety)
- [ ] Score cascade is satisfying to watch

### Phase 4
- [ ] Modifiers feel meaningfully different
- [ ] Want to try all modifiers
- [ ] Unlock progression is motivating

### Phase 5
- [ ] PowerUps create interesting decisions
- [ ] PlayStyle tracking feels rewarding
- [ ] Want to play more to unlock titles

**If all metrics pass: Ship it! 🚀**
