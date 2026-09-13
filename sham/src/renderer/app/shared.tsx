import React, { Suspense } from 'react';
import type { SHAMState } from '../shared/types.js';

export type PanelId =
  | 'editor'
  | 'terminal'
  | 'agents'
  | 'synapse'
  | 'multimodal'
  | 'mcp'
  | 'collab'
  | 'plugins'
  | 'profiler'
  | 'copilot'
  | 'refactor'
  | 'pro'
  | 'settings'
  | 'git'
  | 'search'
  | 'debugger'
  | 'test-runner'
  | 'marketplace'
  | 'zk'
  | 'partition'
  | 'crdtCanvas'
  | 'wasmAst'
  | 'edgeDebug'
  | 'telemetryInspector'
  | 'chaosEngine'
  | 'featureFlags'
  | 'workflowReplay'
  | 'localStorage'
  | 'selfHealingMesh'
  | 'intelligence'
  | 'autonomy'
  | 'agentStudio'
  | 'modelHub'
  | 'socSentinel';

export const defaultState: SHAMState = {
  activeFile: null,
  openFiles: [],
  selectedAgent: null,
  terminalOutput: [],
  diagnostics: [],
  blockTypes: [],
  agents: [],
  mcpTools: [],
  parseResult: null,
  collab: { session: null, output: [], presence: [] },
  plugins: { plugins: [], output: [] },
  profiler: { traces: [], output: [] },
  copilot: { suggestions: [], output: [] },
  refactor: { renames: [], output: [] },
  debug: { session: null, output: [] },
  testRunner: { suites: [], output: [] },
  intelligence: { suggestions: [], output: [] },
  autonomy: { decisions: [], output: [] },
};

export type PanelCategory =
  | 'core'
  | 'intelligence'
  | 'swarm'
  | 'testing'
  | 'platform';

export interface PanelDefinition {
  id: PanelId;
  label: string;
  icon: string;
  category: PanelCategory;
  description: string;
  badge?: string;
  shortcut?: string;
}

export interface PanelCategoryMeta {
  id: PanelCategory;
  label: string;
  icon: string;
  description: string;
}

export const PANEL_CATEGORIES: PanelCategoryMeta[] = [
  { id: 'core', label: 'Core Development', icon: 'edit3', description: 'Code editor, terminals, search, and VCS tools' },
  { id: 'intelligence', label: 'AI & Intelligence', icon: 'bot', description: 'Autonomous agents, copilot, reasoning, and multimodal tools' },
  { id: 'swarm', label: 'Swarm & Distributed', icon: 'users', description: 'Agent marketplace, CRDT canvas, DAG partitions, and mesh' },
  { id: 'testing', label: 'Testing & Profiling', icon: 'playCircle', description: 'Unit tests, debuggers, profiler, and chaos testing' },
  { id: 'platform', label: 'Platform & Security', icon: 'shield', description: 'ZK proofs, WASM AST, storage, feature flags, and pro suite' },
];

