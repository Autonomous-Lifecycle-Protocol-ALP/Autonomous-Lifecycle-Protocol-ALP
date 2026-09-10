import * as vscode from 'vscode';
import { escapeHtml, getParsedObjects, panels } from './disposable';
import { SynapseEngine } from '@autonomous-lifecycle-protocol-alp/sdk';

export function registerWebviewCommands(context: vscode.ExtensionContext) {
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

  const multimodalCmd = vscode.commands.registerCommand('alp.showMultimodal', () => {
    openTypeWebview(
      'alpMultimodal',
      'ALP Multi-Modal Specs',
      'multimodal',
      (m) => `
        <div class="node-card progress">
          <span class="badge">@multimodal</span>
          <div class="title">${escapeHtml(m.id)}</div>
          <div><strong>Modalities:</strong> <code>${(m.modalities || []).join(', ') || 'N/A'}</code></div>
          <div><strong>Resolution:</strong> <code>${escapeHtml(m.resolution || 'N/A')}</code></div>
          <div><strong>FPS:</strong> <code>${m.fps || 'N/A'}</code></div>
        </div>
      `,
      'No @multimodal objects declared in this file.',
    );
  });

  const actionSpacesCmd = vscode.commands.registerCommand('alp.showActionSpaces', () => {
    openTypeWebview(
      'alpActionSpaces',
      'ALP Action Spaces',
      'action_space',
      (as) => `
        <div class="node-card progress">
          <span class="badge">@action_space</span>
          <div class="title">${escapeHtml(as.id)}</div>
          <div><strong>Domain:</strong> <code>${escapeHtml(as.domain || 'N/A')}</code></div>
          <div><strong>Agent:</strong> <code>${escapeHtml(as.agent || 'N/A')}</code></div>
          <div><strong>Actions:</strong> <code>${(as.actions || []).length} defined</code></div>
        </div>
      `,
      'No @action_space objects declared in this file.',
    );
  });

  const visionModelsCmd = vscode.commands.registerCommand('alp.showVisionModels', () => {
    openTypeWebview(
      'alpVisionModels',
      'ALP Vision Models',
      'vision_model',
      (vm) => `
        <div class="node-card done">
          <span class="badge">@vision_model</span>
          <div class="title">${escapeHtml(vm.id)}</div>
          <div><strong>Backbone:</strong> <code>${escapeHtml(vm.backbone || 'N/A')}</code></div>
          <div><strong>Context Tokens:</strong> <code>${vm.context_tokens || 'N/A'}</code></div>
          <div><strong>Embedding Dim:</strong> <code>${vm.embedding_dim || 'N/A'}</code></div>
        </div>
      `,
      'No @vision_model objects declared in this file.',
    );
  });

  const synapseCmd = vscode.commands.registerCommand('alp.showSynapse', () => {
    const editor = vscode.window.activeTextEditor;
    const objects = editor ? getParsedObjects(editor.document) : [];
    const engine = new SynapseEngine();
    const topology = engine.buildTopology(objects);

    const panel = vscode.window.createWebviewPanel('alpSynapse', 'ALP Synapse Knowledge Graph', vscode.ViewColumn.Beside, {});
    const nodesHtml = topology.nodes.map((n: any) => `
      <div class="node-card ${n.status === '[x]' ? 'done' : n.status === '[!]' ? 'blocked' : 'progress'}">
        <span class="badge">@${escapeHtml(n.type)}</span>
        <div class="title">[[${escapeHtml(n.id)}]]</div>
        <div><strong>Degree:</strong> <code>${n.degree}</code></div>
        <div><strong>Out:</strong> <code>${n.outLinks.length}</code></div>
        <div><strong>In:</strong> <code>${n.inLinks.length}</code></div>
      </div>
    `).join('');
    const statsHtml = `
      <div style="margin-bottom: 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
        <div style="background: #131625; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 1.2rem; font-weight: bold; color: #38bdf8;">${topology.stats.totalNodes}</div>
          <div style="font-size: 0.75rem; color: #94a3b8;">Nodes</div>
        </div>
        <div style="background: #131625; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 1.2rem; font-weight: bold; color: #4ade80;">${topology.stats.totalEdges}</div>
          <div style="font-size: 0.75rem; color: #94a3b8;">Edges</div>
        </div>
        <div style="background: #131625; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 1.2rem; font-weight: bold; color: #facc15;">${topology.stats.density.toFixed(3)}</div>
          <div style="font-size: 0.75rem; color: #94a3b8;">Density</div>
        </div>
      </div>
    `;
    panel.webview.html = getWebviewContent(statsHtml + `<h3>Topology Nodes</h3><div class="nodes-grid">${nodesHtml || '<div class="placeholder">No objects parsed. Open an .alp file first.</div>'}</div>`);
  });

  const diffCmd = vscode.commands.registerCommand('alp.diffWorkspace', async () => {
    const wsFolder = vscode.workspace.workspaceFolders?.[0];
    if (!wsFolder) {
      vscode.window.showWarningMessage('Open a workspace folder first.');
      return;
    }
    const snapshotsDir = require('path').join(wsFolder.uri.fsPath, '.alp', '.snapshots');
    if (!require('fs').existsSync(snapshotsDir)) {
      vscode.window.showWarningMessage('No .alp/.snapshots directory found. Run `alp backup create` first.');
      return;
    }
    const snapshots = require('fs').readdirSync(snapshotsDir).filter((f: string) => f.endsWith('.json')).sort();
    if (snapshots.length < 2) {
      vscode.window.showWarningMessage('Need at least 2 snapshots to diff.');
      return;
    }
    const names = snapshots.map((f: string) => f.replace(/\.json$/, ''));
    const a = await vscode.window.showQuickPick(names, { placeHolder: 'Select older snapshot' });
    if (!a) return;
    const b = await vscode.window.showQuickPick(names, { placeHolder: 'Select newer snapshot' });
    if (!b) return;

    const payloadA = JSON.parse(require('fs').readFileSync(require('path').join(snapshotsDir, `${a}.json`), 'utf-8'));
    const payloadB = JSON.parse(require('fs').readFileSync(require('path').join(snapshotsDir, `${b}.json`), 'utf-8'));

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

  const searchCmd = vscode.commands.registerCommand('alp.searchWorkspace', async () => {
    const query = await vscode.window.showInputBox({ prompt: 'Search query', placeHolder: 'e.g. task-1 or auth' });
    if (!query) return;
    const typeFilter = await vscode.window.showQuickPick(['', 'task', 'agent', 'workflow', 'policy', 'contract', 'vault'], { placeHolder: 'Filter by type (optional)' });
    const useRegex = await vscode.window.showQuickPick(['No', 'Yes'], { placeHolder: 'Use regex?' });

    const editor = vscode.window.activeTextEditor;
    const objects = editor ? getParsedObjects(editor.document) : [];
    const q = query.toLowerCase();
    const type = typeFilter || undefined;
    let results = objects.filter((o: any) => {
      if (type && o._type !== type) return false;
      if (useRegex === 'Yes') {
        try {
          const regex = new RegExp(query, 'i');
          return regex.test(o.id || '') || regex.test(o.description || '') || regex.test(JSON.stringify(o));
        } catch {
          return false;
        }
      }
      return (o.id && o.id.toLowerCase().includes(q)) || (o.description && o.description.toLowerCase().includes(q));
    });

    const panel = vscode.window.createWebviewPanel('alpSearch', `Search: ${query}`, vscode.ViewColumn.One, {});
    panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><style>
  body { font-family: var(--vscode-font-family); padding: 16px; color: var(--vscode-foreground); }
  h2 { margin-top: 0; }
  .count { font-weight: bold; }
  ul { padding-left: 20px; margin: 4px 0; }
  li { margin: 2px 0; }
</style></head>
<body>
  <h2>Search: ${escapeHtml(query)}</h2>
  <p><span class="count">${results.length}</span> result${results.length === 1 ? '' : 's'}</p>
  <ul>${results.map((o: any) => `<li><strong>${escapeHtml(o._type)}:</strong> ${escapeHtml(o.id || '')} ${escapeHtml(o.description || '')}</li>`).join('')}</ul>
  ${!results.length ? '<p>No matches found.</p>' : ''}
</body></html>`;
  });

  const inspectCmd = vscode.commands.registerCommand('alp.inspectObject', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Open an ALP file first.');
      return;
    }
    const objectId = await vscode.window.showInputBox({ prompt: 'Object id to inspect', placeHolder: 'e.g. task-1' });
    if (!objectId) return;

    const objects = getParsedObjects(editor.document);
    const obj = objects.find((o: any) => o.id === objectId);

    if (!obj) {
      vscode.window.showInformationMessage(`Object '${objectId}' not found in current file.`);
      return;
    }

    const lines = [
      `**${obj._type}:** ${obj.id}`,
      '',
      ...Object.entries(obj).filter(([k]) => !['_type', 'id'].includes(k)).map(([k, v]) => `- **${k}:** ${Array.isArray(v) ? v.join(', ') : v}`),
    ];

    const panel = vscode.window.createWebviewPanel('alpInspect', `Inspect: ${obj.id}`, vscode.ViewColumn.One, {});
    panel.webview.html = getWebviewContent(`<pre>${escapeHtml(lines.join('\n'))}</pre>`);
  });

  context.subscriptions.push(visualizerCmd, policyCmd, timelinesCmd, policiesCmd, contractsCmd, vaultsCmd, agentsCmd, multimodalCmd, actionSpacesCmd, visionModelsCmd, synapseCmd, diffCmd, statsCmd, searchCmd, inspectCmd);
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