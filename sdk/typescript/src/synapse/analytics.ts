import { SynapseTopology, SynapseStats } from './types.js';

export class Analytics {
  public computeStats(
    nodes: any[],
    edges: any[],
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
}
