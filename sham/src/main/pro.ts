import { ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';

let store: any = null;

async function getStore() {
  if (!store) {
    const electronStore = await import('electron-store');
    store = new electronStore.default({
      schema: {
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
      },
    });
  }
  return store;
}

export function setupProFeatures() {
  ipcMain.handle('pro-get-license', async () => {
    const s = await getStore();
    return s.get('license');
  });

  ipcMain.handle('pro-activate-license', async (_event, info: { key: string; email: string; plan: 'free' | 'pro' | 'team'; expiresAt?: string }) => {
    const s = await getStore();
    s.set('license', { ...s.get('license'), ...info, activatedAt: new Date().toISOString() });
    return s.get('license');
  });

  ipcMain.handle('pro-get-cloud-sync', async () => {
    const s = await getStore();
    return s.get('cloudSync');
  });

  ipcMain.handle('pro-set-cloud-sync', async (_event, state: { enabled: boolean; endpoint?: string }) => {
    const s = await getStore();
    s.set('cloudSync', { ...s.get('cloudSync'), ...state });
    return s.get('cloudSync');
  });

  ipcMain.handle('pro-get-team', async () => {
    const s = await getStore();
    return s.get('team');
  });

  ipcMain.handle('pro-invite-member', async (_event, member: { id: string; email: string; role: 'owner' | 'admin' | 'member'; joinedAt: string }) => {
    const s = await getStore();
    const team = s.get('team');
    team.members.push(member);
    s.set('team', team);
    return s.get('team');
  });

  ipcMain.handle('pro-remove-member', async (_event, memberId: string) => {
    const s = await getStore();
    const team = s.get('team');
    team.members = team.members.filter((m: { id: string }) => m.id !== memberId);
    s.set('team', team);
    return s.get('team');
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
