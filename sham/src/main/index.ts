import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { createWindow } from './window.js';
import { setupALPBridge } from './alp-bridge.js';
import { setupProFeatures } from './pro.js';

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(() => {
  mainWindow = createWindow();
  setupALPBridge();
  setupProFeatures();

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('app-ready', { version: app.getVersion() });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow();
    setupALPBridge();
    setupProFeatures();
  }
});

ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});
