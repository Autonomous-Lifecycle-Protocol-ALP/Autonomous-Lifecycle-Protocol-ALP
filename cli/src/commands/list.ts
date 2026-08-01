import fs from 'fs';
import path from 'path';
import { AlpParser } from '@autonomous-lifecycle-protocol-alp/parser';

export interface ListOptions {
  type?: string;
}

export function listCommand(options?: ListOptions) {
  const cwd = process.cwd();
  const alpDir = path.join(cwd, '.alp');
  if (!fs.existsSync(alpDir)) {
    console.error('Error: .alp directory not found. Run `alp init` first.');
    process.exit(1);
  }

  const parser = new AlpParser();
  const files = fs.readdirSync(alpDir).filter((f) => f.endsWith('.alp'));
  const entries: { id: string; type: string; file: string }[] = [];

  for (const file of files) {
    const fullPath = path.join(alpDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const objects = parser.parse(content);
    for (const obj of objects) {
      if (options?.type && obj._type !== options.type) continue;
      entries.push({ id: obj.id || '(no id)', type: obj._type || 'unknown', file });
    }
  }

  if (entries.length === 0) {
    console.log('No objects found.');
    return;
  }

  console.log(`\n📋 Workspace Objects (${entries.length})\n`);
  for (const entry of entries) {
    console.log(`  ${entry.type}:${entry.id}  [${entry.file}]`);
  }
  console.log('');
}
