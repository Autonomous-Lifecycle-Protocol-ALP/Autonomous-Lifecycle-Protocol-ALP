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

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  PromptSchema,
  PromptArgumentSchema,
  GetPromptResultSchema,
  ListPromptsResultSchema,
  SubscribeRequestSchema,
  UnsubscribeRequestSchema,
  ResourceUpdatedNotificationSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { AlpParser, AlpObject, AlpGraph, PolicyEngine, updateObjectStatus, MacroEngine, MacroDefinition, MemoryMeshEngine, MemoryQueryResult } from '@autonomous-lifecycle-protocol-alp/parser';
import * as fs from 'fs';
import * as path from 'path';

/** Convert an arbitrary title into a kebab-case ALP object id. */
function toKebab(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

// ─── Workspace Loader ─────────────────────────────────────────────────────
const workspaceCache = new Map<string, { mtime: number; objects: AlpObject[] }>();

function getAlpDirMtime(dir: string): number {
  try {
    return fs.statSync(dir).mtimeMs;
  } catch {
    return 0;
  }
}

function loadWorkspace(rootDir: string): AlpObject[] {
  const alpDir = path.join(rootDir, '.alp');
  if (!fs.existsSync(alpDir)) {
    return [];
  }
  const mtime = getAlpDirMtime(alpDir);
  const cached = workspaceCache.get(rootDir);
  if (cached && cached.mtime === mtime) {
    return cached.objects;
  }
  const parser = new AlpParser();
  const objects: AlpObject[] = [];
  loadDirectory(alpDir, parser, objects);
  workspaceCache.set(rootDir, { mtime, objects });
  return objects;
}

function loadDirectory(dir: string, parser: AlpParser, results: AlpObject[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadDirectory(fullPath, parser, results);
    } else if (entry.name.endsWith('.alp')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        results.push(...parser.parse(content));
      } catch {
        // Skip unparseable files
      }
    }
  }
}

/**
 * Policy gate for MCP mutation tools (v4 Pillar 4 — Capability Scoping).
 *
 * Evaluates a proposed workspace file write against any @policy objects.
 * Returns an MCP error result when a strict policy blocks it, or null when
 * the action is permitted. The path is made workspace-relative (POSIX) so it
 * matches policy globs like "src/**" or ".alp/**".
 */
function enforcePolicy(
  rootDir: string,
  targetFile: string,
  agent?: string,
): { content: { type: 'text'; text: string }[]; isError: true } | null {
  const objects = loadWorkspace(rootDir);
  const engine = new PolicyEngine(objects);
  if (engine.count === 0) return null;

  const relative = path
    .relative(rootDir, targetFile)
    .replace(/\\/g, '/');

  // ALP protocol-coordination files under `.alp/` (task creation via
  // delegate/decompose, status updates) are governed by explicit deny rules
  // only — they are not "source code" subject to the allow-list. This lets a
  // policy like allow_paths: [src/**] coexist with normal swarm coordination
  // while still honoring deny_paths (e.g. ".alp/.runtime/**").
  const isProtocolFile = relative === '.alp' || relative.startsWith('.alp/');
  if (isProtocolFile) {
    const denyOnly = engine.evaluateDenyOnly({ kind: 'path', value: relative, agent });
    if (denyOnly.blocked) {
      return {
        content: [
          {
            type: 'text',
            text:
              `⛔ Policy denied: cannot modify '${relative}'.\n` +
              denyOnly.reasons.join('\n'),
          },
        ],
        isError: true,
      };
    }
    return null;
  }

  const decision = engine.evaluate({ kind: 'path', value: relative, agent });

  if (decision.blocked) {
    return {
      content: [
        {
          type: 'text',
          text:
            `⛔ Policy denied: cannot modify '${relative}'.\n` +
            decision.reasons.join('\n'),
        },
      ],
      isError: true,
    };
  }
  return null;
}

/**
 * Append an audit event to `.alp/.runtime/log.jsonl` (v4 Pillar 4 — Audit
 * Trail). Mirrors the CLI runtime event format so `alp serve` shows MCP
 * mutations alongside swarm activity. Best-effort; never throws.
 */
function audit(
  rootDir: string,
  type: string,
  fields: Record<string, unknown> = {},
): void {
  try {
    const runtimeDir = path.join(rootDir, '.alp', '.runtime');
    if (!fs.existsSync(runtimeDir)) fs.mkdirSync(runtimeDir, { recursive: true });
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      source: 'mcp-server',
      pid: process.pid,
      ...fields,
    };
    fs.appendFileSync(
      path.join(runtimeDir, 'log.jsonl'),
      JSON.stringify(entry) + '\n',
      'utf-8',
    );
  } catch {
    /* audit is best-effort */
  }
}

// ─── MCP Server ───────────────────────────────────────────────────────────
const server = new Server(
  { name: 'alp-mcp-server', version: '41.0.0' },
  { capabilities: { tools: {}, resources: { subscribe: true }, prompts: {} } }
);

// ─── Resource Subscription State ─────────────────────────────────────────
const subscribers = new Map<string, Set<(uri: string) => void>>();
let subscriptionTimer: NodeJS.Timeout | null = null;
let lastEventLogSize = 0;

function getResourceUri(resourcePath: string): string {
  return `file://${resourcePath.replace(/\\/g, '/')}`;
}

function startSubscriptionPolling(rootDir: string) {
  if (subscriptionTimer) return;
  const logPath = path.join(rootDir, '.alp', '.runtime', 'log.jsonl');
  const eventsPath = path.join(rootDir, '.alp', '.events', 'events.jsonl');

  subscriptionTimer = setInterval(() => {
    try {
      let newEvents = false;
      if (fs.existsSync(eventsPath)) {
        const { size } = fs.statSync(eventsPath);
        if (size > lastEventLogSize) {
          lastEventLogSize = size;
          newEvents = true;
        }
      }
      if (fs.existsSync(logPath)) {
        const { size } = fs.statSync(logPath);
        if (size > lastEventLogSize) {
          lastEventLogSize = size;
          newEvents = true;
        }
      }
      if (newEvents && subscribers.size > 0) {
        for (const [, callbacks] of subscribers) {
          for (const cb of callbacks) {
            try { cb('alp://events'); } catch { /* best-effort */ }
          }
        }
      }
    } catch {
      /* best-effort polling */
    }
  }, 2000);
}

