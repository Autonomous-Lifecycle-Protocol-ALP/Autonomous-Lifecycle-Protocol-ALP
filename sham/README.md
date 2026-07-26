# SHAM - Smart Hosted Agent Manager

A standalone desktop IDE for building, testing, deploying, and monitoring ALP (Autonomous Lifecycle Protocol) agents.

## Features

- **ALP Editor**: Monaco-based editor with syntax highlighting, diagnostics, and auto-completion for `.alp` files
- **Agent Manager**: Create, configure, run, and monitor ALP agents
- **Integrated Terminal**: Run ALP commands and view agent output
- **MCP Browser**: Discover and browse MCP tools connected to your workspace
- **Real-time Validation**: Instant ALP document validation with line-level diagnostics

## Getting Started

```bash
cd sham
npm install
npm run dev
```

## Project Structure

```
sham/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # Entry point
│   │   ├── window.ts   # Window management
│   │   ├── alp-bridge.ts # ALP parser/SDK bridge
│   │   └── preload.ts  # IPC preload script
│   ├── renderer/       # React frontend
│   │   ├── App.tsx     # Main application
│   │   ├── components/ # UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── styles/     # Theme and styling
│   │   └── shims/      # Node.js module shims
│   └── shared/         # Shared types and utilities
├── assets/             # Static assets
└── electron-builder.json
```

## Business Model

- **Free (Open Core)**: Local agent development, ALP syntax support, Monaco editor, MCP tool browser, local testing
- **Pro ($19/mo or $199/yr)**: Cloud deployment, team collaboration, advanced analytics, MCP marketplace access
- **Enterprise (custom)**: SSO/SAML, RBAC, audit logging, custom integrations, dedicated support

## License

MIT