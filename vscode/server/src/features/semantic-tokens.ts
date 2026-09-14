import {
  SemanticTokensParams,
  SemanticTokensBuilder,
  SemanticTokens,
} from 'vscode-languageserver/node';
import { TextDocuments } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

export function onSemanticTokens(
  params: SemanticTokensParams,
  documents: TextDocuments<TextDocument>
): SemanticTokens {
  const builder = new SemanticTokensBuilder();
  const doc = documents.get(params.textDocument.uri);
  if (doc) {
    const lines = doc.getText().split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const typeMatch = line.match(/^@([a-z_]+)$/);
      if (typeMatch) {
        builder.push(i, 0, typeMatch[0].length, 1, 0);
      }
      const propMatch = line.match(/^(\s*)([a-z_!][a-z0-9_-]*):\s*(.*)$/);
      if (propMatch) {
        const propName = propMatch[2];
        if (propName.startsWith('!')) {
          builder.push(i, propMatch[1].length, propName.length, 3, 0);
        } else {
          builder.push(i, propMatch[1].length, propName.length, 4, 0);
        }
      }
      const refRegex = /(->\s+)([a-zA-Z0-9_-]+)/g;
      let refMatch;
      while ((refMatch = refRegex.exec(line)) !== null) {
        builder.push(i, refMatch.index, 2, 0, 0);
        builder.push(i, refMatch.index + refMatch[1].length, refMatch[2].length, 2, 0);
      }
    }
  }
  return builder.build();
}
