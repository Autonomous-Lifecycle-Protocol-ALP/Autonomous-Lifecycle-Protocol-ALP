import { AlpParser, AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';
import * as fs from 'fs';
import * as path from 'path';

/** Convert an arbitrary title into a kebab-case ALP object id. */
export function toKebab(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

// ─── Workspace Loader ─────────────────────────────────────────────────────
const workspaceCache = new Map<string, { mtime: number; objects: AlpObject[] }>();

export function getAlpDirMtime(dir: string): number {
  try {
    return fs.statSync(dir).mtimeMs;
  } catch {
    return 0;
  }
}

export function loadWorkspace(rootDir: string): AlpObject[] {
  const alpDir = path.join(rootDir, '.alp');
  if (!fs.existsSync(alpDir)) {
    return [];
  }
  const mtime = getAlpDirMtime(alpDir);
  const cached = workspaceCache.get(rootDir);
  if (cached && cached.mtime === mtime) {
    return cached.objects;
  }
  const parser = new AlpParser();
  const objects: AlpObject[] = [];
  loadDirectory(alpDir, parser, objects);
  workspaceCache.set(rootDir, { mtime, objects });
  return objects;
}

export function loadDirectory(dir: string, parser: AlpParser, results: AlpObject[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadDirectory(fullPath, parser, results);
    } else if (entry.name.endsWith('.alp')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        results.push(...parser.parse(content));
      } catch {
        // Skip unparseable files
      }
    }
  }
}

export function findAlpFiles(dir: string): string[] {
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

/** Validate all .alp files in a directory, collecting errors. */
export function validateDirectory(dir: string, errors: string[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const parser = new AlpParser();
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      validateDirectory(fullPath, errors);
    } else if (entry.name.endsWith('.alp')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        parser.parseAndValidate(content);
      } catch (err: any) {
        errors.push(`❌ ${fullPath}: ${err.message}`);
      }
    }
  }
}
