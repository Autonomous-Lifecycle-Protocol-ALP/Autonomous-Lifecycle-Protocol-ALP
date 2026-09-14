import React, { useState } from 'react';
import { Icon } from './Icon.js';
import type { ALPAgent } from '../shared/types.js';
import { AgentCreator } from './agent-creator/index.js';

interface AgentPanelProps {
  agents: ALPAgent[];
  onRunAgent: (agentId: string, config: Record<string, unknown>) => void;
  onCreateAgent?: (data: {
    name: string;
    role: string;
    model: string;
    permissions: string[];
    description: string;
    template?: string;
  }) => void;
}

export function AgentPanel({ agents, onRunAgent, onCreateAgent }: AgentPanelProps): React.JSX.Element {
  const [newAgentName, setNewAgentName] = useState('');
  const [showCreator, setShowCreator] = useState(false);

  const handleAddAgent = () => {
    if (newAgentName.trim()) {
      const agent: ALPAgent = {
        id: `agent-${Date.now()}`,
        name: newAgentName.trim(),
        status: 'idle',
        config: {},
      };
      onRunAgent(agent.id, agent.config);
      setNewAgentName('');
    }
  };

  const handleCreatorSubmit = (data: {
    name: string;
    role: string;
    model: string;
    permissions: string[];
    description: string;
    template?: string;
  }) => {
    if (onCreateAgent) {
      onCreateAgent(data);
    }
    setShowCreator(false);
  };

  return (
    <div className="detail-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 'var(--spacing-sm)', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '12px' }}>
        <div className="panel-title" style={{ padding: 0, marginBottom: 8 }}>Agent Manager</div>
        <div className="flex-wrap-gap">
          <input
            value={newAgentName}
            onChange={(e) => setNewAgentName(e.target.value)}
            placeholder="New agent name..."
            className="input-field input-fluid"
            style={{ flex: 1, minWidth: '120px' }}
          />
          <button className="btn btn-primary btn-responsive" onClick={handleAddAgent}>Add</button>
          <button className="btn btn-secondary btn-responsive" onClick={() => setShowCreator(true)}>Create</button>
        </div>
      </div>
      {showCreator && (
        <div style={{ marginBottom: '12px' }}>
          <AgentCreator
            onSubmit={handleCreatorSubmit}
            onCancel={() => setShowCreator(false)}
          />
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {agents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Icon name="users" size={32} color="var(--text-muted)" /></div>
            <div className="empty-state-title">No agents yet</div>
            <div className="empty-state-desc">Create an agent to get started with autonomous workflows.</div>
          </div>
        ) : (
          agents.map((agent) => (
            <div key={agent.id} className="section-card" style={{ marginBottom: 8, boxSizing: 'border-box' }}>
              <div className="flex-between">
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{agent.name}</span>
                <span className={`badge badge-responsive ${agent.status === 'running' ? 'badge-success' : agent.status === 'error' ? 'badge-error' : 'badge-muted'}`}>
                  {agent.status}
                </span>
              </div>
              <div className="flex-wrap-gap" style={{ marginTop: 8, gap: 6 }}>
                <button className="btn btn-primary btn-sm btn-responsive" onClick={() => onRunAgent(agent.id, agent.config)}>Run</button>
                <button className="btn btn-secondary btn-sm btn-responsive">Configure</button>
                <button className="btn btn-danger btn-sm btn-responsive">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
