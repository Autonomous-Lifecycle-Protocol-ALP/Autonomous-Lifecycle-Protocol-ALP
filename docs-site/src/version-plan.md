# ALP Version Plan

**Current Release:** v43.0.0 — IDE Collaboration
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

## Versioning Policy

All versions follow Semantic Versioning (MAJOR.MINOR.PATCH):
- **MAJOR** — Breaking changes to syntax or semantics
- **MINOR** — New backwards-compatible features
- **PATCH** — Bug fixes, clarifications

See [spec/10-versioning.md](spec/10-versioning.md) for full versioning guarantees.