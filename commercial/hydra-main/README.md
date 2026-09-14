# HYDRA Main AI

Cloud-native AI runtime powering all 21 ALP products.

## Architecture

```
hydra-main/
├── src/
│   ├── core/           # Orchestrator, Scheduler, Context Engine
│   ├── agents/         # 14 agent personas (registry + configs)
│   ├── models/         # Model Router (multi-provider, failover)
│   ├── memory/         # Session, project, agent, global, episodic stores
│   ├── tools/          # Tool registry (40+ tools)
│   ├── security/       # Security Kernel, capabilities, audit
│   ├── verification/   # Quality gates, test runners
│   ├── products/       # Product-to-agent mapping (21 products)
│   └── tenant/         # Multi-tenancy (orgs, teams, users)
├── tests/
└── package.json
```

## Quick Start

```bash
cd commercial/hydra-main
npm install
npx vitest run
```

### Running the API Server

```bash
npm install
npm run build
npm start        # starts on port 3000
# or set a custom port:
PORT=8080 npm start
```

The server exposes all 21 API routes (listed below) and starts the background
scheduler automatically. Pass `{ startScheduler: false }` to `createHydraServer`
in programmatic usage if you want to control task execution manually.

## API Routes (mounted at `/api/hydra`)

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Runtime health check |
| GET | `/agents` | List all 14 agent personas |
| GET | `/agents/:id` | Get specific persona |
| POST | `/tasks` | Create a new AI task |
| POST | `/tasks/:id/run` | Execute a task |
| GET | `/tasks/:id` | Get task status |
| GET | `/runs/:id` | Get agent run details |
| POST | `/models/select` | Model routing decision |
| POST | `/memory` | Store memory entry |
| GET | `/memory` | Query memory entries |
| POST | `/security/check` | Check capability permission |
| POST | `/projects/:id/graph` | Register project graph |
| POST | `/projects/:id/dependencies` | Add dependency |
| GET | `/projects/:id/dependencies/affected` | Get affected nodes |
| POST | `/organizations` | Create organization |
| POST | `/organizations/:id/teams` | Create team |
| POST | `/organizations/:id/users` | Add user |
| GET | `/products` | List all 21 products |
| GET | `/products/:id/agents` | Get agents for product |
| POST | `/verification/check` | Run quality gate check |

## Agent Personas (14)

| ID | Name | Domain |
|---|---|---|
| `engineer` | Engineer Agent | General software engineering |
| `security` | Security Agent | AppSec, vulnerability scanning |
| `devops` | DevOps Agent | Infrastructure and deployment |
| `data` | Data Agent | Data engineering and analytics |
| `eda` | Chip/EDA Agent | Hardware design |
| `quantum` | Quantum Agent | Quantum computing |
| `soc` | SOC Agent | Security operations |
| `threat-intel` | Threat Intel Agent | Threat intelligence |
| `zero-trust` | Zero Trust Agent | Network security |
| `test-engine` | Test Engine Agent | Test generation and orchestration |
| `code-review` | Code Review Agent | Code review and style |
| `release-manager` | Release Manager Agent | Release orchestration |
| `api-designer` | API Designer Agent | API design and contracts |
| `architecture-visualizer` | Architecture Visualizer Agent | Architecture docs |

## Relationship to Portable HYDRA

```
┌─────────────────────────────────────────┐
│          HYDRA PORTABLE                 │
│  CPU-first, offline, 64GB USB, local    │
│  Python/Rust core                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          HYDRA MAIN AI                  │
│  Cloud-native, multi-tenant, server     │
│  TypeScript/Node.js core                │
│  Powers 21 ALP products                 │
└─────────────────────────────────────────┘

Both share:
  - Same agent personas
  - Same product mapping
  - Same architectural principles
  - ALP protocol as foundation
```

## Design Principles

- **One runtime, many products** — All 21 products share the same HYDRA core
- **Personas, not models** — 14 agent personas are configs, not separate deployments
- **Multi-tenant by default** — Organizations, teams, users from day one
- **API-first** — Every capability exposed via REST
- **Composable** — Products are thin UI + workflow layers on top of core
- **Auditable** — All agent actions logged per organization
