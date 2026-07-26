import { ALPAgent, ALPMCPTool } from './types.js';

export const shamAPI = window.shamAPI;

export async function parseALPFile(content: string, filePath: string) {
  return shamAPI.parseALP({ content, filePath });
}

export async function validateALPFile(content: string, filePath: string) {
  return shamAPI.validateALP({ content, filePath });
}

export async function fetchBlockTypes() {
  return shamAPI.getBlockTypes();
}

export async function runAgent(agentId: string, config: Record<string, unknown>) {
  return shamAPI.runAgent({ agentId, config });
}

export async function getAppVersion() {
  return shamAPI.getAppVersion();
}

export function onAppReady(callback: (payload: unknown) => void) {
  shamAPI.onAppReady(callback);
}