function stopSubscriptionPolling() {
  if (subscriptionTimer) {
    clearInterval(subscriptionTimer);
    subscriptionTimer = null;
  }
}

// ─── Tool Definitions ─────────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'alp_list_objects',
      description: 'List all ALP objects in the workspace, optionally filtered by type (e.g., task, agent, memory).',
      inputSchema: {
        type: 'object' as const,
        properties: {
          type: { type: 'string', description: 'Filter by object type (e.g., "task", "agent", "memory")' },
          cwd: { type: 'string', description: 'Working directory (defaults to process.cwd())' },
        },
      },
    },
    {
      name: 'alp_read_object',
      description: 'Read a specific ALP object by its ID and return all its properties.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          id: { type: 'string', description: 'The ID of the object to read' },
          cwd: { type: 'string', description: 'Working directory' },
        },
        required: ['id'],
      },
    },
    {
      name: 'alp_get_graph',
      description: 'Get the full dependency graph of the ALP workspace as a sorted execution order.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          cwd: { type: 'string', description: 'Working directory' },
        },
      },
    },
    {
      name: 'alp_get_status',
      description: 'Get the current project status, including task counts by state.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          cwd: { type: 'string', description: 'Working directory' },
        },
      },
    },
    {
      name: 'alp_validate',
      description: 'Validate the ALP workspace and return any syntax or schema errors.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          cwd: { type: 'string', description: 'Working directory' },
        },
      },
    },
    {
      name: 'alp_update_status',
      description: 'Update the status of a specific task in the ALP workspace',
      inputSchema: {
        type: 'object' as const,
        properties: {
          id: { type: 'string', description: 'Task ID' },
          status: { type: 'string', description: 'New status (e.g. [ ], [~], [x], [!])' },
          agent: { type: 'string', description: 'Optional acting agent (for @policy scoping)' },
          cwd: { type: 'string' }
        },
        required: ['id', 'status']
      }
    },
    {
      name: 'alp_get_impact',
      description: 'Get all downstream nodes affected by a change to the given node',
      inputSchema: {
        type: 'object' as const,
        properties: {
          id: { type: 'string', description: 'Node ID' },
          cwd: { type: 'string' }
        },
        required: ['id']
      }
    },
    {
      name: 'alp_search',
      description: 'Global workspace search with regex and type filters (v41.0.0).',
      inputSchema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Search query (supports regex when useRegex is true)' },
          type: { type: 'string', description: 'Filter by object type (e.g. task, agent, policy)' },
          useRegex: { type: 'boolean', description: 'Treat query as a regular expression' },
          cwd: { type: 'string' }
        },
        required: ['query']
      }
    },
    {
      name: 'alp_get_settings',
      description: 'Get workspace settings (v41.0.0 IDE Productivity).',
      inputSchema: {
        type: 'object' as const,
        properties: {
          key: { type: 'string', description: 'Optional specific setting key to retrieve' },
          cwd: { type: 'string' }
        },
        required: []
      }
    },
    {
      name: 'alp_set_settings',
      description: 'Set a workspace setting (v41.0.0 IDE Productivity).',
      inputSchema: {
        type: 'object' as const,
        properties: {
          key: { type: 'string', description: 'Setting key' },
          value: { type: 'string', description: 'Setting value (JSON or plain string)' },
          cwd: { type: 'string' }
        },
        required: ['key', 'value']
      }
    },
    {
      name: 'alp_delegate',
      description: 'Create a new task assigned to a specific role/agent (sub-agent delegation).',
      inputSchema: {
        type: 'object' as const,
        properties: {
          title: { type: 'string', description: 'Task title (used to derive the task id)' },
          agent: { type: 'string', description: 'Agent/role to assign (e.g. agent-qa)' },
          description: { type: 'string', description: 'Optional task description' },
          parent: { type: 'string', description: 'Optional parent task id this delegates from' },
          cwd: { type: 'string' }
        },
        required: ['title']
      }
    },
    {
      name: 'alp_decompose',
      description: 'Split a large task into sub-tasks, each blocked by the parent.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          taskId: { type: 'string', description: 'Parent task id to decompose' },
          subtasks: { type: 'array', items: { type: 'string' }, description: 'Sub-task titles' },
          agent: { type: 'string', description: 'Optional acting agent (for @policy scoping)' },
          cwd: { type: 'string' }
        },
        required: ['taskId', 'subtasks']
      }
    },
    {
      name: 'alp_create_task',
      description: 'Create a new task .alp file in .alp/tasks/ with given title, description, and agent assignment.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          title: { type: 'string', description: 'Task title (used to derive the task id)' },
          description: { type: 'string', description: 'Optional task description' },
          agent: { type: 'string', description: 'Agent/role to assign (e.g. agent-qa)' },
          parent: { type: 'string', description: 'Optional parent task id' },
          status: { type: 'string', description: 'Initial status: [ ], [~], [x], [!], [?] (default [ ])' },
          cwd: { type: 'string' }
        },
        required: ['title']
      }
    },
    {
      name: 'alp_create_feature',
      description: 'Create a new feature .alp file in .alp/features/ with given title and description.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          title: { type: 'string', description: 'Feature title (used to derive the feature id)' },
          description: { type: 'string', description: 'Optional feature description' },
          status: { type: 'string', description: 'Initial status: [ ], [~], [x], [!], [?] (default [ ])' },
          cwd: { type: 'string' }
        },
        required: ['title']
      }
    },
    {
      name: 'alp_get_events',
      description: 'Read recent events from .alp/.events/events.jsonl with optional type filtering and limit.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          type: { type: 'string', description: 'Filter by event type (e.g. status_changed, object_created)' },
          limit: { type: 'number', description: 'Maximum number of events to return (default 50)' },
          cwd: { type: 'string' }
        },
        required: []
      }
    },
    {
      name: 'alp_get_analytics',
      description: 'Read analytics summary from .alp/.runtime/state.db.json or compute from events.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          cwd: { type: 'string' }
        },
        required: []
      }
    },
    {
      name: 'alp_set_status',
      description: 'Update the status of an ALP object (task, feature, etc.) by ID.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          id: { type: 'string', description: 'Object ID to update' },
          status: { type: 'string', description: 'New status: [ ], [~], [x], [!], [?]' },
          cwd: { type: 'string' }
        },
        required: ['id', 'status']
      }
    },
    {
      name: 'alp_check_policy',
      description: 'Check whether a file path or shell command is permitted under workspace @policy guardrails.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          path: { type: 'string', description: 'File path to check' },
          command: { type: 'string', description: 'Shell command to check' },
          agent: { type: 'string', description: 'Agent ID to scope policy check' },
          cwd: { type: 'string' }
        }
      }
    },
    {
      name: 'alp_visualize',
      description: 'Render @workflow objects as Mermaid or JSON diagrams.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          id: { type: 'string', description: 'Optional workflow ID' },
          format: { type: 'string', description: 'Format: mermaid, json (default mermaid)' },
          cwd: { type: 'string' }
        }
      }
    },
    {
      name: 'alp_search_registry',
      description: 'Search or list installed community packages in the ALP Registry.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Search term for package name/description' },
          cwd: { type: 'string' }
        }
      }
    },
    {
      name: 'alp_get_timelines',
      description: 'List all @timeline scheduling objects and evaluate due fire times.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          due_only: { type: 'boolean', description: 'If true, only return timelines due now' },
          cwd: { type: 'string' }
        }
      }
    },
    {
      name: 'alp_get_contracts',
      description: 'List all @contract objects and their allow/deny rules.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          id: { type: 'string', description: 'Optional contract ID to filter by' },
          cwd: { type: 'string' }
        }
      }
    },
    {
      name: 'alp_get_vaults',
      description: 'List all @vault objects and their recipient/algorithm metadata.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          id: { type: 'string', description: 'Optional vault ID to filter by' },
          cwd: { type: 'string' }
        }
      }
    },
    {
      name: 'alp_get_swarm_marketplace',
      description: 'List registered skills from @swarm_marketplace objects, optionally filtered by category.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          category: { type: 'string', description: 'Optional category filter' },
          cwd: { type: 'string' }
        }
      }
    },
    {
      name: 'alp_get_event_mesh',
      description: 'List event mesh topics and recent events from @event_mesh objects.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          topic: { type: 'string', description: 'Optional topic filter' },
          limit: { type: 'number', description: 'Maximum events to return per topic (default 20)' },
          cwd: { type: 'string' }
        },
        required: []
      }
    },
    {
      name: 'alp_get_macros',
      description: 'List @macro definitions from the workspace.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          cwd: { type: 'string' }
        },
        required: []
      }
    },
    {
      name: 'alp_expand_macro',
      description: 'Expand a @macro definition by ID and return generated objects.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          id: { type: 'string', description: 'Macro ID to expand' },
          context: { type: 'object', description: 'Optional ALPEL context map' },
          cwd: { type: 'string' }
        },
        required: ['id']
      }
    },
    {
      name: 'alp_memory_store',
      description: 'Store a memory node in the workspace memory mesh.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          id: { type: 'string', description: 'Memory node ID' },
          agentId: { type: 'string', description: 'Owning agent ID' },
          key: { type: 'string', description: 'Memory key' },
          content: { type: 'string', description: 'Memory content' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Memory tags' },
          cwd: { type: 'string' }
        },
        required: ['id', 'agentId', 'key', 'content']
      }
    },
    {
      name: 'alp_memory_query',
      description: 'Query the memory mesh for relevant memories.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Search query' },
          agentId: { type: 'string', description: 'Optional agent ID filter' },
          tag: { type: 'string', description: 'Optional tag filter' },
          topK: { type: 'number', description: 'Maximum results (default 5)' },
          cwd: { type: 'string' }
        },
        required: ['query']
      }
    },
    {
      name: 'alp_memory_stats',
      description: 'Return memory mesh statistics.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          cwd: { type: 'string' }
        },
        required: []
      }
    },
  ],
}));

