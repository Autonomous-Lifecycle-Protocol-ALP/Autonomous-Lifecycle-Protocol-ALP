import { MacroEngine, MacroDefinition, MemoryMeshEngine, MemoryQueryResult } from '@autonomous-lifecycle-protocol-alp/parser';
import * as fs from 'fs';
import * as path from 'path';
import { loadWorkspace } from '../workspace';

export const toolDefinitions = [
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
];

export function callTool(name: string, args: Record<string, any>, cwd: string) {
  switch (name) {
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

    default:
      return null;
  }
}
