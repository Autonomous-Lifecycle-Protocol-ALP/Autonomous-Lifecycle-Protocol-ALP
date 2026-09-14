import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  InitializeResult,
  TextDocumentSyncKind,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { setWorkspaceRoot } from './workspace/index';
import { indexWorkspace } from './workspace/indexer';
import { validateDocument } from './features/diagnostics';
import { onDefinition } from './features/definition';
import { onHover } from './features/hover';
import { onCompletion } from './features/completion';
import { onRenameRequest } from './features/rename';
import { onWorkspaceSymbol, onDocumentSymbol } from './features/symbols';
import { onSemanticTokens } from './features/semantic-tokens';
import { onCodeAction } from './features/code-actions';

// ─── Connection Setup ────────────────────────────────────────────────────────
const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// ─── Initialization ──────────────────────────────────────────────────────────
connection.onInitialize((params: InitializeParams): InitializeResult => {
  if (params.workspaceFolders && params.workspaceFolders.length > 0) {
    let workspaceRoot = new URL(params.workspaceFolders[0].uri).pathname;
    if (workspaceRoot.match(/^\/[A-Za-z]:\//)) {
      workspaceRoot = workspaceRoot.substring(1);
    }
    workspaceRoot = decodeURIComponent(workspaceRoot);
    setWorkspaceRoot(workspaceRoot);
  }

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        triggerCharacters: ['-', '>', '@', ' '],
      },
      definitionProvider: true,
      hoverProvider: true,
      renameProvider: { prepareProvider: false },
      workspaceSymbolProvider: true,
      documentSymbolProvider: true,
      semanticTokensProvider: {
        legend: {
          tokenTypes: ['keyword', 'type', 'variable', 'string', 'property'],
          tokenModifiers: ['declaration']
        },
        full: true
      },
      codeActionProvider: true,
    },
  };
});

connection.onInitialized(() => {
  indexWorkspace();
});

// ─── Diagnostics ────────────────────────────────────────────────────────────
documents.onDidChangeContent((change) => {
  validateDocument(change.document, (diagnostics) => {
    connection.sendDiagnostics(diagnostics);
  });
});

// ─── Go to Definition ───────────────────────────────────────────────────────
connection.onDefinition((params) => onDefinition(params, documents));

// ─── Hover ──────────────────────────────────────────────────────────────────
connection.onHover((params) => onHover(params, documents));

// ─── Completion (IntelliSense) ──────────────────────────────────────────────
connection.onCompletion((params) => onCompletion(params, documents));

// ─── Rename ──────────────────────────────────────────────────────────────────
connection.onRenameRequest((params) => onRenameRequest(params, documents));

// ─── Workspace Symbols ──────────────────────────────────────────────────────
connection.onWorkspaceSymbol((params) => onWorkspaceSymbol(params));

// ─── Document Symbols ───────────────────────────────────────────────────────
connection.onDocumentSymbol((params) => onDocumentSymbol(params));

// ─── Semantic Tokens ────────────────────────────────────────────────────────
connection.languages.semanticTokens.on((params) => onSemanticTokens(params, documents));

// ─── Code Actions (Quick Fixes) ─────────────────────────────────────────────
connection.onCodeAction((params) => onCodeAction(params));

// ─── File Watcher (re-index when .alp files change) ──────────────────────────
documents.onDidSave(() => {
  indexWorkspace();
});

// ─── Start ──────────────────────────────────────────────────────────────────
documents.listen(connection);
connection.listen();
