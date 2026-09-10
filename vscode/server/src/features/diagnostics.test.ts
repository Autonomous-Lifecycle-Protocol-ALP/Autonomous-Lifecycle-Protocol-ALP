import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { workspaceIndex } from '../workspace/index';
import { validateDocument } from './diagnostics';

const URI = 'file:///test.alp';

function createDoc(text: string): TextDocument {
  return TextDocument.create(URI, 'alp', 1, text);
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

describe('validateDocument', () => {
  it('produces no diagnostics for a valid document', () => {
    const doc = createDoc('@task\n  id: task-build-auth\n');
    const diagnostics: { uri: string; diagnostics: Diagnostic[] }[] = [];
    validateDocument(doc, (d) => diagnostics.push(d));
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].diagnostics).toHaveLength(0);
  });

  it('produces a warning for an unresolved reference', () => {
    const doc = createDoc('@task\n  id: task-build-auth\n  depends_on: -> unknown-id\n');
    const diagnostics: { uri: string; diagnostics: Diagnostic[] }[] = [];
    validateDocument(doc, (d) => diagnostics.push(d));
    expect(diagnostics[0].diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics[0].diagnostics.some((d) => d.message.includes('Unresolved reference'))).toBe(true);
  });

  it('produces an error for blocked status marker without reason', () => {
    const doc = createDoc('@task\n  id: task-build-auth\n  [!]\n');
    const diagnostics: { uri: string; diagnostics: Diagnostic[] }[] = [];
    validateDocument(doc, (d) => diagnostics.push(d));
    const markerDiag = diagnostics[0].diagnostics.find((d) => d.message.includes("[!]' requires a reason"));
    expect(markerDiag).toBeDefined();
    expect(markerDiag!.severity).toBe(DiagnosticSeverity.Error);
  });

  it('produces an error for human gate marker without reason', () => {
    const doc = createDoc('@task\n  id: task-build-auth\n  [?]\n');
    const diagnostics: { uri: string; diagnostics: Diagnostic[] }[] = [];
    validateDocument(doc, (d) => diagnostics.push(d));
    const markerDiag = diagnostics[0].diagnostics.find((d) => d.message.includes("[?]' requires a reason"));
    expect(markerDiag).toBeDefined();
    expect(markerDiag!.severity).toBe(DiagnosticSeverity.Error);
  });

  it('produces a hint for deprecated directive', () => {
    const doc = createDoc('@task\n  id: task-build-auth\n  !deprecated: old\n');
    const diagnostics: { uri: string; diagnostics: Diagnostic[] }[] = [];
    validateDocument(doc, (d) => diagnostics.push(d));
    const depDiag = diagnostics[0].diagnostics.find((d) => d.message.includes('Deprecated'));
    expect(depDiag).toBeDefined();
    expect(depDiag!.severity).toBe(DiagnosticSeverity.Hint);
  });
});
