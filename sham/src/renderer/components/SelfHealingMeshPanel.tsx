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
    <div style={{ padding: '24px', color: '#e6e6f0', fontFamily: 'Inter, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #2a2a3a', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#00f0ff', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.5px' }}>
            🛡️ Autonomous Swarm Self-Healing Mesh (v80.0.0)
          </h2>
          <p style={{ margin: '4px 0 0', color: '#9e9eb0', fontSize: '0.875rem' }}>
            Automated node health telemetry, failure detection, peer rerouting, and adaptive load redistribution
          </p>
        </div>
        <button
          onClick={handleGenerateSelfHealingPlan}
          style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #00ff9d, #0066ff)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
        >
          ⚡ Synthesize Healing Plan
        </button>
      </div>

      {/* Roster & Node Registration Form */}
      <div style={{ background: '#0d0d14', padding: '16px', borderRadius: '10px', border: '1px solid #2a2a3a', marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 12px', color: '#e6e6f0', fontSize: '0.9rem', fontWeight: 600 }}>
          + Register Swarm Node Telemetry
        </h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Node ID..."
            value={newNodeId}
            onChange={(e) => setNewNodeId(e.target.value)}
            style={{ width: '180px', padding: '8px 12px', background: '#161622', border: '1px solid #2a2a3a', color: '#fff', borderRadius: '6px', fontSize: '0.85rem' }}
          />
          <input
            type="text"
            placeholder="Region..."
            value={newRegion}
            onChange={(e) => setNewRegion(e.target.value)}
            style={{ width: '140px', padding: '8px 12px', background: '#161622', border: '1px solid #2a2a3a', color: '#fff', borderRadius: '6px', fontSize: '0.85rem' }}
          />
          <select
            value={nodeStatus}
            onChange={(e) => setNodeStatus(e.target.value as 'HEALTHY' | 'DEGRADED' | 'FAILED')}
            style={{ padding: '8px 12px', background: '#161622', border: '1px solid #2a2a3a', color: '#fff', borderRadius: '6px', fontSize: '0.85rem' }}
          >
            <option value="HEALTHY">HEALTHY</option>
            <option value="DEGRADED">DEGRADED</option>
            <option value="FAILED">FAILED</option>
          </select>
          <button
            onClick={handleRegisterNode}
            style={{ padding: '8px 20px', background: '#00f0ff', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Register Node
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Roster List */}
        <div style={{ background: '#0d0d14', borderRadius: '10px', border: '1px solid #2a2a3a', padding: '16px' }}>
          <h3 style={{ margin: '0 0 16px', color: '#e6e6f0', fontSize: '1rem', fontWeight: 600 }}>
            🌐 Swarm Node Roster & Telemetry
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['node-us-east-1', 'node-eu-central-1', 'node-ap-south-1', newNodeId].filter(id => mesh.getNode(id)).map((id) => {
              const node = mesh.getNode(id)!;
              const isHealthy = node.status === 'HEALTHY';
              const isFailed = node.status === 'FAILED';
              return (
                <div
                  key={node.nodeId}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: '#12121c',
                    border: `1px solid ${isHealthy ? '#00ff9d' : isFailed ? '#ff3366' : '#ffcc00'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{node.nodeId}</div>
                    <div style={{ color: '#9e9eb0', fontSize: '0.78rem', marginTop: '2px' }}>
                      Region: <span style={{ color: '#00f0ff' }}>{node.region}</span> | Active Tasks: {node.activeTasks.length}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: isHealthy ? 'rgba(0, 255, 157, 0.1)' : isFailed ? 'rgba(255, 51, 102, 0.1)' : 'rgba(255, 204, 0, 0.1)',
                      color: isHealthy ? '#00ff9d' : isFailed ? '#ff3366' : '#ffcc00',
                    }}>
                      {node.status}
                    </span>
                    {!isFailed && (
                      <button
                        onClick={() => handleSimulateFailure(node.nodeId)}
                        style={{ padding: '4px 8px', background: 'rgba(255, 51, 102, 0.2)', color: '#ff3366', border: '1px solid rgba(255, 51, 102, 0.4)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem' }}
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
        <div style={{ background: '#0d0d14', borderRadius: '10px', border: '1px solid #2a2a3a', padding: '16px' }}>
          <h3 style={{ margin: '0 0 16px', color: '#00ff9d', fontSize: '1rem', fontWeight: 600 }}>
            🩺 Automated Healing Plan & Task Reroutes
          </h3>
          {activePlan ? (
            <div>
              <div style={{ color: '#9e9eb0', fontSize: '0.8rem', marginBottom: '12px' }}>
                Plan ID: <span style={{ color: '#00f0ff', fontFamily: 'monospace' }}>{activePlan.planId}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activePlan.taskReroutes.map((r, i) => (
                  <div key={i} style={{ padding: '10px 12px', background: '#161622', borderRadius: '6px', border: '1px solid #2a2a3a' }}>
                    <div style={{ fontWeight: 600, color: '#ffcc00', fontSize: '0.85rem' }}>{r.taskId}</div>
                    <div style={{ color: '#9e9eb0', fontSize: '0.78rem', marginTop: '2px' }}>
                      <span style={{ color: '#ff3366' }}>{r.fromNode}</span> ➔ <span style={{ color: '#00ff9d' }}>{r.toNode}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6c6c80', fontStyle: 'italic', fontSize: '0.85rem' }}>
              {failures.length > 0 ? `${failures.length} degraded/failed node(s) detected. Click 'Synthesize Healing Plan' to failover.` : 'All swarm nodes healthy. No healing plan needed.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
