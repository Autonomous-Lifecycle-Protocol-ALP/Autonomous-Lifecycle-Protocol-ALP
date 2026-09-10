import React, { useState } from 'react';
import { CRDTCanvasEngine, CanvasEdge } from '@autonomous-lifecycle-protocol-alp/parser';
import { Peer, CanvasNode } from './shared.js';
import { Toolbar } from './Toolbar.js';
import { CanvasView } from './CanvasView.js';
import { ObjectInspector } from './ObjectInspector.js';

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a14', color: '#e0e0e0', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e2035', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}><Icon name="palette" size={20} color="#a78bfa" /></span>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#a78bfa' }}>CRDT Multiplayer Canvas</span>
          <span style={{ fontSize: 11, background: '#a78bfa22', color: '#a78bfa', padding: '2px 8px', borderRadius: 10 }}>v64.0.0</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {peers.map(p => (
            <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 16, background: p.color + '22', color: p.color, fontSize: 12, fontWeight: 600, border: `1px solid ${p.color}44` }}>
              ● {p.name}
            </span>
          ))}
          <button onClick={exportSnapshot} style={{ background: '#10b981', border: 'none', borderRadius: 6, color: '#fff', padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginLeft: 8 }}>
            Export CRDT Snapshot
          </button>
        </div>
      </div>

      <Toolbar
        newNodeTitle={newNodeTitle}
        newNodeType={newNodeType}
        onTitleChange={setNewNodeTitle}
        onTypeChange={setNewNodeType}
        onAddNode={addNode}
      />

      <CanvasView
        nodes={nodes}
        edges={edges}
        peers={peers}
        selectedNode={selectedNode}
        snapshotJson={snapshotJson}
        onSelectNode={setSelectedNode}
        onDismissSnapshot={() => setSnapshotJson(null)}
      />

      <ObjectInspector
        snapshotJson={snapshotJson}
        onDismissSnapshot={() => setSnapshotJson(null)}
      />
    </div>
  );
}
