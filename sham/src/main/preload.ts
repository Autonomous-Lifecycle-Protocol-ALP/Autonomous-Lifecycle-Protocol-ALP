import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('shamAPI', {
  parseALP: (payload: { content: string; filePath: string }) =>
    ipcRenderer.invoke('alp-parse', payload),
  validateALP: (payload: { content: string; filePath: string }) =>
    ipcRenderer.invoke('alp-validate', payload),
  getBlockTypes: () => ipcRenderer.invoke('alp-get-block-types'),
  runAgent: (payload: { agentId: string; config: Record<string, unknown> }) =>
    ipcRenderer.invoke('alp-run-agent', payload),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onAppReady: (callback: (payload: unknown) => void) =>
    ipcRenderer.on('app-ready', (_event, payload) => callback(payload)),
  getLicense: () => ipcRenderer.invoke('pro-get-license'),
  activateLicense: (info: {
    key: string;
    email: string;
    plan: 'free' | 'pro' | 'team';
    expiresAt?: string;
  }) => ipcRenderer.invoke('pro-activate-license', info),
  getCloudSync: () => ipcRenderer.invoke('pro-get-cloud-sync'),
  setCloudSync: (state: { enabled: boolean; endpoint?: string }) =>
    ipcRenderer.invoke('pro-set-cloud-sync', state),
  getTeam: () => ipcRenderer.invoke('pro-get-team'),
  inviteMember: (member: {
    id: string;
    email: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: string;
  }) => ipcRenderer.invoke('pro-invite-member', member),
  removeMember: (memberId: string) =>
    ipcRenderer.invoke('pro-remove-member', memberId),
  checkUpdate: () => ipcRenderer.invoke('pro-check-update'),
  downloadUpdate: () => ipcRenderer.invoke('pro-download-update'),
  installUpdate: () => ipcRenderer.invoke('pro-install-update'),
  execTerminalCommand: (command: string) =>
    ipcRenderer.invoke('terminal-exec', { command }),
  startCollab: (mode: 'host' | 'peer') => ipcRenderer.invoke('collab-start', { mode }),
  joinCollab: (sessionId: string) => ipcRenderer.invoke('collab-join', { sessionId }),
  getCollabStatus: () => ipcRenderer.invoke('collab-status'),
  leaveCollab: () => ipcRenderer.invoke('collab-leave'),
  getCRDTStatus: () => ipcRenderer.invoke('crdt-status'),
  mergeCRDT: () => ipcRenderer.invoke('crdt-merge'),
  listPlugins: () => ipcRenderer.invoke('plugin-list'),
  togglePlugin: (pluginId: string, enabled: boolean) =>
    ipcRenderer.invoke('plugin-toggle', { pluginId, enabled }),
  reloadPlugin: (pluginId: string) =>
    ipcRenderer.invoke('plugin-reload', { pluginId }),
  profilerStart: (payload: { agentId?: string; command?: string }) =>
    ipcRenderer.invoke('profiler-start', payload),
  profilerStop: (payload: { traceId: string; status: 'completed' | 'failed'; stdout?: string; stderr?: string; error?: string }) =>
    ipcRenderer.invoke('profiler-stop', payload),
  profilerList: () => ipcRenderer.invoke('profiler-list'),
  profilerClear: () => ipcRenderer.invoke('profiler-clear'),
  copilotSuggest: (payload: { content: string; filePath: string }) =>
    ipcRenderer.invoke('copilot-suggest', payload),
  copilotApplyFix: (payload: { filePath: string; suggestionId: string; insertText?: string; range?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number } }) =>
    ipcRenderer.invoke('copilot-apply-fix', payload),
  refactorFindSymbols: (payload: { filePath: string }) =>
    ipcRenderer.invoke('refactor-find-symbols', payload),
  refactorPreview: (payload: { filePath: string; oldName: string; newName: string; kind: 'agent' | 'skill' | 'macro' | 'event' | 'memory' | 'contract' | 'vault' | 'swarm' | 'workflow' }) =>
    ipcRenderer.invoke('refactor-preview', payload),
  refactorRename: (payload: { filePath: string; oldName: string; newName: string; kind: 'agent' | 'skill' | 'macro' | 'event' | 'memory' | 'contract' | 'vault' | 'swarm' | 'workflow' }) =>
    ipcRenderer.invoke('refactor-rename', payload),
  collabCursorMove: (payload: { peerId: string; line: number; column: number; selection?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number } }) =>
    ipcRenderer.invoke('collab-cursor-move', payload),
  collabBroadcastPresence: (payload: { peerId: string; displayName: string; color: string; cursor?: { line: number; column: number }; selection?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number } }) =>
    ipcRenderer.invoke('collab-broadcast-presence', payload),
});
