import { SynapseTopology, SynapseVaultFile } from './types.js';
import { CanvasDiagram } from './canvas-diagram.js';

export class MarkdownVault {
  private sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  public generateVault(topology: SynapseTopology): SynapseVaultFile[] {
    const files: SynapseVaultFile[] = [];

    for (const node of topology.nodes) {
      const markdown = this.renderMarkdownNote(node, topology);
      files.push({
        relativePath: `${node.type}s/${node.id}.md`,
        content: markdown,
      });
    }

    files.push({
      relativePath: 'MOC.md',
      content: this.renderMOC(topology),
    });

    files.push({
      relativePath: 'synapse.canvas',
      content: JSON.stringify(new CanvasDiagram().generateCanvas(topology), null, 2),
    });

    return files;
  }

  private renderMarkdownNote(node: any, topology: SynapseTopology): string {
    const frontmatter = [
      '---',
      `id: "${node.id}"`,
      `type: "${node.type}"`,
      node.status ? `status: "${node.status}"` : null,
      node.owner ? `owner: "${node.owner}"` : null,
      `tags: [${node.tags.map((t: string) => `"${t}"`).join(', ')}]`,
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
    if (node.tags.length > 0) sections.push(`**Tags**: ${node.tags.map((t: string) => `#${t}`).join(' ')}  `);
    sections.push('');

    if (node.outLinks.length > 0) {
      sections.push('## Outgoing Links (Dependencies / Calls)');
      for (const target of node.outLinks) {
        const targetNode = topology.nodes.find((n) => n.id === target);
        const typeNote = targetNode ? ` *(@${targetNode.type})*` : '';
        sections.push(`- [[${target}]]${typeNote}`);
      }
      sections.push('');
    }

    if (node.inLinks.length > 0) {
      sections.push('## Backlinks (Referenced By)');
      for (const src of node.inLinks) {
        const srcNode = topology.nodes.find((n) => n.id === src);
        const typeNote = srcNode ? ` *(@${srcNode.type})*` : '';
        sections.push(`- [[${src}]]${typeNote}`);
      }
      sections.push('');
    }

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

    const byType = new Map<string, any[]>();
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
}
