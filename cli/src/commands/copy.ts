import fs from 'fs';
import path from 'path';
import { AlpParser, AlpError } from '@autonomous-lifecycle-protocol-alp/parser';

export function copyCommand(sourceId: string, targetId: string, updateRefs = false) {
  const targetDir = path.join(process.cwd(), '.alp');
  if (!fs.existsSync(targetDir)) {
    console.error('Error: .alp directory not found. Run `alp init` first.');
    process.exit(1);
  }

  const files = fs.readdirSync(targetDir).filter((f) => f.endsWith('.alp'));
  let totalCopies = 0;

  for (const file of files) {
    const fullPath = path.join(targetDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const updated = copyInContent(content, sourceId, targetId, updateRefs);

    if (updated !== content) {
      fs.writeFileSync(fullPath, updated, 'utf-8');
      const count = (updated.match(new RegExp(`^\\s*id:\\s*${escapeRegex(targetId)}\\s*$`, 'm')) || []).length;
      totalCopies += count;
      console.log(`  Updated ${file} (${count} occurrence${count === 1 ? '' : 's'})`);
    }
  }

  if (totalCopies === 0) {
    console.log(`No object with id '${sourceId}' found to copy.`);
  } else {
    console.log(`\nCopied ${totalCopies} occurrence${totalCopies === 1 ? '' : 's'} of '${sourceId}' to '${targetId}'.`);
  }
}

function copyInContent(content: string, sourceId: string, targetId: string, updateRefs: boolean): string {
  const idPattern = new RegExp(`(^\\s*id:\\s*)${escapeRegex(sourceId)}(\\s*$)`, 'gm');
  let updated = content.replace(idPattern, `$1${targetId}$2`);

  if (updateRefs) {
    const refFields = ['depends_on', 'references', 'links', 'parent', 'child'];
    for (const field of refFields) {
      const refPattern = new RegExp(`(^\\s*${field}:\\s*)${escapeRegex(sourceId)}(\\s*$)`, 'gm');
      updated = updated.replace(refPattern, `$1${targetId}$2`);
    }
  }

  return updated;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
