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
});