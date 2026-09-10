import * as vscode from 'vscode';
import { registerAdditionalCommands } from '../commands';
import { panels } from './disposable';
import { createLanguageClient } from './language-client';
import { createStatusBarItems } from './status-bar';
import { registerWebviewCommands } from './webview-commands';

export * from './disposable';
export * from './language-client';
export * from './status-bar';
export * from './webview-commands';

export function activate(context: vscode.ExtensionContext) {
  console.log('ALP Language Support v80.0.0 is now active.');

  const client = createLanguageClient(context);
  if (client) {
    client.start();
  }

  createStatusBarItems(context);
  registerWebviewCommands(context);
  registerAdditionalCommands(context);
}

export function deactivate(): Thenable<void> | undefined {
  for (const panel of panels.values()) {
    panel.dispose();
  }
  panels.clear();
  return undefined;
}