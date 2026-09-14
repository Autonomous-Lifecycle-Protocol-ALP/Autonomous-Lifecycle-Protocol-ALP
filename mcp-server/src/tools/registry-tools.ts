import * as fs from 'fs';
import * as path from 'path';
import { loadWorkspace } from '../workspace';

export const toolDefinitions = [
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
];

export function callTool(name: string, args: Record<string, any>, cwd: string) {
  switch (name) {
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

    default:
      return null;
  }
}
