# Frequently Asked Questions

Common questions about ALP, how it works, and how to get started.

## General Questions

### What is ALP?

ALP (Autonomous Lifecycle Protocol) is the world's first open protocol specifically designed for autonomous software engineering. It replaces unstructured project documentation (`README.md`, `PRD.md`, `AGENTS.md`) with a deterministic, machine-readable specification stored in `.alp/` files.

### Is ALP a programming language?

No. ALP is a **protocol format**, not a programming language. It describes *what* to build and *how to verify it*, not *how to implement it*. You can use ALP with any programming language or framework.

### How is ALP different from YAML or JSON?

ALP is purpose-built for AI-driven software engineering. Unlike generic formats:

- **Indentation-based**: Uses 2-space indentation (no braces or brackets)
- **Dependency-aware**: Native `depends_on` references for topological sorting
- **Lifecycle-aware**: Built-in state machine with 6 status markers
- **Verification-native**: `verify` blocks with shell commands
- **Memory-scoped**: Cross-session memory with scoping rules
- **Governance-ready**: Policies, contracts, and encrypted vaults

### What AI agents work with ALP?

ALP is designed to work with any AI coding agent:

- **Claude Code** — via MCP server integration
- **Cursor** — via `.cursorrules` and MCP
- **Claude Desktop** — via MCP server
- **Devin** — via structured `.alp/` specifications
- **OpenHands** — via CLI integration
- **Custom agents** — via TypeScript/Python/Go/Rust/Java SDKs

## Installation & Setup

### How do I install ALP?

```bash
npm install -g @autonomous-lifecycle-protocol-alp/cli
```

Or build from source:

```bash
git clone https://github.com/Autonomous-Lifecycle-Protocol-ALP/Autonomous-Lifecycle-Protocol-ALP.git
cd Autonomous-Lifecycle-Protocol-ALP
npm ci && npm run build --workspace @autonomous-lifecycle-protocol-alp/cli
```

### Do I need to commit `.alp/` to version control?

Yes. The `.alp/` directory is the single source of truth for your project. Commit it to Git so agents can read it and track changes over time.

### Can I use ALP with existing projects?

Yes. ALP is designed to complement existing projects:

1. Run `alp init` to create the `.alp/` directory
2. Define your project structure incrementally
3. Start with high-level features and break them into tasks
4. Use ALP alongside your existing `README.md`, `TODO.md`, etc.

## Protocol Questions

### What is `!alp-version`?

The `!alp-version` directive declares which version of the ALP specification your file conforms to:

```alp
!alp-version: 80.0.0
```

Always include this at the top of your `.alp` files. Without it, parsers assume the latest supported version.

### What are status markers?

Status markers track task progress:

| Marker | Meaning |
|---|---|
| `[ ]` | Todo — not started |
| `[~]` | In Progress — currently being worked on |
| `[x]` | Done — finished and verified |
| `[!]` | Blocked — cannot proceed (requires reason) |
| `[?]` | Review — awaiting human review (requires reason) |
| `[-]` | Skipped — intentionally not done |

### Why do `[!]` and `[?]` require reasons?

Since v9.0.0, `[!]` (blocked) and `[?]` (review) markers MUST include a reason text. This prevents agents from creating ambiguous status markers and ensures human reviewers understand the context.

```alp
# Good
status: [!] Waiting for third-party API access

# Bad — parse error in v9+
status: [!]
```

### What is a context bundle?

A context bundle is a compiled Markdown payload containing:

- The `@project` definition
- The `@agent` profile assigned to the task
- Relevant `@decision`s (architecture choices)
- Absolute `@rule`s the agent must follow
- Cross-session `@memory` blobs

The execution engine compiles context bundles in < 2ms, providing agents with precise, non-redundant context.

### How does the dependency graph work?

ALP builds a directed acyclic graph (DAG) from `depends_on` references. The execution engine uses Kahn's algorithm to topologically sort tasks, ensuring dependencies are completed before dependent tasks start.

```bash
# Visualize the graph
alp graph

# Output as JSON
alp graph --json
```

### What is the difference between `depends_on` and `->` references?

- `depends_on` — **blocking** dependency. Task B won't start until Task A is `[x] Done`
- `->` references — **non-blocking** links for documentation, metadata, and relationships

```alp
@task
  id: task-b
  depends_on:
    - task-a           # Blocking
  feature: -> feat-1   # Non-blocking reference
  agent: -> agent-1     # Non-blocking reference
```

## Execution & Agents

### How do I run tasks?

