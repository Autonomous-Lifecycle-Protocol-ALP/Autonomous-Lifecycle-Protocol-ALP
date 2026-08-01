import fs from 'fs';
import path from 'path';
import { AlpParser } from '@autonomous-lifecycle-protocol-alp/parser';

export interface SplitOptions {
  type?: string;
}

export function splitCommand(sourceFile: string, options?: SplitOptions) {
  const cwd = process.cwd();
  const sourcePath = path.join(cwd, '.alp', sourceFile);

  if (!fs.existsSync(sourcePath)) {
    console.error(`Error: Source file '${sourcePath}' not found.`);
    process.exit(1);
  }

  const parser = new AlpParser();
  const content = fs.readFileSync(sourcePath, 'utf8');
  const objects = parser.parse(content);

  if (objects.length === 0) {
    console.log('No objects found in source file.');
    return;
  }

  const typeFilter = options?.type;
  const groups = new Map<string, any[]>();
  for (const obj of objects) {
    const type = obj._type || 'unknown';
    if (typeFilter && type !== typeFilter) continue;
    if (!groups.has(type)) groups.set(type, []);
    groups.get(type)!.push(obj);
  }

  const createdFiles: string[] = [];
  for (const [type, objs] of groups) {
    const targetFile = path.join(cwd, '.alp', `${type}s.alp`);
    const lines: string[] = [];
    for (const obj of objs) {
      lines.push(`@${type}`);
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
      lines.push('');
    }
    fs.writeFileSync(targetFile, lines.join('\n'), 'utf-8');
    createdFiles.push(`${type}s.alp (${objs.length} object${objs.length === 1 ? '' : 's'})`);
  }

  console.log(`\n✂️  Split ${sourceFile} into ${createdFiles.length} file(s)\n`);
  for (const file of createdFiles) {
    console.log(`  Created ${file}`);
  }
  console.log('');
}