// ─── Tool Handlers ────────────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const cwd = (args?.cwd as string) || process.cwd();

  switch (name) {
    case 'alp_list_objects': {
      const objects = loadWorkspace(cwd);
      const typeFilter = args?.type as string | undefined;
      const filtered = typeFilter
        ? objects.filter((o) => o._type === typeFilter)
        : objects;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              filtered.map((o) => ({ type: o._type, id: o.id || 'unnamed' })),
              null,
              2
            ),
          },
        ],
      };
    }

    case 'alp_read_object': {
      const objects = loadWorkspace(cwd);
      const targetId = args?.id as string;
      const obj = objects.find((o) => o.id === targetId);
      if (!obj) {
        return {
          content: [{ type: 'text', text: `Error: Object "${targetId}" not found.` }],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }],
      };
    }

    case 'alp_get_graph': {
      const objects = loadWorkspace(cwd);
      const graph = new AlpGraph();
      graph.buildGraph(objects);
      
      try {
        const order = graph.topologicalSort();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                order.map((o) => ({ type: o.type, id: o.id || 'unnamed' })),
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Graph Error: ${err.message}` }],
          isError: true,
        };
      }
    }

    case 'alp_get_status': {
      const objects = loadWorkspace(cwd);
      const statusCounts: Record<string, number> = {
        done: 0,
        in_progress: 0,
        todo: 0,
        blocked: 0,
      };
      for (const obj of objects) {
        if (obj.status === '[x]') statusCounts.done++;
        else if (obj.status === '[~]') statusCounts.in_progress++;
        else if (obj.status === '[ ]') statusCounts.todo++;
        else if (obj.status === '[!]') statusCounts.blocked++;
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { total_objects: objects.length, status: statusCounts },
              null,
              2
            ),
          },
        ],
      };
    }

    case 'alp_validate': {
      const alpDir = path.join(cwd, '.alp');
      if (!fs.existsSync(alpDir)) {
        return {
          content: [{ type: 'text', text: 'Error: .alp directory not found.' }],
          isError: true,
        };
      }
      const errors: string[] = [];
      validateDirectory(alpDir, errors);
      if (errors.length === 0) {
        return {
          content: [{ type: 'text', text: '✅ All ALP files are valid.' }],
        };
      }
      return {
        content: [{ type: 'text', text: errors.join('\n') }],
        isError: true,
      };
    }
    
    case 'alp_update_status': {
      const targetId = args?.id as string;
      const newStatus = args?.status as string;
      const agent = args?.agent as string | undefined;
      const alpDir = path.join(cwd, '.alp');
      let updated = false;
      let policyError: ReturnType<typeof enforcePolicy> = null;
      const walk = (dir: string) => {
        if (updated || policyError) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (updated || policyError) return;
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(fullPath);
          else if (fullPath.endsWith('.alp')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(`id: ${targetId}`)) {
              // Capability scoping: the file about to be written must comply.
              policyError = enforcePolicy(cwd, fullPath, agent);
              if (policyError) return;
              // Quote-aware status rewrite (preserves [ ], [~], [x], [!], [?]).
              const { content: next, changed } = updateObjectStatus(content, targetId, newStatus);
              if (changed) {
                fs.writeFileSync(fullPath, next, 'utf8');
                updated = true;
              }
            }
          }
        }
      };
      if (fs.existsSync(alpDir)) walk(alpDir);

      if (policyError) return policyError;

      if (updated) {
        audit(cwd, 'task_status', { task_id: targetId, status: newStatus, agent });
      }
      return {
        content: [{ type: 'text', text: updated ? `Status of ${targetId} updated to ${newStatus}` : `Task ${targetId} not found` }]
      };
    }

    case 'alp_get_impact': {
      const objects = loadWorkspace(cwd);
      const graph = new AlpGraph();
      graph.buildGraph(objects);
      const targetId = args?.id as string;
      const impacted = graph.getImpact(targetId);
      return {
        content: [{ type: 'text', text: JSON.stringify(impacted.map(i => ({ id: i.id, type: i.type })), null, 2) }]
      };
    }

    case 'alp_search': {
      const objects = loadWorkspace(cwd);
      const query = (args?.query as string) || '';
      const typeFilter = args?.type as string | undefined;
      const useRegex = Boolean(args?.useRegex);

      let filtered = objects;
      if (typeFilter) {
        filtered = filtered.filter(o => o._type === typeFilter);
      }

      let results: AlpObject[];
      if (useRegex) {
        try {
          const regex = new RegExp(query, 'i');
          results = filtered.filter(o =>
            (o.id && regex.test(o.id)) ||
            (o.description && regex.test(o.description)) ||
            regex.test(JSON.stringify(o))
          );
        } catch (err: any) {
          return {
            content: [{ type: 'text', text: `Error: invalid regex: ${err.message}` }],
            isError: true,
          };
        }
      } else {
        const lowered = query.toLowerCase();
        results = filtered.filter(o =>
          (o.id && o.id.toLowerCase().includes(lowered)) ||
          (o.description && o.description.toLowerCase().includes(lowered))
        );
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(results.map(r => ({ id: r.id, type: r._type, description: r.description })), null, 2) }]
      };
    }

    case 'alp_get_settings': {
      const alpDir = path.join(cwd, '.alp');
      const settingsPath = path.join(alpDir, 'settings.json');
      if (!fs.existsSync(settingsPath)) {
        return {
          content: [{ type: 'text', text: JSON.stringify({}, null, 2) }],
        };
      }
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      const key = args?.key as string | undefined;
      if (key) {
        if (key in settings) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ [key]: settings[key] }, null, 2) }],
          };
        }
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `Setting "${key}" not found.` }, null, 2) }],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(settings, null, 2) }],
      };
    }

    case 'alp_set_settings': {
      const alpDir = path.join(cwd, '.alp');
      const settingsPath = path.join(alpDir, 'settings.json');
      const key = args?.key as string;
      const rawValue = args?.value as string;
      if (!key || rawValue === undefined) {
        return {
          content: [{ type: 'text', text: 'Error: key and value are required.' }],
          isError: true,
        };
      }
      let parsedValue: unknown = rawValue;
      try {
        parsedValue = JSON.parse(rawValue);
      } catch {
        // keep as string
      }
      const existing: Record<string, unknown> = fs.existsSync(settingsPath)
        ? JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
        : {};
      existing[key] = parsedValue;
      fs.mkdirSync(alpDir, { recursive: true });
      fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2), 'utf8');
      return {
        content: [{ type: 'text', text: JSON.stringify({ key, value: parsedValue }, null, 2) }],
      };
    }

    case 'alp_decompose': {
      // Split a large task into N sub-tasks, each blocked by the parent.
      const parentId = args?.taskId as string;
      const subtasks = (args?.subtasks as string[] | undefined) || [];
      if (!parentId) {
        return { content: [{ type: 'text', text: 'Error: taskId is required.' }], isError: true };
      }
      if (subtasks.length === 0) {
        return { content: [{ type: 'text', text: 'Error: at least one subtask title is required.' }], isError: true };
      }
      const alpDir = path.join(cwd, '.alp');
      const tasksDir = path.join(alpDir, 'tasks');
      fs.mkdirSync(tasksDir, { recursive: true });

      const created: string[] = [];
      for (const title of subtasks) {
        const id = toKebab(`${parentId}-${title}`);
        const file = path.join(tasksDir, `${id}.alp`);
        if (fs.existsSync(file)) continue;
        // Capability scoping: the new file path must comply with policy.
        const denied = enforcePolicy(cwd, file, args?.agent as string | undefined);
        if (denied) return denied;
        const body =
          `!alp-version: 3.0.0\n\n` +
          `@task\n` +
          `  id: ${id}\n` +
          `  status: [ ]\n` +
          `  description: "${title.replace(/"/g, "'")}"\n` +
          `  depends_on:\n    - -> ${parentId}\n`;
        fs.writeFileSync(file, body, 'utf8');
        created.push(id);
      }
      if (created.length) {
        audit(cwd, 'file_mutation', { action: 'decompose', parent: parentId, created });
      }
      return {
        content: [{
          type: 'text',
          text: created.length
            ? `Decomposed ${parentId} into ${created.length} sub-task(s): ${created.join(', ')}`
            : `No new sub-tasks created (already exist).`,
        }],
      };
    }

    case 'alp_delegate': {
      // Create a new task assigned to a specific role/agent.
      const title = args?.title as string;
      const agent = (args?.agent as string) || 'agent-developer';
      const description = (args?.description as string) || title || '';
      const parent = args?.parent as string | undefined;
      if (!title) {
        return { content: [{ type: 'text', text: 'Error: title is required.' }], isError: true };
      }
      const alpDir = path.join(cwd, '.alp');
      const tasksDir = path.join(alpDir, 'tasks');
      fs.mkdirSync(tasksDir, { recursive: true });

      const id = toKebab(title);
      const file = path.join(tasksDir, `${id}.alp`);
      if (fs.existsSync(file)) {
        return { content: [{ type: 'text', text: `Task ${id} already exists.` }], isError: true };
      }
      // Capability scoping: the new file path must comply with policy.
      const delegateDenied = enforcePolicy(cwd, file, agent);
      if (delegateDenied) return delegateDenied;
      const ownerLine = `  owner: -> ${agent.replace(/^->\s*/, '')}\n`;
      const parentLine = parent ? `  depends_on:\n    - -> ${parent.replace(/^->\s*/, '')}\n` : '';
      const body =
        `!alp-version: 2.0.0\n\n` +
        `@task\n` +
        `  id: ${id}\n` +
        `  status: [ ]\n` +
        `  description: "${description.replace(/"/g, "'")}"\n` +
        ownerLine +
        parentLine;
      fs.writeFileSync(file, body, 'utf8');
      audit(cwd, 'file_mutation', { action: 'delegate', task_id: id, agent });
      return {
        content: [{ type: 'text', text: `Delegated task ${id} to ${agent}.` }],
      };
    }

    case 'alp_check_policy': {
      const targetPath = args?.path as string | undefined;
      const targetCommand = args?.command as string | undefined;
      const targetAgent = args?.agent as string | undefined;
      const objects = loadWorkspace(cwd);
      const engine = new PolicyEngine(objects);
      let decision = { allowed: true, blocked: false, reasons: ['No policy rules matched'], policies: [] as string[] };

      if (targetPath) {
        decision = engine.evaluate({ kind: 'path', value: targetPath, agent: targetAgent });
      } else if (targetCommand) {
        decision = engine.evaluate({ kind: 'command', value: targetCommand, agent: targetAgent });
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(decision, null, 2) }],
        isError: decision.blocked,
      };
    }

    case 'alp_visualize': {
      const objects = loadWorkspace(cwd);
      const targetId = args?.id as string | undefined;
      const format = (args?.format as string) || 'mermaid';
      const workflows = objects.filter((o) => o._type === 'workflow');
      const filtered = targetId ? workflows.filter((w) => w.id === targetId) : workflows;

      if (filtered.length === 0) {
        return {
          content: [{ type: 'text', text: 'No matching @workflow objects found.' }],
        };
      }

      if (format === 'json') {
        return {
          content: [{ type: 'text', text: JSON.stringify(filtered, null, 2) }],
        };
      }

      // Default Mermaid format
      const mermaidLines = ['graph TD'];
      for (const wf of filtered) {
        const steps = (wf as any).steps || [];
        for (const s of steps) {
          mermaidLines.push(`  ${s.id || s}["${s.name || s.id || s}"]`);
          if (s.next) {
            const nexts = Array.isArray(s.next) ? s.next : [s.next];
            for (const n of nexts) mermaidLines.push(`  ${s.id} --> ${n}`);
          }
        }
      }

      return {
        content: [{ type: 'text', text: mermaidLines.join('\n') }],
      };
    }

    case 'alp_search_registry': {
      const query = (args?.query as string) || '';
      const registryDir = path.join(cwd, '.alp', 'registry');
      if (!fs.existsSync(registryDir)) {
        return {
          content: [{ type: 'text', text: JSON.stringify([], null, 2) }],
        };
      }
      const packages: any[] = [];
      const walkReg = (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) walkReg(fullPath);
          else if (entry.name === 'manifest.json' || entry.name === 'alp-package.json') {
            try {
              const meta = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
              if (!query || JSON.stringify(meta).toLowerCase().includes(query.toLowerCase())) {
                packages.push(meta);
              }
            } catch {
              /* skip */
            }
          }
        }
      };
      walkReg(registryDir);
      return {
        content: [{ type: 'text', text: JSON.stringify(packages, null, 2) }],
      };
    }

    case 'alp_get_timelines': {
      const dueOnly = Boolean(args?.due_only);
      const objects = loadWorkspace(cwd);
      const timelines = objects.filter((o) => o._type === 'timeline');
      const results = timelines.map((tl) => ({
        id: tl.id,
        cron: (tl as any).cron || null,
        at: (tl as any).at || null,
        status: tl.status || '[ ]',
        description: tl.description || '',
      }));
      return {
        content: [{ type: 'text', text: JSON.stringify(dueOnly ? results.filter((r) => r.status !== '[x]') : results, null, 2) }],
      };
    }

    case 'alp_get_contracts': {
      const objects = loadWorkspace(cwd);
      const contracts = objects.filter((o) => o._type === 'contract');
      const contractId = args?.id as string | undefined;
      const filtered = contractId
        ? contracts.filter((c) => c.id === contractId)
        : contracts;
      const results = filtered.map((c: any) => ({
        id: c.id,
        from: c.from || null,
        to: c.to || null,
        allows: c.allows || [],
        denies: c.denies || [],
        requires: c.requires || [],
        on_violation: c.on_violation || null,
        description: c.description || '',
      }));
      return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
      };
    }

    case 'alp_get_vaults': {
      const objects = loadWorkspace(cwd);
      const vaults = objects.filter((o) => o._type === 'vault');
      const vaultId = args?.id as string | undefined;
      const filtered = vaultId
        ? vaults.filter((v) => v.id === vaultId)
        : vaults;
      const results = filtered.map((v: any) => ({
        id: v.id,
        algorithm: v.algorithm || 'X25519+AES-256-GCM',
        recipients: (v.recipients || []).map((r: any) => ({
          id: r.id || r,
          algorithm: r.algorithm || 'X25519',
        })),
        description: v.description || '',
      }));
      return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
      };
    }

    case 'alp_get_swarm_marketplace': {
      const objects = loadWorkspace(cwd);
      const category = args?.category as string | undefined;
      const listings = objects
        .filter((o) => o._type === 'swarm_marketplace')
        .map((mp: any) => ({
          id: mp.id,
          providerAgent: mp.provider_agent || mp.providerAgent || '',
          skillName: mp.skill_name || mp.skillName || '',
          category: mp.category || '',
          costPerCall: Number(mp.cost_per_call ?? mp.costPerCall ?? 0.01),
          rating: Number(mp.rating ?? 5.0),
          totalInvocations: Number(mp.total_invocations ?? mp.totalInvocations ?? 0),
          description: mp.description || '',
        }));
      const filtered = category
        ? listings.filter((l) => l.category === category)
        : listings;
      return {
        content: [{ type: 'text', text: JSON.stringify(filtered, null, 2) }],
      };
    }

    case 'alp_get_event_mesh': {
      const objects = loadWorkspace(cwd);
      const meshes = objects.filter((o) => o._type === 'event_mesh');
      const topicFilter = args?.topic as string | undefined;
      const limit = (args?.limit as number) || 20;
      const results: any[] = [];
      for (const mesh of meshes) {
        const subscriptions = (mesh as any).subscriptions || [];
        const buffered = (mesh as any).events || [];
        const filteredEvents = topicFilter
          ? buffered.filter((e: any) => e.topic === topicFilter)
          : buffered;
        results.push({
          id: mesh.id,
          subscriptions: subscriptions.map((s: any) => s.topic || s),
          events: filteredEvents.slice(-limit),
        });
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
      };
    }

    case 'alp_get_macros': {
      const objects = loadWorkspace(cwd);
      const macros = objects.filter((o) => o._type === 'macro');
      const results = macros.map((m: any) => ({
        id: m.id,
        name: m.name || '',
        iterate_over: m.iterate_over || '',
        as: m.as || 'item',
        template: m.template || {},
      }));
      return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
      };
    }

    case 'alp_expand_macro': {
      const macroId = args?.id as string;
      const context = (args?.context as Record<string, any>) || {};
      const objects = loadWorkspace(cwd);
      const macroObj = objects.find((o) => o._type === 'macro' && o.id === macroId);
      if (!macroObj) {
        return {
          content: [{ type: 'text', text: `Error: @macro '${macroId}' not found.` }],
          isError: true,
        };
      }
      const engine = new MacroEngine();
      const expanded = engine.expand(macroObj as unknown as MacroDefinition, context);
      return {
        content: [{ type: 'text', text: JSON.stringify(expanded, null, 2) }],
      };
    }

    case 'alp_memory_store': {
      const engine = new MemoryMeshEngine();
      const node = engine.storeMemory(
        (args?.id as string) || '',
        (args?.agentId as string) || '',
        (args?.key as string) || '',
        (args?.content as string) || '',
        (args?.tags as string[]) || [],
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(node, null, 2) }],
      };
    }

    case 'alp_memory_query': {
      const engine = new MemoryMeshEngine();
      const results = engine.queryMemoryMesh((args?.query as string) || '', {
        agentId: args?.agentId as string | undefined,
        tag: args?.tag as string | undefined,
        topK: (args?.topK as number) || 5,
      });
      const out = results.map((r: MemoryQueryResult) => ({
        score: r.score,
        decayFactor: r.decayFactor,
        node: {
          id: r.node.id,
          agentId: r.node.agentId,
          key: r.node.key,
          content: r.node.content,
          tags: r.node.tags,
        },
      }));
      return {
        content: [{ type: 'text', text: JSON.stringify(out, null, 2) }],
      };
    }

    case 'alp_memory_stats': {
      const engine = new MemoryMeshEngine();
      const stats = engine.getMeshStats();
      return {
        content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }],
      };
    }

    case 'alp_create_task': {
      const title = args?.title as string;
      const description = (args?.description as string) || '';
      const agent = (args?.agent as string) || '';
      const parent = args?.parent as string | undefined;
      const status = (args?.status as string) || '[ ]';
      if (!title) {
        return { content: [{ type: 'text', text: 'Error: title is required.' }], isError: true };
      }
      const alpDir = path.join(cwd, '.alp');
      const tasksDir = path.join(alpDir, 'tasks');
      fs.mkdirSync(tasksDir, { recursive: true });
      const id = toKebab(title);
      const file = path.join(tasksDir, `${id}.alp`);
      if (fs.existsSync(file)) {
        return { content: [{ type: 'text', text: `Task ${id} already exists.` }], isError: true };
      }
      const ownerLine = agent ? `  owner: -> ${agent}\n` : '';
      const parentLine = parent ? `  depends_on:\n    - -> ${parent}\n` : '';
      const body =
        `!alp-version: 2.0.0\n\n` +
        `@task\n` +
        `  id: ${id}\n` +
        `  status: ${status}\n` +
        `  description: "${description.replace(/"/g, "'")}"\n` +
        ownerLine +
        parentLine;
      fs.writeFileSync(file, body, 'utf8');
      audit(cwd, 'file_mutation', { action: 'create_task', task_id: id });
      return {
        content: [{ type: 'text', text: `Created task ${id}.` }],
      };
    }

    case 'alp_create_feature': {
      const title = args?.title as string;
      const description = (args?.description as string) || '';
      const status = (args?.status as string) || '[ ]';
      if (!title) {
        return { content: [{ type: 'text', text: 'Error: title is required.' }], isError: true };
      }
      const alpDir = path.join(cwd, '.alp');
      const featuresDir = path.join(alpDir, 'features');
      fs.mkdirSync(featuresDir, { recursive: true });
      const id = toKebab(title);
      const file = path.join(featuresDir, `${id}.alp`);
      if (fs.existsSync(file)) {
        return { content: [{ type: 'text', text: `Feature ${id} already exists.` }], isError: true };
      }
      const body =
        `!alp-version: 2.0.0\n\n` +
        `@feature\n` +
        `  id: ${id}\n` +
        `  status: ${status}\n` +
        `  description: "${description.replace(/"/g, "'")}"\n`;
      fs.writeFileSync(file, body, 'utf8');
      audit(cwd, 'file_mutation', { action: 'create_feature', feature_id: id });
      return {
        content: [{ type: 'text', text: `Created feature ${id}.` }],
      };
    }

    case 'alp_get_events': {
      const typeFilter = args?.type as string | undefined;
      const limit = (args?.limit as number) || 50;
      const eventsFile = path.join(cwd, '.alp', '.events', 'events.jsonl');
      if (!fs.existsSync(eventsFile)) {
        return { content: [{ type: 'text', text: 'No events file found.' }] };
      }
      const lines = fs.readFileSync(eventsFile, 'utf8').split('\n').filter(Boolean);
      let events = lines.map((l) => {
        try { return JSON.parse(l); } catch { return null; }
      }).filter((e): e is Record<string, unknown> => e !== null);
      if (typeFilter) {
        events = events.filter((e) => (e as any).type === typeFilter);
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(events.slice(-limit), null, 2) }],
      };
    }

    case 'alp_get_analytics': {
      const stateFile = path.join(cwd, '.alp', '.runtime', 'state.db.json');
      if (fs.existsSync(stateFile)) {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        return {
          content: [{ type: 'text', text: JSON.stringify(state, null, 2) }],
        };
      }
      const objects = loadWorkspace(cwd);
      const analytics = {
        total_objects: objects.length,
        by_type: objects.reduce((acc: Record<string, number>, o: any) => {
          acc[o._type] = (acc[o._type] || 0) + 1;
          return acc;
        }, {}),
        by_status: objects.reduce((acc: Record<string, number>, o: any) => {
          const s = o.status || '[ ]';
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        }, {}),
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(analytics, null, 2) }],
      };
    }

    case 'alp_set_status': {
      const targetId = args?.id as string;
      const newStatus = args?.status as string;
      if (!targetId || !newStatus) {
        return { content: [{ type: 'text', text: 'Error: id and status are required.' }], isError: true };
      }
      const objects = loadWorkspace(cwd);
      const obj = objects.find((o) => o.id === targetId);
      if (!obj) {
        return { content: [{ type: 'text', text: `Object ${targetId} not found.` }], isError: true };
      }
      const alpDir = path.join(cwd, '.alp');
      const filePath = path.join(alpDir, obj._type === 'task' ? 'tasks' : obj._type === 'feature' ? 'features' : 'objects', `${targetId}.alp`);
      if (!fs.existsSync(filePath)) {
        return { content: [{ type: 'text', text: `File for ${targetId} not found.` }], isError: true };
      }
      const content = fs.readFileSync(filePath, 'utf8');
      const updated = content.replace(/(status:\s*)\[.\]/, `$1${newStatus}`);
      fs.writeFileSync(filePath, updated, 'utf8');
      audit(cwd, 'task_status', { task_id: targetId, status: newStatus });
      return {
        content: [{ type: 'text', text: `Status of ${targetId} updated to ${newStatus}` }],
      };
    }

    default:
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
});

