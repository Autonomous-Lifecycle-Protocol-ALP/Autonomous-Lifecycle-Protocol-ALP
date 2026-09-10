import * as vscode from 'vscode';
import { getParsedObjects } from './disposable';

export function createStatusBarItems(context: vscode.ExtensionContext) {
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBar.text = '$(graph) ALP DAG';
  statusBar.tooltip = 'Click to open ALP Interactive Visualizer';
  statusBar.command = 'alp.showVisualizer';
  statusBar.show();
  context.subscriptions.push(statusBar);

  const healthBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    99
  );
  healthBar.text = '$(pulse) ALP: Scanning...';
  healthBar.tooltip = 'ALP Workspace Health - click to validate';
  healthBar.command = 'alp.validateWorkspace';
  healthBar.show();
  context.subscriptions.push(healthBar);

  function updateHealthBar() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !editor.document.fileName.endsWith('.alp')) {
      healthBar.text = '$(pulse) ALP: No .alp file';
      healthBar.backgroundColor = undefined;
      return;
    }
    try {
      const objects = getParsedObjects(editor.document);
      const total = objects.length;
      const done = objects.filter(
        (o: any) => o.status === '[x]' || o.status === 'done'
      ).length;
      const blocked = objects.filter(
        (o: any) => o.status === '[!]' || o.status === 'blocked'
      ).length;
      if (blocked > 0) {
        healthBar.text = `$(warning) ALP: ${total} objs · ${blocked} blocked`;
        healthBar.backgroundColor = new vscode.ThemeColor(
          'statusBarItem.warningBackground'
        );
      } else if (total === 0) {
        healthBar.text = '$(pulse) ALP: Empty spec';
        healthBar.backgroundColor = undefined;
      } else {
        healthBar.text = `$(check) ALP: ${total} objs · ${done} done`;
        healthBar.backgroundColor = undefined;
      }
    } catch {
      healthBar.text = '$(error) ALP: Parse error';
      healthBar.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.errorBackground'
      );
    }
  }

  vscode.window.onDidChangeActiveTextEditor(
    updateHealthBar,
    null,
    context.subscriptions
  );
  vscode.workspace.onDidSaveTextDocument(
    updateHealthBar,
    null,
    context.subscriptions
  );
  updateHealthBar();

  return { statusBar, healthBar };
}