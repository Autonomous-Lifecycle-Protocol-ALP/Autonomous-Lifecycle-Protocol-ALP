import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

export let client: LanguageClient | undefined;

export function createLanguageClient(
  context: vscode.ExtensionContext
): LanguageClient | undefined {
  const serverModule = context.asAbsolutePath(
    path.join('server', 'dist', 'server.js')
  );
  if (!fs.existsSync(serverModule)) {
    vscode.window.showErrorMessage(
      'ALP extension: server not built. Run `npm run compile` in the vscode directory.'
    );
    return undefined;
  }

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
  return client;
}