import { ipcMain, app, dialog } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { CollaborationEngine, CRDTSyncEngine } from '@autonomous-lifecycle-protocol-alp/parser';
import type { ProfileTrace } from './types.js';

import { setupParserHandlers } from './parser-handlers.js';
import { setupTerminalHandlers } from './terminal-handlers.js';
import { setupCollaborationHandlers } from './collaboration-handlers.js';
import { setupCrdtHandlers } from './crdt-handlers.js';
import { setupPluginHandlers } from './plugin-handlers.js';
import { setupProfilerHandlers } from './profiler-handlers.js';

const execAsync = promisify(exec);
const profileTraces: ProfileTrace[] = [];
const collabEngine = new CollaborationEngine();
const crdtEngine = new CRDTSyncEngine();

function getStateDir(): string {
  return join(app.getPath('userData'), 'alp-state');
}

function getStateFile(): string {
  return join(getStateDir(), 'engines.json');
}

async function loadParser() {
  const parser = await import('@autonomous-lifecycle-protocol-alp/parser');
  return parser;
}

function safeExecError(error: unknown) {
  const execError = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string };
  return {
    success: false,
    stdout: execError.stdout ?? '',
    stderr: execError.stderr ?? '',
    error: execError.message ?? String(error),
  };
}

export function saveEngineState(): void {
  try {
    const stateFile = getStateFile();
    if (!existsSync(getStateDir())) {
      mkdirSync(getStateDir(), { recursive: true });
    }
    const payload = {
      collaboration: collabEngine.toJSON(),
      crdt: crdtEngine.toJSON(),
      savedAt: new Date().toISOString(),
    };
    writeFileSync(stateFile, JSON.stringify(payload, null, 2), 'utf-8');
  } catch {
    // persistence is best-effort
  }
}

export function loadEngineState(): void {
  try {
    const stateFile = getStateFile();
    if (!existsSync(stateFile)) return;
    const raw = readFileSync(stateFile, 'utf-8');
    const payload = JSON.parse(raw);
    if (payload.collaboration) {
      collabEngine.fromJSON(payload.collaboration);
    }
    if (payload.crdt) {
      crdtEngine.fromJSON(payload.crdt);
    }
  } catch {
    // persistence is best-effort
  }
}

export function setupALPBridge() {
  setupParserHandlers(loadParser);
  setupTerminalHandlers(execAsync);
  setupCollaborationHandlers(collabEngine);
  setupCrdtHandlers(crdtEngine);
  setupPluginHandlers();
  setupProfilerHandlers(profileTraces);

  ipcMain.handle('dialog-open-folder', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
      });
      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true };
      }
      return { success: true, folderPath: result.filePaths[0] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
}
