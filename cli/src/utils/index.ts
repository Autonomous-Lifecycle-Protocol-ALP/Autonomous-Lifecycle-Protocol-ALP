import * as fs from 'fs';
import * as path from 'path';
import { AlpParser, AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';

/**
 * Recursively load all `.alp` files from a directory, skipping `.runtime`
 * and `.cache` directories. Unparseable files are silently skipped.
 */
export function loadAlpDir(dir: string, parser: AlpParser, out: AlpObject[]): void {
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '.runtime' || entry.name === '.cache') continue;
        loadAlpDir(full, parser, out);
      } else if (entry.name.endsWith('.alp')) {
        try {
          out.push(...parser.parse(fs.readFileSync(full, 'utf-8')));
        } catch {
          /* skip unparseable files */
        }
      }
    }
  } catch {
    /* skip unreadable directories */
  }
}

/**
 * Resolve a signing key from a `--sign-key <file>` option or the
 * `ALP_REGISTRY_SIGN_KEY` environment variable. Both are treated as a file
 * path; an inline PEM (containing a `-----BEGIN` header) is accepted verbatim.
 */
export function resolveSignerKey(signKey?: string): string | undefined {
  const raw = signKey || process.env.ALP_REGISTRY_SIGN_KEY;
  if (!raw) return undefined;
  if (raw.includes('-----BEGIN')) return raw;
  if (fs.existsSync(raw)) return fs.readFileSync(path.resolve(raw), 'utf-8');
  throw new Error(`Signing key not found: ${raw} (pass --sign-key <file> or set ALP_REGISTRY_SIGN_KEY to a PEM or existing file)`);
}

/**
 * Escape a string for use in a RegExp literal.
 */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract dependency IDs from an ALP object's common dependency fields.
 */
export function extractDeps(obj: AlpObject): string[] {
  const deps: string[] = [];
  for (const key of ['depends_on', 'blocked_by', 'requires']) {
    const val = (obj as any)[key];
    if (!val) continue;
    const arr = Array.isArray(val) ? val : [val];
    for (const v of arr) {
      const cleaned = String(v).replace(/^->\s*/, '').trim();
      if (cleaned) deps.push(cleaned);
    }
  }
  return deps;
}

/**
 * Find the first `.alp` file in `alpDir` that contains an object with the
 * given `objectId`. Returns `null` if not found.
 */
export function findFileWithId(alpDir: string, objectId: string): string | null {
  if (!fs.existsSync(alpDir)) return null;
  const files = fs.readdirSync(alpDir).filter((f) => f.endsWith('.alp'));
  for (const file of files) {
    const fullPath = path.join(alpDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes(`id: ${objectId}`)) {
      return fullPath;
    }
  }
  return null;
}
