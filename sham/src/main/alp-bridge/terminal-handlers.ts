import { ipcMain } from 'electron';

export function setupTerminalHandlers(execAsync: (command: string, options: { maxBuffer: number; timeout: number }) => Promise<{ stdout: string; stderr: string }>) {
  function safeExecError(error: unknown) {
    const execError = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string };
    return {
      success: false,
      stdout: execError.stdout ?? '',
      stderr: execError.stderr ?? '',
      error: execError.message ?? String(error),
    };
  }

  ipcMain.handle('terminal-exec', async (_event, { command }: { command: string }) => {
    try {
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 120000,
      });
      return { success: true, stdout, stderr };
    } catch (error) {
      return safeExecError(error);
    }
  });
}
