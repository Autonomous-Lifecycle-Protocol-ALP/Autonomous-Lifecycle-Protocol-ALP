import { ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';

export interface LicenseInfo {
  key: string;
  email: string;
  plan: 'free' | 'pro' | 'team';
  activatedAt?: string;
  expiresAt?: string;
}

export interface CloudSyncState {
  enabled: boolean;
  lastSyncAt?: string;
  endpoint?: string;
}

export interface TeamMember {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

const schema = {
  license: {
    type: 'object',
    properties: {
      key: { type: 'string' },
      email: { type: 'string' },
      plan: { type: 'string', enum: ['free', 'pro', 'team'] },
      activatedAt: { type: 'string' },
      expiresAt: { type: 'string' },
    },
    default: { plan: 'free' },
  },
  cloudSync: {
    type: 'object',
    properties: {
      enabled: { type: 'boolean' },
      lastSyncAt: { type: 'string' },
      endpoint: { type: 'string' },
    },
    default: { enabled: false },
  },
  team: {
    type: 'object',
    properties: {
      workspaceId: { type: 'string' },
      members: { type: 'array' },
    },
    default: { workspaceId: '', members: [] },
  },
};

const store = new Store<{
  license: LicenseInfo & { plan: 'free' | 'pro' | 'team' };
  cloudSync: CloudSyncState;
  team: { workspaceId: string; members: TeamMember[] };
}>({ schema });

export function setupProFeatures() {
  ipcMain.handle('pro-get-license', async () => {
    return store.get('license');
  });

  ipcMain.handle('pro-activate-license', async (_event, info: LicenseInfo) => {
    store.set('license', { ...store.get('license'), ...info, activatedAt: new Date().toISOString() });
    return store.get('license');
  });

  ipcMain.handle('pro-get-cloud-sync', async () => {
    return store.get('cloudSync');
  });

  ipcMain.handle('pro-set-cloud-sync', async (_event, state: CloudSyncState) => {
    store.set('cloudSync', { ...store.get('cloudSync'), ...state });
    return store.get('cloudSync');
  });

  ipcMain.handle('pro-get-team', async () => {
    return store.get('team');
  });

  ipcMain.handle('pro-invite-member', async (_event, member: TeamMember) => {
    const team = store.get('team');
    team.members.push(member);
    store.set('team', team);
    return store.get('team');
  });

  ipcMain.handle('pro-remove-member', async (_event, memberId: string) => {
    const team = store.get('team');
      team.members = team.members.filter((m: TeamMember) => m.id !== memberId);
    store.set('team', team);
    return store.get('team');
  });

  ipcMain.handle('pro-check-update', async () => {
    return new Promise((resolve, reject) => {
      autoUpdater.checkForUpdates();
      autoUpdater.once('update-available', () => resolve({ available: true }));
      autoUpdater.once('update-not-available', () => resolve({ available: false }));
      autoUpdater.once('error', (err: Error) => reject(err));
    });
  });

  ipcMain.handle('pro-download-update', async () => {
    return new Promise((resolve, reject) => {
      autoUpdater.downloadUpdate();
      autoUpdater.once('update-downloaded', () => resolve({ downloaded: true }));
      autoUpdater.once('error', (err: Error) => reject(err));
    });
  });

  ipcMain.handle('pro-install-update', async () => {
    autoUpdater.quitAndInstall();
    return { installing: true };
  });
}

export { store as proStore };
