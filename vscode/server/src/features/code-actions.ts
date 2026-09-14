import {
  CodeActionParams,
  CodeAction,
  CodeActionKind,
  TextEdit,
  Range,
} from 'vscode-languageserver/node';
import { workspaceIndex } from '../workspace/index';

export function onCodeAction(params: CodeActionParams): CodeAction[] {
  const actions: CodeAction[] = [];
  for (const diag of params.context.diagnostics) {
    if (diag.message.startsWith('Unresolved reference:')) {
      const match = diag.message.match(/'([^']+)'/);
      if (match) {
        const badId = match[1];
        for (const [id] of workspaceIndex) {
          if (id.includes(badId) || badId.includes(id) ||
              id.substring(0, 3) === badId.substring(0, 3)) {
            actions.push(CodeAction.create(
              `Change to '${id}'`,
              {
                changes: {
                  [params.textDocument.uri]: [
                    TextEdit.replace(diag.range, id)
                  ]
                }
              },
              CodeActionKind.QuickFix
            ));
          }
        }
      }
    }

    if (diag.message.includes("Status marker '[!]' requires a reason")) {
      const markerRange = Range.create(diag.range.start.line, diag.range.start.character, diag.range.start.line, diag.range.end.character);
      actions.push(CodeAction.create(
        "Add placeholder reason for [!]",
        {
          changes: {
            [params.textDocument.uri]: [
              TextEdit.replace(markerRange, '[!] pending review')
            ]
          }
        },
        CodeActionKind.QuickFix
      ));
    }

    if (diag.message.includes("Status marker '[?]' requires a reason")) {
      const markerRange = Range.create(diag.range.start.line, diag.range.start.character, diag.range.start.line, diag.range.end.character);
      actions.push(CodeAction.create(
        "Add placeholder reason for [?]",
        {
          changes: {
            [params.textDocument.uri]: [
              TextEdit.replace(markerRange, '[?] awaiting human approval')
            ]
          }
        },
        CodeActionKind.QuickFix
      ));
    }
  }
  return actions;
}
