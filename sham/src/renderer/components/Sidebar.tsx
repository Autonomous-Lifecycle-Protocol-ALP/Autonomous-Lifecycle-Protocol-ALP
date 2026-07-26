import React from 'react';
import { theme } from '../styles/theme.js';
import type { SHAMState } from '../shared/types.js';

interface SidebarProps {
  state: SHAMState;
  onOpenFile: (filePath: string) => void;
  onCloseFile: (filePath: string) => void;
  onSelectAgent: (id: string) => void;
  activePanel: 'editor' | 'terminal' | 'agents' | 'mcp';
  setActivePanel: (panel: 'editor' | 'terminal' | 'agents' | 'mcp') => void;
}

export function Sidebar({ state, onOpenFile, onCloseFile, onSelectAgent, activePanel, setActivePanel }: SidebarProps): React.JSX.Element {
  const width = 240;

  return (
    <div style={{ width, minWidth: width, backgroundColor: theme.sidebarBackground, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Explorer</div>
        <div style={{ marginTop: 6 }}>
          <button onClick={() => onOpenFile('example.alp')} style={{ width: '100%', padding: '4px 8px', background: 'transparent', border: 'none', color: theme.textPrimary, cursor: 'pointer', textAlign: 'left', borderRadius: 4, fontSize: 12 }}>
            + New ALP File
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {state.openFiles.map((file) => (
          <div key={file} style={{ display: 'flex', alignItems: 'center', padding: '4px 12px', cursor: 'pointer', background: state.activeFile === file ? theme.bgSurface : 'transparent', borderLeft: state.activeFile === file ? `2px solid ${theme.accent}` : '2px solid transparent' }}>
            <span style={{ flex: 1, fontSize: 12, color: state.activeFile === file ? theme.textPrimary : theme.textSecondary }}>{file}</span>
            <button onClick={(e) => { e.stopPropagation(); onCloseFile(file); }} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>x</button>
          </div>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${theme.border}` }}>
        {(['editor', 'terminal', 'agents', 'mcp'] as const).map((panel) => (
          <button key={panel} onClick={() => setActivePanel(panel)} style={{ width: '100%', padding: '8px 12px', background: activePanel === panel ? theme.bgSurface : 'transparent', border: 'none', borderLeft: activePanel === panel ? `3px solid ${theme.accent}` : '3px solid transparent', color: activePanel === panel ? theme.textPrimary : theme.textSecondary, cursor: 'pointer', textAlign: 'left', fontSize: 12 }}>
            {panel.charAt(0).toUpperCase() + panel.slice(1)}
          </button>
        ))}
      </div>
      <div style={{ padding: '8px 12px', borderTop: `1px solid ${theme.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Agents</div>
        {state.agents.map((agent) => (
          <div key={agent.id} onClick={() => onSelectAgent(agent.id)} style={{ padding: '4px 8px', cursor: 'pointer', fontSize: 12, color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: agent.status === 'running' ? theme.accentGreen : agent.status === 'error' ? theme.accentRed : theme.textMuted }} />
            {agent.name}
          </div>
        ))}
      </div>
    </div>
  );
}