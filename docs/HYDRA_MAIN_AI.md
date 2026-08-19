# HYDRA Main AI — Implementation Plan

> **Status:** Active  
> **Date:** 2026-08-15  
> **Context:** Cloud/server counterpart to `alp-portable/HYDRA`. Powers all 21 ALP products through a shared multi-tenant AI runtime.

---

## 1. What is the "Main AI"?

The **portable HYDRA** is:
- CPU-first, offline-capable
- Runs from a 64 GB USB drive
- Single-user, local execution
- Python/Rust core

The **main HYDRA** is:
- Cloud-native, server-side
- Multi-tenant (organizations, teams, users)
- Powers 21 ALP products via shared runtime
- TypeScript/Node.js core (integrates with existing `commercial/alp-platform`)
- Horizontally scalable, API-first

```text
┌─────────────────────────────────────────────────────────────┐
│                    ALP PRODUCT LAYER                         │
│  Cloud Workspace │ Mobile │ Agent Studio │ Security Scanner  │
│  Analytics │ DevOps │ Model Hub │ Data Pipeline │ Chip Design │
│  SOC │ Threat Intel │ Zero Trust │ Test Engine │ Code Review │
│  Release Mgr │ Perf Profiler │ API Designer │ Arch Viz      │
│  Migration │ Docs Engine │ Supply Chain Guardian             │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    HYDRA MAIN AI                            │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ API Gateway │  │  Auth /     │  │   Agent Persona     │  │
│  │             │  │  RBAC       │  │   Registry (14)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Model       │  │ Memory      │  │   Tool / Skill      │  │
│  │ Router      │  │ Layer       │  │   Registry (40+)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ ALP Life-   │  │ Security    │  │   Verification      │  │
│  │ cycle Engine│  │ & Sandbox   │  │   Engine            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   HYDRA CORE                           ││
│  │  Orchestrator │ Scheduler │ Context Engine │ Evolution  ││
│  └─────────────────────────────────────────────────────────┘│
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  alp-platform   │
                   │  (TypeScript)   │
                   └─────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  alp-server     │
                   │  (Express API)  │
                   └─────────────────┘
```

---

## 2. Architecture Principles

| Principle | Application |
|---|---|
| **One runtime, many products** | All 21 products share the same HYDRA core |
| **Personas, not models** | 14 agent personas are configs, not separate deployments |
| **Multi-tenant by default** | Organizations, teams, users from day one |
| **API-first** | Every capability exposed via REST/WebSocket |
| **Composable** | Products are thin UI + workflow layers on top of core |
| **Auditable** | All agent actions logged per organization |
| **Scalable** | Horizontal scaling via stateless API nodes + shared state |

---

## 3. Repository Structure

