# ALP Version Plan

**Current Release:** v40.0.0 — Native Desktop & SHAM IDE
**Date:** 2026-07-29

---

## Next Versions

### v41.0.0 — IDE Productivity
**Target:** Q3 2026
**Codename:** IDE Productivity

**Key Deliverables:**
- Native settings panel with theme/language/agent configuration
- Command palette (Ctrl+Shift+P) for rapid command dispatch
- Global workspace search with regex and file-type filters
- Built-in git status, diff, and commit panel
- Snippet manager with ALP block templates
- Customizable keyboard shortcuts
- Workspace trust and file exclusion rules

**Packages Affected:**
- `@autonomous-lifecycle-protocol-alp/cli` — new `alp settings`, `alp search`, `alp git` commands
- `@autonomous-lifecycle-protocol-alp/parser` — settings schema, snippet schema
- `@autonomous-lifecycle-protocol-alp/sdk` — settings API, search API
- `@autonomous-lifecycle-protocol-alp/mcp-server` — new tools for settings and search

---

### v42.0.0 — IDE Quality
**Target:** Q4 2026
**Codename:** IDE Quality

**Key Deliverables:**
- Visual debugger with breakpoint management and step-through execution
- Built-in test runner with pass/fail UI and coverage reporting
- Integrated linter and formatter for `.alp` specs
- Code actions and quick-fix lightbulb menu
- Dependency graph viewer for `@contract` and `@macro` relationships
- Schema validation badges in editor gutter

**Packages Affected:**
- `@autonomous-lifecycle-protocol-alp/cli` — new `alp test`, `alp lint`, `alp format` commands
- `@autonomous-lifecycle-protocol-alp/parser` — test runner integration, lint rules engine
- `@autonomous-lifecycle-protocol-alp/sdk` — test runner API, lint API, formatter API
- `@autonomous-lifecycle-protocol-alp/mcp-server` — new tools for test runner and linter

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