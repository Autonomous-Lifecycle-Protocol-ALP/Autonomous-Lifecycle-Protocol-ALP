import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { CodeActionParams, Range } from 'vscode-languageserver/node';
import { workspaceIndex } from '../workspace/index';
import { onCodeAction } from './code-actions';

const URI = 'file:///test.alp';

function createDoc(text: string): TextDocument {
  return TextDocument.create(URI, 'alp', 1, text);
}

function setupIndex(): void {
  workspaceIndex.clear();
}

beforeEach(() => setupIndex());
afterEach(() => workspaceIndex.clear());

describe('onCodeAction', () => {
  it('returns a quick fix for an unresolved reference', () => {
    workspaceIndex.set('task-build-auth', { id: 'task-build-auth', type: 'task', uri: URI, line: 1, properties: {} });
    const doc = createDoc('@task\n  id: task-build-auth\n  depends_on: -> build-auth\n');
    const params: CodeActionParams = {
      textDocument: { uri: URI },
      range: Range.create(2, 14, 2, 24),
      context: {
        diagnostics: [
          {
            message: "Unresolved reference: 'build-auth'",
            range: Range.create(2, 14, 2, 24),
            severity: 1,
          },
        ],
      },
    };
    const actions = onCodeAction(params);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0].title).toContain('Change to');
  });

  it('returns a quick fix for [!] missing reason', () => {
    const doc = createDoc('@task\n  id: task-build-auth\n  [!]\n');
    const params: CodeActionParams = {
      textDocument: { uri: URI },
      range: Range.create(2, 2, 2, 5),
      context: {
        diagnostics: [
          {
            message: "Status marker '[!]' requires a reason",
            range: Range.create(2, 2, 2, 5),
            severity: 1,
          },
        ],
      },
    };
    const actions = onCodeAction(params);
    expect(actions).toHaveLength(1);
    expect(actions[0].title).toBe("Add placeholder reason for [!]");
  });

  it('returns a quick fix for [?] missing reason', () => {
    const doc = createDoc('@task\n  id: task-build-auth\n  [?]\n');
    const params: CodeActionParams = {
      textDocument: { uri: URI },
      range: Range.create(2, 2, 2, 5),
      context: {
        diagnostics: [
          {
            message: "Status marker '[?]' requires a reason",
            range: Range.create(2, 2, 2, 5),
            severity: 1,
          },
        ],
      },
    };
    const actions = onCodeAction(params);
    expect(actions).toHaveLength(1);
    expect(actions[0].title).toBe("Add placeholder reason for [?]");
  });

  it('returns empty array when no matching diagnostics', () => {
    const doc = createDoc('@task\n  id: task-build-auth\n');
    const params: CodeActionParams = {
      textDocument: { uri: URI },
      range: Range.create(0, 0, 0, 10),
      context: {
        diagnostics: [
          {
            message: 'Some other warning',
            range: Range.create(0, 0, 0, 10),
            severity: 1,
          },
        ],
      },
    };
    const actions = onCodeAction(params);
    expect(actions).toHaveLength(0);
  });
});
