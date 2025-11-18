# Coffee Toast Trivia - Game Design Document (Refined Edition)

## High Concept

A cozy morning news trivia game that transforms your breakfast routine into an engaging, personalized quiz session. Answer questions based on today's headlines while your virtual toast stays warm. Features Balatro-style run modifiers, exponential streak multipliers, and emergent playstyle progression that makes every morning feel urgent, relevant, and rewarding.

**Core Experience**: Sipping coffee, testing your knowledge of the news, building massive multiplier cascades before your toast gets cold.

---

## Design Pillars

### 1. **Miyamoto Simplicity**
- One-tap gameplay: see question, tap answer
- Clear goal: build streaks before toast gets cold
- Instant feedback: immediate scoring with satisfying animations
- Easy to learn, infinite depth through modifier combinations

### 2. **Fresh Toast Urgency**
- 20-minute freshness window for peak multipliers
- Natural morning ritual anchor (coffee + breakfast)
- Today's news expires tomorrow—authentic time pressure
- "Coffee Perks" support late players without shame

### 3. **Personalized Relevance**
- Local news + global headlines (your city + the world)
- Calendar integration for event-aware questions
- Adaptive difficulty targets your skill level
- Active playstyle titles reflect how YOU play

### 4. **Balatro Progression**
- Daily run modifiers with risk/reward tradeoffs
- Exponential multiplier cascades (base × streak × freshness × modifier)
- 12 core modifiers unlock in 2 weeks (rapid dopamine)
- 4 prestige modifiers unlock via mastery achievements

---

## Core Gameplay Loop

### Daily Session (7-12 minutes)

1. **Morning notification** (user-set time, default 7:00 AM)
   - "Your toast is getting warm! ☕🍞"

2. **Open app and see freshness at 100%**
   - Steam animation rising from coffee cup
   - "Good morning, [Name]! [City] has 3 local + 7 global stories today."

3. **Choose run modifier** (unlocked Day 4+)
   - See 3 options with risk/reward preview
   - Active playstyle title grants +2% synergy bonus if matched

4. **Answer 10-15 trivia questions**
   - Tap one of 3-4 multiple choice answers
   - Build streak multiplier: 2x, 3x, 5x, 10x...
   - Use PowerUps strategically

5. **Watch freshness decay** (or Coffee Perks activate)
   - 0-5 min: 1.0x (perfect)
   - 5-10 min: 0.9x
   - 10-15 min: 0.8x
   - 15-20 min: 0.7x
   - 20+ min: Coffee Perks auto-activate (see below)

6. **Complete run**
   - Score breakdown with cascade animation
   - Neighborhood leaderboard update
   - PowerUp rewards and modifier unlocks
   - Preview tomorrow's modifier options

---

## Run Modifier System

### Starter Modifiers (Day 4+, Always Available)
- **Classic Mode**: Balanced difficulty, 1.0x multiplier (safe learning)
- **Coffee Break**: Easier questions, 0.8x multiplier (relaxed morning)
- **Morning Rush**: Normal difficulty, shorter timer, 1.5x multiplier (risk/reward)

### Week 1 Unlocks
- **Local Hero** (Day 5): 70% local questions, 1.3x multiplier
- **Speed Demon** (Day 6): 10sec per question, 2.0x multiplier
- **History Repeats** (Day 7): Questions from exactly 1 year ago, 1.2x multiplier

### Week 2 Unlocks
- **Headline Hunter** (Day 8): Breaking news only, 1.8x multiplier
- **Deep Dive** (Day 9): Expert-level questions, 2.5x multiplier
- **Prediction Market** (Day 11): Guess trending stories, variable multiplier
- **Weekend Digest** (Sunday): Review the week, 1.4x multiplier
- **Monday Briefing** (Monday): Week-ahead preview, 1.3x multiplier