```
newfilesys/
├── alp-portable/              # Existing portable HYDRA (Python/Rust)
│   └── HYDRA/
│       ├── python/
│       ├── crates/
│       └── hydra/
│
├── commercial/
│   ├── alp-platform/          # Existing TypeScript platform library
│   │   └── src/
│   │       ├── agents/
│   │       ├── llm/
│   │       ├── memory/
│   │       ├── tools/
│   │       ├── safety/
│   │       └── ...
│   │
│   ├── alp-server/            # Existing Express API server
│   │   ├── routes/            # Product-specific routes
│   │   ├── controllers/
│   │   ├── models/
│   │   └── middleware/
│   │
│   ├── hydra-main/            # 🆕 THE MAIN AI RUNTIME
│   │   ├── src/
│   │   │   ├── core/
│   │   │   │   ├── orchestrator.ts
│   │   │   │   ├── scheduler.ts
│   │   │   │   ├── context-engine.ts
│   │   │   │   └── evolution.ts
│   │   │   ├── agents/
│   │   │   │   ├── registry.ts
│   │   │   │   ├── personas/
│   │   │   │   │   ├── engineer.ts
│   │   │   │   │   ├── security.ts
│   │   │   │   │   ├── devops.ts
│   │   │   │   │   ├── data.ts
│   │   │   │   │   ├── eda.ts
│   │   │   │   │   ├── quantum.ts
│   │   │   │   │   ├── soc.ts
│   │   │   │   │   ├── threat-intel.ts
│   │   │   │   │   ├── zero-trust.ts
│   │   │   │   │   ├── test-engine.ts
│   │   │   │   │   ├── code-review.ts
│   │   │   │   │   ├── release-manager.ts
│   │   │   │   │   ├── api-designer.ts
│   │   │   │   │   └── architecture-visualizer.ts
│   │   │   │   └── runtime.ts
│   │   │   ├── models/
│   │   │   │   ├── router.ts
│   │   │   │   ├── providers.ts
│   │   │   │   └── adapters.ts
│   │   │   ├── memory/
│   │   │   │   ├── stores/
│   │   │   │   │   ├── session.ts
│   │   │   │   │   ├── project.ts
│   │   │   │   │   ├── agent.ts
│   │   │   │   │   ├── global.ts
│   │   │   │   │   └── episodic.ts
│   │   │   │   ├── retrieval.ts
│   │   │   │   └── index.ts
│   │   │   ├── tools/
│   │   │   │   ├── registry.ts
│   │   │   │   ├── coding/
│   │   │   │   ├── security/
│   │   │   │   ├── cloud/
│   │   │   │   ├── data/
│   │   │   │   ├── hardware/
│   │   │   │   ├── network/
│   │   │   │   └── documentation/
│   │   │   ├── security/
│   │   │   │   ├── kernel.ts
│   │   │   │   ├── capabilities.ts
│   │   │   │   ├── audit.ts
│   │   │   │   ├── sandbox.ts
│   │   │   │   └── kill-switch.ts
│   │   │   ├── verification/
│   │   │   │   ├── test-runner.ts
│   │   │   │   ├── quality-gates.ts
│   │   │   │   └── policy-checker.ts
│   │   │   ├── products/
│   │   │   │   ├── mapping.ts
│   │   │   │   ├── cloud-workspace.ts
│   │   │   │   ├── mobile-app.ts
│   │   │   │   ├── agent-studio.ts
│   │   │   │   ├── security-scanner.ts
│   │   │   │   ├── analytics-bi.ts
│   │   │   │   ├── devops-bridge.ts
│   │   │   │   ├── model-hub.ts
│   │   │   │   ├── data-pipeline.ts
│   │   │   │   ├── chip-design.ts
│   │   │   │   ├── soc-sentinel.ts
│   │   │   │   ├── threat-intel.ts
│   │   │   │   ├── zero-trust.ts
│   │   │   │   ├── test-engine.ts
│   │   │   │   ├── code-review.ts
│   │   │   │   ├── release-manager.ts
│   │   │   │   ├── perf-profiler.ts
│   │   │   │   ├── api-designer.ts
│   │   │   │   ├── arch-visualizer.ts
│   │   │   │   ├── migration-engine.ts
│   │   │   │   ├── docs-engine.ts
│   │   │   │   └── supply-chain-guardian.ts
│   │   │   └── tenant/
│   │   │       ├── organization.ts
│   │   │       ├── team.ts
│   │   │       ├── user.ts
│   │   │       └── billing.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── enterprise-app/         # Existing frontend
│
└── docs/
    └── HYDRA_MAIN_AI.md        # This document
```

---

## 4. Implementation Phases

### Phase 1 — Core Runtime (Weeks 1-4)

**Goal:** Build the foundational runtime that all products depend on.

| Module | Specification |
|---|---|
| `core/orchestrator` | Task lifecycle, agent dispatch, event bus, retry logic |
| `core/scheduler` | Priority queue, concurrency limits, resource budgets |
| `core/context-engine` | Project graph, dependency resolution, context assembly |
| `core/evolution` | Skill extraction, benchmarking, candidate promotion |

**Deliverable:** `hydra-main` package with working orchestrator + scheduler

---

### Phase 2 — Agent Personas (Weeks 5-8)

**Goal:** Build all 14 agent personas as TypeScript classes.

| Agent | System Prompt Focus | Tools | Memory Namespace |
|---|---|---|---|
| `engineer` | General software engineering | coding, testing, git, ci/cd | `engineer` |
| `security` | "Assume breach", least privilege | sast, dast, dependency, secret-scan | `security` |
| `devops` | Infrastructure as code, immutable infra | cloud, k8s, terraform, ci/cd | `devops` |
| `data` | Data quality, schema evolution | etl, dbt, airflow, analytics | `data` |
| `eda` | Hardware correctness, timing | verilog, synthesis, pnr, formal | `eda` |
| `quantum` | Quantum advantage, noise mitigation | qpu, circuit, vqe, qaoa | `quantum` |
| `soc` | Threat detection, incident response | siem, soar, dashboarding | `soc` |
| `threat-intel` | Threat hunting, exploit prediction | vuln-db, threat-feeds, remediation | `threat-intel` |
| `zero-trust` | Never trust, always verify | spiffe, spire, mtls, opa | `zero-trust` |
| `test-engine` | Coverage, flake detection, property-based | unit-test, integration, e2e, property | `test` |
| `code-review` | Readability, correctness, performance | lint, style, perf, security-lint | `review` |
| `release-manager` | Semver, changelog accuracy, rollback safety | versioning, changelog, rollback | `release` |
| `api-designer` | Contract-first, backward compatibility | openapi, asyncapi, sdk-gen | `api` |
| `architecture-visualizer` | Clarity, accuracy, impact analysis | diagrams, dep-graph, impact-analysis | `architecture` |

