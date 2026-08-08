import React, { useState } from 'react';
import { Icon } from './Icon.js';
import { CRDTCanvasEngine, CanvasEdge } from '@autonomous-lifecycle-protocol-alp/parser';

interface Peer {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

interface CanvasNode {
  id: string;
  title: string;
  type: 'TASK' | 'POLICY' | 'AGENT' | 'NOTE';
  x: number;
  y: number;
  content: string;
  version: number;
}

const TYPE_COLORS: Record<string, string> = {
  TASK: '#4fc3f7',
  POLICY: '#aed581',
  AGENT: '#ff8a65',
  NOTE: '#ffd54f',
};

export function CRDTCanvasPanel(): React.JSX.Element {
  const [engine] = useState(() => new CRDTCanvasEngine('canvas-main'));
  const [peers] = useState<Peer[]>([
    { id: 'p1', name: 'Alice (Lead)', color: '#ff4081', x: 140, y: 220 },
    { id: 'p2', name: 'Bob (Agent Copilot)', color: '#4fc3f7', x: 380, y: 150 },
    { id: 'p3', name: 'Carol (DevOps)', color: '#aed581', x: 260, y: 340 },
  ]);

  const [nodes, setNodes] = useState<CanvasNode[]>([
    { id: 'n1', title: '@policy { allow: ["/api/*"] }', type: 'POLICY', x: 80, y: 180, content: 'Governance Rule', version: 3 },
    { id: 'n2', title: '@task { id: "build", status: "DOING" }', type: 'TASK', x: 340, y: 120, content: 'Compile & bundle', version: 5 },
    { id: 'n3', title: '@agent { role: "BFT Validator" }', type: 'AGENT', x: 220, y: 300, content: 'Consensus node', version: 2 },
  ]);

  const [edges, setEdges] = useState<CanvasEdge[]>([
    { edgeId: 'e1', fromNodeId: 'n1', toNodeId: 'n2', type: 'GOVERNED_BY', label: 'governs' },
    { edgeId: 'e2', fromNodeId: 'n3', toNodeId: 'n2', type: 'ASSIGNED_TO', label: 'executes' },
  ]);

  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const [newNodeType, setNewNodeType] = useState<'TASK' | 'POLICY' | 'AGENT' | 'NOTE'>('TASK');
  const [snapshotJson, setSnapshotJson] = useState<string | null>(null);

  const addNode = () => {
    if (!newNodeTitle.trim()) return;
    const id = `node-${Date.now()}`;
    const x = 150 + Math.random() * 200;
    const y = 100 + Math.random() * 200;

    const created = engine.applyNodeEdit(id, newNodeTitle, newNodeType, { x, y }, 'New CRDT node');

    setNodes(prev => [...prev, {
      id: created.nodeId,
      title: created.title,
      type: created.type,
      x: created.position.x,
      y: created.position.y,
      content: created.content,
      version: created.version,
    }]);

    setNewNodeTitle('');
  };

  const exportSnapshot = () => {
    nodes.forEach(n => engine.applyNodeEdit(n.id, n.title, n.type, { x: n.x, y: n.y }, n.content));
    edges.forEach(e => engine.addEdge(e.fromNodeId, e.toNodeId, e.type, e.label));
    const snap = engine.exportCanvas();
    setSnapshotJson(JSON.stringify(snap, null, 2));
  };

  const styles = {
    container: { display: 'flex', flexDirection: 'column' as const, height: '100%', background: '#0a0a14', color: '#e0e0e0', fontFamily: 'Inter, sans-serif' },
    header: { padding: '12px 16px', borderBottom: '1px solid #1e2035', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    toolbar: { padding: '8px 16px', borderBottom: '1px solid #1e2035', background: '#121324', display: 'flex', alignItems: 'center', gap: 10 },
    canvas: { flex: 1, position: 'relative' as const, overflow: 'hidden', background: '#0a0a14' },
    nodeCard: (type: string, isSelected: boolean) => ({
      position: 'absolute' as const,
      width: 180,
      padding: 12,
      borderRadius: 8,
      background: '#16182a',
      border: `2px solid ${isSelected ? '#a78bfa' : TYPE_COLORS[type] || '#4fc3f7'}`,
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      cursor: 'pointer',
      userSelect: 'none' as const,
      zIndex: 2,
    }),
    peerBadge: (color: string) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 16,
      background: color + '22',
      color,
      fontSize: 12,
      fontWeight: 600,
      border: `1px solid ${color}44`,
    }),
    cursorMarker: (color: string) => ({
      position: 'absolute' as const,
      width: 12,
      height: 12,
      borderRadius: '50%',
      background: color,
      boxShadow: `0 0 10px ${color}`,
      pointerEvents: 'none' as const,
      transform: 'translate(-50%, -50%)',
      zIndex: 3,
    }),
    input: { background: '#16182a', border: '1px solid #2a2d4a', borderRadius: 6, color: '#e0e0e0', padding: '6px 10px', fontSize: 13 },
    btn: { background: '#a78bfa', border: 'none', borderRadius: 6, color: '#fff', padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  };

  const getNodeCenter = (id: string) => {
    const n = nodes.find(x => x.id === id);
    if (!n) return { x: 0, y: 0 };
    return { x: n.x + 90, y: n.y + 40 };
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}><Icon name="palette" size={20} color="#a78bfa" /></span>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#a78bfa' }}>CRDT Multiplayer Canvas</span>
          <span style={{ fontSize: 11, background: '#a78bfa22', color: '#a78bfa', padding: '2px 8px', borderRadius: 10 }}>v64.0.0</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {peers.map(p => (
            <span key={p.id} style={styles.peerBadge(p.color)}>
              ● {p.name}
            </span>
          ))}
          <button onClick={exportSnapshot} style={{ ...styles.btn, background: '#10b981', marginLeft: 8 }}>
            Export CRDT Snapshot
          </button>
        </div>
      </div>

      <div style={styles.toolbar}>
        <input
          placeholder="Node title (@policy, @task, etc.)"
          value={newNodeTitle}
          onChange={e => setNewNodeTitle(e.target.value)}
          style={{ ...styles.input, flex: 1 }}
        />
        <select value={newNodeType} onChange={e => setNewNodeType(e.target.value as any)} style={styles.input}>
          <option value="TASK">TASK</option>
          <option value="POLICY">POLICY</option>
          <option value="AGENT">AGENT</option>
          <option value="NOTE">NOTE</option>
        </select>
        <button onClick={addNode} style={styles.btn}>
          + Add Node
        </button>
      </div>

      <div style={styles.canvas}>
        {/* Render SVG Edges */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
          {edges.map(e => {
            const p1 = getNodeCenter(e.fromNodeId);
            const p2 = getNodeCenter(e.toNodeId);
            return (
              <g key={e.edgeId}>
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#a78bfa88" strokeWidth="2" strokeDasharray="4 4" />
                <text x={(p1.x + p2.x) / 2} y={(p1.y + p2.y) / 2 - 6} fill="#a78bfa" fontSize="10" textAnchor="middle" fontWeight="bold">
                  {e.label || e.type}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Render Canvas Nodes */}
        {nodes.map(n => (
          <div
            key={n.id}
            onClick={() => setSelectedNode(n)}
            style={{ ...styles.nodeCard(n.type, selectedNode?.id === n.id), left: n.x, top: n.y }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: TYPE_COLORS[n.type] }}>{n.type}</span>
              <span style={{ fontSize: 10, color: '#6b7280' }}>v{n.version}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', wordBreak: 'break-word' }}>{n.title}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{n.content}</div>
          </div>
        ))}

        {/* Render Live Peer Cursors */}
        {peers.map(p => (
          <div key={p.id} style={{ ...styles.cursorMarker(p.color), left: p.x, top: p.y }}>
            <div style={{ position: 'absolute', top: 14, left: 0, background: p.color, color: '#000', fontSize: 10, fontWeight: 700, padding: '1px 4px', borderRadius: 3, whiteSpace: 'nowrap' }}>
              {p.name}
            </div>
          </div>
        ))}

        {snapshotJson && (
          <div style={{ position: 'absolute', bottom: 16, right: 16, width: 320, background: '#121324', border: '1px solid #10b98144', borderRadius: 8, padding: 12, zIndex: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 700, fontSize: 12, marginBottom: 6 }}>
              <span>CRDT Snapshot JSON</span>
              <button onClick={() => setSnapshotJson(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>✕</button>
            </div>
            <pre style={{ margin: 0, fontSize: 10, maxHeight: 150, overflow: 'auto', background: '#0a0a14', padding: 8, borderRadius: 4 }}>{snapshotJson}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
