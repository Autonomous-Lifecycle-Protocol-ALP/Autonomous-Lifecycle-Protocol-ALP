import {
  SymbolInformation,
  SymbolKind,
  DocumentSymbolParams,
  DocumentSymbol,
  Range,
} from 'vscode-languageserver/node';
import { workspaceIndex } from '../workspace/index';

export function onWorkspaceSymbol(params: { query: string }): SymbolInformation[] {
  const query = params.query.toLowerCase();
  const symbols: SymbolInformation[] = [];
  for (const [id, entry] of workspaceIndex) {
    if (id.toLowerCase().includes(query) || entry.type.toLowerCase().includes(query)) {
      symbols.push(SymbolInformation.create(
        id,
        SymbolKind.Object,
        Range.create(entry.line, 0, entry.line, id.length),
        entry.uri,
        entry.type
      ));
    }
  }
  return symbols;
}

export function onDocumentSymbol(params: DocumentSymbolParams): DocumentSymbol[] {
  const symbols: DocumentSymbol[] = [];
  for (const [id, entry] of workspaceIndex) {
    if (entry.uri === params.textDocument.uri) {
      symbols.push(DocumentSymbol.create(
        id,
        `@${entry.type}`,
        SymbolKind.Object,
        Range.create(entry.line, 0, entry.line + 5, 0),
        Range.create(entry.line, 0, entry.line, id.length)
      ));
    }
  }
  return symbols;
}
