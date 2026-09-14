import { v4 as uuidv4 } from "uuid";
import type { MemoryEntry, MemoryQuery, MemoryStore } from "../store";

export class InMemoryStore implements MemoryStore {
  private readonly entries: Map<string, MemoryEntry> = new Map();
  private readonly indexes: Map<string, Set<string>> = new Map();

  async put(entry: Omit<MemoryEntry, "id" | "createdAt" | "updatedAt">): Promise<MemoryEntry> {
    const now = new Date().toISOString();
    const existingId = (entry as Record<string, unknown>).id as string | undefined;
    const existing = existingId ? this.entries.get(existingId) : undefined;
    const memory: MemoryEntry = {
      ...entry,
      id: existing?.id ?? uuidv4(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.entries.set(memory.id, memory);
    this.index(memory);
    return memory;
  }

  async get(id: string): Promise<MemoryEntry | undefined> {
    return this.entries.get(id);
  }

  async query(query: MemoryQuery): Promise<MemoryEntry[]> {
    let results = Array.from(this.entries.values());
    if (query.type) results = results.filter((e) => e.type === query.type);
    if (query.scope) results = results.filter((e) => e.scope === query.scope);
    if (query.key) results = results.filter((e) => e.key === query.key);
    if (query.importance) results = results.filter((e) => e.importance === query.importance);
    results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return results.slice(0, query.limit ?? 50);
  }

  async delete(id: string): Promise<void> {
    const entry = this.entries.get(id);
    if (entry) {
      this.entries.delete(id);
      this.removeIndex(entry);
    }
  }

  private index(entry: MemoryEntry): void {
    const keys = [entry.type, entry.scope, entry.key, entry.importance].filter(Boolean) as string[];
    for (const key of keys) {
      if (!this.indexes.has(key)) this.indexes.set(key, new Set());
      this.indexes.get(key)!.add(entry.id);
    }
  }

  private removeIndex(entry: MemoryEntry): void {
    const keys = [entry.type, entry.scope, entry.key, entry.importance].filter(Boolean) as string[];
    for (const key of keys) {
      this.indexes.get(key)?.delete(entry.id);
    }
  }
}
