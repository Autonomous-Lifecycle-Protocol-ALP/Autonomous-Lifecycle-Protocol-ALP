import { Server } from '@modelcontextprotocol/sdk/server/index.js';

// ─── MCP Server ───────────────────────────────────────────────────────────
export const server = new Server(
  { name: 'alp-mcp-server', version: '80.0.0' },
  { capabilities: { tools: {}, resources: { subscribe: true }, prompts: {} } }
);
