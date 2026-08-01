import fs from 'fs';
import path from 'path';

export interface DeleteOptions {
  file?: string;
}

export function deleteCommand(objectId: string, options?: DeleteOptions) {
  const cwd = process.cwd();
  const alpDir = options?.file ? path.dirname(options.file) : path.join(cwd, '.alp');
  const targetFile = options?.file || findFileWithId(alpDir, objectId);

  if (!targetFile) {
    console.error(`Error: Object '${objectId}' not found.`);
    process.exit(1);
  }

  const content = fs.readFileSync(targetFile, 'utf8');
  const lines = content.split('\n');
  let blockStart = -1;
  let blockEnd = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const idMatch = lines[i].match(/^\s*id:\s*(.+)$/);
    if (idMatch && idMatch[1].trim() === objectId) {
      blockStart = i - 1;
      while (blockStart >= 0 && !lines[blockStart].match(/^(@\w+)/)) blockStart -= 1;
      blockStart = Math.max(0, blockStart);
      blockEnd = i + 1;
      while (blockEnd < lines.length && !lines[blockEnd].match(/^(@\w+)/)) blockEnd += 1;
      break;
    }
  }

  if (blockStart === -1) {
    console.error(`Error: Object '${objectId}' not found in ${targetFile}.`);
    process.exit(1);
  }

  const updated = lines.slice(0, blockStart).concat(lines.slice(blockEnd)).filter((l) => l.trim()).join('\n');
  fs.writeFileSync(targetFile, updated, 'utf-8');
  console.log(`✅ Deleted '${objectId}' from ${targetFile}`);
}

function findFileWithId(alpDir: string, objectId: string): string | null {
  if (!fs.existsSync(alpDir)) return null;
  const files = fs.readdirSync(alpDir).filter((f) => f.endsWith('.alp'));
  for (const file of files) {
    const fullPath = path.join(alpDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes(`id: ${objectId}`)) {
      return fullPath;
    }
  }
  return null;
}
