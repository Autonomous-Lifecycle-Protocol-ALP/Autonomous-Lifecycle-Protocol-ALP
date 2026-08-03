# ADR-004: Parser God Module — Domain Engine Extraction Strategy

## Status
Accepted — 2026-08-03

## Context
`parser/src/index.ts` is the central barrel file for the ALP parser package.
It re-exports from 90+ domain engine modules:

```
parser/src/index.ts  →  export * from './policy'
                        export * from './vault'
                        export * from './swarm-marketplace'
                        ... (90+ modules)
```

This pattern creates a "god module" where:
- Any change to any ALP concept requires touching the parser package.
- The parser is the release bottleneck for all protocol evolution.
- Consumer packages (CLI, MCP server, SHAM, VS Code) import the entire
  parser surface even when they only need a subset of engines.
- The file is 114 lines of pure re-exports with no encapsulation or
  versioning boundaries between engines.

## Decision
Do NOT split the parser package into sub-packages at this time. Maintain the
single barrel file but add internal documentation boundaries and enforce
engine-level test coverage.

Rationale for deferring split:
- Splitting 90+ engines into separate packages would require coordinating
  ~100 package.json changes, import path updates across 8+ workspaces, and
  a major-version bump.
- The current coupling is already explicit via the `*` workspace
  dependency; splitting would not reduce coupling, only relocate it.
- The single-package model simplifies local development: one `tsc` build
  produces the full parser surface.

## Future Direction
When the number of engines exceeds ~150 or when independent release cycles
are needed for engine subsets, introduce:
1. A `@autonomous-lifecycle-protocol-alp/parser-core` package (reader,
   validator, graph, loop — stable, rarely changes).
2. Engine sub-packages grouped by domain (e.g. `parser-governance`,
   `parser-intelligence`, `parser-resilience`) with their own version
   cycles.
3. A thin `@autonomous-lifecycle-protocol-alp/parser` facade that
   re-exports all sub-packages for backward compatibility.

## Consequences
- `parser/src/index.ts` remains the single entry point.
- Each engine module must have its own test file (`*.test.ts`) to enable
  independent review without loading the full barrel.
- New engines added after this ADR must include their test file in the same
  commit.

## Related
- File: `parser/src/index.ts`
- File: `parser/package.json`
