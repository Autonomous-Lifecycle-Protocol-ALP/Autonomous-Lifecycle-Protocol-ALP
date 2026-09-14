import type { AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';
import type { Node } from 'reactflow';

interface ForceNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const CX = 500;
const CY = 400;

export function applyCircularLayout(objects: AlpObject[]): Node[] {
  const n = objects.length;
  if (n === 0) return [];
  const radius = Math.max(150, 80 + n * 35);

  return objects.map((obj, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return {
      id: obj.id,
      type: 'alpNode' as const,
      position: { x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle) },
      data: {
        id: obj.id,
        type: obj._type,
        status: obj.status,
        owner: obj.owner || null,
        rawObject: obj,
      },
    };
  });
}

export function applyForceLayout(objects: AlpObject[], edges: Array<{ source: string; target: string }>): Node[] {
  const n = objects.length;
  if (n === 0) return [];

  const radius = Math.max(150, 80 + n * 35);
  const nodes: ForceNode[] = objects.map((obj, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return {
      id: obj.id,
      x: CX + radius * Math.cos(angle),
      y: CY + radius * Math.sin(angle),
      vx: 0,
      vy: 0,
    };
  });

  const nodeMap = new Map<string, number>();
  nodes.forEach((nd, i) => nodeMap.set(nd.id, i));

  const edgePairs: Array<[number, number]> = [];
  const edgeSet = new Set<string>();
  for (const e of edges) {
    const si = nodeMap.get(e.source);
    const ti = nodeMap.get(e.target);
    if (si === undefined || ti === undefined) continue;
    const key = `${Math.min(si, ti)}-${Math.max(si, ti)}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edgePairs.push([si, ti]);
    }
  }

  const ITERATIONS = 150;
  const REPULSION = 8000;
  const ATTRACTION = 0.008;
  const CENTER_GRAVITY = 0.02;
  const DAMPING = 0.85;
  const DT = 0.8;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const fx = new Float64Array(n);
    const fy = new Float64Array(n);

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist2 = dx * dx + dy * dy || 1;
        const dist = Math.sqrt(dist2);
        const force = REPULSION / dist2;
        const fx_ = (force * dx) / dist;
        const fy_ = (force * dy) / dist;
        fx[i] -= fx_;
        fy[i] -= fy_;
        fx[j] += fx_;
        fy[j] += fy_;
      }
    }

    for (const [si, ti] of edgePairs) {
      const dx = nodes[ti].x - nodes[si].x;
      const dy = nodes[ti].y - nodes[si].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = ATTRACTION * dist;
      const fx_ = (force * dx) / dist;
      const fy_ = (force * dy) / dist;
      fx[si] += fx_;
      fy[si] += fy_;
      fx[ti] -= fx_;
      fy[ti] -= fy_;
    }

    for (let i = 0; i < n; i++) {
      fx[i] += CENTER_GRAVITY * (CX - nodes[i].x);
      fy[i] += CENTER_GRAVITY * (CY - nodes[i].y);
    }

    for (let i = 0; i < n; i++) {
      nodes[i].vx = (nodes[i].vx + fx[i] * DT) * DAMPING;
      nodes[i].vy = (nodes[i].vy + fy[i] * DT) * DAMPING;
      nodes[i].x += nodes[i].vx;
      nodes[i].y += nodes[i].vy;
    }
  }

  return nodes.map((nd, idx) => ({
    id: objects[idx].id,
    type: 'alpNode' as const,
    position: { x: nd.x, y: nd.y },
    data: {
      id: objects[idx].id,
      type: objects[idx]._type,
      status: objects[idx].status,
      owner: objects[idx].owner || null,
      rawObject: objects[idx],
    },
  }));
}