### Prestige Modifiers (Achievement-Based)
- **Chaos Mode**: Random difficulty + random multipliers (1.5x-3.0x range)
- **Champion's Challenge**: Questions from Top 10 players' mistakes (2.0x)
- **Custom Difficulty**: Tune your own risk/reward balance
- **News Savant**: Master-tier questions, 3.0x multiplier, 30-day streak required

---

## Scoring System

### Base Score Formula
```
Final Score = (Base Points + Speed Bonus) × Streak Mult × Freshness Mult × Modifier Mult × Title Synergy
```

### Components

**Base Points**
- Correct answer: 100 points
- Speed bonus: +10 to +50 points (faster = more)

**Streak Multiplier**
- 2 correct: 1.2x
- 3 correct: 1.5x
- 5 correct: 2.0x
- 7 correct: 3.0x
- 10+ correct: 5.0x (with explosive visual effects)

**Freshness Multiplier**
- 0-5 min: 1.0x (peak freshness)
- 5-10 min: 0.9x
- 10-15 min: 0.8x
- 15-20 min: 0.7x
- 20+ min with Coffee Perks: 0.7x floor

**Modifier Multiplier**
- Coffee Break: 0.8x (easier questions)
- Classic: 1.0x (balanced)
- Morning Rush: 1.5x (time pressure)
- Deep Dive: 2.5x (expert difficulty)
- News Savant: 3.0x (prestige)

**Title Synergy Bonus**
- +2% when Active Title matches modifier theme
- Examples: Early Bird 🌅 + Morning Rush, Risk-Taker 🎲 + Chaos Mode, Local Champion 📍 + Local Hero

---

## Emergent Playstyle System

### How It Works
Game passively tracks your behavior patterns over 7-14 days and awards titles with bonuses.

### Four Core Playstyles

**Early Bird Optimizer 🌅**
- **Behavior**: Plays within first 5 minutes every day
- **Title Tiers**: Bronze (7 days) → Silver (14 days) → Gold (30 days)
- **Bonus**: +5%/+7%/+10% freshness multiplier
- **Synergy**: Morning Rush, Speed Demon modifiers

**Risk-Taking Streaker 🎲**
- **Behavior**: Chooses 1.5x+ multiplier modifiers frequently
- **Title Tiers**: Bronze (5 risky runs) → Silver (15) → Gold (40)
- **Bonus**: +5%/+7%/+10% to all multipliers
- **Synergy**: Chaos Mode, Deep Dive, Champion's Challenge

**Steady Completionist ✓**
- **Behavior**: Completes daily runs consistently regardless of score
- **Title Tiers**: Bronze (14 days) → Silver (30) → Gold (60)
- **Bonus**: +10%/+15%/+20% PowerUp drop rate
- **Synergy**: Coffee Break, Classic, Weekend Digest

**Local Champion 📍**
- **Behavior**: Excels at neighborhood-specific questions
- **Title Tiers**: Bronze (20 local correct) → Silver (50) → Gold (100)
- **Bonus**: +5%/+7%/+10% score on local questions
- **Synergy**: Local Hero modifier

### Active Title System
- Players can earn multiple titles but only one is "Active"
- Tap profile icon → select Active Title → gain that title's bonus
- First title earned triggers tutorial: "🎉 Tap your profile to activate bonuses!"
- Active Title displays on leaderboard for social recognition

---

## PowerUp System

