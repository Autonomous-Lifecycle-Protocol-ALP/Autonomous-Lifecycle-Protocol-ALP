#!/usr/bin/env node

/**
 * ALP MCP Server
 *
 * Exposes the ALP workspace to any MCP-compatible client (Claude Desktop,
 * Cursor, etc.) via standardized tool calls over stdio transport.
 *
 * Tools provided:
 *   - alp_get_graph: Returns the full dependency graph as JSON
 *   - alp_get_status: Returns project status summary
 *   - alp_read_object: Read a specific ALP object by ID
 *   - alp_list_objects: List all objects, optionally filtered by type
 *   - alp_validate: Validate the workspace and return any errors
 *   - alp_update_status: Update the status of a specific task
 *   - alp_get_impact: Get all downstream nodes affected by a change
 *   - alp_search: Fuzzy search across all object IDs and descriptions
 *   - alp_delegate: Create a new task assigned to a specific role/agent
 *   - alp_decompose: Split a large task into sub-tasks
 *   - alp_create_task: Create a new task .alp file
 *   - alp_create_feature: Create a new feature .alp file
 *   - alp_get_events: Read recent runtime events with filtering
 *   - alp_get_analytics: Return analytics summary from state store
 *   - alp_set_status: Update an object's status via MCP
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { server } from './server';
import { listToolsHandler, callToolHandler } from './tools';
import { listPromptsHandler, getPromptHandler } from './prompts';
import { listResourcesHandler, readResourceHandler, subscriptionHandlers } from './resources';

// Register all handlers
listToolsHandler(server);
callToolHandler(server);
listPromptsHandler(server);
getPromptHandler(server);
listResourcesHandler(server);
readResourceHandler(server);
subscriptionHandlers(server);

// ─── Start Server ─────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ALP MCP Server running on stdio');
}

main().catch(console.error);
