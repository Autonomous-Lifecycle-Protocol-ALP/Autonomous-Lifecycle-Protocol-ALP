/**
 * ALP Collaboration — live share sessions for synchronous co-authoring.
 */

import { LiveShareSession } from './types';
import { ActivityFeed } from './activity';
import { AuditLog } from './audit';

export class LiveShareManager {
  liveShares = new Map<string, LiveShareSession>();
  private shareCounter = 0;

  constructor(
    private activity: ActivityFeed,
    private audit: AuditLog,
  ) {}

  /**
   * Start a live share session for synchronous co-authoring.
   */
  startLiveShare(docId: string, hostId: string): LiveShareSession {
    const sessionId = `share-${++this.shareCounter}`;
    const session: LiveShareSession = {
      sessionId,
      docId,
      hostId,
      guests: [],
      startedAt: Date.now(),
      status: 'active',
    };
    this.liveShares.set(sessionId, session);
    this.activity.logActivity(docId, 'team_edit', hostId, { action: 'start_live_share', sessionId });
    this.audit.appendAudit(hostId, 'collab:start_live_share', docId, { sessionId });
    return session;
  }

  /**
   * Join a live share session as a guest.
   */
  joinLiveShare(sessionId: string, guestId: string): boolean {
    const session = this.liveShares.get(sessionId);
    if (!session || session.status !== 'active') return false;
    if (session.hostId === guestId) return true;
    if (!session.guests.includes(guestId)) {
      session.guests.push(guestId);
    }
    this.activity.logActivity(session.docId, 'team_edit', guestId, { action: 'join_live_share', sessionId });
    return true;
  }

  /**
   * End a live share session.
   */
  endLiveShare(sessionId: string, endedBy: string): boolean {
    const session = this.liveShares.get(sessionId);
    if (!session || session.status !== 'active') return false;
    session.status = 'ended';
    session.endedAt = Date.now();
    this.activity.logActivity(session.docId, 'team_edit', endedBy, { action: 'end_live_share', sessionId });
    this.audit.appendAudit(endedBy, 'collab:end_live_share', session.docId, { sessionId });
    return true;
  }

  /**
   * Get active live share sessions for a document.
   */
  getLiveShares(docId: string): LiveShareSession[] {
    return Array.from(this.liveShares.values()).filter(s => s.docId === docId && s.status === 'active');
  }

  getShareCounter(): number {
    return this.shareCounter;
  }

  setShareCounter(n: number): void {
    this.shareCounter = n;
  }

  serializeLiveShares(): any[] {
    return Array.from(this.liveShares.entries()).map(([sessionId, share]) => ({ ...share, sessionId }));
  }

  restoreLiveShares(entries: any[]): void {
    this.liveShares = new Map((entries || []).map((s: any) => [s.sessionId, s]));
  }
}
