import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';
import { AlpParser } from '@alp/parser';

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
  console.log('ALP Language Support v39.0.0 is now active.');

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

  context.subscriptions.push(visualizerCmd, policyCmd, timelinesCmd, policiesCmd, contractsCmd, vaultsCmd);
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
