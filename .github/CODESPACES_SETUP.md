# GitHub Codespaces Setup Guide

## Quick Start

1. Click "Code" → "Codespaces" → "Create codespace on main"
2. Wait for the environment to build (2-3 minutes)
3. Run: `npm run dev`
4. Click "Open in Browser" when the port 8080 notification appears

## What's Included

- **Node.js 20** with npm
- **All dependencies pre-installed**
- **ESLint & Prettier** configured
- **TypeScript** with full IntelliSense
- **Hot reload** on file changes

## Available Commands

```bash
# Development
npm run dev          # Start dev server with hot reload

# Code Quality
npm run lint         # Run ESLint
npx prettier --write "src/**/*.ts"  # Format all files

# Building
npm run build        # Production build

# Game Development (Ludemic Primitives)
npm run dev          # Load PrimitiveTestScreen with Phase 5 features
```

## Known Issues

- Some lint warnings remain (type safety improvements ongoing)
- These don't affect functionality - the game runs perfectly
- We're progressively improving type definitions

## Project Structure

```
fullsail-scaffold/
├── src/
│   ├── ludemic/           # Game primitives system (LISA)
│   │   ├── primitives/    # Composable game behaviors
│   │   ├── entities/      # Game objects
│   │   └── config/        # JSON game configurations
│   ├── app/               # UI framework
│   │   ├── layout/        # AI-driven layout system
│   │   └── screens/       # Game screens
│   └── engine/            # PixiJS engine plugins
├── public/
│   └── config/            # Game configuration files
└── .devcontainer/         # Codespaces configuration
```

## Troubleshooting

### Port 8080 not accessible
- Check the "Ports" tab in VS Code
- Click "Forward Port" if 8080 isn't listed
- Set visibility to "Public" if you want to share

### Dependencies missing
```bash
npm install
```

### TypeScript errors
```bash
npm install
# Restart VS Code: Cmd+Shift+P → "Reload Window"
```

### Game not loading
```bash
# Check console for errors
# Verify all assets loaded: F12 → Console
```

## Development Tips

### Hot Reload
- Save any `.ts` file to trigger rebuild
- Browser auto-refreshes when build completes
- Check terminal for build errors

### Tuning System
- Press `T` in PrimitiveTestScreen to open tuning controls
- Adjust parameters in real-time
- See changes immediately without restart

### Debugging
- Press `F12` to open browser DevTools
- PixiJS renders to Canvas - check Canvas inspector
- Console logs prefixed with emojis for easy filtering:
  - 🎮 Game events
  - 🎯 Layout operations
  - 🤖 AI agent operations

## Game Jam Workflow (Phase 6)

1. **Design**: Use LUDEMIC_IDEA_TO_LISA.mdc to extract ludemes
2. **Plan**: Use LUDEMIC_GDD_PROPOSAL.mdc to create GDD
3. **Polish**: Use LUDEMIC_FUN_EXPANDER_AGENT.mdc to maximize fun
4. **Build**: Create JSON config with primitives
5. **Iterate**: Use tuning system to polish gameplay
6. **Ship**: Build and deploy

## Support

- **Documentation**: See `/docs/` folder
- **Examples**: Check `/public/config/` for game configurations
- **Issues**: File at GitHub repository

Happy coding! 🎮
