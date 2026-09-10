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
  | 'autonomy';

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

export const panels: { id: PanelId; label: string }[] = [
  { id: 'editor', label: 'Editor' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'agents', label: 'Agents' },
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