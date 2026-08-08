---
title: ALP Agent Studio
---

# ALP Agent Studio

Low-code platform for building ALP agents with visual DAG design, a capability marketplace, model routing, and A/B testing.

## Pricing

| Plan | Price | Includes |
|---|---|---|
| Pro | $99 / mo | Visual designer, sandbox, 10 agents |
| Enterprise | Custom | Unlimited agents, SSO, private marketplace, SLA |

## Feature Deep-Dive

### Visual DAG Designer
Drag-and-drop interface for composing `@task`, `@workflow`, and `@swarm` blocks. Real-time validation highlights cycles, missing contracts, and policy violations.

### Capability Marketplace
Publish and discover reusable agent skills. Each skill is versioned, tested, and metered. Invoke skills across projects without copy-pasting code.

### Model Routing Configuration
Route agent steps to GPT-4o, Claude Sonnet, Llama 3, or local GGUF models based on cost, latency, or capability requirements. Fallback chains handle provider outages.

### Testing Sandbox
Spin up isolated execution environments for agents. Inject faults, replay event logs, and measure reproducibility before production deployment.

### A/B Testing
Compare two agent personas or model routes on the same workload. Statistical significance testing is built into the analytics pipeline.

## Use Cases

- **Product teams** prototype agent flows without hand-coding DAGs.
- **Platform teams** curate an internal capability marketplace.
- **ML teams** compare model providers on real ALP workloads.

## Integration

Integrates with `@agent`, `@swarm_marketplace`, `@policy`, and `@contract`. Agent Studio exports standard `.alp` files compatible with the CLI, MCP server, and SHAM IDE.

## Quickstart

1. Open [studio.alp.cloud](https://studio.alp.cloud) and sign in.
2. Create a new agent project or import an existing `.alp` file.
3. Drag tasks onto the canvas and connect them with data edges.
4. Run a sandbox test: `Studio.run(agentId, { input: testCase })`
5. Publish to the marketplace or export to your CI pipeline.
