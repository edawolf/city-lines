# Dev Container for GitHub Codespaces

This directory contains the configuration for running this project in GitHub Codespaces or VS Code Dev Containers.

## Features

- **Node.js 20**: Pre-installed with npm
- **Auto-install dependencies**: Runs `npm install` automatically on container creation
- **ESLint & Prettier**: Pre-configured for code quality and formatting
- **TypeScript**: Full TypeScript support with IntelliSense
- **Port Forwarding**: Development server on port 8080 is automatically forwarded

## Usage

### GitHub Codespaces

1. Click the "Code" button on the GitHub repository
2. Select "Codespaces" tab
3. Click "Create codespace on main"
4. Wait for the container to build and dependencies to install
5. Run `npm run dev` to start the development server
6. Open the forwarded port 8080 in your browser

### VS Code Dev Containers

1. Install the "Dev Containers" extension in VS Code
2. Open this repository in VS Code
3. Press `F1` and select "Dev Containers: Reopen in Container"
4. Wait for the container to build
5. Run `npm run dev` in the integrated terminal

## Quick Start

Once the container is running:

```bash
# Start development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
```

## Troubleshooting

If you encounter issues:

1. **Dependencies not installed**: Run `npm install` manually
2. **Port 8080 not accessible**: Check the "Ports" tab in VS Code and ensure 8080 is forwarded
3. **TypeScript errors**: Run `npm install` to ensure all type definitions are installed
