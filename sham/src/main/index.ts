import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import * as fs from 'fs';
import { createWindow } from './window.js';
import { setupALPBridge, loadEngineState, saveEngineState } from './alp-bridge.js';
import { setupProFeatures } from './pro.js';

const logFile = join(__dirname, '..', '..', 'electron-boot.log');
function log(msg: string) {
  try {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`, 'utf-8');
  } catch {}
}

process.on('exit', (code) => {
  log(`PROCESS EXIT WITH CODE: ${code}`);
});

process.on('uncaughtException', (err) => {
  log(`UNCAUGHT EXCEPTION: ${err && err.stack ? err.stack : err}`);
});

process.on('unhandledRejection', (reason) => {
  log(`UNHANDLED REJECTION: ${reason}`);
});

let mainWindow: BrowserWindow | null = null;

log('Electron main script loaded');

app.whenReady().then(() => {
  log('app.whenReady resolved');
  try {
    loadEngineState();
    log('loadEngineState completed');
  } catch (e) {
    log(`loadEngineState error: ${e}`);
  }

  try {
    mainWindow = createWindow();
    log('createWindow completed');
  } catch (e) {
    log(`createWindow error: ${e}`);
  }

  try {
    setupALPBridge();
    log('setupALPBridge completed');
  } catch (e) {
    log(`setupALPBridge error: ${e}`);
  }

  try {
    setupProFeatures();
    log('setupProFeatures completed');
  } catch (e) {
    log(`setupProFeatures error: ${e}`);
  }

  mainWindow?.webContents.on('did-finish-load', () => {
    log('webContents did-finish-load');
    mainWindow?.webContents.send('app-ready', { version: app.getVersion() });
  });

  mainWindow?.on('closed', () => {
    log('mainWindow closed');
    mainWindow = null;
  });
}).catch((err) => {
  log(`whenReady error: ${err}`);
});

app.on('window-all-closed', () => {
  log('app window-all-closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  log('app activate');
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow();
    setupALPBridge();
    setupProFeatures();
  }
});

app.on('before-quit', () => {
  log('app before-quit');
  saveEngineState();
});

ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});