// ─── Prompt Handlers ───────────────────────────────────────────────────────
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: 'triage',
      description: 'Analyze the current project state and suggest a triage plan for blocked and high-priority tasks.',
      arguments: [
        { name: 'focus', description: 'Optional focus area (e.g. "blocked", "critical")', required: false },
      ],
    },
    {
      name: 'standup',
      description: 'Generate a daily standup summary from recent task activity and status changes.',
      arguments: [
        { name: 'since', description: 'ISO timestamp to filter events from (e.g. "2026-07-20T00:00:00Z")', required: false },
      ],
    },
    {
      name: 'retrospective',
      description: 'Generate a sprint retrospective summary from completed tasks, failures, and handoffs.',
      arguments: [
        { name: 'sprint', description: 'Sprint identifier or date range', required: false },
      ],
    },
  ],
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const promptName = request.params.name;
  const args = request.params.arguments || {};
  const objects = loadWorkspace(args.cwd as string || process.cwd());

  switch (promptName) {
    case 'triage': {
      const focus = (args.focus as string) || '';
      const blocked = objects.filter((o) => o.status === '[!]');
      const critical = objects.filter((o) => (o as any).priority === 'critical');
      const todo = objects.filter((o) => o.status === '[ ]');
      let lines = [
        '# Triage Report',
        '',
        `Total objects: ${objects.length}`,
        `Blocked: ${blocked.length}`,
        `Todo: ${todo.length}`,
        `Critical priority: ${critical.length}`,
        '',
      ];
      if (focus) {
        lines.push(`## Focus: ${focus}`);
        if (focus === 'blocked') {
          for (const b of blocked.slice(0, 10)) {
            lines.push(`- **${b.id}**: ${b.description || '(no description)'}`);
          }
        } else if (focus === 'critical') {
          for (const c of critical.slice(0, 10)) {
            lines.push(`- **${c.id}**: ${c.description || '(no description)'}`);
          }
        }
      } else {
        lines.push('## Blocked Tasks');
        if (blocked.length === 0) lines.push('No blocked tasks.');
        else for (const b of blocked.slice(0, 10)) lines.push(`- **${b.id}**: ${b.description || '(no description)'}`);
        lines.push('');
        lines.push('## Next Available');
        for (const t of todo.slice(0, 5)) lines.push(`- **${t.id}**: ${t.description || '(no description)'}`);
      }
      return {
        messages: [
          { role: 'user', content: { type: 'text', text: lines.join('\n') } },
        ],
      };
    }

    case 'standup': {
      const since = (args.since as string) || new Date(Date.now() - 86400000).toISOString();
      const eventsPath = path.join(args.cwd as string || process.cwd(), '.alp', '.runtime', 'log.jsonl');
      let recent: any[] = [];
      if (fs.existsSync(eventsPath)) {
        const raw = fs.readFileSync(eventsPath, 'utf-8');
        for (const line of raw.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const evt = JSON.parse(trimmed);
            if (evt.timestamp >= since) recent.push(evt);
          } catch { /* skip */ }
        }
      }
      const taskStatusChanges = recent.filter((e) => e.type === 'task_status');
      const claims = recent.filter((e) => e.type === 'task_claim');
      const completions = recent.filter((e) => e.type === 'task_status' && e.status === '[x]');
      const lines = [
        '# Daily Standup',
        '',
        `Period: ${since} to now`,
        '',
        `## Activity`,
        `- Events: ${recent.length}`,
        `- Claims: ${claims.length}`,
        `- Status changes: ${taskStatusChanges.length}`,
        `- Completions: ${completions.length}`,
        '',
        '## Recent Status Changes',
        ...taskStatusChanges.slice(-10).map((e) => `- **${e.task_id || 'unknown'}**: ${e.status || ''} (${e.agent || 'unknown agent'})`),
        '',
        '## Completed Tasks',
        ...completions.slice(-10).map((e) => `- **${e.task_id}**`),
      ];
      return {
        messages: [
          { role: 'user', content: { type: 'text', text: lines.join('\n') } },
        ],
      };
    }

    case 'retrospective': {
      const eventsPath2 = path.join(args.cwd as string || process.cwd(), '.alp', '.runtime', 'log.jsonl');
      let allEvents: any[] = [];
      if (fs.existsSync(eventsPath2)) {
        const raw = fs.readFileSync(eventsPath2, 'utf-8');
        for (const line of raw.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try { allEvents.push(JSON.parse(trimmed)); } catch { /* skip */ }
        }
      }
      const completed = allEvents.filter((e) => e.type === 'task_status' && e.status === '[x]');
      const failed = allEvents.filter((e) => e.type === 'task_status' && e.status === '[!]');
      const handoffs = allEvents.filter((e) => e.type === 'human_handoff' || (e.type === 'task_status' && e.status === '[?]'));
      const failedTasks = [...new Set(failed.map((e) => e.task_id).filter(Boolean))];
      const handoffTasks = [...new Set(handoffs.map((e) => e.task_id).filter(Boolean))];
      const lines2 = [
        '# Sprint Retrospective',
        '',
        `Total events analyzed: ${allEvents.length}`,
        '',
        '## Summary',
        `- Completed: ${completed.length}`,
        `- Failed: ${failed.length}`,
        `- Human handoffs: ${handoffs.length}`,
        '',
        '## Failure Hotspots',
        ...failedTasks.map((tid) => `- **${tid}**`),
        '',
        '## Handoff Points',
        ...handoffTasks.map((tid) => `- **${tid}**`),
        '',
        '## Recommendations',
        ...failedTasks.length
          ? ['- Review failed tasks for common blockers.', '- Consider breaking down large tasks.']
          : ['- No failures detected. Good momentum!'],
        ...handoffs.length
          ? ['- Reduce human handoffs by clarifying task acceptance criteria.']
          : [],
      ];
      return {
        messages: [
          { role: 'user', content: { type: 'text', text: lines2.join('\n') } },
        ],
      };
    }

    default:
      return {
        messages: [{ role: 'user', content: { type: 'text', text: `Prompt "${promptName}" not found.` } }],
        isError: true,
      };
  }
});

