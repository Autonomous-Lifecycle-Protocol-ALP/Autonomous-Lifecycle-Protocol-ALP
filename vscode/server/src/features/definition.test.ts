import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { TextDocuments } from 'vscode-languageserver/node';
import { workspaceIndex } from '../workspace/index';
import { onDefinition } from './definition';

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

describe('onDefinition', () => {
  it('returns a location for a resolved `->` reference', () => {
    const doc = createDoc('depends_on: -> task-build-auth');
    const docs = createDocuments(doc);
    const loc = onDefinition(
      { textDocument: { uri: URI }, position: { line: 0, character: 20 } },
      docs as any
    );
    expect(loc).not.toBeNull();
    expect(loc!.uri).toBe(URI);
    expect(loc!.range.start.line).toBe(1);
    expect(loc!.range.end.line).toBe(1);
  });

  it('returns null when the reference is not found in the index', () => {
    const doc = createDoc('depends_on: -> unknown-id');
    const docs = createDocuments(doc);
    const loc = onDefinition(
      { textDocument: { uri: URI }, position: { line: 0, character: 20 } },
      docs as any
    );
    expect(loc).toBeNull();
  });

  it('returns null when the document does not exist', () => {
    const docs = createDocuments(createDoc(''));
    const loc = onDefinition(
      { textDocument: { uri: 'file:///missing.alp' }, position: { line: 0, character: 0 } },
      docs as any
    );
    expect(loc).toBeNull();
  });
});
