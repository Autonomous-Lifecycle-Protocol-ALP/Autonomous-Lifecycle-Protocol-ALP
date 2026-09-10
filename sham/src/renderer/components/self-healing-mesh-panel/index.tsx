import React, { useState } from 'react';
import { Icon } from '../Icon.js';
import { NodeList } from './NodeList.js';
import { HealingLog } from './HealingLog.js';
import { mesh, handleRegisterNode, handleSimulateFailure, generateSelfHealingPlan, failures, activePlan as sharedActivePlan } from './shared.js';

export const SelfHealingMeshPanel: React.FC = () => {
  const [newNodeId, setNewNodeId] = useState('node-us-west-2');
  const [newRegion, setNewRegion] = useState('us-west-2');
  const [nodeStatus, setNodeStatus] = useState<string>('HEALTHY');
  const [activePlan, setActivePlan] = useState<{ planId: string; taskReroutes: { taskId: string; fromNode: string; toNode: string }[] } | null>(null);

  const handleRegister = () => {
    handleRegisterNode(newNodeId, newRegion, nodeStatus, setNewNodeId);
  };

  const handleFail = (nodeId: string) => {
    handleSimulateFailure(nodeId, () => setActivePlan(null));
  };

  const handleGenerate = () => {
    generateSelfHealingPlan((plan) => setActivePlan(plan));
  };

  return (
    <div className="panel-container" style={{ padding: 'var(--spacing-sm)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}>
      <div className="flex-between" style={{ marginBottom: '24px', borderBottom: '1px solid ' + 'var(--border)', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--accent)', fontSize: 'var(--font-size-lg)', fontWeight: 700, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="shield" size={20} /> Autonomous Swarm Self-Healing Mesh (v80.0.0)</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Automated node health telemetry, failure detection, peer rerouting, and adaptive load redistribution
          </p>
        </div>
      </div>

      <div className="grid-responsive">
        <NodeList
          newNodeId={newNodeId}
          newNodeRegion={newRegion}
          nodeStatus={nodeStatus}
          onNewNodeIdChange={setNewNodeId}
          onNewRegionChange={setNewRegion}
          onNodeStatusChange={setNodeStatus}
          onRegisterNode={handleRegister}
          onSimulateFailure={handleFail}
        />
        <HealingLog onGeneratePlan={handleGenerate} />
      </div>
    </div>
  );
};
