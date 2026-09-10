/**
 * Convert a glob (`*`, `**`, `?`) into an anchored RegExp.
 *  - `**` matches across path separators
 *  - `*`  matches within a single path segment
 *  - `?`  matches a single non-separator character
 */
export function globToRegExp(glob: string): RegExp {
  const normalized = normalizePath(glob);
  let re = '';
  for (let i = 0; i < normalized.length; i++) {
    const c = normalized[i];
    if (c === '*') {
      if (normalized[i + 1] === '*') {
        re += '.*';
        i++;
        if (normalized[i + 1] === '/') i++; // consume trailing slash of **/
      } else {
        re += '[^/]*';
      }
    } else if (c === '?') {
      re += '[^/]';
    } else if ('.+^${}()|[]\\'.includes(c)) {
      re += '\\' + c;
    } else {
      re += c;
    }
  }
  return new RegExp('^' + re + '$');
}

export function normalizeRef(ref: string): string {
  return ref.replace(/^->\s*/, '').trim();
}

export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\.\//, '');
}

export function applyPair(pair: string, out: Record<string, any>): void {
  const idx = pair.indexOf(':');
  if (idx === -1) return;
  const key = pair.slice(0, idx).trim();
  let value = pair.slice(idx + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  out[key] = value;
}

/**
 * Normalize a list of nested objects that the line-based reader may have
 * kept as raw inline-object strings (e.g. `proposals`, `allow_during`,
 * `require_approval` list items). Returns plain objects either way.
 */
export function normalizeObjects(list: any[] | undefined): Record<string, any>[] {
  if (!Array.isArray(list)) return [];
  return list.map((item) =>
    typeof item === 'string' ? parseProposalLiteral(item) : item
  );
}

/**
 * Parse a single inline object literal `{ id: "prop-1", ... }` into a
 * plain object. The line-based reader stores `proposals`, `allow_during`,
 * and `require_approval` list items as raw strings; this normalizes them
 * to objects for verification. Bracket-aware: commas inside `[...]` array
 * values (e.g. `days: ["mon","tue"]`) are not treated as pair separators.
 */
export function parseProposalLiteral(literal: string): Record<string, any> {
  const inner = literal.trim().replace(/^\{/, '').replace(/\}$/, '');
  const out: Record<string, any> = {};
  if (!inner.trim()) return out;
  let depth = 0;
  let buf = '';
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (c === '[') depth++;
    else if (c === ']') depth = Math.max(0, depth - 1);
    if (c === ',' && depth === 0) {
      applyPair(buf, out);
      buf = '';
    } else {
      buf += c;
    }
  }
  if (buf.trim()) applyPair(buf, out);
  return out;
}
