# ALP Tutorial

A hands-on guide to building your first ALP project from scratch.

## Prerequisites

- Node.js 24+ and npm 10+
- A code editor (VS Code recommended with the [ALP extension](/vscode-extension))
- Basic familiarity with command-line tools

## Step 1: Initialize Your Project

Create a new directory and initialize ALP:

```bash
mkdir my-alp-project
cd my-alp-project
git init
alp init
```

This creates:

```
my-alp-project/
├── .alp/
│   ├── project.alp
│   ├── agents.alp
│   └── memory.alp
├── src/
└── README.md
```

## Step 2: Configure Your Project

Edit `.alp/project.alp`:

```alp
!alp-version: 80.0.0

@project
  id: my-alp-project
  name: My ALP Project
  version: 1.0.0
  state: active
  description: A sample ALP project demonstrating the protocol
```

## Step 3: Define Agents

Create `.alp/agents.alp`:

```alp
!alp-version: 80.0.0

@agent
  id: agent-coder
  name: Senior Developer
  description: Expert TypeScript/React engineer
  capabilities: [typescript, react, node.js, testing]
  model: claude-sonnet-4

@agent
  id: agent-reviewer
  name: Code Reviewer
  description: Security and performance review specialist
  capabilities: [security, performance, code-review]
  model: claude-sonnet-4
```

## Step 4: Create a Feature

Create `.alp/features/auth.alp`:

```alp
!alp-version: 80.0.0

@feature
  id: feat-auth
  name: User Authentication
  description: OAuth2 + JWT authentication system
  status: [~]
  priority: high

@task
  id: task-setup-db
  name: Setup database schema
  status: [x]
  agent: agent-coder
  verify:
    - npm run test:db
    - npm run db:migrate

@task
  id: task-login-ui
  name: Build login UI
  status: [ ]
  agent: agent-coder
  depends_on:
    - task-setup-db
  verify:
    - npm run test:login
    - npm run lint:login

@task
  id: task-auth-review
  name: Security review
  status: [ ]
  agent: agent-reviewer
  depends_on:
    - task-login-ui
  verify:
    - npm run test:security
```

## Step 5: Validate Your Work

```bash
# Validate all .alp files
alp validate

# View the dependency graph
alp graph

# Check project status
alp status
```

Expected output from `alp status`:

```
Project: my-alp-project
Version: 1.0.0
State: active

Tasks:
  [x] 1  task-setup-db
  [ ] 1  task-login-ui
  [ ] 1  task-auth-review

Total: 3 tasks
Progress: 33% complete
```

## Step 6: Execute Tasks

Run the execution engine to start working on the next available task:

```bash
# Auto-select next task
alp run

# Preview without executing
alp run --dry-run

# Run with a specific agent
alp run --agent agent-coder
```

The engine will:
1. Topologically sort the dependency graph
2. Identify `task-login-ui` as the next available task (depends on completed `task-setup-db`)
3. Compile a context bundle with the project definition, agent profile, and relevant rules
4. Output the bundle to stdout for your AI agent to process

## Step 7: Verify Quality Gates

After the agent completes the task, run verification:

```bash
alp verify task-login-ui
```

If the verify scripts pass, the task is automatically marked `[x] Done`. If they fail, it's marked `[!] Blocked` and the engine halts.

## Step 8: Human-in-the-Loop Review

For tasks requiring human review, use the `[?]` marker:

```bash
# Submit for human review
alp checkpoint task-auth-review --ask-human "Please review security implementation"
```

The task is marked `[?] Review` and the swarm continues with other work. A human can then approve or reject:

```bash
# Approve
alp checkpoint task-auth-review --approve

# Reject with feedback
alp checkpoint task-auth-review --reject "Needs OAuth2 PKCE support"
```

## Step 9: Monitor with MCP

Connect ALP to your AI IDE via MCP:

**Claude Desktop** (`claude_desktop_config.json`):

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

**Cursor** (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "alp": {
      "command": "alp-mcp",
      "args": [],
      "env": {}
    }
  }
}
```

Now your AI assistant can:
- Query the dependency graph with `alp_get_graph`
- Read objects with `alp_read_object`
- Update task status with `alp_update_status`
- Validate the workspace with `alp_validate`

## Step 10: Deploy with Confidence

Once all tasks are `[x] Done`:

```bash
# Final validation
alp validate

# Generate deployment manifest
alp export --format json --out deploy-manifest.json

# Tag your release
git tag -a v1.0.0 -m "Release: User authentication complete"
git push --tags
```

## Next Steps

- Explore the [CLI Tools Reference](/cli-tools) for all available commands
- Read the [Specification](/spec/01-overview) for deep protocol details
- Set up the [VS Code Extension](/vscode-extension) for IDE support
- Connect the [MCP Server](/mcp-server) to your AI tools
- Learn about [SDKs](/guide/sdk) for programmatic access
