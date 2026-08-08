import { ipcMain, app, dialog } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';
import { CollaborationEngine, CRDTSyncEngine } from '@autonomous-lifecycle-protocol-alp/parser';

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

interface ProfileTrace {
  id: string;
  agentId?: string;
  command?: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  status: 'running' | 'completed' | 'failed';
  stdout?: string;
  stderr?: string;
  error?: string;
}

interface RefactorRename {
  id: string;
  oldName: string;
  newName: string;
  kind: 'agent' | 'skill' | 'macro' | 'event' | 'memory' | 'contract' | 'vault' | 'swarm' | 'workflow';
  occurrences: number;
  files: string[];
}

const execAsync = promisify(exec);
const PLUGINS_DIR = join(process.resourcesPath || process.cwd(), 'plugins');
const profileTraces: ProfileTrace[] = [];
const collabEngine = new CollaborationEngine();
const crdtEngine = new CRDTSyncEngine();

function getStateDir(): string {
  return join(app.getPath('userData'), 'alp-state');
}

function getStateFile(): string {
  return join(getStateDir(), 'engines.json');
}

async function loadParser() {
  const parser = await import('@autonomous-lifecycle-protocol-alp/parser');
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

export function saveEngineState(): void {
  try {
    const stateFile = getStateFile();
    if (!existsSync(getStateDir())) {
      mkdirSync(getStateDir(), { recursive: true });
    }
    const payload = {
      collaboration: collabEngine.toJSON(),
      crdt: crdtEngine.toJSON(),
      savedAt: new Date().toISOString(),
    };
    writeFileSync(stateFile, JSON.stringify(payload, null, 2), 'utf-8');
  } catch {
    // persistence is best-effort
  }
}

export function loadEngineState(): void {
  try {
    const stateFile = getStateFile();
    if (!existsSync(stateFile)) return;
    const raw = readFileSync(stateFile, 'utf-8');
    const payload = JSON.parse(raw);
    if (payload.collaboration) {
      collabEngine.fromJSON(payload.collaboration);
    }
    if (payload.crdt) {
      crdtEngine.fromJSON(payload.crdt);
    }
  } catch {
    // persistence is best-effort
  }
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
      const docId = mode === 'host' ? `live-share-${Date.now()}` : `session-${Date.now()}`;
      const session = collabEngine.createSession(docId);
      let liveShare = null;
      if (mode === 'host') {
        liveShare = collabEngine.startLiveShare(docId, 'local-user');
      }
      return { success: true, data: { docId, sessionId: liveShare?.sessionId ?? docId, mode, createdAt: session.createdAt, agents: session.agents.size, operations: session.operations.length } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('collab-join', async (_event, { sessionId }: { sessionId: string }) => {
    try {
      const liveShares = collabEngine.getLiveShares(sessionId);
      const target = liveShares.length > 0 ? liveShares[0] : null;
      if (!target) {
        const session = collabEngine.getSession(sessionId);
        if (!session) {
          return { success: false, error: `Session '${sessionId}' not found` };
        }
        const presence = collabEngine.joinSession(sessionId, 'local-user');
        return { success: true, data: { sessionId, joined: true, presence } };
      }
      const ok = collabEngine.joinLiveShare(target.sessionId, 'local-user');
      return { success: ok, data: { sessionId: target.sessionId, docId: target.docId, joined: ok, guests: target.guests } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('collab-status', async () => {
    try {
      const sessions = collabEngine.getLiveShares('');
      const allSessions: Array<{ docId: string; sessionId: string; hostId: string; guests: string[]; status: string }> = [];
      for (const [docId, session] of (collabEngine as any).sessions || new Map()) {
        const shares = collabEngine.getLiveShares(docId);
        for (const share of shares) {
          allSessions.push({ docId, sessionId: share.sessionId, hostId: share.hostId, guests: share.guests, status: share.status });
        }
      }
      return { success: true, data: { sessions: allSessions } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('collab-leave', async () => {
    try {
      const activeShares = collabEngine.getLiveShares('');
      let left = false;
      for (const share of activeShares) {
        if (share.guests.includes('local-user') || share.hostId === 'local-user') {
          collabEngine.endLiveShare(share.sessionId, 'local-user');
          left = true;
        }
      }
      return { success: true, left };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('crdt-status', async () => {
    try {
      const states: Record<string, any> = {};
      const engineState = (crdtEngine as any).states as Map<string, any> | undefined;
      if (engineState) {
        for (const [docId] of engineState) {
          states[docId] = crdtEngine.readState(docId);
        }
      }
      return { success: true, data: { states } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('crdt-merge', async () => {
    try {
      const engineState = (crdtEngine as any).states as Map<string, any> | undefined;
      if (!engineState || engineState.size < 2) {
        return { success: true, data: { merged: false, reason: 'insufficient peers for merge' } };
      }
      const entries = Array.from(engineState.entries());
      const [docIdA, local] = entries[0];
      const [docIdB, remote] = entries[1];
      const merged = crdtEngine.merge(local, remote);
      const converged = crdtEngine.readState(docIdA);
      return { success: true, data: { docId: merged.docId, clock: merged.clock, converged } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
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

  ipcMain.handle('profiler-start', async (_event, payload: { agentId?: string; command?: string }) => {
    const trace: ProfileTrace = {
      id: `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      agentId: payload.agentId,
      command: payload.command,
      startedAt: new Date().toISOString(),
      status: 'running',
    };
    profileTraces.unshift(trace);
    return { success: true, trace };
  });

  ipcMain.handle('profiler-stop', async (_event, { traceId, status, stdout, stderr, error }: { traceId: string; status: 'completed' | 'failed'; stdout?: string; stderr?: string; error?: string }) => {
    const trace = profileTraces.find((t) => t.id === traceId);
    if (!trace) {
      return { success: false, error: `Trace ${traceId} not found` };
    }
    trace.status = status;
    trace.finishedAt = new Date().toISOString();
    trace.durationMs = new Date(trace.finishedAt).getTime() - new Date(trace.startedAt).getTime();
    if (stdout !== undefined) trace.stdout = stdout;
    if (stderr !== undefined) trace.stderr = stderr;
    if (error !== undefined) trace.error = error;
    return { success: true, trace };
  });

  ipcMain.handle('profiler-list', async () => {
    return { success: true, traces: [...profileTraces] };
  });

  ipcMain.handle('profiler-clear', async () => {
    profileTraces.length = 0;
    return { success: true };
  });

  ipcMain.handle('copilot-suggest', async (_event, { content, filePath }: { content: string; filePath: string }) => {
    try {
      const suggestions: Array<{
        id: string;
        type: 'fix' | 'completion' | 'tip';
        severity?: 'error' | 'warning' | 'info';
        message: string;
        range?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };
        insertText?: string;
        diagnostic?: { line: number; column: number; message: string; severity: 'error' | 'warning' };
      }> = [];

      const lines = content.split('\n');
      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        if (line.trim().startsWith('@agent') && !line.includes('model:')) {
          suggestions.push({
            id: `copilot-missing-model-${lineNumber}`,
            type: 'fix',
            severity: 'warning',
            message: 'Add a model to @agent block',
            range: { startLineNumber: lineNumber, startColumn: 1, endLineNumber: lineNumber, endColumn: line.length + 1 },
            insertText: `${line}\n  model: gpt-4o`,
            diagnostic: { line: lineNumber, column: 1, message: 'Missing model in @agent block', severity: 'warning' },
          });
        }
        if (line.includes('${')) {
          suggestions.push({
            id: `copilot-unfilled-template-${lineNumber}`,
            type: 'tip',
            severity: 'info',
            message: 'Unfilled template variable detected. Replace ${...} placeholders with actual values.',
            range: { startLineNumber: lineNumber, startColumn: line.indexOf('$'), endLineNumber: lineNumber, endColumn: line.indexOf('$') + 2 },
          });
        }
        if (line.trim().startsWith('@') && !line.includes(':')) {
          suggestions.push({
            id: `copilot-block-missing-fields-${lineNumber}`,
            type: 'fix',
            severity: 'warning',
            message: 'ALP block appears to be missing fields. Add key-value pairs under the block.',
            range: { startLineNumber: lineNumber, startColumn: 1, endLineNumber: lineNumber, endColumn: line.length + 1 },
            insertText: `${line}\n  description: TODO`,
          });
        }
      });

      if (!content.includes('@')) {
        suggestions.push({
          id: 'copilot-empty-doc',
          type: 'completion',
          severity: 'info',
          message: 'Start with an ALP block, e.g. @agent, @skill, @workflow',
          insertText: '@agent my-agent\n  description: TODO\n  model: gpt-4o\n  tools: []\n',
        });
      }

      return { success: true, suggestions };
    } catch (error) {
      return { success: false, suggestions: [], error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('copilot-apply-fix', async (_event, { filePath, suggestionId, insertText, range }: { filePath: string; suggestionId: string; insertText?: string; range?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number } }) => {
    try {
      return { success: true, applied: true, message: `Fix ${suggestionId} queued for ${filePath}` };
    } catch (error) {
      return { success: false, applied: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('refactor-find-symbols', async (_event, { filePath }: { filePath: string }) => {
    try {
      const content = await readFile(filePath, 'utf-8').catch(() => '');
      const symbols: Array<{ name: string; kind: RefactorRename['kind']; line: number }> = [];
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        for (const kind of ['agent', 'skill', 'macro', 'event', 'memory', 'contract', 'vault', 'swarm', 'workflow'] as const) {
          const prefix = `@${kind}`;
          if (trimmed.startsWith(prefix)) {
            const match = trimmed.match(new RegExp(`^${prefix}\\s+(\\S+)`));
            if (match) {
              symbols.push({ name: match[1], kind, line: index + 1 });
            }
            break;
          }
        }
      });
      const renames = symbols.map((s) => ({
        id: `rename-${s.kind}-${s.name}-${s.line}`,
        oldName: s.name,
        newName: s.name,
        kind: s.kind,
        occurrences: 1,
        files: [filePath],
      }));
      return { success: true, renames };
    } catch (error) {
      return { success: false, renames: [], error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('refactor-preview', async (_event, { filePath, oldName, newName, kind }: { filePath: string; oldName: string; newName: string; kind: RefactorRename['kind'] }) => {
    try {
      const content = await readFile(filePath, 'utf-8').catch(() => '');
      const occurrences = (content.match(new RegExp(`\\b${oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')) ?? []).length;
      const renames = [
        {
          id: `rename-${kind}-${oldName}-${Date.now()}`,
          oldName,
          newName,
          kind,
          occurrences,
          files: occurrences > 0 ? [filePath] : [],
        },
      ];
      return { success: true, renames };
    } catch (error) {
      return { success: false, renames: [], error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('refactor-rename', async (_event, { filePath, oldName, newName, kind }: { filePath: string; oldName: string; newName: string; kind: RefactorRename['kind'] }) => {
    try {
      let content = await readFile(filePath, 'utf-8').catch(() => '');
      const regex = new RegExp(`\\b${oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      const matches = content.match(regex) ?? [];
      content = content.replace(regex, newName);
      const { writeFile } = await import('fs/promises');
      await writeFile(filePath, content, 'utf-8');
      const renames = [
        {
          id: `rename-${kind}-${oldName}-${Date.now()}`,
          oldName,
          newName,
          kind,
          occurrences: matches.length,
          files: matches.length > 0 ? [filePath] : [],
        },
      ];
      return { success: true, renames };
    } catch (error) {
      return { success: false, renames: [], error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('collab-cursor-move', async (_event, payload: { peerId: string; line: number; column: number; selection?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number } }) => {
    return { success: true, received: true };
  });

  ipcMain.handle('collab-broadcast-presence', async (_event, payload: { peerId: string; displayName: string; color: string; cursor?: { line: number; column: number }; selection?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number } }) => {
    return { success: true, received: true };
  });

  ipcMain.handle('workspace-list-templates', async () => {
    return {
      success: true,
      templates: [
        {
          id: 'swarm-agent-template',
          name: 'Swarm Agent Mesh Template',
          description: 'Multi-node swarm agent cluster with event mesh capabilities.',
          files: {
            'agent.alp': '@agent swarm-coordinator\n  description: Autonomous swarm node coordinator\n  model: gpt-4o\n  tools: [pubsub, claims]\n',
            'policy.alp': '@policy swarm-security\n  description: Fail-closed verification rule for swarm claims\n  enforce: strict\n',
          },
        },
        {
          id: 'policy-governance-template',
          name: 'Policy & Governance Template',
          description: 'Enterprise compliance rules and contract verification workspace.',
          files: {
            'governance.alp': '@contract compliance-v1\n  description: Mandatory audit trail contract\n  policy: strict-audit\n',
            'rules.alp': '@rule no-raw-sql\n  description: Ban unparameterized SQL queries\n  action: deny\n',
          },
        },
        {
          id: 'mcp-microservice-template',
          name: 'MCP Microservice Agent',
          description: 'Model Context Protocol server integration project.',
          files: {
            'mcp-agent.alp': '@agent mcp-bridge\n  description: Model Context Protocol tools orchestrator\n  mcpServer: stdio\n',
          },
        },
      ],
    };
  });

  ipcMain.handle('workspace-scaffold-template', async (_event, { templateId, targetDir }: { templateId: string; targetDir: string }) => {
    try {
      const templatesResponse = await (ipcMain as unknown as { handleMap?: Map<string, Function> }).handleMap?.get('workspace-list-templates')?.();
      const templates = [
        {
          id: 'swarm-agent-template',
          files: {
            'agent.alp': '@agent swarm-coordinator\n  description: Autonomous swarm node coordinator\n  model: gpt-4o\n  tools: [pubsub, claims]\n',
            'policy.alp': '@policy swarm-security\n  description: Fail-closed verification rule for swarm claims\n  enforce: strict\n',
          },
        },
        {
          id: 'policy-governance-template',
          files: {
            'governance.alp': '@contract compliance-v1\n  description: Mandatory audit trail contract\n  policy: strict-audit\n',
            'rules.alp': '@rule no-raw-sql\n  description: Ban unparameterized SQL queries\n  action: deny\n',
          },
        },
        {
          id: 'mcp-microservice-template',
          files: {
            'mcp-agent.alp': '@agent mcp-bridge\n  description: Model Context Protocol tools orchestrator\n  mcpServer: stdio\n',
          },
        },
      ];
      const match = templates.find((t) => t.id === templateId);
      if (!match) {
        return { success: false, error: `Template '${templateId}' not found` };
      }

      const { writeFile, mkdir } = await import('fs/promises');
      await mkdir(targetDir, { recursive: true });

      const createdFiles: string[] = [];
      for (const [filename, content] of Object.entries(match.files)) {
        const filePath = join(targetDir, filename);
        await writeFile(filePath, content, 'utf-8');
        createdFiles.push(filePath);
      }

      return { success: true, createdFiles };
    } catch (error) {
      return { success: false, createdFiles: [], error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('workspace-lint-all', async (_event, { workspaceDir }: { workspaceDir: string }) => {
    try {
      const parser = await loadParser();
      const files = await readdir(workspaceDir).catch(() => []);
      const alpFiles = files.filter((f) => f.endsWith('.alp'));
      const diagnostics: Array<{ filePath: string; errors: string[] }> = [];

      for (const file of alpFiles) {
        const fullPath = join(workspaceDir, file);
        const content = await readFile(fullPath, 'utf-8').catch(() => '');
        try {
          const doc = parser.parseALP(content);
          diagnostics.push({ filePath: fullPath, errors: doc.errors ?? [] });
        } catch (err) {
          diagnostics.push({ filePath: fullPath, errors: [err instanceof Error ? err.message : String(err)] });
        }
      }

      return { success: true, scannedCount: alpFiles.length, diagnostics };
    } catch (error) {
      return { success: false, scannedCount: 0, diagnostics: [], error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('dialog-open-folder', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
      });
      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true };
      }
      return { success: true, folderPath: result.filePaths[0] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
}

