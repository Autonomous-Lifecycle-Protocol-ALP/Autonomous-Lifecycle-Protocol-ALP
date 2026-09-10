import type { SHAMState } from '../shared/types.js';

export interface SidebarProps {
  state: SHAMState;
  onOpenFile: (filePath: string) => void;
  onCloseFile: (filePath: string) => void;
  onSelectAgent: (id: string) => void;
  activePanel: string;
  setActivePanel: (panel: string) => void;
}

export interface TreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: TreeNode[];
  icon?: string;
}

export interface TreeItemProps {
  node: TreeNode;
  onOpenFile: (path: string) => void;
  activeFile: string | null;
  depth?: number;
}

export const panelIcons: Record<string, string> = {
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
  multimodal: 'camera',
};

export const FILE_ICONS: Record<string, string> = {
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

export const WORKSPACE_TREE: TreeNode[] = [
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

export function getFileIcon(filePath: string): string {
  const ext = filePath.includes('.') ? '.' + filePath.split('.').pop() : '';
  return FILE_ICONS[ext] ?? 'fileCode';
}
