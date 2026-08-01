import fs from 'fs';
import path from 'path';
import { AlpParser } from '@autonomous-lifecycle-protocol-alp/parser';

export interface MergeOptions {
  overwrite?: boolean;
}

export function mergeCommand(sourceFile: string, targetFile: string, options?: MergeOptions) {
  const cwd = process.cwd();
  const sourcePath = path.join(cwd, '.alp', sourceFile);
  const targetPath = path.join(cwd, '.alp', targetFile);

  if (!fs.existsSync(sourcePath)) {
    console.error(`Error: Source file '${sourcePath}' not found.`);
    process.exit(1);
  }
  if (!fs.existsSync(targetPath)) {
    console.error(`Error: Target file '${targetPath}' not found.`);
    process.exit(1);
  }

  const parser = new AlpParser();
  const sourceContent = fs.readFileSync(sourcePath, 'utf8');
  const targetContent = fs.readFileSync(targetPath, 'utf8');
  const sourceObjects = parser.parse(sourceContent);
  const targetObjects = parser.parse(targetContent);
  const targetIds = new Set(targetObjects.map((o: any) => o.id).filter(Boolean));

  const newObjects = sourceObjects.filter((o: any) => !targetIds.has(o.id));
  if (newObjects.length === 0) {
    console.log('No new objects to merge (all source objects already exist in target).');
    return;
  }

  const objectBlocks = newObjects.map((o: any) => formatObject(o)).join('\n\n');
  const updatedTarget = targetContent.trimEnd() + '\n\n' + objectBlocks + '\n';
  fs.writeFileSync(targetPath, updatedTarget, 'utf-8');
  console.log(`✅ Merged ${newObjects.length} object(s) from ${sourcePath} into ${targetPath}`);
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
