/**
 * Browser-compatible storage adapter for ALP engines.
 *
 * Falls back to in-memory storage when Node.js `fs` is unavailable.
 * Engines can use this API in place of direct `fs` calls to support
 * web/IDE contexts.
 */

const memoryStore = new Map<string, { value: string; expires?: number }>();

export function browserReadFile(path: string): string {
  const entry = memoryStore.get(path);
  if (!entry) {
    throw new Error(`ENOENT: no such file or directory, open '${path}'`);
  }
  if (entry.expires !== undefined && Date.now() > entry.expires) {
    memoryStore.delete(path);
    throw new Error(`ENOENT: expired entry '${path}'`);
  }
  return entry.value;
}

export function browserWriteFile(path: string, data: string, ttlMs?: number): void {
  const entry: { value: string; expires?: number } = { value: data };
  if (ttlMs !== undefined && ttlMs > 0) {
    entry.expires = Date.now() + ttlMs;
  }
  memoryStore.set(path, entry);
}

export function browserExists(path: string): boolean {
  const entry = memoryStore.get(path);
  if (!entry) {
    return false;
  }
  if (entry.expires !== undefined && Date.now() > entry.expires) {
    memoryStore.delete(path);
    return false;
  }
  return true;
}

export function browserDelete(path: string): void {
  memoryStore.delete(path);
}

export function browserList(prefix = ''): string[] {
  const out: string[] = [];
  for (const key of memoryStore.keys()) {
    if (!prefix || key.startsWith(prefix)) {
      out.push(key);
    }
  }
  return out;
}

export function browserClear(): void {
  memoryStore.clear();
}
