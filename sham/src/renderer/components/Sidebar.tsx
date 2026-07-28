import React from 'react';
import type { SHAMState } from '../shared/types.js';

interface SidebarProps {
  state: SHAMState;
  onOpenFile: (filePath: string) => void;
  onCloseFile: (filePath: string) => void;
  onSelectAgent: (id: string) => void;
  activePanel: string;
  setActivePanel: (panel: string) => void;
}

const panelIcons: Record<string, string> = {
  editor: '&#9998;',
  terminal: '&#9000;',
  agents: '&#128100;',
  mcp: '&#128230;',
  collab: '&#128101;',
  plugins: '&#128295;',
  profiler: '&#9201;',
  copilot: '&#129302;',
  refactor: '&#10070;',
  settings: '&#9881;',
  git: '&#128193;',
  search: '&#128269;',
};

export function Sidebar({ state, onOpenFile, onCloseFile, onSelectAgent, activePanel, setActivePanel }: SidebarProps): React.JSX.Element {
  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-section-title">
          Explorer
          <button className="sidebar-section-action" onClick={() => onOpenFile('untitled.alp')} title="New ALP File">
            +
          </button>
        </div>
        <div className="sidebar-list">
          {state.openFiles.map((file) => (
            <div
              key={file}
              className={`sidebar-item ${state.activeFile === file ? 'active' : ''}`}
              onClick={() => onOpenFile(file)}
            >
              <span className="sidebar-item-icon">&#128196;</span>
              <span className="sidebar-item-label">{file}</span>
              <button
                className="sidebar-item-close"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseFile(file);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-section" style={{ flex: 1, overflow: 'auto', borderBottom: 'none' }}>
        <div className="sidebar-section-title">Workspace</div>
        <div className="sidebar-list">
          <div className="tree-item" onClick={() => onOpenFile('example.alp')}>
            <span className="tree-item-icon">&#128196;</span>
            <span className="tree-item-label">example.alp</span>
          </div>
          <div className="tree-item" onClick={() => onOpenFile('README.md')}>
            <span className="tree-item-icon">&#128220;</span>
            <span className="tree-item-label">README.md</span>
          </div>
          <div className="tree-item" onClick={() => onOpenFile('alp.config.json')}>
            <span className="tree-item-icon">&#9881;</span>
            <span className="tree-item-label">alp.config.json</span>
          </div>
          <div className="tree-item" onClick={() => onOpenFile('governance.alp')}>
            <span className="tree-item-icon">&#128196;</span>
            <span className="tree-item-label">governance.alp</span>
          </div>
          <div className="tree-item" onClick={() => onOpenFile('contracts.alp')}>
            <span className="tree-item-icon">&#128196;</span>
            <span className="tree-item-label">contracts.alp</span>
          </div>
        </div>
      </div>

      <div className="sidebar-footer">
        {['editor', 'terminal', 'agents', 'mcp', 'collab', 'plugins', 'profiler', 'copilot', 'refactor', 'settings', 'git', 'search'].map((panel) => (
          <button
            key={panel}
            className={`sidebar-footer-item ${activePanel === panel ? 'active' : ''}`}
            onClick={() => setActivePanel(panel)}
          >
            <span dangerouslySetInnerHTML={{ __html: panelIcons[panel] || '&#9635;' }} />
            {panel.charAt(0).toUpperCase() + panel.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
