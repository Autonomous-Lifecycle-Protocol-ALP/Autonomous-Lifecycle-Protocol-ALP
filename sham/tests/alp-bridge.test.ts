import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockIpcHandle = vi.fn();
const mockIpcMain = { handle: mockIpcHandle };

vi.mock('electron', () => ({
  BrowserWindow: class MockBrowserWindow {},
  ipcMain: mockIpcMain,
  app: { getVersion: () => '0.1.0' },
}));

describe('ALP Bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIpcHandle.mockClear();
  });

  it('should register alp-parse handler', async () => {
    const { setupALPBridge } = await import('../src/main/alp-bridge.js');
    setupALPBridge({} as any);
    expect(mockIpcHandle).toHaveBeenCalledWith('alp-parse', expect.any(Function));
  });

  it('should register alp-validate handler', async () => {
    const { setupALPBridge } = await import('../src/main/alp-bridge.js');
    setupALPBridge({} as any);
    expect(mockIpcHandle).toHaveBeenCalledWith('alp-validate', expect.any(Function));
  });

  it('should register alp-get-block-types handler', async () => {
    const { setupALPBridge } = await import('../src/main/alp-bridge.js');
    setupALPBridge({} as any);
    expect(mockIpcHandle).toHaveBeenCalledWith('alp-get-block-types', expect.any(Function));
  });

  it('should register alp-run-agent handler', async () => {
    const { setupALPBridge } = await import('../src/main/alp-bridge.js');
    setupALPBridge({} as any);
    expect(mockIpcHandle).toHaveBeenCalledWith('alp-run-agent', expect.any(Function));
  });

  it('should register workspace template and dialog handlers', async () => {
    const { setupALPBridge } = await import('../src/main/alp-bridge.js');
    setupALPBridge({} as any);
    expect(mockIpcHandle).toHaveBeenCalledWith('workspace-list-templates', expect.any(Function));
    expect(mockIpcHandle).toHaveBeenCalledWith('workspace-scaffold-template', expect.any(Function));
    expect(mockIpcHandle).toHaveBeenCalledWith('workspace-lint-all', expect.any(Function));
    expect(mockIpcHandle).toHaveBeenCalledWith('dialog-open-folder', expect.any(Function));
  });
});