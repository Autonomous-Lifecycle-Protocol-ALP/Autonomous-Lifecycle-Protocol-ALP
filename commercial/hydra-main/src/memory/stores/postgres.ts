import { Pool } from "pg";
import type { MemoryEntry, MemoryQuery, MemoryStore } from "../store";

export class PostgresMemoryStore implements MemoryStore {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async put(entry: Omit<MemoryEntry, "id" | "createdAt" | "updatedAt">): Promise<MemoryEntry> {
    const now = new Date().toISOString();
    const existingId = (entry as Record<string, unknown>).id as string | undefined;
    const existing = existingId ? await this.get(existingId) : undefined;

    const memory: MemoryEntry = {
      ...entry,
      id: existing?.id ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await this.pool.query(
      `INSERT INTO memory_entries (id, type, key, value, importance, scope, source, ttl, created_at, updated_at, tokens_estimate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
         value = EXCLUDED.value,
         importance = EXCLUDED.importance,
         scope = EXCLUDED.scope,
         source = EXCLUDED.source,
         ttl = EXCLUDED.ttl,
         updated_at = EXCLUDED.updated_at,
         tokens_estimate = EXCLUDED.tokens_estimate`,
      [
        memory.id,
        memory.type,
        memory.key,
        memory.value,
        memory.importance,
        memory.scope ?? null,
        memory.source ?? null,
        memory.ttl ?? null,
        memory.createdAt,
        memory.updatedAt,
        memory.tokensEstimate ?? null,
      ]
    );

    return memory;
  }

  async get(id: string): Promise<MemoryEntry | undefined> {
    const result = await this.pool.query("SELECT * FROM memory_entries WHERE id = $1", [id]);
    if (result.rows.length === 0) return undefined;
    return this.rowToEntry(result.rows[0]);
  }

  async query(query: MemoryQuery): Promise<MemoryEntry[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (query.type) {
      conditions.push(`type = $${idx++}`);
      params.push(query.type);
    }
    if (query.scope) {
      conditions.push(`scope = $${idx++}`);
      params.push(query.scope);
    }
    if (query.key) {
      conditions.push(`key = $${idx++}`);
      params.push(query.key);
    }
    if (query.importance) {
      conditions.push(`importance = $${idx++}`);
      params.push(query.importance);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `SELECT * FROM memory_entries ${where} ORDER BY updated_at DESC LIMIT $${idx++}`;
    params.push(query.limit ?? 50);

    const result = await this.pool.query(sql, params);
    return result.rows.map(this.rowToEntry);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query("DELETE FROM memory_entries WHERE id = $1", [id]);
  }

  private rowToEntry(row: Record<string, unknown>): MemoryEntry {
    return {
      id: row.id as string,
      type: row.type as string,
      key: row.key as string,
      value: row.value as string,
      importance: row.importance as MemoryEntry["importance"],
      scope: (row.scope as string | null) ?? undefined,
      source: (row.source as string | null) ?? undefined,
      ttl: (row.ttl as number | null) ?? undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      tokensEstimate: (row.tokens_estimate as number | null) ?? undefined,
    };
  }
}
