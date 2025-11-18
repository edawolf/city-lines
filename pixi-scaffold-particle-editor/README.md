# PixiJS Responsive Layout Test Suite

A comprehensive testing and development environment for responsive game UI layouts using PixiJS v8+, featuring AI-driven layout intelligence and intent-based positioning systems.

## Ludemic Engine Documentation

This skeleton includes the latest Ludemic Engine documentation in `docs/ludemic/`.

To update docs to latest:
```bash
./scripts/update-docs.sh
```
## 🎯 Overview

This project demonstrates advanced responsive design patterns for PixiJS applications, including:

- **Intent-Based Layout System** - Semantic layout descriptions that compile to positioning
- **AI Layout Intelligence** - Elements as intelligent agents with NPC-like behavior
- **Comprehensive Testing Suite** - Validates responsive behavior across screen sizes
- **Real-time Layout Analysis** - Live polling and debugging of element positions

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ or **Bun** (recommended)
- Modern web browser with WebGL support

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd pixi-test

# Install dependencies (using Bun - preferred)
bun install

# Or using npm
npm install
```

### Development

```bash
# Start development server with hot reloading
bun run dev

# Or using npm
npm run dev
```

Open your browser to `http://localhost:8080` (or the port shown in terminal).

## 🎮 Features

### Core Systems

#### 🎯 **Intent-Based Layout System**
Describe layouts semantically instead of using absolute positioning:

```typescript
// Instead of: button.x = 30; button.y = 30;
layoutEngine.register('debugButton', button, 
  IntentLibrary.CORNER_BUTTON('top-right')
);

// Or even more semantic:
layoutEngine.register('testGrid', elements,
  IntentLibrary.fromDescription(
    "I want these elements to spread out without overlapping"
  )
);
```

#### 🤖 **AI Layout Intelligence**
Every UI element becomes an intelligent agent with:
- **Personality traits** (territoriality, cooperation, attention-seeking)
- **Spatial awareness** (proximity detection, conflict analysis)
- **Relationship mapping** (allies, rivals, dependencies)
- **Autonomous behavior** (negotiation, adaptation, communication)

#### 📊 **Comprehensive Testing Suite**
- **9 Anchor Point Tests** - Validate positioning across screen sizes
- **Corner Alignment Tests** - Ensure elements stay in corners
- **Edge Positioning Tests** - Test screen edge behavior
- **Viewport Tests** - Safe area and boundary validation
- **Scaling Tests** - Responsive element scaling
- **UI Component Tests** - Button and slider responsiveness

### Debug Interface

Access the debug interface via the 🔧 button on the main screen or press 'D'.

#### **Keyboard Controls:**
- **G** - Toggle debug grid
- **R** - Print debug test results  
- **P** - Poll MainScreen layout
- **L** - Poll debug layout
- **T** - Toggle layout system (auto-disables AI)
- **I** - Toggle AI intelligence (auto-disables T)
- **A** - AI analysis report
- **X** - Execute AI corrections (only 9 anchors)
- **ESC** - Return to main

## 📱 Responsive Design Patterns

### Viewport Adaptation
The system automatically handles:
- **Multiple screen sizes** (mobile, tablet, desktop)
- **Orientation changes** (portrait/landscape)
- **Safe area considerations** (notches, rounded corners)
- **DPR scaling** (high-resolution displays)

### Layout Strategies

#### **Intent-Based Positioning**
```typescript
// Semantic descriptions
IntentLibrary.CORNER_BUTTON('top-right')     // Always in corner
IntentLibrary.HERO_ELEMENT()                 // Prominently centered  
IntentLibrary.BOTTOM_TOOLBAR()               // Aligned at bottom
IntentLibrary.DEBUG_PANEL()                  // Floating, gets out of way
```

#### **AI-Driven Corrections**
The AI system can:
- **Detect clustering** and spread elements automatically
- **Resolve conflicts** between overlapping elements  
- **Bring off-screen elements** back into viewport
- **Optimize spacing** based on screen real estate

## 🏗️ Project Structure

