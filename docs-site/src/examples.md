# ALP Examples

Real-world examples demonstrating ALP patterns, best practices, and advanced features.

## Example 1: Minimal Project

The simplest valid ALP project:

```
my-project/
└── .alp/
    └── project.alp
```

`.alp/project.alp`:

```alp
!alp-version: 80.0.0

@project
  id: my-project
  name: My Project
  version: 1.0.0
  state: active
```

## Example 2: Feature with Tasks

A feature with multiple tasks and dependencies:

```alp
!alp-version: 80.0.0

@feature
  id: feat-user-auth
  name: User Authentication
  description: OAuth2 + JWT authentication
  status: [~]
  priority: high

@task
  id: task-oauth-setup
  name: Setup OAuth2 provider
  status: [x]
  agent: -> agent-backend
  verify:
    - npm run test:oauth
    - npm run lint

@task
  id: task-jwt-implementation
  name: Implement JWT tokens
  status: [ ]
  agent: -> agent-backend
  depends_on:
    - task-oauth-setup
  verify:
    - npm run test:jwt
    - npm run lint

@task
  id: task-login-ui
  name: Build login UI
  status: [ ]
  agent: -> agent-frontend
  depends_on:
    - task-jwt-implementation
  verify:
    - npm run test:login
    - npm run lint:login
    - npm run a11y
```

## Example 3: Workflow with Conditions

A workflow with conditional execution:

```alp
!alp-version: 80.0.0

@workflow
  id: wf-deployment
  name: Deployment Workflow
  steps:
    - id: step-build
      agent: -> agent-devops
      task: -> task-build
    - id: step-test
      agent: -> agent-tester
      task: -> task-test
      depends_on: step-build
    - id: step-staging-deploy
      agent: -> agent-devops
      task: -> task-deploy-staging
      depends_on: step-test
      condition: "${step-test.passed == true}"
    - id: step-prod-deploy
      agent: -> agent-devops
      task: -> task-deploy-prod
      depends_on: step-staging-deploy
      condition: "${step-staging-deploy.passed == true && project.environment == 'production'}"
```

## Example 4: Policy Enforcement

A policy restricting agent actions:

```alp
!alp-version: 80.0.0

@policy
  id: policy-security
  name: Security Policy
  paths:
    allow:
      - src/**
      - tests/**
    deny:
      - src/**/*.secret.ts
      - .env
  commands:
    allow:
      - npm run lint
      - npm run test
      - npm run build
    deny:
      - rm -rf
      - sudo
      - curl *
  enforcement: strict
  description: "Prevent agents from modifying sensitive files or running dangerous commands"
```

## Example 5: Contract Between Agents

A contract defining boundaries between agents:

```alp
!alp-version: 80.0.0

@contract
  id: contract-api-boundary
  name: API Boundary Contract
  from: -> agent-backend
  to: -> agent-frontend
  requires:
    - api-spec:version >= 2.0
    - api-spec:status == stable
  allows:
    - read:api/public/**
    - write:api/orders
    - read:api/users/me
  denies:
    - write:api/admin/**
    - read:api/users/*/password
    - delete:api/**
  on_violation: deny
  description: "Frontend can read public API and write orders, but cannot access admin endpoints"
```

## Example 6: Encrypted Vault

Storing secrets securely:

```bash
# Store a secret
alp vault set stripe-api-key --value "sk_live_..." --recipient maintainer.pub

# List vault entries
alp vault list

# Retrieve a secret
alp vault get stripe-api-key --key maintainer.key
```

Reference in `.alp` files:

```alp
@task
  id: task-payment-integration
  name: Integrate Stripe payments
  agent: -> agent-backend
  env:
    STRIPE_API_KEY: -> vault:stripe-api-key
    STRIPE_WEBHOOK_SECRET: -> vault:stripe-webhook-secret
  verify:
    - npm run test:payments
```

## Example 7: Event Mesh

Pub/sub event mesh for decoupled communication:

