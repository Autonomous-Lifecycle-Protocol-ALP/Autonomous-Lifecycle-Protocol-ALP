import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockIpcHandle = vi.fn();
const mockIpcMain = { handle: mockIpcHandle };

vi.mock('electron', () => ({
  ipcMain: mockIpcMain,
  app: { getPath: () => '/mock/user/data' },
}));

vi.mock('electron-updater', () => ({
  autoUpdater: {
    checkForUpdates: vi.fn(),
    downloadUpdate: vi.fn(),
    quitAndInstall: vi.fn(),
    once: vi.fn(),
  },
}));

describe('SHAM Pro & Cloud Sync IPC Bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIpcHandle.mockClear();
  });

  it('registers pro license and cloud sync handlers', async () => {
    const { setupProFeatures } = await import('../src/main/pro.js');
    setupProFeatures();

    expect(mockIpcHandle).toHaveBeenCalledWith('pro-get-license', expect.any(Function));
    expect(mockIpcHandle).toHaveBeenCalledWith('pro-activate-license', expect.any(Function));
    expect(mockIpcHandle).toHaveBeenCalledWith('pro-get-cloud-sync', expect.any(Function));
    expect(mockIpcHandle).toHaveBeenCalledWith('pro-set-cloud-sync', expect.any(Function));
    expect(mockIpcHandle).toHaveBeenCalledWith('cloud-sync-status', expect.any(Function));
    expect(mockIpcHandle).toHaveBeenCalledWith('cloud-sync-push', expect.any(Function));
    expect(mockIpcHandle).toHaveBeenCalledWith('cloud-sync-pull', expect.any(Function));
    expect(mockIpcHandle).toHaveBeenCalledWith('pro-get-team', expect.any(Function));
    expect(mockIpcHandle).toHaveBeenCalledWith('pro-invite-member', expect.any(Function));
    expect(mockIpcHandle).toHaveBeenCalledWith('pro-remove-member', expect.any(Function));
    expect(mockIpcHandle).toHaveBeenCalledWith('pro-check-update', expect.any(Function));
    expect(mockIpcHandle).toHaveBeenCalledWith('pro-download-update', expect.any(Function));
    expect(mockIpcHandle).toHaveBeenCalledWith('pro-install-update', expect.any(Function));
  });
});
