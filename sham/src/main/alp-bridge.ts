import { ipcMain } from 'electron';

async function loadParser() {
  const parser = await import('@alp/parser');
  return parser;
}

export function setupALPBridge() {
  ipcMain.handle('alp-parse', async (_event, { content, filePath }: { content: string; filePath: string }) => {
    try {
      const { AlpParser } = await loadParser();
      const parser = new AlpParser();
      const result = parser.parse(content);
      return { success: true, data: { objects: result, warnings: parser.warnings, filePath } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('alp-validate', async (_event, { content, filePath }: { content: string; filePath: string }) => {
    try {
      const { AlpParser } = await loadParser();
      const parser = new AlpParser();
      const objects = parser.parseAndValidate(content);
      const diagnostics: Array<{ line: number; column: number; message: string; severity: 'error' | 'warning' }> = [];
      for (const obj of objects) {
        if (!obj.metadata?.name) {
          diagnostics.push({ line: obj.location?.line ?? 1, column: obj.location?.column ?? 1, message: 'Missing required metadata.name', severity: 'error' });
        }
      }
      if (objects.length === 0) {
        diagnostics.push({ line: 1, column: 1, message: 'No blocks defined in ALP document', severity: 'warning' });
      }
      return { success: true, diagnostics };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('alp-get-block-types', async () => {
    return { success: true, blockTypes: ['agent', 'skill', 'macro', 'event', 'memory', 'contract', 'vault', 'swarm', 'workflow'] };
  });

  ipcMain.handle('alp-run-agent', async (_event, { agentId, config }: { agentId: string; config: Record<string, unknown> }) => {
    try {
      return { success: true, data: { agentId, status: 'running', config } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
}
