import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { CompletionItemKind, TextDocuments } from 'vscode-languageserver/node';
import { workspaceIndex } from '../workspace/index';
import { onCompletion } from './completion';

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
    properties: { description: 'Build auth', status: 'active' },
  });
  workspaceIndex.set('agent-dev', {
    id: 'agent-dev',
    type: 'agent',
    uri: URI,
    line: 2,
    properties: { description: 'Dev agent', owner: 'team-a' },
  });
  workspaceIndex.set('policy-no-raw', {
    id: 'policy-no-raw',
    type: 'policy',
    uri: URI,
    line: 3,
    properties: { description: 'No raw SQL' },
  });
}

beforeEach(() => setupIndex());
afterEach(() => workspaceIndex.clear());

describe('onCompletion', () => {
  it('returns block type suggestions for an empty document when @ is typed', () => {
    const doc = createDoc('@');
    const docs = createDocuments(doc);
    const items = onCompletion(
      { textDocument: { uri: URI }, position: { line: 0, character: 1 } },
      docs as any
    );
    const labels = items.map((i) => i.label);
    expect(labels).toContain('task');
    expect(labels).toContain('agent');
    expect(labels).toContain('policy');
    expect(items.length).toBeGreaterThan(10);
  });

  it('returns reference suggestions when typing `-> `', () => {
    const doc = createDoc('depends_on: -> ');
    const docs = createDocuments(doc);
    const items = onCompletion(
      { textDocument: { uri: URI }, position: { line: 0, character: 15 } },
      docs as any
    );
    const labels = items.map((i) => i.label);
    expect(labels).toContain('task-build-auth');
    expect(labels).toContain('agent-dev');
    expect(labels).toContain('policy-no-raw');
    expect(items.length).toBe(3);
    expect(items.every((i) => i.kind === CompletionItemKind.Reference)).toBe(true);
  });

  it('returns directive suggestions when starting a directive with !', () => {
    const doc = createDoc('  !');
    const docs = createDocuments(doc);
    const items = onCompletion(
      { textDocument: { uri: URI }, position: { line: 0, character: 3 } },
      docs as any
    );
    const labels = items.map((i) => i.label);
    expect(labels).toContain('!alp-version');
    expect(labels).toContain('!import');
    expect(labels).toContain('!deprecated');
    expect(labels).toContain('!assert');
    expect(labels).toContain('!if');
    expect(labels).toContain('!integrity');
  });
});
