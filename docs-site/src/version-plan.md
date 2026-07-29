# ALP Version Plan

**Current Release:** v44.0.0 — IDE Intelligence
**Date:** 2026-07-29

---

## Next Versions

### v42.0.0 — IDE Quality
**Target:** Q4 2026
**Codename:** IDE Quality

**Key Deliverables:**
- Built-in test runner with pass/fail UI and coverage reporting
- Integrated linter with extensible rule engine for `.alp` specs
- Code formatter for consistent `.alp` file indentation and style
- Enhanced `alp lint` with rule-based diagnostics
- New `alp test` command with coverage reporting
- New `alp format` command for workspace formatting
- MCP tools: `alp_test`, `alp_lint`, `alp_format`

**Packages Affected:**
- `@autonomous-lifecycle-protocol-alp/cli` — new `alp test`, `alp format`, enhanced `alp lint` commands
- `@autonomous-lifecycle-protocol-alp/parser` — test runner, linter, formatter modules
- `@autonomous-lifecycle-protocol-alp/sdk` — test runner API, lint API, formatter API
- `@autonomous-lifecycle-protocol-alp/mcp-server` — new tools for test runner, linter, and formatter

---

### v43.0.0 — IDE Collaboration
**Target:** Q1 2027
**Codename:** IDE Collaboration

**Key Deliverables:**
- Shared workspace sessions with real-time presence and cursor tracking
- Inline comments and code review threads on `.alp` specs
- Activity feed showing agent runs, policy decisions, and team edits
- Team permission controls (view/edit/admin)
- Live share sessions for synchronous co-authoring
- Audit log for compliance and rollback

**Packages Affected:**
- `@autonomous-lifecycle-protocol-alp/cli` — new `alp share`, `alp collab` commands
- `@autonomous-lifecycle-protocol-alp/parser` — collaboration objects, audit log schema
- `@autonomous-lifecycle-protocol-alp/sdk` — collaboration API, audit log API
- `@autonomous-lifecycle-protocol-alp/mcp-server` — new tools for collaboration and audit

---

### v44.0.0 — IDE Intelligence
**Target:** Q2 2027
**Codename:** IDE Intelligence

**Key Deliverables:**
- AI-powered suggestions for next ALP objects based on workspace gaps
- Intelligent error diagnosis with likely causes and fix suggestions
- Predictive outcome scoring for tasks based on dependency state
- Automated code review findings for `.alp` specs
- MCP tools: `alp_intelligence_suggest`, `alp_intelligence_diagnose`, `alp_intelligence_predict`, `alp_intelligence_review`

**Packages Affected:**
- `@autonomous-lifecycle-protocol-alp/cli` — new `alp intelligence` command group
- `@autonomous-lifecycle-protocol-alp/parser` — `IntelligenceEngine`, `SmartSuggestion`, `DiagnosisResult`, `PredictionResult`, `ReviewFinding`
- `@autonomous-lifecycle-protocol-alp/sdk` — intelligence API re-exports
- `@autonomous-lifecycle-protocol-alp/mcp-server` — 4 new intelligence tools

---

### v45.0.0 — Autonomous Orchestration
**Released:** 2026-07-29
**Codename:** Autonomous Orchestration

**Key Deliverables:**
- Fully autonomous multi-agent workflows with self-healing DAGs
- Predictive governance with anomaly detection and auto-policy tuning
- Edge-native execution with CRDT-based state synchronization
- AI-native lifecycle hooks and self-modifying workflows
- MCP tools: `alp_autonomy_run`, `alp_autonomy_heal`, `alp_autonomy_predict`

**Packages Affected:**
- `@autonomous-lifecycle-protocol-alp/cli` — new `alp autonomy` command group
- `@autonomous-lifecycle-protocol-alp/parser` — `AutonomyController`, `SelfHealingEngine`, `EdgeRuntime`
- `@autonomous-lifecycle-protocol-alp/sdk` — autonomy API re-exports
- `@autonomous-lifecycle-protocol-alp/mcp-server` — new autonomy tools

---

## Versioning Policy

All versions follow Semantic Versioning (MAJOR.MINOR.PATCH):
- **MAJOR** — Breaking changes to syntax or semantics
- **MINOR** — New backwards-compatible features
- **PATCH** — Bug fixes, clarifications

See [spec/10-versioning.md](spec/10-versioning.md) for full versioning guarantees.