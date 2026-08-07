---
layout: home

hero:
  name: "ALP v80.0.0"
  text: "The Autonomous Lifecycle Protocol"
  tagline: "The open standard & high-performance execution engine for AI-driven software engineering. Write a machine-readable spec — let your agents plan, build, verify, and remember."
  image:
    src: /alp-logo.png
    alt: ALP Logo
  actions:
    - theme: brand
      text: Get Started
      link: '/guide/cli'
    - theme: alt
      text: View the Spec
      link: '/spec/01-overview'
    - theme: alt
      text: GitHub (v80.0.0)
      link: 'https://github.com/Autonomous-Lifecycle-Protocol-ALP/Autonomous-Lifecycle-Protocol-ALP'
      target: _blank

features:
  - title: Execution Engine (alp run)
    details: Topologically sorts your dependency graph in < 2ms, compiles precise context bundles, and orchestrates agents through the full lifecycle.
  - title: Swarm Marketplace (v80.0.0)
    details: Autonomous agent skill registration, category-based discovery, skill invocation, rating systems, and real-time cost tracking.
  - title: Pub/Sub Event Mesh (v80.0.0)
    details: Decoupled event mesh topic routing and message broadcasting across distributed autonomous swarm nodes.
  - title: Quality Gates (alp verify)
    details: "Tasks aren't 'done' until their verify scripts exit 0. Failures are marked [!] Blocked, halting the engine."
  - title: MCP Server Native
    details: Expose your project's live architecture to Claude Desktop, Cursor, and any MCP client with tools like alp_get_graph.
  - title: Schema-Validated & 100% Parity
    details: 49 JSON schemas registered with 1:1 TypeScript & Python SDK parity and 1013+ passing automated tests.
---

## Why ALP?

> **Git** standardized version control. **Docker** standardized environments. **OpenAPI** standardized APIs.
> **ALP** standardizes how AI builds software.

Today every AI coding assistant (Devin, Claude Code, Cursor, OpenHands) relies on unstructured
prompts and brittle context-scraping. They forget decisions, overwrite each other's work, and lose
track of dependencies. ALP replaces scattered `README.md`, `PRD.md`, `AGENTS.md`, and `TASKS.md`
files with **one deterministic protocol stored natively in your repository** (`.alp/`).

<div class="alp-stats">
  <div class="alp-stat"><span class="alp-stat-num">49</span><span class="alp-stat-label">JSON Schemas</span></div>
  <div class="alp-stat"><span class="alp-stat-num">80.0.0</span><span class="alp-stat-label">Toolchain Release</span></div>
  <div class="alp-stat"><span class="alp-stat-num">1013+</span><span class="alp-stat-label">Passed Tests</span></div>
  <div class="alp-stat"><span class="alp-stat-num">1:5</span><span class="alp-stat-label">Language SDK Parity</span></div>
</div>

---

## How it works

ALP turns your repository into a **deterministic, machine-readable project specification** that any AI agent can read, understand, and act on.

```mermaid
flowchart LR
    ALP[.alp/ Files] --> Parser[ALP Parser]
    Parser --> Graph[Dependency Graph]
    Graph --> Engine[Execution Engine]
    Engine --> Agent[AI Agent]
    Agent --> Task[Task Execution]
    Task --> Verify[Quality Gates]
    Verify --> State[Project State]
```

1. **Write** — Define your project in `.alp/` files using the ALP protocol
2. **Parse** — The parser builds a dependency graph and validates against 49 JSON schemas
3. **Execute** — The engine topologically sorts tasks and compiles context bundles in < 2ms
4. **Verify** — Quality gates ensure tasks aren't marked done until tests pass
5. **Remember** — Cross-session memory eliminates redundant context scraping

---

## Quick Example

Create a `.alp` file in your repository:

```alp
!alp-version: 80.0.0

@project
  id: my-project
  name: My Project
  version: 1.0.0
  state: active

@feature
  id: feat-auth
  name: Authentication
  description: OAuth2 + JWT authentication flow

@task
  id: task-login-ui
  name: Build login UI
  status: [ ]
  depends_on:
    - task-setup-db
  verify:
    - npm run test:login
    - npm run lint:login

@agent
  id: agent-frontend
  name: Frontend Specialist
  capabilities: [react, typescript, tailwind]
```

