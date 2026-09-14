import * as fs from 'fs';
import * as path from 'path';
import { AlpParser } from '@autonomous-lifecycle-protocol-alp/parser';
import { workspaceIndex, workspaceRoot, SymbolEntry } from './index';

export function indexWorkspace(): void {
  workspaceIndex.clear();
  const alpDir = path.join(workspaceRoot, '.alp');
  if (!fs.existsSync(alpDir)) return;

  indexDirectory(alpDir);
}

export function indexDirectory(dir: string): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      indexDirectory(fullPath);
    } else if (entry.name.endsWith('.alp')) {
      indexFile(fullPath);
    }
  }
}

export function indexFile(filePath: string): void {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const uri = 'file:///' + encodeURI(filePath.replace(/\\/g, '/'));
    const parser = new AlpParser();
    const objects = parser.parse(content);
    const lines = content.split('\n');

    for (const obj of objects) {
      if (obj.id) {
        let objLine = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim() === `@${obj._type}`) {
            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
              if (lines[j].trim().startsWith('id:') && lines[j].includes(obj.id)) {
                objLine = i;
                break;
              }
            }
            if (objLine > 0) break;
          }
        }

        workspaceIndex.set(obj.id, {
          id: obj.id,
          type: obj._type,
          uri,
          line: objLine,
          properties: obj,
        });
      }
    }
  } catch (err) {
    console.error(`Failed to index ${filePath}: ${(err as Error).message}`);
  }
}
