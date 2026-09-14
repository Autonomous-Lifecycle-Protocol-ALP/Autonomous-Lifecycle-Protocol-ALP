import { BrowserWindow } from 'electron';
import { join } from 'path';
import * as fs from 'fs';

export function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    show: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
    icon: join(__dirname, '../../assets/icon.png'),
    title: 'SHAM - Smart Hosted Agent Manager',
  });

  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    try {
      fs.appendFileSync(join(__dirname, '..', '..', 'electron-boot.log'), `[RENDERER ${level}] ${message} (${sourceId}:${line})\n`, 'utf-8');
    } catch {}
  });

  win.webContents.on('render-process-gone', (_event, details) => {
    try {
      fs.appendFileSync(join(__dirname, '..', '..', 'electron-boot.log'), `[RENDER PROCESS GONE] ${JSON.stringify(details)}\n`, 'utf-8');
    } catch {}
  });

  const rendererHtml = join(__dirname, '../renderer/index.html');
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (fs.existsSync(rendererHtml)) {
    win.loadFile(rendererHtml);
  } else if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(rendererHtml);
  }

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error(`Window failed to load: ${errorCode} - ${errorDescription}`);
    if (fs.existsSync(rendererHtml)) {
      win.loadFile(rendererHtml);
    }
  });

  win.on('ready-to-show', () => {
    win.show();
  });

  return win;
}