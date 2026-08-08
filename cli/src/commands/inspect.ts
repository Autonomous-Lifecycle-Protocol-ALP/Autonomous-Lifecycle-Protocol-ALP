import fs from 'fs';
import path from 'path';
import { AlpParser } from '@autonomous-lifecycle-protocol-alp/parser';
import { findFileWithId } from '../utils';

export interface InspectOptions {
  file?: string;
}

export function inspectCommand(objectId: string, options?: InspectOptions) {
  const cwd = process.cwd();
  const alpDir = options?.file ? path.dirname(options.file) : path.join(cwd, '.alp');
  const targetFile = options?.file || findFileWithId(alpDir, objectId);

  if (!targetFile) {
    console.error(`Error: Object '${objectId}' not found.`);
    process.exit(1);
  }

  const content = fs.readFileSync(targetFile, 'utf8');
  const parser = new AlpParser();
  const objects = parser.parse(content);
  const obj = objects.find((o: any) => o.id === objectId);

  if (!obj) {
    console.error(`Error: Object '${objectId}' not found in ${targetFile}.`);
    process.exit(1);
  }

  console.log(`\n📋 Inspecting '${objectId}'\n`);
  console.log(`  Type: ${obj._type}`);
  console.log(`  File: ${targetFile}`);
  console.log('');
  console.log('  Properties:');
  const skip = new Set(['_type', 'id']);
  for (const [key, value] of Object.entries(obj)) {
    if (skip.has(key)) continue;
    const display = Array.isArray(value) ? value.join(', ') : value;
    console.log(`    ${key}: ${display}`);
  }
  console.log('');
}
