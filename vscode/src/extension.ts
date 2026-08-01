import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';
import { AlpParser } from '@autonomous-lifecycle-protocol-alp/parser';

function escapeHtml(value: string | undefined | null): string {
  if (value == null) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let client: LanguageClient;
const panels = new Map<string, vscode.WebviewPanel>();
const parserCache = new Map<string, { result: any[]; version: number }>();

function getParsedObjects(document: vscode.TextDocument | undefined): any[] {
  if (!document) return [];
  const key = `${document.uri.toString()}:${document.version}`;
  const cached = parserCache.get(key);
  if (cached) return cached.result;
  const result = new AlpParser().parseAndValidate(document.getText());
  parserCache.set(key, { result, version: document.version });
  return result;
}

export function activate(context: vscode.ExtensionContext) {
  console.log('ALP Language Support v80.0.0 is now active.');

  const serverModule = context.asAbsolutePath(path.join('server', 'dist', 'server.js'));
  if (!fs.existsSync(serverModule)) {
    vscode.window.showErrorMessage('ALP extension: server not built. Run `npm run compile` in the vscode directory.');
    return;
  }

  // ─── Language Server ────────────────────────────────────────────────

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'alp' }],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('**/*.alp'),
    },
  };

  client = new LanguageClient(
    'alpLanguageServer',
    'ALP Language Server',
    serverOptions,
    clientOptions
  );

  client.start();

  // ─── Status Bar ─────────────────────────────────────────────────────
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBar.text = '$(graph) ALP DAG';
  statusBar.tooltip = 'Click to open ALP Interactive Visualizer';
  statusBar.command = 'alp.showVisualizer';
  statusBar.show();
  context.subscriptions.push(statusBar);

  // ─── Register alp.showVisualizer Webview Command ────────────────────
  const visualizerCmd = vscode.commands.registerCommand('alp.showVisualizer', () => {
    openTypeWebview(
      'alpVisualizer',
      'ALP Interactive DAG Visualizer',
      () => true,
      (o) => {
        const status = o.status || '[ ]';
        const cls = status === '[x]' ? 'done' : status === '[~]' ? 'progress' : status === '[!]' ? 'blocked' : 'todo';
        return `<div class="node-card ${escapeHtml(cls)}"><span class="badge">@${escapeHtml(o._type)}</span><div class="title">${escapeHtml(o.id)}</div><span class="status-tag">${escapeHtml(status)}</span></div>`;
      },
      'Open an .alp specification file to view its live dependency graph.',
      (err) => `<div class="error-box">⚠️ Syntax / Validation Error: ${escapeHtml(err.message || err)}</div>`,
    );
  });

  // ─── Register alp.checkPolicy Command ─────────────────────────────
  const policyCmd = vscode.commands.registerCommand('alp.checkPolicy', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('ALP Policy Check: No active file open to check.');
      return;
    }

    try {
      const objects = getParsedObjects(editor.document);
      const policies = objects.filter((o: any) => o._type === 'policy');

      if (policies.length === 0) {
        vscode.window.showInformationMessage('ALP Policy Check: Permitted (No policies declared in file)');
      } else {
        vscode.window.showInformationMessage(`ALP Policy Check: Found ${policies.length} policy object(s) in active spec.`);
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(`ALP Policy Check Error: ${err.message || err}`);
    }
  });

  // ─── Register alp.showTimelines Command ───────────────────────────
  const timelinesCmd = vscode.commands.registerCommand('alp.showTimelines', () => {
    openTypeWebview(
      'alpTimelines',
      'ALP Scheduled Timelines',
      'timeline',
      (t) => `
        <div class="node-card progress">
          <span class="badge">@timeline</span>
          <div class="title">${escapeHtml(t.id)}</div>
          <div><strong>Cron:</strong> <code>${escapeHtml(t.cron || t.at || 'N/A')}</code></div>
          <div>${escapeHtml(t.description || '')}</div>
        </div>
      `,
      'No @timeline objects declared in this file.',
    );
  });

  // ─── Register alp.showPolicies Command ────────────────────────────
  const policiesCmd = vscode.commands.registerCommand('alp.showPolicies', () => {
    openTypeWebview(
      'alpPolicies',
      'ALP Policies',
      'policy',
      (p) => `
        <div class="node-card blocked">
          <span class="badge">@policy</span>
          <div class="title">${escapeHtml(p.id)}</div>
          <div><strong>Enforcement:</strong> <code>${escapeHtml(p.enforcement || 'N/A')}</code></div>
          <div><strong>Applies to:</strong> <code>${escapeHtml(p.applies_to || 'N/A')}</code></div>
          <div>${escapeHtml(p.description || '')}</div>
        </div>
      `,
      'No @policy objects declared in this file.',
    );
  });

  // ─── Register alp.showContracts Command ───────────────────────────
  const contractsCmd = vscode.commands.registerCommand('alp.showContracts', () => {
    openTypeWebview(
      'alpContracts',
      'ALP Contracts',
      'contract',
      (c) => `
        <div class="node-card progress">
          <span class="badge">@contract</span>
          <div class="title">${escapeHtml(c.id)}</div>
          <div><strong>From:</strong> <code>${escapeHtml(c.from || 'N/A')}</code></div>
          <div><strong>To:</strong> <code>${escapeHtml(c.to || 'N/A')}</code></div>
          <div><strong>On violation:</strong> <code>${escapeHtml(c.on_violation || 'N/A')}</code></div>
          <div>${escapeHtml(c.description || '')}</div>
        </div>
      `,
      'No @contract objects declared in this file.',
    );
  });

  // ─── Register alp.showVaults Command ──────────────────────────────
  const vaultsCmd = vscode.commands.registerCommand('alp.showVaults', () => {
    openTypeWebview(
      'alpVaults',
      'ALP Vaults',
      'vault',
      (v) => `
        <div class="node-card done">
          <span class="badge">@vault</span>
          <div class="title">${escapeHtml(v.id)}</div>
          <div><strong>Recipients:</strong> <code>${(v.recipients || []).length} configured</code></div>
          <div><strong>Algorithm:</strong> <code>${escapeHtml(v.algorithm || 'N/A')}</code></div>
          <div>${escapeHtml(v.description || '')}</div>
        </div>
      `,
      'No @vault objects declared in this file.',
    );
  });

  // ─── Register alp.showAgents Command ──────────────────────────────
  const agentsCmd = vscode.commands.registerCommand('alp.showAgents', () => {
    openTypeWebview(
      'alpAgents',
      'ALP Agents',
      'agent',
      (a) => `
        <div class="node-card progress">
          <span class="badge">@agent</span>
          <div class="title">${escapeHtml(a.id)}</div>
          <div><strong>Capabilities:</strong> <code>${(a.capabilities || []).length} configured</code></div>
          <div><strong>Model:</strong> <code>${escapeHtml(a.model || 'N/A')}</code></div>
          <div>${escapeHtml(a.description || '')}</div>
        </div>
      `,
      'No @agent objects declared in this file.',
    );
  });

  // ─── Register alp.diffWorkspace Command ───────────────────────────
  const diffCmd = vscode.commands.registerCommand('alp.diffWorkspace', async () => {
    const wsFolder = vscode.workspace.workspaceFoldings?.[0];
    if (!wsFolder) {
      vscode.window.showWarningMessage('Open a workspace folder first.');
      return;
    }
    const snapshotsDir = path.join(wsFolder.uri.fsPath, '.alp', '.snapshots');
    if (!fs.existsSync(snapshotsDir)) {
      vscode.window.showWarningMessage('No .alp/.snapshots directory found. Run `alp backup create` first.');
      return;
    }
    const snapshots = fs.readdirSync(snapshotsDir).filter((f) => f.endsWith('.json')).sort();
    if (snapshots.length < 2) {
      vscode.window.showWarningMessage('Need at least 2 snapshots to diff.');
      return;
    }
    const names = snapshots.map((f) => f.replace(/\.json$/, ''));
    const a = await vscode.window.showQuickPick(names, { placeHolder: 'Select older snapshot' });
    if (!a) return;
    const b = await vscode.window.showQuickPick(names, { placeHolder: 'Select newer snapshot' });
    if (!b) return;

    const payloadA = JSON.parse(fs.readFileSync(path.join(snapshotsDir, `${a}.json`), 'utf-8'));
    const payloadB = JSON.parse(fs.readFileSync(path.join(snapshotsDir, `${b}.json`), 'utf-8'));

    const objsA = new Map((payloadA.objects || []).map((o: any) => [(o.id || o._type || JSON.stringify(o)), o]));
    const objsB = new Map((payloadB.objects || []).map((o: any) => [(o.id || o._type || JSON.stringify(o)), o]));

    const idsA = new Set(objsA.keys());
    const idsB = new Set(objsB.keys());
    const added = [...idsB].filter((id) => !idsA.has(id)).sort();
    const removed = [...idsA].filter((id) => !idsB.has(id)).sort();
    const modified = [...idsA].filter((id) => idsB.has(id) && JSON.stringify(objsA.get(id)) !== JSON.stringify(objsB.get(id))).sort();

    const panel = vscode.window.createWebviewPanel('alpDiff', `Diff: ${a} → ${b}`, vscode.ViewColumn.One, {});
    panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><style>
  body { font-family: var(--vscode-font-family); padding: 16px; color: var(--vscode-foreground); }
  h2 { margin-top: 0; }
  .section { margin-bottom: 12px; }
  .added { color: #4ec9b0; }
  .removed { color: #f48771; }
  .modified { color: #dcdcaa; }
  .count { font-weight: bold; }
  ul { padding-left: 20px; margin: 4px 0; }
  li { margin: 2px 0; }
</style></head>
<body>
  <h2>Diff: ${escapeHtml(a)} → ${escapeHtml(b)}</h2>
  <div class="section"><span class="count added">Added:</span> <span class="count">${added.length}</span>
    ${added.length ? `<ul>${added.map((id) => `<li class="added">+ ${escapeHtml(id)}</li>`).join('')}</ul>` : ''}
  </div>
  <div class="section"><span class="count removed">Removed:</span> <span class="count">${removed.length}</span>
    ${removed.length ? `<ul>${removed.map((id) => `<li class="removed">- ${escapeHtml(id)}</li>`).join('')}</ul>` : ''}
  </div>
  <div class="section"><span class="count modified">Modified:</span> <span class="count">${modified.length}</span>
    ${modified.length ? `<ul>${modified.map((id) => `<li class="modified">~ ${escapeHtml(id)}</li>`).join('')}</ul>` : ''}
  </div>
  ${!added.length && !removed.length && !modified.length ? '<p>No differences found.</p>' : ''}
</body></html>`;
  });

  const renameCmd = vscode.commands.registerCommand('alp.renameObject', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Open an ALP file first.');
      return;
    }
    const oldId = await vscode.window.showInputBox({ prompt: 'Current object id to rename', placeHolder: 'e.g. task-1' });
    if (!oldId) return;
    const newId = await vscode.window.showInputBox({ prompt: 'New object id', placeHolder: 'e.g. task-1-renamed' });
    if (!newId) return;

    const document = editor.document;
    const text = document.getText();
    const lines = text.split('\n');
    let replacements = 0;
    const updated = lines.map((line) => {
      const stripped = line.lstrip?.() ?? line.lstrip();
      const indent = line.slice(0, line.length - (line.match(/^\s*/)?.[0].length ?? 0));
      if (stripped.startsWith('id:')) {
        const match = stripped.match(/^id:\s*(.+)$/);
        if (match && match[1].trim() === oldId) {
          replacements += 1;
          return `${indent}id: ${newId}`;
        }
      }
      return line;
    }).join('\n');

    if (replacements === 0) {
      vscode.window.showInformationMessage(`No id '${oldId}' found in current file.`);
      return;
    }

    await editor.edit((builder) => {
      const firstLine = document.lineAt(0);
      const lastLine = document.lineAt(document.lineCount - 1);
      const range = new vscode.Range(firstLine.range.start, lastLine.range.end);
      builder.replace(range, updated);
    });

    vscode.window.showInformationMessage(`Renamed ${replacements} occurrence${replacements === 1 ? '' : 's'} of '${oldId}' to '${newId}'.`);
  });

  const copyCmd = vscode.commands.registerCommand('alp.copyObject', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Open an ALP file first.');
      return;
    }
    const sourceId = await vscode.window.showInputBox({ prompt: 'Source object id to copy', placeHolder: 'e.g. task-1' });
    if (!sourceId) return;
    const targetId = await vscode.window.showInputBox({ prompt: 'New object id', placeHolder: 'e.g. task-1-copy' });
    if (!targetId) return;
    const updateRefs = await vscode.window.showQuickPick(['No', 'Yes'], { placeHolder: 'Update reference fields (depends_on, references, etc.)?' });

    const document = editor.document;
    const text = document.getText();
    const lines = text.split('\n');
    let replacements = 0;
    const refFields = ['depends_on', 'references', 'links', 'parent', 'child'];
    const updated = lines.map((line) => {
      const stripped = line.lstrip?.() ?? line.lstrip();
      const indent = line.slice(0, line.length - (line.match(/^\s*/)?.[0].length ?? 0));
      if (stripped.startsWith('id:')) {
        const match = stripped.match(/^id:\s*(.+)$/);
        if (match && match.group(1).trim() === sourceId) {
          replacements += 1;
          return `${indent}id: ${targetId}`;
        }
      }
      if (updateRefs === 'Yes') {
        for (const field of refFields) {
          if (stripped.startsWith(`${field}:`)) {
            const refMatch = stripped.match(new RegExp(`^${field}:\\s*(.+)$`));
            if (refMatch && refMatch.group(1).trim() === sourceId) {
              replacements += 1;
              return `${indent}${field}: ${targetId}`;
            }
          }
        }
      }
      return line;
    }).join('\n');

    if (replacements === 0) {
      vscode.window.showInformationMessage(`No id '${sourceId}' found in current file.`);
      return;
    }

    await editor.edit((builder) => {
      const firstLine = document.lineAt(0);
      const lastLine = document.lineAt(document.lineCount - 1);
      const range = new vscode.Range(firstLine.range.start, lastLine.range.end);
      builder.replace(range, updated);
    });

    vscode.window.showInformationMessage(`Copied ${replacements} occurrence${replacements === 1 ? '' : 's'} of '${sourceId}' to '${targetId}'.`);
  });

  const statsCmd = vscode.commands.registerCommand('alp.showStats', () => {
    const editor = vscode.window.activeTextEditor;
    const objects = editor ? getParsedObjects(editor.document) : [];
    const typeCounts: Record<string, number> = {};
    for (const obj of objects) {
      const type = obj._type || obj.type || 'unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }
    const sorted = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
    const listItems = sorted.map(([type, count]) => `  ${type}: ${count}`).join('\n') || '  (no objects)';

    const panel = vscode.window.createWebviewPanel('alpStats', 'ALP Workspace Stats', vscode.ViewColumn.One, {});
    panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><style>
  body { font-family: var(--vscode-font-family); padding: 16px; color: var(--vscode-foreground); }
  h2 { margin-top: 0; }
  .count { font-weight: bold; }
  pre { background: var(--vscode-textBlockQuote-background); padding: 12px; border-radius: 4px; }
</style></head>
<body>
  <h2>Workspace Stats</h2>
  <p><span class="count">Files:</span> ${editor ? '1 (active)' : '0'}</p>
  <p><span class="count">Objects:</span> ${objects.length}</p>
  <h3>By type</h3>
  <pre>${escapeHtml(listItems)}</pre>
</body></html>`;
  });

  const templateCmd = vscode.commands.registerCommand('alp.createFromTemplate', async () => {
    const type = await vscode.window.showQuickPick(['task', 'agent', 'workflow', 'policy', 'test'], { placeHolder: 'Select template type' });
    if (!type) return;
    const id = await vscode.window.showInputBox({ prompt: 'Object id', placeHolder: 'e.g. my-task' });
    if (!id) return;

    const templates: Record<string, string> = {
      task: `@task\n  id: ${id}\n  description: ""\n  status: todo\n  agent: ""\n  depends_on: []`,
      agent: `@agent\n  id: ${id}\n  description: ""\n  model: ""\n  capabilities: []\n  tools: []`,
      workflow: `@workflow\n  id: ${id}\n  description: ""\n  steps: []\n  triggers: []`,
      policy: `@policy\n  id: ${id}\n  description: ""\n  rules: []\n  enforcement: warn`,
      test: `@test\n  id: ${id}\n  description: ""\n  command: ""\n  expected: ""`,
    };

    const filename = `${id}.alp`;
    const workspacePath = vscode.workspace.workspaceFoldings?.[0]?.uri.fsPath;
    if (!workspacePath) {
      vscode.window.showWarningMessage('Open a workspace folder first.');
      return;
    }
    const alpDir = path.join(workspacePath, '.alp');
    if (!fs.existsSync(alpDir)) {
      vscode.window.showWarningMessage('No .alp directory found. Run `alp init` first.');
      return;
    }
    const targetPath = path.join(alpDir, filename);
    if (fs.existsSync(targetPath)) {
      vscode.window.showWarningMessage(`${filename} already exists.`);
      return;
    }

    fs.writeFileSync(targetPath, templates[type], 'utf-8');
    vscode.window.showInformationMessage(`Created ${filename} from ${type} template.`);

    const doc = await vscode.workspace.openTextDocument(targetPath);
    await vscode.window.showTextDocument(doc);
  });

  const moveCmd = vscode.commands.registerCommand('alp.moveObject', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Open an ALP file first.');
      return;
    }
    const objectId = await vscode.window.showInputBox({ prompt: 'Object id to move', placeHolder: 'e.g. task-1' });
    if (!objectId) return;
    const targetFile = await vscode.window.showInputBox({ prompt: 'Target .alp file', placeHolder: 'e.g. tasks.alp' });
    if (!targetFile) return;

    if (!targetFile.endsWith('.alp')) {
      vscode.window.showWarningMessage('Target file must have .alp extension.');
      return;
    }

    const workspacePath = vscode.workspace.workspaceFoldings?.[0]?.uri.fsPath;
    if (!workspacePath) {
      vscode.window.showWarningMessage('Open a workspace folder first.');
      return;
    }
    const alpDir = path.join(workspacePath, '.alp');
    if (!fs.existsSync(alpDir)) {
      vscode.window.showWarningMessage('No .alp directory found. Run `alp init` first.');
      return;
    }

    const document = editor.document;
    const text = document.getText();
    const lines = text.split('\n');
    let blockStart = -1;
    let blockEnd = lines.length;
    for (let i = 0; i < lines.length; i++) {
      const idMatch = lines[i].match(/^id:\s*(.+)$/);
      if (idMatch && idMatch[1].trim() === objectId) {
        blockStart = i - 1;
        while (blockStart >= 0 && !lines[blockStart].match(/^(@\w+)/)) blockStart -= 1;
        blockStart = Math.max(0, blockStart);
        blockEnd = i + 1;
        while (blockEnd < lines.length && !lines[blockEnd].match(/^(@\w+)/)) blockEnd += 1;
        break;
      }
    }

    if (blockStart === -1) {
      vscode.window.showInformationMessage(`No object '${objectId}' found in current file.`);
      return;
    }

    const block = lines.slice(blockStart, blockEnd).join('\n');
    const targetPath = path.join(alpDir, targetFile);
    if (!fs.existsSync(targetPath)) {
      fs.writeFileSync(targetPath, '', 'utf-8');
    }

    let targetContent = fs.readFileSync(targetPath, 'utf-8');
    if (targetContent && !targetContent.endsWith('\n')) targetContent += '\n';
    targetContent += block + '\n';
    fs.writeFileSync(targetPath, targetContent, 'utf-8');

    const updatedSource = lines.slice(0, blockStart).concat(lines.slice(blockEnd)).filter((l) => l.trim()).join('\n');
    await editor.edit((builder) => {
      const firstLine = document.lineAt(0);
      const lastLine = document.lineAt(document.lineCount - 1);
      const range = new vscode.Range(firstLine.range.start, lastLine.range.end);
      builder.replace(range, updatedSource);
    });

    vscode.window.showInformationMessage(`Moved '${objectId}' to ${targetFile}.`);
  });

  context.subscriptions.push(visualizerCmd, policyCmd, timelinesCmd, policiesCmd, contractsCmd, vaultsCmd, agentsCmd, diffCmd, renameCmd, copyCmd, statsCmd, templateCmd, moveCmd);
}

