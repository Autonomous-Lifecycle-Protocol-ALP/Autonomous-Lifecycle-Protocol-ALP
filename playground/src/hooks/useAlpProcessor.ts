import { useCallback, useRef } from 'react';
import { AlpParser, AlpGraph } from '@autonomous-lifecycle-protocol-alp/parser';
import type { AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';
import { MarkerType } from 'reactflow';
import type { Edge, Node } from 'reactflow';
import { applyForceLayout, applyCircularLayout } from './layouts.js';

type LayoutMode = 'dag' | 'tree' | 'grid' | 'force' | 'circular';

interface ProcessResult {
  nodes: Node[];
  edges: Edge[];
  logs: string[];
  error: string | null;
  topoOrder: string[];
  hasCycle: boolean;
}

interface UseAlpProcessorOptions {
  onSuccess: (result: ProcessResult) => void;
  onError: (error: string) => void;
}

export function useAlpProcessor({ onSuccess, onError }: UseAlpProcessorOptions) {
  const processTimerRef = useRef<number | undefined>(undefined);

  const processCode = useCallback(
    (code: string, _parsedObjects: AlpObject[], currentLayout: LayoutMode) => {
      if (processTimerRef.current) {
        clearTimeout(processTimerRef.current);
      }
      processTimerRef.current = window.setTimeout(() => {
        const logs: string[] = [];
        try {
          const parser = new AlpParser();
          const objects = parser.parseAndValidate(code);
          const graph = new AlpGraph();
          graph.buildGraph(objects);

          logs.push(`[INFO] Parsed ${objects.length} objects`);
          logs.push(`[INFO] Discovered ${graph.edges.length} edges`);

          const blockedCount = objects.filter((o) => o.status && o.status.includes('[!]')).length;
          const inProgressCount = objects.filter((o) => o.status && o.status.includes('[~]')).length;

          if (blockedCount > 0) logs.push(`[WARN] ${blockedCount} blocked object(s) detected`);
          if (inProgressCount > 0) logs.push(`[INFO] ${inProgressCount} in-progress item(s)`);

          const edgeList: { from: string; to: string; type: string }[] = [];
          const inDegree: Record<string, number> = {};
          const adj: Record<string, string[]> = {};

          objects.forEach((obj) => {
            inDegree[obj.id] = 0;
            adj[obj.id] = [];
          });

          graph.edges.forEach((e) => {
            edgeList.push({ from: e.source, to: e.target, type: e.type });
            if (adj[e.source]) adj[e.source].push(e.target);
            if (inDegree[e.target] !== undefined) inDegree[e.target] += 1;
          });

          const depth: Record<string, number> = {};
          const queue: string[] = [];
          const topoOrder: string[] = [];

          Object.keys(inDegree).forEach((id) => {
            if (inDegree[id] === 0) {
              queue.push(id);
              depth[id] = 0;
            }
          });

          let processed = 0;
          while (queue.length > 0) {
            const curr = queue.shift()!;
            topoOrder.push(curr);
            processed++;
            const d = depth[curr];
            (adj[curr] || []).forEach((next) => {
              depth[next] = Math.max(depth[next] || 0, d + 1);
              inDegree[next] -= 1;
              if (inDegree[next] === 0) queue.push(next);
            });
          }

          const hasCycle = processed < objects.length;
          if (hasCycle) {
            logs.push('[ERROR] Cyclic dependency detected in graph');
          } else {
            logs.push('[OK] DAG verified: no cycles detected');
          }

          // Calculate positions based on chosen Layout
          const newNodes: Node[] = [];

          if (currentLayout === 'tree') {
            const depthRows: Record<number, AlpObject[]> = {};
            objects.forEach((obj) => {
              const d = depth[obj.id] ?? 0;
              if (!depthRows[d]) depthRows[d] = [];
              depthRows[d].push(obj);
            });

            Object.entries(depthRows).forEach(([dStr, rowObjs]) => {
              const row = parseInt(dStr, 10);
              const rowWidth = rowObjs.length * 240;
              const startX = 400 - rowWidth / 2;
              rowObjs.forEach((obj, idx) => {
                newNodes.push({
                  id: obj.id,
                  type: 'alpNode',
                  position: { x: startX + idx * 240, y: 50 + row * 160 },
                  data: {
                    id: obj.id,
                    type: obj._type,
                    status: obj.status,
                    owner: obj.owner || null,
                    rawObject: obj,
                  },
                });
              });
            });
          } else if (currentLayout === 'grid') {
            const cols = Math.ceil(Math.sqrt(objects.length));
            objects.forEach((obj, idx) => {
              const r = Math.floor(idx / cols);
              const c = idx % cols;
              newNodes.push({
                id: obj.id,
                type: 'alpNode',
                position: { x: 50 + c * 250, y: 50 + r * 140 },
                data: {
                  id: obj.id,
                  type: obj._type,
                  status: obj.status,
                  owner: obj.owner || null,
                  rawObject: obj,
                },
              });
            });
          } else if (currentLayout === 'force') {
            const edgePairs = edgeList.map((e) => ({ source: e.from, target: e.to }));
            const forceNodes = applyForceLayout(objects, edgePairs);
            forceNodes.forEach((nd) => newNodes.push(nd));
          } else if (currentLayout === 'circular') {
            const circNodes = applyCircularLayout(objects);
            circNodes.forEach((nd) => newNodes.push(nd));
          } else {
            // Default: Topological DAG columns
            const columns: Record<number, AlpObject[]> = {};
            objects.forEach((obj) => {
              const d = depth[obj.id] ?? 0;
              if (!columns[d]) columns[d] = [];
              columns[d].push(obj);
            });

            const colWidth = 270;
            const rowHeight = 130;

            Object.entries(columns).forEach(([colStr, colObjects]) => {
              const c = parseInt(colStr, 10);
              colObjects.forEach((obj, r) => {
                newNodes.push({
                  id: obj.id,
                  type: 'alpNode',
                  position: { x: 50 + c * colWidth, y: 50 + r * rowHeight },
                  data: {
                    id: obj.id,
                    type: obj._type,
                    status: obj.status,
                    owner: obj.owner || null,
                    rawObject: obj,
                  },
                });
              });
            });
          }

          const newEdges: Edge[] = edgeList.map((e, idx) => {
            let strokeColor = '#00f0ff';
            if (e.type === 'feature') strokeColor = '#9d4edd';
            if (e.type === 'owner') strokeColor = '#3b82f6';
            if (e.type === 'requires') strokeColor = '#f59e0b';
            if (e.type === 'policy') strokeColor = '#10b981';
            if (e.type === 'contract') strokeColor = '#f59e0b';
            if (e.type === 'vault') strokeColor = '#f43f5e';

            return {
              id: `edge-${idx}`,
              source: e.from,
              target: e.to,
              label: e.type,
              type: 'smoothstep',
              animated: e.type === 'depends_on' || e.type === 'requires',
              style: { stroke: strokeColor, strokeWidth: 2 },
              labelStyle: { fill: '#8a94b0', fontSize: 10, fontFamily: 'JetBrains Mono' },
              labelBgStyle: { fill: '#131625', fillOpacity: 0.8 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: strokeColor,
              },
            };
          });

          onSuccess({
            nodes: newNodes,
            edges: newEdges,
            logs,
            error: hasCycle ? 'Cyclic dependency detected in graph' : null,
            topoOrder,
            hasCycle,
          });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Syntax Error in ALP specification';
          onError(errMsg);
        }
      }, 0);
    },
    [onSuccess, onError]
  );

  return { processCode };
}
