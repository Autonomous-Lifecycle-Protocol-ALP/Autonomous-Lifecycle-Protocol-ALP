# ALP Best Practices

Guidelines and recommendations for writing high-quality `.alp` files and running effective AI-driven workflows.

## Project Structure

### Keep `.alp` Files Focused

Split large projects into multiple files by domain:

```
.alp/
├── project.alp          # Project definition (required)
├── agents.alp           # Agent definitions
├── features/
│   ├── auth.alp         # Authentication feature
│   ├── catalog.alp      # Product catalog feature
│   └── checkout.alp     # Checkout feature
├── workflows.alp        # Workflow definitions
└── memory.alp           # Cross-session memory
```

**Benefits:**
- Easier code review and diffing
- Parallel agent work on different features
- Faster parsing (smaller file sizes)
- Clear ownership and responsibility

### Use Descriptive IDs

```alp
# Good
@task
  id: task-oauth2-token-refresh
  name: Implement OAuth2 token refresh flow

# Bad
@task
  id: t1
  name: Do the thing
```

### Always Declare `!alp-version`

```alp
!alp-version: 80.0.0

@project
  ...
```

Without a version declaration, parsers assume the latest supported version, which can lead to unexpected behavior when the specification evolves.

## Status Markers

### Use Status Markers Consistently

| Marker | Meaning | When to Use |
|---|---|---|
| `[ ]` | Todo | Task not yet started |
| `[~]` | In Progress | Agent actively working |
| `[x]` | Done | Completed and verified |
| `[!]` | Blocked | Cannot proceed (always include reason) |
| `[?]` | Review | Awaiting human review (always include reason) |
| `[-]` | Skipped | Intentionally not done |

### Always Provide Reasons for `[!]` and `[?]`

Since v9.0.0, `[!]` and `[?]` markers MUST include a reason:

```alp
# Good
@task
  id: task-api-rate-limit
  status: [!] Waiting for API key from vendor

# Bad - will cause parse error in v9+
@task
  id: task-api-rate-limit
  status: [!]
```

## Dependencies

### Use `depends_on` for Sequential Work

```alp
@task
  id: task-login-ui
  depends_on:
    - task-setup-db
    - task-api-design
```

The execution engine will not start `task-logup-ui` until both dependencies are `[x] Done`.

### Avoid Circular Dependencies

```alp
# Bad - circular dependency
@task
  id: task-a
  depends_on:
    - task-b

@task
  id: task-b
  depends_on:
    - task-a
```

Use `alp graph` to detect cycles:

```bash
alp graph --json | jq '.[] | select(.cycle != null)'
```

### Use References for Non-Blocking Relationships

```alp
@task
  id: task-login-ui
  feature: -> feat-auth           # Non-blocking reference
  agent: -> agent-frontend        # Non-blocking reference
  depends_on:
    - task-setup-db               # Blocking dependency
```

## Verification

### Define Verify Rules for Every Task

```alp
@task
  id: task-api-endpoints
  verify:
    - npm run test:api
    - npm run lint:api
    - npm run type-check
```

The task is only marked `[x] Done` when **all** verify commands exit with code 0.

### Keep Verify Commands Fast

```alp
# Good - fast, focused checks
verify:
  - npm run test:unit
  - npm run lint

# Bad - includes slow integration tests
verify:
  - npm run test:all
  - npm run e2e
  - npm run load-test
```

Move slow tests to a separate `@verification` object if needed.

## Agents

### Assign Agents by Capability

```alp
@agent
  id: agent-frontend
  capabilities: [react, typescript, tailwind]

@agent
  id: agent-backend
  capabilities: [node.js, postgresql, redis]

@task
  id: task-login-ui
  agent: -> agent-frontend  # Matches capabilities
```

### Use Multiple Agents for Complex Workflows

```alp
@workflow
  id: wf-feature-development
  steps:
    - agent: -> agent-planner
      task: -> task-planning
    - agent: -> agent-coder
      task: -> task-implementation
    - agent: -> agent-reviewer
      task: -> task-code-review
    - agent: -> agent-tester
      task: -> task-testing
```

## Memory

### Use Scoped Memory

```alp
@memory
  id: mem-architecture-decision
  scope: project
  key: architecture:database
  value: "PostgreSQL chosen for ACID compliance and JSON support"
```

