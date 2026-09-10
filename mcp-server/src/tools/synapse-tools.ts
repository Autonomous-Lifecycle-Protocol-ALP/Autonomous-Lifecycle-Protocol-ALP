import { SynapseEngine } from '@autonomous-lifecycle-protocol-alp/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { loadWorkspace } from '../workspace';

export const toolDefinitions = [
  {
    name: 'alp_synapse_export',
    description: 'Export ALP workspace as a Synapse Markdown vault with wikilinks and canvas (v80.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        out: { type: 'string', description: 'Output directory (default: .synapse)' },
      },
      required: [],
    },
  },
  {
    name: 'alp_synapse_graph',
    description: 'Generate knowledge graph topology representation (v80.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        format: { type: 'string', description: 'Format: json, dot, mermaid (default json)' },
      },
      required: [],
    },
  },
  {
    name: 'alp_synapse_stats',
    description: 'Display knowledge graph connectivity, density, and hub metrics (v80.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
      },
      required: [],
    },
  },
];

export function callTool(name: string, args: Record<string, any>, cwd: string) {
  switch (name) {
    case 'alp_synapse_export': {
      const objects = loadWorkspace(cwd);
      const engine = new SynapseEngine();
      const topology = engine.buildTopology(objects);
      const vaultFiles = engine.generateVault(objects);
      const canvasData = engine.generateCanvas(topology);

      const outDir = path.resolve(cwd, (args?.out as string) || '.synapse');
      fs.mkdirSync(outDir, { recursive: true });
      for (const file of vaultFiles) {
        const filePath = path.join(outDir, file.relativePath);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, file.content, 'utf-8');
      }
      const canvasPath = path.join(outDir, 'synapse.canvas');
      fs.writeFileSync(canvasPath, JSON.stringify(canvasData, null, 2), 'utf-8');

      return {
        content: [{ type: 'text', text: `Exported ${vaultFiles.length} vault files and synapse.canvas to ${path.relative(cwd, outDir)}/` }],
      };
    }

    case 'alp_synapse_graph': {
      const objects = loadWorkspace(cwd);
      const engine = new SynapseEngine();
      const format = (args?.format as string) || 'json';
      const topology = engine.buildTopology(objects);

      if (format === 'mermaid') {
        const mermaid = engine.toMermaid(topology);
        return { content: [{ type: 'text', text: mermaid }] };
      }
      if (format === 'dot') {
        const dot = engine.toDot(topology);
        return { content: [{ type: 'text', text: dot }] };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify({
          nodes: topology.nodes.map(n => ({ id: n.id, type: n.type, degree: n.degree })),
          edges: topology.edges.map(e => ({ source: e.source, target: e.target, relation: e.relation })),
          stats: topology.stats,
        }, null, 2) }],
      };
    }

    case 'alp_synapse_stats': {
      const objects = loadWorkspace(cwd);
      const engine = new SynapseEngine();
      const topology = engine.buildTopology(objects);

      return {
        content: [{ type: 'text', text: JSON.stringify({
          totalNodes: topology.stats.totalNodes,
          totalEdges: topology.stats.totalEdges,
          density: topology.stats.density,
          centralHubs: topology.stats.centralHubs,
          orphanNodes: topology.stats.orphanNodes,
          brokenLinks: topology.stats.brokenLinks,
          byTypeCount: topology.stats.byTypeCount,
        }, null, 2) }],
      };
    }

    default:
      return null;
  }
}
