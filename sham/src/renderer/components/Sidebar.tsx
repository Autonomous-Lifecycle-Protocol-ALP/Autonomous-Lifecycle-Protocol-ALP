import React, { useState, useCallback } from 'react';
import type { SHAMState } from '../shared/types.js';

interface SidebarProps {
  state: SHAMState;
  onOpenFile: (filePath: string) => void;
  onCloseFile: (filePath: string) => void;
  onSelectAgent: (id: string) => void;
  activePanel: string;
  setActivePanel: (panel: string) => void;
}

interface TreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: TreeNode[];
  icon?: string;
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
  marketplace: '&#128722;',
  zk: '&#128274;',
  partition: '&#127758;',
  crdtCanvas: '&#127912;',
  wasmAst: '&#9889;',
  edgeDebug: '&#128030;',
  telemetryInspector: '&#128225;',
  chaosEngine: '&#128165;',
  featureFlags: '&#127937;',
  workflowReplay: '&#9201;',
  localStorage: '&#128230;',
  selfHealingMesh: '&#128737;',
};

const FILE_ICONS: Record<string, string> = {
  '.alp': '&#128196;',
  '.md': '&#128220;',
  '.json': '&#9881;',
  '.ts': '&#128187;',
  '.js': '&#128187;',
  '.py': '&#128012;',
  '.yml': '&#128196;',
  '.yaml': '&#128196;',
  '.sh': '&#9000;',
};

const WORKSPACE_TREE: TreeNode[] = [
  {
    id: 'src',
    name: 'src',
    type: 'folder',
    path: 'src',
    children: [
      { id: 'src-index', name: 'index.ts', type: 'file', path: 'src/index.ts', icon: '&#128187;' },
      {
        id: 'src-agents',
        name: 'agents',
        type: 'folder',
        path: 'src/agents',
        children: [
          { id: 'src-agents-hello', name: 'hello.alp', type: 'file', path: 'src/agents/hello.alp', icon: '&#128196;' },
          { id: 'src-agents-swarm', name: 'swarm.alp', type: 'file', path: 'src/agents/swarm.alp', icon: '&#128196;' },
        ],
      },
      {
        id: 'src-skills',
        name: 'skills',
        type: 'folder',
        path: 'src/skills',
        children: [
          { id: 'src-skills-utils', name: 'utils.alp', type: 'file', path: 'src/skills/utils.alp', icon: '&#128196;' },
        ],
      },
    ],
  },
  {
    id: 'docs',
    name: 'docs',
    type: 'folder',
    path: 'docs',
    children: [
      { id: 'docs-readme', name: 'README.md', type: 'file', path: 'docs/README.md', icon: '&#128220;' },
      { id: 'docs-api', name: 'API.md', type: 'file', path: 'docs/API.md', icon: '&#128220;' },
    ],
  },
  { id: 'root-alp', name: 'example.alp', type: 'file', path: 'example.alp', icon: '&#128196;' },
  { id: 'root-readme', name: 'README.md', type: 'file', path: 'README.md', icon: '&#128220;' },
  { id: 'root-config', name: 'alp.config.json', type: 'file', path: 'alp.config.json', icon: '&#9881;' },
  { id: 'root-governance', name: 'governance.alp', type: 'file', path: 'governance.alp', icon: '&#128196;' },
  { id: 'root-contracts', name: 'contracts.alp', type: 'file', path: 'contracts.alp', icon: '&#128196;' },
];

function getFileIcon(name: string): string {
  const ext = name.includes('.') ? '.' + name.split('.').pop() : '';
  return FILE_ICONS[ext] || '&#128196;';
}

function TreeItem({ node, depth = 0, onOpenFile, activeFile }: { node: TreeNode; depth?: number; onOpenFile: (path: string) => void; activeFile: string | null }): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const isFolder = node.type === 'folder';
  const icon = node.icon || (isFolder ? (expanded ? '&#9662;' : '&#9656;') : getFileIcon(node.name));

  return (
    <div>
      <div
        className={`tree-item ${activeFile === node.path ? 'active' : ''}`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => {
          if (isFolder) {
            setExpanded((prev) => !prev);
          } else {
            onOpenFile(node.path);
          }
        }}
      >
        <span className="tree-item-icon" dangerouslySetInnerHTML={{ __html: icon }} />
        <span className="tree-item-label">{node.name}</span>
      </div>
      {isFolder && expanded && node.children && (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeItem key={child.id} node={child} depth={depth + 1} onOpenFile={onOpenFile} activeFile={activeFile} />
          ))}
        </div>
      )}
    </div>
  );
}

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
          {WORKSPACE_TREE.map((node) => (
            <TreeItem key={node.id} node={node} onOpenFile={onOpenFile} activeFile={state.activeFile} />
          ))}
        </div>
      </div>

      <div className="sidebar-footer">
        {['editor', 'terminal', 'agents', 'mcp', 'collab', 'plugins', 'profiler', 'copilot', 'refactor', 'marketplace', 'zk', 'partition', 'crdtCanvas', 'wasmAst', 'edgeDebug', 'telemetryInspector', 'chaosEngine', 'featureFlags', 'workflowReplay', 'localStorage', 'selfHealingMesh', 'settings', 'git', 'search'].map((panel) => (
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
