import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorId: string;
  action: string;
  scope: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  outcome: "success" | "failure" | "denied";
  metadata?: Record<string, unknown>;
}

export interface AuditLogEntry extends AuditEvent {
  sequence: number;
  hash: string;
  previousHash: string;
}

export interface AuditQuery {
  actorId?: string;
  action?: string;
  scope?: string;
  outcome?: AuditEvent["outcome"];
  resourceId?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
}

export interface AuditLogConfig {
  retentionDays?: number;
  hashAlgorithm?: "sha256";
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export class AuditLogger {
  private entries: AuditLogEntry[] = [];
  private sequence = 0;
  private previousHash = "";
  private readonly retentionDays: number;

  constructor(config: AuditLogConfig = {}) {
    this.retentionDays = config.retentionDays ?? 30;
  }

  log(event: Omit<AuditEvent, "id" | "timestamp">): AuditLogEntry {
    const now = new Date().toISOString();
    const entry: AuditEvent = {
      id: uuidv4(),
      timestamp: now,
      ...event,
    };

    this.sequence += 1;
    const entryString = JSON.stringify({
      sequence: this.sequence,
      timestamp: entry.timestamp,
      actorId: event.actorId,
      action: event.action,
      scope: event.scope,
      resourceId: event.resourceId ?? null,
      outcome: event.outcome,
      previousHash: this.previousHash,
    });

    const hash = sha256(entryString);
    const logEntry: AuditLogEntry = {
      ...entry,
      sequence: this.sequence,
      hash,
      previousHash: this.previousHash,
    };

    this.entries.push(logEntry);
    this.previousHash = hash;
    this.prune();

    return logEntry;
  }

  verify(): boolean {
    let prevHash = "";
    for (const entry of this.entries) {
      if (entry.previousHash !== prevHash) return false;
      const entryString = JSON.stringify({
        sequence: entry.sequence,
        timestamp: entry.timestamp,
        actorId: entry.actorId,
        action: entry.action,
        scope: entry.scope,
        resourceId: entry.resourceId ?? null,
        outcome: entry.outcome,
        previousHash: prevHash,
      });
      const expectedHash = sha256(entryString);
      if (entry.hash !== expectedHash) return false;
      prevHash = entry.hash;
    }
    return true;
  }

  query(query: AuditQuery = {}): AuditLogEntry[] {
    let results = Array.from(this.entries);

    if (query.actorId) results = results.filter((e) => e.actorId === query.actorId);
    if (query.action) results = results.filter((e) => e.action === query.action);
    if (query.scope) results = results.filter((e) => e.scope === query.scope);
    if (query.outcome) results = results.filter((e) => e.outcome === query.outcome);
    if (query.resourceId) results = results.filter((e) => e.resourceId === query.resourceId);
    if (query.startTime) results = results.filter((e) => e.timestamp >= query.startTime!);
    if (query.endTime) results = results.filter((e) => e.timestamp <= query.endTime!);

    results.sort((a, b) => b.sequence - a.sequence);

    return query.limit ? results.slice(0, query.limit) : results;
  }

  count(): number {
    return this.entries.length;
  }

  last(): AuditLogEntry | undefined {
    return this.entries[this.entries.length - 1];
  }

  private prune(): void {
    const cutoff = Date.now() - this.retentionDays * 24 * 60 * 60 * 1000;
    this.entries = this.entries.filter((e) => new Date(e.timestamp).getTime() > cutoff);
  }
}
