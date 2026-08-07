import * as fs from 'fs';
import * as path from 'path';

export interface FormatOptions {
  indentSize?: number;
  preserveComments?: boolean;
}

export class AlpFormatter {
  private indentSize: number;

  constructor(options: FormatOptions = {}) {
    this.indentSize = options.indentSize ?? 2;
  }

  public formatFile(filePath: string): string {
    const content = fs.readFileSync(filePath, 'utf8');
    return this.format(content);
  }

  public format(content: string): string {
    const lines = content.split('\n');
    const formatted: string[] = [];
    let inDirective = false;
    let objectIndent = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed === '') {
        formatted.push('');
        continue;
      }

      if (trimmed.startsWith('!')) {
        formatted.push(trimmed);
        inDirective = true;
        continue;
      }

      if (inDirective) {
        formatted.push(trimmed);
        inDirective = false;
        continue;
      }

      if (trimmed.startsWith('@')) {
        formatted.push(trimmed);
        objectIndent = 1;
        continue;
      }

      if (trimmed.startsWith('[') || trimmed.startsWith('<-')) {
        formatted.push(this.indent(objectIndent + 1) + trimmed);
        continue;
      }

      if (trimmed.includes(':')) {
        const [key, ...rest] = trimmed.split(':');
        const value = rest.join(':').trim();
        if (value === '') {
          formatted.push(this.indent(objectIndent + 1) + trimmed);
        } else if (value.startsWith('[') || value.startsWith('<-')) {
          formatted.push(this.indent(objectIndent + 1) + trimmed);
        } else if (value.startsWith('@')) {
          formatted.push(this.indent(objectIndent + 1) + trimmed);
        } else {
          formatted.push(this.indent(objectIndent + 1) + `${key}: ${value}`);
        }
        continue;
      }

      formatted.push(this.indent(objectIndent + 1) + trimmed);
    }

    return formatted.join('\n');
  }

  public formatWorkspace(alpDir: string): { file: string; formatted: boolean }[] {
    const results: { file: string; formatted: boolean }[] = [];
    if (!fs.existsSync(alpDir)) return results;

    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.name.endsWith('.alp')) {
          const original = fs.readFileSync(fullPath, 'utf8');
          const formatted = this.format(original);
          const changed = original !== formatted;
          if (changed) {
            fs.writeFileSync(fullPath, formatted, 'utf8');
          }
          results.push({ file: fullPath, formatted: changed });
        }
      }
    };

    walk(alpDir);
    return results;
  }

  private indent(level: number): string {
    return ' '.repeat(this.indentSize * level);
  }
}
