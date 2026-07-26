import React from 'react';
import { theme } from '../styles/theme.js';
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
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Agent Manager</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={newAgentName} onChange={(e) => setNewAgentName(e.target.value)} placeholder="New agent name..." style={{ flex: 1, background: theme.bgSurface, border: `1px solid ${theme.border}`, color: theme.textPrimary, padding: '6px 10px', borderRadius: 4, fontSize: 12, outline: 'none' }} />
          <button onClick={handleAddAgent} style={{ padding: '6px 14px', background: theme.accent, border: 'none', color: theme.bgPrimary, borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Add</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {agents.length === 0 ? (
          <div style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center', padding: 24 }}>No agents yet. Create one to get started.</div>
        ) : (
          agents.map((agent) => (
            <div key={agent.id} style={{ padding: 10, marginBottom: 8, background: theme.bgSurface, borderRadius: 6, border: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{agent.name}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, backgroundColor: agent.status === 'running' ? '#1a3a2a' : agent.status === 'error' ? '#3a1a1a' : '#1a1a2e', color: agent.status === 'running' ? theme.accentGreen : agent.status === 'error' ? theme.accentRed : theme.textMuted }}>
                  {agent.status}
                </span>
              </div>
              <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                <button onClick={() => onRunAgent(agent.id, agent.config)} style={{ padding: '4px 10px', background: theme.accentGreen, border: 'none', color: theme.bgPrimary, borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Run</button>
                <button style={{ padding: '4px 10px', background: theme.bgHover, border: 'none', color: theme.textPrimary, borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Configure</button>
                <button style={{ padding: '4px 10px', background: 'transparent', border: `1px solid ${theme.accentRed}`, color: theme.accentRed, borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}