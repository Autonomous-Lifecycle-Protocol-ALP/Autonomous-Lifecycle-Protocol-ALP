# Model Context Protocol (MCP) Server

ALP natively supports Anthropic's **Model Context Protocol**, allowing modern AI IDEs (like Claude Desktop, Cursor, and Windsurf) to securely query your `.alp` workspace and understand your architecture in real time.

## Installation

The MCP server is provided via the `@alp/mcp-server` package.

```bash
npm install -g @alp/mcp-server
```

## Available Tools

Once connected, your IDE gains access to the following tools:

### Core Tools

| Tool | Description |
| :--- | :--- |
| `alp_list_objects` | List all objects, optionally filtered by type (e.g., `task`, `agent`, `memory`) |
| `alp_read_object` | Read a specific ALP object by its ID to get detailed instructions, rules, or memory |
| `alp_get_graph` | Get the full dependency graph of the ALP workspace as a sorted execution order |
| `alp_get_status` | Get the current project status (task counts by state: `[x]`, `[~]`, `[ ]`, `[!]`, `[?]`) |
| `alp_validate` | Validate the ALP workspace to ensure the agent hasn't introduced syntax errors |
| `alp_update_status` | Update the status of a task (supports the `[?]` review marker for HITL handoffs) |
| `alp_get_impact` | Get all downstream nodes affected by a change to a given node |
| `alp_search` | Fuzzy search across all object IDs and descriptions |
| `alp_delegate` | Create a new task assigned to a specific role/agent |
| `alp_decompose` | Split a large task into sub-tasks blocked by the parent |
| `alp_create_task` | Scaffold a new task `.alp` file |
| `alp_create_feature` | Scaffold a new feature `.alp` file |

### Events & Analytics

| Tool | Description |
| :--- | :--- |
| `alp_get_events` | Read recent runtime events with optional type filtering and limit |
| `alp_get_analytics` | Analytics summary from state store or event log |

### Governance & Registry — v4+

| Tool | Description |
| :--- | :--- |
| `alp_check_policy` | Evaluate policy decisions — check if a file path or command is permitted by workspace `@policy` rules |
| `alp_visualize` | Generate a Mermaid DAG diagram of the project dependency graph for embedding in docs or chat |
| `alp_search_registry` | Search installed ALP registry packages |
| `alp_get_timelines` | Retrieve `@timeline` scheduling objects and their cron/at triggers |

### Contracts & Vaults

| Tool | Description |
| :--- | :--- |
| `alp_get_contracts` | List all `@contract` objects and their allow/deny rules |
| `alp_get_vaults` | List all `@vault` objects and their recipient/algorithm metadata |

### Swarm Marketplace & Event Mesh — v38.0.0

| Tool | Description |
| :--- | :--- |
| `alp_get_swarm_marketplace` | List registered skills from `@swarm_marketplace` objects, optionally filtered by category |
| `alp_get_event_mesh` | List event mesh topics and recent events from `@event_mesh` objects |

### Macro Engine — v37+

| Tool | Description |
| :--- | :--- |
| `alp_get_macros` | List `@macro` definitions from the workspace |
| `alp_expand_macro` | Expand a `@macro` definition by ID and return generated objects |

### Memory Mesh — v38+

| Tool | Description |
| :--- | :--- |
| `alp_memory_store` | Store a memory node in the workspace memory mesh |
| `alp_memory_query` | Query the memory mesh for relevant memories |
| `alp_memory_stats` | Return memory mesh statistics |

In addition, the server exposes the workspace `.alp` files as MCP **resources** (`file://` URIs) so a client can read raw object files directly.

## Usage with Claude Desktop

To add ALP to Claude Desktop, edit your `claude_desktop_config.json` and add the server:

```json
{
  "mcpServers": {
    "alp": {
      "command": "alp-mcp",
      "args": []
    }
  }
}
```

## Usage with Cursor

Add to your `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "alp": {
      "command": "alp-mcp",
      "args": [],
      "env": {}
    }
  }
}
```

## Usage with Windsurf

Add to your Windsurf MCP configuration (`~/.windsurf/mcp.json`):

```json
{
  "mcpServers": {
    "alp": {
      "command": "alp-mcp",
      "args": []
    }
  }
}
```

Now, your AI coding assistant can natively read your project's architecture, enforce policies, visualize dependencies, and query task states before writing a single line of code!
