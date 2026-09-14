import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { TextDocuments } from 'vscode-languageserver/node';
import { workspaceIndex } from '../workspace/index';
import { onRenameRequest } from './rename';

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
}

beforeEach(() => setupIndex());
afterEach(() => workspaceIndex.clear());

describe('onRenameRequest', () => {
  it('returns edits for renaming an id', () => {
    const doc = createDoc('@task\n  id: task-build-auth\n');
    const docs = createDocuments(doc);
    const edit = onRenameRequest(
      { textDocument: { uri: URI }, position: { line: 1, character: 9 }, newName: 'task-new' },
      docs as any
    );
    expect(edit).not.toBeNull();
    expect(edit!.changes![URI]).toHaveLength(1);
    expect(edit!.changes![URI][0].newText).toBe('task-new');
  });

  it('returns null when the cursor is not on a known id', () => {
    const doc = createDoc('@task\n  id: unknown-id\n');
    const docs = createDocuments(doc);
    const edit = onRenameRequest(
      { textDocument: { uri: URI }, position: { line: 1, character: 9 }, newName: 'new-id' },
      docs as any
    );
    expect(edit).toBeNull();
  });

  it('returns null when the document is missing', () => {
    const docs = createDocuments(createDoc(''));
    const edit = onRenameRequest(
      { textDocument: { uri: 'file:///missing.alp' }, position: { line: 0, character: 0 }, newName: 'new-id' },
      docs as any
    );
    expect(edit).toBeNull();
  });
});
