import fs from 'fs';
import path from 'path';
import { AlpParser } from '@autonomous-lifecycle-protocol-alp/parser';

export interface ArchiveOptions {
  status?: string;
}

export function archiveCommand(status: string, options?: ArchiveOptions) {
  const cwd = process.cwd();
  const alpDir = path.join(cwd, '.alp');
  if (!fs.existsSync(alpDir)) {
    console.error('Error: .alp directory not found. Run `alp init` first.');
    process.exit(1);
  }

  const parser = new AlpParser();
  const files = fs.readdirSync(alpDir).filter((f) => f.endsWith('.alp'));
  const archivePath = path.join(alpDir, 'archive.alp');
  const archivedIds: string[] = [];

  for (const file of files) {
    if (file === 'archive.alp') continue;
    const fullPath = path.join(alpDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const objects = parser.parse(content);
    const keep: any[] = [];
    const toArchive: any[] = [];

    for (const obj of objects) {
      if (obj.status === status) {
        toArchive.push(obj);
      } else {
        keep.push(obj);
      }
    }

    if (toArchive.length > 0) {
      const existing = fs.existsSync(archivePath) ? fs.readFileSync(archivePath, 'utf8') : '';
      const newBlocks = toArchive.map((o: any) => formatObject(o)).join('\n\n');
      fs.writeFileSync(archivePath, existing.trimEnd() + '\n\n' + newBlocks + '\n', 'utf-8');
      archivedIds.push(...toArchive.map((o: any) => o.id).filter(Boolean));

      const keptLines = keep.map((o: any) => formatObject(o)).join('\n\n');
      fs.writeFileSync(fullPath, keptLines + '\n', 'utf-8');
    }
  }

  if (archivedIds.length === 0) {
    console.log(`No objects with status '${status}' found.`);
  } else {
    console.log(`\n📦 Archived ${archivedIds.length} object(s) with status '${status}'\n`);
    for (const id of archivedIds) {
      console.log(`  ${id}`);
    }
    console.log('');
  }
}

function formatObject(obj: any): string {
  const lines: string[] = [`@${obj._type}`];
  for (const [key, value] of Object.entries(obj)) {
    if (key === '_type') continue;
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      const items = value.map((v) => (typeof v === 'string' ? `"${v}"` : v)).join(', ');
      lines.push(`  ${key}: [${items}]`);
    } else {
      lines.push(`  ${key}: ${value}`);
    }
  }
  return lines.join('\n');
}