```bash
# Auto-select next available task
alp run

# Preview context bundle without executing
alp run --dry-run

# Run with specific agent
alp run --agent agent-frontend
```

### How do I verify tasks?

```bash
# Verify a specific task
alp verify task-login-ui

# Verify all tasks
alp verify --all
```

The task is only marked `[x] Done` when **all** verify commands exit with code 0.

### How do I use MCP with ALP?

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "alp": {
      "command": "alp-mcp",
      "args": []
    }
  }
}
```

This gives your AI agent access to tools like `alp_get_graph`, `alp_read_object`, `alp_validate`, and more.

### Can multiple agents work simultaneously?

Yes. Use swarm mode:

```bash
alp run --concurrent 3
```

The engine uses a `LockManager` to prevent double-execution. Tasks are claimed by agents and locked until completion.

## Governance & Security

### How do I store secrets?

Use the encrypted vault:

```bash
# Store a secret
alp vault set db-password --value "$DB_PW" --recipient maintainer.pub

# Retrieve a secret
alp vault get db-password --key maintainer.key
```

Secrets are encrypted at rest with X25519 + AES-256-GCM and never stored in plaintext in `.alp/`.

### How do I enforce policies?

```alp
@policy
  id: policy-code-standards
  paths:
    allow:
      - src/**
    deny:
      - src/**/*.test.ts
  commands:
    allow:
      - npm run lint
      - npm run test
    deny:
      - rm -rf
  enforcement: strict
```

Policies are automatically enforced by `alp verify` and the execution engine.

### What are contracts?

Contracts define least-privilege boundaries between agents, tasks, or repos:

```alp
@contract
  id: contract-api-boundary
  from: -> agent-backend
  to: -> agent-frontend
  requires:
    - api-spec:version >= 2.0
  allows:
    - read:api/*
  denies:
    - write:api/admin/*
  on_violation: deny
```

## Troubleshooting

### Validation fails with "IndentationError"

ALP requires **2-space indentation**. Tabs are not allowed. Check that:
- You're using spaces, not tabs
- Each nesting level is exactly 2 spaces
- No mixed tabs and spaces

### Tasks not executing

Check that:
1. Dependencies are marked `[x] Done`
2. No circular dependencies exist (`alp graph` to verify)
3. The task status is `[ ]` or `[~]`
4. No `[!]` or `[?]` status without a reason

### Context bundle is too large

- Split large `.alp` files into smaller domain-specific files
- Remove unused `@memory` entries
- Use scoped memory instead of global memory
- Set `!context-scope: minimal` to reduce bundle size

### Agents overwrite each other's work

- Use more specific `depends_on` chains
- Enable lock management with `alp run --concurrent`
- Use separate feature files for parallel work

## Performance

### How fast is the parser?

The ALP parser builds and topologically sorts the dependency graph in < 2ms for typical projects. Context bundle compilation averages 1.8ms — 600x faster than raw context scraping.

### How can I speed up validation?

```bash
# Validate only changed files
alp validate --changed

# Use parallel execution
alp validate --parallel
```

### Does ALP work offline?

Yes. ALP is designed to work offline:
- All parsing is local
- Remote imports are cached in `.alp/.cache/`
- Memory is stored locally in `.alp/.memory.json`

## Contributing

### How can I contribute?

See the [Contributing Guide](https://github.com/Autonomous-Lifecycle-Protocol-ALP/Autonomous-Lifecycle-Protocol-ALP/blob/main/CONTRIBUTING.md) for details on:
- Setting up the development environment
- Running tests
- Submitting pull requests
- Reporting issues

### Is there a code of conduct?

Yes. All contributors must follow the [Contributor Covenant Code of Conduct](https://github.com/Autonomous-Lifecycle-Protocol-ALP/Autonomous-Lifecycle-Protocol-ALP/blob/main/CODE_OF_CONDUCT.md).

## Further Questions

- 📖 [CLI Guide](/guide/cli) — Complete command reference
- 📐 [Specification](/spec/01-overview) — Protocol deep dive
- 🛠️ [SDKs](/guide/sdk) — Programmatic access
- 💬 [GitHub Discussions](https://github.com/Autonomous-Lifecycle-Protocol-ALP/Autonomous-Lifecycle-Protocol-ALP/discussions) — Community Q&A
- 🐛 [GitHub Issues](https://github.com/Autonomous-Lifecycle-Protocol-ALP/Autonomous-Lifecycle-Protocol-ALP/issues) — Bug reports and feature requests