### Coffee Token ☕
- **Effect**: Save a broken streak (one wrong answer doesn't reset)
- **Activation**: Reactive—automatically triggers after wrong answer
- **Acquisition**: 1 per 10-day login streak OR 5% random drop
- **Max Carry**: 3 (strategic resource for high-stakes runs)

### Toast Insurance 🍞
- **Effect**: Freeze freshness timer for 5 minutes
- **Activation**: Automatic when freshness drops below 80%
- **Acquisition**: Earn by completing run with 90%+ freshness
- **Max Carry**: 1 (situational tool, use it or lose it)

### Speed Boost ⚡
- **Effect**: Next 3 answers get 2x speed bonus automatically
- **Activation**: Proactive—player activates before answering
- **Acquisition**: 10% drop after achieving 5-streak
- **Max Carry**: 2 (tactical reserves for clutch moments)

### Hindsight 💡
- **Effect**: Reveal one wrong answer (improves odds to 1-in-3)
- **Activation**: Proactive—player taps on question screen
- **Acquisition**: Guaranteed on first 5-streak, then 15% drop per 5-streak
- **Max Carry**: 1 (powerful effect, prevents overreliance)

---

## Balance Mechanics

### Coffee Perk System (Catch-Up for Late Players)
**Trigger**: Player opens app 10+ minutes after notification

**Benefits**:
- +3 seconds per question timer
- ONE keyword per question highlighted in warm orange
- Freshness multiplier floor raised from 0.5x to 0.7x

**Messaging**: "Late start? Have a Coffee Perk! ☕ Enjoy +3sec per question + helpful highlights."

**Psychology**: Reframes lateness as "different playstyle with buffs" rather than failure—reduces shame, maintains engagement.

**Tutorial Preview**: Day 2 shows: "Running late sometimes? Coffee Perks help you catch up without making questions easier!"

### Adaptive Difficulty
- Tracks 7-day rolling accuracy per player
- Question pool auto-adjusts to target 60-70% correct rate
- Maintains flow state (not too easy, not too hard)
- Difficulty independent of Coffee Perks (catch-up is time-based, not question-based)

### Unified Leaderboard
- Single neighborhood board (prevents community fragmentation)
- Each player's Active Title icon displayed (🌅🎲✓📍)
- Weekly resets for fair competition
- Segmented by population density (fair urban vs rural comparison)

---

## Onboarding Flow

### Day 1: Introduction
- **Experience**: 5 easy questions, no timer pressure, gentle tooltips
- **Goal**: Learn tap-to-answer mechanic, complete first run
- **Unlock**: Freshness timer revealed (visible, not penalized)
- **Message**: "Welcome! Let's start your morning ritual."

### Day 2: Layers Revealed
- **Experience**: 8 normal questions, freshness timer active, streak counter shown
- **Goal**: Understand scoring layers (base + speed + streak + freshness)
- **Unlock**: Modifier Preview screen (see 3 upcoming modifiers)
- **Message**: "Looking good! Tomorrow you'll unlock modifiers. PS: Coffee Perks help if you're running late! ☕"

### Day 3: Full Loop
- **Experience**: 10 mixed difficulty, full scoring, first PowerUp earned
- **Goal**: Experience complete session, see rewards flow
- **Unlock**: Neighborhood leaderboard visible, playstyle tracking begins
- **Message**: "Nice! Tomorrow: choose your first modifier."

### Day 4: Modifier Unlocked
- **Experience**: First choice (Classic / Coffee Break / Morning Rush)
- **Goal**: Make strategic pre-run decision
- **Unlock**: Full game active, playstyle progress visible in profile
- **Message**: "Your call: play safe or push for points? Your playstyle is tracked!"

---

## Content Generation

### News Sources
- **Local**: Location-based news APIs (city, regional)
- **Global**: Curated reliable sources (AP, Reuters, BBC)
- **Fact-checking**: All questions verified before deployment
- **User reports**: Flag system for errors → manual review

### Question Types

1. **Direct Factual** (Easy)
   - "What country announced new climate regulations today?"
   - Answer directly in headline

2. **Context Understanding** (Normal)
   - "Why did Tech Corp's stock drop 15% today?"
   - Requires reading snippet beyond headline

3. **Local Awareness** (Normal)
   - "What event is happening downtown this weekend?"
   - Personalized to player's location

4. **Timeline/Sequence** (Hard)
   - "Which of these events happened first this week?"
   - Tests multi-day attention

5. **Analysis/Prediction** (Expert)
   - "Which sector will most benefit from this policy change?"
   - Deeper reasoning, multiple defensible answers

### Difficulty Calibration
- **Easy**: Major headlines, 4 obvious choices
- **Normal**: Requires snippet read, 3 plausible choices
- **Hard**: Nuanced context, minor details
- **Expert**: Deep analysis, tricky wording, specialized knowledge

---

## Fail State Handling

### Poor Performance (0-2 Correct)
- **Response**: "Tough news day! Here's a bonus question you'll ace."
- **Action**: Grant easy mercy question
- **Reward**: Partial credit (login streak maintained), 10% PowerUp drop

### Streak Broken (10+ Days)
- **Response**: "Your 14-day streak ended, but look: 127 total questions! 📚"
- **Action**: Show lifetime stats to reframe loss as progress
- **Reward**: Auto-grant 1 Coffee Token to soften blow

### Missed Freshness Window (20+ Min Late)
- **Response**: "Better late than never! ☀️ Coffee Perks activated."
- **Action**: No punishment, just Coffee Perks
- **Reward**: Full gameplay, 0.7x freshness floor with Perks

---

## Theme & Presentation

### Visual Style
- **Palette**: Cream (#FFF8E7), Toast Brown (#D4A574), Coffee Black (#3E2723), Sunrise Orange (#FF6F00)
- **Animations**: Steam wisps, toast browning progress bar, multiplier cascades
- **Icons**: Playstyle emoji (🌅🎲✓📍), PowerUps with coffee/toast imagery

### Audio Design
- **Ambient**: Gentle coffee shop atmosphere (espresso machine, soft chatter)
- **Feedback**: Satisfying "ding" on correct, subtle "tick" at 15min mark
- **Celebration**: Toast "pop!" on streak milestones, escalating sounds for 5x/10x multipliers
- **Toggle**: Silent mode for offices/public spaces

### Accessibility
- Large text options
- High contrast mode
- Screen reader support
- Colorblind-friendly indicators
- Adjustable timers for different abilities

---

## Replayability & Retention

### Daily Cycle
- New news every morning (content auto-refreshes)
- 20-minute urgency window creates natural return behavior
- Yesterday's questions feel stale (authentic obsolescence)

### Short-Term (Week)
- 12 modifiers unlock in first 2 weeks (rapid discovery)
- Daily login streak with Coffee Token rewards
- Neighborhood leaderboard weekly resets

### Medium-Term (Month)
- 4 prestige modifiers via achievements
- Playstyle title progression (Bronze → Silver → Gold)
- Mastery tiers: Novice → Informed → Expert → News Savant

### Long-Term (Quarter+)
- Seasonal tournaments (Olympics, elections, cultural events)
- Achievement collection with unique rewards
- Friend mini-leagues with persistent records
- Custom difficulty prestige mode

### Social Features
- Unified leaderboard with playstyle icons
- Friend challenges: "Beat my Morning Rush score!"
- Share interesting questions to social media
- Neighborhood discussion boards (optional)

---

## Monetization

### Free-to-Play Core
- Full daily gameplay (no question locks)
- All modifiers unlockable through play
- Core PowerUps available
- Ad-supported (single banner, non-intrusive)

### Premium: Coffee Club ($4.99/month)
- Ad-free experience
- +2 exclusive prestige modifiers
- 3 streak insurance tokens per week
- Early access to seasonal events
- Cosmetic themes (dark mode, seasonal)

### Ethical Guidelines
- Never gate news content behind paywall
- Free tier is fully functional and competitive
- Premium enhances experience, doesn't create advantage
- No predatory mechanics or FOMO exploitation

---

## Success Metrics

### Engagement
- **DAU/MAU Ratio**: Target 60%+ (daily ritual formation)
- **D7 Retention**: 40%+
- **D30 Retention**: 20%+
- **Avg Session Length**: 7-12 minutes
- **Streak Completion**: 50%+ play consecutive days

### Quality
- **Question Accuracy**: 95%+ factually correct
- **User Report Rate**: <1% flagged
- **App Rating**: 4.5+ stars
- **NPS Score**: 50+

### Growth
- **Organic Shares**: 15%+ share to social
- **Friend Referrals**: 1.3+ invites per user
- **Press Coverage**: Featured in lifestyle/productivity media

---

## Development Roadmap

### Phase 1: MVP (8 weeks)
- Core trivia mechanics with streak multipliers
- Basic news integration (API + content pipeline)
- 3 starter modifiers + 6 unlockable
- Freshness timer and Coffee Perk system
- Local scoring and leaderboards
- iOS + Android apps

### Phase 2: Polish (4 weeks)
- Full modifier unlock schedule (12 core + 4 prestige)
- Playstyle tracking and title system
- PowerUp acquisition and inventory
- Onboarding flow (Day 1-4)
- Audio and visual polish

### Phase 3: Community (4 weeks)
- Friend challenges and mini-leagues
- Weekly event modifiers
- Share functionality
- Discussion boards
- Premium tier launch

### Phase 4: Expansion (Ongoing)
- International markets (multi-language)
- Smart home integration (Alexa/Google)
- Advanced analytics and personalization
- Seasonal mega-tournaments

---

## Why This Works

### Market Position
- **Not just trivia**: Real news makes it educational and relevant
- **Not just news**: Gamification makes it fun and rewarding
- **Perfect timing**: Fits existing morning routine (no behavior change required)
- **Natural urgency**: Fresh toast metaphor creates authentic time pressure
- **Hyperlocal**: Personalized content can't be replicated by generic trivia apps

### Player Psychology
- **Habit formation**: Morning ritual with natural trigger (breakfast)
- **Manageable time**: 10 minutes fits any schedule
- **Feel-good engagement**: Stay informed while having fun (dual benefit)
- **Social belonging**: Neighborhood competition creates identity
- **Mastery satisfaction**: Modifier system provides infinite depth

### Competitive Advantages
1. **Ephemeral content**: News expires daily, creating natural return cycle
2. **Location-aware**: Hyperlocal personalization is defensible moat
3. **Educational value**: Parents/schools may adopt (broad appeal)
4. **Viral moments**: Breaking news creates shared cultural experiences
5. **Low CAC**: News readers are already engaged audience (easy targeting)

---

## Technical Architecture

### Performance Targets
- **Load time**: <2 seconds cold start
- **Question transition**: <200ms
- **Frame rate**: Smooth 60fps animations
- **Memory**: <100MB on mobile

### Platform Support
- **Primary**: Native iOS + Android
- **Secondary**: Progressive Web App
- **Future**: Smart speakers (voice trivia)

### Data Pipeline
```
News APIs → Content Filter → Question Generator → Human Review → Question Pool → Player-Specific Selection → Delivery
```

### Privacy & Ethics
- Opt-in location sharing (can use zip code only)
- Transparent news sources cited
- Fact-checking pipeline with human oversight
- User report system with 24hr review SLA
- No fake news, no misleading headlines

---

## Conclusion

**Coffee Toast Trivia** transforms the mundane morning scroll into an intentional, rewarding ritual. By layering Miyamoto simplicity (tap to answer), Balatro compulsion (modifier × multiplier cascades), Lucas Pope deduction (synthesizing news into knowledge), and authentic urgency (fresh toast decay), we create a game that feels both cozy and thrilling.

Every morning, millions drink coffee and read news on their phones. This game makes that time:
- **More intentional** (focused engagement vs. doomscrolling)
- **More fun** (satisfying progression and rewards)
- **More rewarding** (stay informed + feel accomplished)
- **More social** (neighborhood connection and friendly competition)

The toast is warm. The coffee is hot. The news is fresh.

**Let's play.**
