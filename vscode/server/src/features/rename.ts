import * as fs from 'fs';
import * as path from 'path';
import {
  RenameParams,
  WorkspaceEdit,
  TextEdit,
  Range,
} from 'vscode-languageserver/node';
import { TextDocuments } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { workspaceIndex, workspaceRoot } from '../workspace/index';

export function onRenameRequest(
  params: RenameParams,
  documents: TextDocuments<TextDocument>
): WorkspaceEdit | null {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return null;
  const line = doc.getText().split('\n')[params.position.line] || '';

  let oldId = '';
  const refMatch = line.match(/->\s+([a-zA-Z0-9_-]+)/);
  if (refMatch && params.position.character >= line.indexOf(refMatch[1])) {
    oldId = refMatch[1];
  } else {
    const idMatch = line.match(/id:\s*([a-zA-Z0-9_-]+)/);
    if (idMatch && params.position.character >= line.indexOf(idMatch[1])) {
      oldId = idMatch[1];
    }
  }

  if (!oldId || !workspaceIndex.has(oldId)) return null;

  const newId = params.newName;
  const changes: Record<string, TextEdit[]> = {};

  const addEditsForContent = (uri: string, content: string): void => {
    const lines = content.split('\n');
    const edits: TextEdit[] = [];
    for (let i = 0; i < lines.length; i++) {
      const idRegex = new RegExp(`^(\\s*id:\\s*)${oldId}(\\s*)$`);
      const match = lines[i].match(idRegex);
      if (match) {
        edits.push(TextEdit.replace(
          Range.create(i, match[1].length, i, match[1].length + oldId.length),
          newId
        ));
      }
      const refRegex = new RegExp(`(->\\s+)${oldId}\\b`, 'g');
      let rMatch;
      while ((rMatch = refRegex.exec(lines[i])) !== null) {
        edits.push(TextEdit.replace(
          Range.create(i, rMatch.index + rMatch[1].length, i, rMatch.index + rMatch[1].length + oldId.length),
          newId
        ));
      }
    }
    if (edits.length > 0) changes[uri] = edits;
  };

  // Always include edits for the current document.
  addEditsForContent(params.textDocument.uri, doc.getText());

  // Also walk the .alp directory for additional files.
  const alpDir = path.join(workspaceRoot, '.alp');
  if (fs.existsSync(alpDir)) {
    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(fullPath);
        else if (fullPath.endsWith('.alp')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const uri = 'file:///' + encodeURI(fullPath.replace(/\\/g, '/'));
          addEditsForContent(uri, content);
        }
      }
    };
    walk(alpDir);
  }

  return { changes };
}
