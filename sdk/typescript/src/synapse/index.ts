import { AlpParser, AlpObject, AlpGraph } from '@autonomous-lifecycle-protocol-alp/parser';
import { GraphBuilder } from './graph-builder.js';
import { MarkdownVault } from './markdown-vault.js';
import { CanvasDiagram } from './canvas-diagram.js';
import { Analytics } from './analytics.js';
import type {
  SynapseNode,
  SynapseEdge,
  SynapseTopology,
  SynapseStats,
  CanvasNodeData,
  CanvasEdgeData,
  SynapseCanvas,
  SynapseVaultFile,
} from './types.js';

export type {
  SynapseNode,
  SynapseEdge,
  SynapseTopology,
  SynapseStats,
  CanvasNodeData,
  CanvasEdgeData,
  SynapseCanvas,
  SynapseVaultFile,
};

export class SynapseEngine {
  private parser: AlpParser;
  private graphBuilder: GraphBuilder;
  private markdownVault: MarkdownVault;
  private canvasDiagram: CanvasDiagram;
  private analytics: Analytics;

  constructor() {
    this.parser = new AlpParser();
    this.graphBuilder = new GraphBuilder();
    this.markdownVault = new MarkdownVault();
    this.canvasDiagram = new CanvasDiagram();
    this.analytics = new Analytics();
  }

  public buildTopology(objects: AlpObject[]): SynapseTopology {
    return this.graphBuilder.buildTopology(objects);
  }

  public generateVault(objects: AlpObject[]): SynapseVaultFile[] {
    const topology = this.graphBuilder.buildTopology(objects);
    return this.markdownVault.generateVault(topology);
  }

  public generateCanvas(topology: SynapseTopology): SynapseCanvas {
    return this.canvasDiagram.generateCanvas(topology);
  }

  public toMermaid(topology: SynapseTopology): string {
    const lines: string[] = ['flowchart LR'];
    const byType = new Map<string, SynapseNode[]>();
    for (const node of topology.nodes) {
      const list = byType.get(node.type) || [];
      list.push(node);
      byType.set(node.type, list);
    }

    for (const [type, list] of byType) {
      lines.push(`  subgraph ${type.toUpperCase()}["${type.toUpperCase()}"]`);
      for (const node of list) {
        const label = node.status ? `${node.id} (${node.status})` : node.id;
        lines.push(`    ${this.sanitizeId(node.id)}["${label}"]`);
      }
      lines.push('  end');
    }

    for (const edge of topology.edges) {
      const s = this.sanitizeId(edge.source);
      const t = this.sanitizeId(edge.target);
      lines.push(`  ${s} -->|${edge.label}| ${t}`);
    }

    return lines.join('\n');
  }

  public toDot(topology: SynapseTopology): string {
    const lines: string[] = [
      'digraph SynapseGraph {',
      '  rankdir=LR;',
      '  node [shape=box, style="rounded,filled", fontname="Helvetica"];',
    ];

    for (const node of topology.nodes) {
      const fill = node.color || '#e2e8f0';
      lines.push(`  "${node.id}" [label="${node.id}\\n(${node.type})", fillcolor="${fill}"];`);
    }

    for (const edge of topology.edges) {
      lines.push(`  "${edge.source}" -> "${edge.target}" [label="${edge.label}"];`);
    }

    lines.push('}');
    return lines.join('\n');
  }

  private sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
  }
}
