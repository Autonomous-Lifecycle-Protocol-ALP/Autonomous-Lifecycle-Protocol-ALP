import { useMemo } from 'react';
import type { Edge } from 'reactflow';
import type { AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';

interface TopologyMetrics {
  criticalPath: string[];
  maxDepth: number;
  maxParallel: number;
  bottlenecks: { id: string; type: string; score: number }[];
}

export function useTopologyMetrics(parsedObjects: AlpObject[], edges: Edge[]): TopologyMetrics {
  return useMemo(() => {
    if (parsedObjects.length === 0) {
      return { criticalPath: [], maxDepth: 0, maxParallel: 0, bottlenecks: [] };
    }

    const inDegree: Record<string, number> = {};
    const outDegree: Record<string, number> = {};
    const adj: Record<string, string[]> = {};

    parsedObjects.forEach((o) => {
      inDegree[o.id] = 0;
      outDegree[o.id] = 0;
      adj[o.id] = [];
    });

    edges.forEach((e) => {
      if (adj[e.source]) {
        adj[e.source].push(e.target);
        outDegree[e.source] = (outDegree[e.source] || 0) + 1;
      }
      if (inDegree[e.target] !== undefined) {
        inDegree[e.target] = (inDegree[e.target] || 0) + 1;
      }
    });

    const dist: Record<string, number> = {};
    const prev: Record<string, string | null> = {};
    const queue: string[] = [];

    parsedObjects.forEach((o) => {
      if ((inDegree[o.id] || 0) === 0) {
        queue.push(o.id);
        dist[o.id] = 1;
        prev[o.id] = null;
      }
    });

    const levelCount: Record<number, number> = {};

    while (queue.length > 0) {
      const u = queue.shift()!;
      const d = dist[u] || 1;
      levelCount[d] = (levelCount[d] || 0) + 1;

      (adj[u] || []).forEach((v) => {
        if ((dist[v] || 0) < d + 1) {
          dist[v] = d + 1;
          prev[v] = u;
          queue.push(v);
        }
      });
    }

    let maxNode: string | null = null;
    let maxDist = 0;
    Object.entries(dist).forEach(([id, d]) => {
      if (d > maxDist) {
        maxDist = d;
        maxNode = id;
      }
    });

    const criticalPath: string[] = [];
    let curr: string | null = maxNode;
    while (curr) {
      criticalPath.unshift(curr);
      curr = prev[curr] || null;
    }

    const maxParallel = Math.max(1, ...Object.values(levelCount), 1);
    const bottlenecks = parsedObjects
      .map((o) => ({ id: o.id, type: o._type, score: (inDegree[o.id] || 0) + (outDegree[o.id] || 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    return {
      criticalPath,
      maxDepth: maxDist || 1,
      maxParallel,
      bottlenecks,
    };
  }, [parsedObjects, edges]);
}
