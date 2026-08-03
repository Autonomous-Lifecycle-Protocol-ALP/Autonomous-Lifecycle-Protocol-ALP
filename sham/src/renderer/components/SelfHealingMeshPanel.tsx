import React, { useState } from 'react';
import { SwarmSelfHealingMesh, SwarmNodeHealth, SelfHealingPlan } from '@autonomous-lifecycle-protocol-alp/parser';

export const SelfHealingMeshPanel: React.FC = () => {
  const [mesh] = useState(() => {
    const m = new SwarmSelfHealingMesh();
    m.registerNode('node-us-east-1', 'us-east-1', 'HEALTHY', ['task-auth-service', 'task-db-migrations']);
    m.registerNode('node-eu-central-1', 'eu-central-1', 'HEALTHY', ['task-analytics-engine']);
    m.registerNode('node-ap-south-1', 'ap-south-1', 'FAILED', ['task-payment-gateway', 'task-email-notifications']);
    return m;
  });

  const [newNodeId, setNewNodeId] = useState('node-us-west-2');
  const [newRegion, setNewRegion] = useState('us-west-2');
  const [nodeStatus, setNodeStatus] = useState<'HEALTHY' | 'DEGRADED' | 'FAILED'>('HEALTHY');
  const [activePlan, setActivePlan] = useState<SelfHealingPlan | null>(null);

  const handleRegisterNode = () => {
    if (!newNodeId.trim()) return;
    mesh.registerNode(newNodeId, newRegion, nodeStatus);
    setNewNodeId('');
  };

  const handleSimulateFailure = (nodeId: string) => {
    const node = mesh.getNode(nodeId);
    if (node) {
      mesh.registerNode(nodeId, node.region, 'FAILED', node.activeTasks);
      setActivePlan(null);
    }
  };

  const handleGenerateSelfHealingPlan = () => {
    const plan = mesh.generateSelfHealingPlan();
    setActivePlan(plan);
  };

  const failures = mesh.detectFailures();

  return (
    <div className="panel-container" style={{ padding: 'var(--spacing-sm)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '24px', borderBottom: '1px solid ' + 'var(--border)', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--accent)', fontSize: 'var(--font-size-lg)', fontWeight: 700, letterSpacing: '0.5px' }}>
             🛡️ Autonomous Swarm Self-Healing Mesh (v81.0.0)
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Automated node health telemetry, failure detection, peer rerouting, and adaptive load redistribution
          </p>
        </div>
        <button
          onClick={handleGenerateSelfHealingPlan}
          className="btn btn-lg"
          style={{ background: 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))', color: 'var(--bg-primary)', fontWeight: 700 }}
        >
          ⚡ Synthesize Healing Plan
        </button>
      </div>

      {/* Roster & Node Registration Form */}
      <div className="section-card">
        <h4 className="section-card-title">+ Register Swarm Node Telemetry</h4>
        <div className="flex-wrap-gap">
          <input
            type="text"
            placeholder="Node ID..."
            value={newNodeId}
            onChange={(e) => setNewNodeId(e.target.value)}
            className="input-field input-responsive"
          />
          <input
            type="text"
            placeholder="Region..."
            value={newRegion}
            onChange={(e) => setNewRegion(e.target.value)}
            className="input-field input-responsive"
          />
          <select
            value={nodeStatus}
            onChange={(e) => setNodeStatus(e.target.value as 'HEALTHY' | 'DEGRADED' | 'FAILED')}
            className="input-field input-responsive"
          >
            <option value="HEALTHY">HEALTHY</option>
            <option value="DEGRADED">DEGRADED</option>
            <option value="FAILED">FAILED</option>
          </select>
          <button
            onClick={handleRegisterNode}
            className="btn btn-responsive btn-primary"
            style={{ background: 'var(--accent-blue)', color: 'var(--bg-primary)', fontWeight: 700 }}
          >
            Register Node
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid-responsive">
        {/* Roster List */}
        <div className="section-card">
          <h3 className="section-card-title">🌐 Swarm Node Roster & Telemetry</h3>
          <div className="card-container">
            {['node-us-east-1', 'node-eu-central-1', 'node-ap-south-1', newNodeId].filter(id => mesh.getNode(id)).map((id) => {
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
                        onClick={() => handleSimulateFailure(node.nodeId)}
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

        {/* Healing Plan & Reroute Matrix */}
        <div className="section-card">
          <h3 className="section-card-title">🩺 Automated Healing Plan & Task Reroutes</h3>
          {activePlan ? (
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: '12px' }}>
                Plan ID: <span style={{ color: 'var(--accent-blue)', fontFamily: 'monospace' }}>{activePlan.planId}</span>
              </div>
              <div className="card-container">
                {activePlan.taskReroutes.map((r, i) => (
                  <div key={i} className="card">
                    <div style={{ fontWeight: 600, color: 'var(--accent-yellow)', fontSize: 'var(--font-size-sm)' }}>{r.taskId}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
                      <span style={{ color: 'var(--accent-red)' }}>{r.fromNode}</span> ➔ <span style={{ color: 'var(--accent-green)' }}>{r.toNode}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🩺</div>
              <div className="empty-state-title">No healing plan</div>
              <div className="empty-state-desc">
                {failures.length > 0 ? `${failures.length} degraded/failed node(s) detected. Click 'Synthesize Healing Plan' to failover.` : 'All swarm nodes healthy. No healing plan needed.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
