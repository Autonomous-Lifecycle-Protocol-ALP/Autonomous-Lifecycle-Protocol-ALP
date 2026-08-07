import React, { useState } from 'react';
import { Icon } from './Icon.js';

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
  const [peers, setPeers] = useState<Peer[]>([
    { id: 'p1', name: 'Alice (Lead)', color: '#ff4081', x: 140, y: 220 },
    { id: 'p2', name: 'Bob (Agent Copilot)', color: '#4fc3f7', x: 380, y: 150 },
    { id: 'p3', name: 'Carol (DevOps)', color: '#aed581', x: 260, y: 340 },
  ]);

  const [nodes, setNodes] = useState<CanvasNode[]>([
    { id: 'n1', title: '@policy { allow: ["/api/*"] }', type: 'POLICY', x: 80, y: 180, content: 'Governance Rule', version: 3 },
    { id: 'n2', title: '@task { id: "build", status: "DOING" }', type: 'TASK', x: 340, y: 120, content: 'Compile & bundle', version: 5 },
    { id: 'n3', title: '@agent { role: "BFT Validator" }', type: 'AGENT', x: 220, y: 300, content: 'Consensus node', version: 2 },
  ]);

  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const [newNodeType, setNewNodeType] = useState<'TASK' | 'POLICY' | 'AGENT' | 'NOTE'>('TASK');

  const addNode = () => {
    if (!newNodeTitle.trim()) return;
    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      title: newNodeTitle,
      type: newNodeType,
      x: 150 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      content: 'New node content',
      version: 1,
    };
    setNodes(prev => [...prev, newNode]);
    setNewNodeTitle('');
  };

  const styles = {
    container: { display: 'flex', flexDirection: 'column' as const, height: '100%', background: '#0a0a14', color: '#e0e0e0', fontFamily: 'Inter, sans-serif' },
    header: { padding: '12px 16px', borderBottom: '1px solid #1e2035', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    toolbar: { padding: '8px 16px', borderBottom: '1px solid #1e2035', background: '#121324', display: 'flex', alignItems: 'center', gap: 10 },
    canvas: { flex: 1, position: 'relative' as const, overflow: 'hidden', backgroundRadial: 'circle at 50% 50%, #16182e 0%, #0a0a14 100%' },
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
    }),
    input: { background: '#16182a', border: '1px solid #2a2d4a', borderRadius: 6, color: '#e0e0e0', padding: '6px 10px', fontSize: 13 },
    btn: { background: '#a78bfa', border: 'none', borderRadius: 6, color: '#fff', padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}><Icon name="palette" size={20} color="#a78bfa" /></span>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#a78bfa' }}>CRDT Multiplayer Canvas</span>
          <span style={{ fontSize: 11, background: '#a78bfa22', color: '#a78bfa', padding: '2px 8px', borderRadius: 10 }}>v64.0.0</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {peers.map(p => (
            <span key={p.id} style={styles.peerBadge(p.color)}>
              ● {p.name}
            </span>
          ))}
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
      </div>
    </div>
  );
}
