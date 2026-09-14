import React, { useState, useCallback } from 'react';
import { Icon } from './Icon';

interface SwarmNode {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'warning' | 'offline';
  x: number;
  y: number;
  memory: string;
  throughput: string;
  consensus: string;
  uptime: string;
}

interface SwarmEdge {
  from: string;
  to: string;
  type: 'data' | 'consensus';
}

const SWARM_NODES: SwarmNode[] = [
  { id: 'coordinator', name: 'swarm_coordinator', role: 'Coordinator', status: 'online', x: 220, y: 30, memory: '128MB', throughput: '1.2k req/s', consensus: 'Leader', uptime: '99.97%' },
  { id: 'hello', name: 'hello_agent', role: 'Greeter', status: 'online', x: 50, y: 140, memory: '64MB', throughput: '800 req/s', consensus: 'Follower', uptime: '99.99%' },
  { id: 'analyst', name: 'analyst_agent', role: 'Analyst', status: 'warning', x: 390, y: 140, memory: '256MB', throughput: '450 req/s', consensus: 'Follower', uptime: '98.2%' },
  { id: 'sentinel', name: 'sentinel_agent', role: 'Security', status: 'online', x: 130, y: 260, memory: '96MB', throughput: '2.1k req/s', consensus: 'Follower', uptime: '100%' },
  { id: 'refactor', name: 'refactor_bot', role: 'Refactor', status: 'offline', x: 350, y: 260, memory: '0MB', throughput: '0 req/s', consensus: 'Down', uptime: '—' },
];

const SWARM_EDGES: SwarmEdge[] = [
  { from: 'coordinator', to: 'hello', type: 'consensus' },
  { from: 'coordinator', to: 'analyst', type: 'consensus' },
  { from: 'coordinator', to: 'sentinel', type: 'data' },
  { from: 'hello', to: 'sentinel', type: 'data' },
  { from: 'analyst', to: 'refactor', type: 'data' },
  { from: 'coordinator', to: 'refactor', type: 'consensus' },
  { from: 'sentinel', to: 'analyst', type: 'data' },
];

function getNodeCenter(node: SwarmNode): { cx: number; cy: number } {
  return { cx: node.x + 65, cy: node.y + 50 };
}

export function SwarmTopology(): React.JSX.Element {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodes, setNodes] = useState<SwarmNode[]>(SWARM_NODES);
  const [heartbeatLog, setHeartbeatLog] = useState<string[]>([]);

  const handlePing = useCallback((nodeId: string) => {
    const ts = new Date().toLocaleTimeString();
    setHeartbeatLog((prev) => [`[${ts}] PING → ${nodeId}: 200 OK (2ms)`, ...prev].slice(0, 20));
  }, []);

  const handleChaos = useCallback((nodeId: string) => {
    const ts = new Date().toLocaleTimeString();
    setNodes((prev) => prev.map((n) =>
      n.id === nodeId ? { ...n, status: n.status === 'offline' ? 'online' : 'offline' as const } : n
    ));
    setHeartbeatLog((prev) => [`[${ts}] CHAOS → ${nodeId}: Partition toggled`, ...prev].slice(0, 20));
  }, []);

  const selected = nodes.find((n) => n.id === selectedNode) ?? null;

  return (
    <div data-testid="swarm-topology">
      <div className="swarm-topology-canvas" style={{ height: '340px' }}>
        <div className="swarm-grid-bg" />

        {/* Edge lines */}
        <svg className="swarm-edge-svg">
          {SWARM_EDGES.map((edge, i) => {
            const from = nodes.find((n) => n.id === edge.from);
            const to = nodes.find((n) => n.id === edge.to);
            if (!from || !to) return null;
            const { cx: x1, cy: y1 } = getNodeCenter(from);
            const { cx: x2, cy: y2 } = getNodeCenter(to);
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                className={edge.type === 'consensus' ? 'consensus' : ''}
              />
            );
          })}
        </svg>

        {/* Node cards */}
        {nodes.map((node) => (
          <div
            key={node.id}
            className={`swarm-node-card ${selectedNode === node.id ? 'selected' : ''}`}
            style={{ left: node.x, top: node.y }}
            onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
            data-testid={`swarm-node-${node.id}`}
          >
            <div className="swarm-node-header">
              <div className={`swarm-node-status-dot ${node.status}`} />
              <span className="swarm-node-name">{node.name}</span>
            </div>
            <div className="swarm-node-metrics">
              <span><span>Role</span><span>{node.role}</span></span>
              <span><span>Mem</span><span>{node.memory}</span></span>
              <span><span>BFT</span><span>{node.consensus}</span></span>
            </div>
            <div className="swarm-node-actions">
              <button
                className="swarm-node-action-btn"
                onClick={(e) => { e.stopPropagation(); handlePing(node.id); }}
                data-testid={`ping-${node.id}`}
              >
                Ping
              </button>
              <button
                className="swarm-node-action-btn danger"
                onClick={(e) => { e.stopPropagation(); handleChaos(node.id); }}
                data-testid={`chaos-${node.id}`}
              >
                Chaos
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Node Inspector */}
      {selected && (
        <div className="swarm-node-inspector" data-testid="swarm-node-inspector">
          <div className="swarm-node-inspector-title">
            <Icon name="cpu" size={14} />
            {selected.name} — Inspector
          </div>
          <div className="swarm-node-inspector-row"><span className="label">Status</span><span className="value">{selected.status.toUpperCase()}</span></div>
          <div className="swarm-node-inspector-row"><span className="label">Role</span><span className="value">{selected.role}</span></div>
          <div className="swarm-node-inspector-row"><span className="label">Memory</span><span className="value">{selected.memory}</span></div>
          <div className="swarm-node-inspector-row"><span className="label">Throughput</span><span className="value">{selected.throughput}</span></div>
          <div className="swarm-node-inspector-row"><span className="label">Consensus</span><span className="value">{selected.consensus}</span></div>
          <div className="swarm-node-inspector-row"><span className="label">Uptime</span><span className="value">{selected.uptime}</span></div>
        </div>
      )}

      {/* Heartbeat / Event Log */}
      {heartbeatLog.length > 0 && (
        <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(17,17,27,0.5)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', maxHeight: '120px', overflowY: 'auto' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Icon name="activity" size={10} /> Swarm Event Log
          </div>
          {heartbeatLog.map((log, i) => (
            <div key={i} style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', padding: '1px 0' }}>
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
