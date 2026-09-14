import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { TextDocuments, SymbolKind } from 'vscode-languageserver/node';
import { workspaceIndex } from '../workspace/index';
import { onWorkspaceSymbol, onDocumentSymbol } from './symbols';

const URI = 'file:///test.alp';

function createDoc(text: string): TextDocument {
  return TextDocument.create(URI, 'alp', 1, text);
}

function createDocuments(doc: TextDocument): TextDocuments<TextDocument> {
  return { get: (uri: string) => (uri === URI ? doc : undefined) } as unknown as TextDocuments<TextDocument>;
}

function setupIndex(): void {
  workspaceIndex.clear();
  workspaceIndex.set('task-build-auth', {
    id: 'task-build-auth',
    type: 'task',
    uri: URI,
    line: 1,
    properties: {},
  });
  workspaceIndex.set('agent-dev', {
    id: 'agent-dev',
    type: 'agent',
    uri: URI,
    line: 2,
    properties: {},
  });
  workspaceIndex.set('policy-no-raw', {
    id: 'policy-no-raw',
    type: 'policy',
    uri: URI,
    line: 3,
    properties: {},
  });
}

beforeEach(() => setupIndex());
afterEach(() => workspaceIndex.clear());

describe('onWorkspaceSymbol', () => {
  it('returns symbols matching the query by id', () => {
    const symbols = onWorkspaceSymbol({ query: 'task-build' });
    expect(symbols).toHaveLength(1);
    expect(symbols[0].name).toBe('task-build-auth');
  });

  it('returns symbols matching the query by type', () => {
    const symbols = onWorkspaceSymbol({ query: 'task' });
    expect(symbols.map((s) => s.name)).toContain('task-build-auth');
  });

  it('returns empty array when no symbols match', () => {
    const symbols = onWorkspaceSymbol({ query: 'nonexistent' });
    expect(symbols).toHaveLength(0);
  });
});

describe('onDocumentSymbol', () => {
  it('returns symbols for the matching document uri', () => {
    const doc = createDoc('@task\n  id: task-build-auth\n');
    const docs = createDocuments(doc);
    const symbols = onDocumentSymbol({ textDocument: { uri: URI } });
    expect(symbols).toHaveLength(3);
    expect(symbols.every((s) => s.kind === SymbolKind.Object)).toBe(true);
  });

  it('returns empty array for a different uri', () => {
    const doc = createDoc('@task\n  id: task-build-auth\n');
    const docs = createDocuments(doc);
    const symbols = onDocumentSymbol({ textDocument: { uri: 'file:///other.alp' } });
    expect(symbols).toHaveLength(0);
  });
});