```alp
!alp-version: 80.0.0

@event_mesh
  id: mesh-team-alpha
  name: Team Alpha Event Mesh
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
    - id: topic-alerts
      agents:
        - -> agent-oncall
      retention: 90d
```

Publish events:

```bash
alp event-mesh publish topic-code-events '{
  "type": "task.completed",
  "task_id": "task-auth",
  "agent": "agent-coder",
  "timestamp": "2026-07-30T10:00:00Z",
  "metadata": {
    "files_changed": 5,
    "tests_added": 3
  }
}'
```

## Example 8: Memory Usage

Storing and retrieving cross-session memory:

```alp
!alp-version: 80.0.0

@memory
  id: mem-architecture-decision
  scope: project
  key: architecture:database
  value: "PostgreSQL chosen for ACID compliance and JSON support. Considered MongoDB but rejected due to lack of transactions."
  tags:
    - { key: "category", value: "architecture" }
    - { key: "decision-date", value: "2026-07-30" }

@memory
  id: mem-agent-context
  scope: agent:agent-coder
  key: preferences:testing
  value: "Prefer Jest for unit tests, Playwright for E2E"
```

Retrieve memory via SDK:

```typescript
import { MemoryStore } from '@autonomous-lifecycle-protocol-alp/sdk';

const memory = new MemoryStore('.alp/.memory.json');
const dbDecision = memory.get('project', 'architecture:database');
console.log(dbDecision);
// "PostgreSQL chosen for ACID compliance and JSON support..."
```

## Example 9: Multi-Project Workspace

A workspace spanning multiple repositories:

```alp
!alp-version: 80.0.0

@workspace
  id: ws-monorepo
  name: Monorepo Workspace
  members:
    - id: project-frontend
      path: ./apps/web
    - id: project-backend
      path: ./apps/api
    - id: project-shared
      path: ./packages/shared

@task
  id: task-frontend-auth
  project: -> project-frontend
  depends_on:
    - project-shared::task-types-definition
```

## Example 10: Swarm Marketplace

Registering and invoking skills:

```alp
!alp-version: 80.0.0

@swarm_marketplace
  id: listing-code-review
  provider_agent: -> agent-reviewer
  skill_name: code-review
  category: analysis
  cost_per_call: 0.05
  description: "Automated security and style review"
  rating: 4.8
```

Register via CLI:

```bash
alp marketplace register listing-1 agent-reviewer code-review \
  --category analysis \
  --cost 0.05 \
  --description "Automated security and style review"
```

Invoke a skill:

```bash
alp marketplace invoke listing-1 agent-coder "Review PR #42 for security issues"
```

## Example 11: Plugin System

Creating a custom plugin:

```alp
!alp-version: 80.0.0

@plugin
  id: plugin-scrum
  name: Scrum Plugin
  version: 1.0.0
  description: "Adds scrum-specific object types"

@type
  id: epic
  properties:
    id: { type: string, required: true }
    name: { type: string, required: true }
    story_points: { type: number, required: false }
    sprint: { type: string, required: false }
```

Install the plugin:

```bash
alp plugin install @community/scrum-plugin
```

## Example 12: Complete Project Structure

A production-ready ALP project:

```
my-saas/
├── .alp/
│   ├── project.alp
│   ├── agents.alp
│   ├── memory.alp
│   ├── policies.alp
│   ├── contracts.alp
│   ├── workflows.alp
│   ├── event-mesh.alp
│   ├── features/
│   │   ├── auth.alp
│   │   ├── billing.alp
│   │   └── dashboard.alp
│   ├── .runtime/
│   │   ├── log.jsonl
│   │   └── state.db.json
│   └── .cache/
│       ├── remote/
│       └── projects/
├── src/
│   ├── auth/
│   ├── billing/
│   └── dashboard/
├── tests/
├── package.json
├── README.md
└── .gitignore
```

## Further Reading

- [Tutorial](/tutorial) — Step-by-step getting started guide
- [Best Practices](/best-practices) — Guidelines for writing high-quality `.alp` files
- [Specification](/spec/01-overview) — Deep dive into the protocol
- [CLI Tools](/cli-tools) — Complete command reference
