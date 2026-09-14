import * as fs from 'fs';
import * as path from 'path';
import { AlpParser, AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';
import { PhpGenerator, CppGenerator } from '@autonomous-lifecycle-protocol-alp/parser';

export interface CodegenOptions {
  target: 'php' | 'cpp';
  namespace?: string;
  out?: string;
  write?: boolean;
}

function loadAllObjects(): AlpObject[] {
  const alpDir = path.resolve(process.cwd(), '.alp');
  if (!fs.existsSync(alpDir)) {
    console.error('Error: .alp directory not found. Run `alp init` first.');
    process.exit(1);
  }

  const parser = new AlpParser();
  const objects: AlpObject[] = [];

  const readDir = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        readDir(fullPath);
      } else if (entry.name.endsWith('.alp')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          objects.push(...parser.parse(content));
        } catch (e: any) {
          console.error(`Error parsing ${fullPath}: ${e.message}`);
          process.exit(1);
        }
      }
    }
  };

  readDir(alpDir);
  return objects;
}

export function codegenCommand(options: CodegenOptions) {
  const target = options.target;
  if (target !== 'php' && target !== 'cpp') {
    console.error('Error: --target must be "php" or "cpp".');
    process.exit(1);
  }

  const objects = loadAllObjects();
  if (objects.length === 0) {
    console.error('Error: No ALP objects found in workspace.');
    process.exit(1);
  }

  const outDir = options.out || path.join('alp-codegen', target);
  const namespace = options.namespace || (target === 'php' ? 'Alp\\Generated' : 'alp');

  const generator =
    target === 'php'
      ? new PhpGenerator({ target: 'php', namespace, outputDir: outDir })
      : new CppGenerator({ target: 'cpp', namespace, outputDir: outDir });

  const files = generator.generate(objects as unknown as Record<string, any>[]);

  if (options.write !== false) {
    for (const file of files) {
      const fullPath = path.resolve(file.path);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, file.content, 'utf-8');
    }
  }

  console.log(`[CODEGEN] Generated ${files.length} ${target.toUpperCase()} file(s) in ${outDir}/`);
  for (const file of files) {
    console.log(`  + ${file.path}`);
  }
}
