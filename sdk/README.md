# ALP SDK

Official SDK packages for integrating ALP into applications. Both the
TypeScript (`@autonomous-lifecycle-protocol-alp/sdk`) and Python (`alp-sdk`) SDKs are shipped and maintained
in parity through the IDE Intelligence Era (V11, toolchain `45.0.0`).

## SDKs

| Language | Package | Status |
|---|---|---|
| TypeScript | `@autonomous-lifecycle-protocol-alp/sdk` | ✅ Stable (parser ships `@autonomous-lifecycle-protocol-alp/parser`; the `@autonomous-lifecycle-protocol-alp/sdk` umbrella re-exports the engine) |
| Python | `alp-sdk` | ✅ Stable (`pip install alp-sdk`) |
| Go | `alp-go` | ✅ Stable (`go get github.com/Autonomous-Lifecycle-Protocol-ALP/Autonomous-Lifecycle-Protocol-ALP/sdk/go@v0.45.0`) |
| Rust | `alp-rs` | ✅ Stable (crate `alp-sdk` on crates.io) |
| Java | `alp-java` | ✅ Stable (`com.alp:alp-sdk-java:45.0.0`) |

## What an SDK Provides

- Parse `.alp` files into typed objects
- Validate objects against JSON Schemas
- Build and traverse the dependency graph
- Policy, scheduling, contract, and vault engines (v8)
- Serialize objects back to `.alp` format
- Export to YAML/JSON