Memory is scoped to:
- `project` — visible to all agents in the project
- `feature:<id>` — visible only to agents working on that feature
- `agent:<id>` — private to a specific agent

### Don't Store Secrets in Memory

Use the encrypted vault for sensitive data:

```bash
alp vault set api-key --value "sk-..." --recipient maintainer.pub
```

Reference vault entries in `.alp` files:

```alp
@task
  id: task-api-integration
  env:
    API_KEY: -> vault:api-key
```

## Governance

### Define Policies Early

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
      - sudo
  enforcement: strict
```

### Use Contracts for Boundaries

```alp
@contract
  id: contract-api-boundary
  from: -> agent-backend
  to: -> agent-frontend
  requires:
    - api-spec:version >= 2.0
  allows:
    - read:api/*
    - write:api/orders
  denies:
    - write:api/admin/*
  on_violation: deny
```

## Workflows

### Use Workflows for Repeatable Processes

```alp
@workflow
  id: wf-standard-development
  name: Standard Development Workflow
  steps:
    - id: step-plan
      agent: -> agent-planner
      task: -> task-planning
      condition: "${project.state == 'active'}"
    - id: step-implement
      agent: -> agent-coder
      task: -> task-implementation
      depends_on: step-plan
    - id: step-review
      agent: -> agent-reviewer
      task: -> task-code-review
      depends_on: step-implement
      condition: "${task-implementation.status == '[x]'}"
    - id: step-merge
      agent: -> agent-release-manager
      task: -> task-merge
      depends_on: step-review
```

### Use Conditions for Dynamic Workflows

```alp
@workflow
  id: wf-conditional-deploy
  steps:
    - id: step-test
      agent: -> agent-tester
      task: -> task-testing
    - id: step-deploy
      agent: -> agent-devops
      task: -> task-deploy
      depends_on: step-test
      condition: "${step-test.passed == true}"
```

## Event Mesh

### Use Topics for Decoupled Communication

```alp
@event_mesh
  id: mesh-team-alpha
  topics:
    - id: topic-code-events
      agents:
        - -> agent-coder
        - -> agent-reviewer
      retention: 7d
    - id: topic-deploy-events
      agents:
        - -> agent-devops
        - -> agent-monitor
      retention: 30d
```

### Publish Events for Audit Trail

```bash
alp event-mesh publish topic-code-events '{
  "type": "task.completed",
  "task_id": "task-login-ui",
  "agent": "agent-coder",
  "timestamp": "2026-07-30T10:00:00Z"
}'
```

## Common Pitfalls

### ❌ Don't: Use Tabs for Indentation

```alp
# Bad - tabs cause IndentationError
@task
	id: task-bad
```

### ❌ Don't: Skip `!alp-version`

```alp
# Bad - parser assumes latest version
@project
  id: my-project
```

### ❌ Don't: Mark Tasks Done Without Verification

```alp
# Bad - no verify block
@task
  id: task-untested
  status: [x]
```

### ❌ Don't: Use Unannotated `[!]` or `[?]`

```alp
# Bad - parse error in v9+
@task
  id: task-blocked
  status: [!]

# Good
@task
  id: task-blocked
  status: [!] Waiting for third-party API access
```

## Performance Tips

- Keep `.alp` files under 500 lines for faster parsing
- Use `depends_on` instead of manual ordering
- Enable caching for remote imports: `!integrity: sha256:...`
- Use `alp graph --json` for programmatic consumption
- Batch verification commands where possible

## Troubleshooting

### Parser Errors

Run `alp validate` to identify syntax issues:

```bash
alp validate --strict  # Treat warnings as errors
```

### Slow Execution

Profile with the execution engine:

```bash
alp run --dry-run  # Preview context bundle
alp debug task-id   # Inspect resolved object
```

### Memory Leaks

Clear old memory entries:

```bash
alp memory list
alp memory delete mem-old-key
```

## Further Reading

- [CLI Guide](/guide/cli) — Complete command reference
- [Specification](/spec/01-overview) — Protocol deep dive
- [Tutorial](/tutorial) — Step-by-step getting started
- [SDKs](/guide/sdk) — Programmatic access
