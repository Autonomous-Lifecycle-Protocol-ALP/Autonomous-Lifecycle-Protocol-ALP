import {
  ALPAgent,
  ALPMCPTool,
  LicenseInfo,
  CloudSyncState,
  TeamMember,
  TeamState,
  UpdateStatus,
} from './types.js';

const api = (window as any).shamAPI;

export const shamAPI = api;

function noop(..._args: unknown[]) {
  return undefined;
}

function safeApi<T extends (...args: unknown[]) => unknown>(fallback: T) {
  return (...args: unknown[]) => (api ? api[fallback.name]?.(...args) : fallback(...args));
}

export async function parseALPFile(content: string, filePath: string) {
  return api?.parseALP?.({ content, filePath }) ?? { success: false, error: 'shamAPI unavailable' };
}

export async function validateALPFile(content: string, filePath: string) {
  return api?.validateALP?.({ content, filePath }) ?? { success: false, diagnostics: [] };
}

export async function fetchBlockTypes() {
  return api?.getBlockTypes?.() ?? { success: true, blockTypes: ['agent', 'skill', 'macro', 'event', 'memory', 'contract', 'vault', 'swarm', 'workflow'] };
}

export async function runAgent(agentId: string, config: Record<string, unknown>) {
  return api?.runAgent?.({ agentId, config }) ?? { success: true, data: { agentId, status: 'running', config } };
}

export async function getAppVersion() {
  return api?.getAppVersion?.() ?? '0.1.0';
}

export function onAppReady(callback: (payload: unknown) => void) {
  if (api?.onAppReady) {
    api.onAppReady(callback);
  } else {
    setTimeout(() => callback({ version: '0.1.0' }), 0);
  }
}

export async function getLicense() {
  return (api?.getLicense?.() ?? { plan: 'free' }) as LicenseInfo;
}

export async function activateLicense(info: {
  key: string;
  email: string;
  plan: 'free' | 'pro' | 'team';
  expiresAt?: string;
}) {
  return (api?.activateLicense?.(info) ?? { plan: info.plan }) as LicenseInfo;
}

export async function getCloudSync() {
  return (api?.getCloudSync?.() ?? { enabled: false }) as CloudSyncState;
}

export async function setCloudSync(state: { enabled: boolean; endpoint?: string }) {
  return (api?.setCloudSync?.(state) ?? state) as CloudSyncState;
}

export async function getTeam() {
  return (api?.getTeam?.() ?? { workspaceId: '', members: [] }) as TeamState;
}

export async function inviteMember(member: {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}) {
  return (api?.inviteMember?.(member) ?? { workspaceId: '', members: [member] }) as TeamState;
}

export async function removeMember(memberId: string) {
  return (api?.removeMember?.(memberId) ?? { workspaceId: '', members: [] }) as TeamState;
}

export async function checkUpdate() {
  return (api?.checkUpdate?.() ?? { available: false }) as UpdateStatus;
}

export async function downloadUpdate() {
  return (api?.downloadUpdate?.() ?? { downloaded: false }) as UpdateStatus;
}

export async function installUpdate() {
  api?.installUpdate?.();
  return { installing: false };
}

export async function execTerminalCommand(command: string) {
  return (api?.execTerminalCommand?.(command) ?? { success: false, stdout: '', stderr: 'shamAPI unavailable' }) as {
    success: boolean;
    stdout: string;
    stderr: string;
    error?: string;
  };
}
