/**
 * SynapseEngine — v80.0.0 Synapse Knowledge Graph & Canvas Vault Engine
 *
 * Transforms ALP workspace objects (tasks, policies, agents, contracts, workflows)
 * into an interconnected, bidirectional-linked knowledge graph with:
 * - Markdown notes with YAML frontmatter and [[wikilinks]]
 * - Interactive visual .canvas diagrams (JSON canvas format)
 * - 2D/3D force-directed graph topologies (nodes, edges, clusters)
 * - Graph analytics (central hubs, orphan nodes, critical paths, broken links)
 * - Map of Content (MOC) index generator
 */

import {
  AlpParser,
  AlpObject,
  AlpGraph,
} from '@autonomous-lifecycle-protocol-alp/parser';

// ── Types ───────────────────────────────────────────────────────────────

export interface SynapseNode {
  id: string;
  type: string;
  title: string;
  status?: string;
  owner?: string;
  tags: string[];
  inLinks: string[];
  outLinks: string[];
  properties: Record<string, unknown>;
  color: string;
  degree: number;
  group: number;
}

export interface SynapseEdge {
  source: string;
  target: string;
  label: string;
  relation: 'depends_on' | 'assigned_to' | 'guards' | 'implements' | 'references';
}

export interface SynapseTopology {
  nodes: SynapseNode[];
  edges: SynapseEdge[];
  stats: SynapseStats;
}

export interface SynapseStats {
  totalNodes: number;
  totalEdges: number;
  density: number;
  centralHubs: { id: string; degree: number }[];
  orphanNodes: string[];
  brokenLinks: { source: string; target: string }[];
  byTypeCount: Record<string, number>;
  byStatusCount: Record<string, number>;
}

// ── Canvas JSON Format ──────────────────────────────────────────────────

export interface CanvasNodeData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  type: 'text' | 'file' | 'group';
  text?: string;
  file?: string;
  label?: string;
}

export interface CanvasEdgeData {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide?: 'top' | 'right' | 'bottom' | 'left';
  toSide?: 'top' | 'right' | 'bottom' | 'left';
  label?: string;
  color?: string;
}

export interface SynapseCanvas {
  nodes: CanvasNodeData[];
  edges: CanvasEdgeData[];
}

// ── Vault File Representation ──────────────────────────────────────────

export interface SynapseVaultFile {
  relativePath: string;
  content: string;
}

// ── Color Schemes ───────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  agent: '#8b5cf6', // Purple
  task: '#3b82f6', // Blue
  policy: '#ef4444', // Red
  contract: '#10b981', // Green
  workflow: '#f59e0b', // Amber
  vault: '#06b6d4', // Cyan
  swarm: '#ec4899', // Pink
  timeline: '#6366f1', // Indigo
  tenant_mesh: '#14b8a6', // Teal
  default: '#64748b', // Slate
};

const TYPE_GROUPS: Record<string, number> = {
  agent: 1,
  task: 2,
  policy: 3,
  contract: 4,
  workflow: 5,
  vault: 6,
  swarm: 7,
  timeline: 8,
  tenant_mesh: 9,
  default: 0,
};

// ── Engine ──────────────────────────────────────────────────────────────

export class SynapseEngine {
  private parser: AlpParser;

  constructor() {
    this.parser = new AlpParser();
  }

