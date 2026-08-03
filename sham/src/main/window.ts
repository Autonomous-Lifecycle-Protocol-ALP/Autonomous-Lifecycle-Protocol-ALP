import { BrowserWindow } from 'electron';
import { join } from 'path';

export function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    icon: join(__dirname, '../../assets/icon.png'),
    title: 'SHAM - Smart Hosted Agent Manager',
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  win.on('ready-to-show', () => {
    win.show();
  });

  return win;
}