Then run:

```bash
# Validate your workspace
alp validate

# Execute the next available task
alp run

# Verify quality gates
alp verify task-login-ui
```

---

## How it works (detailed)

### 1. The Execution & Verification Cycle

ALP parses your workspace into a **Directed Acyclic Graph (DAG)**. Agents only receive the exact context they need, exactly when they need it.

```mermaid
graph TD
    subgraph Repository [Your Repository .alp/]
        D[Decision: Use PostgreSQL] --> T1[Task: Setup DB Schema]
        T1 --> T2[Task: Build REST API]
        R[Rule: No Raw SQL] --> T2
        C[Contract: @contract c-api] --> T2
    end

    subgraph ExecutionEngine [Execution Engine - alp run]
        T2 -->|Context Bundle - 1.8ms| Agent[Claude / Cursor Agent]
    end

    subgraph QualityGates [Quality Gates - alp verify]
        Agent -->|npm test| V{Tests Pass?}
        V -->|Exit 0| X[Mark x Done]
        V -->|Non-Zero| B[Mark ! Blocked]
    end
```

### 2. Autonomous Swarm Mesh & Skill Marketplace (v80.0.0)

```mermaid
flowchart LR
    subgraph SwarmNodes [Autonomous Swarm Nodes]
        A1[Agent Alpha\nCoder] <--> EM((Event Mesh\nPub/Sub))
        A2[Agent Beta\nReviewer] <--> EM
        A3[Agent Gamma\nTester] <--> EM
    end

    subgraph Marketplace [Swarm Marketplace]
        EM <--> SWM[Skill Registry\n@swarm_marketplace]
        SWM -->|Discover & Invoke| Cost[Cost & Metering Engine]
    end
```

---

## The ALP Ecosystem

<div class="alp-eco">
  <a class="alp-eco-card" href="/guide/cli"><h3>@autonomous-lifecycle-protocol-alp/cli</h3><p>Terminal CLI interface: <code>run</code>, <code>marketplace</code>, <code>event-mesh</code>, <code>policy</code>, <code>vault</code>, <code>verify</code>.</p></a>
  <a class="alp-eco-card" href="/spec/03-protocol-objects"><h3>@autonomous-lifecycle-protocol-alp/parser</h3><p>Parses <code>.alp</code> files and computes Kahn topological sorts over the dependency graph in sub-2ms.</p></a>
  <a class="alp-eco-card" href="/mcp-server"><h3>@autonomous-lifecycle-protocol-alp/mcp-server</h3><p>Real-time MCP integration for Claude Desktop, Cursor, and any compliant client.</p></a>
  <a class="alp-eco-card" href="/vscode-extension"><h3>alp-vscode</h3><p>Language Server with IntelliSense, go-to-definition, and rich hover metadata.</p></a>
  <a class="alp-eco-card" href="/guide/sdk"><h3>@autonomous-lifecycle-protocol-alp/sdk &amp; alp-sdk</h3><p>Official TypeScript and Python SDKs with complete 1:1 implementation parity.</p></a>
  <a class="alp-eco-card" href="/guide/sdk"><h3>alp-go / alp-rs / alp-java</h3><p>Official Go, Rust, and Java SDKs with core parsing, graph, and workspace APIs.</p></a>
  <a class="alp-eco-card" href="/spec/22-autonomous-marketplace"><h3>@swarm_marketplace</h3><p>Autonomous skill registry, provider discovery, invocation, and cost tracking (v38.0.0).</p></a>
  <a class="alp-eco-card" href="/sham"><h3>SHAM IDE (v80.0.0)</h3><p>The unified ALP desktop IDE (Mac/Windows/Linux). Faster, more secure, and error-free vs. fragmented multi-IDE setups. Native <code>@autonomous-lifecycle-protocol-alp/parser</code>, Monaco editor, agent manager, IDE Intelligence with AI suggestions/predictions/review, and Autonomous Orchestration with self-healing DAGs.</p></a>
