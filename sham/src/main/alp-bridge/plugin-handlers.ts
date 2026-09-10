import { ipcMain } from 'electron';
import { existsSync } from 'fs';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import type { Plugin, PluginManifest } from './types.js';

const PLUGINS_DIR = join(process.resourcesPath || process.cwd(), 'plugins');

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

export function setupPluginHandlers() {
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
