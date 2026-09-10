import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { SemanticTokensParams, TextDocuments } from 'vscode-languageserver/node';
import { onSemanticTokens } from './semantic-tokens';

const URI = 'file:///test.alp';

function createDoc(text: string): TextDocument {
  return TextDocument.create(URI, 'alp', 1, text);
}

function createDocuments(doc: TextDocument): TextDocuments<TextDocument> {
  return { get: (uri: string) => (uri === URI ? doc : undefined) } as unknown as TextDocuments<TextDocument>;
}

describe('onSemanticTokens', () => {
  it('returns tokens for block type markers', () => {
    const doc = createDoc('@task\n');
    const docs = createDocuments(doc);
    const tokens = onSemanticTokens({ textDocument: { uri: URI } } as SemanticTokensParams, docs);
    expect(tokens.data.length).toBeGreaterThan(0);
  });

  it('returns tokens for property names', () => {
    const doc = createDoc('  id: my-task\n');
    const docs = createDocuments(doc);
    const tokens = onSemanticTokens({ textDocument: { uri: URI } } as SemanticTokensParams, docs);
    expect(tokens.data.length).toBeGreaterThan(0);
  });

  it('returns tokens for references', () => {
    const doc = createDoc('depends_on: -> task-build-auth\n');
    const docs = createDocuments(doc);
    const tokens = onSemanticTokens({ textDocument: { uri: URI } } as SemanticTokensParams, docs);
    expect(tokens.data.length).toBeGreaterThan(0);
  });

  it('returns empty tokens for a missing document', () => {
    const doc = createDoc('');
    const docs = createDocuments(doc);
    const tokens = onSemanticTokens({ textDocument: { uri: 'file:///missing.alp' } } as SemanticTokensParams, docs);
    expect(tokens.data).toHaveLength(0);
  });
});
