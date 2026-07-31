import fs from 'fs';
import path from 'path';

const REF_FIELDS = new Set(['depends_on', 'references', 'links', 'parent', 'child', 'extends', 'implements', 'uses']);

export function dependsCommand(objectId: string) {
  const targetDir = path.join(process.cwd(), '.alp');
  if (!fs.existsSync(targetDir)) {
    console.error('Error: .alp directory not found. Run `alp init` first.');
    process.exit(1);
  }

  const files = fs.readdirSync(targetDir).filter((f) => f.endsWith('.alp'));
  let objectFound = false;
  const dependsOn: string[] = [];
  const dependedBy: string[] = [];

  for (const file of files) {
    const fullPath = path.join(targetDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');

    let currentId: string | null = null;
    for (const line of lines) {
      const idMatch = line.match(/^\s*id:\s*(\S+)/);
      if (idMatch) {
        currentId = idMatch[1];
        if (currentId === objectId) {
          objectFound = true;
        }
      }

      if (currentId && currentId !== objectId) {
        const refMatch = line.match(/^\s*(\w+):\s*(\S+)/);
        if (refMatch && refMatch[2] === objectId) {
          dependedBy.push(currentId);
        }
      }

      if (currentId === objectId) {
        const refMatch = line.match(/^\s*(\w+):\s*(\S+)/);
        if (refMatch && REF_FIELDS.has(refMatch[1])) {
          dependsOn.push(`${refMatch[1]}: ${refMatch[2]}`);
        }
      }
    }
  }

  if (!objectFound) {
    console.error(`Error: Object '${objectId}' not found.`);
    process.exit(1);
  }

  console.log(`\nDependencies for '${objectId}':`);

  if (dependsOn.length > 0) {
    console.log(`  Depends on:`);
    for (const dep of dependsOn) {
      console.log(`    ${dep}`);
    }
  } else {
    console.log(`  Depends on: (none)`);
  }

  if (dependedBy.length > 0) {
    console.log(`\n  Depended by:`);
    for (const dep of dependedBy) {
      console.log(`    ${dep}`);
    }
  } else {
    console.log(`  Depended by: (none)`);
  }
}
