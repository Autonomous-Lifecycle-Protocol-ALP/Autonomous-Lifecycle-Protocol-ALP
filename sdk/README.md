# ALP SDK

Official SDK packages for integrating ALP into applications. Both the
TypeScript (`@autonomous-lifecycle-protocol-alp/sdk`) and Python (`alp-sdk`) SDKs are shipped and maintained
in parity through the IDE Intelligence Era (V11, toolchain `44.0.0`).

## SDKs

| Language | Package | Status |
|---|---|---|
| TypeScript | `@autonomous-lifecycle-protocol-alp/sdk` | ✅ Stable (parser ships `@autonomous-lifecycle-protocol-alp/parser`; the `@autonomous-lifecycle-protocol-alp/sdk` umbrella re-exports the engine) |
| Python | `alp-sdk` | ✅ Stable (`pip install alp-sdk`) |
| Go | `alp-go` | 🔜 Community |
| Rust | `alp-rs` | 🔜 Community |
| Java | `alp-java` | 🔜 Community |

## What an SDK Provides

- Parse `.alp` files into typed objects
- Validate objects against JSON Schemas
- Build and traverse the dependency graph
- Policy, scheduling, contract, and vault engines (v8)
- Serialize objects back to `.alp` format
- Export to YAML/JSON
