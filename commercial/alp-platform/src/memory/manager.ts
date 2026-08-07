export interface MemoryEntry {
  id: string;
  type: string;
  key: string;
  value: string;
  importance: "low" | "medium" | "high" | "critical";
  scope?: string;
  source?: string;
  ttl?: number;
  createdAt: string;
  updatedAt: string;
  tokensEstimate?: number;
}

export interface MemoryQuery {
  type?: string;
  scope?: string;
  key?: string;
  importance?: MemoryEntry["importance"];
  limit?: number;
}

export interface MemoryContextWindow {
  maxTokens: number;
  reservedSystemTokens: number;
  reservedResponseTokens: number;
}

export class MemoryManager {
  private readonly entries = new Map<string, MemoryEntry>();
  private readonly contextWindow: MemoryContextWindow;

  constructor(contextWindow: MemoryContextWindow = { maxTokens: 1000000, reservedSystemTokens: 20000, reservedResponseTokens: 40000 }) {
    this.contextWindow = contextWindow;
  }

  store(entry: Omit<MemoryEntry, "createdAt" | "updatedAt"> & { id?: string }): MemoryEntry {
    const now = new Date().toISOString();
    const fullEntry: MemoryEntry = {
      ...entry,
      id: entry.id ?? `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now,
      tokensEstimate: entry.tokensEstimate ?? this.estimateTokens(entry.value),
    };

    this.entries.set(fullEntry.id, fullEntry);
    return fullEntry;
  }

  retrieve(query: MemoryQuery = {}): MemoryEntry[] {
    let results = Array.from(this.entries.values());

    if (query.type) {
      results = results.filter((e) => e.type === query.type);
    }
    if (query.scope) {
      results = results.filter((e) => e.scope === query.scope);
    }
    if (query.key) {
      results = results.filter((e) => e.key === query.key);
    }
    if (query.importance) {
      results = results.filter((e) => e.importance === query.importance);
    }

    results.sort((a, b) => {
      const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (importanceOrder[a.importance] ?? 2) - (importanceOrder[b.importance] ?? 2);
    });

    const limit = query.limit ?? results.length;
    return results.slice(0, limit);
  }

  getContextWindow(): MemoryContextWindow {
    return { ...this.contextWindow };
  }

  getAvailableTokens(usedTokens = 0): number {
    const usable = this.contextWindow.maxTokens - this.contextWindow.reservedSystemTokens - this.contextWindow.reservedResponseTokens;
    return Math.max(0, usable - usedTokens);
  }

  summarizeForContext(usedTokens = 0): { entries: MemoryEntry[]; totalTokens: number; truncated: boolean } {
    const available = this.getAvailableTokens(usedTokens);
    const prioritized = this.retrieve({ limit: this.entries.size });
    const selected: MemoryEntry[] = [];
    let total = 0;
    let truncated = false;

    for (const entry of prioritized) {
      const tokens = entry.tokensEstimate ?? this.estimateTokens(entry.value);
      if (total + tokens > available && selected.length > 0) {
        truncated = true;
        break;
      }
      selected.push(entry);
      total += tokens;
    }

    return { entries: selected, totalTokens: total, truncated };
  }

  delete(entryId: string): boolean {
    return this.entries.delete(entryId);
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }

  private estimateTokens(text: string): number {
    if (!text) {
      return 0;
    }
    return Math.max(1, Math.ceil(text.length / 4));
  }
}
