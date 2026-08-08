import * as fs from 'fs';
import * as path from 'path';

/**
 * ALP Memory Engine.
 *
 * Provides persistent, scoped key-value storage for agent knowledge.
 * Backed by a JSON file at `.alp/.memory.json`.
 *
 * Core principle: An agent should never have to figure out the same thing twice.
 */

export type MemoryType =
  | 'project'
  | 'architecture'
  | 'feature'
  | 'task'
  | 'decision'
  | 'error'
  | 'agent'
  | 'knowledge'
  | 'conversation'
  | 'context';

export type MemoryImportance = 'critical' | 'high' | 'medium' | 'low';

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  key: string;
  value: string;
  scope?: string;
  importance: MemoryImportance;
  source?: string;
  ttl?: number; // milliseconds
  created: string;
  updated: string;
}

export interface MemoryQuery {
  type?: MemoryType;
  scope?: string;
  key?: string;
  importance?: MemoryImportance;
}

export interface MemoryRelation {
  source_id: string;
  target_id: string;
  relation: string;
  weight: number;
}

export interface MemoryConsolidation {
  source_ids: string[];
  summary: string;
  importance: MemoryImportance;
  created: string;
}

export class MemoryGraph {
  private nodes: Map<string, MemoryEntry> = new Map();
  private relations: MemoryRelation[] = [];

  addNode(entry: MemoryEntry): void {
    this.nodes.set(entry.id, entry);
  }

  relate(source_id: string, target_id: string, relation: string, weight = 1.0): void {
    if (!this.nodes.has(source_id) || !this.nodes.has(target_id)) {
      throw new Error('Both source and target nodes must exist in the memory graph.');
    }
    this.relations.push({ source_id, target_id, relation, weight });
  }

  neighbors(id: string, relation?: string): MemoryEntry[] {
    const related = this.relations
      .filter((r) => r.source_id === id && (!relation || r.relation === relation))
      .sort((a, b) => b.weight - a.weight);
    return related.map((r) => this.nodes.get(r.target_id)).filter((e): e is MemoryEntry => !!e);
  }

  decay(now = Date.now()): void {
    for (const entry of this.nodes.values()) {
      if (entry.ttl) {
        const age = now - new Date(entry.created).getTime();
        const remaining = Math.max(0, 1 - age / entry.ttl);
        entry.updated = new Date(now).toISOString();
      }
    }
  }
}

export interface RAGResult {
  entry: MemoryEntry;
  score: number;
  citation: string;
}

export class MemoryConsolidator {
  consolidate(entries: MemoryEntry[]): MemoryConsolidation[] {
    const byScope = new Map<string, MemoryEntry[]>();
    for (const entry of entries) {
      const scope = entry.scope || 'global';
      byScope.set(scope, (byScope.get(scope) || []).concat(entry));
    }
    const results: MemoryConsolidation[] = [];
    for (const [scope, scoped] of byScope.entries()) {
      if (scoped.length < 2) continue;
      const summary = scoped.map((e) => `[${e.type}] ${e.key}: ${e.value}`).join('; ');
      results.push({
        source_ids: scoped.map((e) => e.id),
        summary,
        importance: 'high',
        created: new Date().toISOString(),
      });
    }
    return results;
  }
}

export class MemoryStore {
  private entries: Map<string, MemoryEntry> = new Map();
  private filePath: string;

  constructor(projectRoot: string) {
    this.filePath = path.join(projectRoot, '.alp', '.memory.json');
  }

  /**
   * Load memory from disk.
   */
  public load(): void {
    if (fs.existsSync(this.filePath)) {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const data: MemoryEntry[] = JSON.parse(raw);
      this.entries.clear();
      for (const entry of data) {
        this.entries.set(entry.id, entry);
      }
    }
  }

  /**
   * Persist memory to disk.
   */
  public persist(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = Array.from(this.entries.values());
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  /**
   * Store a new memory entry.
   */
  public store(entry: Omit<MemoryEntry, 'created' | 'updated'>): MemoryEntry {
    const now = new Date().toISOString();
    const full: MemoryEntry = {
      ...entry,
      importance: entry.importance || 'medium',
      created: now,
      updated: now,
    };
    this.entries.set(full.id, full);
    return full;
  }

  /**
   * Retrieve memories matching a query.
   */
  public retrieve(query: MemoryQuery): MemoryEntry[] {
    let results = Array.from(this.entries.values());

    if (query.type) {
      results = results.filter(e => e.type === query.type);
    }
    if (query.scope) {
      results = results.filter(e => e.scope === query.scope);
    }
    if (query.key) {
      results = results.filter(e => e.key.includes(query.key!));
    }
    if (query.importance) {
      results = results.filter(e => e.importance === query.importance);
    }

    return results;
  }

  /**
   * Update an existing memory entry's value.
   */
  public update(id: string, value: string): MemoryEntry | undefined {
    const entry = this.entries.get(id);
    if (entry) {
      entry.value = value;
      entry.updated = new Date().toISOString();
      return entry;
    }
    return undefined;
  }

  /**
   * Delete a memory entry.
   */
  public delete(id: string): boolean {
    return this.entries.delete(id);
  }

  /**
   * Get a summary of all memories for a given scope.
   */
  public summarize(scope?: string): {
    total: number;
    byType: Record<string, number>;
    byImportance: Record<string, number>;
  } {
    let entries = Array.from(this.entries.values());
    if (scope) {
      entries = entries.filter(e => e.scope === scope);
    }

    const byType: Record<string, number> = {};
    const byImportance: Record<string, number> = {};

    for (const entry of entries) {
      byType[entry.type] = (byType[entry.type] || 0) + 1;
      byImportance[entry.importance] = (byImportance[entry.importance] || 0) + 1;
    }

    return { total: entries.length, byType, byImportance };
  }

  /**
   * Remove entries that have exceeded their TTL.
   */
  public expire(): number {
    const now = Date.now();
    let removed = 0;

    for (const [id, entry] of this.entries.entries()) {
      if (entry.ttl) {
        const created = new Date(entry.created).getTime();
        if (now - created > entry.ttl) {
          this.entries.delete(id);
          removed++;
        }
      }
    }

    return removed;
  }

  /**
   * Retrieve entries most relevant to a query string.
   */
  public retrieveRAG(query: string, limit = 5): RAGResult[] {
    const q = query.toLowerCase();
    const scored = Array.from(this.entries.values()).map((entry) => {
      const haystack = `${entry.key} ${entry.value} ${entry.type}`.toLowerCase();
      const score = this.similarity(q, haystack);
      const citation = `${entry.scope || 'global'}/${entry.type}/${entry.key}`;
      return { entry, score, citation };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).filter((r) => r.score > 0);
  }

  private similarity(query: string, text: string): number {
    const terms = query.split(/\s+/).filter(Boolean);
    let matches = 0;
    for (const term of terms) {
      if (text.includes(term)) matches++;
    }
    return terms.length ? matches / terms.length : 0;
  }

  /**
   * Consolidate memories into summaries by scope.
   */
  public consolidate(): MemoryConsolidation[] {
    const consolidator = new MemoryConsolidator();
    return consolidator.consolidate(Array.from(this.entries.values()));
  }

  /**
   * Get all entries (for inspection/debugging).
   */
  public getAll(): MemoryEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Get entry count.
   */
  public get size(): number {
    return this.entries.size;
  }
}
