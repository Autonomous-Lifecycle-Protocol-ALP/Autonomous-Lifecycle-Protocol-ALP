/**
 * ALP Collaboration — audit log for compliance and rollback.
 */

import { AuditEvent } from './types';

export class AuditLog {
  auditLog: AuditEvent[] = [];
  private auditCounter = 0;

  /**
   * Append an audit event for compliance and rollback.
   */
  appendAudit(actorId: string, action: string, target: string, details: Record<string, any>): AuditEvent {
    const event: AuditEvent = {
      id: `audit-${++this.auditCounter}`,
      timestamp: Date.now(),
      actorId,
      action,
      target,
      details,
    };
    this.auditLog.push(event);
    return event;
  }

  /**
   * Query audit log events, optionally filtered by actor, action, target, and time range.
   */
  queryAuditLog(options: {
    actorId?: string;
    action?: string;
    target?: string;
    from?: number;
    to?: number;
    limit?: number;
  } = {}): AuditEvent[] {
    let results = this.auditLog;
    if (options.actorId) results = results.filter(e => e.actorId === options.actorId);
    if (options.action) results = results.filter(e => e.action === options.action);
    if (options.target) results = results.filter(e => e.target === options.target);
    if (options.from) results = results.filter(e => e.timestamp >= options.from!);
    if (options.to) results = results.filter(e => e.timestamp <= options.to!);
    const limit = options.limit ?? results.length;
    return results.slice(-limit);
  }

  /**
   * Export audit log as JSON string for compliance.
   */
  exportAuditLog(): string {
    return JSON.stringify(this.auditLog, null, 2);
  }

  getAuditCounter(): number {
    return this.auditCounter;
  }

  setAuditCounter(n: number): void {
    this.auditCounter = n;
  }

  serializeAuditLog(): AuditEvent[] {
    return this.auditLog;
  }

  restoreAuditLog(log: AuditEvent[]): void {
    this.auditLog = log || [];
  }
}