export function deactivate(): Thenable<void> | undefined {
  for (const panel of panels.values()) {
    panel.dispose();
  }
  panels.clear();
  if (!client) {
    return undefined;
  }
  return client.stop();
}

function openTypeWebview(
  viewId: string,
  title: string,
  typeFilter: string | ((o: any) => boolean),
  renderCard: (obj: any) => string,
  emptyMessage: string,
  errorRenderer?: (err: any) => string,
) {
  const editor = vscode.window.activeTextEditor;
  const objects = getParsedObjects(editor?.document);

  const existing = panels.get(viewId);
  const panel = existing || vscode.window.createWebviewPanel(
    viewId,
    title,
    vscode.ViewColumn.Beside,
    { enableScripts: true, retainContextWhenHidden: true },
  );
  panels.set(viewId, panel);

  const predicate = typeof typeFilter === 'function' ? typeFilter : (o: any) => o._type === typeFilter;

  let html = '';
  try {
    const items = objects.filter(predicate);
    if (items.length === 0) {
      html = `<div class="placeholder">${escapeHtml(emptyMessage)}</div>`;
    } else {
      html = `<div class="nodes-grid">${items.map(renderCard).join('')}</div>`;
    }
  } catch (err: any) {
    html = errorRenderer
      ? errorRenderer(err)
      : `<div class="error-box">⚠️ Parsing Error: ${escapeHtml(err.message || err)}</div>`;
  }

  panel.webview.html = getWebviewContent(html);
}

