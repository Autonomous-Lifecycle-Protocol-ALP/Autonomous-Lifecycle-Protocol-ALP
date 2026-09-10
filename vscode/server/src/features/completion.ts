import {
  CompletionItem,
  CompletionItemKind,
  CompletionParams,
  Range,
} from 'vscode-languageserver/node';
import { TextDocuments } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { workspaceIndex } from '../workspace/index';
import { BLOCK_TYPES } from '../constants/block-types';

export function onCompletion(
  params: CompletionParams,
  documents: TextDocuments<TextDocument>
): CompletionItem[] {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return [];
  const lines = doc.getText().split('\n');
  const lineStr = lines[params.position.line] || '';
  const textBeforeCursor = lineStr.substring(0, params.position.character);

  const items: CompletionItem[] = [];

  if (textBeforeCursor.match(/->\s*$/)) {
    // Suggest all known IDs when user types `-> `
    for (const [id, entry] of workspaceIndex) {
      items.push({
        label: id,
        kind: CompletionItemKind.Reference,
        detail: `@${entry.type}`,
        documentation: entry.properties.description || `Reference to @${entry.type} ${id}`,
        insertText: id,
      });
    }
  } else if (textBeforeCursor.match(/^@$/)) {
    // Suggest block markers
    const blockTypes = Object.keys(BLOCK_TYPES);
    for (const t of blockTypes) {
      items.push({
        label: t,
        kind: CompletionItemKind.Keyword,
        detail: 'ALP Block Marker',
        insertText: `${t}\n  id: `,
      });
    }
  } else if (textBeforeCursor.match(/^\s+!$/)) {
    // Suggest directives
    const directives = [
      '!alp-version', '!import', '!deprecated', '!assert', '!if', '!integrity',
    ];
    for (const d of directives) {
      items.push({
        label: d,
        kind: CompletionItemKind.Keyword,
        detail: 'ALP Directive',
        insertText: d,
      });
    }
  }

  return items;
}
