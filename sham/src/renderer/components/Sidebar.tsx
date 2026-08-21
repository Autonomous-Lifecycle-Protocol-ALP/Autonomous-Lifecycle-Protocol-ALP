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
  intelligence: 'cpu',
  autonomy: 'zap',
  'test-runner': 'playCircle',
  debugger: 'bug',
  pro: 'star',
  synapse: 'network',
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
  { id: 'root-project', name: 'project.alp', type: 'file', path: 'project.alp', icon: 'fileText' },
  { id: 'root-package', name: 'package.json', type: 'file', path: 'package.json', icon: 'fileCode' },
];

function getFileIcon(filePath: string): string {
  const ext = filePath.includes('.') ? '.' + filePath.split('.').pop() : '';
  return FILE_ICONS[ext] ?? 'fileCode';
}

interface TreeItemProps {
  node: TreeNode;
  onOpenFile: (path: string) => void;
  activeFile: string | null;
  depth?: number;
}

function TreeItem({ node, onOpenFile, activeFile, depth = 0 }: TreeItemProps): React.JSX.Element {
  const [open, setOpen] = useState(true);

  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  }, []);

  const handleClick = useCallback(() => {
    if (node.type === 'file') {
      onOpenFile(node.path);
    } else {
      setOpen((prev) => !prev);
    }
  }, [node, onOpenFile]);

  const paddingLeft = 12 + depth * 14;

  if (node.type === 'folder') {
    return (
      <div className="sidebar-tree-folder">
        <div className="sidebar-tree-row" style={{ paddingLeft }} onClick={handleClick}>
          <span className="sidebar-tree-toggle" onClick={toggle}>
            <Icon name={open ? 'chevronDown' : 'chevronRight'} size={12} />
          </span>
          <span className="sidebar-tree-icon">
            <Icon name="folderOpen" size={14} />
          </span>
          <span className="sidebar-tree-label">{node.name}</span>
        </div>
        {open && node.children && (
          <div className="sidebar-tree-children">
            {node.children.map((child) => (
              <TreeItem key={child.id} node={child} onOpenFile={onOpenFile} activeFile={activeFile} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`sidebar-tree-row sidebar-tree-file ${activeFile === node.path ? 'active' : ''}`}
      style={{ paddingLeft: paddingLeft + 16 }}
      onClick={handleClick}
    >
      <span className="sidebar-tree-icon">
        <Icon name={(node.icon as any) || getFileIcon(node.name) as any} size={14} />
      </span>
      <span className="sidebar-tree-label">{node.name}</span>
    </div>
  );
}

export function Sidebar({ state, onOpenFile, onCloseFile, activePanel, setActivePanel }: SidebarProps): React.JSX.Element {
  return (
    <div className="sidebar" style={{ background: 'linear-gradient(to bottom, rgba(24, 24, 37, 0.8), rgba(17, 17, 27, 0.9))', boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.05)' }}>
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
              style={state.activeFile === file ? { background: 'linear-gradient(90deg, rgba(137,180,250,0.1) 0%, transparent 100%)', borderLeftColor: 'var(--accent)', color: 'var(--accent)' } : {}}
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
        {['editor', 'terminal', 'agents', 'synapse', 'mcp', 'collab', 'plugins', 'profiler', 'copilot', 'refactor', 'marketplace', 'zk', 'partition', 'crdtCanvas', 'wasmAst', 'edgeDebug', 'telemetryInspector', 'chaosEngine', 'featureFlags', 'workflowReplay', 'localStorage', 'selfHealingMesh', 'intelligence', 'autonomy', 'test-runner', 'debugger', 'git', 'search', 'pro', 'settings'].map((panel) => (
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
             panel === 'test-runner' ? 'Tests' :
             panel.charAt(0).toUpperCase() + panel.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
