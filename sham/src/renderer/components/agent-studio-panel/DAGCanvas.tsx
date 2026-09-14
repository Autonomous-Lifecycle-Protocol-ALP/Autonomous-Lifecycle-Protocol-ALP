import React, { useState } from 'react';
import { VisualNode, VisualEdge, VisualNodeType } from '@autonomous-lifecycle-protocol-alp/parser';
import { Icon } from '../Icon.js';

interface DAGCanvasProps {
  nodes: VisualNode[];
  edges: VisualEdge[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onAddNode: (type: VisualNodeType, label: string) => void;
  onRemoveNode: (id: string) => void;
  onAddEdge: (from: string, to: string, label?: string) => void;
  onRemoveEdge: (id: string) => void;
}

export function DAGCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onAddNode,
  onRemoveNode,
  onAddEdge,
  onRemoveEdge,
}: DAGCanvasProps): React.JSX.Element {
  const [newNodeType, setNewNodeType] = useState<VisualNodeType>('TASK');
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [edgeFrom, setEdgeFrom] = useState('');
  const [edgeTo, setEdgeTo] = useState('');
  const [edgeLabel, setEdgeLabel] = useState('');
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [showAddEdgeModal, setShowAddEdgeModal] = useState(false);

  const nodeTypeColors: Record<VisualNodeType, { bg: string; border: string; text: string; icon: string }> = {
    INPUT: { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', text: '#60a5fa', icon: 'box' },
    AGENT: { bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7', text: '#c084fc', icon: 'bot' },
    TASK: { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#34d399', icon: 'code' },
    DECISION: { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#fbbf24', icon: 'gitBranch' },
    GATE: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#f87171', icon: 'shield' },
    OUTPUT: { bg: 'rgba(14, 165, 233, 0.15)', border: '#0ea5e9', text: '#38bdf8', icon: 'checkCircle' },
    TRANSFORM: { bg: 'rgba(236, 72, 153, 0.15)', border: '#ec4899', text: '#f472b6', icon: 'zap' },
  };

  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeLabel.trim()) return;
    onAddNode(newNodeType, newNodeLabel.trim());
    setNewNodeLabel('');
    setShowAddNodeModal(false);
  };

  const handleCreateEdge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!edgeFrom || !edgeTo || edgeFrom === edgeTo) return;
    onAddEdge(edgeFrom, edgeTo, edgeLabel.trim() || undefined);
    setEdgeFrom('');
    setEdgeTo('');
    setEdgeLabel('');
    setShowAddEdgeModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      {/* Action Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>DAG WORKBENCH:</span>
          <span className="badge" style={{ background: 'var(--accent)22', color: 'var(--accent)' }}>{nodes.length} Nodes</span>
          <span className="badge" style={{ background: 'var(--accent-blue)22', color: 'var(--accent-blue)' }}>{edges.length} Edges</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => setShowAddNodeModal(true)}
            data-testid="add-node-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '0.8rem' }}
          >
            <Icon name="plus" size={14} /> Add Node
          </button>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setShowAddEdgeModal(true)}
            disabled={nodes.length < 2}
            data-testid="add-edge-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '0.8rem' }}
          >
            <Icon name="link" size={14} /> Connect Nodes
          </button>
        </div>
      </div>

      {/* Add Node Inline Dialog */}
      {showAddNodeModal && (
        <form onSubmit={handleCreateNode} style={{ display: 'flex', gap: '8px', padding: '10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>New Node:</span>
          <select
            value={newNodeType}
            onChange={(e) => setNewNodeType(e.target.value as VisualNodeType)}
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: 'var(--radius)' }}
          >
            <option value="INPUT">INPUT</option>
            <option value="AGENT">AGENT</option>
            <option value="TASK">TASK</option>
            <option value="DECISION">DECISION</option>
            <option value="GATE">GATE</option>
            <option value="OUTPUT">OUTPUT</option>
            <option value="TRANSFORM">TRANSFORM</option>
          </select>
          <input
            type="text"
            placeholder="Node label (e.g. Code Reviewer)"
            value={newNodeLabel}
            onChange={(e) => setNewNodeLabel(e.target.value)}
            autoFocus
            style={{ flex: 1, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: 'var(--radius)' }}
          />
          <button type="submit" className="btn btn-sm btn-primary" style={{ padding: '4px 10px' }}>Create</button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowAddNodeModal(false)} style={{ padding: '4px 8px' }}>Cancel</button>
        </form>
      )}

      {/* Connect Nodes Inline Dialog */}
      {showAddEdgeModal && (
        <form onSubmit={handleCreateEdge} style={{ display: 'flex', gap: '8px', padding: '10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Connect:</span>
          <select
            value={edgeFrom}
            onChange={(e) => setEdgeFrom(e.target.value)}
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: 'var(--radius)' }}
          >
            <option value="">Source node...</option>
            {nodes.map(n => <option key={n.id} value={n.id}>{n.label} ({n.type})</option>)}
          </select>
          <span>→</span>
          <select
            value={edgeTo}
            onChange={(e) => setEdgeTo(e.target.value)}
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: 'var(--radius)' }}
          >
            <option value="">Target node...</option>
            {nodes.filter(n => n.id !== edgeFrom).map(n => <option key={n.id} value={n.id}>{n.label} ({n.type})</option>)}
          </select>
          <input
            type="text"
            placeholder="Edge label (optional)"
            value={edgeLabel}
            onChange={(e) => setEdgeLabel(e.target.value)}
            style={{ flex: 1, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: 'var(--radius)' }}
          />
          <button type="submit" className="btn btn-sm btn-primary" disabled={!edgeFrom || !edgeTo} style={{ padding: '4px 10px' }}>Connect</button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowAddEdgeModal(false)} style={{ padding: '4px 8px' }}>Cancel</button>
        </form>
      )}

      {/* Main Canvas Area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        {nodes.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '8px' }}>
            <Icon name="palette" size={32} />
            <span>Empty DAG. Click "Add Node" or select a Starter Template above to begin.</span>
          </div>
        ) : (
          <>
            {/* Visual Node Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const colors = nodeTypeColors[node.type] || nodeTypeColors.TASK;
                const outgoing = edges.filter(e => e.from === node.id);
                const incoming = edges.filter(e => e.to === node.id);

                return (
                  <div
                    key={node.id}
                    onClick={() => onSelectNode(isSelected ? null : node.id)}
                    style={{
                      background: colors.bg,
                      border: `1.5px solid ${isSelected ? 'var(--accent)' : colors.border}`,
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease-in-out',
                      boxShadow: isSelected ? '0 0 10px var(--accent)44' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                    data-testid={`node-${node.id}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: colors.border,
                          color: '#fff',
                        }}
                      >
                        {node.type}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveNode(node.id);
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                        title="Remove node"
                      >
                        <Icon name="trash2" size={14} />
                      </button>
                    </div>

                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: colors.text }}>
                      {node.label}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ID: <code style={{ color: 'var(--text-primary)' }}>{node.id}</code>
                    </div>

                    {node.capabilities && node.capabilities.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {node.capabilities.map(cap => (
                          <span key={cap} style={{ fontSize: '0.65rem', background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                            {cap}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>In: {incoming.length}</span>
                      <span>Out: {outgoing.length}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Edge Connection List */}
            {edges.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>
                  DIRECTED CONNECTIONS:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {edges.map(edge => {
                    const fromNode = nodes.find(n => n.id === edge.from);
                    const toNode = nodes.find(n => n.id === edge.to);

                    return (
                      <div
                        key={edge.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'var(--bg-tertiary)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          fontSize: '0.75rem',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fromNode?.label || edge.from}</span>
                        <span style={{ color: 'var(--accent)' }}>→</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{toNode?.label || edge.to}</span>
                        {edge.label && <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>({edge.label})</span>}
                        <button
                          onClick={() => onRemoveEdge(edge.id)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '4px' }}
                          title="Remove connection"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
