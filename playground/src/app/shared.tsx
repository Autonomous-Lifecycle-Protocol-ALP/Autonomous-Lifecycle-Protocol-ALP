import type { CSSProperties } from 'react';

export type TypeFilter = 'all' | string;
export type LayoutMode = 'dag' | 'tree' | 'grid' | 'force' | 'circular';
export type StatusFilter = 'all' | 'done' | 'progress' | 'blocked' | 'todo';
export type FeatureTab = 'graph' | 'simulation' | 'analytics';

export interface AppProps {}

export interface AppHeaderProps {
  templateKey: string;
  templates: Record<string, { label: string; code: string }>;
  onTemplateChange: (key: string) => void;
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
  showCriticalPath: boolean;
  onToggleCriticalPath: () => void;
  logPanelCollapsed: boolean;
  onToggleLogPanel: () => void;
  minimapEnabled: boolean;
  onToggleMinimap: () => void;
  onAddBlock: () => void;
  onSnapshots: () => void;
  onAnalytics: () => void;
  onSynapse: () => void;
  onMultiModal: () => void;
  onKbdHelp: () => void;
  onFitView: () => void;
  onFormat: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCopyBundle: () => void;
  onExportMermaid: () => void;
  onExportALP: () => void;
  onExportJSON: () => void;
  onExportYAML: () => void;
  onExportPNG: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  completion: number;
  valid: boolean;
  error: string | null;
}

export const EDGE_TYPE_COLORS: Record<string, string> = {
  feature: '#9d4edd',
  owner: '#3b82f6',
  requires: '#f59e0b',
  policy: '#10b981',
  contract: '#f59e0b',
  vault: '#f43f5e',
};

export const DEFAULT_EDGE_COLOR = '#00f0ff';

export function getEdgeColor(type: string): string {
  return EDGE_TYPE_COLORS[type] ?? DEFAULT_EDGE_COLOR;
}

export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function safeLocalStorageSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore write errors
  }
}

export interface SimSpeedOption {
  value: number;
  label: string;
}

export const SIM_SPEEDS: SimSpeedOption[] = [
  { value: 0.5, label: '0.5x Speed' },
  { value: 1, label: '1.0x Speed' },
  { value: 2, label: '2.0x Speed' },
  { value: 5, label: '5.0x Speed' },
];

export type LogLevel = 'info' | 'error' | 'warn' | 'success';

export function classifyLog(log: string): LogLevel {
  if (log.startsWith('[ERROR]')) return 'error';
  if (log.startsWith('[WARN]')) return 'warn';
  if (log.startsWith('[OK]')) return 'success';
  return 'info';
}

export const SYNAPSE_STYLE: CSSProperties = {
  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
  border: '1px solid rgba(168, 85, 247, 0.4)',
  color: '#c084fc',
  fontWeight: 600,
};

export const MULTI_MODAL_STYLE: CSSProperties = {
  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
  border: '1px solid rgba(6, 182, 212, 0.4)',
  color: '#38bdf8',
  fontWeight: 600,
};