**Deliverable:** All 14 personas instantiable with `new EngineerPersona()`, etc.

---

### Phase 3 — Model Router & Memory (Weeks 9-12)

**Goal:** Unified model access and persistent memory.

| Module | Specification |
|---|---|
| `models/router` | Multi-provider abstraction, failover, cost-aware routing |
| `models/providers` | OpenAI, Anthropic, Ollama, Azure, GCP, AWS adapters |
| `memory/stores` | Session, project, agent, global, episodic stores |
| `memory/retrieval` | Semantic + keyword + temporal search |

**Deliverable:** Agents can remember across sessions and use optimal models per task

---

### Phase 4 — Security & Tool Layer (Weeks 13-16)

**Goal:** Capability-based security and unified tool registry.

| Module | Specification |
|---|---|
| `security/kernel` | Capability system, authz, risk analysis |
| `security/sandbox` | Dynamic sandbox creation, resource limits, network policy |
| `security/audit` | Action ledger, tamper-proof audit log |
| `tools/registry` | 40+ tools organized by domain |
| `tools/executor` | Tool execution with capability checks |

**Deliverable:** All agent actions are secured, audited, and sandboxed

---

### Phase 5 — Product Integration (Weeks 17-24)

**Goal:** Wire the main AI into `alp-server` routes.

| Product Route | Integration |
|---|---|
| `/api/platform` | Core AI runtime endpoints |
| `/api/agent-studio` | Persona builder, marketplace |
| `/api/cloud/workspaces` | Multi-tenant workspaces |
| `/api/security` | Security Scanner + SOC Sentinel |
| `/api/analytics-bi` | Analytics & BI |
| `/api/devops` | DevOps Bridge |
| `/api/data-pipeline` | Data Pipeline Studio |
| `/api/chip-design` | Chip Design Studio |
| `/api/quantum-engineer` | Quantum Engineering AI |
| `/api/threat-intel` | Threat Intelligence Engine |
| `/api/zero-trust` | Zero Trust Orchestrator |
| `/api/reasoning` | Test Engine, Code Review, Release Manager, etc. |

**Deliverable:** All 21 products powered by the main AI runtime

---

### Phase 6 — Multi-Tenancy & Billing (Weeks 25-28)

**Goal:** Organization, team, user management with usage-based billing.

| Module | Specification |
|---|---|
| `tenant/organization` | Org CRUD, members, roles |
| `tenant/team` | Team creation, project access |
| `tenant/user` | User profiles, preferences, API keys |
| `tenant/billing` | Usage tracking, invoicing, Stripe integration |

**Deliverable:** Production-ready multi-tenant SaaS

---

### Phase 7 — Observability & Scale (Weeks 29-32)

**Goal:** Production-grade monitoring and horizontal scaling.

| Module | Specification |
|---|---|
| Health checks | All components report health |
| Metrics | Prometheus-compatible metrics |
| Tracing | Distributed tracing across products |
| Scaling | Stateless API nodes, Redis cache, PostgreSQL |

**Deliverable:** Production-ready, horizontally scalable deployment

---

## 5. Key Technical Decisions

### Runtime
- **Language:** TypeScript (Node.js) — matches existing `commercial/alp-platform`
- **Transport:** REST + WebSocket (Socket.IO) — matches existing `commercial/alp-server`
- **Database:** PostgreSQL (primary) + Redis (cache/sessions) + MongoDB (existing)
- **Message Queue:** Redis Streams or RabbitMQ for async tasks

### Model Access
- Reuse existing `alp-platform/src/llm/orchestrator.ts`
- Add model router on top for persona-specific preferences
- Cache aggressively in Redis

### Agent Communication
- Agents communicate via memory + events (not direct API)
- Cross-product handoffs use ALP protocol objects
- WebSocket for real-time updates to products

### Safety
- Reuse existing `alp-platform/src/safety/evaluator.ts`
- Add capability enforcement per organization/team
- Human-in-the-loop for high-risk actions

---

## 6. Immediate Next Steps

1. **Create `commercial/hydra-main/` directory structure**
2. **Build `core/orchestrator.ts`** — the central task dispatcher
3. **Build `agents/registry.ts`** — persona registration and lookup
4. **Build `agents/personas/engineer.ts`** — first persona as template
5. **Create `products/mapping.ts`** — product-to-agent mapping
6. **Wire into `alp-server`** — add `/api/hydra` routes
