import { ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

let store: any = null;

const SYNC_DATA_FILE = join(process.resourcesPath || process.cwd(), 'sync-data.json');
const SYNC_SERVER_PORT = 19732; // SHAM sync port
let syncServer: ReturnType<typeof createServer> | null = null;
const syncStore: Record<string, { encrypted: string; updatedAt: string }> = {};

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
            workspaceId: { type: 'string' },
            key: { type: 'string' },
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

function getSyncKey() {
  const s = store ?? null;
  if (!s) return null;
  const key = s.get('cloudSync.key');
  if (!key) {
    const newKey = randomBytes(32).toString('hex');
    s.set('cloudSync', { ...s.get('cloudSync'), key: newKey });
    return newKey;
  }
  return key;
}

function encrypt(text: string, keyHex: string) {
  const iv = randomBytes(12);
  const key = Buffer.from(keyHex, 'hex');
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

function decrypt(payload: string, keyHex: string) {
  const data = Buffer.from(payload, 'base64');
  const iv = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const encrypted = data.subarray(28);
  const key = Buffer.from(keyHex, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

function loadSyncData() {
  try {
    if (existsSync(SYNC_DATA_FILE)) {
      const raw = readFileSync(SYNC_DATA_FILE, 'utf-8');
      Object.assign(syncStore, JSON.parse(raw));
    }
  } catch {
    // ignore corrupt sync data
  }
}

function persistSyncData() {
  try {
    const dir = require('path').dirname(SYNC_DATA_FILE);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(SYNC_DATA_FILE, JSON.stringify(syncStore), 'utf-8');
  } catch {
    // ignore write errors
  }
}

function startSyncServer() {
  if (syncServer) return syncServer;

  loadSyncData();

  syncServer = createServer((req: IncomingMessage, res: ServerResponse) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET') {
      const workspaceId = req.url?.split('/')[1] || 'workspace';
      const record = syncStore[workspaceId];
      if (!record) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Workspace not found' }));
        return;
      }
      res.statusCode = 200;
      res.end(JSON.stringify({ encrypted: record.encrypted, updatedAt: record.updatedAt }));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const workspaceId = req.url?.split('/')[1] || 'workspace';
          syncStore[workspaceId] = {
            encrypted: parsed.encrypted,
            updatedAt: new Date().toISOString(),
          };
          persistSyncData();
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, updatedAt: syncStore[workspaceId].updatedAt }));
        } catch {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid payload' }));
        }
      });
      return;
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  });

  syncServer.listen(SYNC_SERVER_PORT, '127.0.0.1', () => {
    // local sync server ready
  });

  return syncServer;
}

function getLocalSyncEndpoint() {
  return `http://127.0.0.1:${SYNC_SERVER_PORT}`;
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

  ipcMain.handle('pro-set-cloud-sync', async (_event, state: { enabled: boolean; endpoint?: string; workspaceId?: string }) => {
    const s = await getStore();
    const next = { ...s.get('cloudSync'), ...state };
    s.set('cloudSync', next);
    if (next.enabled && !next.endpoint) {
      startSyncServer();
      s.set('cloudSync', { ...next, endpoint: getLocalSyncEndpoint() });
    }
    return s.get('cloudSync');
  });

  ipcMain.handle('cloud-sync-status', async () => {
    const s = await getStore();
    const config = s.get('cloudSync');
    return { success: true, enabled: config.enabled, lastSyncAt: config.lastSyncAt, endpoint: config.endpoint };
  });

  ipcMain.handle('cloud-sync-push', async (_event, payload: { data: unknown }) => {
    try {
      const s = await getStore();
      const config = s.get('cloudSync');
      if (!config.enabled) {
        return { success: false, error: 'Cloud sync is not enabled' };
      }
      const key = getSyncKey();
      if (!key) {
        return { success: false, error: 'Missing sync encryption key' };
      }
      const plaintext = JSON.stringify(payload.data);
      const encrypted = encrypt(plaintext, key);
      const endpoint = config.endpoint || getLocalSyncEndpoint();
      if (!endpoint) {
        return { success: false, error: 'Sync endpoint is missing' };
      }
      if (endpoint === getLocalSyncEndpoint()) {
        startSyncServer();
      }
      const response = await fetch(`${endpoint}/${config.workspaceId || 'workspace'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encrypted }),
      });
      if (!response.ok) {
        return { success: false, error: `Sync push failed: ${response.status}` };
      }
      s.set('cloudSync', { ...config, lastSyncAt: new Date().toISOString() });
      return { success: true, lastSyncAt: new Date().toISOString() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('cloud-sync-pull', async () => {
    try {
      const s = await getStore();
      const config = s.get('cloudSync');
      if (!config.enabled) {
        return { success: false, error: 'Cloud sync is not enabled' };
      }
      const key = getSyncKey();
      if (!key) {
        return { success: false, error: 'Missing sync encryption key' };
      }
      const endpoint = config.endpoint || getLocalSyncEndpoint();
      if (!endpoint) {
        return { success: false, error: 'Sync endpoint is missing' };
      }
      if (endpoint === getLocalSyncEndpoint()) {
        startSyncServer();
      }
      const response = await fetch(`${endpoint}/${config.workspaceId || 'workspace'}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) {
        return { success: false, error: `Sync pull failed: ${response.status}` };
      }
      const result = await response.json() as { encrypted?: string };
      if (!result.encrypted) {
        return { success: false, error: 'No encrypted payload returned' };
      }
      const decrypted = decrypt(result.encrypted, key);
      s.set('cloudSync', { ...config, lastSyncAt: new Date().toISOString() });
      return { success: true, data: JSON.parse(decrypted), lastSyncAt: new Date().toISOString() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
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