```
src/
├── app/
│   ├── debug/              # Debug and testing systems
│   │   └── ResponsiveDebugTest.ts
│   ├── layout/             # Layout intelligence systems
│   │   ├── LayoutIntent.ts      # Intent-based layout compiler
│   │   ├── IntentLibrary.ts     # Predefined layout patterns
│   │   ├── LayoutIntelligence.ts # AI agent system
│   │   ├── ElementAgentFactory.ts # Agent creation and analysis
│   │   └── LayoutExecutor.ts    # AI-driven positioning execution
│   ├── screens/            # Game screens
│   │   ├── DebugScreen.ts      # Debug interface screen
│   │   └── main/
│   │       └── MainScreen.ts   # Main game screen
│   └── ui/                 # Reusable UI components
│       ├── Button.ts
│       ├── Label.ts
│       └── ...
├── engine/                 # Core game engine
│   ├── engine.ts           # CreationEngine (extends PixiJS Application)
│   ├── audio/              # Audio management
│   ├── navigation/         # Screen navigation
│   └── resize/             # Responsive resize handling
└── main.ts                 # Application entry point
```

## 🎨 Asset Management

- **Raw assets** in `raw-assets/` (source files)
- **Processed assets** in `public/assets/` (optimized for web)
- **AssetPack integration** for automatic asset processing
- **Multiple formats** (WebP, PNG) with fallbacks
- **Texture atlases** for optimized loading

## 🧪 Testing & Development

### Layout Validation
- **Real-time positioning analysis** 
- **Conflict detection** between elements
- **Off-screen element reporting**
- **Performance metrics** and optimization suggestions

### AI Behavior Analysis
- **Agent personality reports** (stress levels, conflicts)
- **Relationship mapping** (allies, rivals, dependencies)  
- **Spatial intelligence** (proximity, opportunities, threats)
- **Decision-making logs** (why elements moved where)

## 🎓 Learning Resources

### Key Concepts

#### **LISA (Ludemic Instruction Set Architecture)**
The intent system is inspired by LISA principles:
- **Atomic operations** that combine for complex behavior
- **Semantic descriptions** over imperative commands
- **Composable patterns** for reusable layout logic

#### **AI Agent Personalities**
Elements have personality traits that affect behavior:
- **Territoriality**: How much space they claim
- **Cooperation**: Willingness to share/move for others  
- **Attention-seeking**: How much visibility they demand
- **Stability**: Resistance to being moved
- **Social**: Preference for proximity to others
- **Independence**: Avoidance of dependencies

## 🚀 Deployment

### Build for Production
```bash
# Build optimized production bundle
bun run build

# Preview production build locally
bun run preview
```

### Deployment Targets
- **Vercel** (recommended) - Automatic deployment from Git
- **Netlify** - Static site hosting
- **GitHub Pages** - Free hosting for public repos
- **Self-hosted** - Any static file server

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-layout`)
3. Commit your changes (`git commit -m 'Add amazing layout feature'`)
4. Push to the branch (`git push origin feature/amazing-layout`)
5. Open a Pull Request

### Development Guidelines

- **Follow PixiJS best practices** (see `.cursor/rules/pixi-coding-standards.mdc`)
- **Use intent-based layouts** where possible
- **Add tests** for new responsive behaviors
- **Document AI agent personalities** for new element types

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **PixiJS Documentation**: https://pixijs.download/release/docs/index.html
- **PixiJS Examples**: https://pixijs.com/examples
- **AssetPack Documentation**: https://assetpack.github.io/
- **Vite Documentation**: https://vitejs.dev/

## 🐛 Troubleshooting

### Common Issues

#### Layout Elements Not Appearing
- Check console for layout system status (`🎯` vs `📐` vs `🤖`)
- Verify element registration with `P` key polling
- Ensure viewport dimensions are set correctly

#### AI System Not Working  
- Toggle systems with `I` key to reset AI registration
- Check console for agent count and conflicts
- Use `A` key for detailed AI analysis report

#### Performance Issues
- Enable/disable debug grid with `G` key
- Reduce number of test elements if needed
- Check for conflicting layout systems running simultaneously

---

**Built with ❤️ using PixiJS, TypeScript, and intelligent design patterns.**
