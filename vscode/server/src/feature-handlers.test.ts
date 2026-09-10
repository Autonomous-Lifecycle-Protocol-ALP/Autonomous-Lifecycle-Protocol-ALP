import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { workspaceIndex, setWorkspaceRoot } from './workspace/index';
import { onCompletion } from './features/completion';
import { onHover } from './features/hover';
import { onDefinition } from './features/definition';
import { onSemanticTokens } from './features/semantic-tokens';
import { onCodeAction } from './features/code-actions';
import { onWorkspaceSymbol, onDocumentSymbol } from './features/symbols';

const URI = 'file:///test.alp';

function createDoc(text: string): TextDocument {
  return TextDocument.create(URI, 'alp', 1, text);
}

function createDocuments(doc: TextDocument): { get: (uri: string) => TextDocument | undefined } {
  return {
    get: (uri: string) => (uri === URI ? doc : undefined),
  };
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

beforeEach(() => {
  setupIndex();
  setWorkspaceRoot('/test');
});

afterEach(() => {
  workspaceIndex.clear();
});

describe('onCompletion', () => {
  it('suggests block types when cursor is after @', () => {
    const doc = createDoc('@');
    const docs = createDocuments(doc);
    const items = onCompletion({ textDocument: { uri: URI }, position: { line: 0, character: 1 } }, docs as any);
    const labels = items.map((i) => i.label);
    expect(labels).toContain('task');
    expect(labels).toContain('agent');
    expect(labels).toContain('policy');
  });

  it('suggests references when cursor follows ->', () => {
    const doc = createDoc('depends_on: -> ');
    const docs = createDocuments(doc);
    const items = onCompletion({ textDocument: { uri: URI }, position: { line: 0, character: 14 } }, docs as any);
    const labels = items.map((i) => i.label);
    expect(labels).toContain('task-build-auth');
    expect(labels).toContain('agent-dev');
  });

  it('suggests directives when cursor follows whitespace and !', () => {
    const docs = createDocuments(createDoc('  !'));
    const items = onCompletion({ textDocument: { uri: URI }, position: { line: 0, character: 3 } }, docs as any);
    const labels = items.map((i) => i.label);
    expect(labels).toContain('!alp-version');
    expect(labels).toContain('!import');
    expect(labels).toContain('!deprecated');
  });

  it('returns empty array when document is missing', () => {
    const docs = { get: () => undefined };
    const items = onCompletion({ textDocument: { uri: 'file:///missing.alp' }, position: { line: 0, character: 0 } }, docs as any);
    expect(items).toEqual([]);
  });
});

describe('onHover', () => {
  it('shows reference details on -> hover', () => {
    const doc = createDoc('depends_on: -> task-build-auth');
    const docs = createDocuments(doc);
    const hover = onHover({ textDocument: { uri: URI }, position: { line: 0, character: 20 } }, docs as any);
    expect(hover).not.toBeNull();
    expect((hover!.contents as any).value || hover!.contents).toMatch(/Build auth/);
    expect((hover!.contents as any).value || hover!.contents).toMatch(/task-build-auth/);
  });

  it('shows block marker description on @ hover', () => {
    const doc = createDoc('@agent');
    const docs = createDocuments(doc);
    const hover = onHover({ textDocument: { uri: URI }, position: { line: 0, character: 1 } }, docs as any);
    expect(hover).not.toBeNull();
    expect((hover!.contents as any).value || hover!.contents).toMatch(/@agent/);
  });

  it('shows directive description on ! hover', () => {
    const doc = createDoc('  !deprecated');
    const docs = createDocuments(doc);
    const hover = onHover({ textDocument: { uri: URI }, position: { line: 0, character: 3 } }, docs as any);
    expect(hover).not.toBeNull();
    expect((hover!.contents as any).value || hover!.contents).toMatch(/!deprecated/);
  });

  it('returns null for unknown references', () => {
    const doc = createDoc('depends_on: -> unknown-id');
    const docs = createDocuments(doc);
    const hover = onHover({ textDocument: { uri: URI }, position: { line: 0, character: 20 } }, docs as any);
    expect(hover).toBeNull();
  });

  it('returns null when document is missing', () => {
    const docs = { get: () => undefined };
    const hover = onHover({ textDocument: { uri: 'file:///missing.alp' }, position: { line: 0, character: 0 } }, docs as any);
    expect(hover).toBeNull();
  });
});

describe('onDefinition', () => {
  it('returns location for a known reference', () => {
    const doc = createDoc('depends_on: -> task-build-auth');
    const docs = createDocuments(doc);
    const loc = onDefinition({ textDocument: { uri: URI }, position: { line: 0, character: 20 } }, docs as any);
    expect(loc).not.toBeNull();
    expect(loc!.uri).toBe(URI);
    expect(loc!.range.start.line).toBe(1);
  });

  it('returns null for unknown reference', () => {
    const doc = createDoc('depends_on: -> unknown-id');
    const docs = createDocuments(doc);
    const loc = onDefinition({ textDocument: { uri: URI }, position: { line: 0, character: 20 } }, docs as any);
    expect(loc).toBeNull();
  });

  it('returns null when document is missing', () => {
    const docs = { get: () => undefined };
    const loc = onDefinition({ textDocument: { uri: 'file:///missing.alp' }, position: { line: 0, character: 0 } }, docs as any);
    expect(loc).toBeNull();
  });
});

describe('onSemanticTokens', () => {
  it('emits tokens for block markers, properties, and references', () => {
    const text = `@task
  id: task-1
  agent: -> agent-dev
`;
    const doc = createDoc(text);
    const docs = createDocuments(doc);
    const tokens = onSemanticTokens({ textDocument: { uri: URI } }, docs as any);
    expect(tokens.data.length).toBeGreaterThan(0);
  });

  it('returns empty tokens for missing document', () => {
    const docs = { get: () => undefined };
    const tokens = onSemanticTokens({ textDocument: { uri: 'file:///missing.alp' } }, docs as any);
    expect(tokens.data).toEqual([]);
  });
});

describe('onCodeAction', () => {
  it('suggests quick fix for unresolved reference', () => {
    const diag = {
      message: "Unresolved reference: 'task-build-auth'",
      range: { start: { line: 0, character: 0 }, end: { line: 0, character: 20 } },
    };
    const actions = onCodeAction({
      textDocument: { uri: URI },
      range: diag.range,
      context: { diagnostics: [diag as any] },
    });
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0].title).toMatch(/Change to/);
    expect(actions[0].kind).toBe('quickfix');
  });

  it('suggests placeholder for [!] without reason', () => {
    const diag = {
      message: "Status marker '[!]' requires a reason",
      range: { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } },
    };
    const actions = onCodeAction({
      textDocument: { uri: URI },
      range: diag.range,
      context: { diagnostics: [diag as any] },
    });
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0].title).toMatch(/Add placeholder reason/);
  });

  it('suggests placeholder for [?] without reason', () => {
    const diag = {
      message: "Status marker '[?]' requires a reason",
      range: { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } },
    };
    const actions = onCodeAction({
      textDocument: { uri: URI },
      range: diag.range,
      context: { diagnostics: [diag as any] },
    });
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0].title).toMatch(/Add placeholder reason/);
  });

  it('returns empty actions for non-matching diagnostics', () => {
    const diag = {
      message: 'Some other error',
      range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
    };
    const actions = onCodeAction({
      textDocument: { uri: URI },
      range: diag.range,
      context: { diagnostics: [diag as any] },
    });
    expect(actions).toEqual([]);
  });
});

describe('onWorkspaceSymbol', () => {
  it('finds symbols by query', () => {
    const symbols = onWorkspaceSymbol({ query: 'task' });
    expect(symbols.length).toBeGreaterThanOrEqual(1);
    expect(symbols.some((s) => s.name === 'task-build-auth')).toBe(true);
  });

  it('finds symbols by type', () => {
    const symbols = onWorkspaceSymbol({ query: 'agent' });
    expect(symbols.some((s) => s.name === 'agent-dev')).toBe(true);
  });

  it('returns all symbols for empty query', () => {
    const symbols = onWorkspaceSymbol({ query: '' });
    expect(symbols.length).toBe(3);
  });
});

describe('onDocumentSymbol', () => {
  it('returns symbols for matching document URI', () => {
    const symbols = onDocumentSymbol({ textDocument: { uri: URI } });
    expect(symbols.length).toBe(3);
    expect(symbols.some((s) => s.name === 'task-build-auth')).toBe(true);
  });

  it('returns empty array for non-matching URI', () => {
    const symbols = onDocumentSymbol({ textDocument: { uri: 'file:///other.alp' } });
    expect(symbols).toEqual([]);
  });
});
