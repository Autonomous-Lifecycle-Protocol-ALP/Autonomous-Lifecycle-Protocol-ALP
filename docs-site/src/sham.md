# SHAM IDE

**Smart Hosted Agent Manager** — The unified, dedicated desktop IDE for ALP. No more switching between Cursor, VS Code, and other editors with partial ALP support. SHAM is faster, more secure, and error-free because it uses ALP natively across Mac, Windows, and Linux.

## The Problem: Fragmented ALP Experience

Today, ALP users must juggle multiple tools:
- **VS Code** — requires the `alp-vscode` extension for syntax support, diagnostics, and LSP features
- **Cursor** — AI-native editor with limited ALP awareness
- **Claude Code / other MCP clients** — MCP server integration available but disconnected from editor workflow
- **CLI terminal** — separate window for `alp run`, `alp validate`, `alp marketplace`
- **Web playground** — browser-based, no local filesystem access

This fragmentation means:
- Context switching slows down development
- ALP features are inconsistent across tools
- Security models differ between editors
- Error handling and validation are siloed

## The Solution: SHAM IDE

SHAM consolidates every ALP capability into one native desktop application:

| Capability | In SHAM | In Other IDEs |
| :--- | :--- | :--- |
| ALP syntax highlighting | Native Monaco editor with ALP grammar | Requires extension, may lag behind parser |
| Real-time validation | Native `@autonomous-lifecycle-protocol-alp/parser` in main process | Extension-dependent, slower IPC |
| Agent management | Built-in agent manager with create/run/monitor | Not available |
| Integrated terminal | ALP CLI built-in, no external terminal needed | Separate terminal window |
| MCP tools browser | Native MCP browser panel | Requires separate MCP client |
| Cross-platform filesystem | Native Electron file dialogs + Node.js `path` | Editor-dependent |
- Auto-updater | Native `electron-updater` | Manual extension/plugin updates
- Licensing tiers | Built-in Pro/Enterprise license management | Not available

## Why SHAM is Faster

- **Native ALP integration**: `@autonomous-lifecycle-protocol-alp/parser` runs in the Electron main process, not a separate language server — eliminates IPC overhead
- **Single process architecture**: Monaco editor, agent manager, terminal, and MCP browser share memory and state
- **No extension lag**: ALP parser updates are bundled with SHAM releases, not dependent on extension marketplace approval cycles
- **Sub-2ms parse**: ALP documents parse and validate in the main process using the same `AlpParser` class used by CLI and SDK

## Why SHAM is More Secure

- **Context isolation**: Electron renderer is sandboxed with `contextIsolation: true` and `nodeIntegration: false`
- **Preload bridge**: Only necessary APIs exposed via `contextBridge` — no arbitrary Node.js access from renderer
- **Main-process validation**: All ALP parsing and validation runs in the main process, not the renderer — renderer never touches raw ALP AST
- **Native filesystem dialogs**: No direct filesystem access from renderer; file operations go through Electron's secure `dialog` API
- **No extension attack surface**: Reduces trust to single signed installer rather than multiple third-party extensions

## Why SHAM is Error-Free

- **Single ALP version**: SHAM bundles `@autonomous-lifecycle-protocol-alp/parser`, `@autonomous-lifecycle-protocol-alp/sdk`, and `@autonomous-lifecycle-protocol-alp/cli` at the same version — eliminates version skew between editor extension and CLI
- **Unified error handling**: Validation errors, agent failures, and MCP errors all surface in the same panel with consistent formatting
- **Schema-validated**: All 49 JSON schemas registered and enforced natively — no extension-specific schema drift
- **Tested integration**: SHAM tests verify `AlpParser` integration directly, not through a separate language server protocol

## Features

### ALP Editor
- Monaco-based code editor with ALP syntax highlighting
- Real-time diagnostics and validation via native `@autonomous-lifecycle-protocol-alp/parser`
- Auto-completion for ALP directives and properties
- Multi-file support with tabbed interface

### Agent Manager
- Create, configure, and run ALP agents
- Monitor agent status (idle, running, stopped, error)
- View agent execution history and output in the integrated terminal

### Integrated Terminal
- Run ALP CLI commands directly within the IDE
- No need for an external terminal window
- Agent output and logs stream in real-time

### MCP Tools Browser
- Discover and browse available MCP tools
- Integrate MCP tools into your ALP workflows
- View tool descriptions, parameters, and invocation results

### Cross-Platform Support
- **Windows**: NSIS installer
- **macOS**: DMG + universal binary
- **Linux**: AppImage + deb + rpm

## Installation

### Prerequisites
- Node.js 24+
- npm 10+

### Build from Source

```bash
# Clone the repository
git clone https://github.com/alp-protocol/alp.git
cd alp

# Install dependencies
npm install

# Build SHAM IDE
cd sham
npm install
npm run build

# Package for your platform
npm run package -- --win    # Windows
npm run package -- --mac    # macOS
npm run package -- --linux  # Linux
```

## Screenshots

### Main Window

![SHAM Main Window](/.vitepress/public/sham/screenshot-main.svg)

The SHAM main window showing the Monaco editor, sidebar, and header with Pro tab.

### Welcome Screen

![SHAM Welcome Screen](/.vitepress/public/sham/screenshot-welcome.svg)

The welcome screen with quick actions for opening files and getting started.

### Pro Panel

![SHAM Pro Panel](/.vitepress/public/sham/screenshot-pro.svg)

The Pro features panel with license activation, cloud sync, and team management.

## Architecture

```
┌─────────────────────────────────────┐
│  SHAM Desktop App                   │
│  ┌───────────────┐  ┌───────────┐  │
│  │ Monaco Editor │  │ Sidebar   │  │
│  ├───────────────┤  ├───────────┤  │
│  │ Terminal      │  │ Agent Mgr │  │
│  └───────────────┘  └───────────┘  │
└─────────────┬───────────────────────┘
              │ IPC (contextIsolation)
              ▼
┌─────────────────────────────────────┐
│  Electron Main Process             │
│  ┌───────────────┐  ┌───────────┐  │
│  │ AlpBridge     │  │ FileSystem│  │
│  ├───────────────┤  ├───────────┤  │
│  │ AutoUpdater   │  │ Window    │  │
│  └───────────────┘  └───────────┘  │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  ALP Native Layer                  │
│  @autonomous-lifecycle-protocol-alp/parser  @autonomous-lifecycle-protocol-alp/sdk  @autonomous-lifecycle-protocol-alp/cli  │
└─────────────────────────────────────┘
```

## Business Model

### Free (Open Core)
- Local agent development
- ALP syntax support with Monaco editor
- MCP tools browser
- Local testing and validation

### Pro ($19/mo or $199/yr)
- Cloud deployment of agents
- Team collaboration features
- Advanced analytics dashboard
- Marketplace access

### Enterprise (Custom)
- SSO/SAML authentication
- RBAC and audit logging
- Custom integrations
- Dedicated support

## Testing

```bash
# Run SHAM tests
cd sham
npm test

# Run all tests including SHAM
cd ..
npx vitest run
```

## Roadmap

See [ROADMAP_V17_V43.md](file:///c:/Users/KGN/Desktop/new%20file%20sys/docs/ROADMAP_V17_V43.md) for the full ALP roadmap including v45.0.0 "Autonomous Orchestration" features.

## Contributing

See [CONTRIBUTING.md](file:///c:/Users/KGN/Desktop/new%20file%20sys/CONTRIBUTING.md) for contribution guidelines.

## License

MIT
