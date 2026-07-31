# ALP MCP Server

The official Model Context Protocol (MCP) server for the Autonomous Lifecycle Protocol.

This server enables modern AI IDEs (Claude Desktop, Cursor, Windsurf, etc.) to securely connect to your local ALP workspace and interact with your `.alp` graph via standardized tools.

## Installation

```bash
cd mcp-server
npm install
npm run build
npm start
```

## Available Tools

Once connected via MCP, the server exposes the following tools to the LLM agent:

### Workspace & Graph

- **`alp_list_objects`**: List all ALP objects, optionally filtered by type.
- **`alp_read_object`**: Read a specific ALP object by ID.
- **`alp_get_graph`**: Full dependency graph as sorted execution order.
- **`alp_get_status`**: Project status summary with task counts by state.
- **`alp_get_impact`**: Downstream nodes affected by a change.

### Search & Mutation

- **`alp_search`**: Fuzzy search across IDs and descriptions.
- **`alp_validate`**: Validate workspace syntax/schemas.
- **`alp_update_status`**: Update task/feature status.
- **`alp_set_status`**: Alias-style status update by object ID.
- **`alp_delegate`**: Create a sub-task assigned to a role/agent.
- **`alp_decompose`**: Split a task into sub-tasks blocked by the parent.
- **`alp_create_task`**: Scaffold a new task `.alp` file.
- **`alp_create_feature`**: Scaffold a new feature `.alp` file.

### Events & Analytics

- **`alp_get_events`**: Read recent runtime events with filtering.
- **`alp_get_analytics`**: Analytics summary from state store or event log.

### Governance & Registry

- **`alp_check_policy`**: Check path/command against `@policy` guardrails.
- **`alp_visualize`**: Render `@workflow` objects as Mermaid/JSON diagrams.
- **`alp_search_registry`**: Search/list installed registry packages.
- **`alp_get_timelines`**: List/evaluate `@timeline` schedules.

### Contracts & Vaults

- **`alp_get_contracts`**: List all `@contract` objects and their allow/deny rules.
- **`alp_get_vaults`**: List all `@vault` objects and their recipient/algorithm metadata.

### Swarm Marketplace & Event Mesh (v38.0.0)

- **`alp_get_swarm_marketplace`**: List registered skills from `@swarm_marketplace` objects, optionally filtered by category.
- **`alp_get_event_mesh`**: List event mesh topics and recent events from `@event_mesh` objects.

### Macro Expansion (v37.0.0)

- **`alp_get_macros`**: List all `@macro` definitions in the workspace.
- **`alp_expand_macro`**: Expand a `@macro` definition by ID and return the generated objects.

### Memory Mesh (v38.0.0)

- **`alp_memory_store`**: Store a memory node in the workspace memory mesh.
- **`alp_memory_query`**: Query the memory mesh for relevant memories by keyword, agent, or tag.
- **`alp_memory_stats`**: Return memory mesh statistics (node count, decay scores, top tags).

### IDE Intelligence (v45.0.0)

- **`alp_intelligence_suggest`**: Get AI-powered suggestions for next ALP objects based on workspace gaps.
- **`alp_intelligence_diagnose`**: Diagnose errors with likely causes and fix suggestions.
- **`alp_intelligence_predict`**: Predict task outcomes based on dependency state and risk factors.
- **`alp_intelligence_review`**: Automated code review findings for `.alp` specs.

### Autonomous Orchestration (v45.0.0)

- **`alp_autonomy_run`**: Start an autonomous swarm run for a workflow.
- **`alp_autonomy_heal`**: Run self-healing diagnostics and auto-patch ALP workspace.
- **`alp_autonomy_predict`**: Predict outcome of a workflow based on current state.

### Policy governance

Mutating tools (`alp_update_status`, `alp_delegate`, `alp_decompose`) are
subject to `@policy` guardrails. If a strict policy denies the target path,
the tool returns an error and performs no write. Every successful mutation is
recorded to `.alp/.runtime/log.jsonl` (audit trail), visible live in
`alp serve`. Pass an optional `agent` argument so per-agent `applies_to`
policies are scoped correctly.

In addition, the server exposes the workspace `.alp` files as MCP **resources** (`file://` URIs) so a client can read raw object files directly.

## SDKs

The ALP toolchain includes official SDKs for multiple languages:

- **TypeScript**: `@autonomous-lifecycle-protocol-alp/sdk`
- **Python**: `alp-sdk`
- **Go**: `alp-go`
- **Rust**: `alp-rs`
- **Java**: `alp-java`

All SDKs expose core parsing, graph, and workspace APIs. See `sdk/README.md` for installation instructions.

## Usage with Claude Desktop

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "alp": {
      "command": "node",
      "args": [
        "/absolute/path/to/alp-monorepo/mcp-server/dist/index.js"
      ]
    }
  }
}
```
