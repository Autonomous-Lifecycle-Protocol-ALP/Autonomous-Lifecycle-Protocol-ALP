import { ipcMain } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';

interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  tags?: string[];
  toolPanel?: boolean;
  lspAdapter?: string;
}

interface Plugin {
  manifest: PluginManifest;
  enabled: boolean;
  loadedAt?: string;
  error?: string;
}

const execAsync = promisify(exec);
const PLUGINS_DIR = join(process.resourcesPath || process.cwd(), 'plugins');

async function loadParser() {
  const parser = await import('@alp/parser');
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

async function loadPluginManifest(pluginDir: string): Promise<PluginManifest | null> {
  const manifestPath = join(pluginDir, 'plugin.json');
  if (!existsSync(manifestPath)) return null;
  try {
    const content = await readFile(manifestPath, 'utf-8');
    return JSON.parse(content) as PluginManifest;
  } catch {
    return null;
  }
}

async function discoverPlugins(): Promise<Plugin[]> {
  if (!existsSync(PLUGINS_DIR)) {
    return [];
  }
  try {
    const entries = await readdir(PLUGINS_DIR, { withFileTypes: true });
    const plugins: Plugin[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const pluginDir = join(PLUGINS_DIR, entry.name);
      const manifest = await loadPluginManifest(pluginDir);
      if (manifest) {
        plugins.push({
          manifest,
          enabled: true,
          loadedAt: new Date().toISOString(),
        });
      }
    }
    return plugins;
  } catch {
    return [];
  }
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

  ipcMain.handle('collab-start', async (_event, { mode }: { mode: 'host' | 'peer' }) => {
    try {
      const { stdout, stderr } = await execAsync(`alp collab start --mode ${mode}`, {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 120000,
      });
      return { success: true, stdout, stderr };
    } catch (error) {
      return safeExecError(error);
    }
  });

  ipcMain.handle('collab-join', async (_event, { sessionId }: { sessionId: string }) => {
    try {
      const { stdout, stderr } = await execAsync(`alp collab join ${sessionId}`, {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 120000,
      });
      return { success: true, stdout, stderr };
    } catch (error) {
      return safeExecError(error);
    }
  });

  ipcMain.handle('collab-status', async () => {
    try {
      const { stdout, stderr } = await execAsync('alp collab status', {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 120000,
      });
      return { success: true, stdout, stderr };
    } catch (error) {
      return safeExecError(error);
    }
  });

  ipcMain.handle('collab-leave', async () => {
    try {
      const { stdout, stderr } = await execAsync('alp collab leave', {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 120000,
      });
      return { success: true, stdout, stderr };
    } catch (error) {
      return safeExecError(error);
    }
  });

  ipcMain.handle('crdt-status', async () => {
    try {
      const { stdout, stderr } = await execAsync('alp crdt-sync status', {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 120000,
      });
      return { success: true, stdout, stderr };
    } catch (error) {
      return safeExecError(error);
    }
  });

  ipcMain.handle('crdt-merge', async () => {
    try {
      const { stdout, stderr } = await execAsync('alp crdt-sync merge', {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 120000,
      });
      return { success: true, stdout, stderr };
    } catch (error) {
      return safeExecError(error);
    }
  });

  ipcMain.handle('plugin-list', async () => {
    try {
      const plugins = await discoverPlugins();
      return { success: true, plugins };
    } catch (error) {
      return { success: false, plugins: [], error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('plugin-toggle', async (_event, { pluginId, enabled }: { pluginId: string; enabled: boolean }) => {
    try {
      const plugins = await discoverPlugins();
      const plugin = plugins.find((p) => p.manifest.id === pluginId);
      if (!plugin) {
        return { success: false, error: `Plugin ${pluginId} not found` };
      }
      plugin.enabled = enabled;
      plugin.loadedAt = new Date().toISOString();
      return { success: true, plugins, message: `${plugin.manifest.name} ${enabled ? 'enabled' : 'disabled'}` };
    } catch (error) {
      return { success: false, plugins: [], error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('plugin-reload', async (_event, { pluginId }: { pluginId: string }) => {
    try {
      const plugins = await discoverPlugins();
      const plugin = plugins.find((p) => p.manifest.id === pluginId);
      if (!plugin) {
        return { success: false, error: `Plugin ${pluginId} not found` };
      }
      plugin.loadedAt = new Date().toISOString();
      plugin.error = undefined;
      return { success: true, plugins, message: `${plugin.manifest.name} reloaded` };
    } catch (error) {
      return { success: false, plugins: [], error: error instanceof Error ? error.message : String(error) };
    }
  });
}