</div>

---

## Getting Started in 60 Seconds

### Step 1: Install the CLI

```bash
npm install -g @autonomous-lifecycle-protocol-alp/cli
```

### Step 2: Initialize your workspace

```bash
alp init
```

This creates a `.alp/` directory with a starter `project.alp` file.

### Step 3: Define your first feature

Create `.alp/features.alp`:

```alp
!alp-version: 80.0.0

@feature
  id: feat-auth
  name: User Authentication
  description: OAuth2 + JWT authentication flow

@task
  id: task-login-ui
  name: Build login UI
  status: [ ]
  depends_on:
    - task-setup-db
  verify:
    - npm run test:login
    - npm run lint:login
```

### Step 4: Validate and execute

```bash
# Validate your workspace
alp validate

# Execute the next available task
alp run

# Verify quality gates
alp verify task-login-ui
```

---

### 1. Ecosystem Overview

<div class="alp-eco">
  <a class="alp-eco-card" href="/architecture"><h3>Architecture</h3><p>Deep dive into the ALP architecture, topology, and execution model.</p></a>
  <a class="alp-eco-card" href="/spec/01-overview"><h3>Specification</h3><p>Full technical protocol specification — syntax, objects, engines, memory model.</p></a>
  <a class="alp-eco-card" href="/guide/cli"><h3>CLI Guide</h3><p>Complete guide to the ALP CLI — initialization, validation, execution, and all commands.</p></a>
  <a class="alp-eco-card" href="/guide/sdk"><h3>SDKs</h3><p>TypeScript, Python, Go, Rust, and Java SDKs with full API reference.</p></a>
  <a class="alp-eco-card" href="/mcp-server"><h3>MCP Server</h3><p>Connect ALP to Claude Desktop, Cursor, and other MCP-compatible tools.</p></a>
  <a class="alp-eco-card" href="/vscode-extension"><h3>VS Code Extension</h3><p>IntelliSense, go-to-definition, and DAG visualization in VS Code.</p></a>
  <a class="alp-eco-card" href="/sham"><h3>SHAM IDE</h3><p>Cross-platform desktop IDE with Monaco editor, agent manager, and AI-powered suggestions.</p></a>
  <a class="alp-eco-card" href="/cli-tools"><h3>CLI Tools Reference</h3><p>Complete reference for all CLI commands, flags, and workflows.</p></a>
</div>

---

## Future Plans & Roadmap

Released versions are tracked in the [versioning spec](/spec/10-versioning.md). This section captures active and planned focus areas.

| Era | Versions | Focus |
|---|---|---|
| V8 — The Cognitive Era | 12.0.0–12.x | AI-native planning & reasoning: GoalDecomposer, Planner, Reflector, memory-augmented inference |
| V9 — The Collaborative Era | 13.0.0–13.x | Multi-agent negotiation, contracts-as-protocol, reputation & trust scoring, composable agent teams |
| V10 — The Verifiable Era | 14.0.0–14.x | End-to-end provenance, signed execution traces, zero-knowledge policy proofs, tamper-evident audit ledger |
| V11 — The Ambient Era | 15.0.0–15.x | Fully autonomous long-running swarms, safe self-modifying workflows, edge-native runtime, live upgrade & migration |
| V12 — The Sentinel Era | 16.0.0–16.x | Immutable execution traces, self-healing workflows, predictive governance, swarm resilience, cost optimization |
| V13 — The Universal Era | 17.0.0–17.x | Cross-protocol interoperability (OpenAPI, GraphQL, gRPC, AsyncAPI), universal adapters, bidirectional sync |

### Current Release

**V9 — Native Desktop (v80.0.0)** — SHAM IDE cross-platform release with native ALP integration, Monaco editor, agent manager, auto-updater, and Pro/Enterprise licensing.

**V10 — The Intelligence Era (v80.0.0)** — Autonomous multi-agent orchestration with self-healing DAGs, predictive governance, edge-native execution, and AI-native lifecycle management.


