import React, { useState, useCallback } from 'react';
import type { SHAMState } from '../shared/types.js';
import { Icon } from './Icon.js';

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
  editor: 'edit3',
  terminal: 'terminal',
  agents: 'users',
  mcp: 'cpu',
  collab: 'userPlus',
  plugins: 'puzzle',
  profiler: 'activity',
  copilot: 'bot',
  refactor: 'code',
  settings: 'settings',
  git: 'gitBranch',
  search: 'search',
  marketplace: 'shoppingBag',
  zk: 'lock',
  partition: 'globe',
  crdtCanvas: 'palette',
  wasmAst: 'zap',
  edgeDebug: 'bug',
  telemetryInspector: 'monitor',
  chaosEngine: 'alertTriangle',
  featureFlags: 'flag',
  workflowReplay: 'playCircle',
  localStorage: 'hardDrive',
  selfHealingMesh: 'shield',
};

const FILE_ICONS: Record<string, string> = {
  '.alp': 'fileText',
  '.md': 'fileText',
  '.json': 'fileCode',
  '.ts': 'fileCode',
  '.js': 'fileCode',
  '.py': 'fileCode',
  '.yml': 'fileText',
  '.yaml': 'fileText',
  '.sh': 'terminal',
};

const WORKSPACE_TREE: TreeNode[] = [
  {
    id: 'src',
    name: 'src',
    type: 'folder',
    path: 'src',
    children: [
      { id: 'src-index', name: 'index.ts', type: 'file', path: 'src/index.ts', icon: 'fileCode' },
      {
        id: 'src-agents',
        name: 'agents',
        type: 'folder',
        path: 'src/agents',
        children: [
          { id: 'src-agents-hello', name: 'hello.alp', type: 'file', path: 'src/agents/hello.alp', icon: 'fileText' },
          { id: 'src-agents-swarm', name: 'swarm.alp', type: 'file', path: 'src/agents/swarm.alp', icon: 'fileText' },
        ],
      },
      {
        id: 'src-skills',
        name: 'skills',
        type: 'folder',
        path: 'src/skills',
        children: [
          { id: 'src-skills-utils', name: 'utils.alp', type: 'file', path: 'src/skills/utils.alp', icon: 'fileText' },
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
      { id: 'docs-readme', name: 'README.md', type: 'file', path: 'docs/README.md', icon: 'fileText' },
      { id: 'docs-api', name: 'API.md', type: 'file', path: 'docs/API.md', icon: 'fileText' },
    ],
  },
  { id: 'root-alp', name: 'example.alp', type: 'file', path: 'example.alp', icon: 'fileText' },
  { id: 'root-readme', name: 'README.md', type: 'file', path: 'README.md', icon: 'fileText' },
  { id: 'root-config', name: 'alp.config.json', type: 'file', path: 'alp.config.json', icon: 'settings' },
  { id: 'root-governance', name: 'governance.alp', type: 'file', path: 'governance.alp', icon: 'fileText' },
  { id: 'root-contracts', name: 'contracts.alp', type: 'file', path: 'contracts.alp', icon: 'fileText' },
];

function getFileIcon(name: string): string {
  const ext = name.includes('.') ? '.' + name.split('.').pop() : '';
  return FILE_ICONS[ext] || 'fileText';
}

function TreeItem({ node, depth = 0, onOpenFile, activeFile }: { node: TreeNode; depth?: number; onOpenFile: (path: string) => void; activeFile: string | null }): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const isFolder = node.type === 'folder';
  const icon = node.icon || (isFolder ? (expanded ? 'folderOpen' : 'folder') : getFileIcon(node.name));

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
        <span className="tree-item-icon"><Icon name={icon as any} size={14} /></span>
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
            <Icon name="plus" size={14} />
          </button>
        </div>
        <div className="sidebar-list">
          {state.openFiles.map((file) => (
            <div
              key={file}
              className={`sidebar-item ${state.activeFile === file ? 'active' : ''}`}
              onClick={() => onOpenFile(file)}
            >
              <span className="sidebar-item-icon"><Icon name={getFileIcon(file) as any} size={14} /></span>
              <span className="sidebar-item-label">{file}</span>
              <button
                className="sidebar-item-close"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseFile(file);
                }}
              >
                <Icon name="x" size={12} />
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
            <Icon name={panelIcons[panel] || 'box'} size={14} />
            {panel.charAt(0).toUpperCase() + panel.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
