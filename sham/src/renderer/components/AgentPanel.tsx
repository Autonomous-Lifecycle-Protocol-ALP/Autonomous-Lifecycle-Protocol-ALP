import React from 'react';
import type { ALPAgent } from '../shared/types.js';

interface AgentPanelProps {
  agents: ALPAgent[];
  onRunAgent: (agentId: string, config: Record<string, unknown>) => void;
}

export function AgentPanel({ agents, onRunAgent }: AgentPanelProps): React.JSX.Element {
  const [newAgentName, setNewAgentName] = React.useState('');

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

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <div className="panel-title" style={{ padding: 0, marginBottom: 8 }}>Agent Manager</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newAgentName}
            onChange={(e) => setNewAgentName(e.target.value)}
            placeholder="New agent name..."
            className="input-field"
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={handleAddAgent}>Add</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {agents.length === 0 ? (
          <div className="empty-state" style={{ height: 'auto', padding: 32 }}>
            <div className="empty-state-icon">&#128100;</div>
            <div className="empty-state-title">No agents yet</div>
            <div className="empty-state-desc">Create an agent to get started with autonomous workflows.</div>
          </div>
        ) : (
          agents.map((agent) => (
            <div key={agent.id} className="section-card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{agent.name}</span>
                <span className={`badge ${agent.status === 'running' ? 'badge-success' : agent.status === 'error' ? 'badge-error' : 'badge-muted'}`}>
                  {agent.status}
                </span>
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <button className="btn btn-primary btn-sm" onClick={() => onRunAgent(agent.id, agent.config)}>Run</button>
                <button className="btn btn-secondary btn-sm">Configure</button>
                <button className="btn btn-danger btn-sm">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
