import fs from 'fs';
import path from 'path';
import { AlpParser } from '@autonomous-lifecycle-protocol-alp/parser';
import { escapeRegex } from '../utils';

export function renameCommand(oldId: string, newId: string) {
  const targetDir = path.join(process.cwd(), '.alp');
  if (!fs.existsSync(targetDir)) {
    console.error('Error: .alp directory not found. Run `alp init` first.');
    process.exit(1);
  }

  const parser = new AlpParser();
  const files = fs.readdirSync(targetDir).filter((f) => f.endsWith('.alp'));
  let totalRenames = 0;

  for (const file of files) {
    const fullPath = path.join(targetDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const updated = renameInContent(content, oldId, newId);

    if (updated !== content) {
      fs.writeFileSync(fullPath, updated, 'utf-8');
      const count = (updated.match(new RegExp(`id:\\s*${escapeRegex(newId)}`, 'g')) || []).length;
      totalRenames += count;
      console.log(`  Updated ${file} (${count} occurrence${count === 1 ? '' : 's'})`);
    }
  }

  if (totalRenames === 0) {
    console.log(`No occurrences of id '${oldId}' found.`);
  } else {
    console.log(`\nRenamed ${totalRenames} occurrence${totalRenames === 1 ? '' : 's'} of '${oldId}' to '${newId}'.`);
  }
}

function renameInContent(content: string, oldId: string, newId: string): string {
  const idPattern = new RegExp(`(id:\\s*)${escapeRegex(oldId)}(?=\\s|$)`, 'g');
  return content.replace(idPattern, `$1${newId}`);
}
