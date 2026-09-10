import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { TextDocuments } from 'vscode-languageserver/node';
import { workspaceIndex } from '../workspace/index';
import { onHover } from './hover';

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
}

beforeEach(() => setupIndex());
afterEach(() => workspaceIndex.clear());

describe('onHover', () => {
  it('returns hover details for an ALP block marker', () => {
    const doc = createDoc('@task');
    const docs = createDocuments(doc);
    const hover = onHover(
      { textDocument: { uri: URI }, position: { line: 0, character: 1 } },
      docs as any
    );
    expect(hover).not.toBeNull();
    const value = (hover!.contents as any).value as string;
    expect(value).toMatch(/@task/);
    expect(value).toMatch(/unit of work/i);
  });

  it('returns null when not hovering over a block marker', () => {
    const doc = createDoc('description: "a plain property line"');
    const docs = createDocuments(doc);
    const hover = onHover(
      { textDocument: { uri: URI }, position: { line: 0, character: 5 } },
      docs as any
    );
    expect(hover).toBeNull();
  });
});
