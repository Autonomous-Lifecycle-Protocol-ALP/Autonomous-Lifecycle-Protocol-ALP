import {
  SynapseTopology,
  SynapseNode,
  SynapseCanvas,
  CanvasNodeData,
  CanvasEdgeData,
} from './types.js';

const TYPE_COLORS: Record<string, string> = {
  agent: '#8b5cf6',
  task: '#3b82f6',
  policy: '#ef4444',
  contract: '#10b981',
  workflow: '#f59e0b',
  vault: '#06b6d4',
  swarm: '#ec4899',
  timeline: '#6366f1',
  tenant_mesh: '#14b8a6',
  default: '#64748b',
};

export class CanvasDiagram {
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

      groupNodes.forEach((node, rowIndex) => {
        const nodeY = rowIndex * (ROW_HEIGHT + Y_GAP);
        const statusBadge = node.status ? ` [${node.status}]` : '';
        const ownerLine = node.owner ? `\n👤 [[${node.owner}]]` : '';
        const depsLine =
          node.outLinks.length > 0
            ? `\n🔗 ${node.outLinks.map((d: string) => `[[${d}]]`).join(', ')}`
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
}