  /**
   * Build complete Synapse topology from ALP objects.
   */
  public buildTopology(objects: AlpObject[]): SynapseTopology {
    const nodeMap = new Map<string, SynapseNode>();
    const edges: SynapseEdge[] = [];
    const knownIds = new Set(objects.map((o) => o.id));
    const brokenLinks: { source: string; target: string }[] = [];

    // Initialize nodes
    for (const obj of objects) {
      const type = obj._type || 'object';
      const color = TYPE_COLORS[type] || TYPE_COLORS.default;
      const group = TYPE_GROUPS[type] || 0;

      const tags: string[] = [type];
      if (obj.status) tags.push(String(obj.status));
      if ((obj as any).priority) tags.push(String((obj as any).priority));

      nodeMap.set(obj.id, {
        id: obj.id,
        type,
        title: (obj as any).title || obj.id,
        status: obj.status ? String(obj.status) : undefined,
        owner: (obj as any).owner || (obj as any).agent || undefined,
        tags,
        inLinks: [],
        outLinks: [],
        properties: { ...obj },
        color,
        degree: 0,
        group,
      });
    }

    const cleanRef = (raw: unknown): string => {
      if (typeof raw !== 'string') return '';
      return raw.trim().replace(/^(?:->|@|#|\s)+/, '').trim();
    };

    const addEdge = (
      fromId: string,
      toId: string,
      label: string,
      relation: 'depends_on' | 'assigned_to' | 'guards' | 'implements' | 'references'
    ) => {
      const fromNode = nodeMap.get(fromId);
      const toNode = nodeMap.get(toId);
      if (!fromNode || !toNode) {
        brokenLinks.push({ source: fromId, target: toId });
        return;
      }
      // Avoid duplicate edges
      if (
        !edges.some(
          (e) => e.source === fromId && e.target === toId && e.relation === relation
        )
      ) {
        edges.push({ source: fromId, target: toId, label, relation });
        if (!fromNode.outLinks.includes(toId)) fromNode.outLinks.push(toId);
        if (!toNode.inLinks.includes(fromId)) toNode.inLinks.push(fromId);
      }
    };

    // Extract edges and wikilinks
    for (const obj of objects) {
      const sourceId = obj.id;

      // 1. Dependencies (depends, deps, depends_on)
      const deps = (obj as any).depends || (obj as any).deps || (obj as any).depends_on || [];
      const depList = Array.isArray(deps) ? deps : [deps];
      for (const rawTarget of depList) {
        const cleanTarget = cleanRef(rawTarget);
        if (cleanTarget) addEdge(sourceId, cleanTarget, 'depends on', 'depends_on');
      }

      // 2. Agent assignment (owner, agent)
      const owner = (obj as any).owner || (obj as any).agent;
      if (owner) {
        const cleanOwner = cleanRef(owner);
        if (cleanOwner) addEdge(cleanOwner, sourceId, 'executes', 'assigned_to');
      }

      // 3. Policies / Guards
      if (obj._type === 'policy') {
        const guards = (obj as any).guards || (obj as any).targets || [];
        const guardList = Array.isArray(guards) ? guards : [guards];
        for (const rawTarget of guardList) {
          const cleanTarget = cleanRef(rawTarget);
          if (cleanTarget) addEdge(sourceId, cleanTarget, 'guards', 'guards');
        }
      } else {
        const policies = (obj as any).policy || (obj as any).policies || [];
        const polList = Array.isArray(policies) ? policies : [policies];
        for (const rawPol of polList) {
          const cleanPol = cleanRef(rawPol);
          if (cleanPol) addEdge(cleanPol, sourceId, 'guards', 'guards');
        }
      }

      // 4. Contracts (contract, contracts)
      if (obj._type === 'contract') {
        const from = cleanRef((obj as any).from);
        const to = cleanRef((obj as any).to);
        if (from && to) addEdge(from, to, 'contracts', 'references');
        if (to) addEdge(sourceId, to, 'governs', 'implements');
      } else {
        const contracts = (obj as any).contract || (obj as any).contracts || [];
        const conList = Array.isArray(contracts) ? contracts : [contracts];
        for (const rawCon of conList) {
          const cleanCon = cleanRef(rawCon);
          if (cleanCon) addEdge(cleanCon, sourceId, 'governs', 'implements');
        }
      }

      // 5. Vaults (vault, vaults, recipients)
      if (obj._type === 'vault') {
        const recipients = (obj as any).recipients || [];
        const recList = Array.isArray(recipients) ? recipients : [recipients];
        for (const rawRec of recList) {
          const cleanRec = cleanRef(rawRec);
          if (cleanRec) addEdge(sourceId, cleanRec, 'secures', 'references');
        }
      } else {
        const vaults = (obj as any).vault || (obj as any).vaults || [];
        const vList = Array.isArray(vaults) ? vaults : [vaults];
        for (const rawV of vList) {
          const cleanV = cleanRef(rawV);
          if (cleanV) addEdge(cleanV, sourceId, 'secures', 'references');
        }
      }

      // 6. Features, Projects, Workflows
      const feature = cleanRef((obj as any).feature);
      if (feature) addEdge(sourceId, feature, 'part of', 'references');

      const steps = (obj as any).steps || [];
      const stepList = Array.isArray(steps) ? steps : [steps];
      for (const rawStep of stepList) {
        const cleanStep = cleanRef(rawStep);
        if (cleanStep) addEdge(sourceId, cleanStep, 'executes step', 'references');
      }
    }

    // Compute degree centrality
    const nodes = Array.from(nodeMap.values());
    for (const node of nodes) {
      node.degree = node.inLinks.length + node.outLinks.length;
    }

    // Compute statistics
    const stats = this.computeStats(nodes, edges, brokenLinks);

    return { nodes, edges, stats };
  }

  /**
   * Export all objects into a Synapse Markdown Vault with [[wikilinks]].
   */
  public generateVault(objects: AlpObject[]): SynapseVaultFile[] {
    const topology = this.buildTopology(objects);
    const files: SynapseVaultFile[] = [];

    // Individual notes
    for (const node of topology.nodes) {
      const markdown = this.renderMarkdownNote(node, topology);
      files.push({
        relativePath: `${node.type}s/${node.id}.md`,
        content: markdown,
      });
    }

    // Map of Content (MOC.md) / index.md
    files.push({
      relativePath: 'MOC.md',
      content: this.renderMOC(topology),
    });

    // Canvas visual diagram
    files.push({
      relativePath: 'synapse.canvas',
      content: JSON.stringify(this.generateCanvas(topology), null, 2),
    });

    return files;
  }

  /**
   * Generate an interactive JSON Canvas (.canvas) from topology.
   */
  public generateCanvas(topology: SynapseTopology): SynapseCanvas {
    const canvasNodes: CanvasNodeData[] = [];
    const canvasEdges: CanvasEdgeData[] = [];

    const nodesByType = new Map<string, SynapseNode[]>();
    for (const node of topology.nodes) {
      const list = nodesByType.get(node.type) || [];
      list.push(node);
      nodesByType.set(node.type, list);
    }

    const COL_WIDTH = 340;
    const ROW_HEIGHT = 160;
    const X_GAP = 120;
    const Y_GAP = 60;

    let colIndex = 0;

    for (const [type, groupNodes] of nodesByType) {
      const colX = colIndex * (COL_WIDTH + X_GAP);

      // Create group container node
      const groupHeight = Math.max(groupNodes.length * (ROW_HEIGHT + Y_GAP) + 80, 240);
      canvasNodes.push({
        id: `group-${type}`,
        type: 'group',
        label: `${type.toUpperCase()} (${groupNodes.length})`,
        x: colX - 20,
        y: -60,
        width: COL_WIDTH + 40,
        height: groupHeight,
        color: TYPE_COLORS[type] || TYPE_COLORS.default,
      });

      // Place nodes in column
      groupNodes.forEach((node, rowIndex) => {
        const nodeY = rowIndex * (ROW_HEIGHT + Y_GAP);
        const statusBadge = node.status ? ` [${node.status}]` : '';
        const ownerLine = node.owner ? `\n👤 [[${node.owner}]]` : '';
        const depsLine =
          node.outLinks.length > 0
            ? `\n🔗 ${node.outLinks.map((d) => `[[${d}]]`).join(', ')}`
            : '';

        canvasNodes.push({
          id: node.id,
          type: 'text',
          text: `### ${node.id}${statusBadge}${ownerLine}${depsLine}`,
          x: colX,
          y: nodeY,
          width: COL_WIDTH,
          height: ROW_HEIGHT,
          color: node.color,
        });
      });

      colIndex++;
    }

    // Canvas edges
    let edgeCounter = 0;
    for (const edge of topology.edges) {
      canvasEdges.push({
        id: `edge-${edgeCounter++}`,
        fromNode: edge.source,
        toNode: edge.target,
        fromSide: 'right',
        toSide: 'left',
        label: edge.label,
      });
    }

    return { nodes: canvasNodes, edges: canvasEdges };
  }

  /**
   * Export to Mermaid diagram string.
   */
  public toMermaid(topology: SynapseTopology): string {
    const lines: string[] = ['flowchart LR'];

    // Subgraphs by type
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

    // Edges
    for (const edge of topology.edges) {
      const s = this.sanitizeId(edge.source);
      const t = this.sanitizeId(edge.target);
      lines.push(`  ${s} -->|${edge.label}| ${t}`);
    }

    return lines.join('\n');
  }

  /**
   * Export to Graphviz DOT format.
   */
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

  // ── Private ───────────────────────────────────────────────────────────

  private renderMarkdownNote(node: SynapseNode, topology: SynapseTopology): string {
    const frontmatter = [
      '---',
      `id: "${node.id}"`,
      `type: "${node.type}"`,
      node.status ? `status: "${node.status}"` : null,
      node.owner ? `owner: "${node.owner}"` : null,
      `tags: [${node.tags.map((t) => `"${t}"`).join(', ')}]`,
      `degree: ${node.degree}`,
      '---',
    ].filter(Boolean).join('\n');

    const sections: string[] = [
      frontmatter,
      '',
      `# @${node.type} \`${node.id}\``,
      '',
    ];

    if (node.status) sections.push(`**Status**: \`${node.status}\`  `);
    if (node.owner) sections.push(`**Owner**: [[${node.owner}]]  `);
    if (node.tags.length > 0) sections.push(`**Tags**: ${node.tags.map((t) => `#${t}`).join(' ')}  `);
    sections.push('');

    // Outbound Wikilinks
    if (node.outLinks.length > 0) {
      sections.push('## Outgoing Links (Dependencies / Calls)');
      for (const target of node.outLinks) {
        const targetNode = topology.nodes.find((n) => n.id === target);
        const typeNote = targetNode ? ` *(@${targetNode.type})*` : '';
        sections.push(`- [[${target}]]${typeNote}`);
      }
      sections.push('');
    }

    // Inbound Wikilinks (Backlinks)
    if (node.inLinks.length > 0) {
      sections.push('## Backlinks (Referenced By)');
      for (const src of node.inLinks) {
        const srcNode = topology.nodes.find((n) => n.id === src);
        const typeNote = srcNode ? ` *(@${srcNode.type})*` : '';
        sections.push(`- [[${src}]]${typeNote}`);
      }
      sections.push('');
    }

    // Local Context Diagram (Mermaid)
    const localEdges = topology.edges.filter(
      (e) => e.source === node.id || e.target === node.id
    );
    if (localEdges.length > 0) {
      sections.push('## Local Topology');
      sections.push('```mermaid');
      sections.push('flowchart LR');
      for (const e of localEdges) {
        const s = this.sanitizeId(e.source);
        const t = this.sanitizeId(e.target);
        const sLabel = e.source === node.id ? `:::focus["${e.source}"]` : `["${e.source}"]`;
        const tLabel = e.target === node.id ? `:::focus["${e.target}"]` : `["${e.target}"]`;
        sections.push(`  ${s}${sLabel} -->|${e.label}| ${t}${tLabel}`);
      }
      sections.push('  classDef focus fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff;');
      sections.push('```');
      sections.push('');
    }

    // Raw properties table
    sections.push('## Properties');
    sections.push('| Key | Value |');
    sections.push('| --- | --- |');
    for (const [k, v] of Object.entries(node.properties)) {
      if (k.startsWith('_') || k === 'id') continue;
      const valStr = typeof v === 'object' ? JSON.stringify(v) : String(v);
      sections.push(`| \`${k}\` | \`${valStr}\` |`);
    }

    return sections.join('\n');
  }

  private renderMOC(topology: SynapseTopology): string {
    const lines: string[] = [
      '# 🧠 Synapse Knowledge Graph — Map of Content (MOC)',
      '',
      `> Total Nodes: **${topology.stats.totalNodes}** | Total Edges: **${topology.stats.totalEdges}** | Density: **${(topology.stats.density * 100).toFixed(1)}%**`,
      '',
      '---',
      '',
      '## 🌟 Central Hub Nodes (High Degree Centrality)',
    ];

    for (const hub of topology.stats.centralHubs.slice(0, 5)) {
      const node = topology.nodes.find((n) => n.id === hub.id);
      lines.push(`- **[[${hub.id}]]** (@${node?.type || 'unknown'}): ${hub.degree} connections`);
    }

    lines.push('');
    lines.push('## 📑 Entities by Type');

    const byType = new Map<string, SynapseNode[]>();
    for (const node of topology.nodes) {
      const list = byType.get(node.type) || [];
      list.push(node);
      byType.set(node.type, list);
    }

    for (const [type, nodes] of byType) {
      lines.push(`### @${type} (${nodes.length})`);
      for (const node of nodes) {
        const status = node.status ? ` \`[${node.status}]\`` : '';
        const owner = node.owner ? ` *(owner: [[${node.owner}]])*` : '';
        lines.push(`- [[${node.id}]]${status}${owner}`);
      }
      lines.push('');
    }

    if (topology.stats.orphanNodes.length > 0) {
      lines.push('## ⚠️ Orphan Nodes (0 Connections)');
      for (const orphan of topology.stats.orphanNodes) {
        lines.push(`- [[${orphan}]]`);
      }
      lines.push('');
    }

    if (topology.stats.brokenLinks.length > 0) {
      lines.push('## 🚨 Broken References');
      for (const broken of topology.stats.brokenLinks) {
        lines.push(`- [[${broken.source}]] references non-existent \`[[${broken.target}]]\``);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private computeStats(
    nodes: SynapseNode[],
    edges: SynapseEdge[],
    brokenLinks: { source: string; target: string }[]
  ): SynapseStats {
    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    const maxEdges = totalNodes > 1 ? totalNodes * (totalNodes - 1) : 1;
    const density = totalNodes > 1 ? totalEdges / maxEdges : 0;

    const centralHubs = [...nodes]
      .sort((a, b) => b.degree - a.degree)
      .map((n) => ({ id: n.id, degree: n.degree }));

    const orphanNodes = nodes.filter((n) => n.degree === 0).map((n) => n.id);

    const byTypeCount: Record<string, number> = {};
    const byStatusCount: Record<string, number> = {};

    for (const n of nodes) {
      byTypeCount[n.type] = (byTypeCount[n.type] || 0) + 1;
      if (n.status) {
        byStatusCount[n.status] = (byStatusCount[n.status] || 0) + 1;
      }
    }

    return {
      totalNodes,
      totalEdges,
      density,
      centralHubs,
      orphanNodes,
      brokenLinks,
      byTypeCount,
      byStatusCount,
    };
  }

  private sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
  }
}
