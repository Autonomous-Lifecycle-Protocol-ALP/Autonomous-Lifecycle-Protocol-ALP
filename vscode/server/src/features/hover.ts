import {
  Hover,
  HoverParams,
  Range,
} from 'vscode-languageserver/node';
import { TextDocuments } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { workspaceIndex } from '../workspace/index';
import { BLOCK_TYPES } from '../constants/block-types';
import { DIRECTIVE_DESCRIPTIONS } from '../constants/directives';

export function onHover(
  params: HoverParams,
  documents: TextDocuments<TextDocument>
): Hover | null {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return null;

  const lines = doc.getText().split('\n');
  const line = lines[params.position.line] || '';

  // Hover over `-> some-id` to see details
  const refMatch = line.match(/->\s+([a-zA-Z0-9_-]+)/);
  if (refMatch) {
    const targetId = refMatch[1];
    const entry = workspaceIndex.get(targetId);
    if (entry) {
      const details = [
        `**@${entry.type}** \`${entry.id}\``,
        '',
        entry.properties.description ? entry.properties.description : '',
        entry.properties.status ? `Status: \`${entry.properties.status}\`` : '',
        entry.properties.owner ? `Owner: \`${entry.properties.owner}\`` : '',
        entry.properties.priority ? `Priority: \`${entry.properties.priority}\`` : '',
      ].filter(Boolean).join('\n');

      return { contents: { kind: 'markdown', value: details } };
    }
  }

  // Hover over @type block markers
  const blockMatch = line.match(/^@([a-z_]+)$/);
  if (blockMatch) {
    const desc = BLOCK_TYPES[blockMatch[1]];
    if (desc) {
      return { contents: { kind: 'markdown', value: `**@${blockMatch[1]}**\n\n${desc}` } };
    }
  }

  // Hover over directives
  const directiveMatch = line.match(/^\s*(![a-zA-Z_][a-zA-Z0-9_-]*)/);
  if (directiveMatch) {
    const desc = DIRECTIVE_DESCRIPTIONS[directiveMatch[1]];
    if (desc) {
      return { contents: { kind: 'markdown', value: `**${directiveMatch[1]}**\n\n${desc}` } };
    }
  }

  return null;
}
