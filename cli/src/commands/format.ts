import * as fs from 'fs';
import * as path from 'path';
import { AlpFormatter } from '@autonomous-lifecycle-protocol-alp/parser';

export interface FormatOptions {
  file?: string;
  check?: boolean;
}

export function formatCommand(options?: FormatOptions) {
  const cwd = process.cwd();
  const alpDir = path.resolve(cwd, '.alp');

  if (!fs.existsSync(alpDir) && !options?.file) {
    console.error('Error: .alp directory not found. Run `alp init` first.');
    process.exit(1);
  }

  const formatter = new AlpFormatter({ indentSize: 2 });
  const filesToFormat = options?.file
    ? [path.resolve(cwd, options.file)]
    : findAlpFiles(alpDir);

  let changed = 0;
  let checked = 0;

  console.log('📝 Formatting ALP files...\n');

  for (const file of filesToFormat) {
    const original = fs.readFileSync(file, 'utf8');
    const formatted = formatter.format(original);
    const relative = path.relative(cwd, file);

    if (options?.check) {
      checked++;
      if (original !== formatted) {
        console.log(`❌ ${relative} needs formatting`);
      }
    } else {
      if (original !== formatted) {
        fs.writeFileSync(file, formatted, 'utf8');
        changed++;
        console.log(`✅ Formatted ${relative}`);
      }
    }
  }

  if (options?.check) {
    console.log(`\n${checked} files checked, ${checked - changed} would be reformatted.`);
    if (changed > 0) {
      process.exit(1);
    }
  } else {
    console.log(`\nFormatted ${changed} file(s).`);
  }
}

function findAlpFiles(dir: string): string[] {
  const files: string[] = [];
  const walk = (current: string) => {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.alp')) {
        files.push(fullPath);
      }
    }
  };
  walk(dir);
  return files;
}
