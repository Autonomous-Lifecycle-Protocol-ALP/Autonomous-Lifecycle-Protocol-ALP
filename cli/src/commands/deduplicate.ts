import fs from 'fs';
import path from 'path';
import { AlpParser } from '@autonomous-lifecycle-protocol-alp/parser';

export interface DeduplicateOptions {
  dryRun?: boolean;
}

export function deduplicateCommand(options?: DeduplicateOptions) {
  const cwd = process.cwd();
  const alpDir = path.join(cwd, '.alp');
  if (!fs.existsSync(alpDir)) {
    console.error('Error: .alp directory not found. Run `alp init` first.');
    process.exit(1);
  }

  const parser = new AlpParser();
  const files = fs.readdirSync(alpDir).filter((f) => f.endsWith('.alp'));
  const seen = new Map<string, { file: string; content: string }>();
  let totalRemoved = 0;
  const removedIds: string[] = [];

  for (const file of files) {
    const fullPath = path.join(alpDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const objects = parser.parse(content);
    const keep: any[] = [];
    const lines = content.split('\n');
    const blocks: { start: number; end: number; id: string }[] = [];

    let currentStart = -1;
    let currentId: string | null = null;
    for (let i = 0; i < lines.length; i++) {
      const stripped = lines[i].trim();
      const typeMatch = stripped.match(/^@(\w+)/);
      if (typeMatch) {
        if (currentId && currentStart >= 0) {
          blocks.push({ start: currentStart, end: i, id: currentId });
        }
        currentStart = i;
        currentId = null;
        continue;
      }
      const idMatch = stripped.match(/^id:\s*(\S+)/);
      if (idMatch) {
        currentId = idMatch[1];
      }
    }
    if (currentId && currentStart >= 0) {
      blocks.push({ start: currentStart, end: lines.length, id: currentId });
    }

    const keptBlocks: { start: number; end: number; id: string }[] = [];
    for (const block of blocks) {
      if (seen.has(block.id)) {
        totalRemoved += 1;
        removedIds.push(block.id);
      } else {
        seen.set(block.id, { file: fullPath, content });
        keptBlocks.push(block);
      }
    }

    if (keptBlocks.length === 0 && blocks.length > 0) {
      fs.writeFileSync(fullPath, '', 'utf-8');
      continue;
    }

    const keptLines: string[] = [];
    for (const block of keptBlocks) {
      keptLines.push(...lines.slice(block.start, block.end));
    }
    const updated = keptLines.filter((l) => l.trim()).join('\n');
    fs.writeFileSync(fullPath, updated + '\n', 'utf-8');
  }

  if (totalRemoved === 0) {
    console.log('No duplicate objects found.');
  } else {
    console.log(`\n🧹 Deduplicated ${totalRemoved} object(s)\n`);
    for (const id of removedIds) {
      console.log(`  Removed duplicate: ${id}`);
    }
    console.log('');
  }
}
