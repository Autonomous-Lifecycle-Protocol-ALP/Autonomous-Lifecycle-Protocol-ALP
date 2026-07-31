import fs from 'fs';
import path from 'path';

export function moveCommand(objectId: string, targetFile: string) {
  const targetDir = path.join(process.cwd(), '.alp');
  if (!fs.existsSync(targetDir)) {
    console.error('Error: .alp directory not found. Run `alp init` first.');
    process.exit(1);
  }

  const files = fs.readdirSync(targetDir).filter((f) => f.endsWith('.alp'));
  let sourcePath: string | null = null;
  let objectBlock = '';

  for (const file of files) {
    const fullPath = path.join(targetDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const block = extractObjectBlock(content, objectId);
    if (block) {
      sourcePath = fullPath;
      objectBlock = block;
      break;
    }
  }

  if (!sourcePath) {
    console.error(`Error: Object '${objectId}' not found.`);
    process.exit(1);
  }

  const targetPath = path.join(targetDir, targetFile);
  if (!targetPath.endsWith('.alp')) {
    console.error('Error: Target file must have .alp extension.');
    process.exit(1);
  }

  if (!fs.existsSync(targetPath)) {
    fs.writeFileSync(targetPath, '', 'utf-8');
  }

  let targetContent = fs.readFileSync(targetPath, 'utf-8');
  if (targetContent && !targetContent.endsWith('\n')) {
    targetContent += '\n';
  }
  targetContent += objectBlock;
  fs.writeFileSync(targetPath, targetContent, 'utf-8');

  let sourceContent = fs.readFileSync(sourcePath, 'utf-8');
  sourceContent = sourceContent.replace(objectBlock, '').replace(/^\s+$/gm, '').trim();
  fs.writeFileSync(sourcePath, sourceContent + '\n', 'utf-8');

  console.log(`Moved '${objectId}' to ${targetFile}.`);
}

function extractObjectBlock(content: string, objectId: string): string {
  const lines = content.split('\n');
  let start = -1;
  let depth = 0;
  let found = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(@\w+)/);
    if (match) {
      const idMatch = lines.slice(i, i + 5).join('\n').match(/id:\s*(\S+)/);
      if (idMatch && idMatch[1] === objectId) {
        start = i;
        found = true;
        break;
      }
    }
  }

  if (!found || start === -1) return '';

  const block: string[] = [];
  for (let i = start; i < lines.length; i++) {
    block.push(lines[i]);
    if (i > start && lines[i].match(/^@\w+/)) break;
  }

  return block.join('\n');
}