function getWebviewContent(graphHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ALP Visualizer</title>
<style>
  body {
    background: #090a10;
    color: #f0f4fd;
    font-family: system-ui, -apple-system, sans-serif;
    padding: 20px;
    margin: 0;
  }
  h2 { font-size: 1.1rem; color: #00f0ff; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .nodes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
  .node-card {
    background: #131625;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  }
  .node-card.done { border-color: rgba(16, 185, 129, 0.4); box-shadow: 0 0 12px rgba(16, 185, 129, 0.2); }
  .node-card.progress { border-color: rgba(0, 240, 255, 0.4); box-shadow: 0 0 12px rgba(0, 240, 255, 0.2); }
  .node-card.blocked { border-color: rgba(244, 63, 94, 0.4); box-shadow: 0 0 12px rgba(244, 63, 94, 0.2); }
  .badge { font-size: 0.7rem; font-family: monospace; color: #9d4edd; font-weight: bold; }
  .title { font-size: 0.95rem; font-weight: 700; word-break: break-all; }
  .status-tag { font-size: 0.75rem; font-family: monospace; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.05); align-self: flex-start; }
  .placeholder { padding: 40px; text-align: center; color: #7e89a3; border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px; }
  .error-box { padding: 16px; background: rgba(244,63,94,0.15); border: 1px solid rgba(244,63,94,0.4); color: #fecdd3; border-radius: 8px; font-family: monospace; font-size: 0.85rem; }
</style>
</head>
<body>
  <h2>⚡ ALP Interactive DAG Visualizer Panel</h2>
  ${graphHtml}
</body>
</html>`;
}


