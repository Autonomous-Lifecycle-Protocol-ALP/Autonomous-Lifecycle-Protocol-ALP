import { AlpGraph } from '@autonomous-lifecycle-protocol-alp/parser';
import { DocumentValidator } from '@autonomous-lifecycle-protocol-alp/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { loadWorkspace, validateDirectory } from '../workspace';

export const toolDefinitions = [
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
];

export function callTool(name: string, args: Record<string, any>, cwd: string) {
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

      const objects = loadWorkspace(cwd);
      const validator = new DocumentValidator();
      for (const obj of objects) {
        try {
          validator.validate({ _type: obj._type, id: obj.id || 'unnamed', properties: obj });
        } catch (err: any) {
          errors.push(`⚠️ Document validation issue [${obj.id}]: ${err.message}`);
        }
      }

      if (errors.length === 0) {
        return {
          content: [{ type: 'text', text: `✅ All ALP files and ${objects.length} objects are valid.` }],
        };
      }
      return {
        content: [{ type: 'text', text: errors.join('\n') }],
        isError: errors.some(e => e.startsWith('❌')),
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

      let results: any[];
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

    default:
      return null;
  }
}