export const ALL_PANELS: PanelDefinition[] = [
  // Core Development
  { id: 'editor', label: 'Editor', icon: 'edit3', category: 'core', description: 'Code editor with syntax highlighting, diagnostics and autocompletions', shortcut: 'Ctrl+1' },
  { id: 'terminal', label: 'Terminal', icon: 'terminal', category: 'core', description: 'Integrated shell and runtime build output console', shortcut: 'Ctrl+`' },
  { id: 'mcp', label: 'MCP Browser', icon: 'cpu', category: 'core', description: 'Model Context Protocol tool ecosystem and server explorer' },
  { id: 'git', label: 'Git Control', icon: 'gitBranch', category: 'core', description: 'Version control staging, branch management, and diff log' },
  { id: 'search', label: 'Workspace Search', icon: 'search', category: 'core', description: 'Fast full-text project search and symbol navigation', shortcut: 'Ctrl+F' },
  { id: 'settings', label: 'Settings', icon: 'settings', category: 'core', description: 'IDE configuration, theme preferences, and keybinding management', shortcut: 'Ctrl+,' },

  // AI & Intelligence
  { id: 'agents', label: 'Agents', icon: 'users', category: 'intelligence', description: 'Autonomous agent lifecycle orchestrator and swarm monitor', badge: 'Swarm' },
  { id: 'copilot', label: 'Copilot', icon: 'bot', category: 'intelligence', description: 'Real-time AI coding assistant and intelligent explanations', badge: 'AI' },
  { id: 'intelligence', label: 'Intelligence', icon: 'cpu', category: 'intelligence', description: 'Contextual reasoning insights and smart diagnostics engine' },
  { id: 'autonomy', label: 'Autonomy', icon: 'zap', category: 'intelligence', description: 'Autonomous agent decision trees and execution policies' },
  { id: 'synapse', label: 'Synapse Graph', icon: 'network', category: 'intelligence', description: 'Visual neural connection topology and state flow explorer' },
  { id: 'multimodal', label: 'MultiModal', icon: 'camera', category: 'intelligence', description: 'Vision models, image generation, and audio artifact inspector' },
  { id: 'agentStudio', label: 'Agent Studio', icon: 'palette', category: 'intelligence', description: 'Visual low-code DAG agent designer with cycle-detecting topological validation', badge: 'NEW' },
  { id: 'modelHub', label: 'Model Hub', icon: 'cpu', category: 'intelligence', description: 'Curated AI model marketplace, prompt benchmarking, and head-to-head A/B testing', badge: 'AI' },

  // Swarm & Distributed
  { id: 'marketplace', label: 'Marketplace', icon: 'shoppingBag', category: 'swarm', description: 'Decentralized skills, agent templates, and protocol extensions' },
  { id: 'crdtCanvas', label: 'CRDT Canvas', icon: 'palette', category: 'swarm', description: 'Collaborative real-time canvas and whiteboard for system architecture' },
  { id: 'partition', label: 'DAG Partition', icon: 'globe', category: 'swarm', description: 'Distributed DAG task graph partition and worker allocation' },
  { id: 'selfHealingMesh', label: 'Self-Healing Mesh', icon: 'shield', category: 'swarm', description: 'Autonomous peer mesh recovery and health topology' },
  { id: 'collab', label: 'Collaboration', icon: 'userPlus', category: 'swarm', description: 'Multiplayer peer-to-peer session and presence sync' },

  // Testing & Profiling
  { id: 'test-runner', label: 'Test Runner', icon: 'playCircle', category: 'testing', description: 'Automated test suite execution and test coverage reporting', shortcut: 'Ctrl+T' },
  { id: 'debugger', label: 'Debugger', icon: 'bug', category: 'testing', description: 'Interactive debugger with breakpoints and variable scopes', shortcut: 'F5' },
  { id: 'edgeDebug', label: 'Edge Debug', icon: 'bug', category: 'testing', description: 'Remote edge worker live telemetry and packet inspection' },
  { id: 'profiler', label: 'Profiler', icon: 'activity', category: 'testing', description: 'CPU flamegraphs, memory allocation, and performance traces' },
  { id: 'chaosEngine', label: 'Chaos Engine', icon: 'alertTriangle', category: 'testing', description: 'Fault injection, network latency simulation, and resilience testing' },
  { id: 'workflowReplay', label: 'Workflow Replay', icon: 'playCircle', category: 'testing', description: 'Time-travel deterministic replay of execution traces' },

  // Platform & Security
  { id: 'zk', label: 'ZK Proof', icon: 'lock', category: 'platform', description: 'Zero-knowledge succinct proofs and state verification' },
  { id: 'socSentinel', label: 'SOC Sentinel', icon: 'shield', category: 'platform', description: 'Real-time threat detection, incident response, and agent swarm attack surface monitoring', badge: 'SOC' },
  { id: 'wasmAst', label: 'WASM AST', icon: 'zap', category: 'platform', description: 'WebAssembly bytecode abstract syntax tree disassembly' },
  { id: 'featureFlags', label: 'Feature Flags', icon: 'flag', category: 'platform', description: 'Dynamic runtime feature toggles and canary rollout control' },
  { id: 'localStorage', label: 'Local Storage', icon: 'hardDrive', category: 'platform', description: 'Embedded persistent key-value store and cache inspector' },
  { id: 'telemetryInspector', label: 'Telemetry', icon: 'monitor', category: 'platform', description: 'Real-time metrics, distributed traces, and system health status' },
  { id: 'refactor', label: 'Refactor', icon: 'code', category: 'platform', description: 'Automated AST-aware symbol renaming and code modernization' },
  { id: 'plugins', label: 'Plugins', icon: 'puzzle', category: 'platform', description: 'Installed extension management and custom plugin development' },
  { id: 'pro', label: 'Pro Suite', icon: 'star', category: 'platform', description: 'Enterprise team governance, compliance audit, and support', badge: 'PRO' },
];

export const panels: { id: PanelId; label: string }[] = [
  { id: 'editor', label: 'Editor' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'agents', label: 'Agents' },
  { id: 'agentStudio', label: 'Agent Studio' },
  { id: 'modelHub', label: 'Model Hub' },
  { id: 'socSentinel', label: 'SOC Sentinel' },
  { id: 'synapse', label: 'Synapse' },
  { id: 'mcp', label: 'MCP' },
  { id: 'intelligence', label: 'Intelligence' },
  { id: 'autonomy', label: 'Autonomy' },
  { id: 'collab', label: 'Collab' },
  { id: 'plugins', label: 'Plugins' },
  { id: 'profiler', label: 'Profiler' },
  { id: 'copilot', label: 'Copilot' },
  { id: 'refactor', label: 'Refactor' },
  { id: 'debugger', label: 'Debugger' },
  { id: 'test-runner', label: 'Tests' },
  { id: 'settings', label: 'Settings' },
  { id: 'git', label: 'Git' },
  { id: 'search', label: 'Search' },
];

export const bottomTabs = [
  { id: 'terminal', label: 'Terminal' },
  { id: 'problems', label: 'Problems' },
  { id: 'output', label: 'Output' },
  { id: 'debug', label: 'Debug Console' },
] as const;

export type BottomTabId = (typeof bottomTabs)[number]['id'];

export const PanelSuspense: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<div className="panel-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>Loading panel...</div>}>
    {children}
  </Suspense>
);

export type AppProps = Record<string, never>;