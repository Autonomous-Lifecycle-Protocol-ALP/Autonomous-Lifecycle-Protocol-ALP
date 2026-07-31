# ALP CLI

The `alp` command-line interface for working with ALP projects. The CLI is
implemented in TypeScript (`@autonomous-lifecycle-protocol-alp/cli`) and is the primary way to drive the
Autonomous Lifecycle Protocol.

## Commands

| Command | Description |
| --- | --- |
| `alp init` | Initialize a new ALP project in the current directory |
| `alp validate` | Validate all `.alp` files against schemas |
| `alp lint` | Check for style and convention issues |
| `alp test` | Run ALP tests with pass/fail reporting and optional coverage |
| `alp format` | Format `.alp` files for consistent style |
| `alp graph` | Visualize the project dependency graph |
| `alp status` | Show project state and progress |
| `alp verify` | Run verification gates on completed tasks |
| `alp run` | Execute a workflow (V3 swarm mode with `--concurrent`) |
| `alp checkpoint` | Interactive / human-in-the-loop handoffs (`--ask-human`) |
| `alp doctor` | Diagnose issues in the ALP project |
| `alp upgrade` | Upgrade ALP files to the latest spec version |
| `alp export` | Export to YAML/JSON format |
| `alp policy` | List / evaluate `@policy` guardrails; v8.1.0 adds `--proposal` / `--trust` for signed proposals |
| `alp schedule` | List / evaluate `@timeline` schedules (v8.2.0) |
| `alp vault` | Encrypted secrets store (v10.0.0): `set` / `get` / `list` / `rotate` / `audit` |
| `alp serve` | Live state server + hosted registry (V4) |
| `alp swarm` | Networked swarm membership (V4) |
| `alp repo` | Cross-repository orchestration (V4) |
| `alp evolve` | Self-evolving protocol proposals (V3) |
| `alp registry` | Package registry & marketplace (V4); `keys` for signing & trust roots |
| `alp keys` | Manage package-signing Ed25519 keypairs & trust roots (V4.2.0) |
| `alp intelligence` | IDE Intelligence: `suggest`, `diagnose`, `predict`, `review` (v45.0.0) |
| `alp collab` | IDE Collaboration: comments, threads, permissions, live share (v43.0.0) |
| `alp memory-mesh` | Cross-agent semantic memory sharing (v38.0.0) |
| `alp event-mesh` | Pub/sub event routing across swarm nodes (v35.0.0) |
| `alp marketplace` | Swarm skill registry and invocation (v36.0.0) |
| `alp macro` | Macro expansion and template rendering (v37.0.0) |

## Examples

```bash
alp validate                       # schema-check the workspace
alp run --concurrent 3             # run up to 3 agents in parallel (V3)
alp policy --path "src/auth/login.ts"
alp policy --proposal prop-1 --trust maintainer.pub
alp schedule next                  # show timelines due now (v8.2.0)
alp vault get db-password --key maintainer.key   # (v10.0.0)
alp intelligence suggest           # get next-step suggestions (v45.0.0)
alp intelligence diagnose "cycle"  # diagnose dependency cycles (v45.0.0)
alp collab share start             # start a live share session (v43.0.0)
alp memory-mesh query "context"    # query cross-agent memory (v38.0.0)
```

## Technology Stack

- **Runtime:** Node.js
- **Framework:** Commander.js
- **Validation:** Ajv (JSON Schema)
- **Testing:** Vitest

## Status

✅ **Stable** — IDE Intelligence Era (V11), toolchain `45.0.0`. The `@autonomous-lifecycle-protocol-alp/cli`
package is not yet published to npm; build from source with
`npm ci && npm run build --workspace @autonomous-lifecycle-protocol-alp/cli` and invoke it via
`node cli/dist/index.js`.