// ─── Resource Subscription Handlers ───────────────────────────────────────
server.setRequestHandler(SubscribeRequestSchema, async (request) => {
  const uri = request.params.uri;
  if (!subscribers.has(uri)) {
    subscribers.set(uri, new Set());
  }
  subscribers.get(uri)!.add(() => {});
  startSubscriptionPolling(process.cwd());
  return {};
});

server.setRequestHandler(UnsubscribeRequestSchema, async (request) => {
  const uri = request.params.uri;
  const cbs = subscribers.get(uri);
  if (cbs) {
    cbs.clear();
    subscribers.delete(uri);
  }
  if (subscribers.size === 0) {
    stopSubscriptionPolling();
  }
  return {};
});

// ─── Helpers ──────────────────────────────────────────────────────────────
function validateDirectory(dir: string, errors: string[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const parser = new AlpParser();
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      validateDirectory(fullPath, errors);
    } else if (entry.name.endsWith('.alp')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        parser.parseAndValidate(content);
      } catch (err: any) {
        errors.push(`❌ ${fullPath}: ${err.message}`);
      }
    }
  }
}

// ─── Resources ─────────────────────────────────────────────────────────────
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const cwd = process.cwd();
  const alpDir = path.join(cwd, '.alp');
  const resources: any[] = [];
  
  if (fs.existsSync(alpDir)) {
    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(fullPath);
        else if (fullPath.endsWith('.alp')) {
          resources.push({
            uri: `file://${fullPath}`,
            name: path.relative(cwd, fullPath),
            mimeType: 'text/plain'
          });
        }
      }
    };
    walk(alpDir);
  }
  
  return { resources };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  if (uri.startsWith('file://')) {
    const filePath = uri.substring(7);
    if (fs.existsSync(filePath)) {
      return {
        contents: [{
          uri,
          mimeType: 'text/plain',
          text: fs.readFileSync(filePath, 'utf8')
        }]
      };
    }
  }
  throw new Error(`Resource not found: ${uri}`);
});

// ─── Start Server ─────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ALP MCP Server running on stdio');
}

main().catch(console.error);


