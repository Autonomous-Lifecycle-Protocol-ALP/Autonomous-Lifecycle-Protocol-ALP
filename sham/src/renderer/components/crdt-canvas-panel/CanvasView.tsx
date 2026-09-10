import React from 'react';
import { CanvasViewProps, TYPE_COLORS, getNodeCenter, styles } from './shared.js';

export function CanvasView({ nodes, edges, peers, selectedNode, snapshotJson, onSelectNode, onDismissSnapshot }: CanvasViewProps) {
  return (
    <div style={styles.canvas}>
      {/* Render SVG Edges */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        {edges.map(e => {
          const p1 = getNodeCenter(e.fromNodeId, nodes);
          const p2 = getNodeCenter(e.toNodeId, nodes);
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
          onClick={() => onSelectNode(n)}
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

      {/* Snapshot JSON Panel */}
      {snapshotJson && (
        <div style={{ position: 'absolute', bottom: 16, right: 16, width: 320, background: '#121324', border: '1px solid #10b98144', borderRadius: 8, padding: 12, zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 700, fontSize: 12, marginBottom: 6 }}>
            <span>CRDT Snapshot JSON</span>
            <button onClick={onDismissSnapshot} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Icon name="x" size={14} />
            </button>
          </div>
          <pre style={{ margin: 0, fontSize: 10, maxHeight: 150, overflow: 'auto', background: '#0a0a14', padding: 8, borderRadius: 4 }}>{snapshotJson}</pre>
        </div>
      )}
    </div>
  );
}
