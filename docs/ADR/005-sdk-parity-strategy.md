# ADR-005: Multi-Language SDK Parity Strategy

## Status
Accepted — 2026-08-03

## Context
ALP maintains SDKs in 5 languages:
- TypeScript (`sdk/typescript/`) — thin wrapper around parser
- Python (`sdk/python/`) — full reimplementation (~100 modules)
- Go (`sdk/go/`) — partial implementation
- Rust (`sdk/rust/`) — scaffolded
- Java (`sdk/java/`) — scaffolded

The project claims "1:1 parity" across SDKs, but this is unsustainable:
- Each new protocol feature must be implemented 5 times.
- Bug fixes must be ported across language boundaries.
- Test suites must be maintained per language.
- CI time scales linearly with SDK count.

## Decision
Accept that full 1:1 parity is a non-goal. Prioritize parity in this order:
1. **TypeScript SDK** — always 100% parity (it wraps the parser directly).
2. **Python SDK** — target 80% parity for the most-used engines (validate,
   graph, policy, vault, run). Lower-priority engines may lag.
3. **Go / Rust / Java SDKs** — target 50% parity covering the stable core
   (reader, validator, graph). Advanced engines (swarm, crdt, intelligence)
   are deferred until there is demonstrated demand.

## Rationale
- The TypeScript parser is the reference implementation. All other SDKs
  should wrap or transpile from it, not independently reimplement it.
- Python is the second most-used language in the ALP ecosystem and justifies
  near-full parity.
- Go, Rust, and Java SDKs serve niche use cases (embedded, WASM, enterprise
  JVM shops). A smaller, stable surface is more valuable than a large,
  incomplete one.
- Future approach: consider OpenAPI/AsyncAPI code generation from the
  protocol spec (see `spec/`) to auto-generate SDK stubs, reducing manual
  maintenance.

## Consequences
- The Python SDK `engine.py` and `graph_engine.py` are retained as the
  primary Python entry points.
- Go/Rust/Java SDKs document their parity level in `README.md` so consumers
  know what to expect.
- New protocol features must be documented with a parity target per SDK.

## Related
- `sdk/python/`
- `sdk/go/`
- `sdk/rust/`
- `sdk/java/`
- `sdk/typescript/`
