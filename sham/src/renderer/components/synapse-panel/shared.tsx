import type { AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';
import { SynapseVaultFile } from '@autonomous-lifecycle-protocol-alp/sdk';

// View modes for the panel
export type ViewMode = 'graph' | 'vault' | 'canvas' | 'analytics';

export interface SynapsePanelProps {
  parsedObjects?: AlpObject[] | null;
  onSelectNode?: (nodeId: string) => void;
}

export const DEFAULT_SAMPLE_OBJECTS: AlpObject[] = [
  {
    _type: 'agent',
    id: 'agent-orchestrator',
    description: 'Master Orchestration & Task Delegation Agent',
    status: 'active',
  } as any,
  {
    _type: 'agent',
    id: 'agent-security',
    description: 'Zero-Trust & Vault Access Security Specialist',
    status: 'active',
  } as any,
  {
    _type: 'agent',
    id: 'agent-coder',
    description: 'Autonomous Software Engineering Agent',
    status: 'active',
  } as any,
  {
    _type: 'policy',
    id: 'policy-zero-trust',
    description: 'Enforce zero-trust token authentication on all service routes',
    guards: ['task-api-gateway', 'contract-oauth-bridge'],
  } as any,
  {
    _type: 'contract',
    id: 'contract-oauth-bridge',
    description: 'JWT OAuth2.0 Token Handshake Contract',
    status: 'active',
  } as any,
  {
    _type: 'vault',
    id: 'vault-jwt-secrets',
    description: 'Post-Quantum Encrypted Secret Store',
    recipients: ['agent-security'],
  } as any,
  {
    _type: 'task',
    id: 'task-api-gateway',
    status: '[~]',
    description: 'Implement reverse-proxy authentication gate',
    owner: 'agent-security',
    depends: ['contract-oauth-bridge', 'vault-jwt-secrets'],
  } as any,
  {
    _type: 'task',
    id: 'task-codegen-service',
    status: '[x]',
    description: 'Generate type-safe ALP runtime bindings',
    owner: 'agent-coder',
    depends: ['task-api-gateway'],
  } as any,
  {
    _type: 'workflow',
    id: 'wf-continuous-audit',
    description: 'Continuous Formal Verification & Security Scan',
    status: 'scheduled',
    steps: ['policy-zero-trust', 'task-api-gateway'],
  } as any,
];

// Theme colors used across the panel
export const COLORS = {
  bg: '#0d1117',
  bgHeader: '#161b22',
  bgStats: '#11161d',
  border: '#21262d',
  borderLight: '#30363d',
  text: '#c9d1d9',
  textMuted: '#8b949e',
  textBright: '#f0f6fc',
  accent: '#58a6ff',
  green: '#3fb950',
  greenBg: '#238636',
  blue: '#1f6feb',
  purple: '#8b5cf6',
  yellow: '#d29922',
  red: '#f85149',
  violet: '#bc8cff',
};

export function downloadJsonFile(filename: string, data: unknown): void {
  const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(jsonBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildVaultDownloadName(): string {
  return `synapse-vault-${Date.now()}.json`;
}

// Re-export vault file type for consumers of this package
export type { SynapseVaultFile };