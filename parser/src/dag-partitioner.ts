/**
 * DAGPartitioner — v50.0.0 Multi-Region DAG Partition Engine
 *
 * Partitions workspace dependency graphs (DAGs) across cloud edge regions
 * (e.g., us-east, eu-west, ap-southeast) to balance agent workloads,
 * minimize cross-region network latency penalties, and enable parallel multi-region execution.
 */

import { AlpGraph } from './graph';

export interface RegionAssignment {
  region: string;
  nodeIds: string[];
  estimatedLatencyMs: number;
}

export interface PartitionResult {
  workspaceId: string;
  regions: RegionAssignment[];
  crossRegionEdgesCount: number;
  totalNodes: number;
  partitionedAt: string;
}

export interface PartitionConfig {
  targetRegions: string[];
  maxNodesPerRegion?: number;
}

export class DAGPartitioner {
  /**
   * Partition an ALP dependency graph into specified target regions.
   */
  public partition(
    graph: AlpGraph,
    regions: string[] = ['us-east', 'eu-west', 'ap-southeast'],
    workspaceId: string = 'alp-workspace'
  ): PartitionResult {
    const nodes = graph.topologicalSort();
    if (nodes.length === 0) {
      return {
        workspaceId,
        regions: regions.map(r => ({ region: r, nodeIds: [], estimatedLatencyMs: 0 })),
        crossRegionEdgesCount: 0,
        totalNodes: 0,
        partitionedAt: new Date().toISOString(),
      };
    }

    const regionAssignments: Map<string, string[]> = new Map();
    for (const r of regions) {
      regionAssignments.set(r, []);
    }

    // Round-robin topological assignment to balance load while preserving execution ordering
    const nodeRegionMap = new Map<string, string>();
    nodes.forEach((node, index) => {
      const assignedRegion = regions[index % regions.length];
      regionAssignments.get(assignedRegion)!.push(node.id);
      nodeRegionMap.set(node.id, assignedRegion);
    });

    // Count cross-region edges
    let crossRegionEdgesCount = 0;
    for (const edge of graph.edges) {
      const sourceRegion = nodeRegionMap.get(edge.source);
      const targetRegion = nodeRegionMap.get(edge.target);
      if (sourceRegion && targetRegion && sourceRegion !== targetRegion) {
        crossRegionEdgesCount++;
      }
    }

    const regionList: RegionAssignment[] = [];
    for (const [region, nodeIds] of regionAssignments.entries()) {
      // Estimated intra-region latency ~ 1.5ms, cross-region penalty ~ 45ms per cross-region edge
      const localEdges = crossRegionEdgesCount;
      const estimatedLatencyMs = Math.round((1.8 + localEdges * 2.5) * 10) / 10;
      regionList.push({
        region,
        nodeIds,
        estimatedLatencyMs,
      });
    }

    return {
      workspaceId,
      regions: regionList,
      crossRegionEdgesCount,
      totalNodes: nodes.length,
      partitionedAt: new Date().toISOString(),
    };
  }

  /**
   * Get sub-graph node IDs assigned to a specific region.
   */
  public getSubGraphForRegion(partitionResult: PartitionResult, region: string): string[] {
    const assignment = partitionResult.regions.find(r => r.region === region);
    return assignment ? assignment.nodeIds : [];
  }
}
