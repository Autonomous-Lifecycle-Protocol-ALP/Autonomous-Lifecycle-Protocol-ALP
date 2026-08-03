# ADR-002: Monorepo Version Alignment

## Status
Accepted — 2026-08-03

## Context
The ALP monorepo had significant version drift across workspaces:

| Package | Previous Version |
|---|---|
| `@autonomous-lifecycle-protocol-alp/schemas` | 45.0.0 |
| `@autonomous-lifecycle-protocol-alp/parser` | 80.0.0 |
| `@autonomous-lifecycle-protocol-alp/cli` | 80.0.0 |
| `@autonomous-lifecycle-protocol-alp/sdk` (TS) | 45.0.0 |
| `@autonomous-lifecycle-protocol-alp/mcp-server` | 45.0.0 |
| `alp-docs` | 45.0.0 |
| `sham` | 81.0.0 |
| `alp-monorepo` (root) | 80.0.0 |

Drift consequences:
- Published npm package versions did not reflect the actual code state.
- `npm pack` and GitHub Packages releases could produce artifacts with
  mismatched version numbers.
- Consumers pinning `@autonomous-lifecycle-protocol-alp/parser@80.0.0`
  would get schemas from `@autonomous-lifecycle-protocol-alp/schemas@45.0.0`
  via workspace linking, but published artifacts would be inconsistent.
- The `*` version range in workspace dependencies masked drift during local
  development but did not prevent it from reaching published artifacts.

## Decision
Align all workspace package versions to `80.0.0` in lockstep. Future
versions must be bumped atomically across all workspaces in a single commit.

## Rationale
- ALP packages are version-coupled: parser 80.0.0 depends on schemas 80.0.0,
  cli 80.0.0 depends on parser 80.0.0, etc. Independent versioning provides
  no benefit and creates confusion.
- Atomic version bumps are standard practice for tightly-coupled monorepos.
- Eliminates a class of "works on my machine" bugs caused by version skew
  between local workspace links and published artifacts.

## Consequences
- All 7 packages now publish at version `80.0.0`.
- A single `npm version` bump (or manual edit) in a release commit updates
  all packages.
- Future CI/CD release workflows should use a single source of truth for
  the version number (e.g. `npm run version --workspaces`).

## Related
- Fix: `schemas/package.json`, `sdk/typescript/package.json`,
  `mcp-server/package.json`, `docs-site/package.json`, `sham/package.json`.
