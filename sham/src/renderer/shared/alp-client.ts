import {
  ALPAgent,
  ALPMCPTool,
  LicenseInfo,
  CloudSyncState,
  TeamMember,
  TeamState,
  UpdateStatus,
  Plugin,
  PluginState,
  ProfileTrace,
  ProfilerState,
  CopilotSuggestion,
  RefactorRename,
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

export async function startCollab(mode: 'host' | 'peer') {
  return (api?.startCollab?.(mode) ?? { success: false, stdout: '', stderr: 'shamAPI unavailable' }) as {
    success: boolean;
    stdout: string;
    stderr: string;
    error?: string;
  };
}

export async function joinCollab(sessionId: string) {
  return (api?.joinCollab?.(sessionId) ?? { success: false, stdout: '', stderr: 'shamAPI unavailable' }) as {
    success: boolean;
    stdout: string;
    stderr: string;
    error?: string;
  };
}

export async function getCollabStatus() {
  return (api?.getCollabStatus?.() ?? { success: false, stdout: '', stderr: 'shamAPI unavailable' }) as {
    success: boolean;
    stdout: string;
    stderr: string;
    error?: string;
  };
}

export async function leaveCollab() {
  return (api?.leaveCollab?.() ?? { success: false, stdout: '', stderr: 'shamAPI unavailable' }) as {
    success: boolean;
    stdout: string;
    stderr: string;
    error?: string;
  };
}

export async function getCRDTStatus() {
  return (api?.getCRDTStatus?.() ?? { success: false, stdout: '', stderr: 'shamAPI unavailable' }) as {
    success: boolean;
    stdout: string;
    stderr: string;
    error?: string;
  };
}

export async function mergeCRDT() {
  return (api?.mergeCRDT?.() ?? { success: false, stdout: '', stderr: 'shamAPI unavailable' }) as {
    success: boolean;
    stdout: string;
    stderr: string;
    error?: string;
  };
}

export async function listPlugins() {
  return (api?.listPlugins?.() ?? { success: false, plugins: [] }) as { success: boolean; plugins: Plugin[]; error?: string };
}

export async function togglePlugin(pluginId: string, enabled: boolean) {
  return (api?.togglePlugin?.({ pluginId, enabled }) ?? { success: false, plugins: [] }) as { success: boolean; plugins: Plugin[]; message?: string; error?: string };
}

export async function reloadPlugin(pluginId: string) {
  return (api?.reloadPlugin?.({ pluginId }) ?? { success: false, plugins: [] }) as { success: boolean; plugins: Plugin[]; message?: string; error?: string };
}

export async function profilerStart(payload: { agentId?: string; command?: string }) {
  return (api?.profilerStart?.(payload) ?? { success: false, trace: null }) as { success: boolean; trace: ProfileTrace | null; error?: string };
}

export async function profilerStop(payload: { traceId: string; status: 'completed' | 'failed'; stdout?: string; stderr?: string; error?: string }) {
  return (api?.profilerStop?.(payload) ?? { success: false, trace: null }) as { success: boolean; trace: ProfileTrace | null; error?: string };
}

export async function profilerList() {
  return (api?.profilerList?.() ?? { success: false, traces: [] }) as { success: boolean; traces: ProfileTrace[] };
}

export async function profilerClear() {
  return (api?.profilerClear?.() ?? { success: false }) as { success: boolean };
}

export async function copilotSuggest(payload: { content: string; filePath: string }) {
  return (api?.copilotSuggest?.(payload) ?? { success: false, suggestions: [] }) as { success: boolean; suggestions: CopilotSuggestion[]; error?: string };
}

export async function copilotApplyFix(payload: { filePath: string; suggestionId: string; insertText?: string; range?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number } }) {
  return (api?.copilotApplyFix?.(payload) ?? { success: false, applied: false }) as { success: boolean; applied: boolean; message?: string; error?: string };
}

export async function refactorFindSymbols(payload: { filePath: string }) {
  return (api?.refactorFindSymbols?.(payload) ?? { success: false, renames: [] }) as { success: boolean; renames: RefactorRename[]; error?: string };
}

export async function refactorPreview(payload: { filePath: string; oldName: string; newName: string; kind: RefactorRename['kind'] }) {
  return (api?.refactorPreview?.(payload) ?? { success: false, renames: [] }) as { success: boolean; renames: RefactorRename[]; error?: string };
}

export async function refactorRename(payload: { filePath: string; oldName: string; newName: string; kind: RefactorRename['kind'] }) {
  return (api?.refactorRename?.(payload) ?? { success: false, renames: [] }) as { success: boolean; renames: RefactorRename[]; error?: string };
}

export async function collabCursorMove(payload: { peerId: string; line: number; column: number; selection?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number } }) {
  return (api?.collabCursorMove?.(payload) ?? { success: false, received: false }) as { success: boolean; received: boolean };
}

export async function collabBroadcastPresence(payload: { peerId: string; displayName: string; color: string; cursor?: { line: number; column: number }; selection?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number } }) {
  return (api?.collabBroadcastPresence?.(payload) ?? { success: false, received: false }) as { success: boolean; received: boolean };
}

export async function cloudSyncStatus() {
  return (api?.cloudSyncStatus?.() ?? { success: false }) as { success: boolean; enabled: boolean; lastSyncAt?: string; endpoint?: string };
}

export async function cloudSyncPush(payload: { data: unknown }) {
  return (api?.cloudSyncPush?.(payload) ?? { success: false }) as { success: boolean; lastSyncAt?: string; error?: string };
}

export async function cloudSyncPull() {
  return (api?.cloudSyncPull?.() ?? { success: false, data: null }) as { success: boolean; data: unknown; lastSyncAt?: string; error?: string };
}
