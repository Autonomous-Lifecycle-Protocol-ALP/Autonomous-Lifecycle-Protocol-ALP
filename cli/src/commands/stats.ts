import fs from 'fs';
import path from 'path';
import { AlpParser } from '@autonomous-lifecycle-protocol-alp/parser';

export function statsCommand() {
  const targetDir = path.join(process.cwd(), '.alp');
  if (!fs.existsSync(targetDir)) {
    console.error('Error: .alp directory not found. Run `alp init` first.');
    process.exit(1);
  }

  const parser = new AlpParser();
  const files = fs.readdirSync(targetDir).filter((f) => f.endsWith('.alp'));

  let totalObjects = 0;
  const typeCounts: Record<string, number> = {};
  const fileStats: Array<{ file: string; count: number }> = [];

  for (const file of files) {
    const fullPath = path.join(targetDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const objects = parser.parseAndValidate(content);
    const count = objects.length;
    totalObjects += count;
    fileStats.push({ file, count });

    for (const obj of objects) {
      const type = obj._type || obj.type || 'unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }
  }

  console.log(`\nWorkspace Statistics`);
  console.log(`  Files:       ${files.length}`);
  console.log(`  Objects:     ${totalObjects}`);

  if (Object.keys(typeCounts).length > 0) {
    console.log(`\n  By type:`);
    for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${type}: ${count}`);
    }
  }

  console.log(`\n  By file:`);
  for (const stat of fileStats.sort((a, b) => b.count - a.count)) {
    console.log(`    ${stat.file}: ${stat.count}`);
  }
}
