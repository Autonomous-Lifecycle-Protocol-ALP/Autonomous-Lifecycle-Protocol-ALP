import fs from 'fs';
import path from 'path';
import { findFileWithId } from '../utils';

export interface PromoteOptions {
  file?: string;
}

export function promoteCommand(objectId: string, newType: string, options?: PromoteOptions) {
  const cwd = process.cwd();
  const alpDir = options?.file ? path.dirname(options.file) : path.join(cwd, '.alp');

  if (!fs.existsSync(alpDir)) {
    console.error('Error: .alp directory not found. Run `alp init` first.');
    process.exit(1);
  }

  const targetFile = options?.file || findFileWithId(alpDir, objectId);

  if (!targetFile) {
    console.error(`Error: Object '${objectId}' not found.`);
    process.exit(1);
  }

  const content = fs.readFileSync(targetFile, 'utf8');
  const lines = content.split('\n');
  let objectStart = -1;
  let objectEnd = lines.length;
  let currentId: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const stripped = lines[i].trim();
    const typeMatch = stripped.match(/^@(\w+)/);
    if (typeMatch) {
      if (currentId === objectId) {
        objectEnd = i;
        break;
      }
      currentId = null;
      objectStart = i;
    }
    const idMatch = stripped.match(/^id:\s*(\S+)/);
    if (idMatch) {
      currentId = idMatch[1];
    }
  }

  if (currentId !== objectId) {
    console.error(`Error: Object '${objectId}' not found in ${targetFile}.`);
    process.exit(1);
  }

  const oldType = lines[objectStart].trim().replace(/^@/, '');
  lines[objectStart] = `@${newType}`;
  const updated = lines.join('\n');
  fs.writeFileSync(targetFile, updated, 'utf-8');
  console.log(`✅ Promoted '${objectId}' from @${oldType} to @${newType} in ${targetFile}`);
}
