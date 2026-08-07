import type { AuditLogEntry } from "../types";

export interface AuditLoggerOptions {
  maxEntries?: number;
}

export class AuditLogger {
  private readonly entries: AuditLogEntry[] = [];
  private readonly maxEntries: number;

  constructor(options: AuditLoggerOptions = {}) {
    this.maxEntries = options.maxEntries ?? 10000;
  }

  log(entry: Omit<AuditLogEntry, "id" | "timestamp">): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    };

    this.entries.push(fullEntry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    return fullEntry;
  }

  getEntries(filter?: { actor?: string; action?: string; result?: AuditLogEntry["result"] }): AuditLogEntry[] {
    let results = [...this.entries];

    if (filter?.actor) {
      results = results.filter((e) => e.actor === filter.actor);
    }
    if (filter?.action) {
      results = results.filter((e) => e.action === filter.action);
    }
    if (filter?.result) {
      results = results.filter((e) => e.result === filter.result);
    }

    return results;
  }

  getRecent(limit = 100): AuditLogEntry[] {
    return this.entries.slice(-limit);
  }

  clear(): void {
    this.entries.length = 0;
  }

  get size(): number {
    return this.entries.length;
  }
}
