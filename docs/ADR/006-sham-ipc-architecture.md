# ADR-006: SHAM IDE IPC Architecture — Library Import vs CLI Spawn

## Status
Accepted — 2026-08-03

## Context
`sham/src/main/alp-bridge.ts` uses two patterns to invoke ALP functionality:
1. `child_process.exec('alp <command>')` — shells out to the CLI for
   collab, crdt-sync, plugins, and other advanced features.
2. `await import('@autonomous-lifecycle-protocol-alp/parser')` — dynamic
   import for parse/validate operations.

The CLI spawn pattern has significant drawbacks:
- Requires `alp` to be installed and on PATH at runtime.
- Creates a new Node.js process per invocation (high overhead).
- Serialization/deserialization of data through JSON stdin/stdout.
- Error handling must parse CLI stderr rather than catching exceptions.
- Does not work when SHAM is packaged as a standalone Electron app (no
  global `alp` binary).

## Decision
Migrate all `alp-bridge.ts` CLI spawns to direct parser library imports
over the next 3 releases. The parser is already a dependency of `sham` in
`package.json`; the only missing piece is implementing the corresponding
engine calls in TypeScript within the bridge.

Priority order:
1. `collab` → use `CollabEngine` from parser directly.
2. `crdt-sync` → use `CRDTSyncEngine` from parser directly.
3. `plugin` → use `PluginEngine` from parser directly.
4. Remaining commands → use the parser engine corresponding to each command.

## Rationale
- In-process library calls are 10–100x faster than process spawning.
- Error handling is native TypeScript try/catch, not CLI exit codes.
- SHAM becomes truly standalone: no `alp` binary dependency.
- Debugging is simpler with stack traces from the same process.

## Implementation Notes (2026-08-03)
Migrated `collab-start`, `collab-join`, `collab-status`, `collab-leave`,
`crdt-status`, and `crdt-merge` IPC handlers from `child_process.exec`
to direct `CollaborationEngine` / `CRDTSyncEngine` method calls.

- Module-level singleton engines (`collabEngine`, `crdtEngine`) preserve
  state across IPC calls.
- Handlers now return structured `{ success, data }` objects instead of
  raw CLI `stdout`/`stderr` strings.
- `terminal-exec` handler retains `execAsync` for legitimate shell access.
- SHAM no longer requires `alp` on PATH for collab/CRDT features.
- File: `sham/src/main/alp-bridge.ts` lines 52, 162–257.
