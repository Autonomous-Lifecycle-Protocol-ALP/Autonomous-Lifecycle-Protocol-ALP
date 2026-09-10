import { ipcMain } from 'electron';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

export function setupParserHandlers(loadParser: () => Promise<any>) {
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
      const symbols: Array<{ name: string; kind: 'agent' | 'skill' | 'macro' | 'event' | 'memory' | 'contract' | 'vault' | 'swarm' | 'workflow'; line: number }> = [];
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

  ipcMain.handle('refactor-preview', async (_event, { filePath, oldName, newName, kind }: { filePath: string; oldName: string; newName: string; kind: 'agent' | 'skill' | 'macro' | 'event' | 'memory' | 'contract' | 'vault' | 'swarm' | 'workflow' }) => {
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

  ipcMain.handle('refactor-rename', async (_event, { filePath, oldName, newName, kind }: { filePath: string; oldName: string; newName: string; kind: 'agent' | 'skill' | 'macro' | 'event' | 'memory' | 'contract' | 'vault' | 'swarm' | 'workflow' }) => {
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

  ipcMain.handle('workspace-list-templates', async () => {
    try {
      return {
        success: true,
        templates: [
          { id: 'basic', name: 'Basic ALP Project', description: 'A minimal ALP workspace with a single agent and task.' },
          { id: 'multi-agent', name: 'Multi-Agent Swarm', description: 'A multi-agent workspace with swarm coordination.' },
          { id: 'enterprise', name: 'Enterprise Workflow', description: 'An enterprise-grade ALP workspace with policies, contracts, and approval gates.' },
        ],
      };
    } catch (error) {
      return { success: false, templates: [], error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('workspace-scaffold-template', async (_event, { templateId, targetDir }: { templateId: string; targetDir: string }) => {
    try {
      const { writeFile, mkdir } = await import('fs/promises');
      const alpDir = join(targetDir, '.alp');
      await mkdir(alpDir, { recursive: true });

      const templates: Record<string, string> = {
        basic: '@agent my-agent\n  description: Default agent\n  model: gpt-4o\n  tools: []\n\n@task setup\n  id: setup\n  status: [ ]\n  assigned_to: -> my-agent\n',
        'multi-agent': '@agent planner\n  description: Planning agent\n  model: gpt-4o\n  tools: []\n\n@agent executor\n  description: Execution agent\n  model: gpt-4o\n  tools: []\n\n@task plan\n  id: plan\n  status: [ ]\n  assigned_to: -> planner\n\n@task execute\n  id: execute\n  status: [ ]\n  assigned_to: -> executor\n  depends_on: plan\n',
        enterprise: '@agent lead\n  description: Lead agent\n  model: gpt-4o\n  tools: []\n\n@policy security\n  id: security\n  applies_to: *\n  enforcement: strict\n  deny_paths: ["**/.env", "**/secrets/**"]\n\n@task init\n  id: init\n  status: [ ]\n  assigned_to: -> lead\n',
      };

      const content = templates[templateId] ?? templates.basic;
      await writeFile(join(alpDir, 'main.alp'), content, 'utf-8');

      return { success: true, scaffolded: true, templateId, targetDir };
    } catch (error) {
      return { success: false, scaffolded: false, error: error instanceof Error ? error.message : String(error) };
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
}
