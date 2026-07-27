import {
  ALPAgent,
  ALPMCPTool,
  LicenseInfo,
  CloudSyncState,
  TeamMember,
  TeamState,
  UpdateStatus,
} from './types.js';

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

export async function getLicense() {
  return shamAPI.getLicense() as Promise<LicenseInfo>;
}

export async function activateLicense(info: {
  key: string;
  email: string;
  plan: 'free' | 'pro' | 'team';
  expiresAt?: string;
}) {
  return shamAPI.activateLicense(info) as Promise<LicenseInfo>;
}

export async function getCloudSync() {
  return shamAPI.getCloudSync() as Promise<CloudSyncState>;
}

export async function setCloudSync(state: { enabled: boolean; endpoint?: string }) {
  return shamAPI.setCloudSync(state) as Promise<CloudSyncState>;
}

export async function getTeam() {
  return shamAPI.getTeam() as Promise<TeamState>;
}

export async function inviteMember(member: {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}) {
  return shamAPI.inviteMember(member) as Promise<TeamState>;
}

export async function removeMember(memberId: string) {
  return shamAPI.removeMember(memberId) as Promise<TeamState>;
}

export async function checkUpdate() {
  return shamAPI.checkUpdate() as Promise<UpdateStatus>;
}

export async function downloadUpdate() {
  return shamAPI.downloadUpdate() as Promise<UpdateStatus>;
}

export async function installUpdate() {
  return shamAPI.installUpdate() as Promise<UpdateStatus>;
}
