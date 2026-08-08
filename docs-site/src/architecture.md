# System Architecture & Visual Topology

This section provides a deep technical breakdown of the Autonomous Lifecycle Protocol (ALP) runtime architecture, topological dependency engine, distributed event mesh, and security governance layers.

---

## 1. The Topological Execution Loop

ALP parses repository definitions (`.alp/`) into a Directed Acyclic Graph (DAG) using Kahn's algorithm for topological sorting. Agents receive precise context bundles compiled in real-time (< 2ms).

```mermaid
sequenceDiagram
    autonumber
    actor Developer as Developer / CI Script
    participant CLI as alp CLI (run)
    participant Parser as ALP Parser & AST Engine
    participant Graph as Topological DAG Engine
    participant Agent as AI Coding Agent (Cursor/Claude/Devin)
    participant Gate as Verification Gate (alp verify)

    Developer->>CLI: Run `alp run --provider openai`
    CLI->>Parser: Scan & Parse `.alp/` workspace
    Parser->>Graph: Validate against 49 JSON Schemas & build DAG
    Graph-->>CLI: Return topologically sorted context bundle (1.8ms)
    CLI->>Agent: Stream Context Bundle + System Prompt
    Agent->>Agent: Execute code mutation / task completion
    Agent->>Gate: Trigger Quality Gate script
    alt Verification Exit 0 (Success)
        Gate-->>CLI: Passed! Mark [x] Done
        CLI-->>Developer: Task Completed Successfully
    else Verification Exit Non-Zero (Failure)
        Gate-->>CLI: Failed! Mark [!] Blocked
        CLI-->>Developer: Execution Halted (Fail-Closed Gate)
    end
```

---

## 2. Autonomous Swarm & Pub/Sub Event Mesh Topology

Distributed agent nodes coordinate asynchronously over a decoupled Pub/Sub Event Mesh. Topics handle telemetry, task claim broadcasts, and real-time skill marketplace invocations.

```mermaid
flowchart TB
    subgraph SwarmNodes ["Autonomous Agent Swarm Nodes"]
        A1["Agent Alpha\n(Frontend Specialist)"]
        A2["Agent Beta\n(Backend Coder)"]
        A3["Agent Gamma\n(Security Auditor)"]
    end

    subgraph EventMesh ["Pub/Sub Event Mesh Engine"]
        T1["Topic: telemetry.logs"]
        T2["Topic: task.claims"]
        T3["Topic: marketplace.skills"]
    end

    subgraph Marketplace ["Swarm Marketplace & Cost Metering"]
        Registry["Skill Registry (@swarm_marketplace)"]
        Meter["Cost Metering Engine"]
    end

    A1 -->|Publish Claim| T2
    A2 -->|Subscribe Claim| T2
    A3 -->|Publish Audit Log| T1
    A1 -->|Invoke Skill| T3
    T3 <--> Registry
    Registry <--> Meter
```

---

## 3. Governance, Vault, & Policy Boundary Layer

Security and governance policies are checked deterministically before any file system write or system action is permitted.

```mermaid
flowchart LR
    Agent["AI Agent Request"] --> CheckPolicy{"Check @policy Rules"}
    CheckPolicy -->|Time Window / Path Allowed| UnsealVault{"Check Secret Needed"}
    CheckPolicy -->|Path Denied / Out of Window| Reject["Reject (Exit 1)"]
    
    UnsealVault -->|Requires Key| Decrypt["Unseal X25519 Envelope"]
    UnsealVault -->|No Secret Needed| Direct["Execute Command"]
    
    Decrypt --> CheckContract{"Check @contract Boundary"}
    Direct --> CheckContract
    
    CheckContract -->|Within API Boundary| Execute["Permitted Execution"]
    CheckContract -->|Boundary Violation| BlockContract["Contract Violation"]
```

---

## System Module Map

```mermaid
mindmap
  root((ALP Engine))
    Parser Core
      AST Lexer
      JSON Schema Validator
      Kahn Topological Sort
    Runtime CLI
      Execution Engine (alp run)
      Quality Gates (alp verify)
      Terminal Dashboard (alp tui)
    Ecosystem Protocols
      Event Mesh Pub/Sub
      Swarm Skill Marketplace
      Encrypted Vault (@vault)
      UTC Policy Engine (@policy)
    Multi-Language SDKs
      TypeScript (@autonomous-lifecycle-protocol-alp/sdk)
      Python (alp-sdk)
      Go (alp-go)
      Rust (alp-rs)
      Java (alp-java)
```
