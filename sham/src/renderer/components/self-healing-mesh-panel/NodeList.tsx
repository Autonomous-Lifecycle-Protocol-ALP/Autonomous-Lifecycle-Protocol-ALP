import React from 'react';
import { Icon } from '../Icon.js';
import { mesh, newNodeId, newNodeRegion, nodeStatus, handleRegisterNode, handleSimulateFailure } from './shared.js';

interface NodeListProps {
  newNodeId: string;
  newNodeRegion: string;
  nodeStatus: string;
  onNewNodeIdChange: (v: string) => void;
  onNewRegionChange: (v: string) => void;
  onNodeStatusChange: (v: string) => void;
  onRegisterNode: () => void;
  onSimulateFailure: (id: string) => void;
}

export const NodeList: React.FC<NodeListProps> = ({
  newNodeId,
  newNodeRegion,
  nodeStatus,
  onNewNodeIdChange,
  onNewRegionChange,
  onNodeStatusChange,
  onRegisterNode,
  onSimulateFailure,
}) => {
  const nodes = ['node-us-east-1', 'node-eu-central-1', 'node-ap-south-1', newNodeId].filter(id => mesh.getNode(id));

  return (
    <div className="section-card">
      <h4 className="section-card-title">+ Register Swarm Node Telemetry</h4>
      <div className="flex-wrap-gap">
        <input
          type="text"
          placeholder="Node ID..."
          value={newNodeId}
          onChange={(e) => onNewNodeIdChange(e.target.value)}
          className="input-field input-responsive"
        />
        <input
          type="text"
          placeholder="Region..."
          value={newNodeRegion}
          onChange={(e) => onNewRegionChange(e.target.value)}
          className="input-field input-responsive"
        />
        <select
          value={nodeStatus}
          onChange={(e) => onNodeStatusChange(e.target.value)}
          className="input-field input-responsive"
        >
          <option value="HEALTHY">HEALTHY</option>
          <option value="DEGRADED">DEGRADED</option>
          <option value="FAILED">FAILED</option>
        </select>
        <button
          onClick={onRegisterNode}
          className="btn btn-responsive btn-primary"
          style={{ background: 'var(--accent-blue)', color: 'var(--bg-primary)', fontWeight: 700 }}
        >
          Register Node
        </button>
      </div>

      <h3 className="section-card-title"><Icon name="globe" size={16} /> Swarm Node Roster & Telemetry</h3>
      <div className="card-container">
        {nodes.map((id) => {
          const node = mesh.getNode(id)!;
          const isHealthy = node.status === 'HEALTHY';
          const isFailed = node.status === 'FAILED';
          return (
            <div
              key={node.nodeId}
              className="card"
              style={{
                border: `1px solid ${isHealthy ? 'var(--accent-green)' : isFailed ? 'var(--accent-red)' : 'var(--accent-yellow)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>{node.nodeId}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
                  Region: <span style={{ color: 'var(--accent-blue)' }}>{node.region}</span> | Active Tasks: {node.activeTasks.length}
                </div>
              </div>
              <div className="flex-wrap-gap">
                <span className="badge badge-responsive" style={{
                  background: isHealthy ? 'rgba(0, 255, 157, 0.1)' : isFailed ? 'rgba(255, 51, 102, 0.1)' : 'rgba(255, 204, 0, 0.1)',
                  color: isHealthy ? 'var(--accent-green)' : isFailed ? 'var(--accent-red)' : 'var(--accent-yellow)',
                }}>
                  {node.status}
                </span>
                {!isFailed && (
                  <button
                    onClick={() => onSimulateFailure(node.nodeId)}
                    className="btn btn-xs badge badge-responsive"
                    style={{ background: 'rgba(255, 51, 102, 0.2)', color: 'var(--accent-red)', border: '1px solid rgba(255, 51, 102, 0.4)' }}
                  >
                    Fail
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
