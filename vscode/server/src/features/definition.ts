import {
  DefinitionParams,
  Location,
  Range,
} from 'vscode-languageserver/node';
import { TextDocuments } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { workspaceIndex } from '../workspace/index';

export function onDefinition(
  params: DefinitionParams,
  documents: TextDocuments<TextDocument>
): Location | null {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return null;

  const lines = doc.getText().split('\n');
  const line = lines[params.position.line] || '';

  const refMatch = line.match(/->\s+([a-zA-Z0-9_-]+)/);
  if (refMatch) {
    const targetId = refMatch[1];
    const entry = workspaceIndex.get(targetId);
    if (entry) {
      return Location.create(
        entry.uri,
        Range.create(entry.line, 0, entry.line, 0)
      );
    }
  }

  return null;
}
