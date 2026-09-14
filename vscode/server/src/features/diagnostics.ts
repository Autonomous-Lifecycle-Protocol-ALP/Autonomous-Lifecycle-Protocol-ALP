import {
  Diagnostic,
  DiagnosticSeverity,
  Range,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AlpParser, ValidationError } from '@autonomous-lifecycle-protocol-alp/parser';
import { DocumentValidator, PolicyEnforcer } from '@autonomous-lifecycle-protocol-alp/sdk';
import { workspaceIndex } from '../workspace/index';

export function validateDocument(doc: TextDocument, sendDiagnostics: (diagnostics: { uri: string; diagnostics: Diagnostic[] }) => void): void {
  const diagnostics: Diagnostic[] = [];
  const text = doc.getText();

  try {
    const parser = new AlpParser();
    const parsedObjects = parser.parse(text);
    const validator = new DocumentValidator();
    for (const obj of parsedObjects) {
      try {
        validator.validate({ _type: obj._type, id: obj.id || 'unnamed', properties: obj });
      } catch (valErr: any) {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: Range.create(0, 0, 0, doc.lineCount - 1 || 0),
          message: `Document Validation: ${valErr.message}`,
          source: 'ALP-SDK',
        });
      }
    }
  } catch (err: any) {
    const message = err.message || 'Unknown ALP error';
    let line = 0;
    const lineMatch = message.match(/at line (\d+)/);
    if (lineMatch) {
      line = Math.max(0, parseInt(lineMatch[1], 10) - 1);
    }
    if (line >= doc.lineCount) {
      line = doc.lineCount - 1;
    }

    diagnostics.push({
      severity: err instanceof ValidationError || err?.name === 'ValidationError'
        ? DiagnosticSeverity.Warning
        : DiagnosticSeverity.Error,
      range: Range.create(line, 0, line, doc.lineCount - 1 || 0),
      message,
      source: 'ALP',
    });
  }

  // PolicyEnforcer Governance Audit
  try {
    const parser2 = new AlpParser();
    const allObjects = parser2.parse(text);
    if (allObjects.length > 0) {
      const enforcer = new PolicyEnforcer({ requiredFields: ['id', '_type'] });
      const govResult = enforcer.govern({ objects: allObjects } as any);
      if (!govResult.compliant && govResult.violations.length > 0) {
        for (const violationId of govResult.violations) {
          diagnostics.push({
            severity: DiagnosticSeverity.Warning,
            range: Range.create(0, 0, 0, doc.lineCount - 1 || 0),
            message: `Policy violation: object '${violationId}' does not satisfy governance requirements.`,
            source: 'ALP-Governance',
          });
        }
      }
    }
  } catch (_govErr) {
    // Governance audit is non-blocking; silently skip if parsing fails
  }

  // Check for unresolved references
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const refMatch = lines[i].match(/->\s+([a-zA-Z0-9_-]+)/);
    if (refMatch) {
      const refId = refMatch[1];
      if (!workspaceIndex.has(refId)) {
        const col = lines[i].indexOf(refId);
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: Range.create(i, col, i, col + refId.length),
          message: `Unresolved reference: '${refId}'`,
          source: 'ALP',
        });
      }
    }

    // Check for !deprecated directive warnings
    const deprecatedMatch = lines[i].match(/^\s+(!deprecated):\s*(.*)$/);
    if (deprecatedMatch && deprecatedMatch.index !== undefined) {
      const col = lines[i].indexOf('!deprecated');
      diagnostics.push({
        severity: DiagnosticSeverity.Hint,
        range: Range.create(i, col, i, col + '!deprecated'.length),
        message: `Deprecated: ${deprecatedMatch[2] || 'This object is marked as deprecated.'}`,
        source: 'ALP',
      });
    }

    // Check for status markers missing reasons (V9+)
    const blockedMatch = lines[i].match(/\[\!\](?!\s+\S)/);
    if (blockedMatch && blockedMatch.index !== undefined) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: Range.create(i, blockedMatch.index, i, blockedMatch.index + 3),
        message: "Status marker '[!]' requires a reason (e.g. '[!] waiting for review'). Mandatory since v9.0.0.",
        source: 'ALP',
      });
    }
    const humanGateMatch = lines[i].match(/\[\?\](?!\s+\S)/);
    if (humanGateMatch && humanGateMatch.index !== undefined) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: Range.create(i, humanGateMatch.index, i, humanGateMatch.index + 3),
        message: "Status marker '[?]' requires a reason (e.g. '[?] awaiting human approval'). Mandatory since v9.0.0.",
        source: 'ALP',
      });
    }
  }

  sendDiagnostics({ uri: doc.uri, diagnostics });
}
