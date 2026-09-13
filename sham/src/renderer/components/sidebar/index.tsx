import React from 'react';
import type { SidebarProps } from './shared.js';
import { panelIcons } from './shared.js';
import { NavItems } from './NavItems.js';
import { NavCategory } from './NavCategory.js';
import { Icon } from '../Icon.js';
import { ALL_PANELS } from '../../app/shared.js';

export function Sidebar({ state, onOpenFile, onCloseFile, activePanel, setActivePanel, onOpenPanelsDrawer }: SidebarProps): React.JSX.Element {
  return (
    <div className="sidebar" style={{ background: 'linear-gradient(to bottom, rgba(24, 24, 37, 0.8), rgba(17, 17, 27, 0.9))', boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.05)' }}>
      <NavItems state={state} onOpenFile={onOpenFile} onCloseFile={onCloseFile} />
      <NavCategory state={state} onOpenFile={onOpenFile} />
      <div className="sidebar-footer">
        {onOpenPanelsDrawer && (
          <button
            className="sidebar-footer-item sidebar-drawer-launcher-btn"
            onClick={onOpenPanelsDrawer}
            title={`Open All Panels & Tools Drawer (${ALL_PANELS.length})`}
          >
            <Icon name="layers" size={14} color="var(--accent)" />
            <span style={{ flex: 1 }}>All Panels Drawer</span>
            <span className="sidebar-drawer-badge">{ALL_PANELS.length}</span>
          </button>
        )}
        {['editor', 'terminal', 'agents', 'synapse', 'multimodal', 'agentStudio', 'modelHub', 'socSentinel', 'mcp', 'collab', 'plugins', 'profiler', 'copilot', 'refactor', 'marketplace', 'zk', 'partition', 'crdtCanvas', 'wasmAst', 'edgeDebug', 'telemetryInspector', 'chaosEngine', 'featureFlags', 'workflowReplay', 'localStorage', 'selfHealingMesh', 'intelligence', 'autonomy', 'test-runner', 'debugger', 'git', 'search', 'pro', 'settings'].map((panel) => (
          <button
            key={panel}
            className={`sidebar-footer-item ${activePanel === panel ? 'active' : ''}`}
            style={activePanel === panel ? { background: 'linear-gradient(90deg, rgba(137,180,250,0.15) 0%, transparent 100%)', borderLeftColor: 'var(--accent)', color: 'var(--accent)', textShadow: '0 0 10px rgba(137, 180, 250, 0.3)' } : {}}
            onClick={() => setActivePanel(panel)}
          >
            <Icon name={panelIcons[panel] || 'box'} size={14} />
            {panel === 'synapse' ? 'Synapse' :
             panel === 'crdtCanvas' ? 'Canvas' :
             panel === 'wasmAst' ? 'WASM' :
             panel === 'edgeDebug' ? 'Edge' :
             panel === 'telemetryInspector' ? 'Telemetry' :
             panel === 'chaosEngine' ? 'Chaos' :
             panel === 'featureFlags' ? 'Flags' :
             panel === 'workflowReplay' ? 'Replay' :
             panel === 'localStorage' ? 'Storage' :
             panel === 'selfHealingMesh' ? 'Healing' :
             panel === 'multimodal' ? 'MultiModal' :
             panel === 'agentStudio' ? 'Studio' :
             panel === 'modelHub' ? 'Model Hub' :
             panel === 'socSentinel' ? 'Sentinel' :
             panel === 'test-runner' ? 'Tests' :
             panel.charAt(0).toUpperCase() + panel.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
